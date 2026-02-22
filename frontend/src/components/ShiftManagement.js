import React, { useState, useContext, useMemo } from 'react';
import { Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TableSortLabel } from '@mui/material';
import axios from 'axios';
import ShiftFormModal from './ShiftFormModal';
import { ShiftContext } from '../context/ShiftContext';
import { fromNaiveUTC } from '../utils/dateUtils';

const ShiftManagement = () => {
  const { shifts, fetchShifts } = useContext(ShiftContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState(null);
  const [sortField, setSortField] = useState('start_time');
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedShifts = useMemo(() => {
    return [...shifts].sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'title':
          aVal = (a.title || '').toLowerCase();
          bVal = (b.title || '').toLowerCase();
          break;
        case 'start_time':
          aVal = new Date(a.start_time).getTime();
          bVal = new Date(b.start_time).getTime();
          break;
        case 'end_time':
          aVal = new Date(a.end_time).getTime();
          bVal = new Date(b.end_time).getTime();
          break;
        case 'creator':
          aVal = (a.creator?.name || '').toLowerCase();
          bVal = (b.creator?.name || '').toLowerCase();
          break;
        case 'vehicle':
          aVal = (a.vehicle?.name || '').toLowerCase();
          bVal = (b.vehicle?.name || '').toLowerCase();
          break;
        case 'recurring':
          aVal = a.isRecurring ? 1 : 0;
          bVal = b.isRecurring ? 1 : 0;
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [shifts, sortField, sortDirection]);

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

  const columns = [
    { id: 'title', label: 'Title' },
    { id: 'start_time', label: 'Start Time' },
    { id: 'end_time', label: 'End Time' },
    { id: 'vehicle', label: 'Vehicle' },
    { id: 'creator', label: 'Creator' },
    { id: 'recurring', label: 'Recurring' },
  ];

  return (
    <div>
      <Typography variant="h5" component="h2" gutterBottom>
        Shift Management
      </Typography>
      <Button variant="contained" color="primary" onClick={handleAddShift}>
        Add Shift
      </Button>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.id}>
                  <TableSortLabel
                    active={sortField === col.id}
                    direction={sortField === col.id ? sortDirection : 'asc'}
                    onClick={() => handleSort(col.id)}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedShifts.map((shift) => (
              <TableRow key={shift._id}>
                <TableCell>{shift.title}</TableCell>
                <TableCell>{fromNaiveUTC(shift.start_time)?.toLocaleString()}</TableCell>
                <TableCell>{fromNaiveUTC(shift.end_time)?.toLocaleString()}</TableCell>
                <TableCell>{shift.vehicle?.name || ''}</TableCell>
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
