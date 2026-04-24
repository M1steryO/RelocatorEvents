import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import { eventsService } from '../services/eventsService';
import { favouritesService } from '../services/favouritesService';
import { isTelegramMiniApp } from '../utils/telegramInitData';

const ACCESS_TOKEN_STORAGE_KEY = 'auth_access_token';
const REFRESH_TOKEN_COOKIE_KEY = 'refresh_token';

interface User {
  id: number;
  name: string;
  email?: string;
  country?: string;
  city?: string;
  language?: string;
  interests?: string[];
  collections?: string[];
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
  refreshUser: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);

  const applyTokenToServices = useCallback((accessToken: string | null) => {
    authService.setAccessToken(accessToken);
    eventsService.setAccessToken(accessToken);
    favouritesService.setAccessToken(accessToken);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrapUser = async () => {
      setIsLoading(true);
      applyTokenToServices(token);

      const shouldTrySessionBootstrap = Boolean(token) || isTelegramMiniApp();
      if (!shouldTrySessionBootstrap) {
        setUserState(null);
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const userData = await authService.getCurrentUser();
        if (cancelled) return;
        setUserState({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          country: userData.country,
          city: userData.city,
          language: userData.language,
          interests: userData.interests,
          collections: userData.collections,
        });
      } catch {
        if (cancelled) return;
        setUserState(null);
        if (token) {
          setToken(null);
          writeStoredToken(null);
          applyTokenToServices(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    bootstrapUser();
    return () => {
      cancelled = true;
    };
  }, [token, applyTokenToServices]);

  const login = (accessToken: string, newUser: User) => {
    setIsLoading(true);
    setToken(accessToken);
    writeStoredToken(accessToken);
    setUserState(newUser);
    applyTokenToServices(accessToken);
  };

  const setAccessToken = (accessToken: string) => {
    setIsLoading(true);
    setToken(accessToken);
    writeStoredToken(accessToken);
    applyTokenToServices(accessToken);
  };

  const logout = () => {
    setToken(null);
    writeStoredToken(null);
    document.cookie = `${REFRESH_TOKEN_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
    setUserState(null);
    applyTokenToServices(null);
    setIsLoading(false);
  };

  const setUser = (newUser: User) => {
    setUserState(newUser);
  };

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUserState(null);
      return;
    }

    const userData = await authService.getCurrentUser();
    setUserState({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      country: userData.country,
      city: userData.city,
      language: userData.language,
      interests: userData.interests,
      collections: userData.collections,
    });
  }, [token]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token || !!user,
    isLoading,
    login,
    setAccessToken,
    logout,
    setUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};



