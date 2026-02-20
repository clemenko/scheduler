import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const ShiftContext = createContext();

const ShiftProvider = ({ children }) => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      let res;
      if (token) {
        res = await axios.get('/api/shifts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        res = await axios.get('/api/shifts/public');
      }
      setShifts(res.data);
    } catch (err) {
      setError(err);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShifts();
    const interval = setInterval(fetchShifts, 30000);
    return () => clearInterval(interval);
  }, [fetchShifts]);

  return (
    <ShiftContext.Provider value={{ shifts, loading, error, fetchShifts }}>
      {children}
    </ShiftContext.Provider>
  );
};

export { ShiftContext, ShiftProvider };
