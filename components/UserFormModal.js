'use client';

import React, { useState } from 'react';
import { Modal, Box, Typography, Button, TextField } from '@mui/material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95%', sm: 400 },
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const UserFormModal = ({ open, handleClose, onSave }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, email, password });
    setName('');
    setEmail('');
    setPassword('');
    setGeneratedPassword('');
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2">
          Add New User
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
              let result = '';
              const array = new Uint32Array(12);
              crypto.getRandomValues(array);
              for (let i = 0; i < 12; i++) {
                result += chars[array[i] % chars.length];
              }
              setPassword(result);
              setGeneratedPassword(result);
            }}
            sx={{ mt: 0.5 }}
          >
            Generate Random Password
          </Button>
          {generatedPassword && (
            <Typography
              variant="body2"
              sx={{ mt: 1, fontFamily: 'monospace', backgroundColor: '#f5f5f5', p: 1, borderRadius: 1, wordBreak: 'break-all' }}
            >
              {generatedPassword}
            </Typography>
          )}
          <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
            Add User
          </Button>
        </form>
      </Box>
    </Modal>
  );
};

export default UserFormModal;
