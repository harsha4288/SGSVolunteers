"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database, Profile } from "@/lib/types/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Handshake,
  LogIn,
  Users,
  AlertCircle,
  Shield,
  UserCog,
  User,
  Search,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { SupabaseClient } from "@supabase/supabase-js";

// Define a type for a profile with roles
interface ProfileWithRoles extends Profile {
  roles?: {
    id: number;
    role_name: string;
    description: string | null;
  }[];
  isVolunteer?: boolean;
}

// Define a type for a volunteer
interface Volunteer {
  id: string;
  profile_id?: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export default function LoginPage() {
  const { toast } = useToast();
  const [supabase, setSupabase] = React.useState<SupabaseClient<Database> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [profiles, setProfiles] = React.useState<ProfileWithRoles[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [filterText, setFilterText] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

  // Number of records to fetch per page
  const PAGE_SIZE = 10;

  // Initialize Supabase client
  React.useEffect(() => {
    try {
      const supabaseInstance = createClient();
      setSupabase(supabaseInstance);
    } catch (e: any) {
      console.error("Error initializing Supabase client in LoginPage:", e.message);
      setError(`Failed to initialize Supabase: ${e.message}. Please check your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.`);
      setLoading(false);
    }
  }, []);

  // Function to fetch profiles and volunteers with pagination
  const fetchData = React.useCallback(async (currentPage: number, isLoadingMore: boolean = false) => {
    if (!supabase) return;

    if (isLoadingMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      // Calculate range for pagination
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Fetch profiles with pagination and search filter
      let query = supabase
        .from("profiles")
        .select("*", { count: 'exact' })
        .order("email", { ascending: true });

      // Add search filter if provided
      if (filterText) {
        query = query.or(`email.ilike.%${filterText}%,display_name.ilike.%${filterText}%`);
      }

      // Add pagination
      const { data: profilesData, error: profilesError, count } = await query.range(from, to);

      if (profilesError) {
        throw new Error(`Error fetching profiles: ${profilesError.message}`);
      }

      // Update hasMore flag based on count
      if (count !== null) {
        setHasMore(from + PAGE_SIZE < count);
      }

      const validProfiles = (profilesData || []).filter(p => p.email && !p.email.includes('***'));

      // Fetch roles for each profile
      const profilesWithRoles: ProfileWithRoles[] = [];

      for (const profile of validProfiles) {
        try {
          const { data: roleData, error: roleError } = await supabase
            .from("profile_roles")
            .select(`
              role_id,
              roles:role_id (
                id,
                role_name,
                description
              )
            `)
            .eq("profile_id", profile.id);

          if (roleError) {
            console.error(`Error fetching roles for profile ${profile.id}:`, roleError);
            profilesWithRoles.push({
              ...profile,
              roles: []
            });
          } else {
            profilesWithRoles.push({
              ...profile,
              roles: roleData?.map(r => r.roles) || []
            });
          }
        } catch (err) {
          console.error(`Error processing roles for profile ${profile.id}:`, err);
          profilesWithRoles.push({
            ...profile,
            roles: []
          });
        }
      }

      // Fetch volunteers with pagination and search filter
      let volunteerQuery = supabase
        .from("volunteers")
        .select("id, profile_id, email, first_name, last_name, phone", { count: 'exact' })
        .order("email", { ascending: true });

      // Add search filter if provided
      if (filterText) {
        volunteerQuery = volunteerQuery.or(
          `email.ilike.%${filterText}%,first_name.ilike.%${filterText}%,last_name.ilike.%${filterText}%`
        );
      }

      // Add pagination
      const { data: volunteersData, error: volunteersError, count: volunteerCount } =
        await volunteerQuery.range(from, to);

      if (volunteersError) {
        console.error("Error fetching volunteers:", volunteersError);
      } else {
        // Update hasMore flag based on volunteer count
        if (volunteerCount !== null) {
          setHasMore(hasMore => hasMore || (from + PAGE_SIZE < volunteerCount));
        }

        // Create synthetic profiles for volunteers without profiles
        for (const volunteer of volunteersData || []) {
          // Skip volunteers that already have a profile
          if (volunteer.profile_id && profilesWithRoles.some(p => p.id === volunteer.profile_id)) {
            continue;
          }

          // Create a synthetic profile for this volunteer
          profilesWithRoles.push({
            id: volunteer.id,
            user_id: null,
            email: volunteer.email,
            display_name: `${volunteer.first_name} ${volunteer.last_name}`,
            bio: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            roles: [],
            isVolunteer: true
          });
        }
      }

      // Update profiles state
      if (isLoadingMore) {
        setProfiles(prev => [...prev, ...profilesWithRoles]);
      } else {
        setProfiles(profilesWithRoles);
      }

      // Update page number
      setPage(currentPage);

    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message || "An unknown error occurred");
    } finally {
      if (isLoadingMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [supabase, PAGE_SIZE, filterText]);

  // Load more profiles
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchData(page + 1, true);
    }
  };

  // Initial data fetch
  React.useEffect(() => {
    if (supabase) {
      fetchData(1);
    }
  }, [supabase, fetchData]);

  const handleImpersonate = async (profile: Profile) => {
    if (!supabase) {
        toast({ title: "Error", description: "Supabase client not available.", variant: "destructive" });
        return;
    }

    try {
      // Store impersonation data in localStorage
      localStorage.setItem("impersonatedProfileId", profile.id);
      localStorage.setItem("impersonatedEmail", profile.email);
      localStorage.setItem("impersonatedDisplayName", profile.display_name || profile.email.split('@')[0]);

      if (profile.user_id) {
          localStorage.setItem("impersonatedAuthUserId", profile.user_id);
      } else {
          localStorage.removeItem("impersonatedAuthUserId");
      }

      // Also store in cookies for middleware access
      document.cookie = `impersonatedProfileId=${profile.id}; path=/; max-age=86400`;
      document.cookie = `impersonatedEmail=${encodeURIComponent(profile.email)}; path=/; max-age=86400`;
      document.cookie = `impersonatedDisplayName=${encodeURIComponent(profile.display_name || profile.email.split('@')[0])}; path=/; max-age=86400`;

      // Trigger a custom event to notify other components about the impersonation
      // The standard 'storage' event only fires for other tabs, not the current one
      window.dispatchEvent(new Event('storage-update'));

      console.log("Impersonation data set:", {
        profileId: profile.id,
        email: profile.email,
        displayName: profile.display_name || profile.email.split('@')[0]
      });

      toast({
        title: "Impersonating User",
        description: `Now viewing as ${profile.display_name || profile.email}.`,
      });

      // Add a small delay to ensure cookies are set before navigation
      setTimeout(() => {
        console.log("Navigating to dashboard...");
        // Use window.location.href instead of router.push for a full page reload
        window.location.href = "/app/dashboard";
      }, 100);
    } catch (error) {
      console.error("Error during impersonation:", error);
      toast({
        title: "Impersonation Failed",
        description: "An error occurred while setting up impersonation.",
        variant: "destructive"
      });
    }
  };

  // Helper function to get role name
  const getRoleName = (roleName: string): string => {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return 'Admin';
      case 'team_lead':
        return 'Team Lead';
      case 'volunteer':
        return 'Volunteer';
      default:
        return roleName;
    }
  };

  // Helper function to get role icon
  const getRoleIcon = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'team_lead':
        return <UserCog className="h-4 w-4" />;
      case 'volunteer':
        return <User className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setFilterText(newValue);

    // Reset to first page and reload when search changes
    if (supabase) {
      setPage(1);
      // Use a small delay to avoid too many requests while typing
      const timer = setTimeout(() => {
        fetchData(1);
      }, 300);

      return () => clearTimeout(timer);
    }
  };

