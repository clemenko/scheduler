'use client';

import React, { useState, useEffect, useContext } from 'react';
import { Modal, Box, Typography, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import axios from 'axios';
import { AuthContext } from '@/context/AuthContext';
import { fromNaiveUTC } from '@/utils/dateUtils';

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
  maxHeight: '90vh',
  overflowY: 'auto',
};

const ShiftModal = ({ open, handleClose, shift, onEdit }) => {
  const { user } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await axios.get('/api/vehicles');
        setVehicles(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    const fetchUsers = async () => {
      try {
        const res = await axios.get('/api/users', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setUsers(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (open) {
      fetchVehicles();
      setSelectedUser(user?.id || '');
      if (user?.role === 'admin') {
        fetchUsers();
      }
    }
  }, [open, user]);

  const handleSignUp = async () => {
    try {
      const body = { shiftId: shift._id, vehicleId: selectedVehicle };
      if (user?.role === 'admin' && selectedUser) {
        body.userId = selectedUser;
      }
      await axios.post('/api/schedule/signup', body, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      alert('You have successfully signed up for the shift!');
      handleClose();
    } catch (err) {
      console.error(err);
    }
  };

  const canManageShift = user && shift && (user.role === 'admin' || (shift.creator && (shift.creator._id === user.id || shift.creator === user.id)));

  const handleDeleteShift = async () => {
    try {
      const url = shift.isRecurring
        ? `/api/shifts/series/${shift.parentShift || shift._id}`
        : `/api/shifts/${shift._id}`;
      await axios.delete(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      handleClose();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Error deleting shift.');
    }
  };

  const handleDeleteSignup = async (signupId) => {
    try {
      await axios.delete(`/api/schedule/${signupId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      alert('Signup canceled successfully.');
      handleClose();
    } catch (err) {
      console.error(err);
      alert('Error canceling signup.');
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="h2">
            {shift?.title}
          </Typography>
          {canManageShift && (
            <Box>
              {onEdit && <Button size="small" onClick={() => onEdit(shift)}>Edit</Button>}
              <Button size="small" color="error" onClick={handleDeleteShift}>Delete</Button>
            </Box>
          )}
        </Box>
        <Typography sx={{ mt: 2 }}>
          {fromNaiveUTC(shift?.start_time)?.toLocaleString()} - {fromNaiveUTC(shift?.end_time)?.toLocaleString()}
        </Typography>
        {shift?.vehicle?.name && (
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            Vehicle: {shift.vehicle.name}
          </Typography>
        )}
        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Signed Up:
        </Typography>
        {shift?.signups && shift.signups.length > 0 ? (
          <ul>
            {shift.signups.map(signup => (
              <li key={signup._id}>
                {signup.user.name} - {signup.vehicle?.name}
                {(user?.role === 'admin' || user?.id === signup.user._id) && (
                  <Button onClick={() => handleDeleteSignup(signup._id)} size="small">Delete</Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <Typography variant="body2" sx={{ mt: 1 }}>
            No one has signed up for this shift yet.
          </Typography>
        )}
        {user?.role !== 'viewer' && (
          <>
            {user?.role === 'admin' && (
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>User</InputLabel>
                <Select
                  value={selectedUser}
                  label="User"
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  {users.map(u => (
                    <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Vehicle</InputLabel>
              <Select
                value={selectedVehicle}
                label="Vehicle"
                onChange={(e) => setSelectedVehicle(e.target.value)}
              >
                {vehicles.map(vehicle => (
                  <MenuItem key={vehicle._id} value={vehicle._id}>{vehicle.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button onClick={handleSignUp} sx={{ mt: 2 }}>Sign Up</Button>
          </>
        )}
        {shift?.creator?.name && (
          <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: 'text.secondary' }}>
            Created by {shift.creator.name}
          </Typography>
        )}
      </Box>
    </Modal>
  );
};

export default ShiftModal;
