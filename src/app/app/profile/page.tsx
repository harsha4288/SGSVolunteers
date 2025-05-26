"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, User, Mail, Phone, UserCog } from "lucide-react";
import type { Database } from "@/lib/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export default function ProfilePage() {
  const [supabase, setSupabase] = React.useState<SupabaseClient<Database> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [profileId, setProfileId] = React.useState<string | null>(null);
  const [volunteerData, setVolunteerData] = React.useState<any | null>(null);

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
        // Check for impersonation first
        const impersonatedProfileId = localStorage.getItem('impersonatedProfileId');

        if (impersonatedProfileId) {
          // If impersonating, use that profile ID
          setProfileId(impersonatedProfileId);

          // Fetch volunteer data associated with this impersonated profile
          const { data: volunteers, error: volunteersError } = await supabase
            .from('volunteers')
            .select('*')
            .eq('profile_id', impersonatedProfileId)
            .single();

          if (volunteersError && volunteersError.code !== 'PGRST116') {
            throw volunteersError;
          }

          setVolunteerData(volunteers || null);
        } else {
          // Not impersonating, get the current user's profile
          const { data: { user } } = await supabase.auth.getUser();

          if (!user) {
            throw new Error("No user found. Please log in again.");
          }

          // Get the profile ID for this user
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();

          if (profileError) {
            throw new Error("Could not find your profile. Please contact an administrator.");
          }

          setProfileId(profile.id);

          // Fetch volunteer data associated with this profile
          const { data: volunteers, error: volunteersError } = await supabase
            .from('volunteers')
            .select('*')
            .eq('profile_id', profile.id)
            .single();

          if (volunteersError && volunteersError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
            throw volunteersError;
          }

          setVolunteerData(volunteers || null);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, [supabase]);

  if (loading || !supabase) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
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
        <AlertDescription>Please log in to access your profile.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <UserCog className="mr-2 h-6 w-6 text-accent" />
            My Profile
          </CardTitle>
          <CardDescription>
            View and manage your volunteer profile and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {volunteerData ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Name:</span>
                  <span className="ml-2">{volunteerData.first_name} {volunteerData.last_name}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span className="ml-2">{volunteerData.email}</span>
                </div>
                {volunteerData.phone && (
                  <div className="flex items-center">
                    <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Phone:</span>
                    <span className="ml-2">{volunteerData.phone}</span>
                  </div>
                )}
                {volunteerData.tshirt_size_preference && (
                  <div className="flex items-center">
                    <span className="font-medium">T-shirt Size Preference:</span>
                    <span className="ml-2">{volunteerData.tshirt_size_preference}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Volunteer Record</AlertTitle>
              <AlertDescription>
                No volunteer record found for this profile. Please contact an administrator.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
