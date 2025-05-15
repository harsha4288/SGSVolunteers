'use server';

import { cookies } from 'next/headers';
import type { Database } from '@/lib/types/supabase';
import { revalidatePath } from 'next/cache';
import { Pool } from 'pg';
import { hardcodedAdminCheck } from '../admin-override';
import { createSupabaseServerActionClient } from '@/lib/supabase/server-actions';

// Define types for our data
export type UserWithRoles = {
  id: string;
  email: string;
  display_name: string | null;
  roles: {
    id: number;
    role_name: string;
  }[];
};

export type Role = {
  id: number;
  role_name: string;
  description: string | null;
};

// Function to check if the current user has admin role
export async function checkAdminAccess() {
  // Use the hardcoded admin check instead of database queries
  // This is a temporary solution until we fix the database connection issues
  return hardcodedAdminCheck();
}

// Function to fetch users with their roles with pagination and search
export async function fetchUsersWithRoles(page = 1, pageSize = 10, searchQuery = '') {
  try {
    console.log(`Fetching users with roles - page: ${page}, pageSize: ${pageSize}, search: "${searchQuery}"`);

    const { isAdmin, error } = await checkAdminAccess();

    if (!isAdmin) {
      return {
        data: null,
        totalCount: 0,
        error: error || 'Unauthorized: Admin access required'
      };
    }

    const supabase = createSupabaseServerActionClient();
    let query = supabase.from('profiles').select('id, email, display_name');

    // Apply search filter if provided
    if (searchQuery && searchQuery.trim() !== '') {
      const searchTerm = `%${searchQuery.trim().toLowerCase()}%`;
      query = query.or(`email.ilike.${searchTerm},display_name.ilike.${searchTerm}`);
    }

    // Get total count of filtered profiles
    // First get the count using a separate query
    const { data: countData, error: countError } = await query.select('id');
    const count = countData ? countData.length : 0;

    if (countError) {
      console.error('Error getting profile count:', countError);
      return {
        data: null,
        totalCount: 0,
        error: `Error getting profile count: ${countError.message}`
      };
    }

    // Calculate range for pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Get paginated and filtered profiles
    let filteredQuery = supabase.from('profiles').select('id, email, display_name');

    // Apply the same search filter
    if (searchQuery && searchQuery.trim() !== '') {
      const searchTerm = `%${searchQuery.trim().toLowerCase()}%`;
      filteredQuery = filteredQuery.or(`email.ilike.${searchTerm},display_name.ilike.${searchTerm}`);
    }

    const { data: profiles, error: profilesError } = await filteredQuery
      .range(from, to)
      .order('email', { ascending: true });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return {
        data: null,
        totalCount: count || 0,
        error: `Error fetching profiles: ${profilesError.message}`
      };
    }

    console.log(`Fetched ${profiles.length} profiles out of ${count} total matching search "${searchQuery}"`);

    // Get all roles for each profile
    const usersWithRoles: UserWithRoles[] = [];

    for (const profile of profiles) {
      const { data: roleData, error: roleError } = await supabase
        .from('profile_roles')
        .select(`
          role_id,
          roles:role_id (
            id,
            role_name
          )
        `)
        .eq('profile_id', profile.id);

      if (roleError) {
        console.error(`Error fetching roles for profile ${profile.id}:`, roleError);
        continue;
      }

      usersWithRoles.push({
        id: profile.id,
        email: profile.email,
        display_name: profile.display_name,
        roles: roleData.map(r => r.roles)
      });
    }

    return {
      data: usersWithRoles,
      totalCount: count || 0,
      error: null
    };
  } catch (error) {
    console.error('Unexpected error in fetchUsersWithRoles:', error);
    return {
      data: null,
      totalCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error fetching users'
    };
  }
}

// Function to fetch all available roles
export async function fetchRoles() {
  const { isAdmin, error } = await checkAdminAccess();

  if (!isAdmin) {
    return { data: null, error: error || 'Unauthorized: Admin access required' };
  }

  const supabase = createSupabaseServerActionClient();

  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select('*');

  if (rolesError) {
    return { data: null, error: `Error fetching roles: ${rolesError.message}` };
  }

  return { data: roles, error: null };
}

// Function to add a role to a user
export async function addRoleToUser(profileId: string, roleId: number) {
  try {
    console.log(`Adding role ${roleId} to user ${profileId}`);

    const { isAdmin, error } = await checkAdminAccess();

    if (!isAdmin) {
      console.log('Admin access check failed:', error);
      return { success: false, error: error || 'Unauthorized: Admin access required' };
    }

    const supabase = createSupabaseServerActionClient();

    // Check if the role assignment already exists
    console.log('Checking if role assignment already exists...');
    const { data: existingRole, error: checkError } = await supabase
      .from('profile_roles')
      .select('*')
      .eq('profile_id', profileId)
      .eq('role_id', roleId);

    if (checkError) {
      console.error('Error checking existing role:', checkError);
      return { success: false, error: `Error checking existing role: ${checkError.message}` };
    }

    if (existingRole && existingRole.length > 0) {
      console.log('User already has this role');
      return { success: false, error: 'User already has this role' };
    }

    // Add the role
    console.log('Inserting new role assignment...');
    const { error: insertError } = await supabase
      .from('profile_roles')
      .insert([
        { profile_id: profileId, role_id: roleId, assigned_at: new Date().toISOString() }
      ]);

    if (insertError) {
      console.error('Error adding role:', insertError);
      return { success: false, error: `Error adding role: ${insertError.message}` };
    }

    console.log('Role added successfully');

    // Revalidate the path to refresh the data
    revalidatePath('/app/user-management');

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error in addRoleToUser:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error adding role'
    };
  }
}

// Function to remove a role from a user
export async function removeRoleFromUser(profileId: string, roleId: number) {
  const { isAdmin, error } = await checkAdminAccess();

  if (!isAdmin) {
    return { success: false, error: error || 'Unauthorized: Admin access required' };
  }

  // Don't allow removing the Volunteer role (ID: 3)
  if (roleId === 3) {
    return { success: false, error: 'Cannot remove the Volunteer role' };
  }

  const supabase = createSupabaseServerActionClient();

  // Remove the role
  const { error: deleteError } = await supabase
    .from('profile_roles')
    .delete()
    .eq('profile_id', profileId)
    .eq('role_id', roleId);

  if (deleteError) {
    return { success: false, error: `Error removing role: ${deleteError.message}` };
  }

  // Revalidate the path to refresh the data
  revalidatePath('/app/user-management');

  return { success: true, error: null };
}
