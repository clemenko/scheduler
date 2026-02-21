import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Button, TextField, Typography, Container, Box, Alert } from '@mui/material';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [allowRegistration, setAllowRegistration] = useState(false);
  const { login } = useContext(AuthContext);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/settings');
        setAllowRegistration(res.data.allowRegistration !== false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      login(res.data.token);
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.msg || 'Something went wrong');
    }
  };

  return (
    <Container maxWidth="xs">
      <Typography variant="h4" component="h1" gutterBottom>
        Login
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <form onSubmit={handleSubmit}>
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button type="submit" variant="contained" color="primary">
            Login
          </Button>
          {allowRegistration && (
            <Button component={Link} to="/register" color="secondary">
              Register
            </Button>
          )}
        </Box>
      </form>
    </Container>
  );
};

export default Login;
