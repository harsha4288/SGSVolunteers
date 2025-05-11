
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database, Profile } from "@/lib/types/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Handshake, LogIn, Users, AlertCircle, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SupabaseClient, User as AuthUser } from "@supabase/supabase-js";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [supabase, setSupabase] = React.useState<SupabaseClient<Database> | null>(null);
  const [loadingProfiles, setLoadingProfiles] = React.useState(true);
  const [profiles, setProfiles] = React.useState<Profile[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [filterText, setFilterText] = React.useState("");

  React.useEffect(() => {
    try {
      const supabaseInstance = createClient();
      setSupabase(supabaseInstance);
    } catch (e: any) {
      console.error("Error initializing Supabase client in LoginPage:", e.message);
      setError(`Failed to initialize Supabase: ${e.message}`);
      setLoadingProfiles(false);
    }
  }, []);

  React.useEffect(() => {
    if (!supabase) {
      // If supabase is null and not loading, it means initialization failed.
      // Error should already be set by the first useEffect.
      if (!loadingProfiles && !error) { // Prevent setting error if init error already shown
         setError("Supabase client not available. Cannot fetch profiles.");
      }
      setLoadingProfiles(false);
      return;
    }

    async function fetchProfiles() {
      setLoadingProfiles(true);
      setError(null);
      const consoleLogParts: any[] = ["Error fetching profiles from Supabase API:"];
      let uiDetailMessage = "Could not fetch profiles from the database.";

      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, email, display_name, user_id") // Fetch user_id as well
          .order("email", { ascending: true });

        if (profilesError) {
          if (profilesError.message) {
            consoleLogParts.push(`Message: ${profilesError.message}`);
            uiDetailMessage += ` Server said: ${profilesError.message}`;
          }
          if (profilesError.details) {
            consoleLogParts.push(`Details: ${profilesError.details}`);
          }
          if (profilesError.hint) {
            consoleLogParts.push(`Hint: ${profilesError.hint}`);
          }
          if (profilesError.code) {
            consoleLogParts.push(`Code: ${profilesError.code}`);
          }
          
          consoleLogParts.push("Supabase error object (raw):", profilesError);
          try {
            consoleLogParts.push("Supabase error object (JSON):", JSON.stringify(profilesError, null, 2));
          } catch (e) {
            consoleLogParts.push("Could not stringify Supabase error object.");
          }
          
          console.error(...consoleLogParts); 
          setError(uiDetailMessage);
          setProfiles([]);
          setLoadingProfiles(false);
          return;
        }

        const validProfiles = (profilesData || []).filter(p => p.email && !p.email.includes('***'));
        setProfiles(validProfiles);
      } catch (err: any) { 
        consoleLogParts.push("Generic error during fetchProfiles execution:");
        let detail = "An unexpected error occurred. The error object was not informative.";

        if (err && err.message) {
          consoleLogParts.push(err.message);
          detail = err.message; 
        }
        if (err && typeof err === 'object') {
             consoleLogParts.push("Error object:", err);
        }
        
        uiDetailMessage = `Failed to fetch profiles: ${detail}`;
        console.error(...consoleLogParts);
        setError(uiDetailMessage);
      } finally {
        setLoadingProfiles(false);
      }
    }

    fetchProfiles();
  }, [supabase]); // Depend on supabase client instance

  const handleImpersonate = async (profile: Profile) => {
    if (!supabase) {
        toast({ title: "Error", description: "Supabase client not available.", variant: "destructive" });
        return;
    }
    
    localStorage.setItem("impersonatedProfileId", profile.id);
    localStorage.setItem("impersonatedEmail", profile.email);
    localStorage.setItem("impersonatedDisplayName", profile.display_name || profile.email.split('@')[0]);
    
    if (profile.user_id) {
        localStorage.setItem("impersonatedAuthUserId", profile.user_id); 
    } else {
        localStorage.removeItem("impersonatedAuthUserId");
    }

    toast({
      title: "Impersonating User",
      description: `Now viewing as ${profile.display_name || profile.email}.`,
    });
    router.push("/app/dashboard"); 
    // window.location.href = "/app/dashboard"; // Consider if a full reload is better
  };

  const filteredProfiles = profiles.filter(profile =>
    (profile.display_name?.toLowerCase() || "").includes(filterText.toLowerCase()) ||
    profile.email.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Handshake className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Welcome to {process.env.NEXT_PUBLIC_APP_NAME || "VolunteerVerse"}
          </CardTitle>
          <CardDescription className="text-md">
            Select a profile to impersonate for development and testing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="profile-filter">Filter Profiles</Label>
            <Input
              id="profile-filter"
              type="text"
              placeholder="Search by name or email..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="mt-1"
            />
          </div>

          {loadingProfiles ? (
            <p className="text-center text-muted-foreground">Loading profiles...</p>
          ) : filteredProfiles.length > 0 ? (
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              <div className="space-y-2">
                {filteredProfiles.map((profile) => (
                  <Button
                    key={profile.id}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => handleImpersonate(profile)}
                    title={`Impersonate ${profile.display_name || profile.email}`}
                  >
                    <Users className="mr-3 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-grow">
                      <p className="font-medium">{profile.display_name || "No display name"}</p>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                    </div>
                    <LogIn className="ml-auto h-5 w-5 text-accent" />
                  </Button>
                ))}
              </div>
            </ScrollArea>
          ) : (
             !error && <p className="text-center text-muted-foreground">No profiles found or matching your filter.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
