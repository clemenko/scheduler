import React, { useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container, IconButton, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Calendar from './components/Calendar';
import TableView from './TableView';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import Admin from './components/Admin';
import Register from './components/Register';
import Login from './components/Login';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { ShiftProvider } from './context/ShiftContext';
import axios from 'axios';

import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <AuthProvider>
        <ShiftProvider>
          <AppContent />
        </ShiftProvider>
      </AuthProvider>
    </LocalizationProvider>
  );
}

function AppContent() {
  const { user, logout } = useContext(AuthContext);
  const [view, setView] = useState('calendar');
  const [calendarTitle, setCalendarTitle] = useState('Fire Department Scheduler');
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/settings');
        setCalendarTitle(res.data.calendarTitle);
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
    <Router>
      <div>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                {calendarTitle}
              </Link>
            </Typography>
            {user ? (
              <>
                <Typography sx={{ mr: 2 }}>
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
                  <MenuItem onClick={() => {
                    setView(view === 'calendar' ? 'table' : 'calendar');
                    handleClose();
                  }}>{view === 'calendar' ? 'Table View' : 'Calendar View'}</MenuItem>
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
            <Route element={<PrivateRoute requiredRole="admin" />}>
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Routes>
        </Container>
      </div>
    </Router>
  );
}


export default App;
