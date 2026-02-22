'use client';

import React, { useState, useEffect, useContext } from 'react';
import { Typography, Button, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Select, MenuItem, FormControl } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import ResetPasswordModal from '@/components/ResetPasswordModal';
import UserFormModal from '@/components/UserFormModal';
import { AuthContext } from '@/context/AuthContext';

const UserManagement = ({ showSnackbar }) => {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [userFormModalOpen, setUserFormModalOpen] = useState(false);

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

  const openResetModal = (user) => {
    setSelectedUser(user);
    setResetModalOpen(true);
  };

  const closeResetModal = () => {
    setSelectedUser(null);
    setResetModalOpen(false);
  };

  const handleResetPassword = async (password) => {
    if (!selectedUser) return;
    try {
      await axios.put(`/api/users/${selectedUser._id}/reset-password`, { password }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      closeResetModal();
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
      console.error(err.response?.data?.msg || err);
      showSnackbar(err.response?.data?.msg || 'Error deleting user.', 'error');
    }
  };

  const handleSaveUser = async (userData) => {
    try {
      await axios.post('/api/auth/register', userData);
      fetchUsers();
      setUserFormModalOpen(false);
      showSnackbar('User added successfully.', 'success');
    } catch (err) {
      console.error(err.response?.data?.msg || err);
      showSnackbar(err.response?.data?.msg || 'Error adding user.', 'error');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await axios.put(`/api/users/${userId}/role`, { role: newRole }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(users.map(u => u._id === userId ? res.data : u));
      showSnackbar('User role updated successfully.', 'success');
    } catch (err) {
      console.error(err.response?.data?.msg || err);
      showSnackbar(err.response?.data?.msg || 'Error updating user role.', 'error');
    }
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Users
      </Typography>
      <Button variant="contained" color="primary" onClick={() => setUserFormModalOpen(true)}>
        Add User
      </Button>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow key={user._id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <FormControl size="small">
                    <Select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      disabled={user._id === currentUser?.id}
                    >
                      <MenuItem value="viewer">Viewer</MenuItem>
                      <MenuItem value="regular">Regular</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <Button onClick={() => openResetModal(user)}>Reset Password</Button>
                  <IconButton onClick={() => handleDeleteUser(user._id)} disabled={user._id === currentUser?.id || user.role === 'admin'}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <ResetPasswordModal
        open={resetModalOpen}
        handleClose={closeResetModal}
        onReset={handleResetPassword}
      />
      <UserFormModal
        open={userFormModalOpen}
        handleClose={() => setUserFormModalOpen(false)}
        onSave={handleSaveUser}
      />
    </Box>
  );
};

export default UserManagement;
