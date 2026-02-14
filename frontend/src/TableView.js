import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import axios from 'axios';

const TableView = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get('/api/events');
        setEvents(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvents();
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
          {events.map((event) => (
            <TableRow key={event._id}>
              <TableCell>{event.title}</TableCell>
              <TableCell>{new Date(event.start_time).toLocaleString()}</TableCell>
              <TableCell>{new Date(event.end_time).toLocaleString()}</TableCell>
              <TableCell>{event.creator?.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TableView;
