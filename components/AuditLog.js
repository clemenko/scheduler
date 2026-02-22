'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Button, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, TableSortLabel, TablePagination } from '@mui/material';
import axios from 'axios';
import { fromNaiveUTC } from '@/utils/dateUtils';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`/api/auditlog?page=${page + 1}&limit=${rowsPerPage}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setLogs(res.data.logs);
        setTotal(res.data.total);
      } catch (err) {
        setError('Failed to load audit logs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page, rowsPerPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'timestamp':
          aVal = new Date(a.timestamp).getTime();
          bVal = new Date(b.timestamp).getTime();
          break;
        case 'action':
          aVal = (a.action || '').toLowerCase();
          bVal = (b.action || '').toLowerCase();
          break;
        case 'user':
          aVal = (a.targetUser?.name || a.userName || '').toLowerCase();
          bVal = (b.targetUser?.name || b.userName || '').toLowerCase();
          break;
        case 'shift':
          aVal = (a.shiftTitle || '').toLowerCase();
          bVal = (b.shiftTitle || '').toLowerCase();
          break;
        case 'shiftStart':
          aVal = a.shiftStart ? new Date(a.shiftStart).getTime() : 0;
          bVal = b.shiftStart ? new Date(b.shiftStart).getTime() : 0;
          break;
        case 'vehicle':
          aVal = (a.vehicleName || '').toLowerCase();
          bVal = (b.vehicleName || '').toLowerCase();
          break;
        case 'performedBy':
          aVal = (a.performedBy?.name || '').toLowerCase();
          bVal = (b.performedBy?.name || '').toLowerCase();
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [logs, sortField, sortDirection]);

  const columns = [
    { id: 'timestamp', label: 'Timestamp' },
    { id: 'action', label: 'Action' },
    { id: 'user', label: 'User' },
    { id: 'shift', label: 'Shift' },
    { id: 'shiftStart', label: 'Shift Start' },
    { id: 'vehicle', label: 'Vehicle' },
    { id: 'performedBy', label: 'Performed By' },
  ];

  const handleDownload = async () => {
    try {
      const res = await axios.get('/api/auditlog/export', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'audit-log.csv');
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
        Audit Log
      </Typography>
      <Button variant="contained" color="primary" onClick={handleDownload} sx={{ mb: 2 }}>
        Download CSV
      </Button>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? <CircularProgress /> : <TableContainer component={Paper}>
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
            {sortedLogs.map((log) => (
              <TableRow key={log._id}>
                <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.targetUser?.name || log.userName}</TableCell>
                <TableCell>{log.shiftTitle}</TableCell>
                <TableCell>{fromNaiveUTC(log.shiftStart)?.toLocaleString()}</TableCell>
                <TableCell>{log.vehicleName}</TableCell>
                <TableCell>{log.performedBy?.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>}
      {!loading && <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[25, 50, 100]}
      />}
    </Box>
  );
};

export default AuditLog;
