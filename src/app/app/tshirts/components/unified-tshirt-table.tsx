"use client";

import * as React from "react";
// Using native HTML table elements for better column alignment control
import { Button } from "@/components/ui/button";
import { Plus, Minus, Shirt } from "lucide-react";

import { useUnifiedTShirtData } from "../hooks/use-unified-tshirt-data";
import { InventoryBadge } from "./common/inventory-badge";
import { InlineQuantityEditor } from "./common/inline-quantity-editor";
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableColGroup,
  DataTableCol,
  // DataTableBadge, // Not used directly in this table for now, InlineQuantityEditor is different
} from "@/components/ui/data-table";
import type { Volunteer } from "../types";

interface UnifiedTShirtTableProps {
  eventId: number;
  volunteers: Volunteer[];
  isAdmin: boolean;
  currentVolunteerId?: string;
  currentProfileId?: string;
  eventSettings: { default_tshirt_allocation: number } | null; // Added eventSettings prop
}

/**
 * Modern T-shirt table component using the unified hook
 * Includes inventory display in headers
 */
export function UnifiedTShirtTable({
  eventId,
  volunteers,
  isAdmin,
  currentVolunteerId,
  currentProfileId,
  eventSettings, // Destructure eventSettings
}: UnifiedTShirtTableProps) {
  const {
    displaySizes,
    loading,
    saving,
    getPreferenceCount,
    getIssuanceCount,
    handleAddPreference,
    handleRemovePreference,
    handleIssueTShirt,
    handleReturnTShirt,
    handleSetQuantity,
  } = useUnifiedTShirtData({
    eventId,
    volunteersToDisplay: volunteers,
    isAdmin,
    currentVolunteerId,
    eventSettings, // Pass eventSettings to the hook
  });

  const getCount = (volunteerId: string, sizeCode: string): number => {
    return isAdmin ? getIssuanceCount(volunteerId, sizeCode) : getPreferenceCount(volunteerId, sizeCode);
  };

  const getPreferencesDisplay = (volunteerId: string): string => {
    const prefs: string[] = [];
    displaySizes.forEach(size => {
      const count = getPreferenceCount(volunteerId, size.size_cd);
      if (count > 0) {
        prefs.push(`${size.size_cd}[${count}]`);
      }
    });
    return prefs.length > 0 ? prefs.join(' ') : '-';
  };

  const handleAdd = async (volunteerId: string, sizeCode: string) => {
    // Remove redundant validation - let the hook handle all validation consistently
    // This ensures volunteers get proper toast messages and admins get confirmation dialogs

    if (isAdmin && currentProfileId) {
      await handleIssueTShirt(volunteerId, sizeCode, currentProfileId, 1, false);
    } else {
      await handleAddPreference(volunteerId, sizeCode, 1, false);
    }
  };

  const handleRemove = async (volunteerId: string, sizeCode: string) => {
    if (isAdmin) {
      await handleReturnTShirt(volunteerId, sizeCode);
    } else {
      await handleRemovePreference(volunteerId, sizeCode);
    }
  };

  const handleQuantityChange = async (volunteerId: string, sizeCode: string, newQuantity: number, allowOverride: boolean = false) => {
    // All validation is handled consistently in the hook layer
    // This ensures uniform behavior across all interaction types
    await handleSetQuantity(volunteerId, sizeCode, newQuantity, currentProfileId, allowOverride);
  };

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

  return (
    <DataTable maxHeight="calc(100vh - 300px)" frozenColumns={[0]}>
      <DataTableColGroup>
        <DataTableCol />{/* Volunteer - flexible width */}
        <DataTableCol />{/* Max */}
        {isAdmin && <DataTableCol />}
        {displaySizes.map((size) => (
          <DataTableCol key={size.size_cd} />
        ))}
      </DataTableColGroup>

      <DataTableHeader>
        <DataTableRow hover={false}>
          {/* Merged header cells for Volunteer, Max, Prefs */}
          <DataTableHead rowSpan={2} align="left" className="px-3" vAlign="middle" colIndex={0}>Volunteer</DataTableHead>
          <DataTableHead rowSpan={2} align="center" vAlign="middle">Max</DataTableHead>
          {isAdmin && (
            <DataTableHead rowSpan={2} align="center" vAlign="middle">Prefs</DataTableHead>
          )}
          {/* Reduced height for Issued/Preferences header */}
          <DataTableHead
            colSpan={displaySizes.length}
            align="center"
            border={false}
            className="bg-accent/10 border-b border-accent/20 py-0 h-4"
          >
            <span className="text-xs">{isAdmin ? "Issued" : "Preferences"}</span>
          </DataTableHead>
        </DataTableRow>
        <DataTableRow hover={false}>
          {/* Size columns with inventory badges */}
          {displaySizes.map((size) => (
            <DataTableHead key={size.size_cd} align="center" border={false} className="py-0 px-1" vAlign="middle"><div className="flex flex-col items-center gap-0">
                <span className="text-xs font-medium">{size.size_cd}</span>
                {isAdmin && (
                  <InventoryBadge
                    count={size.quantity_on_hand}
                    initialQuantity={size.quantity}
                    isClickable={false}
                    className="text-xs"
                  />
                )}
              </div></DataTableHead>
          ))}
        </DataTableRow>
      </DataTableHeader>

      <DataTableBody>
        {volunteers.map((volunteer) => {
          const isSaving = saving[volunteer.id];

          return (
            <DataTableRow key={volunteer.id}>
              <DataTableCell
                className="font-medium px-3" // No width constraints - let content determine size
                vAlign="middle"
                colIndex={0}
              ><div className="flex flex-col">
                  <span className={volunteer.id === currentVolunteerId ? "font-bold text-primary text-sm" : "text-sm"}>
                    {volunteer.first_name} {volunteer.last_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {volunteer.email}
                  </span>
                </div></DataTableCell>
              <DataTableCell align="center" className="text-sm font-medium" vAlign="middle">
                {volunteer.requested_tshirt_quantity || 0}
              </DataTableCell>
              {isAdmin && (
                <DataTableCell align="center" vAlign="middle"><span className="text-xs text-muted-foreground">
                    {getPreferencesDisplay(volunteer.id)}
                  </span></DataTableCell>
              )}
              {displaySizes.map((size) => {
                const count = getCount(volunteer.id, size.size_cd);
                const showControls = count > 0;

                return (
                  <DataTableCell key={size.size_cd} align="center" border={false} className="py-1 px-1" vAlign="middle">{showControls ? (
                      <div className="flex items-center justify-center gap-0.5 bg-muted/30 rounded px-1 py-0.5 min-w-[50px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 text-destructive hover:text-destructive hover:bg-destructive/20 rounded-sm"
                          disabled={isSaving || count === 0}
                          onClick={() => handleRemove(volunteer.id, size.size_cd)}
                          title="Remove one"
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </Button>

                        <InlineQuantityEditor
                          value={count}
                          onSave={(newValue) => handleQuantityChange(volunteer.id, size.size_cd, newValue)}
                          disabled={isSaving}
                        />

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 text-primary hover:text-primary hover:bg-primary/20 rounded-sm"
                          disabled={isSaving}
                          onClick={() => handleAdd(volunteer.id, size.size_cd)}
                          title="Add one"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-accent/20 text-muted-foreground hover:text-primary transition-colors"
                        disabled={isSaving}
                        onClick={() => handleAdd(volunteer.id, size.size_cd)}
                        title={`Add ${size.size_cd} T-shirt ${isAdmin ? 'issuance' : 'preference'}`}
                      >
                        <Shirt className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </DataTableCell>
                );
              })}
            </DataTableRow>
          );
        })}
      </DataTableBody>
    </DataTable>
  );
}
