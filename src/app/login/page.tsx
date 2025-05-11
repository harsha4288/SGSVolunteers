'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { SITE_CONFIG } from '@/lib/constants';
import { useState, useEffect } from 'react';
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
      const consoleLogParts: any[] = ["Error fetching profiles:"];
      let uiDetailMessage = "An unknown error occurred.";

      try {
        if (!supabase) {
          uiDetailMessage = "Supabase client not available for fetching profiles.";
          consoleLogParts.push(uiDetailMessage);
          throw new Error(uiDetailMessage);
        }

        const { data, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, display_name, user_id') // Ensure user_id is selected if needed for impersonation logic
          .order('email', { ascending: true });

        if (profilesError) {
          consoleLogParts.push("Supabase error object:", profilesError);
          throw profilesError;
        }
        const validProfiles = data?.filter(p => p.email && !p.email.includes('****')) || [];
        setProfiles(validProfiles);
      } catch (err: any) { 
        
        if (err && typeof err === 'object' && Object.keys(err).length === 0 && err.constructor === Object) {
          const rlsHint = "This often indicates a permissions issue (Row Level Security or table grants in Supabase) or a network problem preventing a full error response. Please check your Supabase 'profiles' table permissions and RLS policies, ensuring the 'anon' role has SELECT access if unauthenticated users need to list profiles for impersonation.";
          uiDetailMessage = `The operation failed, and the error object received from the server was empty. ${rlsHint}`;
          consoleLogParts.push(`Received empty error object. ${rlsHint}`, err);
        } else if (err) {
          if (typeof err.message === 'string' && err.message.trim() !== "") {
            uiDetailMessage = err.message;
            if (uiDetailMessage.toLowerCase().includes("failed to fetch")) {
              uiDetailMessage += " This could be due to network connectivity issues or, more commonly, Row Level Security (RLS) policies on the 'profiles' table in Supabase preventing access. Please ensure the 'anon' role has SELECT permission for listing profiles. Also verify your Supabase URL and Anon Key are correct.";
            }
            consoleLogParts.push(err.message, err);
          } else if (typeof err.details === 'string' && err.details.trim() !== "") {
            uiDetailMessage = err.details;
            consoleLogParts.push(err.details, err);
          } else if (typeof err === 'string' && err.trim() !== "") {
            uiDetailMessage = err;
            consoleLogParts.push(err);
          } else {
            try {
              const errString = JSON.stringify(err);
              uiDetailMessage = `Non-standard error object: ${errString}. This could indicate a network issue or misconfiguration. Check RLS policies.`;
              consoleLogParts.push(`Non-standard error: ${errString}`, err);
            } catch {
              uiDetailMessage = "The operation failed, and the error object was unreadable. Check network, Supabase status, and ensure RLS policies grant necessary access to the 'profiles' table for the 'anon' role.";
              consoleLogParts.push("Unreadable error object.", err);
            }
          }
        } else {
           uiDetailMessage = "An unknown error occurred (error object was null or undefined). Check RLS policies on 'profiles' table.";
           consoleLogParts.push("Unknown error (err object is null or undefined).");
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
    if (profile.user_id) { // user_id can be null if profile was imported and not linked to auth user yet
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
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Impersonate User (Dev Only)
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
                No suitable profiles were found in the database. 
                Please check if the 'profiles' table has data.
                Also, ensure Row Level Security (RLS) policies allow the 'anon' role to read from the 'profiles' table.
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

