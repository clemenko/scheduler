const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Get all vehicles
router.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.json(vehicles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create a vehicle
router.post('/', [auth, admin], async (req, res) => {
  const { name, description, capacity } = req.body;
  try {
    const newVehicle = new Vehicle({
      name,
      description,
      capacity
    });
    const vehicle = await newVehicle.save();
    res.json(vehicle);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update a vehicle
router.put('/:id', [auth, admin], async (req, res) => {
  const { name, description, capacity } = req.body;
  try {
    let vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ msg: 'Vehicle not found' });
    }
    vehicle.name = name;
    vehicle.description = description;
    vehicle.capacity = capacity;
    await vehicle.save();
    res.json(vehicle);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete a vehicle
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    let vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ msg: 'Vehicle not found' });
    }
    await Vehicle.deleteOne({ _id: req.params.id });
    res.json({ msg: 'Vehicle removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
