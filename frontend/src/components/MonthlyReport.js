import React, { useState } from 'react';
import { Typography, Button, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Card, CardContent, Grid } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import axios from 'axios';

const fromNaiveUTC = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(),
    d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
};

const MonthlyReport = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const res = await axios.get(`/api/reports/monthly?year=${year}&month=${month}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setReport(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const res = await axios.get(`/api/reports/monthly/export?year=${year}&month=${month}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `monthly-report-${year}-${String(month).padStart(2, '0')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Monthly Report
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <DatePicker
          label="Select Month"
          views={['year', 'month']}
          value={selectedDate}
          onChange={(newValue) => setSelectedDate(newValue)}
          slotProps={{ textField: { size: 'small' } }}
        />
        <Button variant="contained" color="primary" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Report'}
        </Button>
        {report && (
          <Button variant="outlined" onClick={handleDownload}>
            Download CSV
          </Button>
        )}
      </Box>

      {report && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>Total Shifts</Typography>
                  <Typography variant="h4">{report.totalShifts}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>Total Signups</Typography>
                  <Typography variant="h4">{report.totalSignups}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>Vehicle Usage</Typography>
                  {report.vehicleUsage.length > 0 ? (
                    report.vehicleUsage.map((v) => (
                      <Typography key={v.vehicleName} variant="body2">
                        {v.vehicleName}: {v.count}
                      </Typography>
                    ))
                  ) : (
                    <Typography variant="body2">No vehicle usage</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Shift Title</TableCell>
                  <TableCell>Start</TableCell>
                  <TableCell>End</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Vehicle</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.signups.length > 0 ? (
                  report.signups.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row.shiftTitle}</TableCell>
                      <TableCell>{fromNaiveUTC(row.shiftStart)?.toLocaleString()}</TableCell>
                      <TableCell>{fromNaiveUTC(row.shiftEnd)?.toLocaleString()}</TableCell>
                      <TableCell>{row.userName}</TableCell>
                      <TableCell>{row.vehicleName}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No signups for this month</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default MonthlyReport;
