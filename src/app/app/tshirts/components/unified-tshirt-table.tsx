"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Shirt } from "lucide-react";

import { useUnifiedTShirtData } from "../hooks/use-unified-tshirt-data";
import { InventoryBadge } from "./common/inventory-badge";
import { InlineQuantityEditor } from "./common/inline-quantity-editor";
import type { Volunteer } from "../types";

interface UnifiedTShirtTableProps {
  eventId: number;
  volunteers: Volunteer[];
  isAdmin: boolean;
  currentVolunteerId?: string;
  currentProfileId?: string;
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
}: UnifiedTShirtTableProps) {
  const router = useRouter();
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
  });

  const handleInventoryClick = () => {
    router.push('/app/inventory');
  };

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
    <div className="rounded-md border">
      <Table className="border-collapse">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[180px] font-semibold">Volunteer</TableHead>
            <TableHead className="w-[60px] font-semibold text-center">Max</TableHead>
            {isAdmin && (
              <TableHead className="w-[120px] font-semibold text-center">Preferences</TableHead>
            )}
            <TableHead colSpan={displaySizes.length} className="text-center font-semibold bg-accent/10 border-b border-accent/20">
              {isAdmin ? "Issued" : "Preferences"}
            </TableHead>
          </TableRow>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[180px] font-semibold"></TableHead>
            <TableHead className="w-[60px] font-semibold text-center"></TableHead>
            {isAdmin && (
              <TableHead className="w-[120px] font-semibold text-center"></TableHead>
            )}
            {displaySizes.map((size) => (
              <TableHead key={size.size_cd} className="text-center font-semibold">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm">{size.size_cd}</span>
                  {isAdmin && (
                    <InventoryBadge
                      count={size.quantity_on_hand}
                      initialQuantity={size.quantity}
                      isClickable={isAdmin}
                      onClick={handleInventoryClick}
                    />
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {volunteers.map((volunteer) => {
            const isSaving = saving[volunteer.id];

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
                  {volunteer.requested_tshirt_quantity || 0}
                </TableCell>

                {isAdmin && (
                  <TableCell className="text-center border-b">
                    <span className="text-xs text-muted-foreground">
                      {getPreferencesDisplay(volunteer.id)}
                    </span>
                  </TableCell>
                )}

                {displaySizes.map((size) => {
                  const count = getCount(volunteer.id, size.size_cd);
                  const showControls = count > 0;

                  return (
                    <TableCell key={size.size_cd} className="text-center border-b p-2">
                      {showControls ? (
                        <div className="flex items-center justify-center gap-1 bg-muted/30 rounded-md px-1 py-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-destructive hover:text-destructive hover:bg-destructive/20 rounded-sm"
                            disabled={isSaving || count === 0}
                            onClick={() => handleRemove(volunteer.id, size.size_cd)}
                            title="Remove one"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>

                          <InlineQuantityEditor
                            value={count}
                            onSave={(newValue) => handleQuantityChange(volunteer.id, size.size_cd, newValue)}
                            disabled={isSaving}
                          />

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-primary hover:text-primary hover:bg-primary/20 rounded-sm"
                            disabled={isSaving}
                            onClick={() => handleAdd(volunteer.id, size.size_cd)}
                            title="Add one"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-accent/20 text-muted-foreground hover:text-primary transition-colors"
                          disabled={isSaving}
                          onClick={() => handleAdd(volunteer.id, size.size_cd)}
                          title={`Add ${size.size_cd} T-shirt ${isAdmin ? 'issuance' : 'preference'}`}
                        >
                          <Shirt className="h-4 w-4" />
                        </Button>
                      )}
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
