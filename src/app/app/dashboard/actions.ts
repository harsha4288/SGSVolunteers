'use server';

import { createSupabaseServerActionClient } from '@/lib/supabase/server-actions';
import type { Database } from '@/lib/types/supabase';
import type {
  UserRole,
  VolunteerCommitment,
  Event,
  SevaCategory,
  DashboardStats
} from './types';

/**
 * Gets the current user's profile ID for dashboard access
 */
export async function getCurrentUserProfile() {
  try {
    const supabase = await createSupabaseServerActionClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { profileId: null, error: 'Not authenticated' };
    }

    // Get profile ID from profiles table using user_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return { profileId: null, error: 'Profile not found for the current user' };
    }

    return { profileId: profile.id, error: null };
  } catch (error) {
    return {
      profileId: null,
      error: error instanceof Error ? error.message : 'Failed to get user profile'
    };
  }
}

/**
 * Fetches user roles for a given profile ID
 */
export async function fetchUserRoles(profileId: string) {
  const supabase = await createSupabaseServerActionClient();

  const { data, error } = await supabase
    .from('profile_roles')
    .select(`
      role_id,
      roles:role_id (
        id,
        role_name,
        description
      )
    `)
    .eq('profile_id', profileId);

  if (error) {
    return { data: null, error: error.message };
  }

  return {
    data: data.map(item => item.roles) as UserRole[],
    error: null
  };
}

/**
 * Fetches volunteer tasks for a given volunteer ID and event ID
 */
export async function fetchVolunteerTasks(volunteerId: string, eventId: number | null) {
  const supabase = await createSupabaseServerActionClient();

  if (!eventId) {
    return { data: [], error: 'No current event selected' };
  }

  const { data, error } = await supabase
    .from('volunteer_commitments')
    .select(`
      id,
      volunteer_id,
      time_slot_id,
      commitment_type,
      seva_category_id,
      task_notes,
      volunteer:volunteer_id (
        id,
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
        id,
        category_name
      )
    `)
    .eq('volunteer_id', volunteerId)
    .eq('commitment_type', 'ASSIGNED_TASK');

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as VolunteerCommitment[], error: null };
}

/**
 * Fetches volunteer information for a given profile ID and event ID
 */
