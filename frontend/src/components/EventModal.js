import React, { useState, useEffect, useContext } from 'react';
import { Modal, Box, Typography, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const EventModal = ({ open, handleClose, event }) => {
  const { user } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await axios.get('/api/vehicles');
        setVehicles(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (open) {
      fetchVehicles();
    }
  }, [open]);

  const handleSignUp = async () => {
    try {
      await axios.post('/api/schedule/signup', {
        eventId: event._id,
        vehicleId: selectedVehicle,
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      alert('You have successfully signed up for the event!');
      handleClose();
    } catch (err) {
      console.error(err);
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
        <Typography variant="h6" component="h2">
          {event?.title}
        </Typography>
        <Typography sx={{ mt: 2 }}>
          {new Date(event?.start_time).toLocaleString()} - {new Date(event?.end_time).toLocaleString()}
        </Typography>
        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Signed Up:
        </Typography>
        {event?.signups && event.signups.length > 0 ? (
          <ul>
            {event.signups.map(signup => (
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
            No one has signed up for this event yet.
          </Typography>
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
      </Box>
    </Modal>
  );
};

export default EventModal;
