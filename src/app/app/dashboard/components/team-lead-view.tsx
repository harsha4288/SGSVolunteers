"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Users, CalendarDays, BarChart, CheckCircle, ClipboardList } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatsCards } from "./shared/stats-cards";
import { FilterControls, FilterOption } from "./shared/filter-controls";
import { LazyLoadedList } from "./shared/lazy-loaded-list";
import { fetchTeamMembers, fetchSevaCategories, fetchEvent } from "../../dashboard/actions";
import type { VolunteerCommitment, Event, SevaCategory } from "../../dashboard/types";

export interface TeamLeadViewProps {
  profileId: string;
  currentEventId: number | null;
}

export function TeamLeadView({ profileId, currentEventId }: TeamLeadViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [managedCategories, setManagedCategories] = useState<SevaCategory[]>([]);
  const [eventInfo, setEventInfo] = useState<Event | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [teamStats, setTeamStats] = useState({
    totalMembers: 0,
    checkedIn: 0,
    attendanceRate: 0
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

        // Fetch categories managed by this team lead
        // This is a placeholder - in a real implementation, you would have a table
        // that maps team leads to seva categories they manage
        const { data: categoriesData, error: categoriesError } = await fetchSevaCategories();
        if (categoriesError) {
          throw new Error(categoriesError);
        }

        // For demo purposes, just use the first 3 categories
        const managedCats = categoriesData?.slice(0, 3) || [];
        setManagedCategories(managedCats);

        // If we have managed categories, fetch initial team stats
        if (managedCats.length > 0) {
          const categoryIds = managedCats.map(cat => cat.id);

          // Fetch initial team members to get stats
          const { data: initialMembers, count, error: membersError } = await fetchTeamMembers(
            categoryIds,
            currentEventId,
            1,
            100 // Fetch a larger number to calculate accurate stats
          );

          if (membersError) {
            throw new Error(membersError);
          }

          // Calculate team stats
          const checkedInCount = initialMembers?.filter(m => m.is_checked_in).length || 0;
          const totalCount = count || 0;

          setTeamStats({
            totalMembers: totalCount,
            checkedIn: checkedInCount,
            attendanceRate: totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0
          });
        }
      } catch (err) {
        console.error("Error fetching team lead data:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [currentEventId]);

  // Function to fetch team members with pagination and filtering
  const fetchTeamMembersData = async (page: number, pageSize: number) => {
    if (!currentEventId || managedCategories.length === 0) {
      return { data: [], error: "No event or categories available", count: 0 };
    }

    try {
      const categoryIds = managedCategories.map(cat => cat.id);

      // If category filter is active, only use that category
      const categoriesToUse = categoryFilter
        ? [parseInt(categoryFilter)]
        : categoryIds;

      const { data, error, count } = await fetchTeamMembers(
        categoriesToUse,
        currentEventId,
        page,
        pageSize,
        searchQuery
      );

      if (error) {
        throw new Error(error);
      }

      // Update check-in status for these members
      if (data) {
        const newStatus: Record<number, boolean> = { ...checkInStatus };
        data.forEach(member => {
          if (member.is_checked_in !== undefined) {
            newStatus[member.id] = member.is_checked_in;
          }
        });
        setCheckInStatus(newStatus);
      }

      return { data, error: null, count };
    } catch (err) {
      console.error("Error fetching team members:", err);
      return {
        data: null,
        error: err instanceof Error ? err.message : "An unknown error occurred",
        count: 0
      };
    }
  };

  // Handle search and filter changes
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveFilters(prev => ({ ...prev, search: query }));
  };

  const handleFilter = (filterKey: string, value: string) => {
    if (filterKey === 'category') {
      setCategoryFilter(value);
    }

    if (value) {
      setActiveFilters(prev => ({ ...prev, [filterKey]: value }));
    } else {
      const newFilters = { ...activeFilters };
      delete newFilters[filterKey];
      setActiveFilters(newFilters);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setActiveFilters({});
  };

  const handleCheckInToggle = async (commitmentId: number) => {
    // Toggle the check-in status locally for immediate feedback
    setCheckInStatus(prev => ({
      ...prev,
      [commitmentId]: !prev[commitmentId]
    }));

    // In a real implementation, you would update the database here
    // This is a placeholder for Iteration 1
    console.log(`Toggled check-in for commitment ${commitmentId} to ${!checkInStatus[commitmentId]}`);

    // Update team stats
    const newCheckedInCount = Object.values(checkInStatus).filter(Boolean).length +
      (checkInStatus[commitmentId] ? -1 : 1);

    setTeamStats(prev => ({
      ...prev,
      checkedIn: newCheckedInCount,
      attendanceRate: prev.totalMembers > 0
        ? Math.round((newCheckedInCount / prev.totalMembers) * 100)
        : 0
    }));
  };

  if (loading) {
    return <TeamLeadViewSkeleton />;
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
          <p>{eventInfo?.description || "No event description available."}</p>
        </CardContent>
      </Card>

      {/* Team Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <BarChart className="h-5 w-5 text-primary" />
            Team Metrics
          </CardTitle>
          <CardDescription>
            Performance metrics for your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatsCards
            stats={[
              {
                title: "Team Members",
                value: teamStats.totalMembers,
                icon: <Users className="h-6 w-6" />
              },
              {
                title: "Checked In",
                value: teamStats.checkedIn,
                icon: <CheckCircle className="h-6 w-6" />
              },
              {
                title: "Attendance Rate",
                value: `${teamStats.attendanceRate}%`,
                icon: <ClipboardList className="h-6 w-6" />
              }
            ]}
          />
        </CardContent>
      </Card>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team Members
          </CardTitle>
          <CardDescription>
            Manage your team members and track attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter Controls */}
          <FilterControls
            onSearch={handleSearch}
            onFilter={handleFilter}
            onClearFilters={handleClearFilters}
            filters={{
              'category': managedCategories.map(cat => ({
                label: cat.category_name,
                value: cat.id.toString()
              }))
            }}
            activeFilters={activeFilters}
            searchPlaceholder="Search team members..."
            className="mb-6"
          />

          {/* Team Members Table with Lazy Loading */}
          <LazyLoadedList
            fetchData={fetchTeamMembersData}
            pageSize={10}
            emptyMessage={
              managedCategories.length > 0
                ? "No team members found matching your filters."
                : "You are not assigned as a team lead for any categories."
            }
            renderItem={(member: VolunteerCommitment) => (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Volunteer</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Time Slot</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div>
                        <p className="font-medium">{member.volunteer.first_name} {member.volunteer.last_name}</p>
                        <p className="text-xs text-muted-foreground">{member.volunteer.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{member.seva_category?.category_name || "Unassigned"}</TableCell>
                    <TableCell>
                      <div>
                        <p>{member.time_slot?.description || member.time_slot?.slot_name || "No time slot"}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.time_slot ? (
                            <>
                              {new Date(member.time_slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                              {new Date(member.time_slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </>
                          ) : "Time not specified"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`checkin-${member.id}`}
                          checked={checkInStatus[member.id]}
                          onCheckedChange={() => handleCheckInToggle(member.id)}
                        />
                        <label
                          htmlFor={`checkin-${member.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {checkInStatus[member.id] ? "Checked In" : "Not Present"}
                        </label>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">View Details</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function TeamLeadViewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
