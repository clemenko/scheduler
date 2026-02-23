'use client';

import React from 'react';
import { Container } from '@mui/material';
import Navbar from '@/components/Navbar';

export default function AppShell({ children }) {
  return (
    <div>
      <Navbar />
      <Container sx={{ mt: 4 }}>
        {children}
      </Container>
    </div>
  );
}
