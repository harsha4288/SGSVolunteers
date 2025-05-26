"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

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

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          setRoleInfo({
            isAdmin: false,
            isTeamLead: false,
            isVolunteer: false,
            loading: false,
            error: 'Not authenticated',
          });
          return;
        }

        // Get the user's profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profile) {
          setRoleInfo({
            isAdmin: false,
            isTeamLead: false,
            isVolunteer: false,
            loading: false,
            error: 'Profile not found',
          });
          return;
        }

        // Get user roles
        const { data: roles, error: rolesError } = await supabase
          .from('profile_roles')
          .select(`
            role_id,
            roles:role_id (
              id,
              role_name
            )
          `)
          .eq('profile_id', profile.id);

        if (rolesError) {
          setRoleInfo({
            isAdmin: false,
            isTeamLead: false,
            isVolunteer: false,
            loading: false,
            error: `Error checking roles: ${rolesError.message}`,
          });
          return;
        }

        const isAdmin = roles?.some(r => r.roles?.role_name === 'Admin') || false;
        const isTeamLead = roles?.some(r => r.roles?.role_name === 'Team Lead') || false;
        const isVolunteer = roles?.some(r => r.roles?.role_name === 'Volunteer') || false;

        setRoleInfo({
          isAdmin,
          isTeamLead,
          isVolunteer,
          loading: false,
          error: null,
        });

      } catch (error) {
        setRoleInfo({
          isAdmin: false,
          isTeamLead: false,
          isVolunteer: false,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error checking user role',
        });
      }
    };

    checkUserRole();
  }, []);

  return roleInfo;
}
