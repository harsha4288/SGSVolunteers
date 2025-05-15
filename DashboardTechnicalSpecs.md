# Dashboard Technical Specifications

## Technology Stack

- **Framework**: Next.js 15.2.3
- **Language**: TypeScript
- **UI Components**: Radix UI primitives with Tailwind CSS (shadcn/ui approach)
- **State Management**: React Query for data fetching and caching
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth

## Component Architecture

### Shared Components

#### 1. LazyLoadedList Component

**Purpose**: Provide a reusable component for lazy loading data with pagination and infinite scroll.

**Implementation**:
```typescript
// src/app/app/dashboard/components/shared/lazy-loaded-list.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export interface LazyLoadedListProps<T> {
  fetchData: (page: number, pageSize: number) => Promise<{ data: T[] | null; error: string | null }>;
  renderItem: (item: T) => React.ReactNode;
  pageSize?: number;
  emptyMessage?: string;
  loadingMessage?: string;
  className?: string;
}

export function LazyLoadedList<T extends { id: string | number }>({
  fetchData,
  renderItem,
  pageSize = 10,
  emptyMessage = "No items found",
  loadingMessage = "Loading items...",
  className
}: LazyLoadedListProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadItems = async (pageNum: number, append = false) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await fetchData(pageNum, pageSize);

      if (error) {
        setError(error);
        return;
      }

      if (data) {
        if (append) {
          setItems(prev => [...prev, ...data]);
        } else {
          setItems(data);
        }
        setHasMore(data.length === pageSize);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems(1);
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadItems(nextPage, true);
  };

  if (items.length === 0 && !loading && !error) {
    return <div className="text-center py-8 text-muted-foreground">{emptyMessage}</div>;
  }

  return (
    <div className={className}>
      {items.map(item => (
        <div key={item.id} className="mb-4">
          {renderItem(item)}
        </div>
      ))}

      {loading && (
        <div className="flex justify-center py-4">
          <Skeleton className="h-10 w-full max-w-xs" />
        </div>
      )}

      {error && (
        <div className="text-center py-4 text-destructive">
          Error: {error}
        </div>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center py-4">
          <Button onClick={loadMore} variant="outline">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
```

#### 2. FilterControls Component

**Purpose**: Provide a reusable component for search and filtering data.

**Implementation**:
```typescript
// src/app/app/dashboard/components/shared/filter-controls.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterControlsProps {
  onSearch: (query: string) => void;
  onFilter: (filterKey: string, value: string) => void;
  onClearFilters: () => void;
  filters: Record<string, FilterOption[]>;
  activeFilters: Record<string, string>;
  searchPlaceholder?: string;
  className?: string;
}

export function FilterControls({
  onSearch,
  onFilter,
  onClearFilters,
  filters,
  activeFilters,
  searchPlaceholder = "Search...",
  className
}: FilterControlsProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleFilter = (filterKey: string, value: string) => {
    onFilter(filterKey, value);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    onClearFilters();
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0 || searchQuery.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={handleSearch}
            className="w-full"
          />
        </div>

        {Object.entries(filters).map(([key, options]) => (
          <div key={key} className="w-full md:w-64">
            <Select
              value={activeFilters[key] || ""}
              onValueChange={(value) => handleFilter(key, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Filter by ${key}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All {key}s</SelectItem>
                {options.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        {hasActiveFilters && (
          <Button variant="outline" onClick={handleClearFilters} className="md:w-auto">
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: {searchQuery}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setSearchQuery("");
                  onSearch("");
                }}
              />
            </Badge>
          )}

          {Object.entries(activeFilters).map(([key, value]) => {
            const option = filters[key]?.find(opt => opt.value === value);
            return option ? (
              <Badge key={key} variant="secondary" className="flex items-center gap-1">
                {key}: {option.label}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilter(key, "")}
                />
              </Badge>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
```

#### 3. StatsCards Component

**Purpose**: Provide a reusable component for displaying dashboard statistics.

**Implementation**:
```typescript
// src/app/app/dashboard/components/shared/stats-cards.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface StatCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ title, value, icon, className }: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4 flex flex-col items-center text-center">
        {icon && <div className="mb-2 text-primary">{icon}</div>}
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export interface StatsCardsProps {
  stats: StatCardProps[];
  loading?: boolean;
  className?: string;
}

export function StatsCards({ stats, loading = false, className }: StatsCardsProps) {
  if (loading) {
    return (
      <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
```

### 4. RoleBasedDashboard Component

**Purpose**: Determine user role and render appropriate dashboard view.

