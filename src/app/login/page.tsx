"use client";

import * as React from "react";
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
import { Handshake, LogIn, Users, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SupabaseClient } from "@supabase/supabase-js";

export default function LoginPage() {
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
      setError(`Failed to initialize Supabase: ${e.message}. Please check your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.`);
      setLoadingProfiles(false);
    }
  }, []);

  React.useEffect(() => {
    if (!supabase) {
      if (!loadingProfiles && !error) {
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
        // Ensure supabase is not null (TypeScript check)
        if (!supabase) {
          throw new Error("Supabase client is null");
        }

        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("*") // Select all fields to match the Profile type
          .order("email", { ascending: true });

        if (profilesError) {
          uiDetailMessage = `Server said: ${profilesError.message}.`;
          if (profilesError.message.toLowerCase().includes('failed to fetch')) {
            uiDetailMessage += " This often indicates a network issue or CORS problem. Ensure your NEXT_PUBLIC_SUPABASE_URL is correct (e.g., https://<project-ref>.supabase.co), your NEXT_PUBLIC_SUPABASE_ANON_KEY is valid, and your Supabase project's CORS settings allow requests from this application's domain. Remember to restart your Next.js server after changing .env.local files.";
          }
          consoleLogParts.push(`Message: ${profilesError.message}`);
          if (profilesError.details) consoleLogParts.push(`Details: ${profilesError.details}`);
          if (profilesError.hint) consoleLogParts.push(`Hint: ${profilesError.hint}`);
          if (profilesError.code) consoleLogParts.push(`Code: ${profilesError.code}`);

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
        setProfiles(validProfiles as Profile[]);

      } catch (err: any) {
        consoleLogParts.push("Generic error during fetchProfiles execution:");
        let detail = "An unexpected error occurred. The error object was not informative.";

        if (err && err.message) {
          consoleLogParts.push(err.message);
          detail = err.message;
          if (err.message.toLowerCase().includes('failed to fetch')) {
            detail += " This network error often points to issues with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, or Supabase CORS configuration. Please verify these and restart your development server.";
          }
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
  }, [supabase]);

  const handleImpersonate = async (profile: Profile) => {
    if (!supabase) {
        toast({ title: "Error", description: "Supabase client not available.", variant: "destructive" });
        return;
    }

    try {
      // Store impersonation data in localStorage
      localStorage.setItem("impersonatedProfileId", profile.id);
      localStorage.setItem("impersonatedEmail", profile.email);
      localStorage.setItem("impersonatedDisplayName", profile.display_name || profile.email.split('@')[0]);

      if (profile.user_id) {
          localStorage.setItem("impersonatedAuthUserId", profile.user_id);
      } else {
          localStorage.removeItem("impersonatedAuthUserId");
      }

      // Also store in cookies for middleware access
      document.cookie = `impersonatedProfileId=${profile.id}; path=/; max-age=86400`;
      document.cookie = `impersonatedEmail=${encodeURIComponent(profile.email)}; path=/; max-age=86400`;
      document.cookie = `impersonatedDisplayName=${encodeURIComponent(profile.display_name || profile.email.split('@')[0])}; path=/; max-age=86400`;

      // Trigger a custom event to notify other components about the impersonation
      // The standard 'storage' event only fires for other tabs, not the current one
      window.dispatchEvent(new Event('storage-update'));

      console.log("Impersonation data set:", {
        profileId: profile.id,
        email: profile.email,
        displayName: profile.display_name || profile.email.split('@')[0]
      });

      toast({
        title: "Impersonating User",
        description: `Now viewing as ${profile.display_name || profile.email}.`,
      });

      // Add a small delay to ensure cookies are set before navigation
      setTimeout(() => {
        console.log("Navigating to dashboard...");
        // Use window.location.href instead of router.push for a full page reload
        window.location.href = "/app/dashboard";
      }, 100);
    } catch (error) {
      console.error("Error during impersonation:", error);
      toast({
        title: "Impersonation Failed",
        description: "An error occurred while setting up impersonation.",
        variant: "destructive"
      });
    }
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
              <AlertTitle>Error Loading Profiles</AlertTitle>
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
