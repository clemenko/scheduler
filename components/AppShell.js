'use client';

import React from 'react';
import { Container, Box } from '@mui/material';
import Navbar from '@/components/Navbar';

export default function AppShell({ children }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container sx={{ mt: 3, mb: 4, flex: 1 }} maxWidth="lg">
        {children}
      </Container>
    </Box>
  );
}
