import React, { useContext, useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel } from '@mui/material';
import { ShiftContext } from './context/ShiftContext';
import { fromNaiveUTC } from './utils/dateUtils';

const TableView = () => {
  const { shifts } = useContext(ShiftContext);
  const [sortField, setSortField] = useState('start_time');
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedShifts = useMemo(() => {
    return [...shifts].sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'title':
          aVal = (a.title || '').toLowerCase();
          bVal = (b.title || '').toLowerCase();
          break;
        case 'start_time':
          aVal = new Date(a.start_time).getTime();
          bVal = new Date(b.start_time).getTime();
          break;
        case 'end_time':
          aVal = new Date(a.end_time).getTime();
          bVal = new Date(b.end_time).getTime();
          break;
        case 'vehicle':
          aVal = (a.vehicle?.name || '').toLowerCase();
          bVal = (b.vehicle?.name || '').toLowerCase();
          break;
        case 'creator':
          aVal = (a.creator?.name || '').toLowerCase();
          bVal = (b.creator?.name || '').toLowerCase();
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [shifts, sortField, sortDirection]);

  const columns = [
    { id: 'title', label: 'Title' },
    { id: 'start_time', label: 'Start Time' },
    { id: 'end_time', label: 'End Time' },
    { id: 'vehicle', label: 'Vehicle' },
    { id: 'creator', label: 'Creator' },
  ];

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.id}>
                <TableSortLabel
                  active={sortField === col.id}
                  direction={sortField === col.id ? sortDirection : 'asc'}
                  onClick={() => handleSort(col.id)}
                >
                  {col.label}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedShifts.map((shift) => (
            <TableRow key={shift._id}>
              <TableCell>{shift.title}</TableCell>
              <TableCell>{fromNaiveUTC(shift.start_time)?.toLocaleString()}</TableCell>
              <TableCell>{fromNaiveUTC(shift.end_time)?.toLocaleString()}</TableCell>
              <TableCell>{shift.vehicle?.name || ''}</TableCell>
              <TableCell>{shift.creator?.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TableView;
