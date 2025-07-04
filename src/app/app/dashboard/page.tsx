// src/app/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { RoleBasedDashboard } from "./components/role-based-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfileId() {
      try {
        const supabase = createClient();
        
        // Check for impersonation first (like in profile page)
        const impersonatedProfileId = localStorage.getItem('impersonatedProfileId');
        
        if (impersonatedProfileId) {
          setProfileId(impersonatedProfileId);
          return;
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error("User not authenticated");
        }

        // Get profile ID from profiles table using auth_user_id
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();

        if (profileError || !profile) {
          throw new Error("Profile not found");
        }

        setProfileId(profile.id);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    fetchProfileId();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-3 px-2 space-y-4">
        <Skeleton className="h-32 w-full" />
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

  if (error || !profileId) {
    return (
      <div className="container mx-auto py-3 px-2">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "Failed to load dashboard"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-3 px-2">
      <RoleBasedDashboard profileId={profileId} />
    </div>
  );
}
