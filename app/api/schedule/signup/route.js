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

  const { shiftId, vehicleId } = await request.json();
  if (!isValidId(shiftId) || !isValidId(vehicleId)) {
    return NextResponse.json({ msg: 'Invalid shift or vehicle ID' }, { status: 400 });
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

    const existingSignup = await Schedule.findOne({ shift: shiftId, user: auth.user.id });
    if (existingSignup) {
      return NextResponse.json({ msg: 'User already signed up for this shift' }, { status: 400 });
    }

    const newSignup = new Schedule({
      shift: shiftId,
      user: auth.user.id,
      vehicle: vehicleId
    });

    const signup = await newSignup.save();

    const actingUser = await User.findById(auth.user.id);
    await new AuditLog({
      action: 'signup',
      performedBy: auth.user.id,
      targetUser: auth.user.id,
      shift: shiftId,
      vehicle: vehicleId,
      userName: actingUser?.name,
      shiftTitle: shift.title,
      shiftStart: shift.start_time,
      vehicleName: vehicle.name
    }).save();

    // Fire-and-forget confirmation email with ICS attachment
    if (actingUser?.email) {
      const startDate = new Date(shift.start_time);
      const endDate = new Date(shift.end_time);
      const icsContent = generateICS({
        title: shift.title,
        start: shift.start_time,
        end: shift.end_time,
        description: `Shift: ${shift.title}\nVehicle: ${vehicle.name}`,
        location: vehicle.name
      });

      const formatOpts = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
      const startStr = startDate.toLocaleString('en-US', formatOpts);
      const endStr = endDate.toLocaleString('en-US', formatOpts);

      sendEmail({
        email: actingUser.email,
        subject: `Shift Confirmation: ${shift.title}`,
        message: `You have signed up for the following shift:\n\nShift: ${shift.title}\nVehicle: ${vehicle.name}\nStart: ${startStr}\nEnd: ${endStr}\n\nA calendar event is attached.`,
        attachments: [
          {
            filename: 'shift.ics',
            content: icsContent,
            contentType: 'text/calendar'
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
