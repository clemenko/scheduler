import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Shift from '@/lib/models/Shift';
import Schedule from '@/lib/models/Schedule';
import Vehicle from '@/lib/models/Vehicle';
import User from '@/lib/models/User';
import { requireAuth } from '@/lib/auth';
import validateShiftDates from '@/lib/validateShift';
import sendEmail from '@/lib/email';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

async function notifyDeletedShift(shiftIds) {
  try {
    const signups = await Schedule.find({ shift: { $in: shiftIds } })
      .populate('user', 'email name')
      .populate('vehicle', 'name')
      .lean();
    if (signups.length === 0) return;
    const shifts = await Shift.find({ _id: { $in: shiftIds } }, 'title start_time end_time').lean();
    const shiftMap = {};
    for (const s of shifts) shiftMap[s._id.toString()] = s;
    for (const signup of signups) {
      if (!signup.user?.email) continue;
      const shift = shiftMap[signup.shift.toString()];
      if (!shift) continue;
      const startStr = new Date(shift.start_time).toLocaleString();
      sendEmail({
        email: signup.user.email,
        subject: `Shift Cancelled: ${shift.title}`,
        message: `A shift you were signed up for has been cancelled.\n\nTitle: ${shift.title}\nStart: ${startStr}\n\nPlease check the schedule for updates.`
      }).catch(err => console.error('Email error:', err));
    }
  } catch (err) {
    console.error('Error sending shift deletion emails:', err);
  }
}

// PUT /api/shifts/[id] — update single shift
export async function PUT(request, { params }) {
  const auth = requireAuth(request);
  if (auth.error) return NextResponse.json(auth.error, { status: auth.status });

  if (auth.user.role === 'viewer') {
    return NextResponse.json({ msg: 'Viewers cannot edit shifts' }, { status: 403 });
  }

  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ msg: 'Invalid shift ID' }, { status: 400 });
  }

  try {
    await dbConnect();

    const { title, start_time, end_time, vehicle } = await request.json();
    let shift = await Shift.findById(id);

    if (!shift) {
      return NextResponse.json({ msg: 'Shift not found' }, { status: 404 });
    }
    if (auth.user.role !== 'admin' && shift.creator.toString() !== auth.user.id) {
      return NextResponse.json({ msg: 'You can only edit your own shifts' }, { status: 403 });
    }
    if (shift.isRecurring) {
      return NextResponse.json({ msg: 'This is a recurring shift. Please update the entire series.' }, { status: 400 });
    }

    const validationError = validateShiftDates(start_time, end_time);
    if (validationError) {
      return NextResponse.json({ msg: validationError }, { status: 400 });
    }

    shift.title = title;
    shift.start_time = start_time;
    shift.end_time = end_time;
    shift.vehicle = vehicle || null;
    await shift.save();

    return NextResponse.json(shift);
  } catch (err) {
    console.error(err.message);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/shifts/[id] — delete single shift
export async function DELETE(request, { params }) {
  const auth = requireAuth(request);
  if (auth.error) return NextResponse.json(auth.error, { status: auth.status });

  if (auth.user.role === 'viewer') {
    return NextResponse.json({ msg: 'Viewers cannot delete shifts' }, { status: 403 });
  }

  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ msg: 'Invalid shift ID' }, { status: 400 });
  }

  try {
    await dbConnect();

    let shift = await Shift.findById(id);
    if (!shift) {
      return NextResponse.json({ msg: 'Shift not found' }, { status: 404 });
    }

    if (auth.user.role !== 'admin' && shift.creator.toString() !== auth.user.id) {
      return NextResponse.json({ msg: 'You can only delete your own shifts' }, { status: 403 });
    }

    if (shift.isRecurring) {
      return NextResponse.json({ msg: 'This is a recurring shift. Please delete the entire series.' }, { status: 400 });
    }

    await notifyDeletedShift([shift._id]);
    await Shift.deleteOne({ _id: id });

    return NextResponse.json({ msg: 'Shift removed' });
  } catch (err) {
    console.error(err.message);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
