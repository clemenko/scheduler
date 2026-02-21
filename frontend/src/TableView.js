import React, { useContext } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { ShiftContext } from './context/ShiftContext';
import { fromNaiveUTC } from './utils/dateUtils';

const TableView = () => {
  const { shifts } = useContext(ShiftContext);

  return (
    <TableContainer component={Paper}>
      <Table size="small">
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
