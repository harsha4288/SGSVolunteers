"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client-ssr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Shirt, Search, RefreshCw, QrCode, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TShirtTable } from "./components/tshirt-table";
import { QRCodeDisplay } from "./components/qr/qr-code-display";
import { InventoryManagement } from "./components/inventory-management";
import { CompactInteractiveCard } from "@/components/ui/interactive-card";
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
  const [eventSettings, setEventSettings] = React.useState<{ id: number; default_tshirt_allocation: number } | null>(null);
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
        .select('id, first_name, last_name, email, phone, profile_id, requested_tshirt_quantity, tshirt_size_preference')
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
        // Get current authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error("Not authenticated. Please log in again.");
        }

        // Get user's profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profile) {
          throw new Error("Profile not found. Please contact an administrator.");
        }

        setProfileId(profile.id);

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
          .eq("profile_id", profile.id);

        if (rolesError) throw new Error(rolesError.message);

        // Determine if user is admin
        let isUserAdmin = false;
        if (roles && roles.length > 0) {
          isUserAdmin = roles.some(r => r.roles?.role_name === "Admin");
        }
        setIsAdmin(isUserAdmin);

        // For admin users, we don't need to fetch volunteer data immediately
        if (isUserAdmin) {
          setVolunteerData(null);
          setFamilyMembers([]);
        } else {
          // For non-admin users, get their volunteer data
          const { data: volunteers, error: volunteersError } = await supabase
            .from('volunteers')
            .select('id, first_name, last_name, email, phone, profile_id, requested_tshirt_quantity, tshirt_size_preference')
            .eq('profile_id', profile.id);

          if (volunteersError) {
            console.error("Error fetching volunteers:", volunteersError);
            throw new Error(`Error fetching volunteers: ${volunteersError.message}`);
          }

          if (!volunteers || volunteers.length === 0) {
            setVolunteerData(null);
            setFamilyMembers([]);
            toast({
              title: "No Volunteer Record",
              description: "No volunteer record found for your profile. Please contact an administrator.",
              variant: "destructive",
            });
          } else {
            // Use the first volunteer as primary
            setVolunteerData(volunteers[0]);
            
            // Set family members (excluding the first volunteer)
            const family = volunteers.slice(1);
            setFamilyMembers(family);

            // Show success notification
            toast({
              title: "Volunteer Data Loaded",
              description: `Welcome ${volunteers[0].first_name}! ${family.length > 0 ? `Found ${family.length} family member(s).` : ''}`,
            });
          }
        }

        // Fetch current event
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('id, default_tshirt_allocation')
          .eq('id', currentEventId)
          .single();

        if (eventError) {
          console.warn("Error fetching event settings:", eventError);
          setEventSettings({ id: currentEventId, default_tshirt_allocation: 1 });
        } else if (eventData) {
          setEventSettings(eventData as { id: number; default_tshirt_allocation: number });
        } else {
          setEventSettings({ id: currentEventId, default_tshirt_allocation: 1 });
        }
      } catch (err) {
        console.error("Error fetching user data or event settings:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [supabase]);

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
    <div className="container mx-auto py-1 px-2 space-y-2">
      {/* Header */}
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="p-3 pb-2">
          <div className="flex items-center gap-2">
            <Shirt className="h-5 w-5 text-accent flex-shrink-0" />
            <div>
              <h1 className="text-lg font-semibold">T-Shirt Management</h1>
              <p className="text-sm text-muted-foreground">
                {isAdmin
                  ? "Manage preferences, inventory, and issuance"
                  : "Manage your preferences and view allocation"}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Tabs for Admin, Single Content for Volunteers */}
      {isAdmin ? (
        <Tabs defaultValue="tshirts" className="space-y-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tshirts" className="flex items-center gap-2">
              <Shirt className="h-4 w-4" />
              T-Shirts
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Inventory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tshirts" className="space-y-2">
            {/* QR Scanner and Search Section */}
            <CompactInteractiveCard className="p-2">
              <div className="flex flex-col lg:flex-row gap-2 lg:gap-3">
                {/* QR Scanner Section - Compact */}
                <div className="w-full lg:w-1/3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <QrCode className="h-3.5 w-3.5 text-accent" />
                      <h3 className="text-sm font-medium">QR Scanner</h3>
                    </div>
                    <QRCodeScanner onScan={handleQRScan} />
                  </div>
                </div>

                {/* Search Section - Compact */}
                <div className="w-full lg:w-2/3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Search className="h-3.5 w-3.5 text-accent" />
                      <h3 className="text-sm font-medium">Search Volunteers</h3>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-1.5">
                      <Input
                        placeholder="Search by name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 h-8 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchQuery.trim()) {
                            handleSearch();
                          }
                        }}
                      />
                      <Button
                        onClick={() => handleSearch()}
                        disabled={loading || !searchQuery.trim()}
                        className="w-full sm:w-auto h-8 px-3"
                        size="sm"
                      >
                        {loading ? (
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Search className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Search
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Scan QR code or search manually to find volunteers
                    </div>
                  </div>
                </div>
              </div>
            </CompactInteractiveCard>

            {/* T-Shirt Table */}
            <TShirtTable
              supabase={supabase}
              isAdmin={isAdmin}
              eventId={currentEventId}
              tshirtSizes={tshirtSizes}
              volunteer={volunteerData}
              familyMembers={familyMembers}
              searchResults={searchResults}
              profileId={profileId}
              eventSettings={eventSettings} // Pass eventSettings
            />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryManagement eventId={currentEventId} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-2">
          {/* For volunteers: Show QR code */}
          {volunteerData && (
            <div className="max-w-sm mx-auto">
              <QRCodeDisplay
                volunteerId={volunteerData.id}
                eventId={currentEventId}
                supabase={supabase}
              />
            </div>
          )}

          {/* T-Shirt Table for Volunteers */}
          <TShirtTable
            supabase={supabase}
            isAdmin={isAdmin}
            eventId={currentEventId}
            tshirtSizes={tshirtSizes}
            volunteer={volunteerData}
            familyMembers={familyMembers}
            searchResults={[]}
            profileId={profileId}
            eventSettings={eventSettings} // Pass eventSettings
          />
        </div>
      )}
    </div>
  );
}
