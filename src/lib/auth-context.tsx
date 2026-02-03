'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type UserRole = 'treasurer' | 'president' | 'vice_president' | 'secretary' | 'member';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isTreasurer: boolean;
  isOfficer: boolean;
  checkPositionAvailability: (role: UserRole) => Promise<{ available: boolean; takenBy?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    // Profile is created automatically by database trigger (handle_new_user)
    // which reads full_name and role from user metadata
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role
        }
      }
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const isTreasurer = profile?.role === 'treasurer';
  const isOfficer = ['treasurer', 'president', 'vice_president', 'secretary'].includes(profile?.role || '');

  // Helper to check if position is already taken
  const checkPositionAvailability = async (role: UserRole): Promise<{ available: boolean; takenBy?: string }> => {
    // Members can always register
    if (role === 'member') {
      return { available: true };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('role', role)
        .single();

      // PGRST116 = no rows found (position available)
      if (error?.code === 'PGRST116') {
        return { available: true };
      }

      if (error) {
        console.error('Error checking position:', error);
        throw error;
      }

      // Position is taken
      return { available: false, takenBy: data?.full_name };
    } catch (err) {
      console.error('Error checking position availability:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      isTreasurer,
      isOfficer,
      checkPositionAvailability
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
