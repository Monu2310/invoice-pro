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
  // Initialize states with null/false to avoid hydration issues
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Initialize user state from localStorage after component mounts
  useEffect(() => {
    setMounted(true);
    
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (storedUser && token) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            
            // Optionally verify token is still valid
            try {
              const currentUserData = await authService.getCurrentUser();
              if (currentUserData && typeof currentUserData === 'object' && 'name' in currentUserData) {
                setUser(currentUserData as User);
                localStorage.setItem('user', JSON.stringify(currentUserData));
              }
            } catch (apiErr) {
              console.error('Error verifying user data:', apiErr);
              // Keep using stored data if API fails
            }
          } catch (parseErr) {
            console.error('Error parsing stored user:', parseErr);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        }
      } catch (err: unknown) {
        console.error('Auth initialization error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Don't render children until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center items-center">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-indigo-200 rounded mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.login({ email, password });
      
      // Type guard for login response
      if (response && typeof response === 'object' && 'token' in response && 'user' in response) {
        const loginResponse = response as { token: string; user: User };
        
        // Save token and user info to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', loginResponse.token);
          localStorage.setItem('user', JSON.stringify(loginResponse.user));
        }
        
        // Update state
        setUser(loginResponse.user);
        
        // Redirect to dashboard
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(errorMessage);
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