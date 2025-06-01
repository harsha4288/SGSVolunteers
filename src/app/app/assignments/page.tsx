"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { AssignmentsDashboard } from "./components/assignments-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";

export default function AssignmentsPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [profileId, setProfileId] = React.useState<string | null>(null);
  const [userRole, setUserRole] = React.useState<"admin" | "team_lead" | "volunteer" | null>(null);
  const [supabase, setSupabase] = React.useState<SupabaseClient<Database> | null>(null);
  const [selectedSevaId, setSelectedSevaId] = React.useState<number | null>(null);
  const [selectedTimeSlotId, setSelectedTimeSlotId] = React.useState<number | null>(null);

  // Initialize Supabase client and get user profile
  React.useEffect(() => {
    const initializeClient = async () => {
      try {
        const supabaseClient = createClient();
        setSupabase(supabaseClient);

        // Get profile ID from localStorage (set during impersonation)
        const impersonatedProfileId = localStorage.getItem("impersonatedProfileId");
        if (!impersonatedProfileId) {
          throw new Error("No profile ID found. Please log in again.");
        }

        setProfileId(impersonatedProfileId);

        // Fetch user roles
        const { data: roles, error: rolesError } = await supabaseClient
          .from("profile_roles")
          .select(`
            role_id,
            roles:role_id (
              id,
              role_name
            )
          `)
          .eq("profile_id", impersonatedProfileId);

        if (rolesError) throw new Error(rolesError.message);

        // Determine highest privilege role
        let highestRole: "admin" | "team_lead" | "volunteer" = "volunteer";

        if (roles && roles.length > 0) {
          if (roles.some(r => r.roles?.role_name === "Admin")) {
            highestRole = "admin";
          } else if (roles.some(r => r.roles?.role_name === "Team Lead")) {
            highestRole = "team_lead";
          }
        }

        setUserRole(highestRole);
        setLoading(false);
      } catch (err: any) {
        console.error("Error initializing assignments page:", err);
        setError(err.message || "An error occurred while loading the page");
        setLoading(false);
      }
    };

    initializeClient();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
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

  if (!profileId || !userRole || !supabase) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Unable to load user profile or determine role. Please log in again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <AssignmentsDashboard
      profileId={profileId}
      userRole={userRole}
      supabase={supabase}
      selectedSevaId={selectedSevaId}
      setSelectedSevaId={setSelectedSevaId}
      selectedTimeSlotId={selectedTimeSlotId}
      setSelectedTimeSlotId={setSelectedTimeSlotId}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4 p-8">
      <div className="flex flex-col md:flex-row gap-4">
        <Skeleton className="h-10 w-full md:w-64" />
        <Skeleton className="h-10 w-full md:w-64" />
        <Skeleton className="h-10 w-full md:w-64" />
        <Skeleton className="h-10 w-full md:w-64" />
      </div>
      <Skeleton className="h-8 w-48" />
      <div className="border rounded-md">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-6 gap-4 p-4">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
        <div className="space-y-2">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4 p-4 border-t">
              {Array(6).fill(0).map((_, j) => (
                <Skeleton key={j} className="h-8 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
