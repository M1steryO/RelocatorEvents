import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import { eventsService } from '../services/eventsService';
import { favouritesService } from '../services/favouritesService';

const ACCESS_TOKEN_STORAGE_KEY = 'auth_access_token';

interface User {
  id: number;
  name: string;
  country?: string;
  city?: string;
  interests?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
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

function readStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

function writeStoredToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token == null) sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  else sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const isLoading = false;

  useEffect(() => {
    const stored = readStoredToken();
    if (stored) {
      authService.setAccessToken(stored);
      eventsService.setAccessToken(stored);
      favouritesService.setAccessToken(stored);
    }
  }, []); // при монтировании прокидываем восстановленный токен в сервисы

  const login = (accessToken: string, newUser: User) => {
    setToken(accessToken);
    writeStoredToken(accessToken);
    setUserState(newUser);
    authService.setAccessToken(accessToken);
    eventsService.setAccessToken(accessToken);
    favouritesService.setAccessToken(accessToken);
  };

  const setAccessToken = (accessToken: string) => {
    setToken(accessToken);
    writeStoredToken(accessToken);
    authService.setAccessToken(accessToken);
    eventsService.setAccessToken(accessToken);
    favouritesService.setAccessToken(accessToken);
  };

  const logout = () => {
    setToken(null);
    writeStoredToken(null);
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
    isAuthenticated: !!user,
    isLoading,
    login,
    setAccessToken,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};



