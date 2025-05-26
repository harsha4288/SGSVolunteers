'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types/supabase';
import { Pool } from 'pg';

// Function to check admin access using server client
export async function checkAdminAccessServer() {
  try {
    const cookieStore = await cookies();

    // Get all cookies for debugging
    const allCookies = cookieStore.getAll();
    const cookieMap = allCookies.reduce((acc, cookie) => {
      acc[cookie.name] = cookie.value;
      return acc;
    }, {} as Record<string, string>);

    // Check if we have the impersonated profile ID in cookies
    const impersonatedProfileId = cookieStore.get('impersonatedProfileId')?.value;

    // Create Supabase client
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
          storage: {
            getItem: (key: string) => {
              const cookie = cookieStore.get(key);
              return cookie?.value || null;
            },
            setItem: (key: string, value: string) => {
              cookieStore.set(key, value, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7 // 7 days
              });
            },
            removeItem: (key: string) => {
              cookieStore.delete(key);
            }
          }
        }
      }
    );

    // If we're impersonating a user, check if they have admin role directly
    if (impersonatedProfileId) {
      console.log('Checking admin access for impersonated user:', impersonatedProfileId);

      // Check if the impersonated user has admin role
      const { data: roles, error: rolesError } = await supabase
        .from('profile_roles')
        .select(`
          role_id,
          roles:role_id (
            id,
            role_name
          )
        `)
        .eq('profile_id', impersonatedProfileId);

      if (rolesError) {
        return {
          isAdmin: false,
          error: `Error checking roles: ${rolesError.message}`,
          debug: {
            method: 'impersonation',
            impersonatedProfileId,
            cookies: cookieMap,
            error: rolesError
          }
        };
      }

      const adminRole = roles?.find(r => r.roles.role_name === 'Admin');
      const isAdmin = !!adminRole;

      return {
        isAdmin,
        error: null,
        debug: {
          method: 'impersonation',
          impersonatedProfileId,
          cookies: cookieMap,
          roles: roles?.map(r => r.roles),
          adminRole
        }
      };
    }

    // If not impersonating, check the authenticated user
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      return {
        isAdmin: false,
        error: `Authentication error: ${userError.message}`,
        debug: {
          method: 'auth',
          cookies: cookieMap,
          error: userError
        }
      };
    }

    if (!user) {
      return {
        isAdmin: false,
        error: 'Not authenticated',
        debug: {
          method: 'auth',
          cookies: cookieMap,
          user: null
        }
      };
    }

    // Check if the user has admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      return {
        isAdmin: false,
        error: `Profile error: ${profileError.message}`,
        debug: {
          method: 'auth',
          userId: user.id,
          cookies: cookieMap,
          error: profileError
        }
      };
    }

    if (!profile) {
      return {
        isAdmin: false,
        error: 'Profile not found',
        debug: {
          method: 'auth',
          userId: user.id,
          cookies: cookieMap,
          profile: null
        }
      };
    }

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
      return {
        isAdmin: false,
        error: `Role check error: ${rolesError.message}`,
        debug: {
          method: 'auth',
          userId: user.id,
          profileId: profile.id,
          cookies: cookieMap,
          error: rolesError
        }
      };
    }

    const adminRole = roles?.find(r => r.roles.role_name === 'Admin');
    const isAdmin = !!adminRole;

    return {
      isAdmin,
      error: null,
      debug: {
        method: 'auth',
        userId: user.id,
        profileId: profile.id,
        cookies: cookieMap,
        roles: roles?.map(r => r.roles),
        adminRole
      }
    };
  } catch (error) {
    console.error('Unexpected error in checkAdminAccessServer:', error);
    return {
      isAdmin: false,
      error: error instanceof Error ? error.message : 'Unknown error checking admin access',
      debug: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

// Function to check admin access using direct database connection
export async function checkAdminAccessDirect() {
  try {
    const cookieStore = cookies();

    // Get all cookies for debugging
    const allCookies = cookieStore.getAll();
    const cookieMap = allCookies.reduce((acc, cookie) => {
      acc[cookie.name] = cookie.value;
      return acc;
    }, {} as Record<string, string>);

    // Check if we have the impersonated profile ID in cookies
    const impersonatedProfileId = cookieStore.get('impersonatedProfileId')?.value;

    // Create a connection pool
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
      // If we're impersonating a user, check if they have admin role directly
      if (impersonatedProfileId) {
        console.log('Checking admin access for impersonated user (direct):', impersonatedProfileId);

        // Check if the impersonated user has admin role
        const result = await client.query(`
          SELECT
            pr.role_id,
            r.role_name
          FROM
            public.profile_roles pr
          JOIN
            public.roles r ON pr.role_id = r.id
          WHERE
            pr.profile_id = $1 AND r.role_name = 'Admin'
        `, [impersonatedProfileId]);

        const isAdmin = result.rowCount > 0;

        return {
          isAdmin,
          error: null,
          debug: {
            method: 'impersonation-direct',
            impersonatedProfileId,
            cookies: cookieMap,
            roles: result.rows,
            rowCount: result.rowCount
          }
        };
      }

      // If not impersonating, we need to get the user from Supabase auth
      // Create Supabase client
      const supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
            storage: {
              getItem: (key: string) => {
                const cookie = cookieStore.get(key);
                return cookie?.value || null;
              },
              setItem: (key: string, value: string) => {
                cookieStore.set(key, value, {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax',
                  maxAge: 60 * 60 * 24 * 7 // 7 days
                });
              },
              removeItem: (key: string) => {
                cookieStore.delete(key);
              }
            }
          }
        }
      );

      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        return {
          isAdmin: false,
          error: `Authentication error: ${userError.message}`,
          debug: {
            method: 'auth-direct',
            cookies: cookieMap,
            error: userError
          }
        };
      }

      if (!user) {
        return {
          isAdmin: false,
          error: 'Not authenticated',
          debug: {
            method: 'auth-direct',
            cookies: cookieMap,
            user: null
          }
        };
      }

      // Get the profile ID
      const profileResult = await client.query(`
        SELECT id FROM public.profiles WHERE user_id = $1
      `, [user.id]);

      if (profileResult.rowCount === 0) {
        return {
          isAdmin: false,
          error: 'Profile not found',
          debug: {
            method: 'auth-direct',
            userId: user.id,
            cookies: cookieMap,
            profile: null
          }
        };
      }

      const profileId = profileResult.rows[0].id;

      // Check if the user has admin role
      const rolesResult = await client.query(`
        SELECT
          pr.role_id,
          r.role_name
        FROM
          public.profile_roles pr
        JOIN
          public.roles r ON pr.role_id = r.id
        WHERE
          pr.profile_id = $1 AND r.role_name = 'Admin'
      `, [profileId]);

      const isAdmin = rolesResult.rowCount > 0;

      return {
        isAdmin,
        error: null,
        debug: {
          method: 'auth-direct',
          userId: user.id,
          profileId,
          cookies: cookieMap,
          roles: rolesResult.rows,
          rowCount: rolesResult.rowCount
        }
      };
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Unexpected error in checkAdminAccessDirect:', error);
    return {
      isAdmin: false,
      error: error instanceof Error ? error.message : 'Unknown error checking admin access',
      debug: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}
