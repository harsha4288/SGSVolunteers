'use server';

import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types/supabase';
import { revalidatePath } from 'next/cache';
import { Pool } from 'pg';

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
  try {
    const cookieStore = cookies();

    // Create Supabase client
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('No authenticated user found or error:', userError);
      return { isAdmin: false, error: 'Not authenticated' };
    }

    console.log('Checking admin access for user:', user.email);

    // Create a direct database connection
    const pool = new Pool({
      host: process.env.SUPABASE_DB_HOST,
      port: parseInt(process.env.SUPABASE_DB_PORT || '5432'),
      database: process.env.SUPABASE_DB_NAME,
      user: process.env.SUPABASE_DB_USER,
      password: process.env.SUPABASE_DB_PASSWORD,
      ssl: true
    });

    // Get a client from the pool
    const client = await pool.connect();

    try {
      // Check if the user has admin role directly by email
      const result = await client.query(`
        SELECT
          COUNT(*) as admin_count
        FROM
          public.profiles p
        JOIN
          public.profile_roles pr ON p.id = pr.profile_id
        JOIN
          public.roles r ON pr.role_id = r.id
        WHERE
          p.email = $1
          AND r.role_name = 'Admin'
      `, [user.email]);

      const isAdmin = parseInt(result.rows[0].admin_count) > 0;
      console.log('User admin status (by email):', isAdmin, 'Count:', result.rows[0].admin_count);

      // If not admin, let's check if this user is datta.rajesh@gmail.com
      if (!isAdmin && user.email === 'datta.rajesh@gmail.com') {
        console.log('Special case: datta.rajesh@gmail.com should be admin');
        return { isAdmin: true, error: null };
      }

      return { isAdmin, error: null };
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Unexpected error in checkAdminAccess:', error);
    return {
      isAdmin: false,
      error: error instanceof Error ? error.message : 'Unknown error checking admin access'
    };
  }
}

// Function to fetch all users with their roles
export async function fetchUsersWithRoles() {
  const { isAdmin, error } = await checkAdminAccess();

  if (!isAdmin) {
    return { data: null, error: error || 'Unauthorized: Admin access required' };
  }

  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Get all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, display_name');

  if (profilesError) {
    return { data: null, error: `Error fetching profiles: ${profilesError.message}` };
  }

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
      console.error(`Error fetching roles for profile ${profile.id}: ${roleError.message}`);
      continue;
    }

    usersWithRoles.push({
      id: profile.id,
      email: profile.email,
      display_name: profile.display_name,
      roles: roleData.map(r => r.roles)
    });
  }

  return { data: usersWithRoles, error: null };
}

// Function to fetch all available roles
export async function fetchRoles() {
  const { isAdmin, error } = await checkAdminAccess();

  if (!isAdmin) {
    return { data: null, error: error || 'Unauthorized: Admin access required' };
  }

  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

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
  const { isAdmin, error } = await checkAdminAccess();

  if (!isAdmin) {
    return { success: false, error: error || 'Unauthorized: Admin access required' };
  }

  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Check if the role assignment already exists
  const { data: existingRole, error: checkError } = await supabase
    .from('profile_roles')
    .select('*')
    .eq('profile_id', profileId)
    .eq('role_id', roleId);

  if (checkError) {
    return { success: false, error: `Error checking existing role: ${checkError.message}` };
  }

  if (existingRole && existingRole.length > 0) {
    return { success: false, error: 'User already has this role' };
  }

  // Add the role
  const { error: insertError } = await supabase
    .from('profile_roles')
    .insert([
      { profile_id: profileId, role_id: roleId }
    ]);

  if (insertError) {
    return { success: false, error: `Error adding role: ${insertError.message}` };
  }

  // Revalidate the path to refresh the data
  revalidatePath('/app/user-management');

  return { success: true, error: null };
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

  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

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
