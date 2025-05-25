"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Shirt, Search, RefreshCw, QrCode, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminNav } from "@/components/layout/admin-nav";
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

  // Toast hook for notifications
  const { toast } = useToast();

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
  const handleSearch = async (queryOverride?: string) => {
    const searchTerm = queryOverride || searchQuery;

    if (!isAdmin || !supabase || !searchTerm.trim()) {
      if (!searchTerm.trim()) {
        toast({
          title: "Search Required",
          description: "Please enter a search term.",
          variant: "destructive",
        });
      }
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .order('last_name', { ascending: true });

      if (error) throw error;

      setSearchResults(data || []);

      // Show success notification
      const searchToast = toast({
        title: "Search Complete",
        description: `Found ${data?.length || 0} volunteer(s) matching "${searchTerm}".`,
      });

      // Auto-dismiss the search toast after 3 seconds
      setTimeout(() => {
        searchToast.dismiss();
      }, 3000);
    } catch (err) {
      console.error("Error searching volunteers:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to search volunteers";
      setError(errorMessage);
      toast({
        title: "Search Failed",
        description: errorMessage,
        variant: "destructive",
      });
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

        // Show success notification for QR scan
        const scanToast = toast({
          title: "QR Code Scanned",
          description: `Searching for volunteer with email: ${email}`,
        });

        // Auto-dismiss the scan toast after 2 seconds to avoid stacking
        setTimeout(() => {
          scanToast.dismiss();
        }, 2000);

        // Trigger search automatically with the scanned email
        handleSearch(email);
      } else {
        throw new Error("Invalid QR code format");
      }
    } catch (error) {
      console.error("Error processing QR code:", error);
      toast({
        title: "QR Code Error",
        description: "Invalid QR code format. Please try again.",
        variant: "destructive",
      });
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

        let isUserAdmin = false;
        if (rolesError) {
          console.error("Error fetching user roles:", rolesError);
        } else {
          // Admin role has ID 1
          isUserAdmin = userRoles?.some(role => role.role_id === 1) || false;
          console.log("Is user admin:", isUserAdmin, "User roles:", userRoles);
        }
        setIsAdmin(isUserAdmin);

        // For admin users, we don't need to fetch volunteer data immediately
        if (isUserAdmin) {
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
              toast({
                title: "No Volunteer Record",
                description: "No volunteer record found for this email. Please contact an administrator.",
                variant: "destructive",
              });
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

                // Show success notification
                toast({
                  title: "Volunteer Data Loaded",
                  description: `Welcome ${currentVolunteer.first_name}! ${family.length > 0 ? `Found ${family.length} family member(s).` : ''}`,
                });
              } else {
                // If no volunteer matches the profile ID, use the first one as the primary
                console.log("No volunteer matches profile ID, using first volunteer:", volunteers[0]);
                setVolunteerData(volunteers[0]);

                // Set family members (excluding the first volunteer)
                const family = volunteers.slice(1);
                setFamilyMembers(family);
                console.log("Family members:", family.length);

                // Show notification about fallback
                toast({
                  title: "Volunteer Data Loaded",
                  description: `Using ${volunteers[0].first_name} as primary volunteer. ${family.length > 0 ? `Found ${family.length} family member(s).` : ''}`,
                });
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

  // Admin navigation items
  const adminNavItems = [
    {
      title: "T-Shirts",
      href: "/app/tshirts",
      icon: Shirt,
    },
    {
      title: "Inventory",
      href: "/app/inventory",
      icon: Package,
    },
  ];

  return (
    <div className="container mx-auto py-2 px-2 space-y-3">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold flex items-center">
            <Shirt className="mr-2 h-5 w-5 text-accent" />
            T-Shirt Management
          </CardTitle>
          <CardDescription>
            {isAdmin
              ? "Manage T-shirt preferences, inventory, and issuance."
              : "Manage your T-shirt preferences and view allocation."}
          </CardDescription>

          {/* Admin Navigation */}
          {isAdmin && (
            <div className="mt-4">
              <AdminNav items={adminNavItems} />
            </div>
          )}
        </CardHeader>

        {/* QR Code and Search Section */}
        <CardContent className="pt-0">
          <div className="mb-3">
            {/* For volunteers: Show QR code */}
            {!isAdmin && volunteerData && (
              <div className="max-w-sm mx-auto">
                <QRCodeDisplay
                  volunteerId={volunteerData.id}
                  eventId={currentEventId}
                  supabase={supabase}
                />
              </div>
            )}

            {/* For admins: Combined QR scanner and search */}
            {isAdmin && (
              <Card className="shadow-sm border border-accent/30">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
                    {/* QR Scanner Section */}
                    <div className="w-full lg:w-1/3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4 text-accent" />
                          <h3 className="text-base font-medium">QR Scanner</h3>
                        </div>
                        <QRCodeScanner onScan={handleQRScan} />
                      </div>
                    </div>

                    {/* Search Section */}
                    <div className="w-full lg:w-2/3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-accent" />
                          <h3 className="text-base font-medium">Search Volunteers</h3>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
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
                            onClick={() => handleSearch()}
                            disabled={loading || !searchQuery.trim()}
                            className="w-full sm:w-auto"
                            size="sm"
                          >
                            {loading ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Search className="h-4 w-4 mr-2" />
                            )}
                            Search
                          </Button>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Scan a QR code or search manually to find volunteers.
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
