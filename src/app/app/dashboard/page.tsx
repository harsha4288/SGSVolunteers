"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { RoleBasedDashboard } from "./components/role-based-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { SupabaseClient, User as AuthUser } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";

export default function DashboardPage() {
  const [supabase, setSupabase] = React.useState<SupabaseClient<Database> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [profileId, setProfileId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const supabaseInstance = createClient();
    setSupabase(supabaseInstance);
  }, []);

  React.useEffect(() => {
    if (!supabase) return;

    async function fetchUserProfile() {
      setLoading(true);
      setError(null);

      try {
        let impersonatedProfileId: string | null = null;
        let isImpersonating = false;

        // Check for impersonation
        if (typeof window !== "undefined") {
          impersonatedProfileId = localStorage.getItem('impersonatedProfileId');

          if (!impersonatedProfileId) {
            const cookies = document.cookie.split(';').map(cookie => cookie.trim());
            const profileIdCookie = cookies.find(cookie => cookie.startsWith('impersonatedProfileId='));

            if (profileIdCookie) {
              impersonatedProfileId = profileIdCookie.split('=')[1];

              // Restore to localStorage if found in cookies
              if (impersonatedProfileId) {
                localStorage.setItem('impersonatedProfileId', impersonatedProfileId);
              }
            }
          }

          isImpersonating = !!impersonatedProfileId;
        }

        if (isImpersonating && impersonatedProfileId) {
          // Use the impersonated profile ID
          setProfileId(impersonatedProfileId);
        } else {
          // Get the current authenticated user
          const { data: { user }, error: userError } = await supabase.auth.getUser();

          if (userError) {
            throw new Error(userError.message);
          }

          if (!user) {
            throw new Error("Not authenticated");
          }

          // Get the profile ID for the authenticated user
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (profileError) {
            throw new Error(profileError.message);
          }

          setProfileId(profile.id);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();

    // Listen to storage changes to re-fetch data if impersonation status changes
    const handleStorageChange = () => {
      console.log("Dashboard: Storage change detected");
      fetchUserProfile();
    };

    // Listen to both standard storage event (other tabs) and our custom event (same tab)
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('storage-update', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storage-update', handleStorageChange);
    };
  }, [supabase]);

  if (loading || !supabase) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!profileId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>Please log in to access the dashboard.</AlertDescription>
      </Alert>
    );
  }

  return <RoleBasedDashboard profileId={profileId} />;
}
