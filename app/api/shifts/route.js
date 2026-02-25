import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { RRule } from 'rrule';
import dbConnect from '@/lib/dbConnect';
import Shift from '@/lib/models/Shift';
import Schedule from '@/lib/models/Schedule';
import Vehicle from '@/lib/models/Vehicle';
import User from '@/lib/models/User';
import { requireAuth } from '@/lib/auth';
import validateShiftDates from '@/lib/validateShift';
import sendEmail from '@/lib/email';
import { logError } from '@/lib/logger';

async function notifyNewShift(title, start_time, end_time, vehicleId) {
  try {
    const users = await User.find({ role: { $ne: 'viewer' } }, 'email name').lean();
    let vehicleName = '';
    if (vehicleId) {
      const v = await Vehicle.findById(vehicleId, 'name').lean();
      if (v) vehicleName = v.name;
    }
    const fmtOpts = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' };
    const startStr = new Date(start_time).toLocaleString('en-US', fmtOpts) + ' ET';
    const endStr = new Date(end_time).toLocaleString('en-US', fmtOpts) + ' ET';
    const vehicleInfo = vehicleName ? `\nVehicle: ${vehicleName}` : '';
    for (const u of users) {
      if (!u.email) continue;
      sendEmail({
        email: u.email,
        subject: `New Shift: ${title}`,
        message: `A new shift has been created.\n\nTitle: ${title}\nStart: ${startStr}\nEnd: ${endStr}${vehicleInfo}`
      }).catch(err => console.error('Email error:', err));
    }
  } catch (err) {
    console.error('Error sending new shift emails:', err);
  }
}

// GET /api/shifts — authenticated, full details
export async function GET(request) {
  const auth = requireAuth(request);
  if (auth.error) return NextResponse.json(auth.error, { status: auth.status });

  try {
    await dbConnect();

    const shifts = await Shift.find().populate('creator', 'name').populate('vehicle', 'name').lean();
    const shiftIds = shifts.map(s => s._id);
    const allSignups = await Schedule.find({ shift: { $in: shiftIds } })
      .populate('user', 'name _id')
      .populate('vehicle', 'name')
      .lean();

    const signupsByShift = {};
    for (const signup of allSignups) {
      const key = signup.shift.toString();
      if (!signupsByShift[key]) signupsByShift[key] = [];
      signupsByShift[key].push(signup);
    }

    for (const shift of shifts) {
      if (shift.isRecurring && !shift.recurrenceRule) {
        shift.recurrenceRule = {
          frequency: shift.recurringType || 'daily',
          endType: 'on_date',
          endDate: shift.recurringEndDate || new Date()
        };
      }
      shift.signups = signupsByShift[shift._id.toString()] || [];
    }

    return NextResponse.json(shifts);
  } catch (err) {
    logError('GET /api/shifts', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}

// POST /api/shifts — create shift
export async function POST(request) {
  const auth = requireAuth(request);
  if (auth.error) return NextResponse.json(auth.error, { status: auth.status });

  if (auth.user.role === 'viewer') {
    return NextResponse.json({ msg: 'Viewers cannot create shifts' }, { status: 403 });
  }

  const { title, start_time, end_time, isRecurring, recurrenceRule, exclusions = [], vehicle } = await request.json();

  try {
    await dbConnect();

    if (isRecurring) {
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
        const parentId = result[0]._id;
        await Shift.updateMany({ _id: { $in: result.map(s => s._id) } }, { parentShift: parentId });
        notifyNewShift(title, start_time, end_time, vehicle);
        return NextResponse.json(result);
      } else {
        return NextResponse.json([]);
      }
    } else {
      const validationError = validateShiftDates(start_time, end_time);
      if (validationError) {
        return NextResponse.json({ msg: validationError }, { status: 400 });
      }

      const newShift = new Shift({
        title,
        start_time,
        end_time,
        creator: auth.user.id,
        ...(vehicle ? { vehicle } : {})
      });
      const shift = await newShift.save();
      notifyNewShift(title, start_time, end_time, vehicle);
      return NextResponse.json(shift);
    }
  } catch (err) {
    logError('POST /api/shifts', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