**Implementation**:
```typescript
// src/app/app/dashboard/components/role-based-dashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { VolunteerView } from "./volunteer-view";
import { TeamLeadView } from "./team-lead-view";
import { AdminView } from "./admin-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export interface RoleBasedDashboardProps {
  profileId: string;
}

export function RoleBasedDashboard({ profileId }: RoleBasedDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "team_lead" | "volunteer" | null>(null);
  const [currentEventId, setCurrentEventId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const supabase = createClient();

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
          .eq("profile_id", profileId);

        if (rolesError) throw new Error(rolesError.message);

        // Determine highest privilege role
        let highestRole: "admin" | "team_lead" | "volunteer" = "volunteer";

        if (roles && roles.length > 0) {
          if (roles.some(r => r.roles?.role_name === "Admin")) {
            highestRole = "admin";
          } else if (roles.some(r => r.roles?.role_name === "Team Lead")) {
            highestRole = "team_lead";
          }
        }

        setUserRole(highestRole);

        // Get the most recent event
        const { data: recentEvents, error: recentEventsError } = await supabase
          .from("events")
          .select("id")
          .order("start_date", { ascending: false })
          .limit(1)
          .single();

        if (recentEventsError && recentEventsError.code !== "PGRST116") {
          throw new Error(recentEventsError.message);
        }

        setCurrentEventId(recentEvents?.id || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [profileId]);

  if (loading) {
    return <DashboardSkeleton />;
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

  switch (userRole) {
    case "admin":
      return <AdminView profileId={profileId} currentEventId={currentEventId} />;
    case "team_lead":
      return <TeamLeadView profileId={profileId} currentEventId={currentEventId} />;
    case "volunteer":
    default:
      return <VolunteerView profileId={profileId} currentEventId={currentEventId} />;
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
```

### 2. TaskList Component

**Purpose**: Display a list of tasks with appropriate actions based on user role.

**Implementation**:
```typescript
// src/app/app/dashboard/components/shared/task-list.tsx
"use client";

import { useState } from "react";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Edit, Trash2, Eye, CheckCircle,
  AlertCircle, Clock
} from "lucide-react";
import type { VolunteerCommitment } from "../../actions";

export interface TaskListProps {
  tasks: VolunteerCommitment[];
  viewMode: "volunteer" | "team_lead" | "admin";
  onCheckIn?: (commitmentId: number, isCheckedIn: boolean) => Promise<void>;
  onAssign?: (volunteerId: string, timeSlotId: number, sevaCategoryId: number) => Promise<void>;
  onRemove?: (commitmentId: number) => Promise<void>;
  onView?: (commitmentId: number) => void;
  onEdit?: (commitment: VolunteerCommitment) => void;
}

export function TaskList({
  tasks,
  viewMode,
  onCheckIn,
  onAssign,
  onRemove,
  onView,
  onEdit
}: TaskListProps) {
  const [loading, setLoading] = useState<Record<number, boolean>>({});

  const handleCheckIn = async (commitmentId: number, isCheckedIn: boolean) => {
    if (!onCheckIn) return;

    setLoading(prev => ({ ...prev, [commitmentId]: true }));
    try {
      await onCheckIn(commitmentId, isCheckedIn);
    } finally {
      setLoading(prev => ({ ...prev, [commitmentId]: false }));
    }
  };

  const handleRemove = async (commitmentId: number) => {
    if (!onRemove) return;

    setLoading(prev => ({ ...prev, [commitmentId]: true }));
    try {
      await onRemove(commitmentId);
    } finally {
      setLoading(prev => ({ ...prev, [commitmentId]: false }));
    }
  };

  const getStatusBadge = (commitment: VolunteerCommitment) => {
    if (commitment.checked_in_at) {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="mr-1 h-3 w-3" />
          Checked In
        </Badge>
      );
    }

    const now = new Date();
    const startTime = new Date(commitment.time_slot.start_time);

    if (now > startTime) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="mr-1 h-3 w-3" />
          Missed
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="border-amber-500 text-amber-500">
        <Clock className="mr-1 h-3 w-3" />
        Upcoming
      </Badge>
    );
  };

  return (
    <div className="rounded-md border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            {viewMode !== "volunteer" && <TableHead>Volunteer</TableHead>}
            <TableHead>Task</TableHead>
            <TableHead>Time Slot</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={viewMode !== "volunteer" ? 5 : 4}
                className="h-24 text-center"
              >
                No tasks found.
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => (
              <TableRow key={task.id}>
                {viewMode !== "volunteer" && (
                  <TableCell>
                    {task.volunteer.first_name} {task.volunteer.last_name}
                  </TableCell>
                )}
                <TableCell>
                  {task.seva_category?.category_name || "Unassigned"}
                </TableCell>
                <TableCell>
                  {task.time_slot.slot_name}
                  <div className="text-xs text-muted-foreground">
                    {new Date(task.time_slot.start_time).toLocaleTimeString()} -
                    {new Date(task.time_slot.end_time).toLocaleTimeString()}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(task)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {viewMode === "team_lead" && onCheckIn && (
                      <Checkbox
                        checked={!!task.checked_in_at}
                        onCheckedChange={(checked) =>
                          handleCheckIn(task.id, !!checked)
                        }
                        disabled={loading[task.id]}
                        aria-label={`Mark ${task.volunteer.first_name} as checked in`}
                      />
                    )}

                    {onView && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onView(task.id)}
                        aria-label="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}

                    {viewMode === "admin" && onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(task)}
                        aria-label="Edit assignment"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}

                    {viewMode === "admin" && onRemove && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(task.id)}
                        disabled={loading[task.id]}
                        aria-label="Remove assignment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

## Data Models

### 1. Dashboard Data Types

```typescript
// src/app/app/dashboard/types.ts

