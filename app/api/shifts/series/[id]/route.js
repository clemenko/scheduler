import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { RRule } from 'rrule';
import dbConnect from '@/lib/dbConnect';
import Shift from '@/lib/models/Shift';
import Schedule from '@/lib/models/Schedule';
import User from '@/lib/models/User';
import Vehicle from '@/lib/models/Vehicle';
import { requireAuth } from '@/lib/auth';
import sendEmail from '@/lib/email';
import { logError } from '@/lib/logger';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

async function notifyDeletedShift(shiftIds) {
  try {
    const signups = await Schedule.find({ shift: { $in: shiftIds } })
      .populate('user', 'email name')
      .populate('vehicle', 'name')
      .lean();
    if (signups.length === 0) return;
    const shifts = await Shift.find({ _id: { $in: shiftIds } }, 'title start_time end_time').lean();
    const shiftMap = {};
    for (const s of shifts) shiftMap[s._id.toString()] = s;
    for (const signup of signups) {
      if (!signup.user?.email) continue;
      const shift = shiftMap[signup.shift.toString()];
      if (!shift) continue;
      const startStr = new Date(shift.start_time).toLocaleString();
      sendEmail({
        email: signup.user.email,
        subject: `Shift Cancelled: ${shift.title}`,
        message: `A shift you were signed up for has been cancelled.\n\nTitle: ${shift.title}\nStart: ${startStr}\n\nPlease check the schedule for updates.`
      }).catch(err => console.error('Email error:', err));
    }
  } catch (err) {
    console.error('Error sending shift deletion emails:', err);
  }
}

// PUT /api/shifts/series/[id] — update recurring series
export async function PUT(request, { params }) {
  const auth = requireAuth(request);
  if (auth.error) return NextResponse.json(auth.error, { status: auth.status });

  if (auth.user.role === 'viewer') {
    return NextResponse.json({ msg: 'Viewers cannot edit shifts' }, { status: 403 });
  }

  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ msg: 'Invalid shift ID' }, { status: 400 });
  }

  const { title, start_time, end_time, recurrenceRule, exclusions = [], vehicle } = await request.json();

  try {
    await dbConnect();

    let parentShift = await Shift.findById(id);
    if (!parentShift) {
      return NextResponse.json({ msg: 'Shift series not found' }, { status: 404 });
    }
    if (auth.user.role !== 'admin' && parentShift.creator.toString() !== auth.user.id) {
      return NextResponse.json({ msg: 'You can only edit your own shifts' }, { status: 403 });
    }

    await Shift.deleteMany({ $or: [{ _id: parentShift._id }, { parentShift: parentShift._id }] });

    const { frequency, daysOfWeek, dayOfMonth, endType, endDate, occurrences } = recurrenceRule;
    const rruleOptions = {
      freq: RRule[frequency.toUpperCase()],
      dtstart: new Date(start_time),
    };
    if (daysOfWeek && Array.isArray(daysOfWeek) && daysOfWeek.length > 0) {
      rruleOptions.byweekday = daysOfWeek.map(day => RRule[day.toUpperCase()]);
    }
    if (frequency === 'monthly' && dayOfMonth) {
      rruleOptions.bymonthday = dayOfMonth;
    }
    if (endType === 'on_date' && endDate) {
      rruleOptions.until = new Date(endDate);
    } else if (endType === 'after_occurrences' && occurrences) {
      rruleOptions.count = occurrences;
    } else {
      rruleOptions.count = 365;
    }

    const rule = new RRule(rruleOptions);
    const shiftDuration = new Date(end_time).getTime() - new Date(start_time).getTime();
    const exclusionTimes = new Set(exclusions.map(ex => new Date(ex).getTime()));

    const createdShifts = rule.all().filter(date => {
      return !exclusionTimes.has(date.getTime());
    }).map(date => {
      const currentEndDate = new Date(date.getTime() + shiftDuration);
      return {
        title,
        start_time: date,
        end_time: currentEndDate,
        creator: auth.user.id,
        isRecurring: true,
        recurrenceRule,
        exclusions,
        ...(vehicle ? { vehicle } : {})
      };
    });

    if (createdShifts.length > 0) {
      const result = await Shift.insertMany(createdShifts);
      const newParentId = result[0]._id;
      await Shift.updateMany({ _id: { $in: result.map(s => s._id) } }, { parentShift: newParentId });
      const newShifts = await Shift.find({ _id: { $in: result.map(s => s._id) } }).lean();
      return NextResponse.json(newShifts);
    } else {
      return NextResponse.json([]);
    }
  } catch (err) {
    logError('PUT /api/shifts/series/[id]', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/shifts/series/[id] — delete recurring series
export async function DELETE(request, { params }) {
  const auth = requireAuth(request);
  if (auth.error) return NextResponse.json(auth.error, { status: auth.status });

  if (auth.user.role === 'viewer') {
    return NextResponse.json({ msg: 'Viewers cannot delete shifts' }, { status: 403 });
  }

  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ msg: 'Invalid shift ID' }, { status: 400 });
  }

  try {
    await dbConnect();

    let shift = await Shift.findById(id);
    if (!shift) {
      return NextResponse.json({ msg: 'Shift series not found' }, { status: 404 });
    }

    if (auth.user.role !== 'admin' && shift.creator.toString() !== auth.user.id) {
      return NextResponse.json({ msg: 'You can only delete your own shifts' }, { status: 403 });
    }

    const parentId = shift.parentShift || shift._id;
    let parentShift = await Shift.findById(parentId);

    const seriesFilter = parentShift
      ? { $or: [{ _id: parentId }, { parentShift: parentId }] }
      : { $or: [{ _id: id }, { parentShift: parentId }] };
    const seriesShifts = await Shift.find(seriesFilter, '_id').lean();
    await notifyDeletedShift(seriesShifts.map(s => s._id));

    if (parentShift) {
      await Shift.deleteMany({ $or: [{ _id: parentId }, { parentShift: parentId }] });
    } else {
      await Shift.deleteMany({ $or: [{ _id: id }, { parentShift: parentId }] });
    }

    return NextResponse.json({ msg: 'Shift series removed' });
  } catch (err) {
    logError('DELETE /api/shifts/series/[id]', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
