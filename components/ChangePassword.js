'use client';

import React, { useState } from 'react';
import {
  Button, TextField, Typography, Container, Alert, Paper, Box,
  InputAdornment, IconButton
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import axios from 'axios';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    try {
      await axios.put('/api/auth/change-password', { currentPassword, newPassword }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Something went wrong');
    }
  };

  const passwordAdornment = (show, setShow) => ({
    input: {
      endAdornment: (
        <InputAdornment position="end">
          <IconButton
            aria-label={show ? 'hide password' : 'show password'}
            onClick={() => setShow(!show)}
            edge="end"
            size="small"
          >
            {show ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        </InputAdornment>
      ),
    },
  });

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Change Password
        </Typography>
        <Paper elevation={2} sx={{ p: 4, mt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>Password changed successfully!</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField
              label="Current Password"
              type={showCurrent ? 'text' : 'password'}
              fullWidth
              margin="normal"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              slotProps={passwordAdornment(showCurrent, setShowCurrent)}
            />
            <TextField
              label="New Password"
              type={showNew ? 'text' : 'password'}
              fullWidth
              margin="normal"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
              slotProps={passwordAdornment(showNew, setShowNew)}
            />
            <TextField
              label="Confirm New Password"
              type={showNew ? 'text' : 'password'}
              fullWidth
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2, py: 1.2 }}>
              Change Password
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default ChangePassword;
