'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("Attempting login via custom API...");
      
      // Call the specific login API endpoint
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      console.log("Login successful:", data);

      // Store user data for session management
      if (data.user) {
        // Log the full user object to inspect structure
        console.log("Complete user data from login:", data.user);
        
        // Store complete user data in localStorage
        localStorage.setItem('user_data', JSON.stringify(data.user));
        
        // Find and store the correct ID (MongoDB usually uses _id)
        const userId = data.user._id || data.user.id;
        
        if (userId) {
          localStorage.setItem('user_id', userId);
          console.log("Saved user ID to localStorage:", userId);
        } else {
          console.warn("Could not find user ID in response:", data.user);
        }
        
        // Also set up a session if you need it for existing components
        try {
          // Create a Supabase session with the user information
          // This is optional and depends on your architecture
          const { error: sessionError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (sessionError) {
            console.warn("Could not establish Supabase session:", sessionError);
            // Continue anyway since we have user data in localStorage
          }
        } catch (sessionErr) {
          console.warn("Error setting up session:", sessionErr);
          // Continue with local authentication
        }
        
        // Redirect to dashboard
        router.push('/dashboard');
        router.refresh();
      } else {
        throw new Error('Login successful but user data is missing');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || 'An unknown error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
          <div className="flex items-center justify-between mt-1">
            <div className="text-xs">
              <a href="/forgot-password" className="text-blue-500 hover:text-blue-700">
                Forgot Password?
              </a>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Logging in...</span>
              </div>
            ) : 'Login'}
          </button>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-500 hover:text-blue-700">
              Sign Up
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}