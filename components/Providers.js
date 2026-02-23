'use client';

import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuthProvider } from '@/context/AuthContext';
import { ShiftProvider } from '@/context/ShiftContext';
import { ViewProvider } from '@/context/ViewContext';

export default function Providers({ children }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <AuthProvider>
        <ShiftProvider>
          <ViewProvider>
            {children}
          </ViewProvider>
        </ShiftProvider>
      </AuthProvider>
    </LocalizationProvider>
  );
}
