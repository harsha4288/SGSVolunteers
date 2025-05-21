"use client";

import * as React from "react";
import { TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Shirt, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TShirtSize } from "../../types";

interface TShirtSizeCellProps {
  volunteerId: string;
  size: TShirtSize;
  preferences: Record<string, Record<string, boolean>>;
  preferenceCountsBySize: Record<string, Record<string, number>>;
  issuances: Record<string, string[]>;
  issuanceCountsBySize: Record<string, Record<string, number>>;
  allocations: Record<string, number>;
  saving: Record<string, boolean>;
  isAdmin: boolean;
  onTogglePreference: (volunteerId: string, sizeId: string) => void;
  onIssueTShirt: (volunteerId: string, size: string, quantity: number) => void;
  onReturnTShirt: (volunteerId: string, size: string) => void;
  onRemovePreference: (volunteerId: string, sizeId: string) => void;
}

/**
 * Component for displaying a T-shirt size cell in the volunteer row
 */
export function TShirtSizeCell({
  volunteerId,
  size,
  preferences,
  preferenceCountsBySize,
  issuances,
  issuanceCountsBySize,
  allocations,
  saving,
  isAdmin,
  onTogglePreference,
  onIssueTShirt,
  onReturnTShirt,
  onRemovePreference
}: TShirtSizeCellProps) {
  const { toast } = useToast();
  
  // Calculate display values
  const issuedCount = issuanceCountsBySize[volunteerId]?.[size.size_name] || 0;
  const preferenceCount = preferenceCountsBySize[volunteerId]?.[size.size_name] || 0;
  const hasPreference = preferenceCount > 0 || preferences[volunteerId]?.[size.id.toString()];
  
  // Make sure we show the correct count
  const displayCount = preferenceCount > 0 ? preferenceCount : (preferences[volunteerId]?.[size.id.toString()] ? 1 : 0);
  const showAsActive = displayCount > 0;

  // Handle initial T-shirt selection
  const handleInitialSelection = () => {
    if (!isAdmin && !showAsActive) {
      // Check if we've reached the allocation limit
      const maxAllocation = allocations[volunteerId] || 0;
      
      // Calculate total preferences
      let totalPreferences = 0;
      Object.values(preferenceCountsBySize[volunteerId] || {}).forEach(count => {
        totalPreferences += count;
      });
      
      if (totalPreferences >= maxAllocation) {
        toast({
          title: "Allocation Limit Reached",
          description: `Cannot select more T-shirts than your allocation limit (${maxAllocation}).`,
          variant: "destructive",
        });
        return;
      }
      
      onTogglePreference(volunteerId, size.id.toString());
    }
  };

  // Handle adding a preference or issuing a T-shirt
  const handleAdd = () => {
    if (isAdmin) {
      // For admin, issue a T-shirt
      if (saving[volunteerId]) return;
      onIssueTShirt(volunteerId, size.size_name, 1);
    } else {
      // For volunteer, add preference
      // Check if we've reached the allocation limit
      const maxAllocation = allocations[volunteerId] || 0;
      
      // Calculate total preferences
      let totalPreferences = 0;
      Object.values(preferenceCountsBySize[volunteerId] || {}).forEach(count => {
        totalPreferences += count;
      });
      
      if (totalPreferences >= maxAllocation) {
        toast({
          title: "Allocation Limit Reached",
          description: `Cannot select more T-shirts than your allocation limit (${maxAllocation}).`,
          variant: "destructive",
        });
        return;
      }
      
      onTogglePreference(volunteerId, size.id.toString());
    }
  };

  // Handle removing a preference or returning a T-shirt
  const handleRemove = () => {
    if (isAdmin) {
      // For admin, handle T-shirt return
      onReturnTShirt(volunteerId, size.size_name);
    } else {
      // For volunteer, remove preference
      onRemovePreference(volunteerId, size.id.toString());
    }
  };

  return (
    <TableCell key={size.id} className="text-center border-b">
      <div className="flex justify-center items-center">
        {/* Main T-shirt button with count */}
        <div className="flex flex-col items-center justify-center">
          {/* Show count (issued for admin, preferences for volunteer) */}
          <div className={`text-sm font-medium ${
            (isAdmin && issuedCount > 0) || (!isAdmin && showAsActive)
              ? "text-green-600 dark:text-green-400"
              : "text-muted-foreground"
          }`}>
            {isAdmin ? issuedCount : displayCount}
          </div>

          {/* T-shirt icon button */}
          <Button
            variant={(isAdmin && issuedCount > 0) || (!isAdmin && showAsActive) ? "default" : "outline"}
            size="icon"
            className="h-8 w-8 rounded-full mt-1"
            disabled={saving[volunteerId]}
            onClick={handleInitialSelection}
            title={
              isAdmin
                ? `${issuedCount} size ${size.size_name} T-shirts issued`
                : (showAsActive ? `${displayCount} size ${size.size_name} preferences` : "Add preference")
            }
          >
            <Shirt className="h-4 w-4" />
          </Button>
        </div>

        {/* Plus and Minus buttons - only show if there's already a preference/issuance */}
        {((isAdmin && issuedCount > 0) || (!isAdmin && showAsActive)) && (
          <div className="flex flex-col ml-2 space-y-2">
            {/* Plus button */}
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-full"
              disabled={saving[volunteerId]}
              onClick={handleAdd}
            >
              <Plus className="h-3 w-3" />
            </Button>

            {/* Minus button */}
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-full"
              disabled={saving[volunteerId]}
              onClick={handleRemove}
            >
              <Minus className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </TableCell>
  );
}
