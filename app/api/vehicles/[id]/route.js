import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Vehicle from '@/lib/models/Vehicle';
import AuditLog from '@/lib/models/AuditLog';
import { requireAdmin } from '@/lib/auth';
import { logError } from '@/lib/logger';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// PUT /api/vehicles/[id] — admin only
export async function PUT(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.error) return NextResponse.json(auth.error, { status: auth.status });

  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ msg: 'Invalid vehicle ID' }, { status: 400 });
  }

  const { name, description, capacity } = await request.json();

  if (!name || typeof capacity !== 'number' || !Number.isInteger(capacity) || capacity < 1) {
    return NextResponse.json({ msg: 'Name is required and capacity must be a positive integer' }, { status: 400 });
  }

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
    await new AuditLog({
      action: 'vehicle_updated',
      performedBy: auth.user.id,
      vehicle: id,
      vehicleName: name,
      details: `Updated vehicle ${name} (capacity: ${capacity})`
    }).save();
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
  if (!isValidId(id)) {
    return NextResponse.json({ msg: 'Invalid vehicle ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    let vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return NextResponse.json({ msg: 'Vehicle not found' }, { status: 404 });
    }
    await Vehicle.deleteOne({ _id: id });
    await new AuditLog({
      action: 'vehicle_deleted',
      performedBy: auth.user.id,
      vehicleName: vehicle.name,
      details: `Deleted vehicle ${vehicle.name}`
    }).save();
    return NextResponse.json({ msg: 'Vehicle removed' });
  } catch (err) {
    logError('DELETE /api/vehicles/[id]', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
