"use client";

import * as React from "react";
import { TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, Shirt, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TShirtSize {
  id: number;
  event_id: number;
  size_name: string;
  sort_order: number;
}

interface TShirtSizeCellProps {
  volunteerId: string;
  size: TShirtSize;
  isAdmin: boolean;
  preferences: Record<string, Record<string, boolean>>;
  issuances: Record<string, string[]>;
  saving: Record<string, boolean>;
  onTogglePreference: (volunteerId: string, sizeId: string) => void;
  onIssueTShirt: (volunteerId: string, size: string, quantity: number) => void;
  onReturnTShirt: (volunteerId: string, size: string) => void;
}

export function TShirtSizeCell({
  volunteerId,
  size,
  isAdmin,
  preferences,
  issuances,
  saving,
  onTogglePreference,
  onIssueTShirt,
  onReturnTShirt,
}: TShirtSizeCellProps) {
  const { toast } = useToast();
  const issuedCount = issuances[volunteerId]?.filter(s => s === size.size_name).length || 0;
  const hasPreference = preferences[volunteerId]?.[size.id.toString()];

  return (
    <TableCell className="text-center border-b">
      {/* T-shirt cell with counter controls - 2 column layout */}
      <div className="flex justify-center items-center">
        <div className="grid grid-cols-2 gap-2">
          {/* Column 1: Count and T-shirt icon */}
          <div className="flex flex-col items-center justify-center">
            {/* For admin, show issued count */}
            {isAdmin && (
              <div className={`text-xs font-medium ${
                issuedCount > 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-muted-foreground"
              }`}>
                {issuedCount}
              </div>
            )}

            {/* For volunteer, show preference count */}
            {!isAdmin && (
              <div className={`text-xs font-medium ${
                hasPreference
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-muted-foreground"
              }`}>
                {hasPreference ? 1 : 0}
              </div>
            )}

            <Button
              variant={
                isAdmin
                  ? (issuedCount > 0 ? "default" : "outline")
                  : (hasPreference ? "default" : "outline")
              }
              size="icon"
              className="h-8 w-8 rounded-full mt-1"
              disabled={saving[volunteerId]}
              onClick={() => {
                // Just show the current status
                if (isAdmin) {
                  toast({
                    title: "T-shirt Status",
                    description: `${issuedCount} ${size.size_name} T-shirts issued to this volunteer`,
                  });
                } else {
                  toast({
                    title: "Preference Status",
                    description: hasPreference
                      ? `You have a preference for size ${size.size_name}`
                      : `No preference set for size ${size.size_name}`,
                  });
                }
              }}
              title={
                isAdmin
                  ? `${issuedCount} size ${size.size_name} T-shirts issued`
                  : (hasPreference ? "Remove preference" : "Set as preference")
              }
            >
              {isAdmin && issuedCount > 0 ? (
                <Check className="h-4 w-4" />
              ) : !isAdmin && hasPreference ? (
                <Check className="h-4 w-4" />
              ) : (
                <Shirt className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>

          {/* Column 2: Plus and Minus buttons */}
          <div className="flex flex-col items-center justify-center space-y-2">
            {/* Plus button */}
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-full"
              disabled={saving[volunteerId]}
              onClick={() => {
                if (isAdmin) {
                  // For admin, issue a T-shirt
                  if (saving[volunteerId]) {
                    return;
                  }
                  onIssueTShirt(volunteerId, size.size_name, 1);
                } else {
                  // For volunteer, add preference
                  if (!hasPreference) {
                    onTogglePreference(volunteerId, size.id.toString());
                  } else {
                    // Increment preference count (not implemented yet)
                    toast({
                      title: "Not Implemented",
                      description: "Incrementing preference count is not implemented yet.",
                      variant: "default",
                    });
                  }
                }
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>

            {/* Minus button */}
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-full"
              disabled={saving[volunteerId]}
              onClick={() => {
                if (isAdmin) {
                  // For admin, handle T-shirt return
                  if (issuedCount > 0) {
                    // Implement T-shirt return
                    onReturnTShirt(volunteerId, size.size_name);
                  }
                } else {
                  // For volunteer, remove preference
                  if (hasPreference) {
                    onTogglePreference(volunteerId, size.id.toString());
                  }
                }
              }}
            >
              <Minus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </TableCell>
  );
}
