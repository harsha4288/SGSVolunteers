'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { SITE_CONFIG } from '@/lib/constants';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UserCheck, AlertCircle, List, Mail } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Profile } from '@/lib/types/supabase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const LogoIcon = SITE_CONFIG.logo;
  const [emailForMagicLink, setEmailForMagicLink] = useState('');
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const { toast } = useToast();


  useEffect(() => {
    try {
      const client = createClient();
      setSupabase(client);
    } catch (e: any) {
      setError(`Failed to initialize Supabase client: ${e.message}`);
      console.error("Supabase client initialization error:", e);
      setLoadingProfiles(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const fetchProfiles = async () => {
      setLoadingProfiles(true);
      setError(null);
      try {
        // Ensure supabase client is initialized
        if (!supabase) {
          setError("Supabase client not available for fetching profiles.");
          setLoadingProfiles(false);
          return;
        }

        const { data, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, display_name, user_id') // Fetch user_id as well
          .order('email', { ascending: true });

        if (profilesError) {
          // Throw the actual Supabase error to be caught by the catch block
          throw profilesError; 
        }
        // Filter out Supabase's placeholder/masked emails
        const validProfiles = data?.filter(p => p.email && !p.email.includes('****')) || [];
        setProfiles(validProfiles);
      } catch (err: any) { 
        console.error("Error fetching profiles:", err); 
        
        let detail = "An unexpected error occurred. The error object was not informative.";
        if (err) {
          if (typeof err.message === 'string' && err.message.trim() !== "") {
            detail = err.message;
          } else if (typeof err.details === 'string' && err.details.trim() !== "") {
            detail = err.details;
          } else if (typeof err === 'string' && err.trim() !== "") {
            detail = err;
          } else {
            try {
              const errString = JSON.stringify(err);
              if (errString !== '{}') { 
                 detail = `Non-standard error object: ${errString}. This could indicate a network issue or misconfiguration.`;
              }
            } catch {
              // Stringification failed, stick to the generic message
            }
          }
        }
        setError(`Failed to fetch profiles: ${detail}`);
      } finally {
        setLoadingProfiles(false);
      }
    };

    fetchProfiles();
  }, [supabase]);

  const handleImpersonate = (profile: Profile) => {
    if (!profile.id || !profile.email) {
        setError("Selected profile is missing ID or email for impersonation.");
        return;
    }
    localStorage.setItem('impersonatedProfileId', profile.id);
    localStorage.setItem('impersonatedEmail', profile.email);
    localStorage.setItem('impersonatedDisplayName', profile.display_name || profile.email.split('@')[0]);
    if (profile.user_id) {
      localStorage.setItem('impersonatedAuthUserId', profile.user_id);
    } else {
      localStorage.removeItem('impersonatedAuthUserId');
    }
    toast({
      title: "Impersonating User",
      description: `Now impersonating ${profile.display_name || profile.email}.`,
    });
    router.push('/app/dashboard');
  };

  const handleMagicLinkSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !emailForMagicLink) return;

    setIsSendingMagicLink(true);
    setError(null);

    try {
      const { data, error: otpError } = await supabase.auth.signInWithOtp({
        email: emailForMagicLink,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          // shouldCreateUser: true, // Allow Supabase to create the user if they don't exist in auth.users
        },
      });

      if (otpError) {
        throw otpError;
      }
      
      // Check if a new user was created or if it's an existing user
      // The 'data' object from signInWithOtp might contain user information or session details
      // For magic link, usually `data.user` will be null until the link is clicked.
      // `data.session` will also be null.
      // The important part is that the email is sent.

      toast({
        title: "Magic Link Sent!",
        description: `Please check your email at ${emailForMagicLink} for a login link.`,
      });
      setEmailForMagicLink(''); // Clear input after sending

    } catch (e: any) {
      console.error("Magic link sign-in error:", e);
      let errorMessage = "An unknown error occurred.";
      if (e && typeof e.message === 'string' && e.message) {
        errorMessage = e.message;
      } else if (typeof e === 'string') {
        errorMessage = e;
      }
      setError(`Failed to send magic link: ${errorMessage}. This could be due to an invalid email or network issues.`);
      toast({
        title: "Magic Link Error",
        description: `Failed to send magic link: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSendingMagicLink(false);
    }
  };


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <LogoIcon className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">{SITE_CONFIG.name}</CardTitle>
          <CardDescription>Sign in or select a profile to impersonate for development.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
            <div>
              <Label htmlFor="email-magic-link" className="mb-1 block text-sm font-medium">Sign in with Email Magic Link</Label>
              <div className="flex gap-2">
              <Input
                id="email-magic-link"
                type="email"
                value={emailForMagicLink}
                onChange={(e) => setEmailForMagicLink(e.target.value)}
                placeholder="Enter your email address"
                required
                className="flex-grow"
                disabled={isSendingMagicLink}
              />
              <Button type="submit" disabled={isSendingMagicLink || !emailForMagicLink} className="shrink-0">
                {isSendingMagicLink ? 'Sending...' : 'Send Link'}
                {!isSendingMagicLink && <Mail className="ml-2 h-4 w-4" />}
              </Button>
              </div>
            </div>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or impersonate (Dev Only)
              </span>
            </div>
          </div>

          {loadingProfiles && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          )}

          {!loadingProfiles && profiles.length === 0 && !error && (
            <Alert>
              <List className="h-4 w-4" />
              <AlertTitle>No Profiles Found for Impersonation</AlertTitle>
              <AlertDescription>No suitable profiles were found. You can sign in using the magic link above.</AlertDescription>
            </Alert>
          )}

          {!loadingProfiles && profiles.length > 0 && (
            <ScrollArea className="h-[200px] w-full rounded-md border p-2">
              <div className="space-y-2">
                {profiles.map((profile) => (
                  <Button
                    key={profile.id}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => handleImpersonate(profile)}
                    title={`Impersonate ${profile.display_name || profile.email}`}
                  >
                    <UserCheck className="mr-3 h-5 w-5 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="font-medium">{profile.display_name || 'N/A'}</span>
                      <span className="text-xs text-muted-foreground">{profile.email}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
         <CardFooter className="text-center text-xs text-muted-foreground pt-4 border-t">
          <p>Impersonation is for development purposes only. For regular access, please use the magic link sign-in.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
