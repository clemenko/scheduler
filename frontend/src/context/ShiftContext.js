import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const ShiftContext = createContext();

const ShiftProvider = ({ children }) => {
  const [shifts, setShifts] = useState([]);

  const fetchShifts = useCallback(async () => {
    try {
      const res = await axios.get('/api/shifts');
      setShifts(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  return (
    <ShiftContext.Provider value={{ shifts, fetchShifts }}>
      {children}
    </ShiftContext.Provider>
  );
};

export { ShiftContext, ShiftProvider };
