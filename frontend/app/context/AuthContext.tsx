'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, PropsWithChildren } from 'react';
import { getMe, setAuthToken, login as apiLogin, register as apiRegister, logout as apiLogout } from '../../lib/api';

interface User {
  id: number;
  username: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // With HttpOnly cookies, we just try to fetch the user profile.
    // Explicit token management in localStorage is removed.
    getMe()
      .then((u) => setUser(u))
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const data = await apiLogin(username, password);
    // Token is now in HttpOnly cookie
    setUser(data.user);
  };

  const register = async (username: string, password: string) => {
    const data = await apiRegister(username, password);
    // Token is now in HttpOnly cookie
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (e) {
      console.error("Logout failed", e);
    }
    setAuthToken(null); // No-op but keeps structure
    setUser(null);
    // Optionally clear local storage if we used it for other things
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
