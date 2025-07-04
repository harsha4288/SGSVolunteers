/**
 * Volunteers table component using the reusable DataTable
 * Displays volunteer data with search, filtering, and pagination
 */

import { useState } from "react";
import { useVolunteersData } from "../hooks/use-volunteers-data";
import { VolunteerForm } from "../../dashboard/components/volunteer-form";
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableColGroup,
  DataTableCol
} from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Edit, Trash2, Search, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { VolunteerWithProfile } from "../types";

export function VolunteersTable() {
  const {
    volunteers,
    loading,
    error,
    pagination,
    filters,
    availableLocations,
    setFilters,
    clearFilters,
    setPage,
    setPageSize,
    refreshData,
    deleteVolunteer
  } = useVolunteersData();

  const [searchQuery, setSearchQuery] = useState(filters.search || "");
  const [localFilters, setLocalFilters] = useState(filters);

  /**
   * Applies the current search and filter values
   */
  const applyFilters = () => {
    setFilters({
      ...localFilters,
      search: searchQuery.trim() || undefined
    });
  };

  /**
   * Clears all filters and search
   */
  const handleClearFilters = () => {
    setSearchQuery("");
    setLocalFilters({});
    clearFilters();
  };

  /**
   * Handles volunteer deletion with confirmation
   */
  const handleDeleteVolunteer = async (volunteerId: string, volunteerName: string) => {
    await deleteVolunteer(volunteerId);
  };

  /**
   * Handles successful volunteer form submission
   */
  const handleVolunteerFormSuccess = () => {
    refreshData();
  };

  if (loading) {
    return <VolunteersTableSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const totalPages = Math.ceil(pagination.totalCount / pagination.pageSize);
  const hasFiltersApplied = searchQuery || Object.values(localFilters).some(Boolean);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search volunteers..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  applyFilters();
                }
              }}
            />
          </div>
          <Button onClick={applyFilters}>Apply</Button>
        </div>
        
        <div className="flex gap-2">
          <Select
            value={localFilters.location || "all"}
            onValueChange={(value) => setLocalFilters(prev => ({ ...prev, location: value === "all" ? undefined : value }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {availableLocations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={localFilters.gender || "all"}
            onValueChange={(value) => setLocalFilters(prev => ({ ...prev, gender: value === "all" ? undefined : value }))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>

          {hasFiltersApplied && (
            <Button variant="outline" onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {volunteers.length} of {pagination.totalCount} volunteers
          {hasFiltersApplied && " (filtered)"}
        </span>
        <Select
          value={pagination.pageSize.toString()}
          onValueChange={(value) => setPageSize(parseInt(value))}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <DataTable maxHeight="calc(100vh - 400px)">
        <DataTableColGroup>
          <DataTableCol width="200px" />
          <DataTableCol width="200px" />
          <DataTableCol width="120px" />
          <DataTableCol width="150px" />
          <DataTableCol width="100px" />
          <DataTableCol width="120px" />
          <DataTableCol width="150px" />
        </DataTableColGroup>
        
        <DataTableHeader>
          <DataTableRow hover={false}>
            <DataTableHead>Name</DataTableHead>
            <DataTableHead>Email</DataTableHead>
            <DataTableHead>Phone</DataTableHead>
            <DataTableHead>Location</DataTableHead>
            <DataTableHead>Gender</DataTableHead>
            <DataTableHead>T-Shirt</DataTableHead>
            <DataTableHead align="right">Actions</DataTableHead>
          </DataTableRow>
        </DataTableHeader>
        
        <DataTableBody>
          {volunteers.length === 0 ? (
            <DataTableRow>
              <DataTableCell colSpan={7} align="center">
                <div className="py-8 text-muted-foreground">
                  {hasFiltersApplied ? "No volunteers match your filters" : "No volunteers found"}
                </div>
              </DataTableCell>
            </DataTableRow>
          ) : (
            volunteers.map((volunteer) => (
              <DataTableRow key={volunteer.id}>
                <DataTableCell>
                  <div>
                    <div className="font-medium">
                      {volunteer.first_name} {volunteer.last_name}
                    </div>
                    {volunteer.profile?.display_name && (
                      <div className="text-xs text-muted-foreground">
                        {volunteer.profile.display_name}
                      </div>
                    )}
                  </div>
                </DataTableCell>
                
                <DataTableCell>{volunteer.email}</DataTableCell>
                
                <DataTableCell>
                  {volunteer.phone || <span className="text-muted-foreground">—</span>}
                </DataTableCell>
                
                <DataTableCell>
                  {volunteer.location || <span className="text-muted-foreground">—</span>}
                </DataTableCell>
                
                <DataTableCell>
                  {volunteer.gender || <span className="text-muted-foreground">—</span>}
                </DataTableCell>
                
                <DataTableCell>
                  <div className="flex items-center gap-2">
                    {volunteer.tshirt_size_preference && (
                      <Badge variant="outline">
                        {volunteer.tshirt_size_preference}
                      </Badge>
                    )}
                    {volunteer.requested_tshirt_quantity && (
                      <span className="text-xs text-muted-foreground">
                        ({volunteer.requested_tshirt_quantity})
                      </span>
                    )}
                  </div>
                </DataTableCell>
                
                <DataTableCell align="right">
                  <div className="flex items-center gap-2">
                    <VolunteerForm
                      mode="edit"
                      currentEventId={1} // TODO: Get from context
                      initialData={volunteer}
                      onSuccess={handleVolunteerFormSuccess}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      }
                    />
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Volunteer</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {volunteer.first_name} {volunteer.last_name}? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteVolunteer(
                              volunteer.id, 
                              `${volunteer.first_name} ${volunteer.last_name}`
                            )}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </DataTableCell>
              </DataTableRow>
            ))
          )}
        </DataTableBody>
      </DataTable>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Previous
          </Button>
          
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(pagination.page + 1)}
            disabled={pagination.page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton loader for the volunteers table
 */
function VolunteersTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}