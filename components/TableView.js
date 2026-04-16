'use client';

import React, { useContext, useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel, Typography, Box } from '@mui/material';
import { ShiftContext } from '@/context/ShiftContext';
import ShiftModal from '@/components/ShiftModal';
import { formatShiftTime } from '@/utils/dateUtils';

const TableView = () => {
  const { shifts, fetchShifts } = useContext(ShiftContext);
  const [sortField, setSortField] = useState('start_time');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedShift, setSelectedShift] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

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
    { id: 'end_time', label: 'End Time', sx: { display: { xs: 'none', sm: 'table-cell' } } },
    { id: 'vehicle', label: 'Vehicle', sx: { display: { xs: 'none', md: 'table-cell' } } },
    { id: 'creator', label: 'Creator', sx: { display: { xs: 'none', md: 'table-cell' } } },
  ];

  return (
  <>
    <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.id} sx={col.sx}>
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
          {sortedShifts.length > 0 ? (
            sortedShifts.map((shift) => (
              <TableRow
                key={shift._id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => { setSelectedShift(shift); setModalOpen(true); }}
              >
                <TableCell>{shift.title}</TableCell>
                <TableCell>{formatShiftTime(shift.start_time)}</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{formatShiftTime(shift.end_time)}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{shift.vehicle?.name || ''}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{shift.creator?.name}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} align="center">
                <Box sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No shifts scheduled yet.
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
    <ShiftModal
      open={modalOpen}
      handleClose={() => { setModalOpen(false); setSelectedShift(null); fetchShifts(); }}
      shift={selectedShift}
    />
  </>
  );
};

export default TableView;
