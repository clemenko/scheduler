import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import AuditLog from '@/lib/models/AuditLog';
import User from '@/lib/models/User';
import { requireAdmin } from '@/lib/auth';
import { logError } from '@/lib/logger';

export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.error, { status: auth.status });

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit')) || 50));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find()
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('performedBy', 'name')
        .populate('targetUser', 'name')
        .lean(),
      AuditLog.countDocuments(),
    ]);
    return NextResponse.json({ logs, total, page, limit });
  } catch (err) {
    logError('GET /api/auditlog', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
