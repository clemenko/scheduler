import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import { requireAdmin } from '@/lib/auth';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export async function DELETE(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.error, { status: auth.status });

  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ msg: 'Invalid user ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ msg: 'User not found' }, { status: 404 });
    }

    if (user.role === 'admin') {
      return NextResponse.json({ msg: 'Cannot delete an admin user' }, { status: 400 });
    }

    await User.deleteOne({ _id: id });
    return NextResponse.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
