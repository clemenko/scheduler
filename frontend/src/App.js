import React, { useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import Calendar from './components/Calendar';
import TableView from './TableView';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import Admin from './components/Admin';
import Register from './components/Register';
import Login from './components/Login';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { EventProvider } from './context/EventContext';
import axios from 'axios';

function App() {
  return (
    <AuthProvider>
      <EventProvider>
        <AppContent />
      </EventProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { user, logout } = useContext(AuthContext);
  const [view, setView] = useState('calendar');
  const [calendarTitle, setCalendarTitle] = useState('Fire Department Scheduler');

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
            {user && (
              <Button color="inherit" onClick={() => setView(view === 'calendar' ? 'table' : 'calendar')}>
                {view === 'calendar' ? 'Table View' : 'Calendar View'}
              </Button>
            )}
            {user ? (
              <>
                <Typography sx={{ mr: 2 }}>
                  {user.email}
                </Typography>
                {user.role === 'admin' && (
                  <Button color="inherit" component={Link} to="/admin">
                    Admin
                  </Button>
                )}
                <Button color="inherit" onClick={handleLogout}>
                  Logout
                </Button>
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
