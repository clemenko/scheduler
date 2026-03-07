import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sendEmail from '@/lib/email';
import { logError } from '@/lib/logger';

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.error, { status: auth.status });

  const { email } = await request.json();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ msg: 'A valid email address is required' }, { status: 400 });
  }

  try {
    await sendEmail({
      email,
      subject: 'WAVFD Scheduler — Test Email',
      message: 'This is a test email from the WAVFD Scheduler. If you received this, email is configured correctly!'
    });
    return NextResponse.json({ msg: 'Test email sent successfully' });
  } catch (err) {
    logError('POST /api/settings/test-email', err);
    return NextResponse.json({ msg: 'Failed to send test email. Check SMTP configuration.' }, { status: 500 });
  }
}
