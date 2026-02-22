import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import { requireAdmin } from '@/lib/auth';
import { logError } from '@/lib/logger';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export async function PUT(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.error, { status: auth.status });

  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ msg: 'Invalid user ID' }, { status: 400 });
  }

  const { role } = await request.json();

  if (!['admin', 'regular', 'viewer'].includes(role)) {
    return NextResponse.json({ msg: 'Invalid role' }, { status: 400 });
  }

  try {
    await dbConnect();

    let user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ msg: 'User not found' }, { status: 404 });
    }

    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return NextResponse.json({ msg: 'Cannot remove the last admin' }, { status: 400 });
      }
    }

    user.role = role;
    await user.save();

    const userToReturn = user.toObject();
    delete userToReturn.password;

    return NextResponse.json(userToReturn);
  } catch (err) {
    logError('PUT /api/users/[id]/role', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
