import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Vehicle from '@/lib/models/Vehicle';
import { requireAdmin } from '@/lib/auth';
import { logError } from '@/lib/logger';

// PUT /api/vehicles/[id] — admin only
export async function PUT(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.error, { status: auth.status });

  const { id } = await params;
  const { name, description, capacity } = await request.json();

  try {
    await dbConnect();
    let vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return NextResponse.json({ msg: 'Vehicle not found' }, { status: 404 });
    }
    vehicle.name = name;
    vehicle.description = description;
    vehicle.capacity = capacity;
    await vehicle.save();
    return NextResponse.json(vehicle);
  } catch (err) {
    logError('PUT /api/vehicles/[id]', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/vehicles/[id] — admin only
export async function DELETE(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.error, { status: auth.status });

  const { id } = await params;

  try {
    await dbConnect();
    let vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return NextResponse.json({ msg: 'Vehicle not found' }, { status: 404 });
    }
    await Vehicle.deleteOne({ _id: id });
    return NextResponse.json({ msg: 'Vehicle removed' });
  } catch (err) {
    logError('DELETE /api/vehicles/[id]', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
