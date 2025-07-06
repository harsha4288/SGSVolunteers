import { createClient } from '@/lib/supabase/client-ssr';
import type { User } from '@supabase/supabase-js';

export interface ProfileLinkingResult {
  success: boolean;
  error?: string;
  profile?: any;
}

export class ProfileLinkingService {
  private supabase = createClient();

  async linkUserToProfile(user: User): Promise<ProfileLinkingResult> {
    try {
      if (!user.email) {
        return {
          success: false,
          error: 'User email is required for profile linking'
        };
      }

      // First, check if user is already linked to a profile
      const { data: existingProfile, error: existingError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingProfile && !existingError) {
        console.log('User already linked to profile:', existingProfile.id);
        return {
          success: true,
          profile: existingProfile
        };
      }

      // Look for profile by email
      const { data: profileByEmail, error: emailError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .single();

      if (emailError || !profileByEmail) {
        return {
          success: false,
          error: 'No profile found for this email address. Please contact an administrator.'
        };
      }

      // Link the authenticated user to the existing profile
      const { data: updatedProfile, error: updateError } = await this.supabase
        .from('profiles')
        .update({ user_id: user.id })
        .eq('id', profileByEmail.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error linking profile:', updateError);
        return {
          success: false,
          error: 'Failed to link profile. Please try again.'
        };
      }

      console.log('Successfully linked user to profile:', updatedProfile.id);
      return {
        success: true,
        profile: updatedProfile
      };
    } catch (error) {
      console.error('Unexpected error linking profile:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during profile linking.'
      };
    }
  }

  async getCurrentUserProfile(): Promise<ProfileLinkingResult> {
    try {
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();

      if (userError || !user) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }

      // Get user's profile
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        return {
          success: false,
          error: 'Profile not found'
        };
      }

      return {
        success: true,
        profile
      };
    } catch (error) {
      console.error('Error getting current user profile:', error);
      return {
        success: false,
        error: 'An unexpected error occurred.'
      };
    }
  }
}

export const profileLinkingService = new ProfileLinkingService();