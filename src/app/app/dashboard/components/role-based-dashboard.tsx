"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { VolunteerView } from "./volunteer-view";
import { TeamLeadView } from "./team-lead-view";
import { AdminView } from "./admin-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { Database } from "@/lib/types/supabase";

export interface RoleBasedDashboardProps {
  profileId: string;
}

export function RoleBasedDashboard({ profileId }: RoleBasedDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "team_lead" | "volunteer" | null>(null);
  const [currentEventId, setCurrentEventId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const supabase = createClient();

        // Fetch user roles
        const { data: roles, error: rolesError } = await supabase
          .from("profile_roles")
          .select(`
            role_id,
            roles:role_id (
              id,
              role_name
            )
          `)
          .eq("profile_id", profileId);

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

        // Get the most recent event
        const { data: recentEvents, error: recentEventsError } = await supabase
          .from("events")
          .select("id")
          .order("start_date", { ascending: false })
          .limit(1)
          .single();

        if (recentEventsError && recentEventsError.code !== "PGRST116") {
          throw new Error(recentEventsError.message);
        }

        setCurrentEventId(recentEvents?.id || null);
      } catch (err) {
        console.error("Error fetching user role:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [profileId]);

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

  switch (userRole) {
    case "admin":
      return <AdminView profileId={profileId} currentEventId={currentEventId} />;
    case "team_lead":
      return <TeamLeadView profileId={profileId} currentEventId={currentEventId} />;
    case "volunteer":
    default:
      return <VolunteerView profileId={profileId} currentEventId={currentEventId} />;
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
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
