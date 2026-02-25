'use client';

import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, CircularProgress, Alert, IconButton, TableSortLabel,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';
import { fromNaiveUTC } from '@/utils/dateUtils';
import ShiftFormModal from '@/components/ShiftFormModal';
import { AuthContext } from '@/context/AuthContext';

const MyShifts = () => {
  const { user } = useContext(AuthContext);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderBy, setOrderBy] = useState('start');
  const [order, setOrder] = useState('asc');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, signup: null });
  const [editShift, setEditShift] = useState(null);
  const [formModalOpen, setFormModalOpen] = useState(false);

  const fetchMyShifts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/schedule/my-shifts', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setShifts(res.data);
    } catch (err) {
      setError('Failed to load shifts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyShifts();
  }, [fetchMyShifts]);

  const handleSort = (column) => {
    const isAsc = orderBy === column && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(column);
  };

  const sortedShifts = [...shifts].sort((a, b) => {
    let valA, valB;
    switch (orderBy) {
      case 'title':
        valA = (a.shift?.title || '').toLowerCase();
        valB = (b.shift?.title || '').toLowerCase();
        return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      case 'start':
        valA = new Date(a.shift?.start_time || 0);
        valB = new Date(b.shift?.start_time || 0);
        return order === 'asc' ? valA - valB : valB - valA;
      case 'end':
        valA = new Date(a.shift?.end_time || 0);
        valB = new Date(b.shift?.end_time || 0);
        return order === 'asc' ? valA - valB : valB - valA;
      case 'vehicle':
        valA = (a.vehicle?.name || '').toLowerCase();
        valB = (b.vehicle?.name || '').toLowerCase();
        return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      default:
        return 0;
    }
  });

  const handleDeleteClick = (signup) => {
    setDeleteDialog({ open: true, signup });
  };

  const handleDeleteConfirm = async () => {
    const { signup } = deleteDialog;
    setDeleteDialog({ open: false, signup: null });
    try {
      await axios.delete(`/api/schedule/${signup._id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchMyShifts();
    } catch (err) {
      setError('Failed to cancel signup');
      console.error(err);
    }
  };

  const handleEditClick = (signup) => {
    setEditShift({
      _id: signup.shift?._id,
      title: signup.shift?.title,
      start_time: signup.shift?.start_time,
      end_time: signup.shift?.end_time,
      vehicle: signup.vehicle?._id
    });
    setFormModalOpen(true);
  };

  const handleFormModalClose = () => {
    setFormModalOpen(false);
    setEditShift(null);
  };

  const handleSave = () => {
    handleFormModalClose();
    fetchMyShifts();
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        My Upcoming Shifts
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? <CircularProgress /> : <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel active={orderBy === 'title'} direction={orderBy === 'title' ? order : 'asc'} onClick={() => handleSort('title')}>
                  Shift Title
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel active={orderBy === 'start'} direction={orderBy === 'start' ? order : 'asc'} onClick={() => handleSort('start')}>
                  Start
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel active={orderBy === 'end'} direction={orderBy === 'end' ? order : 'asc'} onClick={() => handleSort('end')}>
                  End
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel active={orderBy === 'vehicle'} direction={orderBy === 'vehicle' ? order : 'asc'} onClick={() => handleSort('vehicle')}>
                  Vehicle
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedShifts.length > 0 ? (
              sortedShifts.map((signup) => (
                <TableRow key={signup._id}>
                  <TableCell>{signup.shift?.title}</TableCell>
                  <TableCell>{fromNaiveUTC(signup.shift?.start_time)?.toLocaleString()}</TableCell>
                  <TableCell>{fromNaiveUTC(signup.shift?.end_time)?.toLocaleString()}</TableCell>
                  <TableCell>{signup.vehicle?.name}</TableCell>
                  <TableCell align="right">
                    {user?.role === 'admin' && (
                    <IconButton size="small" onClick={() => handleEditClick(signup)} title="Edit shift">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    )}
                    <IconButton size="small" color="error" onClick={() => handleDeleteClick(signup)} title="Cancel signup">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No upcoming shifts
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>}

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, signup: null })}>
        <DialogTitle>Cancel Signup</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel your signup for &quot;{deleteDialog.signup?.shift?.title}&quot;?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, signup: null })}>No</Button>
          <Button onClick={handleDeleteConfirm} color="error">Yes, Cancel</Button>
        </DialogActions>
      </Dialog>

      <ShiftFormModal
        open={formModalOpen}
        handleClose={handleFormModalClose}
        currentShift={editShift}
        onSave={handleSave}
      />
    </Box>
  );
};

export default MyShifts;
