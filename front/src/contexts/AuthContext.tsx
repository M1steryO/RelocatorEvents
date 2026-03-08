import { createContext, useContext, useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import { eventsService } from '../services/eventsService';
import { favouritesService } from '../services/favouritesService';

interface User {
  id: number;
  name: string;
  country?: string;
  city?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  storedUserId: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, user: User) => void;
  setAccessToken: (accessToken: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

/** Извлекает userId из payload JWT (sub, user_id, userId, id). */
function getUserIdFromAccessToken(accessToken: string | null): number | null {
  if (!accessToken || typeof accessToken !== 'string') return null;
  try {
    const parts = accessToken.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    ) as Record<string, unknown>;
    const raw = payload.sub ?? payload.user_id ?? payload.userId ?? payload.id;
    if (raw == null) return null;
    const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const isLoading = false;

  const storedUserId = useMemo(() => getUserIdFromAccessToken(token), [token]);

  const login = (accessToken: string, newUser: User) => {
    setToken(accessToken);
    setUserState(newUser);
    authService.setAccessToken(accessToken);
    eventsService.setAccessToken(accessToken);
    favouritesService.setAccessToken(accessToken);
  };

  const setAccessToken = (accessToken: string) => {
    setToken(accessToken);
    authService.setAccessToken(accessToken);
    eventsService.setAccessToken(accessToken);
    favouritesService.setAccessToken(accessToken);
  };

  const logout = () => {
    setToken(null);
    setUserState(null);
    authService.setAccessToken(null);
    eventsService.setAccessToken(null);
    favouritesService.setAccessToken(null);
  };

  const setUser = (newUser: User) => {
    setUserState(newUser);
  };

  const value: AuthContextType = {
    user,
    token,
    storedUserId,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    setAccessToken,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};



