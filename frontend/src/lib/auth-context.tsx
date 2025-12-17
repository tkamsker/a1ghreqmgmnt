'use client';

import { useMutation } from '@apollo/client';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { LOGIN_MUTATION, LOGOUT_MUTATION, REFRESH_TOKEN_MUTATION } from './graphql/mutations/auth';

export enum UserType {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PROJECT_ADMIN = 'PROJECT_ADMIN',
  CONTRIBUTOR = 'CONTRIBUTOR',
  REVIEWER = 'REVIEWER',
}

export interface User {
  id: string;
  username: string;
  email: string | null;
  longName: string;
  userType: UserType;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [loginMutation] = useMutation(LOGIN_MUTATION);
  const [logoutMutation] = useMutation(LOGOUT_MUTATION);
  const [refreshTokenMutation] = useMutation(REFRESH_TOKEN_MUTATION);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      try {
        setAccessToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  // Setup token refresh interval
  useEffect(() => {
    if (!accessToken) return;

    // Refresh token every 14 minutes (tokens expire in 15 minutes)
    const interval = setInterval(
      async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) return;

        try {
          const { data } = await refreshTokenMutation({
            variables: { refreshToken },
          });

          if (data?.refreshToken) {
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
              data.refreshToken;
            setAccessToken(newAccessToken);
            localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
            localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          // If refresh fails, log out
          await logout();
        }
      },
      14 * 60 * 1000,
    ); // 14 minutes

    return () => clearInterval(interval);
  }, [accessToken, refreshTokenMutation]);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await loginMutation({
        variables: { email, password },
      });

      if (data?.login) {
        const { accessToken, refreshToken, user } = data.login;

        setAccessToken(accessToken);
        setUser(user);

        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation();
    } catch (error) {
      console.error('Logout mutation failed:', error);
    } finally {
      // Clear state regardless of mutation success
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  };

  const value: AuthContextType = {
    user,
    accessToken,
    loading,
    login,
    logout,
    isAuthenticated: !!user && !!accessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
