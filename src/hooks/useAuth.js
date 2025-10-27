'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const logout = useCallback(
    async (showMessage = true) => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (error) {
        console.error('Logout API failed:', error);
      } finally {
        setUser(null);
        setIsAuthenticated(false);

        if (showMessage) {
          // You can customize this message or use a toast library
          alert('Your session has expired. Please log in again.');
        }

        router.push('/auth/login');
      }
    },
    [router]
  );

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status) {
          setUser(data.data.user);
          setIsAuthenticated(true);
        } else {
          throw new Error('Authentication failed');
        }
      } else if (response.status === 401) {
        // Token expired or invalid
        await logout(true);
      } else {
        throw new Error('Authentication check failed');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  const handleApiError = useCallback(
    async (response) => {
      if (response.status === 401) {
        const data = await response.json().catch(() => ({}));
        if (
          data.logout ||
          data.message?.includes('expired') ||
          data.message?.includes('Invalid')
        ) {
          await logout(true);
          return true; // Indicates that logout was triggered
        }
      }
      return false;
    },
    [logout]
  );

  useEffect(() => {
    checkAuth();

    // Set up the API client to handle token expiration
    apiClient.setTokenExpiredHandler(() => {
      logout(true);
    });
  }, [checkAuth, logout]);

  return {
    user,
    loading,
    isAuthenticated,
    logout,
    checkAuth,
    handleApiError,
  };
}
