import dbConnect from '@/lib/dbConnect';
import AuditLog from '@/lib/models/AuditLog';
import User from '@/lib/models/User';
import { requireAdmin } from '@/lib/auth';
import { logError } from '@/lib/logger';
import rateLimit from '@/lib/rateLimit';
import { NextResponse } from 'next/server';

const limiter = rateLimit({ windowMs: 60 * 1000, max: 5 });

export async function GET(request) {
  const limited = limiter(request);
  if (limited) return NextResponse.json(limited.error, { status: limited.status });

  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.error, { status: auth.status });

  try {
    await dbConnect();
    const logs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(10000)
      .populate('performedBy', 'name')
      .populate('targetUser', 'name')
      .lean();

    const header = 'Timestamp,Action,User,Shift,Shift Start,Vehicle,Performed By';
    const rows = logs.map(log => {
      const timestamp = log.timestamp ? new Date(log.timestamp).toISOString() : '';
      const action = log.action || '';
      const user = (log.targetUser?.name || log.userName || '').replace(/,/g, ' ');
      const shift = (log.shiftTitle || '').replace(/,/g, ' ');
      const shiftStart = log.shiftStart ? new Date(log.shiftStart).toISOString() : '';
      const vehicle = (log.vehicleName || '').replace(/,/g, ' ');
      const performedBy = (log.performedBy?.name || '').replace(/,/g, ' ');
      return `${timestamp},${action},${user},${shift},${shiftStart},${vehicle},${performedBy}`;
    });

    const csv = [header, ...rows].join('\n');
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="audit-log.csv"'
      }
    });
  } catch (err) {
    logError('GET /api/auditlog/export', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
