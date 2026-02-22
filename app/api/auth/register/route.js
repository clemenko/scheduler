import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Setting from '@/lib/models/Setting';
import rateLimit from '@/lib/rateLimit';

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

export async function POST(request) {
  const limited = limiter(request);
  if (limited) return NextResponse.json(limited.error, { status: limited.status });

  const { name, email, password } = await request.json();

  if (!name || !name.trim()) {
    return NextResponse.json({ msg: 'Name is required' }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ msg: 'A valid email is required' }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ msg: 'Password must be at least 8 characters' }, { status: 400 });
  }

  try {
    await dbConnect();

    const settings = await Setting.findOne();
    if (settings && settings.allowRegistration === false) {
      return NextResponse.json({ msg: 'Registration is currently disabled' }, { status: 403 });
    }

    let user = await User.findOne({ email });
    if (user) {
      return NextResponse.json({ msg: 'User already exists' }, { status: 400 });
    }

    user = new User({ name, email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

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
