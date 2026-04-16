'use client';

import React, { useState, useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Button, TextField, Typography, Container, Box, Alert, Paper, InputAdornment, IconButton
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import axios from 'axios';
import { AuthContext } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useContext(AuthContext);
  const { settings } = useSettings();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      login(res.data.token);
      router.push('/');
    } catch (err) {
      setError(err.response?.data?.msg || 'Something went wrong');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {settings.logoUrl && (
          <img src={settings.logoUrl} alt="Logo" style={{ maxHeight: 64, maxWidth: 64, marginBottom: 16 }} />
        )}
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          {settings.calendarTitle}
        </Typography>
        <Paper elevation={2} sx={{ p: 4, width: '100%', mt: 2 }}>
          <Typography variant="h5" component="h2" gutterBottom align="center">
            Sign In
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'hide password' : 'show password'}
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2, py: 1.2 }}>
              Sign In
            </Button>
            {settings.allowRegistration && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button component={Link} href="/register" color="secondary">
                  Create an Account
                </Button>
              </Box>
            )}
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