export async function fetchVolunteerByProfile(profileId: string, eventId: number | null) {
  const supabase = await createSupabaseServerActionClient();

  if (!eventId) {
    return { data: null, error: 'No current event selected' };
  }

  const { data, error } = await supabase
    .from('volunteers')
    .select('*')
    .eq('profile_id', profileId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Fetches event information by ID
 */
export async function fetchEvent(eventId: number | null) {
  const supabase = await createSupabaseServerActionClient();

  if (!eventId) {
    return { data: null, error: 'No event ID provided' };
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Event, error: null };
}

/**
 * Fetches all seva categories
 */
export async function fetchSevaCategories() {
  const supabase = await createSupabaseServerActionClient();

  const { data, error } = await supabase
    .from('seva_categories')
    .select('*')
    .order('category_name');

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as SevaCategory[], error: null };
}

/**
 * Fetches team members for a team lead based on seva categories they manage
 */
export async function fetchTeamMembers(
  categoryIds: number[],
  eventId: number | null,
  page: number = 1,
  pageSize: number = 10,
  searchQuery: string = ''
) {
  const supabase = await createSupabaseServerActionClient();

  if (!eventId || categoryIds.length === 0) {
    return { data: [], error: 'No event ID or categories provided' };
  }

  let query = supabase
    .from('volunteer_commitments')
    .select(`
      id,
      volunteer_id,
      time_slot_id,
      commitment_type,
      seva_category_id,
      task_notes,
      volunteer:volunteer_id (
        id,
        first_name,
        last_name,
        email,
        phone
      ),
      time_slot:time_slot_id (
        slot_name,
        start_time,
        end_time
      ),
      seva_category:seva_category_id (
        id,
        category_name
      )
    `, { count: 'exact' })
    .eq('commitment_type', 'ASSIGNED_TASK')
    .in('seva_category_id', categoryIds);

  // Add search filter if provided
  if (searchQuery) {
    query = query.or(`volunteer.first_name.ilike.%${searchQuery}%,volunteer.last_name.ilike.%${searchQuery}%,volunteer.email.ilike.%${searchQuery}%`);
  }

  // Add pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('id', { ascending: true })
    .range(from, to);

  if (error) {
    return { data: null, error: error.message, count: 0 };
  }

  return {
    data: data as VolunteerCommitment[],
    error: null,
    count: count || 0
  };
}

/**
 * Fetches check-in status for volunteer commitments
 */
export async function fetchCheckInStatus(commitmentIds: number[], eventId: number) {
  const supabase = await createSupabaseServerActionClient();

  if (commitmentIds.length === 0 || !eventId) {
    return { data: {}, error: null };
  }

  try {
    // Get all volunteer commitments
    const { data: commitments, error: commitmentsError } = await supabase
      .from('volunteer_commitments')
      .select('id, volunteer_id')
      .in('id', commitmentIds);

    if (commitmentsError) throw new Error(commitmentsError.message);

    if (!commitments || commitments.length === 0) {
      return { data: {}, error: null };
    }

    // Extract volunteer IDs
    const volunteerIds = commitments.map(c => c.volunteer_id);

    // Create a map of volunteer_id to commitment_id
    const volunteerToCommitmentMap: Record<string, number[]> = {};
    commitments.forEach(commitment => {
      if (!volunteerToCommitmentMap[commitment.volunteer_id]) {
        volunteerToCommitmentMap[commitment.volunteer_id] = [];
      }
      volunteerToCommitmentMap[commitment.volunteer_id].push(commitment.id);
    });

    // Get all check-ins for these volunteers for this event
    const { data: checkIns, error: checkInsError } = await supabase
      .from('volunteer_check_ins')
      .select('volunteer_id, check_in_time')
      .in('volunteer_id', volunteerIds)
      .eq('event_id', eventId)
      .not('check_in_time', 'is', null);

    if (checkInsError) throw new Error(checkInsError.message);

    // Create a map of commitment_id to check-in status
    const result: Record<number, boolean> = {};
    commitmentIds.forEach(id => {
      result[id] = false;
    });

    if (checkIns && checkIns.length > 0) {
      // Create a set of volunteer IDs who have checked in
      const checkedInVolunteers = new Set(checkIns.map(c => c.volunteer_id));

      // Mark all commitments for checked-in volunteers as checked in
      checkedInVolunteers.forEach(volunteerId => {
        const commitmentIds = volunteerToCommitmentMap[volunteerId] || [];
        commitmentIds.forEach(commitmentId => {
          result[commitmentId] = true;
        });
      });
    }

    return { data: result, error: null };
  } catch (error) {
    return {
      data: {},
      error: error instanceof Error ? error.message : 'Unknown error fetching check-in status'
    };
  }
}

/**
 * Fetches volunteer commitments for admin view with pagination and search
 */
export async function fetchAdminData(
  eventId: number | null,
  page: number = 1,
  pageSize: number = 10,
  searchQuery: string = '',
  categoryFilter: number | null = null,
  timeSlotFilter: number | null = null
) {
  const supabase = await createSupabaseServerActionClient();

  if (!eventId) {
    return { data: [], error: 'No event ID provided', count: 0 };
  }

  let query = supabase
    .from('volunteer_commitments')
    .select(`
      id,
      volunteer_id,
      time_slot_id,
      commitment_type,
      seva_category_id,
      task_notes,
      volunteer:volunteer_id (
        id,
        first_name,
        last_name,
        email,
        phone
      ),
      time_slot:time_slot_id (
        id,
        slot_name,
        start_time,
        end_time
      ),
      seva_category:seva_category_id (
        id,
        category_name
      )
    `, { count: 'exact' })
    .eq('commitment_type', 'ASSIGNED_TASK');

  // Apply filters
  if (categoryFilter) {
    query = query.eq('seva_category_id', categoryFilter);
  }

  if (timeSlotFilter) {
    query = query.eq('time_slot_id', timeSlotFilter);
  }

  // Apply search
  if (searchQuery) {
    query = query.or(`volunteer.first_name.ilike.%${searchQuery}%,volunteer.last_name.ilike.%${searchQuery}%,volunteer.email.ilike.%${searchQuery}%`);
  }

  // Add pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('id', { ascending: true })
    .range(from, to);

  if (error) {
    return { data: null, error: error.message, count: 0 };
  }

  return {
    data: data as VolunteerCommitment[],
    error: null,
    count: count || 0
  };
}

export async function fetchDashboardStats(eventId: number | null) {
  const supabase = await createSupabaseServerActionClient();

  if (!eventId) {
    return {
      data: { totalVolunteers: 0, totalAssignments: 0, checkedIn: 0, sevaCategories: 0 },
      error: 'No event ID provided'
    };
  }

  try {
    // Fetch volunteer count
    const { count: volunteerCount, error: volunteerError } = await supabase
      .from('volunteers')
      .select('id', { count: 'exact', head: true });

    if (volunteerError) throw new Error(volunteerError.message);

    // Fetch assignment count
    const { count: assignmentCount, error: assignmentError } = await supabase
      .from('volunteer_commitments')
      .select('id', { count: 'exact', head: true })
      .eq('commitment_type', 'ASSIGNED_TASK');

    if (assignmentError) throw new Error(assignmentError.message);

    // Fetch checked-in count
    const { count: checkedInCount, error: checkedInError } = await supabase
      .from('volunteer_check_ins')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .not('check_in_time', 'is', null);

    if (checkedInError) throw new Error(checkedInError.message);

    // Fetch seva category count
    const { count: categoryCount, error: categoryError } = await supabase
      .from('seva_categories')
      .select('id', { count: 'exact', head: true });

    if (categoryError) throw new Error(categoryError.message);

    const stats: DashboardStats = {
      totalVolunteers: volunteerCount || 0,
      totalAssignments: assignmentCount || 0,
      checkedIn: checkedInCount || 0,
      sevaCategories: categoryCount || 0
    };

    return { data: stats, error: null };
  } catch (error) {
    return {
      data: { totalVolunteers: 0, totalAssignments: 0, checkedIn: 0, sevaCategories: 0 },
      error: error instanceof Error ? error.message : 'Unknown error fetching stats'
    };
  }
}
