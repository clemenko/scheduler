import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Shift from '@/lib/models/Shift';
import Schedule from '@/lib/models/Schedule';
import User from '@/lib/models/User';
import Vehicle from '@/lib/models/Vehicle';
import { requireAdmin } from '@/lib/auth';
import { logError } from '@/lib/logger';

function getMonthRange(year, month) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.error, { status: auth.status });

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year'));
    const month = parseInt(searchParams.get('month'));
    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json({ msg: 'Valid year and month (1-12) are required' }, { status: 400 });
    }

    const { start, end } = getMonthRange(year, month);

    const shifts = await Shift.find({
      start_time: { $gte: start, $lt: end }
    }).lean();

    const shiftIds = shifts.map(s => s._id);

    const signups = await Schedule.find({ shift: { $in: shiftIds } })
      .populate('user', 'name')
      .populate('vehicle', 'name')
      .populate('shift', 'title start_time end_time')
      .lean();

    const header = 'Shift Title,Shift Start,Shift End,User,Vehicle';
    const rows = signups.map(s => {
      const title = (s.shift?.title || '').replace(/,/g, ' ');
      const shiftStart = s.shift?.start_time ? new Date(s.shift.start_time).toISOString() : '';
      const shiftEnd = s.shift?.end_time ? new Date(s.shift.end_time).toISOString() : '';
      const user = (s.user?.name || '').replace(/,/g, ' ');
      const vehicle = (s.vehicle?.name || '').replace(/,/g, ' ');
      return `${title},${shiftStart},${shiftEnd},${user},${vehicle}`;
    });

    const csv = [header, ...rows].join('\n');
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="monthly-report-${year}-${String(month).padStart(2, '0')}.csv"`
      }
    });
  } catch (err) {
    logError('GET /api/reports/monthly/export', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
