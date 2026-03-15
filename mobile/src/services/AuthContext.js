import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate session on mount
  useEffect(() => {
    (async () => {
      await api._ready;
      if (api.token) {
        try {
          const profile = await api.getProfile();
          setUser({
            id: profile.id,
            email: profile.email,
            role: profile.role,
            name: profile.name,
            companyName: profile.company_name,
          });
        } catch {
          await api.logout();
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setUser({
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
      name: data.user.name,
      companyName: data.user.company_name,
    });
    return data;
  };

  const register = async (email, password, role, name, companyName) => {
    const data = await api.register(email, password, role, name, companyName);
    setUser({
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
      name: data.user.name,
      companyName: data.user.company_name,
    });
    return data;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
