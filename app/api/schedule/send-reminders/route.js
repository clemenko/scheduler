import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Shift from '@/lib/models/Shift';
import Schedule from '@/lib/models/Schedule';
import User from '@/lib/models/User';
import { requireAdmin } from '@/lib/auth';
import sendEmail from '@/lib/email';
import { logError } from '@/lib/logger';

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.error, { status: auth.status });

  try {
    await dbConnect();

    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingShifts = await Shift.find({ start_time: { $gte: now, $lte: twentyFourHoursFromNow } });
    const shiftIds = upcomingShifts.map(s => s._id);
    const schedules = await Schedule.find({ shift: { $in: shiftIds }, reminderSent: { $ne: true } }).populate('shift user');

    for (const schedule of schedules) {
      const emailOptions = {
        email: schedule.user.email,
        subject: 'Shift Reminder',
        message: `This is a reminder that you are signed up for the shift: ${schedule.shift.title}. It starts at ${new Date(schedule.shift.start_time).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })} ET.`
      };
      await sendEmail(emailOptions);
      schedule.reminderSent = true;
      await schedule.save();
    }

    return NextResponse.json({ msg: 'Reminders sent' });
  } catch (err) {
    logError('POST /api/schedule/send-reminders', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
