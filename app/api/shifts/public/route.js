import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Shift from '@/lib/models/Shift';
import { logError } from '@/lib/logger';

export async function GET() {
  try {
    await dbConnect();
    const shifts = await Shift.find({}, 'title start_time end_time').lean();
    return NextResponse.json(shifts);
  } catch (err) {
    logError('GET /api/shifts/public', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
