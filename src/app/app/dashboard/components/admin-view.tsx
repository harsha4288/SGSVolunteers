"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Users, CalendarDays, CheckCircle, ClipboardList } from "lucide-react";
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
import { fetchAdminData, fetchDashboardStats, fetchSevaCategories, fetchEvent } from "../../dashboard/actions";
import type { VolunteerCommitment, Event, SevaCategory } from "../../dashboard/types";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [timeSlotFilter, setTimeSlotFilter] = useState<string>("");
  const [categories, setCategories] = useState<SevaCategory[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

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

        // Fetch categories using server action
        const { data: categoriesData, error: categoriesError } = await fetchSevaCategories();
        if (categoriesError) {
          throw new Error(categoriesError);
        }
        setCategories(categoriesData || []);

        // Fetch time slots
        const supabase = createClient();
        const { data: timeSlotsData, error: timeSlotsError } = await supabase
          .from("time_slots")
          .select("id, slot_name, start_time, end_time")
          .order("start_time");

        if (timeSlotsError) {
          throw new Error(timeSlotsError.message);
        }
        setTimeSlots(timeSlotsData || []);

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

  // Function to fetch volunteers with pagination and filtering
  const fetchVolunteers = async (page: number, pageSize: number) => {
    if (!currentEventId) {
      return { data: [], error: "No event selected", count: 0 };
    }

    try {
      const categoryId = categoryFilter ? parseInt(categoryFilter) : null;
      const timeSlotId = timeSlotFilter ? parseInt(timeSlotFilter) : null;

      const { data, error, count } = await fetchAdminData(
        currentEventId,
        page,
        pageSize,
        searchQuery,
        categoryId,
        timeSlotId
      );

      if (error) {
        throw new Error(error);
      }

      return { data, error: null, count };
    } catch (err) {
      console.error("Error fetching volunteers:", err);
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
    } else if (filterKey === 'timeSlot') {
      setTimeSlotFilter(value);
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
    setTimeSlotFilter("");
    setActiveFilters({});
  };

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

      {/* Volunteer Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Volunteer Management
          </CardTitle>
          <CardDescription>
            Manage volunteer assignments and track attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter Controls */}
          <FilterControls
            onSearch={handleSearch}
            onFilter={handleFilter}
            onClearFilters={handleClearFilters}
            filters={{
              'category': categories.map(cat => ({
                label: cat.category_name,
                value: cat.id.toString()
              })),
              'timeSlot': timeSlots.map(slot => ({
                label: `${slot.slot_name} (${new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
                value: slot.id.toString()
              }))
            }}
            activeFilters={activeFilters}
            searchPlaceholder="Search volunteers by name or email..."
            className="mb-6"
          />

          {/* Volunteers Table with Lazy Loading */}
          <LazyLoadedList
            fetchData={fetchVolunteers}
            pageSize={10}
            emptyMessage="No volunteers found matching your filters."
            renderItem={(volunteer: VolunteerCommitment) => (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Volunteer</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Time Slot</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div>
                        <p className="font-medium">{volunteer.volunteer.first_name} {volunteer.volunteer.last_name}</p>
                        <p className="text-xs text-muted-foreground">{volunteer.volunteer.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{volunteer.seva_category?.category_name || "Unassigned"}</TableCell>
                    <TableCell>
                      <div>
                        <p>{volunteer.time_slot?.slot_name || "No time slot"}</p>
                        <p className="text-xs text-muted-foreground">
                          {volunteer.time_slot ? (
                            <>
                              {new Date(volunteer.time_slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                              {new Date(volunteer.time_slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </>
                          ) : "Time not specified"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {volunteer.is_checked_in ? (
                        <Badge variant="default" className="bg-green-500">Checked In</Badge>
                      ) : (
                        <Badge variant="outline">Not Checked In</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Remove</Button>
                      </div>
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

function AdminViewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
