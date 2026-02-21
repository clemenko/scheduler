import React, { useState, useEffect } from 'react';
import { Typography, Button, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';
import { fromNaiveUTC } from '../utils/dateUtils';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get('/api/auditlog', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setLogs(res.data);
      } catch (err) {
        setError('Failed to load audit logs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

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
              <TableCell>Timestamp</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Shift</TableCell>
              <TableCell>Shift Start</TableCell>
              <TableCell>Vehicle</TableCell>
              <TableCell>Performed By</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
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
    </Box>
  );
};

export default AuditLog;
