import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import { requireAdmin } from '@/lib/auth';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export async function PUT(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.error, { status: auth.status });

  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ msg: 'Invalid user ID' }, { status: 400 });
  }

  const { password } = await request.json();
  if (!password || password.length < 8) {
    return NextResponse.json({ msg: 'Password must be at least 8 characters' }, { status: 400 });
  }

  try {
    await dbConnect();

    let user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ msg: 'User not found' }, { status: 404 });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    return NextResponse.json({ msg: 'Password reset successfully' });
  } catch (err) {
    console.error(err.message);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
