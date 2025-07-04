"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Users, CalendarDays, CheckCircle, ClipboardList } from "lucide-react";
import { StatsCards } from "./shared/stats-cards";
import { fetchDashboardStats, fetchEvent } from "../../dashboard/actions";
import type { Event } from "../../dashboard/types";

export interface AdminViewProps {
  profileId: string;
  currentEventId: number | null;
}

export function AdminView({ profileId, currentEventId }: AdminViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventInfo, setEventInfo] = useState<Event | null>(null);
  const [stats, setStats] = useState({
    totalVolunteers: 0,
    totalAssignments: 0,
    checkedIn: 0,
    sevaCategories: 0
  });

  useEffect(() => {
    async function loadInitialData() {
      if (!currentEventId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch event info using server action
        const { data: eventData, error: eventError } = await fetchEvent(currentEventId);
        if (eventError) {
          throw new Error(eventError);
        }
        setEventInfo(eventData);


        // Fetch dashboard stats using server action
        const { data: statsData, error: statsError } = await fetchDashboardStats(currentEventId);
        if (statsError) {
          throw new Error(statsError);
        }
        setStats(statsData);
      } catch (err) {
        console.error("Error fetching admin data:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [currentEventId]);


  if (loading) {
    return <AdminViewSkeleton />;
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

  if (!currentEventId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Event Selected</AlertTitle>
        <AlertDescription>There is no current event selected or available.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Information */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            {eventInfo?.event_name || "Current Event"}
          </CardTitle>
          <CardDescription>
            {eventInfo?.start_date && eventInfo?.end_date ? (
              `${new Date(eventInfo.start_date).toLocaleDateString()} - ${new Date(eventInfo.end_date).toLocaleDateString()}`
            ) : "Event dates not available"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatsCards
            stats={[
              {
                title: "Total Volunteers",
                value: stats.totalVolunteers,
                icon: <Users className="h-6 w-6" />
              },
              {
                title: "Assignments",
                value: stats.totalAssignments,
                icon: <ClipboardList className="h-6 w-6" />
              },
              {
                title: "Checked In",
                value: stats.checkedIn,
                icon: <CheckCircle className="h-6 w-6" />
              },
              {
                title: "Seva Categories",
                value: stats.sevaCategories,
                icon: <CalendarDays className="h-6 w-6" />
              }
            ]}
          />
        </CardContent>
      </Card>

    </div>
  );
}

function AdminViewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
