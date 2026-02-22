'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, TextField } from '@mui/material';
import axios from 'axios';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95%', sm: 400 },
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const VehicleFormModal = ({ open, handleClose, currentVehicle, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');

  useEffect(() => {
    if (currentVehicle) {
      setName(currentVehicle.name);
      setDescription(currentVehicle.description);
      setCapacity(currentVehicle.capacity);
    } else {
      setName('');
      setDescription('');
      setCapacity('');
    }
  }, [currentVehicle]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const vehicleData = { name, description, capacity: parseInt(capacity) };

    try {
      if (currentVehicle) {
        await axios.put(`/api/vehicles/${currentVehicle._id}`, vehicleData, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      } else {
        await axios.post('/api/vehicles', vehicleData, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      }
      onSave();
      handleClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2">
          {currentVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <TextField
            label="Capacity"
            type="number"
            fullWidth
            margin="normal"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            required
          />
          <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
            {currentVehicle ? 'Update Vehicle' : 'Add Vehicle'}
          </Button>
        </form>
      </Box>
    </Modal>
  );
};

export default VehicleFormModal;
