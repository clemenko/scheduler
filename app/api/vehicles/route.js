import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Vehicle from '@/lib/models/Vehicle';
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

  try {
    await dbConnect();
    const newVehicle = new Vehicle({ name, description, capacity });
    const vehicle = await newVehicle.save();
    return NextResponse.json(vehicle);
  } catch (err) {
    logError('POST /api/vehicles', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
