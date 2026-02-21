import React, { useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container, IconButton, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Calendar from './components/Calendar';
import TableView from './TableView';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import Admin from './components/Admin';
import Register from './components/Register';
import Login from './components/Login';
import ChangePassword from './components/ChangePassword';
import MyShifts from './components/MyShifts';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { ShiftProvider } from './context/ShiftContext';
import axios from 'axios';

import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Router>
        <AuthProvider>
          <ShiftProvider>
            <AppContent />
          </ShiftProvider>
        </AuthProvider>
      </Router>
    </LocalizationProvider>
  );
}

function AppContent() {
  const { user, logout } = useContext(AuthContext);
  const [view, setView] = useState('calendar');
  const [calendarTitle, setCalendarTitle] = useState('Fire Department Scheduler');
  const [headerColor, setHeaderColor] = useState('#1976d2');
  const [logoUrl, setLogoUrl] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/settings');
        setCalendarTitle(res.data.calendarTitle);
        if (res.data.headerColor) setHeaderColor(res.data.headerColor);
        if (res.data.logoUrl) setLogoUrl(res.data.logoUrl);
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
      <div>
        <AppBar position="static" sx={{ backgroundColor: headerColor }}>
          <Toolbar>
            {logoUrl && (
              <Link to="/" style={{ display: 'flex', alignItems: 'center', marginRight: 12 }}>
                <img src={logoUrl} alt="Logo" style={{ maxHeight: 40, maxWidth: 40 }} />
              </Link>
            )}
            <Typography variant="h6" component="div" noWrap sx={{ flexGrow: 1 }}>
              <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
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
                    disabled={location.pathname === '/' && view === 'calendar'}
                    onClick={() => {
                      setView('calendar');
                      navigate('/');
                      handleClose();
                    }}
                  >Calendar View</MenuItem>
                  <MenuItem
                    disabled={location.pathname === '/' && view === 'table'}
                    onClick={() => {
                      setView('table');
                      navigate('/');
                      handleClose();
                    }}
                  >Table View</MenuItem>
                  <MenuItem component={Link} to="/my-shifts" onClick={handleClose}>
                    My Shifts
                  </MenuItem>
                  <MenuItem component={Link} to="/change-password" onClick={handleClose}>
                    Change Password
                  </MenuItem>
                  {user.role === 'admin' && (
                    <MenuItem component={Link} to="/admin" onClick={handleClose}>
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
              <Button color="inherit" component={Link} to="/login">
                Login
              </Button>
            )}
          </Toolbar>
        </AppBar>
        <Container sx={{ mt: 4 }}>
          <Routes>
            <Route path="/" element={view === 'calendar' ? <Calendar /> : <TableView />} />
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            <Route element={<PrivateRoute />}>
              <Route path="/my-shifts" element={<MyShifts />} />
              <Route path="/change-password" element={<ChangePassword />} />
            </Route>
            <Route element={<PrivateRoute requiredRole="admin" />}>
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Routes>
        </Container>
      </div>
  );
}


export default App;
