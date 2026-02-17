import React, { useState, useContext } from 'react';
import { Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import axios from 'axios';
import EventFormModal from './EventFormModal';
import { EventContext } from '../context/EventContext';

const EventManagement = () => {
  const { events, fetchEvents } = useContext(EventContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);

  const handleAddEvent = () => {
    setCurrentEvent(null);
    setModalOpen(true);
  };

  const handleEditEvent = (event) => {
    setCurrentEvent(event);
    setModalOpen(true);
  };

  const handleDeleteEvent = async (id) => {
    try {
      await axios.delete(`/api/events/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchEvents(); // Refetch events from context
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <div>
      <Typography variant="h5" component="h2" gutterBottom>
        Event Management
      </Typography>
      <Button variant="contained" color="primary" onClick={handleAddEvent}>
        Add Event
      </Button>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>End Time</TableCell>
              <TableCell>Max Slots</TableCell>
              <TableCell>Creator</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event._id}>
                <TableCell>{event.title}</TableCell>
                <TableCell>{new Date(event.start_time).toLocaleString()}</TableCell>
                <TableCell>{new Date(event.end_time).toLocaleString()}</TableCell>
                <TableCell>{event.max_slots}</TableCell>
                <TableCell>{event.creator?.name}</TableCell>
                <TableCell>
                  <Button onClick={() => handleEditEvent(event)}>Edit</Button>
                  <Button onClick={() => handleDeleteEvent(event._id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <EventFormModal
        open={modalOpen}
        handleClose={handleCloseModal}
        currentEvent={currentEvent}
        onSave={fetchEvents} // Pass fetchEvents directly to onSave
      />
    </div>
  );
};

export default EventManagement;
