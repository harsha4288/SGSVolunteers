"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import { useIsMobile } from "@/hooks/use-mobile";
import { TShirtHeader } from "./TShirtHeader";
import { NoVolunteersAlert } from "./NoVolunteersAlert";
import { TShirtConfirmationDialog } from "./TShirtConfirmationDialog";
import { TShirtAllocationRow } from "./TShirtAllocationRow";
import { useTShirtData } from "../hooks/useTShirtData";
import { useTShirtInventory } from "../hooks/useTShirtInventory";
import { createTShirtService } from "../services/tshirtService";
import { createTShirtIssuanceService } from "../services/tshirtIssuanceService";
import { createTShirtReturnService } from "../services/tshirtReturnService";

interface TShirtSize {
  id: number;
  event_id: number;
  size_name: string;
  sort_order: number;
}

interface Volunteer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  requested_tshirt_quantity?: number;
  profile_id?: string;
}

interface TShirtSizeGridProps {
  supabase: SupabaseClient<Database>;
  isAdmin: boolean;
  eventId: number;
  tshirtSizes: TShirtSize[];
  volunteer: Volunteer | null;
  familyMembers: Volunteer[];
  searchResults: Volunteer[];
  profileId: string;
}

export function TShirtSizeGrid({
  supabase,
  isAdmin,
  eventId,
  tshirtSizes,
  volunteer,
  familyMembers,
  searchResults,
  profileId
}: TShirtSizeGridProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Confirmation dialog state
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [pendingIssuance, setPendingIssuance] = React.useState<{
    volunteerId: string;
    size: string;
    quantity: number;
  } | null>(null);

  // Use custom hooks for data fetching and state management
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
    setState
  } = useTShirtData({
    supabase,
    eventId,
    volunteer,
    familyMembers,
    searchResults,
    isAdmin
  });

  const { displaySizes } = useTShirtInventory({
    supabase,
    eventId,
    tshirtSizes
  });

  // Create service instances
  const tshirtService = createTShirtService({
    supabase,
    eventId,
    profileId,
    isAdmin
  });

  const tshirtIssuanceService = createTShirtIssuanceService({
    supabase,
    eventId,
    profileId,
    isAdmin,
    tshirtSizes
  });

  const tshirtReturnService = createTShirtReturnService({
    supabase,
    eventId,
    tshirtSizes,
    isAdmin
  });

  // Handler functions
  const handleTogglePreference = async (volunteerId: string, sizeId: string) => {
    await tshirtService.togglePreference(
      volunteerId,
      sizeId,
      preferences,
      allocations,
      displaySizes,
      (prefs) => setState(prev => ({ ...prev, preferences: prefs })),
      (counts) => setState(prev => ({ ...prev, preferenceCountsBySize: counts })),
      setSaving,
      toast,
      handleIssueTShirt
    );
  };

  const handleIssueTShirt = async (volunteerId: string, size: string, quantity: number = 1) => {
    await tshirtIssuanceService.issueTShirt(
      volunteerId,
      size,
      quantity,
      allocations,
      (allocs) => setState(prev => ({ ...prev, allocations: allocs })),
      (issues) => setState(prev => ({ ...prev, issuances: issues })),
      (counts) => setState(prev => ({ ...prev, issuanceCountsBySize: counts })),
      setSaving,
      toast,
      setPendingIssuance,
      setConfirmationOpen
    );
  };

  const handleReturnTShirt = async (volunteerId: string, size: string) => {
    await tshirtReturnService.returnTShirt(
      volunteerId,
      size,
      issuances,
      (issues) => setState(prev => ({ ...prev, issuances: issues })),
      (counts) => setState(prev => ({ ...prev, issuanceCountsBySize: counts })),
      (allocs) => setState(prev => ({ ...prev, allocations: allocs })),
      setSaving,
      toast
    );
  };

  const handleConfirmIssuance = async () => {
    if (pendingIssuance) {
      await tshirtIssuanceService.processIssuance(
        pendingIssuance.volunteerId,
        pendingIssuance.size,
        pendingIssuance.quantity,
        allocations,
        (allocs) => setState(prev => ({ ...prev, allocations: allocs })),
        (issues) => setState(prev => ({ ...prev, issuances: issues })),
        (counts) => setState(prev => ({ ...prev, issuanceCountsBySize: counts })),
        setSaving,
        toast
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

      <TShirtHeader tshirtSizesCount={tshirtSizes.length} />
      
      <Table className="border-collapse">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[180px] font-semibold">Volunteer</TableHead>
            <TableHead className="w-[60px] font-semibold text-center">Max</TableHead>
            <TableHead className="w-[120px] font-semibold text-center">Preferences</TableHead>
            <TableHead className="w-[120px] font-semibold text-center">Issued</TableHead>
            {displaySizes.map(size => (
              <TableHead key={size.id} className="text-center font-semibold">
                {size.size_name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {volunteersToDisplay.map(vol => (
            <TShirtAllocationRow
              key={vol.id}
              volunteer={vol}
              currentVolunteer={volunteer}
              displaySizes={displaySizes}
              isAdmin={isAdmin}
              preferences={preferences}
              allocations={allocations}
              issuances={issuances}
              preferenceCountsBySize={preferenceCountsBySize}
              issuanceCountsBySize={issuanceCountsBySize}
              saving={saving}
              onTogglePreference={handleTogglePreference}
              onIssueTShirt={handleIssueTShirt}
              onReturnTShirt={handleReturnTShirt}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
