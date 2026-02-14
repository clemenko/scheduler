import React, { useState, useEffect } from 'react';
import { Typography, Button, Box, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import axios from 'axios';
import ResetPasswordModal from './ResetPasswordModal';

const UserManagement = ({ showSnackbar }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const openModal = (user) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setModalOpen(false);
  };

  const handleResetPassword = async (password) => {
    if (!selectedUser) return;
    try {
      await axios.put(`/api/users/${selectedUser._id}/reset-password`, { password }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      closeModal();
      showSnackbar('Password reset successfully.', 'success');
    } catch (err) {
      console.error(err);
      showSnackbar('Error resetting password.', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`/api/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchUsers();
      showSnackbar('User deleted successfully.', 'success');
    } catch (err) {
      console.error(err.response.data.msg || err);
      showSnackbar(err.response.data.msg || 'Error deleting user.', 'error');
    }
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        User Management
      </Typography>
      <List>
        {users.map(user => (
          <ListItem key={user._id}>
            <ListItemText primary={user.name} secondary={user.email} />
            <ListItemSecondaryAction>
              <Button edge="end" aria-label="reset-password" onClick={() => openModal(user)}>
                Reset Password
              </Button>
              <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteUser(user._id)}>
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <ResetPasswordModal
        open={modalOpen}
        handleClose={closeModal}
        onReset={handleResetPassword}
      />
    </Box>
  );
};

export default UserManagement;