  // We'll use server-side filtering by adding a filter to the query
  // This is just a fallback for client-side filtering of already loaded profiles
  const filteredProfiles = profiles.filter(profile => {
    return filterText === "" ||
      (profile.display_name?.toLowerCase() || "").includes(filterText.toLowerCase()) ||
      profile.email.toLowerCase().includes(filterText.toLowerCase());
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Handshake className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Welcome to {process.env.NEXT_PUBLIC_APP_NAME || "VolunteerVerse"}
          </CardTitle>
          <CardDescription className="text-md">
            Select a profile to impersonate for development and testing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Profiles</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                id="profile-filter"
                type="text"
                placeholder="Search by name or email..."
                value={filterText}
                onChange={handleSearchChange}
                className="flex-1"
              />
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-center text-muted-foreground">Loading profiles...</p>
              </div>
            ) : filteredProfiles.length > 0 ? (
              <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                <div className="space-y-2">
                  {filteredProfiles.map((profile) => (
                    <Button
                      key={profile.id}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3"
                      onClick={() => handleImpersonate(profile)}
                      title={`Impersonate ${profile.display_name || profile.email}`}
                    >
                      <Users className="mr-3 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      <div className="flex-grow">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-medium">{profile.display_name || "No display name"}</p>
                          {profile.isVolunteer ? (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Volunteer
                            </Badge>
                          ) : profile.roles && profile.roles.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {profile.roles.map((role, index) => (
                                <Badge
                                  key={index}
                                  variant={
                                    role.role_name.toLowerCase() === 'admin'
                                      ? 'destructive'
                                      : role.role_name.toLowerCase() === 'team_lead'
                                        ? 'default'
                                        : 'outline'
                                  }
                                  className="flex items-center gap-1"
                                >
                                  {getRoleIcon(role.role_name)}
                                  {getRoleName(role.role_name)}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              No Role
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                      </div>
                      <LogIn className="ml-auto h-5 w-5 text-accent" />
                    </Button>
                  ))}

                  {/* Load More Button */}
                  {hasMore && (
                    <div className="pt-4 flex justify-center">
                      <Button
                        variant="outline"
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="w-full max-w-xs"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load More Users"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              !error && <p className="text-center text-muted-foreground py-8">No profiles found matching your search.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
