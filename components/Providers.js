'use client';

import { useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuthProvider } from '@/context/AuthContext';
import { ShiftProvider } from '@/context/ShiftContext';
import { ViewProvider } from '@/context/ViewContext';
import { ThemeProvider, useThemeContext } from '@/context/ThemeContext';

function InnerProviders({ children }) {
  const { mode } = useThemeContext();
  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AuthProvider>
          <ShiftProvider>
            <ViewProvider>
              {children}
            </ViewProvider>
          </ShiftProvider>
        </AuthProvider>
      </LocalizationProvider>
    </MuiThemeProvider>
  );
}

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <InnerProviders>{children}</InnerProviders>
    </ThemeProvider>
  );
}
