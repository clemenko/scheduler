import React, { useState, useEffect } from 'react';
import { Typography, TextField, Button, Box, FormControlLabel, Switch } from '@mui/material';
import axios from 'axios';

const SettingsManagement = ({ showSnackbar }) => {
  const [calendarTitle, setCalendarTitle] = useState('');
  const [allowRegistration, setAllowRegistration] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/settings');
        setCalendarTitle(res.data.calendarTitle);
        setAllowRegistration(res.data.allowRegistration !== false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      await axios.put('/api/settings', { calendarTitle, allowRegistration }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      showSnackbar('Settings saved successfully!', 'success');
    } catch (err) {
      console.error(err);
      showSnackbar('Error saving settings.', 'error');
    }
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Settings
      </Typography>
      <TextField
        label="Calendar Title"
        fullWidth
        margin="normal"
        value={calendarTitle}
        onChange={(e) => setCalendarTitle(e.target.value)}
      />
      <FormControlLabel
        control={
          <Switch
            checked={allowRegistration}
            onChange={(e) => setAllowRegistration(e.target.checked)}
            color="primary"
          />
        }
        label="Allow New User Registration"
        sx={{ mt: 2, mb: 1, display: 'block' }}
      />
      <Button variant="contained" color="primary" onClick={handleSave}>
        Save Settings
      </Button>
    </Box>
  );
};

export default SettingsManagement;
