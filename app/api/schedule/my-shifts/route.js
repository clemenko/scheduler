import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Shift from '@/lib/models/Shift';
import Schedule from '@/lib/models/Schedule';
import Vehicle from '@/lib/models/Vehicle';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  const auth = requireAuth(request);
  if (auth.error) return NextResponse.json(auth.error, { status: auth.status });

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'week';
    const now = new Date();
    const end = new Date(now);
    if (range === 'month') {
      end.setDate(end.getDate() + 30);
    } else {
      end.setDate(end.getDate() + 7);
    }

    const upcomingShifts = await Shift.find({
      end_time: { $gte: now },
      start_time: { $lte: end }
    }).select('_id').lean();

    const shiftIds = upcomingShifts.map(s => s._id);

    const mySignups = await Schedule.find({
      user: auth.user.id,
      shift: { $in: shiftIds }
    })
      .populate('shift', 'title start_time end_time')
      .populate('vehicle', 'name')
      .lean();

    mySignups.sort((a, b) => new Date(a.shift?.start_time) - new Date(b.shift?.start_time));

    return NextResponse.json(mySignups);
  } catch (err) {
    console.error(err.message);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
