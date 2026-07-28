import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { loginUser, registerUser, googleAuth, fetchCurrentUser } from '../services/authApi';
import { getUnreadCount, markThreadAsRead } from '../services/messageApi.js';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [messageNotification, setMessageNotification] = useState('');

  const isPatient = user?.role === 'patient';

  const refreshUnreadCount = useCallback(async () => {
    if (!isPatient) {
      setUnreadMessages(0);
      return;
    }

    try {
      const { data } = await getUnreadCount();
      setUnreadMessages(data.count);
      if (window.location.pathname === '/messages') {
        setMessageNotification('');
        return;
      }

      if (data.count > 0) {
        setMessageNotification(`You have ${data.count} unread message${data.count === 1 ? '' : 's'}`);
        window.setTimeout(() => setMessageNotification(''), 4000);
      }
    } catch {
      setUnreadMessages(0);
    }
  }, [isPatient]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetchCurrentUser()
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        connectSocket(token);
        if (data.user?.role === 'patient') {
          refreshUnreadCount();
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [refreshUnreadCount]);

  const login = useCallback(async (credentials) => {
    const { data } = await loginUser(credentials);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    connectSocket(data.token);
    if (data.user?.role === 'patient') {
      refreshUnreadCount();
    }
    return data.user;
  }, [refreshUnreadCount]);

  const register = useCallback(async (payload) => {
    const { data } = await registerUser(payload);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    connectSocket(data.token);
    if (data.user?.role === 'patient') {
      refreshUnreadCount();
    }
    return data.user;
  }, [refreshUnreadCount]);

  const googleLogin = useCallback(async (payload) => {
    const { data } = await googleAuth(payload);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    connectSocket(data.token);
    if (data.user?.role === 'patient') {
      refreshUnreadCount();
    }
    return data.user;
  }, [refreshUnreadCount]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    disconnectSocket();
    setUser(null);
    setUnreadMessages(0);
    setMessageNotification('');
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = token ? connectSocket(token) : null;
    if (!socket || !user || !isPatient) return undefined;

    const handleNewMessage = (msg) => {
      if (msg.recipientId !== user.id) return;

      if (window.location.pathname === '/messages') {
        // Keep sidebar unread state aligned when the user is already viewing the thread.
        markThreadAsRead()
          .then(() => {
            setUnreadMessages(0);
            refreshUnreadCount();
          })
          .catch(() => {
            refreshUnreadCount();
          });
        return;
      }

      setUnreadMessages((prev) => prev + 1);
      setMessageNotification('New message received');
      window.setTimeout(() => setMessageNotification(''), 4000);
    };

    socket.on('message:new', handleNewMessage);
    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [isPatient, refreshUnreadCount, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        googleLogin,
        logout,
        unreadMessages,
        messageNotification,
        refreshUnreadCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
