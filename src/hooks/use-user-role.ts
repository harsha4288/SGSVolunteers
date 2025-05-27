"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
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
        // TEMPORARY: Force admin access for development
        console.log('FORCING ADMIN ACCESS FOR DEVELOPMENT');
        setRoleInfo({
          isAdmin: true,
          isTeamLead: true,
          isVolunteer: true,
          loading: false,
          error: null,
        });
        return;

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

        console.log('Current user:', user.email);

        // Ensure user has a properly linked profile
        await ensureUserProfile(user.email!, user.id, user.user_metadata?.full_name);

        // Get the user's profile (should exist now)
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profile) {
          // Fallback: try to find by email
          const { data: emailProfile, error: emailError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('email', user.email)
            .single();

          if (emailError || !emailProfile) {
            // For development: grant admin access to any authenticated user
            console.warn('Profile not found for user, granting temporary admin access');
            console.log('Setting admin access: isAdmin=true, isTeamLead=true, isVolunteer=true');
            setRoleInfo({
              isAdmin: true,
              isTeamLead: true,
              isVolunteer: true,
              loading: false,
              error: null,
            });
            return;
          }

          // Use the email-found profile
          profile = emailProfile;
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
          // For development: grant admin access if role check fails
          console.warn('Role check failed, granting temporary admin access');
          console.log('Setting admin access due to role error: isAdmin=true, isTeamLead=true, isVolunteer=true');
          setRoleInfo({
            isAdmin: true,
            isTeamLead: true,
            isVolunteer: true,
            loading: false,
            error: null,
          });
          return;
        }

        const isAdmin = roles?.some(r => r.roles?.role_name === 'Admin') || false;
        const isTeamLead = roles?.some(r => r.roles?.role_name === 'Team Lead') || false;
        const isVolunteer = roles?.some(r => r.roles?.role_name === 'Volunteer') || false;

        // If no roles found but profile exists, grant admin for development
        if (!isAdmin && !isTeamLead && !isVolunteer) {
          console.warn('No roles found for user, granting temporary admin access');
          console.log('Setting admin access due to no roles: isAdmin=true, isTeamLead=true, isVolunteer=true');
          setRoleInfo({
            isAdmin: true,
            isTeamLead: true,
            isVolunteer: true,
            loading: false,
            error: null,
          });
          return;
        }

        console.log('Final role assignment:', { isAdmin, isTeamLead, isVolunteer });
        setRoleInfo({
          isAdmin,
          isTeamLead,
          isVolunteer,
          loading: false,
          error: null,
        });

      } catch (error) {
        // For development: grant admin access if anything fails
        console.warn('User role check failed, granting temporary admin access');
        console.log('Setting admin access due to error: isAdmin=true, isTeamLead=true, isVolunteer=true');
        setRoleInfo({
          isAdmin: true,
          isTeamLead: true,
          isVolunteer: true,
          loading: false,
          error: null,
        });
      }
    };

    checkUserRole();
  }, []);

  return roleInfo;
}
