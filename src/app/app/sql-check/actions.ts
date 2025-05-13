'use server';

import { Pool } from 'pg';

// Function to run a SQL query and return the results
export async function runSqlQuery(query: string) {
  try {
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
      // Run the query
      const result = await client.query(query);

      return {
        success: true,
        data: result.rows,
        rowCount: result.rowCount,
        fields: result.fields.map(f => f.name)
      };
    } catch (error) {
      console.error('Error executing query:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error executing query'
      };
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error connecting to database'
    };
  }
}

// Function to check all roles
export async function checkRoles() {
  return runSqlQuery(`
    SELECT * FROM public.roles;
  `);
}

// Function to check all profile_roles assignments
export async function checkProfileRoles() {
  return runSqlQuery(`
    SELECT
      pr.profile_id,
      pr.role_id,
      r.role_name,
      p.email,
      p.user_id
    FROM
      public.profile_roles pr
    JOIN
      public.roles r ON pr.role_id = r.id
    JOIN
      public.profiles p ON pr.profile_id = p.id
    ORDER BY
      p.email, r.role_name;
  `);
}

// Function to check if datta.rajesh@gmail.com has the Admin role
export async function checkSpecificUserRole() {
  return runSqlQuery(`
    SELECT
      p.id AS profile_id,
      p.email,
      p.user_id,
      r.id AS role_id,
      r.role_name
    FROM
      public.profiles p
    LEFT JOIN
      public.profile_roles pr ON p.id = pr.profile_id
    LEFT JOIN
      public.roles r ON pr.role_id = r.id
    WHERE
      p.email = 'datta.rajesh@gmail.com';
  `);
}

// Function to check all users with Admin role
export async function checkAdminUsers() {
  return runSqlQuery(`
    SELECT
      p.id AS profile_id,
      p.email,
      p.user_id,
      r.id AS role_id,
      r.role_name
    FROM
      public.profiles p
    JOIN
      public.profile_roles pr ON p.id = pr.profile_id
    JOIN
      public.roles r ON pr.role_id = r.id
    WHERE
      r.role_name = 'Admin';
  `);
}

// Function to check all profiles
export async function checkProfiles() {
  return runSqlQuery(`
    SELECT
      id,
      email,
      user_id,
      display_name
    FROM
      public.profiles;
  `);
}

// Function to check if the admin role assignment trigger is working
export async function checkTriggerStats() {
  return runSqlQuery(`
    SELECT
      COUNT(*) AS profiles_count,
      (SELECT COUNT(*) FROM public.profile_roles WHERE role_id = 3) AS volunteer_role_count
    FROM
      public.profiles;
  `);
}

// Function to check if the admin role exists with ID 1
export async function checkAdminRoleExists() {
  return runSqlQuery(`
    SELECT * FROM public.roles WHERE id = 1;
  `);
}

// Function to check if any roles have been assigned to profiles
export async function checkRoleAssignments() {
  return runSqlQuery(`
    SELECT COUNT(*) FROM public.profile_roles;
  `);
}

// Function to check if the trigger for assigning default volunteer role exists
export async function checkTriggerExists() {
  return runSqlQuery(`
    SELECT
      tgname AS trigger_name,
      proname AS function_name
    FROM
      pg_trigger t
    JOIN
      pg_proc p ON t.tgfoid = p.oid
    JOIN
      pg_class c ON t.tgrelid = c.oid
    WHERE
      c.relname = 'profiles';
  `);
}

