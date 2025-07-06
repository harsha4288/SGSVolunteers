"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client-ssr';
import { ensureUserProfile } from '@/lib/utils/user-profile-setup';

export interface UserRole {
  isAdmin: boolean;
  isTeamLead: boolean;
  isVolunteer: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to check the current user's role
 * Returns role information for conditional rendering
 */
export function useUserRole(): UserRole {
  const [roleInfo, setRoleInfo] = useState<UserRole>({
    isAdmin: false,
    isTeamLead: false,
    isVolunteer: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const supabase = createClient();

        // Get the current authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error('Auth check failed:', userError);
          setRoleInfo({
            isAdmin: false,
            isTeamLead: false,
            isVolunteer: false,
            loading: false,
            error: 'Not authenticated',
          });
          return;
        }

        // Check for user.email as it's used in profile lookup
        if (!user.email) {
          console.error('User authenticated but email is missing.');
          setRoleInfo({
            isAdmin: false,
            isTeamLead: false,
            isVolunteer: false,
            loading: false,
            error: 'User email is missing and is required for profile lookup.',
          });
          return;
        }

        // Get the user's profile
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profile) {
          console.warn(`Profile not found for user ${user.id} (email: ${user.email}). Setting default roles.`);
          setRoleInfo({
            isAdmin: false,
            isTeamLead: false,
            isVolunteer: false,
            loading: false,
            error: 'User profile not found.',
          });
          return;
        }

        const profileToCheck = profile;
        console.log('Using authenticated user profile:', profileToCheck);

        // Get user roles for the authenticated user's profile
        const { data: roles, error: rolesError } = await supabase
          .from('profile_roles')
          .select(`
            role_id,
            roles:role_id (
              id,
              role_name
            )
          `)
          .eq('profile_id', profileToCheck.id);

        console.log('Role lookup result:', { roles, rolesError });

        if (rolesError) {
          console.error('Error fetching roles:', rolesError.message);
          setRoleInfo({
            isAdmin: false,
            isTeamLead: false,
            isVolunteer: false,
            loading: false,
            error: 'Failed to fetch user roles.',
          });
          return;
        }

        const isAdmin = roles?.some(r => r.roles?.role_name === 'Admin') || false;
        const isTeamLead = roles?.some(r => r.roles?.role_name === 'Team Lead') || false;
        const isVolunteer = roles?.some(r => r.roles?.role_name === 'Volunteer') || false;

        console.log('Role check results:', {
          roles: roles?.map(r => r.roles?.role_name),
          isAdmin,
          isTeamLead,
          isVolunteer
        });

        setRoleInfo({
          isAdmin,
          isTeamLead,
          isVolunteer,
          loading: false,
          error: null,
        });

      } catch (error: any) {
        console.error('User role check failed:', error);
        setRoleInfo({
          isAdmin: false,
          isTeamLead: false,
          isVolunteer: false,
          loading: false,
          error: error?.message || 'An unexpected error occurred while checking user role.',
        });
      }
    };

    checkUserRole();
  }, []);

  return roleInfo;
}
