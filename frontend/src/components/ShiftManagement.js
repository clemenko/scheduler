import React, { useState, useContext } from 'react';
import { Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import axios from 'axios';
import ShiftFormModal from './ShiftFormModal';
import { ShiftContext } from '../context/ShiftContext';

// Convert naive UTC (local wall-clock stored as UTC) back to a local Date for display
const fromNaiveUTC = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(),
    d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
};

const ShiftManagement = () => {
  const { shifts, fetchShifts } = useContext(ShiftContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState(null);

  const handleAddShift = () => {
    setCurrentShift(null);
    setModalOpen(true);
  };

  const handleEditShift = (shift) => {
    setCurrentShift(shift);
    setModalOpen(true);
  };

  const handleDeleteShift = (shift) => {
    if (shift.isRecurring) {
      setShiftToDelete(shift);
      setDeleteDialogOpen(true);
    } else {
      deleteShift(shift._id);
    }
  };

  const deleteShift = async (id) => {
    try {
      await axios.delete(`/api/shifts/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchShifts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteShiftSeries = async () => {
    try {
      await axios.delete(`/api/shifts/series/${shiftToDelete._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchShifts();
      handleDeleteDialogClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setShiftToDelete(null);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <div>
      <Typography variant="h5" component="h2" gutterBottom>
        Shift Management
      </Typography>
      <Button variant="contained" color="primary" onClick={handleAddShift}>
        Add Shift
      </Button>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>End Time</TableCell>
              <TableCell>Creator</TableCell>
              <TableCell>Recurring</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shifts.map((shift) => (
              <TableRow key={shift._id}>
                <TableCell>{shift.title}</TableCell>
                <TableCell>{fromNaiveUTC(shift.start_time)?.toLocaleString()}</TableCell>
                <TableCell>{fromNaiveUTC(shift.end_time)?.toLocaleString()}</TableCell>
                <TableCell>{shift.creator?.name}</TableCell>
                <TableCell>
                  {shift.isRecurring && shift.recurrenceRule
                    ? shift.recurrenceRule.frequency.charAt(0).toUpperCase() + shift.recurrenceRule.frequency.slice(1)
                    : 'No'}
                </TableCell>
                <TableCell>
                  <Button onClick={() => handleEditShift(shift)}>Edit</Button>
                  <Button onClick={() => handleDeleteShift(shift)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <ShiftFormModal
        open={modalOpen}
        handleClose={handleCloseModal}
        currentShift={currentShift}
        onSave={fetchShifts}
      />
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
      >
        <DialogTitle>Delete Recurring Shift</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This is a recurring shift. Do you want to delete the entire series?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={handleDeleteShiftSeries} color="primary">
            Delete Series
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ShiftManagement;