export interface DashboardData {
  currentEvent: Event | null;
  userProfile: Profile | null;
  userRoles: UserRole[];
  isImpersonating: boolean;
}

export interface Event {
  id: number;
  event_name: string;
  start_date: string;
  end_date: string;
  description?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
}

export interface UserRole {
  id: number;
  role_name: string;
  description: string | null;
}

export interface TaskAssignment {
  id: number;
  volunteer_id: string;
  time_slot_id: number;
  commitment_type: 'PROMISED_AVAILABILITY' | 'ASSIGNED_TASK';
  seva_category_id: number | null;
  task_notes: string | null;
  checked_in_at: string | null;
  volunteer: {
    first_name: string;
    last_name: string;
    email: string;
  };
  time_slot: {
    slot_name: string;
    start_time: string;
    end_time: string;
  };
  seva_category: {
    category_name: string;
  } | null;
}
```

## Server Actions

### 1. Dashboard Data Fetching

```typescript
// src/app/app/dashboard/actions.ts
'use server';

import { createSupabaseServerActionClient } from '@/lib/supabase/server-actions';
import type { Database } from '@/lib/types/supabase';

export async function fetchUserRoles(profileId: string) {
  const supabase = createSupabaseServerActionClient();

  const { data, error } = await supabase
    .from('profile_roles')
    .select(`
      role_id,
      roles:role_id (
        id,
        role_name,
        description
      )
    `)
    .eq('profile_id', profileId);

  if (error) {
    return { data: null, error: error.message };
  }

  return {
    data: data.map(item => item.roles),
    error: null
  };
}

export async function fetchVolunteerTasks(volunteerId: string, eventId: number | null) {
  const supabase = createSupabaseServerActionClient();

  if (!eventId) {
    return { data: [], error: 'No current event selected' };
  }

  const { data, error } = await supabase
    .from('volunteer_commitments')
    .select(`
      id,
      volunteer_id,
      time_slot_id,
      commitment_type,
      seva_category_id,
      task_notes,
      checked_in_at,
      volunteer:volunteer_id (
        first_name,
        last_name,
        email
      ),
      time_slot:time_slot_id (
        slot_name,
        start_time,
        end_time
      ),
      seva_category:seva_category_id (
        category_name
      )
    `)
    .eq('volunteer_id', volunteerId)
    .eq('commitment_type', 'ASSIGNED_TASK');

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
```

## Database Queries

### 1. Role Detection Query

```sql
SELECT
  r.role_name
FROM
  public.profile_roles pr
JOIN
  public.roles r ON pr.role_id = r.id
WHERE
  pr.profile_id = :profileId
```

### 2. Task Assignment Query

```sql
SELECT
  vc.id,
  vc.volunteer_id,
  vc.time_slot_id,
  vc.commitment_type,
  vc.seva_category_id,
  vc.task_notes,
  vc.checked_in_at,
  v.first_name,
  v.last_name,
  v.email,
  ts.slot_name,
  ts.start_time,
  ts.end_time,
  sc.category_name
FROM
  public.volunteer_commitments vc
JOIN
  public.volunteers v ON vc.volunteer_id = v.id
JOIN
  public.time_slots ts ON vc.time_slot_id = ts.id
LEFT JOIN
  public.seva_categories sc ON vc.seva_category_id = sc.id
WHERE
  vc.commitment_type = 'ASSIGNED_TASK'
  AND ts.event_id = :eventId
```

## Performance Considerations

1. **Pagination**: Implement pagination for tables with large datasets
2. **Caching**: Use React Query to cache data and minimize database queries
3. **Optimistic Updates**: Implement optimistic UI updates for better user experience
4. **Lazy Loading**: Load data only when needed, especially for admin views
5. **Debouncing**: Implement debouncing for search inputs to reduce API calls

## Accessibility Considerations

1. **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
2. **Screen Reader Support**: Add appropriate ARIA attributes to all components
3. **Color Contrast**: Ensure sufficient contrast for all text and UI elements
4. **Focus Management**: Properly manage focus for modals and dialogs
5. **Responsive Design**: Ensure the dashboard is usable on all screen sizes
