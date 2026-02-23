'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel } from '@mui/material';
import axios from 'axios';
import VehicleFormModal from '@/components/VehicleFormModal';

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState(null);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedVehicles = [...vehicles].sort((a, b) => {
    let valA, valB;
    if (sortField === 'capacity') {
      valA = a.capacity || 0;
      valB = b.capacity || 0;
    } else {
      valA = (a[sortField] || '').toLowerCase();
      valB = (b[sortField] || '').toLowerCase();
    }
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

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
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sortDirection={sortField === 'name' ? sortDirection : false}>
                <TableSortLabel active={sortField === 'name'} direction={sortField === 'name' ? sortDirection : 'asc'} onClick={() => handleSort('name')}>Name</TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortField === 'description' ? sortDirection : false}>
                <TableSortLabel active={sortField === 'description'} direction={sortField === 'description' ? sortDirection : 'asc'} onClick={() => handleSort('description')}>Description</TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortField === 'capacity' ? sortDirection : false}>
                <TableSortLabel active={sortField === 'capacity'} direction={sortField === 'capacity' ? sortDirection : 'asc'} onClick={() => handleSort('capacity')}>Capacity</TableSortLabel>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedVehicles.map((vehicle) => (
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
