'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { SITE_CONFIG } from '@/lib/constants';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UserCheck, AlertCircle, List } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Profile } from '@/lib/types/supabase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginPage() {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const LogoIcon = SITE_CONFIG.logo;

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
        const { data, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, display_name, user_id') // Fetch user_id as well
          .order('email', { ascending: true });

        if (profilesError) {
          throw profilesError;
        }
        // Filter out Supabase's placeholder/masked emails
        const validProfiles = data?.filter(p => p.email && !p.email.includes('****')) || [];
        setProfiles(validProfiles);
      } catch (e: any) {
        console.error("Error fetching profiles:", e);
        setError(`Failed to fetch profiles: ${e.message}`);
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
    // Store user_id if available, might be useful for more advanced impersonation later
    if (profile.user_id) {
      localStorage.setItem('impersonatedAuthUserId', profile.user_id);
    } else {
      localStorage.removeItem('impersonatedAuthUserId');
    }
    router.push('/app/dashboard');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <LogoIcon className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">{SITE_CONFIG.name}</CardTitle>
          <CardDescription>Select a user profile to impersonate for development purposes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loadingProfiles && (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          )}

          {!loadingProfiles && profiles.length === 0 && !error && (
            <Alert>
              <List className="h-4 w-4" />
              <AlertTitle>No Profiles Found</AlertTitle>
              <AlertDescription>No suitable profiles were found to display for impersonation.</AlertDescription>
            </Alert>
          )}

          {!loadingProfiles && profiles.length > 0 && (
            <ScrollArea className="h-[300px] w-full rounded-md border p-2">
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
         <CardFooter className="text-center text-sm text-muted-foreground">
          <p>This feature is for development only. Clicking a profile will simulate being logged in as that user.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
