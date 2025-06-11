'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { login, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const currentYear = new Date().getFullYear();

  // Fix hydration by ensuring component is mounted
  useEffect(() => {
    setMounted(true);
    
    // Test backend connectivity
    const testBackendConnection = async () => {
      try {
        const response = await fetch('http://localhost:5002/');
        if (response.ok) {
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
        }
      } catch (error) {
        console.error('Backend connection test failed:', error);
        setBackendStatus('error');
      }
    };
    
    testBackendConnection();
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await login(email, password);
      // No need to redirect here as the auth context handles it
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="px-8 pt-8 pb-6 text-center">
            <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">InvoicePro</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Modern invoice management solution</p>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="px-8 pt-8 pb-6 text-center">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">InvoicePro</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Modern invoice management solution</p>
          
          {/* Backend Status Indicator */}
          <div className="mb-4 p-2 rounded-md text-xs">
            {backendStatus === 'checking' && (
              <div className="text-gray-500">
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-2 animate-pulse"></span>
                Connecting to server...
              </div>
            )}
            {backendStatus === 'connected' && (
              <div className="text-green-600">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Server connected
              </div>
            )}
            {backendStatus === 'error' && (
              <div className="text-red-600">
                <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                Server connection failed
              </div>
            )}
          </div>
          
          {(error || authError) && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error || authError}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div className="relative">
              <input 
                type="email" 
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" 
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <input 
                type="password" 
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" 
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                  Forgot password?
                </a>
              </div>
            </div>
            
            <button 
              type="submit"
              className="w-full block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-4 py-3 transition duration-200"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Don&apos;t have an account? </span>
            <Link href="/register" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Create an account
            </Link>
          </div>
        </div>
        
        <div className="px-8 py-4 bg-gray-50 dark:bg-gray-700 text-center text-sm text-gray-600 dark:text-gray-300">
          <p>© {currentYear} InvoicePro. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}