
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, BarChart3, Sparkles, CalendarDays, UserCheck } from "lucide-react";
import Image from "next/image";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SupabaseEvent, Volunteer, Profile } from "@/lib/types/supabase";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function getDashboardData() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let currentEvent: SupabaseEvent | null = null;
  let userProfile: Profile | null = null;
  let userVolunteers: Volunteer[] = [];

  // Fetch the most recent event (or a specific active event)
  // For simplicity, fetching the first event found, ordered by creation or start date
  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .select('*')
    .order('start_date', { ascending: false }) // Or some other logic for "current"
    .limit(1)
    .single();
  
  if (eventError) console.error("Error fetching event:", eventError.message);
  currentEvent = eventData;

  if (user) {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (profileError) console.error("Error fetching profile:", profileError.message);
    userProfile = profileData;

    if (userProfile && currentEvent) {
      const { data: volunteersData, error: volunteersError } = await supabase
        .from('volunteers')
        .select('*')
        .eq('profile_id', userProfile.id)
        .eq('event_id', currentEvent.id); // Filter volunteers for the current event
      
      if (volunteersError) console.error("Error fetching volunteers:", volunteersError.message);
      userVolunteers = volunteersData || [];
    }
  }

  return { currentEvent, userProfile, userVolunteers, authUser: user };
}


export default async function DashboardPage() {
  const { currentEvent, userProfile, userVolunteers, authUser } = await getDashboardData();

  const eventName = currentEvent?.event_name || "Volunteer Event";

  return (
    <div className="flex flex-col space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Welcome to VolunteerVerse!</CardTitle>
          <CardDescription className="text-lg">
            {`Managing volunteers for ${eventName}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 space-y-4">
            {authUser ? (
              <p>
                Hello, {userProfile?.display_name || authUser.email}! Navigate through the sections using the sidebar.
              </p>
            ) : (
               <p>
                Please log in to manage your volunteer activities.
              </p>
            )}
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
              Volunteers registered under your profile ({userProfile.email}).
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
                    <Link href={`/app/volunteers/${v.id}/schedule`}> {/* Placeholder link */}
                       <Button variant="outline" size="sm">View Schedule</Button>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">You have not registered any volunteers for this event yet under this profile, or there was an issue fetching them.</p>
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

