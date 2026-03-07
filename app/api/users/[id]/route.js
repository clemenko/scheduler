import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Schedule from '@/lib/models/Schedule';
import AuditLog from '@/lib/models/AuditLog';
import { requireAdmin } from '@/lib/auth';
import { logError } from '@/lib/logger';

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

    await Schedule.deleteMany({ user: id });
    await User.deleteOne({ _id: id });
    await new AuditLog({
      action: 'user_deleted',
      performedBy: auth.user.id,
      targetUser: id,
      userName: user.name,
      details: `Deleted user ${user.name} (${user.email})`
    }).save();
    return NextResponse.json({ msg: 'User deleted' });
  } catch (err) {
    logError('DELETE /api/users/[id]', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
