"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Shirt, Search, RefreshCw } from "lucide-react";
import { TShirtTable } from "./components/tshirt-table";
import { QRCodeDisplay } from "./components/qr/qr-code-display";
import { QRCodeScanner } from "./components/qr/qr-code-scanner";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import { getDefaultSizes } from "./utils/helpers";
import type { TShirtSize, Volunteer } from "./types";

/**
 * Main page component for the T-shirt module
 */
export default function TShirtsPage() {
  const [supabase, setSupabase] = React.useState<SupabaseClient<Database> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [profileId, setProfileId] = React.useState<string | null>(null);
  const [volunteerData, setVolunteerData] = React.useState<Volunteer | null>(null);
  const [familyMembers, setFamilyMembers] = React.useState<Volunteer[]>([]);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [currentEventId, setCurrentEventId] = React.useState<number>(1); // Default to event ID 1
  const [tshirtSizes, setTshirtSizes] = React.useState<TShirtSize[]>([]);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [searchResults, setSearchResults] = React.useState<Volunteer[]>([]);

  React.useEffect(() => {
    const supabaseInstance = createClient();
    setSupabase(supabaseInstance);
  }, []);

  // Fetch T-shirt sizes
  React.useEffect(() => {
    if (!supabase || !currentEventId) return;

    async function fetchTshirtSizes() {
      try {
        // Use the get_tshirt_sizes function to get all available sizes
        const { data, error } = await supabase
          .rpc('get_tshirt_sizes', { p_event_id: currentEventId });

        if (error) throw error;

        // If no sizes are found, use defaults
        if (!data || data.length === 0) {
          console.log("No T-shirt sizes found, using defaults");
          setTshirtSizes(getDefaultSizes(currentEventId));
        } else {
          setTshirtSizes(data);
        }
      } catch (error) {
        console.error("Error fetching T-shirt sizes:", error);
        // Set default sizes on error
        setTshirtSizes(getDefaultSizes(currentEventId));
      }
    }

    fetchTshirtSizes();
  }, [supabase, currentEventId]);

  // Handle search for admin role
  const handleSearch = async () => {
    if (!isAdmin || !supabase || !searchQuery.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
        .order('last_name', { ascending: true });

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error("Error searching volunteers:", err);
      setError("Failed to search volunteers");
    } finally {
      setLoading(false);
    }
  };

  // Handle QR code scan result
  const handleQRScan = (result: string) => {
    try {
      // QR code format: email|volunteer_id
      const parts = result.split('|');
      if (parts.length >= 1) {
        const email = parts[0];
        setSearchQuery(email);
        handleSearch();
      }
    } catch (error) {
      console.error("Error processing QR code:", error);
    }
  };

  // Fetch user data and initialize state
  React.useEffect(() => {
    if (!supabase) return;

    async function fetchUserData() {
      setLoading(true);
      setError(null);

      try {
        // Check for impersonation first
        const impersonatedProfileId = localStorage.getItem('impersonatedProfileId');
        let currentProfileId: string;

        if (impersonatedProfileId) {
          // If impersonating, use that profile ID
          currentProfileId = impersonatedProfileId;
        } else {
          try {
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
              console.error("Profile error:", profileError);
              throw new Error("Could not find your profile. Please contact an administrator.");
            }

            currentProfileId = profile.id;
          } catch (authError) {
            console.error("Auth error:", authError);
            throw new Error("Authentication error. Please log in again.");
          }
        }

        setProfileId(currentProfileId);

        // Check if user is admin
        const { data: userRoles, error: rolesError } = await supabase
          .from('profile_roles')
          .select('role_id')
          .eq('profile_id', currentProfileId);

        if (rolesError) {
          console.error("Error fetching user roles:", rolesError);
        } else {
          // Admin role has ID 1
          const isUserAdmin = userRoles?.some(role => role.role_id === 1) || false;
          console.log("Is user admin:", isUserAdmin, "User roles:", userRoles);
          setIsAdmin(isUserAdmin);
        }

        // For admin users, we don't need to fetch volunteer data immediately
        if (isAdmin) {
          // Just set empty data for admin users
          setVolunteerData(null);
          setFamilyMembers([]);
        } else {
          try {
            // Get the impersonated email from localStorage
            const impersonatedEmail = localStorage.getItem("impersonatedEmail");

            if (!impersonatedEmail) {
              console.error("No impersonated email found in localStorage");
              throw new Error("No user email found. Please log in again.");
            }

            console.log("Fetching volunteers with email:", impersonatedEmail);

            // Fetch all volunteers with this email
            const { data: volunteers, error: volunteersError } = await supabase
              .from('volunteers')
              .select('*')
              .eq('email', impersonatedEmail);

            if (volunteersError) {
              console.error("Error fetching volunteers by email:", volunteersError);
              throw new Error(`Error fetching volunteers: ${volunteersError.message}`);
            }

            if (!volunteers || volunteers.length === 0) {
              console.warn("No volunteers found with email:", impersonatedEmail);
              setVolunteerData(null);
              setFamilyMembers([]);
            } else {
              console.log(`Found ${volunteers.length} volunteers with email: ${impersonatedEmail}`);

              // Find the volunteer that matches the current profile ID
              const currentVolunteer = volunteers.find(v => v.profile_id === currentProfileId);

              if (currentVolunteer) {
                console.log("Found volunteer matching profile ID:", currentVolunteer);
                setVolunteerData(currentVolunteer);

                // Set family members (excluding the current volunteer)
                const family = volunteers.filter(v => v.id !== currentVolunteer.id);
                setFamilyMembers(family);
                console.log("Family members:", family.length);
              } else {
                // If no volunteer matches the profile ID, use the first one as the primary
                console.log("No volunteer matches profile ID, using first volunteer:", volunteers[0]);
                setVolunteerData(volunteers[0]);

                // Set family members (excluding the first volunteer)
                const family = volunteers.slice(1);
                setFamilyMembers(family);
                console.log("Family members:", family.length);
              }
            }
          } catch (error) {
            console.error("Error in volunteer data fetching:", error);
            // Set empty data if there's an error
            setVolunteerData(null);
            setFamilyMembers([]);
            setError(error instanceof Error ? error.message : "An unknown error occurred");
          }
        }



        // Fetch current event
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('id')
          .eq('id', 1)
          .single();

        if (eventError) {
          console.warn("Error fetching event:", eventError);
          // Continue with default event ID 1
        } else if (eventData) {
          setCurrentEventId(eventData.id);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [supabase, isAdmin]);

  if (loading || !supabase) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
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
        <AlertDescription>Please log in to access this page.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-4 px-2 space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold flex items-center">
            <Shirt className="mr-2 h-5 w-5 text-accent" />
            T-Shirt Management
          </CardTitle>
          <CardDescription>
            {isAdmin
              ? "Manage T-shirt preferences, inventory, and issuance."
              : "Manage your T-shirt preferences and view allocation."}
          </CardDescription>
        </CardHeader>

        {/* QR Code Section */}
        <CardContent className="pt-0">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* For volunteers: Show QR code */}
            {!isAdmin && volunteerData && (
              <div className="w-full md:w-1/3">
                <QRCodeDisplay
                  volunteerId={volunteerData.id}
                  eventId={currentEventId}
                  supabase={supabase}
                />
              </div>
            )}

            {/* For admins: Show QR scanner and search */}
            {isAdmin && (
              <div className="w-full">
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-1/3">
                      <QRCodeScanner
                        onScan={handleQRScan}
                        onSearch={handleSearch}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                      />
                    </div>

                    <div className="w-full md:w-2/3">
                      <Card className="shadow-sm border border-accent/30">
                        <CardContent className="p-6 space-y-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Search className="h-6 w-6 text-accent" />
                            <h3 className="text-xl font-medium">Search Volunteers</h3>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Input
                              placeholder="Search by name, email, or phone..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="flex-1"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && searchQuery.trim()) {
                                  handleSearch();
                                }
                              }}
                            />
                            <Button
                              onClick={handleSearch}
                              disabled={loading || !searchQuery.trim()}
                              className="whitespace-nowrap"
                            >
                              {loading ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Search className="h-4 w-4 mr-2" />
                              )}
                              Search
                            </Button>
                          </div>

                          <div className="text-sm text-muted-foreground">
                            Note: Results will only be shown after clicking the search button.
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* T-Shirt Table */}
          <TShirtTable
            supabase={supabase}
            isAdmin={isAdmin}
            eventId={currentEventId}
            tshirtSizes={tshirtSizes}
            volunteer={volunteerData}
            familyMembers={familyMembers}
            searchResults={isAdmin ? searchResults : []}
            profileId={profileId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
