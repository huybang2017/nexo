import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { setAuthTokens, clearAuthTokens, getAccessToken } from '@/lib/api';
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<AuthResponse>;
  register: (data: RegisterRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const isAuthenticated = !!user;

  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          queryClient.setQueryData(['currentUser'], currentUser);
        } catch (error) {
          clearAuthTokens();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [queryClient]);

  const login = async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await authService.login(data);
    setAuthTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
    queryClient.setQueryData(['currentUser'], response.user);
    return response;
  };

  const register = async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await authService.register(data);
    setAuthTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
    queryClient.setQueryData(['currentUser'], response.user);
    return response;
  };

  const logout = async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await authService.logout(refreshToken || undefined);
    } catch (error) {
      // Ignore logout errors
    } finally {
      clearAuthTokens();
      setUser(null);
      queryClient.clear();
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      queryClient.setQueryData(['currentUser'], currentUser);
    } catch (error) {
      clearAuthTokens();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

