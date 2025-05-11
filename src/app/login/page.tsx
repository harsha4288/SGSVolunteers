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
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const LogoIcon = SITE_CONFIG.logo;
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
    if (!supabase) {
      if (!loadingProfiles && !error) {
        setLoadingProfiles(true);
      }
      return;
    }

    const fetchProfiles = async () => {
      setLoadingProfiles(true);
      setError(null); 

      try {
        const { data, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, display_name, user_id')
          .order('email', { ascending: true });

        if (profilesError) {
          const consoleLogParts: any[] = ["Error fetching profiles from Supabase API:"];
          let uiDetailMessage = `Error from database (Supabase API).`;

          consoleLogParts.push("Supabase error object (raw):", profilesError);
          try {
            consoleLogParts.push("Supabase error object (JSON):", JSON.stringify(profilesError, null, 2));
          } catch (stringifyError) {
            consoleLogParts.push("Supabase error object (could not stringify):", stringifyError);
          }
          
          if (profilesError.message) {
            uiDetailMessage = `Error from database: ${profilesError.message}.`;
            if (profilesError.message.toLowerCase().includes("rls") || profilesError.message.toLowerCase().includes("permission denied")) {
              uiDetailMessage += " This often indicates a Row Level Security (RLS) issue or missing table grants. Please check your Supabase 'profiles' table permissions and RLS policies, ensuring the 'anon' role (for unauthenticated listing) has SELECT access.";
            } else if (profilesError.message.toLowerCase().includes("fetch")) {
                 uiDetailMessage += " This could be a network issue, incorrect Supabase URL/Key, or CORS problem. Check console for details and verify Supabase settings.";
            }
          } else {
            uiDetailMessage += " The error object from Supabase was not very informative. Please check your Supabase project logs (e.g., Database > Logs or API > Logs in the Supabase dashboard) and ensure your Supabase URL/Anon Key are correct, network is stable, and CORS is configured for your app's origin in the Supabase dashboard (Authentication > URL Configuration and API > API Settings > CORS Configuration). Also verify RLS policies for the 'profiles' table allow 'anon' read access.";
          }
          
          console.error(...consoleLogParts); // This is line 67 from the error log
          setError(uiDetailMessage);
          setProfiles([]);
          return;
        }
        
        const validProfiles = data?.filter(p => p.email && !p.email.includes('****')) || [];
        setProfiles(validProfiles);

      } catch (fetchOperationError: any) { 
        const consoleLogParts: any[] = ["Critical error during fetchProfiles operation (e.g., network, CORS):"];
        let uiDetailMessage = "Failed to fetch profiles. ";

        if (fetchOperationError?.message?.toLowerCase().includes("failed to fetch")) {
            uiDetailMessage += `This commonly indicates a network connectivity problem, a CORS issue, or an incorrect Supabase URL/Anon Key.
            Please verify:
            1. Your internet connection, VPN, and any firewalls/proxies.
            2. Supabase URL (NEXT_PUBLIC_SUPABASE_URL in your .env.local file): It should be your project's API URL (e.g., https://yourprojectid.supabase.co), NOT the database host (e.g., db.yourprojectid.supabase.co).
            3. Supabase Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file) is correct.
            4. CORS settings in your Supabase project dashboard (Project Settings > API > CORS Configuration, and Authentication > URL Configuration) allow requests from origin: ${typeof window !== "undefined" ? window.location.origin : "your app origin"}.
            5. Supabase service status (check status.supabase.com).`;
            consoleLogParts.push("Network/CORS or Supabase URL/Key issue suspected due to 'Failed to fetch'. Ensure NEXT_PUBLIC_SUPABASE_URL is the API URL, not the DB host. Check CORS settings in Supabase Dashboard.");
        } else if (fetchOperationError?.message) {
            uiDetailMessage += `Details: ${fetchOperationError.message}. If this is not a network issue, it could be related to Row Level Security (RLS) policies or table permissions in Supabase. Ensure the 'anon' role (or authenticated role) has SELECT permission on the 'profiles' table.`;
            consoleLogParts.push("Potentially a database-level error or RLS/permissions issue suspected.");
        } else {
            uiDetailMessage += "An unexpected error occurred. The error object was not informative. Check browser console and Supabase logs for more details.";
            consoleLogParts.push("Unexpected error with uninformative error object.");
        }
        
        consoleLogParts.push("Full error caught:", fetchOperationError);
        try {
          consoleLogParts.push("Error object (JSON):", JSON.stringify(fetchOperationError, Object.getOwnPropertyNames(fetchOperationError), 2));
        } catch (stringifyError) {
            consoleLogParts.push("Caught error object (could not stringify):", stringifyError);
        }
        
        console.error(...consoleLogParts);
        setError(`Failed to fetch profiles: ${uiDetailMessage}`);
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <LogoIcon className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">{SITE_CONFIG.name}</CardTitle>
          <CardDescription>Select a profile to impersonate for development.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Profiles</AlertTitle>
              <AlertDescription className="whitespace-pre-wrap text-xs">{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Impersonate User (Dev Mode)
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
              <AlertDescription>
                No suitable profiles were found in the database, or access was denied. 
                Please check if the 'profiles' table has data and that Row Level Security (RLS) policies allow the 'anon' role to read from it.
                Also, ensure your Supabase URL, Anon Key, and CORS settings are correctly configured.
              </AlertDescription>
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
          <p>Impersonation is for development purposes. Select a user to simulate their experience.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
