import React, { useState, useEffect } from 'react';
import { Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, ToggleButton, ToggleButtonGroup, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';
import { fromNaiveUTC } from '../utils/dateUtils';

const MyShifts = () => {
  const [range, setRange] = useState('week');
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyShifts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`/api/schedule/my-shifts?range=${range}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setShifts(res.data);
      } catch (err) {
        setError('Failed to load shifts');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyShifts();
  }, [range]);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        My Upcoming Shifts
      </Typography>
      <ToggleButtonGroup
        value={range}
        exclusive
        onChange={(e, newRange) => { if (newRange) setRange(newRange); }}
        sx={{ mb: 2 }}
        size="small"
      >
        <ToggleButton value="week">Week</ToggleButton>
        <ToggleButton value="month">Month</ToggleButton>
      </ToggleButtonGroup>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? <CircularProgress /> : <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Shift Title</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>End</TableCell>
              <TableCell>Vehicle</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shifts.length > 0 ? (
              shifts.map((signup) => (
                <TableRow key={signup._id}>
                  <TableCell>{signup.shift?.title}</TableCell>
                  <TableCell>{fromNaiveUTC(signup.shift?.start_time)?.toLocaleString()}</TableCell>
                  <TableCell>{fromNaiveUTC(signup.shift?.end_time)?.toLocaleString()}</TableCell>
                  <TableCell>{signup.vehicle?.name}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No upcoming shifts for this {range}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>}
    </Box>
  );
};

export default MyShifts;
