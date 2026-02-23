'use client';

import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded.user);
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; max-age=0';
      }
    }
  }, []);

  const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours

  const login = (token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('loginTime', Date.now().toString());
    document.cookie = `token=${token}; path=/; max-age=7200; SameSite=Lax`;
    const decoded = jwtDecode(token);
    setUser(decoded.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('loginTime');
    document.cookie = 'token=; path=/; max-age=0';
    setUser(null);
  };

  // Check session expiry on load and periodically
  useEffect(() => {
    const checkSession = () => {
      const loginTime = localStorage.getItem('loginTime');
      if (loginTime && Date.now() - parseInt(loginTime, 10) >= SESSION_TIMEOUT) {
        logout();
        window.location.href = '/login';
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 60 * 1000); // check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
