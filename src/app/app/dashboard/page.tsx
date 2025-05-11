"use client"; // Make it a client component to access localStorage

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, Sparkles, CalendarDays, UserCheck } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client"; // Use client-side Supabase
import type { SupabaseEvent, Volunteer, Profile, Database } from "@/lib/types/supabase";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { SupabaseClient, User as AuthUser } from "@supabase/supabase-js";

// This type now represents the data structure we expect for the dashboard
interface DashboardData {
  currentEvent: SupabaseEvent | null;
  userProfile: Profile | null; // This can be the impersonated profile or the actual logged-in user's profile
  userVolunteers: Volunteer[];
  authUser: AuthUser | null; // Actual Supabase authenticated user
  isImpersonating: boolean;
}

export default function DashboardPage() {
  const [supabase, setSupabase] = React.useState<SupabaseClient<Database> | null>(null);
  const [dashboardData, setDashboardData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const supabaseInstance = createClient();
    setSupabase(supabaseInstance);
  }, []);

  React.useEffect(() => {
    if (!supabase) return;

    async function fetchDashboardData() {
      setLoading(true);
      setError(null);
      try {
        let impersonatedProfileId: string | null = null;
        let impersonatedEmail: string | null = null;
        let isImpersonating = false;

        if (typeof window !== "undefined") {
            impersonatedProfileId = localStorage.getItem('impersonatedProfileId');
            impersonatedEmail = localStorage.getItem('impersonatedEmail');
            isImpersonating = !!(impersonatedProfileId && impersonatedEmail);
        }

        const { data: { user: authUser } } = await supabase.auth.getUser();

        let profileToUse: Profile | null = null;
        
        if (isImpersonating && impersonatedProfileId) {
          // Fetch the impersonated profile
          const { data: impProfileData, error: impProfileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', impersonatedProfileId)
            .single();
          if (impProfileError) console.error("Error fetching impersonated profile:", impProfileError.message);
          profileToUse = impProfileData;
        } else if (authUser) {
          // Fetch profile for the actual logged-in user
          const { data: actualProfileData, error: actualProfileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', authUser.id)
            .single();
          if (actualProfileError) console.error("Error fetching actual user profile:", actualProfileError.message);
          profileToUse = actualProfileData;
        }

        // Fetch the most recent event
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .order('start_date', { ascending: false })
          .limit(1)
          .single();
        if (eventError) console.error("Error fetching event:", eventError.message);
        const currentEvent = eventData;

        let userVolunteers: Volunteer[] = [];
        if (profileToUse && currentEvent) {
          const { data: volunteersData, error: volunteersError } = await supabase
            .from('volunteers')
            .select('*')
            .eq('profile_id', profileToUse.id) // Use the determined profile_id
            .eq('event_id', currentEvent.id);
          if (volunteersError) console.error("Error fetching volunteers:", volunteersError.message);
          userVolunteers = volunteersData || [];
        }
        
        setDashboardData({
          currentEvent,
          userProfile: profileToUse,
          userVolunteers,
          authUser,
          isImpersonating,
        });

      } catch (e: any) {
        console.error("Dashboard data fetching error:", e);
        setError(e.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
     // Listen to storage changes to re-fetch data if impersonation status changes
    const handleStorageChange = () => {
        fetchDashboardData();
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [supabase]);

  if (loading || !supabase) {
    return <div className="container mx-auto py-10 px-4 text-center">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-10 px-4 text-center text-destructive">Error: {error}</div>;
  }

  if (!dashboardData) {
     return <div className="container mx-auto py-10 px-4 text-center">No data available.</div>;
  }

  const { currentEvent, userProfile, userVolunteers, authUser, isImpersonating } = dashboardData;
  const eventName = currentEvent?.event_name || "Volunteer Event";
  const welcomeName = userProfile?.display_name || userProfile?.email || authUser?.email || "Guest";

  return (
    <div className="flex flex-col space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Welcome to VolunteerVerse {isImpersonating && <span className="text-sm text-accent">(Impersonating)</span>}!
          </CardTitle>
          <CardDescription className="text-lg">
            {`Managing volunteers for ${eventName}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 space-y-4">
            <p>
              Hello, {welcomeName}! Navigate through the sections using the sidebar.
            </p>
            <p>
              This platform helps organize volunteer efforts, track participation, and manage resources efficiently.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Image
              src="https://picsum.photos/400/300?grayscale&blur=2"
              alt="Community volunteering"
              width={400}
              height={300}
              className="rounded-lg shadow-md"
              data-ai-hint="community volunteering"
            />
          </div>
        </CardContent>
      </Card>

      {currentEvent && userProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-accent" />
              Your Volunteer Registrations for {currentEvent.event_name}
            </CardTitle>
            <CardDescription>
              Volunteers registered under {userProfile.email}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userVolunteers.length > 0 ? (
              <ul className="space-y-3">
                {userVolunteers.map(v => (
                  <li key={v.id} className="p-3 border rounded-md flex justify-between items-center">
                    <div>
                      <p className="font-medium">{v.first_name} {v.last_name}</p>
                      <p className="text-sm text-muted-foreground">{v.email}</p>
                    </div>
                    {/* TODO: This link structure might need adjustment if impersonating for a volunteer not tied to current auth user */}
                    <Link href={`/app/volunteers/${v.id}/schedule`}> 
                       <Button variant="outline" size="sm">View Schedule</Button>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No volunteers registered under this profile for this event, or there was an issue fetching them.</p>
            )}
             {isImpersonating && (
                <p className="mt-4 text-xs text-accent">
                    Displaying data for impersonated user: {userProfile.email}.
                </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Event
            </CardTitle>
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{eventName}</div>
            {currentEvent?.start_date && currentEvent?.end_date && (
              <p className="text-xs text-muted-foreground">
                {new Date(currentEvent.start_date).toLocaleDateString()} - {new Date(currentEvent.end_date).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
         <Card className="shadow-md hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Volunteers (System)
            </CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">TBD</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">
              Across all events
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Seva Areas
            </CardTitle>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">TBD</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">
              For current event
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Features</CardTitle>
            <Sparkles className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Enabled</div>
            <p className="text-xs text-muted-foreground">
              For activity tagging
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
