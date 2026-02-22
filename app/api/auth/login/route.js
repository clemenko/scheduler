import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import rateLimit from '@/lib/rateLimit';

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

export async function POST(request) {
  const limited = limiter(request);
  if (limited) return NextResponse.json(limited.error, { status: limited.status });

  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ msg: 'Email and password are required' }, { status: 400 });
  }

  try {
    await dbConnect();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ msg: 'Invalid credentials' }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ msg: 'Invalid credentials' }, { status: 400 });
    }

    const payload = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 });
    return NextResponse.json({ token });
  } catch (err) {
    console.error(err.message);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
