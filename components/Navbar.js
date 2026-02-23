'use client';

import React, { useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { AuthContext } from '@/context/AuthContext';
import { ViewContext } from '@/context/ViewContext';
import axios from 'axios';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { view, setView } = useContext(ViewContext);
  const [calendarTitle, setCalendarTitle] = useState('Fire Department Scheduler');
  const [headerColor, setHeaderColor] = useState('#1976d2');
  const [logoUrl, setLogoUrl] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/settings');
        setCalendarTitle(res.data.calendarTitle);
        if (res.data.headerColor) setHeaderColor(res.data.headerColor);
        if (res.data.logoUrl) {
          setLogoUrl(res.data.logoUrl);
          let link = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = '/api/favicon';
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: headerColor }}>
      <Toolbar>
        {logoUrl && (
          <Link href="/" style={{ display: 'flex', alignItems: 'center', marginRight: 12 }}>
            <img src={logoUrl} alt="Logo" style={{ maxHeight: 40, maxWidth: 40 }} />
          </Link>
        )}
        <Typography variant="h6" component="div" noWrap sx={{ flexGrow: 1 }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            {calendarTitle}
          </Link>
        </Typography>
        {user ? (
          <>
            <Typography sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
              {user.email}
            </Typography>
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
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={open}
              onClose={handleClose}
            >
              <MenuItem
                disabled={pathname === '/' && view === 'calendar'}
                onClick={() => {
                  setView('calendar');
                  router.push('/');
                  handleClose();
                }}
              >Calendar View</MenuItem>
              <MenuItem
                disabled={pathname === '/' && view === 'table'}
                onClick={() => {
                  setView('table');
                  router.push('/');
                  handleClose();
                }}
              >Table View</MenuItem>
              <MenuItem component={Link} href="/my-shifts" onClick={handleClose}>
                My Shifts
              </MenuItem>
              <MenuItem component={Link} href="/change-password" onClick={handleClose}>
                Change Password
              </MenuItem>
              {user.role === 'admin' && (
                <MenuItem component={Link} href="/admin" onClick={handleClose}>
                  Admin
                </MenuItem>
              )}
              <MenuItem onClick={() => {
                handleLogout();
                handleClose();
              }}>Logout</MenuItem>
            </Menu>
          </>
        ) : (
          <Button color="inherit" component={Link} href="/login">
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
