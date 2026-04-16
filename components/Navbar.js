'use client';

import React, { useContext, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Button, Box, Divider } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TableChartIcon from '@mui/icons-material/TableChart';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { AuthContext } from '@/context/AuthContext';
import { ViewContext } from '@/context/ViewContext';
import { useThemeContext } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { view, setView } = useContext(ViewContext);
  const { mode, toggleMode } = useThemeContext();
  const { settings } = useSettings();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Set favicon when logoUrl is available
  if (typeof document !== 'undefined' && settings.logoUrl) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = '/api/favicon';
  }

  const isActiveView = (v) => pathname === '/' && view === v;

  return (
    <AppBar position="static" sx={{ backgroundColor: settings.headerColor }}>
      <Toolbar>
        {settings.logoUrl && (
          <Link href="/" style={{ display: 'flex', alignItems: 'center', marginRight: 12 }}>
            <img src={settings.logoUrl} alt="Logo" style={{ maxHeight: 40, maxWidth: 40 }} />
          </Link>
        )}
        <Typography variant="h6" component="div" noWrap sx={{ flexGrow: { xs: 1, md: 0 }, mr: { md: 4 } }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            {settings.calendarTitle}
          </Link>
        </Typography>

        {/* Desktop navigation links */}
        {user && (
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, flexGrow: 1 }}>
            <Button
              color="inherit"
              startIcon={<CalendarMonthIcon />}
              onClick={() => { setView('calendar'); router.push('/'); }}
              sx={{
                opacity: isActiveView('calendar') ? 1 : 0.8,
                borderBottom: isActiveView('calendar') ? '2px solid white' : '2px solid transparent',
                borderRadius: 0,
                px: 2,
              }}
            >
              Calendar
            </Button>
            <Button
              color="inherit"
              startIcon={<TableChartIcon />}
              onClick={() => { setView('table'); router.push('/'); }}
              sx={{
                opacity: isActiveView('table') ? 1 : 0.8,
                borderBottom: isActiveView('table') ? '2px solid white' : '2px solid transparent',
                borderRadius: 0,
                px: 2,
              }}
            >
              Table
            </Button>
            <Button
              color="inherit"
              component={Link}
              href="/my-shifts"
              startIcon={<EventNoteIcon />}
              sx={{
                opacity: pathname === '/my-shifts' ? 1 : 0.8,
                borderBottom: pathname === '/my-shifts' ? '2px solid white' : '2px solid transparent',
                borderRadius: 0,
                px: 2,
              }}
            >
              My Shifts
            </Button>
            {user.role === 'admin' && (
              <Button
                color="inherit"
                component={Link}
                href="/admin"
                startIcon={<AdminPanelSettingsIcon />}
                sx={{
                  opacity: pathname === '/admin' ? 1 : 0.8,
                  borderBottom: pathname === '/admin' ? '2px solid white' : '2px solid transparent',
                  borderRadius: 0,
                  px: 2,
                }}
              >
                Admin
              </Button>
            )}
          </Box>
        )}

        <IconButton color="inherit" onClick={toggleMode} aria-label="toggle dark mode" sx={{ mr: 1 }}>
          {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
        {user && (
          <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
            {user.email}
          </Typography>
        )}

        {/* Hamburger menu — mobile primary nav + secondary items on all sizes */}
        <IconButton
          size="large"
          edge="end"
          color="inherit"
          aria-label="menu"
          onClick={handleMenu}
        >
          <MenuIcon />
        </IconButton>
        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          open={open}
          onClose={handleClose}
        >
          <MenuItem component={Link} href="/about" onClick={handleClose}>
            About
          </MenuItem>

          {/* Mobile-only nav items */}
          {user && (
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <Divider />
              <MenuItem
                disabled={isActiveView('calendar')}
                onClick={() => { setView('calendar'); router.push('/'); handleClose(); }}
              >
                Calendar View
              </MenuItem>
              <MenuItem
                disabled={isActiveView('table')}
                onClick={() => { setView('table'); router.push('/'); handleClose(); }}
              >
                Table View
              </MenuItem>
              <MenuItem component={Link} href="/my-shifts" onClick={handleClose}>
                My Shifts
              </MenuItem>
              {user.role === 'admin' && (
                <MenuItem component={Link} href="/admin" onClick={handleClose}>
                  Admin
                </MenuItem>
              )}
              <Divider />
            </Box>
          )}

          {user && (
            <MenuItem component={Link} href="/change-password" onClick={handleClose}>
              Change Password
            </MenuItem>
          )}
          {user ? (
            <MenuItem onClick={() => { handleLogout(); handleClose(); }}>
              Logout
            </MenuItem>
          ) : (
            <MenuItem component={Link} href="/login" onClick={handleClose}>
              Login
            </MenuItem>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
