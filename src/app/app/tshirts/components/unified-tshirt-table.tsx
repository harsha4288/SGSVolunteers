"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
// Removed unused Badge import
import { Plus, Minus, Shirt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUnifiedTShirtData } from "../hooks/use-unified-tshirt-data";
import type { Volunteer } from "../types";

interface UnifiedTShirtTableProps {
  eventId: number;
  volunteers: Volunteer[];
  isAdmin: boolean;
  currentVolunteerId?: string;
  currentProfileId?: string;
}

/**
 * Unified T-shirt table that handles both preferences and issuances
 * Uses the same underlying data structure and functions for both
 */
export function UnifiedTShirtTable({
  eventId,
  volunteers,
  isAdmin,
  currentVolunteerId,
  currentProfileId,
}: UnifiedTShirtTableProps) {
  const { toast } = useToast();

  console.log("UnifiedTShirtTable RENDER:", {
    eventId,
    volunteersCount: volunteers.length,
    volunteers: volunteers.map(v => `${v.first_name} ${v.last_name} (${v.id})`),
    isAdmin,
    currentVolunteerId,
    currentProfileId
  });

  const {
    displaySizes,
    loading,
    saving,
    getPreferenceCount,
    getIssuanceCount,
    canAddMore,
    handleAddPreference,
    handleRemovePreference,
    handleIssueTShirt,
    handleReturnTShirt,
    allocations,
  } = useUnifiedTShirtData({
    eventId,
    volunteersToDisplay: volunteers,
    isAdmin,
    currentVolunteerId,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Shirt className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading T-shirt data...</p>
        </div>
      </div>
    );
  }

  const handleAdd = async (volunteerId: string, sizeCode: string) => {
    // Check allocation limits for volunteers (hard stop)
    if (!isAdmin && !canAddMore(volunteerId)) {
      toast({
        title: "Allocation Limit Reached",
        description: "You have no remaining T-shirt allocation.",
        variant: "destructive",
      });
      return;
    }

    // For admins, show warning but allow override
    if (isAdmin && !canAddMore(volunteerId)) {
      toast({
        title: "Allocation Exceeded",
        description: "This volunteer has exceeded their allocation limit.",
        variant: "default", // Warning, not error
      });
    }

    if (isAdmin && currentProfileId) {
      await handleIssueTShirt(volunteerId, sizeCode, currentProfileId);
    } else {
      await handleAddPreference(volunteerId, sizeCode);
    }
  };

  const handleRemove = async (volunteerId: string, sizeCode: string) => {
    if (isAdmin) {
      await handleReturnTShirt(volunteerId, sizeCode);
    } else {
      await handleRemovePreference(volunteerId, sizeCode);
    }
  };

  const getCount = (volunteerId: string, sizeCode: string): number => {
    return isAdmin
      ? getIssuanceCount(volunteerId, sizeCode)
      : getPreferenceCount(volunteerId, sizeCode);
  };

  // Removed unused getColumnLabel function

  return (
    <div className="rounded-md border">
      <Table className="border-collapse">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[180px] font-semibold">Volunteer</TableHead>
            <TableHead className="w-[60px] font-semibold text-center">Max</TableHead>
            <TableHead colSpan={displaySizes.length} className="text-center font-semibold bg-accent/10 border-b border-accent/20">
              {isAdmin ? "Issued" : "Preferences"}
            </TableHead>
          </TableRow>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[180px] font-semibold"></TableHead>
            <TableHead className="w-[60px] font-semibold text-center"></TableHead>
            {displaySizes.map((size) => (
              <TableHead key={size.size_cd} className="text-center font-semibold">
                <span className="text-sm">{size.size_cd}</span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {volunteers.map((volunteer) => {
            const isSaving = saving[volunteer.id];
            const canAdd = canAddMore(volunteer.id);

            return (
              <TableRow key={volunteer.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className={volunteer.id === currentVolunteerId ? "font-bold text-primary" : ""}>
                      {volunteer.first_name} {volunteer.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {volunteer.email}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="text-center border-b">
                  {allocations[volunteer.id] !== undefined ? (
                    allocations[volunteer.id]
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>

                {displaySizes.map((size) => {
                  const count = getCount(volunteer.id, size.size_cd);
                  const hasItems = count > 0;

                  return (
                    <TableCell key={size.size_cd} className="text-center border-b">
                      <div className="flex flex-col items-center gap-1">
                        {/* T-shirt icon - always visible, highlighted when selected */}
                        <Button
                          variant={hasItems ? "default" : "ghost"}
                          size="sm"
                          className={`h-8 w-8 p-0 relative ${
                            hasItems
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "hover:bg-accent/20 text-muted-foreground"
                          }`}
                          disabled={isSaving}
                          onClick={() => handleAdd(volunteer.id, size.size_cd)}
                          title={
                            isAdmin
                              ? `${count} size ${size.size_cd} T-shirts issued`
                              : (hasItems ? `${count} size ${size.size_cd} preferences` : "Add preference")
                          }
                        >
                          <Shirt className="h-4 w-4" />
                          {hasItems && (
                            <span className="absolute -top-1 -right-1 bg-background text-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center border">
                              {count}
                            </span>
                          )}
                        </Button>

                        {/* +/- controls shown only when there are items */}
                        {hasItems && (
                          <div className="flex items-center gap-1 mt-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={isSaving}
                              onClick={() => handleRemove(volunteer.id, size.size_cd)}
                              title="Remove one"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>

                            <span className="text-xs font-medium min-w-[1rem] text-center px-1">
                              {count}
                            </span>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-primary hover:text-primary hover:bg-primary/10"
                              disabled={isSaving || (!canAdd && !isAdmin)}
                              onClick={() => handleAdd(volunteer.id, size.size_cd)}
                              title="Add one"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
