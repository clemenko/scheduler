import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import { requireAdmin } from '@/lib/auth';
import { logError } from '@/lib/logger';

export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.error, { status: auth.status });

  try {
    await dbConnect();
    const users = await User.find().select('-password');
    return NextResponse.json(users);
  } catch (err) {
    logError('GET /api/users', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
