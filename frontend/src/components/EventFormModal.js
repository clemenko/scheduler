import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, TextField } from '@mui/material';
import axios from 'axios';

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

const EventFormModal = ({ open, handleClose, currentEvent, onSave }) => {
  const [title, setTitle] = useState('');
  const [start_time, setStartTime] = useState('');
  const [end_time, setEndTime] = useState('');
  const [max_slots, setMaxSlots] = useState('');

  useEffect(() => {
    if (currentEvent) {
      setTitle(currentEvent.title);
      setStartTime(new Date(currentEvent.start_time).toISOString().slice(0, 16));
      setEndTime(new Date(currentEvent.end_time).toISOString().slice(0, 16));
      setMaxSlots(currentEvent.max_slots);
    } else {
      setTitle('');
      setStartTime('');
      setEndTime('');
      setMaxSlots('');
    }
  }, [currentEvent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const eventData = {
      title,
      start_time,
      end_time,
      max_slots: parseInt(max_slots)
    };

    try {
      if (currentEvent) {
        await axios.put(`/api/events/${currentEvent._id}`, eventData, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      } else {
        await axios.post('/api/events', eventData, {
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
          {currentEvent ? 'Edit Event' : 'Add Event'}
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Title"
            fullWidth
            margin="normal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <TextField
            label="Start Time"
            type="datetime-local"
            fullWidth
            margin="normal"
            value={start_time}
            onChange={(e) => setStartTime(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            required
          />
          <TextField
            label="End Time"
            type="datetime-local"
            fullWidth
            margin="normal"
            value={end_time}
            onChange={(e) => setEndTime(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            required
          />
          <TextField
            label="Max Slots"
            type="number"
            fullWidth
            margin="normal"
            value={max_slots}
            onChange={(e) => setMaxSlots(e.target.value)}
            required
          />
          <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
            {currentEvent ? 'Update Event' : 'Add Event'}
          </Button>
        </form>
      </Box>
    </Modal>
  );
};

export default EventFormModal;
