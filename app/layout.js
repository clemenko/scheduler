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
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
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
