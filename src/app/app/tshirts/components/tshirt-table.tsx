"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import { useIsMobile } from "@/hooks/use-mobile";
import { TShirtHeader } from "./common/tshirt-header";
import { NoVolunteersAlert } from "./common/no-volunteers-alert";
import { TShirtConfirmationDialog } from "./common/tshirt-confirmation-dialog";
import { VolunteerRow } from "./ui/volunteer-row";
import { useTShirtData } from "../hooks/use-tshirt-data";
import { createPreferenceService } from "../services/preference-service";
import { createIssuanceService } from "../services/issuance-service";
import type { Volunteer, TShirtSize, PendingIssuance } from "../types";
import { getDefaultSizes } from "../utils/helpers";

interface TShirtTableProps {
  supabase: SupabaseClient<Database>;
  isAdmin: boolean;
  eventId: number;
  tshirtSizes: TShirtSize[];
  volunteer: Volunteer | null;
  familyMembers: Volunteer[];
  searchResults: Volunteer[];
  profileId: string;
}

/**
 * Main component for displaying the T-shirt management table
 */
export function TShirtTable({
  supabase,
  isAdmin,
  eventId,
  tshirtSizes,
  volunteer,
  familyMembers,
  searchResults,
  profileId
}: TShirtTableProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // State for confirmation dialog
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [pendingIssuance, setPendingIssuance] = React.useState<PendingIssuance | null>(null);
  
  // Store the sizes in state to make them stable
  const [displaySizes, setDisplaySizes] = React.useState<TShirtSize[]>([]);

  // Initialize displaySizes once on mount
  React.useEffect(() => {
    if (tshirtSizes && tshirtSizes.length > 0) {
      setDisplaySizes(tshirtSizes);
    } else {
      // Default sizes if nothing else is available
      setDisplaySizes(getDefaultSizes(eventId));
    }
  }, [tshirtSizes, eventId]);

  // Use the custom hook to manage T-shirt data
  const {
    loading,
    preferences,
    allocations,
    issuances,
    preferenceCountsBySize,
    issuanceCountsBySize,
    saving,
    volunteersToDisplay,
    setSaving,
    setPreferences,
    setPreferenceCountsBySize,
    setIssuances,
    setIssuanceCountsBySize,
    setAllocations
  } = useTShirtData({
    supabase,
    eventId,
    volunteer,
    familyMembers,
    searchResults,
    isAdmin
  });

  // Create services
  const preferenceService = React.useMemo(
    () => createPreferenceService({ supabase, eventId, isAdmin }),
    [supabase, eventId, isAdmin]
  );

  const issuanceService = React.useMemo(
    () => createIssuanceService({ supabase, eventId, profileId, isAdmin }),
    [supabase, eventId, profileId, isAdmin]
  );

  // Handler for toggling preferences
  const handleTogglePreference = async (volunteerId: string, sizeId: string) => {
    // For volunteers, enforce allocation limit as a hard stop
    if (!isAdmin && allocations[volunteerId] <= 0 && !preferences[volunteerId]?.[sizeId]) {
      toast({
        title: "Allocation Limit Reached",
        description: "You have no remaining T-shirt allocation.",
        variant: "destructive",
      });
      return;
    }

    setSaving(volunteerId, true);

    try {
      // Update local state first for immediate feedback
      const newPreferences = JSON.parse(JSON.stringify(preferences)); // Deep clone
      // Make sure the volunteerId exists in the preferences object
      if (!newPreferences[volunteerId]) {
        newPreferences[volunteerId] = {};
      }

      // Always add a preference when clicking the + button
      newPreferences[volunteerId][sizeId] = true;
      setPreferences(newPreferences);

      // Find the size name for this size ID
      const sizeObj = displaySizes.find(s => s.id.toString() === sizeId);
      if (sizeObj) {
        // Update preference counts by size immediately for better UX
        const newCounts = JSON.parse(JSON.stringify(preferenceCountsBySize)); // Deep clone
        if (!newCounts[volunteerId]) {
          newCounts[volunteerId] = {};
        }

        // Adding a preference
        if (!newCounts[volunteerId][sizeObj.size_name]) {
          newCounts[volunteerId][sizeObj.size_name] = 0;
        }
        newCounts[volunteerId][sizeObj.size_name]++;
        
        setPreferenceCountsBySize(newCounts);

        // Add preference to database
        const result = await preferenceService.addPreference(
          volunteerId,
          parseInt(sizeId),
          toast,
          setSaving
        );

        if (result) {
          // Refresh preferences from database to ensure UI is in sync
          const updatedPrefs = await preferenceService.fetchPreferences(volunteerId);
          
          // Update preferences state with the latest data
          const updatedPreferences = { ...preferences };
          updatedPreferences[volunteerId] = {};

          // Create new preference counts object
          const updatedCounts = { ...preferenceCountsBySize };
          updatedCounts[volunteerId] = {};

          // Process the updated preferences
          updatedPrefs.forEach(pref => {
            // Set preference active
            updatedPreferences[volunteerId][pref.tshirt_size_id.toString()] = true;

            // Get size name from the joined tshirt_sizes table
            const sizeName = pref.tshirt_sizes?.size_name;

            if (sizeName) {
              // Initialize count if it doesn't exist
              if (!updatedCounts[volunteerId][sizeName]) {
                updatedCounts[volunteerId][sizeName] = 0;
              }

              // Add this preference's quantity to the total
              updatedCounts[volunteerId][sizeName] += (pref.quantity || 1);
            }
          });

          // Update state with the latest data
          setPreferences(updatedPreferences);
          setPreferenceCountsBySize(updatedCounts);
        }
      }
    } catch (error: any) {
      console.error("Error updating preferences:", error);
      toast({
        title: "Error",
        description: `Failed to update T-shirt preferences: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSaving(volunteerId, false);
    }
  };

  // Handler for removing preferences
  const handleRemovePreference = async (volunteerId: string, sizeId: string) => {
    setSaving(volunteerId, true);

    try {
      // Find the size object
      const sizeObj = displaySizes.find(s => s.id.toString() === sizeId);
      if (!sizeObj) {
        throw new Error(`Size with ID ${sizeId} not found`);
      }

      // Remove preference from database
      const success = await preferenceService.removePreference(
        volunteerId,
        parseInt(sizeId),
        toast,
        setSaving
      );

      if (success) {
        // Refresh preferences from database to ensure UI is in sync
        const updatedPrefs = await preferenceService.fetchPreferences(volunteerId);
        
        // Update preferences state with the latest data
        const updatedPreferences = { ...preferences };
        updatedPreferences[volunteerId] = {};

        // Create new preference counts object
        const updatedCounts = { ...preferenceCountsBySize };
        updatedCounts[volunteerId] = {};

        // Process the updated preferences
        updatedPrefs.forEach(pref => {
          // Set preference active
          updatedPreferences[volunteerId][pref.tshirt_size_id.toString()] = true;

          // Get size name from the joined tshirt_sizes table
          const sizeName = pref.tshirt_sizes?.size_name;

          if (sizeName) {
            // Initialize count if it doesn't exist
            if (!updatedCounts[volunteerId][sizeName]) {
              updatedCounts[volunteerId][sizeName] = 0;
            }

            // Add this preference's quantity to the total
            updatedCounts[volunteerId][sizeName] += (pref.quantity || 1);
          }
        });

        // Update state with the latest data
        setPreferences(updatedPreferences);
        setPreferenceCountsBySize(updatedCounts);
      }
    } catch (error: any) {
      console.error("Error removing preference:", error);
      toast({
        title: "Error",
        description: `Failed to remove T-shirt preference: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSaving(volunteerId, false);
    }
  };

  // Handler for issuing T-shirts
  const handleIssueTShirt = async (volunteerId: string, size: string, quantity: number = 1) => {
    if (!isAdmin) return;

    // Check if volunteer has remaining allocation
    if (allocations[volunteerId] < quantity) {
      // For admin, show confirmation dialog instead of hard error
      setPendingIssuance({ volunteerId, size, quantity });
      setConfirmationOpen(true);
      return;
    }

    // If within allocation limits, process directly
    await processIssuance(volunteerId, size, quantity);
  };

  // Handler for returning T-shirts
  const handleReturnTShirt = async (volunteerId: string, size: string) => {
    if (!isAdmin) return;

    setSaving(volunteerId, true);

    try {
      // Find the size object
      const sizeObj = displaySizes.find(s => s.size_name === size);
      if (!sizeObj) {
        throw new Error(`Size ${size} not found`);
      }

      // Return T-shirt
      const success = await issuanceService.returnTShirt(
        volunteerId,
        size,
        sizeObj.id,
        toast,
        setSaving
      );

      if (success) {
        // Update local state
        // 1. Update issuances
        const newIssuances = { ...issuances };
        const index = newIssuances[volunteerId].findIndex(s => s === size);
        if (index !== -1) {
          newIssuances[volunteerId] = [
            ...newIssuances[volunteerId].slice(0, index),
            ...newIssuances[volunteerId].slice(index + 1)
          ];
        }
        setIssuances(newIssuances);

        // 2. Update issuance counts
        const newCounts = { ...issuanceCountsBySize };
        if (newCounts[volunteerId] && newCounts[volunteerId][size] > 0) {
          newCounts[volunteerId][size]--;
          if (newCounts[volunteerId][size] === 0) {
            delete newCounts[volunteerId][size];
          }
        }
        setIssuanceCountsBySize(newCounts);

        // 3. Update allocation
        const newAllocations = { ...allocations };
        newAllocations[volunteerId] = (newAllocations[volunteerId] || 0) + 1;
        setAllocations(newAllocations);
      }
    } catch (error: any) {
      console.error("Error returning T-shirt:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to return T-shirt.",
        variant: "destructive",
      });
    } finally {
      setSaving(volunteerId, false);
    }
  };

  // Process T-shirt issuance
  const processIssuance = async (volunteerId: string, size: string, quantity: number = 1) => {
    if (!isAdmin) return;

    setSaving(volunteerId, true);

    try {
      // Find the size object
      const sizeObj = displaySizes.find(s => s.size_name === size);
      if (!sizeObj) {
        throw new Error(`Size ${size} not found`);
      }

      // Issue T-shirt
      const success = await issuanceService.issueTShirt(
        volunteerId,
        size,
        sizeObj.id,
        quantity,
        toast,
        setSaving
      );

      if (success) {
        // Update local state
        // 1. Update issuances
        const newIssuances = { ...issuances };
        if (!newIssuances[volunteerId]) {
          newIssuances[volunteerId] = [];
        }
        // Add one entry per quantity
        for (let i = 0; i < quantity; i++) {
          newIssuances[volunteerId].push(size);
        }
        setIssuances(newIssuances);

        // 2. Update issuance counts
        const newCounts = { ...issuanceCountsBySize };
        if (!newCounts[volunteerId]) {
          newCounts[volunteerId] = {};
        }
        if (!newCounts[volunteerId][size]) {
          newCounts[volunteerId][size] = 0;
        }
        newCounts[volunteerId][size] += quantity;
        setIssuanceCountsBySize(newCounts);

        // 3. Update allocation
        const newAllocations = { ...allocations };
        newAllocations[volunteerId] = Math.max(0, (newAllocations[volunteerId] || 0) - quantity);
        setAllocations(newAllocations);
      }
    } catch (error: any) {
      console.error("Error issuing T-shirt:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to issue T-shirt.",
        variant: "destructive",
      });
    } finally {
      setSaving(volunteerId, false);
    }
  };

  // Handle confirmation dialog
  const handleConfirmIssuance = async () => {
    if (pendingIssuance) {
      await processIssuance(
        pendingIssuance.volunteerId,
        pendingIssuance.size,
        pendingIssuance.quantity
      );
    }
    setConfirmationOpen(false);
  };

  if (volunteersToDisplay.length === 0) {
    return <NoVolunteersAlert isAdmin={isAdmin} />;
  }

  return (
    <div className="overflow-x-auto">
      {/* Confirmation Dialog for exceeding allocation */}
      <TShirtConfirmationDialog
        open={confirmationOpen}
        onOpenChange={setConfirmationOpen}
        pendingIssuance={pendingIssuance}
        allocations={allocations}
        onConfirm={handleConfirmIssuance}
      />

      <TShirtHeader tshirtSizesCount={tshirtSizes.length} isAdmin={isAdmin} />

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
            {displaySizes.map(size => (
              <TableHead key={size.id} className="text-center font-semibold">
                {size.size_name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {volunteersToDisplay.map(vol => (
            <VolunteerRow
              key={vol.id}
              volunteer={vol}
              currentVolunteerId={volunteer?.id}
              displaySizes={displaySizes}
              preferences={preferences}
              preferenceCountsBySize={preferenceCountsBySize}
              issuances={issuances}
              issuanceCountsBySize={issuanceCountsBySize}
              allocations={allocations}
              saving={saving}
              isAdmin={isAdmin}
              onTogglePreference={handleTogglePreference}
              onIssueTShirt={handleIssueTShirt}
              onReturnTShirt={handleReturnTShirt}
              onRemovePreference={handleRemovePreference}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
