import React, { useState, useEffect } from 'react';
import { Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import axios from 'axios';
import VehicleFormModal from './VehicleFormModal';

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState(null);

  const fetchVehicles = async () => {
    try {
      const res = await axios.get('/api/vehicles');
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleAddVehicle = () => {
    setCurrentVehicle(null);
    setModalOpen(true);
  };

  const handleEditVehicle = (vehicle) => {
    setCurrentVehicle(vehicle);
    setModalOpen(true);
  };

  const handleDeleteVehicle = async (id) => {
    try {
      await axios.delete(`/api/vehicles/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchVehicles();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSave = () => {
    fetchVehicles();
  };

  return (
    <div>
      <Typography variant="h5" component="h2" gutterBottom>
        Vehicle Management
      </Typography>
      <Button variant="contained" color="primary" onClick={handleAddVehicle}>
        Add Vehicle
      </Button>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle._id}>
                <TableCell>{vehicle.name}</TableCell>
                <TableCell>{vehicle.description}</TableCell>
                <TableCell>{vehicle.capacity}</TableCell>
                <TableCell>
                  <Button onClick={() => handleEditVehicle(vehicle)}>Edit</Button>
                  <Button onClick={() => handleDeleteVehicle(vehicle._id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <VehicleFormModal
        open={modalOpen}
        handleClose={handleCloseModal}
        currentVehicle={currentVehicle}
        onSave={handleSave}
      />
    </div>
  );
};

export default VehicleManagement;
