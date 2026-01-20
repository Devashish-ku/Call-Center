// src/context/AuthContext.tsx
'use client' // <--- THIS IS CRITICAL


// ... rest of your imports and code
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, getCurrentUser, setCurrentUser, setAuthToken, removeAuthToken, logout as authLogout } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    let data;
    try {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        // If response is not JSON, it might be an HTML error page or empty
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
      }
    } catch (e) {
      throw new Error('Failed to read server response');
    }

    if (!response.ok) {
      throw new Error(data?.error || 'Login failed');
    }

    setAuthToken(data.token);
    setCurrentUser(data.user);
    setUser(data.user);
  };

  const logout = () => {
    setUser(null);
    authLogout();
  };

  const isAdmin = user?.role === 'admin';
  const isEmployee = user?.role === 'employee';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isEmployee }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
