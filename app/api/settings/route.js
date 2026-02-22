import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Setting from '@/lib/models/Setting';
import { requireAdmin } from '@/lib/auth';
import { logError } from '@/lib/logger';

// GET /api/settings — public
export async function GET() {
  try {
    await dbConnect();
    let settings = await Setting.findOne();
    if (!settings) {
      const defaultTitle = process.env.CALENDAR_TITLE || 'Fire Department Scheduler';
      settings = new Setting({ calendarTitle: defaultTitle });
      await settings.save();
    }
    return NextResponse.json(settings, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  } catch (err) {
    logError('GET /api/settings', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}

// PUT /api/settings — admin only
export async function PUT(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.error, { status: auth.status });

  const { calendarTitle, allowRegistration, headerColor, logoUrl } = await request.json();

  try {
    await dbConnect();
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }
    settings.calendarTitle = calendarTitle;
    if (typeof allowRegistration === 'boolean') {
      settings.allowRegistration = allowRegistration;
    }
    if (headerColor) {
      settings.headerColor = headerColor;
    }
    if (typeof logoUrl === 'string') {
      settings.logoUrl = logoUrl;
    }
    await settings.save();
    return NextResponse.json(settings);
  } catch (err) {
    logError('PUT /api/settings', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
