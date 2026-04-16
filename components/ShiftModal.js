'use client';

import React, { useState, useEffect, useContext } from 'react';
import {
  Modal, Box, Typography, Button, Select, MenuItem, FormControl, InputLabel,
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  CircularProgress, Snackbar, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { AuthContext } from '@/context/AuthContext';
import { formatShiftTime } from '@/utils/dateUtils';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95%', sm: 400 },
  bgcolor: 'background.paper',
  borderRadius: 2,
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
  const [signingUp, setSigningUp] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, id: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await axios.get('/api/vehicles');
        setVehicles(res.data);
      } catch (err) {
        console.error('Failed to fetch vehicles:', err);
      }
    };
    const fetchUsers = async () => {
      try {
        const res = await axios.get('/api/users', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setUsers(res.data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
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
    setSigningUp(true);
    try {
      const body = { shiftId: shift._id, vehicleId: selectedVehicle };
      if (user?.role === 'admin' && selectedUser) {
        body.userId = selectedUser;
      }
      await axios.post('/api/schedule/signup', body, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setSnackbar({ open: true, message: 'Successfully signed up for the shift!', severity: 'success' });
      handleClose();
    } catch (err) {
      console.error('Failed to sign up for shift:', err);
      setSnackbar({ open: true, message: err.response?.data?.msg || 'Failed to sign up for shift.', severity: 'error' });
    } finally {
      setSigningUp(false);
    }
  };

  const canManageShift = user && shift && (user.role === 'admin' || (shift.creator && (shift.creator._id === user.id || shift.creator === user.id)));

  const handleDeleteShift = () => {
    setDeleteDialog({ open: true, type: 'shift', id: shift._id });
  };

  const handleDeleteSignup = (signupId) => {
    setDeleteDialog({ open: true, type: 'signup', id: signupId });
  };

  const handleConfirmDelete = async () => {
    const { type, id } = deleteDialog;
    setDeleteDialog({ open: false, type: null, id: null });
    try {
      if (type === 'shift') {
        const url = shift.isRecurring
          ? `/api/shifts/series/${shift.parentShift || shift._id}`
          : `/api/shifts/${shift._id}`;
        await axios.delete(url, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setSnackbar({ open: true, message: 'Shift deleted.', severity: 'success' });
        handleClose();
      } else if (type === 'signup') {
        await axios.delete(`/api/schedule/${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setSnackbar({ open: true, message: 'Signup canceled.', severity: 'success' });
        handleClose();
      }
    } catch (err) {
      console.error(`Failed to delete ${type}:`, err);
      setSnackbar({ open: true, message: err.response?.data?.msg || `Error deleting ${type}.`, severity: 'error' });
    }
  };

  return (
    <>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="h2">
              {shift?.title}
            </Typography>
            {canManageShift && (
              <Box>
                {onEdit && user?.role === 'admin' && <Button size="small" onClick={() => onEdit(shift)}>Edit</Button>}
                <Button size="small" color="error" onClick={handleDeleteShift}>Delete</Button>
              </Box>
            )}
          </Box>
          <Typography sx={{ mt: 2 }}>
            {formatShiftTime(shift?.start_time)} - {formatShiftTime(shift?.end_time)}
          </Typography>
          {shift?.vehicle?.name && (
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              Vehicle: {shift.vehicle.name}
            </Typography>
          )}
          <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 600 }}>
            Signed Up:
          </Typography>
          {shift?.signups && shift.signups.length > 0 ? (
            <List dense disablePadding>
              {shift.signups.map(signup => (
                <ListItem key={signup._id} disableGutters sx={{ pr: 6 }}>
                  <ListItemText
                    primary={signup.user.name}
                    secondary={signup.vehicle?.name}
                  />
                  {(user?.role === 'admin' || user?.id === signup.user._id) && (
                    <ListItemSecondaryAction>
                      <IconButton edge="end" size="small" color="error" onClick={() => handleDeleteSignup(signup._id)} aria-label="cancel signup">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
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
              <Button
                variant="contained"
                onClick={handleSignUp}
                disabled={signingUp}
                sx={{ mt: 2 }}
              >
                {signingUp ? <CircularProgress size={20} /> : 'Sign Up'}
              </Button>
            </>
          )}
          {shift?.creator?.name && (
            <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: 'text.secondary' }}>
              Created by {shift.creator.name}
            </Typography>
          )}
        </Box>
      </Modal>

      {/* Confirmation dialog for delete actions */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, type: null, id: null })}>
        <DialogTitle>
          {deleteDialog.type === 'shift' ? 'Delete Shift' : 'Cancel Signup'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteDialog.type === 'shift'
              ? `Are you sure you want to delete "${shift?.title}"?${shift?.isRecurring ? ' This will delete the entire series.' : ''}`
              : 'Are you sure you want to cancel this signup?'
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, type: null, id: null })}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">
            {deleteDialog.type === 'shift' ? 'Delete' : 'Yes, Cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ShiftModal;
