import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import axios from 'axios';

// Convert naive UTC (local wall-clock stored as UTC) back to a local Date for display
const fromNaiveUTC = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(),
    d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
};

const TableView = () => {
  const [shifts, setShifts] = useState([]);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const res = await axios.get('/api/shifts');
        setShifts(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchShifts();
  }, []);

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Start Time</TableCell>
            <TableCell>End Time</TableCell>
            <TableCell>Creator</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {shifts.map((shift) => (
            <TableRow key={shift._id}>
              <TableCell>{shift.title}</TableCell>
              <TableCell>{fromNaiveUTC(shift.start_time)?.toLocaleString()}</TableCell>
              <TableCell>{fromNaiveUTC(shift.end_time)?.toLocaleString()}</TableCell>
              <TableCell>{shift.creator?.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TableView;
