'use client';

import { useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuthProvider } from '@/context/AuthContext';
import { ShiftProvider } from '@/context/ShiftContext';
import { ViewProvider } from '@/context/ViewContext';
import { SettingsProvider, useSettings } from '@/context/SettingsContext';
import { ThemeProvider, useThemeContext } from '@/context/ThemeContext';

function ThemedApp({ children }) {
  const { mode } = useThemeContext();
  const { settings } = useSettings();

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: {
        main: settings.headerColor || '#1976d2',
      },
      secondary: {
        main: '#1a237e',
        light: '#534bae',
        dark: '#000051',
      },
      ...(mode === 'dark' ? {
        background: {
          default: '#121212',
          paper: '#1e1e1e',
        },
      } : {
        background: {
          default: '#f5f5f5',
          paper: '#ffffff',
        },
      }),
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 700 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              fontWeight: 700,
            },
          },
        },
      },
    },
  }), [mode, settings.headerColor]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

function InnerProviders({ children }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <AuthProvider>
        <SettingsProvider>
          <ThemedApp>
            <ShiftProvider>
              <ViewProvider>
                {children}
              </ViewProvider>
            </ShiftProvider>
          </ThemedApp>
        </SettingsProvider>
      </AuthProvider>
    </LocalizationProvider>
  );
}

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <InnerProviders>{children}</InnerProviders>
    </ThemeProvider>
  );
}
