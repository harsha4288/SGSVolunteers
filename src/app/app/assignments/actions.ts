"use server";

import { createSupabaseServerActionClient } from "@/lib/supabase/server-actions";
import { revalidatePath } from "next/cache";

// Check if user has admin or team lead access
export async function checkAccess(profileId: string) {
  const supabase = await createSupabaseServerActionClient();

  // Fetch user roles
  const { data: roles, error: rolesError } = await supabase
    .from("profile_roles")
    .select(`
      role_id,
      roles:role_id (
        id,
        role_name
      )
    `)
    .eq("profile_id", profileId);

  if (rolesError) {
    return {
      isAdmin: false,
      isTeamLead: false,
      error: `Error checking roles: ${rolesError.message}`
    };
  }

  const isAdmin = roles?.some(r => r.roles?.role_name === "Admin") || false;
  const isTeamLead = roles?.some(r => r.roles?.role_name === "Team Lead") || false;

  return { isAdmin, isTeamLead, error: null };
}

// Function to assign a volunteer to a task
export async function assignVolunteerToTask(
  profileId: string,
  volunteerId: string,
  timeSlotId: number,
  sevaCategoryId: number,
  taskNotes: string | null
) {
  const { isAdmin, isTeamLead, error: accessError } = await checkAccess(profileId);

  if (!isAdmin && !isTeamLead) {
    return {
      success: false,
      error: accessError || 'Unauthorized: Admin or Team Lead access required'
    };
  }

  const supabase = await createSupabaseServerActionClient();

  // Check if the assignment already exists
  const { data: existingAssignment, error: checkError } = await supabase
    .from('volunteer_commitments')
    .select('id')
    .eq('volunteer_id', volunteerId)
    .eq('time_slot_id', timeSlotId)
    .eq('commitment_type', 'ASSIGNED_TASK')
    .eq('seva_category_id', sevaCategoryId);

  if (checkError) {
    return {
      success: false,
      error: `Error checking existing assignment: ${checkError.message}`
    };
  }

  if (existingAssignment && existingAssignment.length > 0) {
    // Update the existing assignment
    const { error: updateError } = await supabase
      .from('volunteer_commitments')
      .update({ task_notes: taskNotes })
      .eq('id', existingAssignment[0].id);

    if (updateError) {
      return {
        success: false,
        error: `Error updating assignment: ${updateError.message}`
      };
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
          source_reference: isAdmin ? 'Admin Assignment' : 'Team Lead Assignment'
        }
      ]);

    if (insertError) {
      return {
        success: false,
        error: `Error creating assignment: ${insertError.message}`
      };
    }
  }

  // Revalidate the path to refresh the data
  revalidatePath('/app/assignments');

  return { success: true, error: null };
}

// Function to remove a volunteer assignment
export async function removeVolunteerAssignment(
  profileId: string,
  commitmentId: number
) {
  const { isAdmin, isTeamLead, error: accessError } = await checkAccess(profileId);

  if (!isAdmin && !isTeamLead) {
    return {
      success: false,
      error: accessError || 'Unauthorized: Admin or Team Lead access required'
    };
  }

  const supabase = await createSupabaseServerActionClient();

  // Delete the assignment
  const { error: deleteError } = await supabase
    .from('volunteer_commitments')
    .delete()
    .eq('id', commitmentId);

  if (deleteError) {
    return {
      success: false,
      error: `Error removing assignment: ${deleteError.message}`
    };
  }

  // Revalidate the path to refresh the data
  revalidatePath('/app/assignments');

  return { success: true, error: null };
}

// Function to update check-in status
export async function updateCheckInStatus(
  profileId: string,
  volunteerId: string,
  eventId: number,
  isCheckedIn: boolean,
  location: string | null
) {
  const { isAdmin, isTeamLead, error: accessError } = await checkAccess(profileId);

  if (!isAdmin && !isTeamLead) {
    return {
      success: false,
      error: accessError || 'Unauthorized: Admin or Team Lead access required'
    };
  }

  const supabase = await createSupabaseServerActionClient();

  // Check if there's already a check-in record
  const { data: existingCheckIns, error: checkError } = await supabase
    .from("volunteer_check_ins")
    .select("id")
    .eq("volunteer_id", volunteerId)
    .eq("event_id", eventId);

  if (checkError) {
    return {
      success: false,
      error: `Error checking existing check-in: ${checkError.message}`
    };
  }

  const checkInTime = isCheckedIn ? new Date().toISOString() : null;

  if (existingCheckIns && existingCheckIns.length > 0) {
    // Update existing check-in
    const { error: updateError } = await supabase
      .from("volunteer_check_ins")
      .update({
        check_in_time: checkInTime,
        recorded_by_profile_id: profileId,
        location: location
      })
      .eq("id", existingCheckIns[0].id);

    if (updateError) {
      return {
        success: false,
        error: `Error updating check-in: ${updateError.message}`
      };
    }
  } else {
    // Create new check-in record
    const { error: insertError } = await supabase
      .from("volunteer_check_ins")
      .insert([
        {
          volunteer_id: volunteerId,
          event_id: eventId,
          recorded_by_profile_id: profileId,
          check_in_time: checkInTime,
          location: location
        },
      ]);

    if (insertError) {
      return {
        success: false,
        error: `Error creating check-in: ${insertError.message}`
      };
    }
  }

  // Revalidate the path to refresh the data
  revalidatePath('/app/assignments');

  return { success: true, error: null };
}

// Function to fetch volunteers
export async function fetchVolunteers(searchQuery?: string) {
  const supabase = await createSupabaseServerActionClient();

  let query = supabase
    .from("volunteers")
    .select("id, profile_id, email, first_name, last_name, phone")
    .order("first_name", { ascending: true });

  // Add search filter if provided
  if (searchQuery) {
    query = query.or(
      `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: `Error fetching volunteers: ${error.message}` };
  }

  return { data, error: null };
}
