import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Schedule from '@/lib/models/Schedule';
import Shift from '@/lib/models/Shift';
import Vehicle from '@/lib/models/Vehicle';
import User from '@/lib/models/User';
import AuditLog from '@/lib/models/AuditLog';
import { requireAuth } from '@/lib/auth';
import { logError } from '@/lib/logger';
import sendEmail from '@/lib/email';
import { generateICS } from '@/lib/ics';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export async function POST(request) {
  const auth = requireAuth(request);
  if (auth.error) return NextResponse.json(auth.error, { status: auth.status });

  if (auth.user.role === 'viewer') {
    return NextResponse.json({ msg: 'Viewers cannot sign up for shifts' }, { status: 403 });
  }

  const { shiftId, vehicleId, userId } = await request.json();
  if (!isValidId(shiftId) || !isValidId(vehicleId)) {
    return NextResponse.json({ msg: 'Invalid shift or vehicle ID' }, { status: 400 });
  }

  // Admin can sign up another user; otherwise default to the authenticated user
  let targetUserId = auth.user.id;
  if (userId) {
    if (!isValidId(userId)) {
      return NextResponse.json({ msg: 'Invalid user ID' }, { status: 400 });
    }
    if (auth.user.role !== 'admin') {
      return NextResponse.json({ msg: 'Only admins can sign up other users' }, { status: 403 });
    }
    targetUserId = userId;
  }

  try {
    await dbConnect();

    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return NextResponse.json({ msg: 'Shift not found' }, { status: 404 });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json({ msg: 'Vehicle not found' }, { status: 404 });
    }

    const signups = await Schedule.find({ shift: shiftId, vehicle: vehicleId });
    if (signups.length >= vehicle.capacity) {
      return NextResponse.json({ msg: 'This vehicle is full for this shift' }, { status: 400 });
    }

    const existingSignup = await Schedule.findOne({ shift: shiftId, user: targetUserId });
    if (existingSignup) {
      return NextResponse.json({ msg: 'User already signed up for this shift' }, { status: 400 });
    }

    const newSignup = new Schedule({
      shift: shiftId,
      user: targetUserId,
      vehicle: vehicleId
    });

    const signup = await newSignup.save();

    const targetUser = await User.findById(targetUserId);
    await new AuditLog({
      action: 'signup',
      performedBy: auth.user.id,
      targetUser: targetUserId,
      shift: shiftId,
      vehicle: vehicleId,
      userName: targetUser?.name,
      shiftTitle: shift.title,
      shiftStart: shift.start_time,
      vehicleName: vehicle.name
    }).save();

    // Fire-and-forget confirmation email with ICS attachment
    if (targetUser?.email) {
      const startDate = new Date(shift.start_time);
      const endDate = new Date(shift.end_time);
      const icsContent = generateICS({
        title: shift.title,
        start: shift.start_time,
        end: shift.end_time,
        description: `Shift: ${shift.title}\nVehicle: ${vehicle.name}`,
        location: vehicle.name
      });

      const formatOpts = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' };
      const startStr = startDate.toLocaleString('en-US', formatOpts) + ' ET';
      const endStr = endDate.toLocaleString('en-US', formatOpts) + ' ET';

      sendEmail({
        email: targetUser.email,
        subject: `Shift Confirmation: ${shift.title}`,
        message: `You have signed up for the following shift:\n\nShift: ${shift.title}\nVehicle: ${vehicle.name}\nStart: ${startStr}\nEnd: ${endStr}\n\nA calendar event is attached.`,
        icalContent: icsContent,
        attachments: [
          {
            filename: 'shift.ics',
            content: icsContent,
            contentType: 'text/calendar; method=REQUEST'
          }
        ]
      }).catch(err => logError('Signup confirmation email', err));
    }

    return NextResponse.json(signup);
  } catch (err) {
    logError('POST /api/schedule/signup', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
