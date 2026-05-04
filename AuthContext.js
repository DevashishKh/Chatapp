// context/AuthContext.js — Global auth state
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { connectSocket, disconnectSocket } from '../utils/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('chatapp_token');
    const savedUser = localStorage.getItem('chatapp_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      connectSocket(token);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('chatapp_token', data.token);
    localStorage.setItem('chatapp_user', JSON.stringify(data.user));
    setUser(data.user);
    connectSocket(data.token);
    return data;
  };

  const signup = async (username, email, password) => {
    const { data } = await api.post('/api/auth/signup', { username, email, password });
    localStorage.setItem('chatapp_token', data.token);
    localStorage.setItem('chatapp_user', JSON.stringify(data.user));
    setUser(data.user);
    connectSocket(data.token);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('chatapp_token');
    localStorage.removeItem('chatapp_user');
    disconnectSocket();
    setUser(null);
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    localStorage.setItem('chatapp_user', JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
