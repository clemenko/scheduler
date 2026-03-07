import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Vehicle from '@/lib/models/Vehicle';
import AuditLog from '@/lib/models/AuditLog';
import { requireAdmin } from '@/lib/auth';
import { logError } from '@/lib/logger';

// GET /api/vehicles — public
export async function GET() {
  try {
    await dbConnect();
    const vehicles = await Vehicle.find();
    return NextResponse.json(vehicles, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  } catch (err) {
    logError('GET /api/vehicles', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}

// POST /api/vehicles — admin only
export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.error, { status: auth.status });

  const { name, description, capacity } = await request.json();

  if (!name || typeof capacity !== 'number' || !Number.isInteger(capacity) || capacity < 1) {
    return NextResponse.json({ msg: 'Name is required and capacity must be a positive integer' }, { status: 400 });
  }

  try {
    await dbConnect();
    const newVehicle = new Vehicle({ name, description, capacity });
    const vehicle = await newVehicle.save();
    await new AuditLog({
      action: 'vehicle_created',
      performedBy: auth.user.id,
      vehicle: vehicle._id,
      vehicleName: name,
      details: `Created vehicle ${name} (capacity: ${capacity})`
    }).save();
    return NextResponse.json(vehicle);
  } catch (err) {
    logError('POST /api/vehicles', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
