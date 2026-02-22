import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Shift from '@/lib/models/Shift';

export async function GET() {
  try {
    await dbConnect();
    const shifts = await Shift.find({}, 'title start_time end_time').lean();
    return NextResponse.json(shifts);
  } catch (err) {
    console.error(err.message);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
