  import { createContext, useContext, useState, useEffect } from 'react';
  import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import { eventsService } from '../services/eventsService';

interface User {
  id: number;
  name: string;
  country?: string;
  city?: string;
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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  // Function to refresh refresh token (uses refresh token from http-only cookie)

  useEffect(() => {
    // No need to restore token on init - check-access will handle authentication
    // Refresh token is http-only cookie, cannot be read from JavaScript
    setIsLoading(false);
  }, []);

  const login = (accessToken: string, newUser: User) => {
    setToken(accessToken); // Store only in memory
    setUserState(newUser); // Store only in memory
    authService.setAccessToken(accessToken); // Update authService token
    eventsService.setAccessToken(accessToken); // Update eventsService token
  };

  const setAccessToken = (accessToken: string) => {
    setToken(accessToken); // Store only in memory
    authService.setAccessToken(accessToken); // Update authService token (synchronous)
    eventsService.setAccessToken(accessToken); // Update eventsService token
  };

  const logout = () => {
    setToken(null);
    setUserState(null);
    authService.setAccessToken(null); // Clear authService token
    eventsService.setAccessToken(null); // Clear eventsService token
    // Note: refresh token in cookie will be cleared by server on logout
  };

  const setUser = (newUser: User) => {
    setUserState(newUser); // Store only in memory
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    setAccessToken,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};



