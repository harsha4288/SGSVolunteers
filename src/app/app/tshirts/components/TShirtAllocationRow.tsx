"use client";

import * as React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { TShirtSizeCell } from "./TShirtSizeCell";

interface Volunteer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  requested_tshirt_quantity?: number;
  profile_id?: string;
}

interface TShirtSize {
  id: number;
  event_id: number;
  size_name: string;
  sort_order: number;
}

interface TShirtAllocationRowProps {
  volunteer: Volunteer;
  currentVolunteer: Volunteer | null;
  displaySizes: TShirtSize[];
  isAdmin: boolean;
  preferences: Record<string, Record<string, boolean>>;
  allocations: Record<string, number>;
  issuances: Record<string, string[]>;
  preferenceCountsBySize: Record<string, Record<string, number>>;
  issuanceCountsBySize: Record<string, Record<string, number>>;
  saving: Record<string, boolean>;
  onTogglePreference: (volunteerId: string, sizeId: string) => void;
  onIssueTShirt: (volunteerId: string, size: string, quantity: number) => void;
  onReturnTShirt: (volunteerId: string, size: string) => void;
}

export function TShirtAllocationRow({
  volunteer,
  currentVolunteer,
  displaySizes,
  isAdmin,
  preferences,
  allocations,
  issuances,
  preferenceCountsBySize,
  issuanceCountsBySize,
  saving,
  onTogglePreference,
  onIssueTShirt,
  onReturnTShirt,
}: TShirtAllocationRowProps) {
  return (
    <TableRow key={volunteer.id} className="hover:bg-muted/30">
      <TableCell className="font-medium border-b">
        {volunteer.first_name} {volunteer.last_name}
        {currentVolunteer && volunteer.id === currentVolunteer.id && " (You)"}
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

      {/* Preference Count Cell */}
      <TableCell className="text-center border-b">
        {preferenceCountsBySize[volunteer.id] && Object.keys(preferenceCountsBySize[volunteer.id]).length > 0 ? (
          <div className="flex flex-wrap justify-center gap-1">
            {Object.entries(preferenceCountsBySize[volunteer.id]).map(([size, count]) => (
              <span key={size} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                {size} [{count}]
              </span>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>

      {/* Issue Count Cell */}
      <TableCell className="text-center border-b">
        {issuanceCountsBySize[volunteer.id] && Object.keys(issuanceCountsBySize[volunteer.id]).length > 0 ? (
          <div className="flex flex-wrap justify-center gap-1">
            {Object.entries(issuanceCountsBySize[volunteer.id]).map(([size, count]) => (
              <span key={size} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                {size} [{count}]
              </span>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>

      {displaySizes.map(size => (
        <TShirtSizeCell
          key={size.id}
          volunteerId={volunteer.id}
          size={size}
          isAdmin={isAdmin}
          preferences={preferences}
          issuances={issuances}
          saving={saving}
          onTogglePreference={onTogglePreference}
          onIssueTShirt={onIssueTShirt}
          onReturnTShirt={onReturnTShirt}
        />
      ))}
    </TableRow>
  );
}
