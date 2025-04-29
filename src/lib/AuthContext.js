//AuthContext.js
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);

      // Set up listener for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user || null);
        }
      );

      return () => {
        subscription?.unsubscribe();
      };
    };

    checkSession();
  }, []);

  // Get user profile data
  const getUserProfile = async () => {
    if (!user) return null;

    console.log("Fetching profile for user ID:", user.id);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error.message, error.details, error.hint);
        return null;
      }

      console.log("Profile data retrieved:", data);
      return data;
    } catch (err) {
      console.error('Exception in getUserProfile:', err);
      return null;
    }
  };

  const value = {
    user,
    loading,
    getUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};