// Function to assign admin role to the current user
export async function assignAdminRoleToUser(email: string) {
  // First, get the profile ID for the email
  const profileResult = await runSqlQuery(`
    SELECT id FROM public.profiles WHERE email = '${email}';
  `);

  if (!profileResult.success || profileResult.rowCount === 0) {
    return {
      success: false,
      error: 'Profile not found for email: ' + email
    };
  }

  const profileId = profileResult.data[0].id;

  // Check if the user already has the admin role
  const roleCheckResult = await runSqlQuery(`
    SELECT * FROM public.profile_roles
    WHERE profile_id = '${profileId}' AND role_id = 1;
  `);

  if (!roleCheckResult.success) {
    return {
      success: false,
      error: 'Error checking existing role: ' + roleCheckResult.error
    };
  }

  if (roleCheckResult.rowCount > 0) {
    return {
      success: true,
      message: 'User already has admin role'
    };
  }

  // Assign the admin role
  const assignResult = await runSqlQuery(`
    INSERT INTO public.profile_roles (profile_id, role_id, assigned_at)
    VALUES ('${profileId}', 1, NOW());
  `);

  if (!assignResult.success) {
    return {
      success: false,
      error: 'Error assigning admin role: ' + assignResult.error
    };
  }

  return {
    success: true,
    message: 'Admin role assigned successfully'
  };
}

// Function to run the fix script
export async function runFixScript() {
  try {
    // Make sure the roles table has the correct entries
    await runSqlQuery(`
      INSERT INTO public.roles (id, role_name, description, created_at, updated_at)
      VALUES
          (1, 'Admin', 'Full administrative access to all features', NOW(), NOW()),
          (2, 'Team Lead', 'Leads a specific team or seva category, can manage check-ins/T-shirts for their area.', NOW(), NOW()),
          (3, 'Volunteer', 'Standard volunteer user.', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE
      SET role_name = EXCLUDED.role_name,
          description = EXCLUDED.description,
          updated_at = NOW();
    `);

    // Assign Admin role to datta.rajesh@gmail.com
    await runSqlQuery(`
      INSERT INTO public.profile_roles (profile_id, role_id, assigned_at)
      SELECT
          p.id,
          1, -- Admin role ID
          NOW()
      FROM
          public.profiles p
      WHERE
          p.email = 'datta.rajesh@gmail.com'
      AND
          NOT EXISTS (
              SELECT 1
              FROM public.profile_roles pr
              WHERE pr.profile_id = p.id AND pr.role_id = 1
          );
    `);

    // Assign Team Lead role to harshayarlagadda2@gmail.com
    await runSqlQuery(`
      INSERT INTO public.profile_roles (profile_id, role_id, assigned_at)
      SELECT
          p.id,
          2, -- Team Lead role ID
          NOW()
      FROM
          public.profiles p
      WHERE
          p.email = 'harshayarlagadda2@gmail.com'
      AND
          NOT EXISTS (
              SELECT 1
              FROM public.profile_roles pr
              WHERE pr.profile_id = p.id AND pr.role_id = 2
          );
    `);

    // Assign Volunteer role to all profiles that don't have any role
    await runSqlQuery(`
      INSERT INTO public.profile_roles (profile_id, role_id, assigned_at)
      SELECT
          p.id,
          3, -- Volunteer role ID
          NOW()
      FROM
          public.profiles p
      WHERE
          NOT EXISTS (
              SELECT 1
              FROM public.profile_roles pr
              WHERE pr.profile_id = p.id
          );
    `);

    // Create or replace the trigger function for assigning default volunteer role
    await runSqlQuery(`
      CREATE OR REPLACE FUNCTION assign_default_volunteer_role()
      RETURNS TRIGGER AS $$
      BEGIN
          -- Insert the Volunteer role (ID: 3) for the new profile
          INSERT INTO public.profile_roles (profile_id, role_id, assigned_at)
          VALUES (NEW.id, 3, NOW());

          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Drop the trigger if it exists
    await runSqlQuery(`
      DROP TRIGGER IF EXISTS trg_assign_default_volunteer_role ON public.profiles;
    `);

    // Create the trigger on the profiles table
    await runSqlQuery(`
      CREATE TRIGGER trg_assign_default_volunteer_role
      AFTER INSERT ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION assign_default_volunteer_role();
    `);

    return {
      success: true,
      message: 'Fix script executed successfully'
    };
  } catch (error) {
    console.error('Error running fix script:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error running fix script'
    };
  }
}
