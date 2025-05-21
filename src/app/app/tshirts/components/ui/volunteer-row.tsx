"use client";

import * as React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Volunteer, TShirtSize } from "../../types";
import { formatVolunteerName } from "../../utils/helpers";
import { TShirtSizeCell } from "./tshirt-size-cell";

interface VolunteerRowProps {
  volunteer: Volunteer;
  currentVolunteerId?: string;
  displaySizes: TShirtSize[];
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
 * Component for displaying a volunteer row in the T-shirt table
 */
export function VolunteerRow({
  volunteer,
  currentVolunteerId,
  displaySizes,
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
}: VolunteerRowProps) {
  return (
    <TableRow key={volunteer.id} className="hover:bg-muted/30">
      <TableCell className="font-medium border-b">
        <div className="flex flex-col">
          <span>
            {formatVolunteerName(volunteer, currentVolunteerId)}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            {volunteer.email}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-center border-b">
        {volunteer.requested_tshirt_quantity !== undefined ? (
          <span className="text-green-600 dark:text-green-400 font-medium">
            {volunteer.requested_tshirt_quantity || 1}
          </span>
        ) : (
          <span className="text-muted-foreground">Loading...</span>
        )}
      </TableCell>

      {/* T-shirt Size Cells */}
      {displaySizes.map(size => (
        <TShirtSizeCell
          key={size.id}
          volunteerId={volunteer.id}
          size={size}
          preferences={preferences}
          preferenceCountsBySize={preferenceCountsBySize}
          issuances={issuances}
          issuanceCountsBySize={issuanceCountsBySize}
          allocations={allocations}
          saving={saving}
          isAdmin={isAdmin}
          onTogglePreference={onTogglePreference}
          onIssueTShirt={onIssueTShirt}
          onReturnTShirt={onReturnTShirt}
          onRemovePreference={onRemovePreference}
        />
      ))}
    </TableRow>
  );
}
