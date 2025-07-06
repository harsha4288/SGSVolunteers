import { createClient } from '@/lib/supabase/client-ssr';
import type { AuthError } from '@supabase/supabase-js';

export interface OTPSendResult {
  success: boolean;
  error?: string;
}

export interface OTPVerifyResult {
  success: boolean;
  error?: string;
  user?: any;
  session?: any;
}

export class OTPService {
  private supabase = createClient();

  async sendOTP(email: string): Promise<OTPSendResult> {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          error: 'Please enter a valid email address'
        };
      }

      // Check if user exists in profiles table
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .single();

      if (profileError || !profile) {
        return {
          success: false,
          error: 'User not found. Please contact an administrator to create your account.'
        };
      }

      // Send OTP via Supabase Auth
      const { error } = await this.supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true // Allow user creation for profile linking
        }
      });

      if (error) {
        console.error('OTP send error:', error);
        return {
          success: false,
          error: this.getErrorMessage(error)
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error sending OTP:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.'
      };
    }
  }

  async verifyOTP(email: string, token: string): Promise<OTPVerifyResult> {
    try {
      // Validate token format (6 digits)
      const tokenRegex = /^\d{6}$/;
      if (!tokenRegex.test(token)) {
        return {
          success: false,
          error: 'Please enter a valid 6-digit code'
        };
      }

      // Verify OTP with Supabase Auth
      const { data, error } = await this.supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });

      if (error) {
        console.error('OTP verify error:', error);
        return {
          success: false,
          error: this.getErrorMessage(error)
        };
      }

      if (!data.user || !data.session) {
        return {
          success: false,
          error: 'Authentication failed. Please try again.'
        };
      }

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } catch (error) {
      console.error('Unexpected error verifying OTP:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.'
      };
    }
  }

  private getErrorMessage(error: AuthError): string {
    switch (error.message) {
      case 'Email rate limit exceeded':
        return 'Please wait 60 seconds before requesting another code.';
      case 'Token has expired':
        return 'Code has expired. Please request a new one.';
      case 'Token invalid':
        return 'Invalid code. Please check and try again.';
      case 'Email not confirmed':
        return 'Please check your email and click the verification link.';
      default:
        return error.message || 'An error occurred during authentication.';
    }
  }
}

export const otpService = new OTPService();