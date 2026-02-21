import React, { useState } from 'react';
import { Typography, Container, Box, Tabs, Tab } from '@mui/material';
import VehicleManagement from './VehicleManagement';
import ShiftManagement from './ShiftManagement';
import SettingsManagement from './SettingsManagement';
import UserManagement from './UserManagement';
import AuditLog from './AuditLog';
import MonthlyReport from './MonthlyReport';
import CustomSnackbar from './CustomSnackbar';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 1, sm: 3 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Admin = () => {
  const [value, setValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons="auto" aria-label="admin tabs">
          <Tab label="Settings" />
          <Tab label="Users" />
          <Tab label="Vehicles" />
          <Tab label="Shifts" />
          <Tab label="Audit Log" />
          <Tab label="Reports" />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <SettingsManagement showSnackbar={showSnackbar} />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <UserManagement showSnackbar={showSnackbar} />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <VehicleManagement showSnackbar={showSnackbar} />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <ShiftManagement showSnackbar={showSnackbar} />
      </TabPanel>
      <TabPanel value={value} index={4}>
        <AuditLog />
      </TabPanel>
      <TabPanel value={value} index={5}>
        <MonthlyReport />
      </TabPanel>
      <CustomSnackbar
        open={snackbar.open}
        handleClose={closeSnackbar}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Container>
  );
};

export default Admin;
