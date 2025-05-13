'use server';

import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types/supabase';
import { revalidatePath } from 'next/cache';
import { Pool } from 'pg';

// Define types for our data
export type Volunteer = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

export type TimeSlot = {
  id: number;
  slot_name: string;
  start_time: string;
  end_time: string;
};

export type SevaCategory = {
  id: number;
  category_name: string;
  description: string | null;
};

export type VolunteerCommitment = {
  id: number;
  volunteer_id: string;
  time_slot_id: number;
  commitment_type: 'PROMISED_AVAILABILITY' | 'ASSIGNED_TASK';
  seva_category_id: number | null;
  task_notes: string | null;
  volunteer: {
    first_name: string;
    last_name: string;
    email: string;
  };
  time_slot: {
    slot_name: string;
    start_time: string;
    end_time: string;
  };
  seva_category: {
    category_name: string;
  } | null;
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

// Function to fetch all volunteers
export async function fetchVolunteers() {
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

  const { data: volunteers, error: volunteersError } = await supabase
    .from('volunteers')
    .select('id, first_name, last_name, email')
    .order('first_name');

  if (volunteersError) {
    return { data: null, error: `Error fetching volunteers: ${volunteersError.message}` };
  }

  return { data: volunteers, error: null };
}

// Function to fetch all time slots
export async function fetchTimeSlots() {
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

  const { data: timeSlots, error: timeSlotsError } = await supabase
    .from('time_slots')
    .select('id, slot_name, start_time, end_time')
    .order('start_time');

  if (timeSlotsError) {
    return { data: null, error: `Error fetching time slots: ${timeSlotsError.message}` };
  }

  return { data: timeSlots, error: null };
}

// Function to fetch all seva categories
export async function fetchSevaCategories() {
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

  const { data: sevaCategories, error: sevaCategoriesError } = await supabase
    .from('seva_categories')
    .select('id, category_name, description')
    .order('category_name');

  if (sevaCategoriesError) {
    return { data: null, error: `Error fetching seva categories: ${sevaCategoriesError.message}` };
  }

  return { data: sevaCategories, error: null };
}

// Function to fetch all volunteer commitments
export async function fetchVolunteerCommitments() {
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

  const { data: commitments, error: commitmentsError } = await supabase
    .from('volunteer_commitments')
    .select(`
      id,
      volunteer_id,
      time_slot_id,
      commitment_type,
      seva_category_id,
      task_notes,
      volunteer:volunteer_id (
        first_name,
        last_name,
        email
      ),
      time_slot:time_slot_id (
        slot_name,
        start_time,
        end_time
      ),
      seva_category:seva_category_id (
        category_name
      )
    `)
    .eq('commitment_type', 'ASSIGNED_TASK')
    .order('time_slot_id');

  if (commitmentsError) {
    return { data: null, error: `Error fetching commitments: ${commitmentsError.message}` };
  }

  return { data: commitments, error: null };
}

// Function to assign a volunteer to a task
export async function assignVolunteerToTask(
  volunteerId: string,
  timeSlotId: number,
  sevaCategoryId: number,
  taskNotes: string | null
) {
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

  // Check if the assignment already exists
  const { data: existingAssignment, error: checkError } = await supabase
    .from('volunteer_commitments')
    .select('id')
    .eq('volunteer_id', volunteerId)
    .eq('time_slot_id', timeSlotId)
    .eq('commitment_type', 'ASSIGNED_TASK')
    .eq('seva_category_id', sevaCategoryId);

  if (checkError) {
    return { success: false, error: `Error checking existing assignment: ${checkError.message}` };
  }

  if (existingAssignment && existingAssignment.length > 0) {
    // Update the existing assignment
    const { error: updateError } = await supabase
      .from('volunteer_commitments')
      .update({ task_notes: taskNotes })
      .eq('id', existingAssignment[0].id);

    if (updateError) {
      return { success: false, error: `Error updating assignment: ${updateError.message}` };
    }
  } else {
    // Create a new assignment
    const { error: insertError } = await supabase
      .from('volunteer_commitments')
      .insert([
        {
          volunteer_id: volunteerId,
          time_slot_id: timeSlotId,
          commitment_type: 'ASSIGNED_TASK',
          seva_category_id: sevaCategoryId,
          task_notes: taskNotes,
          source_reference: 'Admin Assignment'
        }
      ]);

    if (insertError) {
      return { success: false, error: `Error creating assignment: ${insertError.message}` };
    }
  }

  // Revalidate the path to refresh the data
  revalidatePath('/app/volunteer-assignments');

  return { success: true, error: null };
}

// Function to remove a volunteer assignment
export async function removeVolunteerAssignment(commitmentId: number) {
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

  // Delete the assignment
  const { error: deleteError } = await supabase
    .from('volunteer_commitments')
    .delete()
    .eq('id', commitmentId);

  if (deleteError) {
    return { success: false, error: `Error removing assignment: ${deleteError.message}` };
  }

  // Revalidate the path to refresh the data
  revalidatePath('/app/volunteer-assignments');

  return { success: true, error: null };
}
