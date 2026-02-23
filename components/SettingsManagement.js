'use client';

import React, { useState, useEffect } from 'react';
import { Typography, TextField, Button, Box, FormControlLabel, Switch, Divider, CircularProgress, Stack } from '@mui/material';
import axios from 'axios';

const MAX_LOGO_SIZE = 4 * 1024 * 1024; // 4 MB

const SettingsManagement = ({ showSnackbar }) => {
  const [calendarTitle, setCalendarTitle] = useState('');
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [headerColor, setHeaderColor] = useState('#1976d2');
  const [logoUrl, setLogoUrl] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showSnackbar('Please select an image file.', 'error');
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      showSnackbar('Logo must be under 4 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(reader.result);
    reader.onerror = () => showSnackbar('Failed to read file.', 'error');
    reader.readAsDataURL(file);
  };

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
      <Box sx={{ mt: 2, mb: 1 }}>
        <Typography variant="subtitle2" gutterBottom>Logo</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button variant="outlined" component="label">
            Upload Logo
            <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
          </Button>
          {logoUrl && (
            <Button variant="outlined" color="error" size="small" onClick={() => setLogoUrl('')}>
              Remove
            </Button>
          )}
        </Stack>
        {logoUrl && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>Preview:</Typography>
            <img src={logoUrl} alt="Logo preview" style={{ maxHeight: 40, maxWidth: 200 }} />
          </Box>
        )}
      </Box>
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

      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" gutterBottom>
        Test Email
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
        Send a test email to verify SMTP is configured correctly.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <TextField
          label="Recipient Email"
          size="small"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          placeholder="you@example.com"
          sx={{ minWidth: 280 }}
        />
        <Button
          variant="outlined"
          disabled={!testEmail || sendingTest}
          onClick={async () => {
            setSendingTest(true);
            try {
              await axios.post('/api/settings/test-email', { email: testEmail }, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
              });
              showSnackbar('Test email sent!', 'success');
            } catch (err) {
              const msg = err.response?.data?.msg || 'Failed to send test email';
              showSnackbar(msg, 'error');
            } finally {
              setSendingTest(false);
            }
          }}
        >
          {sendingTest ? <CircularProgress size={20} /> : 'Send Test'}
        </Button>
      </Box>
    </Box>
  );
};

export default SettingsManagement;
