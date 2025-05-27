// src/lib/utils/user-profile-setup.ts
import { createClient } from '@/lib/supabase/client';

/**
 * Links an authenticated user to their profile in the database
 * This should be called after user authentication to ensure proper role checking
 */
export async function linkUserToProfile(userEmail: string, userId: string) {
  const supabase = createClient();

  try {
    // Find the profile by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, user_id')
      .eq('email', userEmail)
      .single();

    if (profileError || !profile) {
      console.warn(`No profile found for email: ${userEmail}`);
      return { success: false, error: 'Profile not found' };
    }

    // If profile already has a user_id, check if it matches
    if (profile.user_id) {
      if (profile.user_id === userId) {
        console.log(`Profile already linked correctly for ${userEmail}`);
        return { success: true, message: 'Already linked' };
      } else {
        console.warn(`Profile for ${userEmail} is linked to different user_id`);
        return { success: false, error: 'Profile linked to different user' };
      }
    }

    // Link the profile to the user
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ user_id: userId })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Failed to link user to profile:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`Successfully linked user ${userId} to profile for ${userEmail}`);
    return { success: true, message: 'Profile linked successfully' };

  } catch (error) {
    console.error('Error in linkUserToProfile:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Creates a new profile for a user if one doesn't exist
 */
export async function createUserProfile(userEmail: string, userId: string, displayName?: string) {
  const supabase = createClient();

  try {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (existingProfile) {
      console.log(`Profile already exists for ${userEmail}`);
      return await linkUserToProfile(userEmail, userId);
    }

    // Create new profile
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        email: userEmail,
        display_name: displayName || userEmail.split('@')[0],
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Failed to create profile:', createError);
      return { success: false, error: createError.message };
    }

    // Assign default volunteer role
    const { error: roleError } = await supabase
      .from('profile_roles')
      .insert({
        profile_id: newProfile.id,
        role_id: 3, // Volunteer role
      });

    if (roleError) {
      console.warn('Failed to assign default role:', roleError);
      // Don't fail the whole operation for this
    }

    console.log(`Successfully created profile for ${userEmail}`);
    return { success: true, message: 'Profile created successfully' };

  } catch (error) {
    console.error('Error in createUserProfile:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Ensures user has a properly linked profile
 * Call this after authentication
 */
export async function ensureUserProfile(userEmail: string, userId: string, displayName?: string) {
  // First try to link existing profile
  const linkResult = await linkUserToProfile(userEmail, userId);
  
  if (linkResult.success) {
    return linkResult;
  }

  // If linking failed because no profile exists, create one
  if (linkResult.error === 'Profile not found') {
    return await createUserProfile(userEmail, userId, displayName);
  }

  return linkResult;
}
