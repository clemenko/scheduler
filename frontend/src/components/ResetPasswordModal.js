import React, { useState } from 'react';
import { Modal, Box, Typography, Button, TextField } from '@mui/material';

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

const ResetPasswordModal = ({ open, handleClose, onReset }) => {
  const [password, setPassword] = useState('');

  const handleReset = () => {
    onReset(password);
    setPassword('');
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2">
          Reset Password
        </Typography>
        <TextField
          label="New Password"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button onClick={handleReset}>Reset</Button>
      </Box>
    </Modal>
  );
};

export default ResetPasswordModal;
