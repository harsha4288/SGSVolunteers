"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client-ssr';
import { profileLinkingService } from '@/lib/auth/profile-linking-service';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthSessionState {
  user: User | null;
  profile: any | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export interface AuthSessionActions {
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export function useAuthSession(): AuthSessionState & AuthSessionActions {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const refreshSession = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session refresh error:', sessionError);
        setError('Failed to refresh session');
        return;
      }

      if (session?.user) {
        setUser(session.user);
        setSession(session);
        
        // Load profile
        try {
          const result = await profileLinkingService.getCurrentUserProfile();
          
          if (result.success) {
            setProfile(result.profile);
            setError(null);
          } else {
            setError(result.error || 'Failed to load profile');
            setProfile(null);
          }
        } catch (err) {
          console.error('Error loading user profile:', err);
          setError('Failed to load user profile');
          setProfile(null);
        }
      } else {
        setUser(null);
        setSession(null);
        setProfile(null);
      }
    } catch (err) {
      console.error('Error refreshing session:', err);
      setError('Failed to refresh session');
    } finally {
      setLoading(false);
    }
  }, [supabase.auth]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        setError('Failed to sign out');
      } else {
        setUser(null);
        setSession(null);
        setProfile(null);
        setError(null);
      }
    } catch (err) {
      console.error('Error during sign out:', err);
      setError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  }, [supabase.auth]);

  useEffect(() => {
    let mounted = true;

    const loadUserProfile = async (currentUser: User) => {
      try {
        // First try to get current user profile
        const result = await profileLinkingService.getCurrentUserProfile();
        
        if (result.success) {
          setProfile(result.profile);
          setError(null);
        } else {
          // Profile not found, try to link it
          console.log('Profile not linked, attempting to link for user:', currentUser.email);
          const linkResult = await profileLinkingService.linkUserToProfile(currentUser);
          
          if (linkResult.success) {
            setProfile(linkResult.profile);
            setError(null);
            console.log('Successfully linked profile for user:', currentUser.email);
          } else {
            setError(linkResult.error || 'Failed to load profile');
            setProfile(null);
            console.error('Failed to link profile for user:', currentUser.email, linkResult.error);
          }
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
        setError('Failed to load user profile');
        setProfile(null);
      }
    };

    const getInitialSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (sessionError) {
          console.error('Initial session error:', sessionError);
          setError('Failed to get session');
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          setSession(session);
          await loadUserProfile(session.user);
        } else {
          setUser(null);
          setSession(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Error getting initial session:', err);
        if (mounted) {
          setError('Failed to initialize session');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          setUser(session.user);
          setSession(session);
          
          // For SIGNED_IN event (OTP success), wait a bit before loading profile
          // to allow middleware auto-linking to complete
          if (event === 'SIGNED_IN') {
            setTimeout(async () => {
              if (mounted) {
                await loadUserProfile(session.user);
              }
            }, 500);
          } else {
            await loadUserProfile(session.user);
          }
        } else {
          setUser(null);
          setSession(null);
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array to prevent infinite loop

  return {
    user,
    profile,
    session,
    loading,
    error,
    signOut,
    refreshSession
  };
}