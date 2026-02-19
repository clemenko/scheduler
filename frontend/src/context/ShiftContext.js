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
      const res = await axios.get('/api/shifts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
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
  }, [fetchShifts]);

  return (
    <ShiftContext.Provider value={{ shifts, loading, error, fetchShifts }}>
      {children}
    </ShiftContext.Provider>
  );
};

export { ShiftContext, ShiftProvider };
