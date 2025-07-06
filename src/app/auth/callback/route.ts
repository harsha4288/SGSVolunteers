import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/lib/types/supabase';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  // This route is only for magic link authentication, not OTP
  // OTP authentication happens directly through the client-side verification
  if (code) {
    const cookieStore = await cookies();
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
    
    try {
      // Exchange the auth code for a session (for magic links only)
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(requestUrl.origin + '/login?error=auth_failed');
      }

      if (data.user) {
        // Link the authenticated user to their profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', data.user.email)
          .single();

        if (profileError || !profile) {
          console.error('Profile not found for user:', data.user.email);
          return NextResponse.redirect(requestUrl.origin + '/login?error=profile_not_found');
        }

        // Update the profile with the authenticated user ID
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ user_id: data.user.id })
          .eq('id', profile.id);

        if (updateError) {
          console.error('Error linking user to profile:', updateError);
          return NextResponse.redirect(requestUrl.origin + '/login?error=profile_link_failed');
        }

        console.log('Successfully linked user to profile:', profile.id);
      }
    } catch (error) {
      console.error('Unexpected error in auth callback:', error);
      return NextResponse.redirect(requestUrl.origin + '/login?error=unexpected_error');
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin + '/app/dashboard');
}
