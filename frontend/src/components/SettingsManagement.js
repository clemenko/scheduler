import React, { useState, useEffect } from 'react';
import { Typography, TextField, Button, Box, FormControlLabel, Switch } from '@mui/material';
import axios from 'axios';

const SettingsManagement = ({ showSnackbar }) => {
  const [calendarTitle, setCalendarTitle] = useState('');
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [headerColor, setHeaderColor] = useState('#1976d2');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/settings');
        setCalendarTitle(res.data.calendarTitle);
        setAllowRegistration(res.data.allowRegistration !== false);
        if (res.data.headerColor) setHeaderColor(res.data.headerColor);
        if (res.data.logoUrl) setLogoUrl(res.data.logoUrl);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      await axios.put('/api/settings', { calendarTitle, allowRegistration, headerColor, logoUrl }, {
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
      <TextField
        label="Logo URL"
        fullWidth
        margin="normal"
        value={logoUrl}
        onChange={(e) => setLogoUrl(e.target.value)}
        placeholder="https://example.com/logo.png"
      />
      {logoUrl && (
        <Box sx={{ mt: 1, mb: 1 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>Preview:</Typography>
          <img src={logoUrl} alt="Logo preview" style={{ maxHeight: 40, maxWidth: 200 }} />
        </Box>
      )}
      <Box sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography>Header Color</Typography>
        <input
          type="color"
          value={headerColor}
          onChange={(e) => setHeaderColor(e.target.value)}
          style={{ width: 60, height: 36, border: 'none', cursor: 'pointer', padding: 0 }}
        />
        <Typography variant="body2" color="textSecondary">{headerColor}</Typography>
      </Box>
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
