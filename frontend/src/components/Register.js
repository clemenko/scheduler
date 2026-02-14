import React, { useState } from 'react';
import { Button, TextField, Typography, Container, Alert } from '@mui/material';
import axios from 'axios';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      await axios.post('/api/auth/register', { name, email, password });
      setSuccess(true);
    } catch (err) {
      setError(err.response.data.msg || 'Something went wrong');
    }
  };

  return (
    <Container maxWidth="xs">
      <Typography variant="h4" component="h1" gutterBottom>
        Register
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">Registration successful! You can now log in.</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField
          label="Name"
          type="text"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Email"
          type="email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="contained" color="primary" fullWidth>
          Register
        </Button>
      </form>
    </Container>
  );
};

export default Register;
