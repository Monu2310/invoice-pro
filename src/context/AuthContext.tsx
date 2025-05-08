'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/api';

// Define types for our context
interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => {},
  logout: () => {},
});

// Export custom hook for using our auth context
export const useAuth = () => useContext(AuthContext);

// Auth Provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize user state directly from localStorage if possible
  const initializeUserFromStorage = () => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          return JSON.parse(storedUser);
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    return null;
  };

  const [user, setUser] = useState<User | null>(initializeUserFromStorage());
  const [isLoading, setIsLoading] = useState(typeof window !== 'undefined' && !!localStorage.getItem('token'));
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Only proceed if we have a token
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('token');
          
          if (!token) {
            setIsLoading(false);
            return;
          }
          
          // Only fetch user data if we don't already have it
          if (!user) {
            setIsLoading(true);
            try {
              const userData = await authService.getCurrentUser();
              if (userData) {
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
              }
            } catch (apiErr) {
              console.error('Error fetching user data:', apiErr);
              // Don't logout if API fails - rely on stored data
            } finally {
              setIsLoading(false);
            }
          } else {
            // We already have user data from localStorage
            setIsLoading(false);
          }
        }
      } catch (err: any) {
        console.error('Auth check error:', err);
        setError(err.message || 'Authentication failed');
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, [user]);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.login({ email, password });
      
      // Save token and user info to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      // Update state
      setUser(response.user);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    
    // Update state
    setUser(null);
    
    // Redirect to login page
    router.push('/');
  };

  // Create value object for our context
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};