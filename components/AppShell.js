'use client';

import React, { useState } from 'react';
import { Container } from '@mui/material';
import Navbar from '@/components/Navbar';

export default function AppShell({ children }) {
  const [view, setView] = useState('calendar');

  return (
    <div>
      <Navbar view={view} setView={setView} />
      <Container sx={{ mt: 4 }}>
        {React.Children.map(children, child =>
          React.isValidElement(child)
            ? React.cloneElement(child, { view, setView })
            : child
        )}
      </Container>
    </div>
  );
}
