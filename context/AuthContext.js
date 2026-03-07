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
        if (decoded.exp && decoded.exp * 1000 <= Date.now()) {
          localStorage.removeItem('token');
          document.cookie = 'token=; path=/; max-age=0';
          return;
        }
        setUser(decoded.user);
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; max-age=0';
      }
    }
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    const decoded = jwtDecode(token);
    const maxAge = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 7200;
    document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Strict`;
    setUser(decoded.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    document.cookie = 'token=; path=/; max-age=0';
    setUser(null);
  };

  // Check JWT expiry on load and periodically
  useEffect(() => {
    const checkSession = () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp && decoded.exp * 1000 <= Date.now()) {
          logout();
          window.location.href = '/login';
        }
      } catch {
        logout();
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
