import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import Providers from '@/components/Providers';
import AppShell from '@/components/AppShell';

export const metadata = {
  title: 'WAVFD Scheduler',
  description: 'Fire Department Shift Scheduler',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <Providers>
            <AppShell>
              {children}
            </AppShell>
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
