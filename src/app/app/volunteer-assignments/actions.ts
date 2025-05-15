'use server';

import { cookies } from 'next/headers';
import type { Database } from '@/lib/types/supabase';
import { revalidatePath } from 'next/cache';
import { Pool } from 'pg';
import { hardcodedAdminCheck } from '../admin-override';
import { createSupabaseServerActionClient } from '@/lib/supabase/server-actions';

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
  // Use the hardcoded admin check instead of database queries
  // This is a temporary solution until we fix the database connection issues
  return hardcodedAdminCheck();
}

// Function to fetch volunteers with pagination and search
export async function fetchVolunteers(page = 1, pageSize = 10, searchQuery = '') {
  try {
    console.log(`Fetching volunteers - page: ${page}, pageSize: ${pageSize}, search: "${searchQuery}"`);

    const { isAdmin, error } = await checkAdminAccess();

    if (!isAdmin) {
      return {
        data: null,
        totalCount: 0,
        error: error || 'Unauthorized: Admin access required'
      };
    }

    const supabase = createSupabaseServerActionClient();
    let query = supabase.from('volunteers').select('id, first_name, last_name, email');

    // Apply search filter if provided
    if (searchQuery && searchQuery.trim() !== '') {
      const searchTerm = `%${searchQuery.trim().toLowerCase()}%`;
      query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`);
    }

    // Get total count of filtered volunteers
    // First get the count using a separate query
    const { data: countData, error: countError } = await query.select('id');
    const count = countData ? countData.length : 0;

    if (countError) {
      console.error('Error getting volunteer count:', countError);
      return {
        data: null,
        totalCount: 0,
        error: `Error getting volunteer count: ${countError.message}`
      };
    }

    // Calculate range for pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Get paginated and filtered volunteers
    let filteredQuery = supabase.from('volunteers').select('id, first_name, last_name, email');

    // Apply the same search filter
    if (searchQuery && searchQuery.trim() !== '') {
      const searchTerm = `%${searchQuery.trim().toLowerCase()}%`;
      filteredQuery = filteredQuery.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`);
    }

    const { data: volunteers, error: volunteersError } = await filteredQuery
      .range(from, to)
      .order('first_name');

    if (volunteersError) {
      console.error('Error fetching volunteers:', volunteersError);
      return {
        data: null,
        totalCount: count || 0,
        error: `Error fetching volunteers: ${volunteersError.message}`
      };
    }

    console.log(`Fetched ${volunteers.length} volunteers out of ${count} total matching search "${searchQuery}"`);

    return {
      data: volunteers,
      totalCount: count || 0,
      error: null
    };
  } catch (error) {
    console.error('Unexpected error in fetchVolunteers:', error);
    return {
      data: null,
      totalCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error fetching volunteers'
    };
  }
}

// Function to fetch all time slots
export async function fetchTimeSlots() {
  const { isAdmin, error } = await checkAdminAccess();

  if (!isAdmin) {
    return { data: null, error: error || 'Unauthorized: Admin access required' };
  }

  const supabase = createSupabaseServerActionClient();

  const { data: timeSlots, error: timeSlotsError } = await supabase
    .from('time_slots')
    .select('id, slot_name, start_time, end_time, description')
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

  const supabase = createSupabaseServerActionClient();

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

  const supabase = createSupabaseServerActionClient();

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

  const supabase = createSupabaseServerActionClient();

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

  const supabase = createSupabaseServerActionClient();

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
