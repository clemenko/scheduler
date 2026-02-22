import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Schedule from '@/lib/models/Schedule';
import Shift from '@/lib/models/Shift';
import Vehicle from '@/lib/models/Vehicle';
import User from '@/lib/models/User';
import AuditLog from '@/lib/models/AuditLog';
import { requireAuth } from '@/lib/auth';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export async function DELETE(request, { params }) {
  const auth = requireAuth(request);
  if (auth.error) return NextResponse.json(auth.error, { status: auth.status });

  const { signupId } = await params;
  if (!isValidId(signupId)) {
    return NextResponse.json({ msg: 'Invalid signup ID' }, { status: 400 });
  }

  try {
    await dbConnect();

    const signup = await Schedule.findById(signupId)
      .populate('user', 'name')
      .populate('shift', 'title start_time')
      .populate('vehicle', 'name');
    if (!signup) {
      return NextResponse.json({ msg: 'Signup not found' }, { status: 404 });
    }

    if (signup.user._id.toString() !== auth.user.id && auth.user.role !== 'admin') {
      return NextResponse.json({ msg: 'Not authorized' }, { status: 401 });
    }

    await Schedule.deleteOne({ _id: signupId });

    await new AuditLog({
      action: 'cancel',
      performedBy: auth.user.id,
      targetUser: signup.user?._id,
      shift: signup.shift?._id,
      vehicle: signup.vehicle?._id,
      userName: signup.user?.name,
      shiftTitle: signup.shift?.title,
      shiftStart: signup.shift?.start_time,
      vehicleName: signup.vehicle?.name
    }).save();

    return NextResponse.json({ msg: 'Signup canceled' });
  } catch (err) {
    console.error(err.message);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
