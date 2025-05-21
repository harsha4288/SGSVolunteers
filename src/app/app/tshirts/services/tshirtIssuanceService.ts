"use client";

import { useToast } from "@/hooks/use-toast";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";

interface TShirtSize {
  id: number;
  event_id: number;
  size_name: string;
  sort_order: number;
}

interface TShirtIssuanceServiceProps {
  supabase: SupabaseClient<Database>;
  eventId: number;
  profileId: string;
  isAdmin: boolean;
  tshirtSizes: TShirtSize[];
}

export function createTShirtIssuanceService({
  supabase,
  eventId,
  profileId,
  isAdmin,
  tshirtSizes,
}: TShirtIssuanceServiceProps) {
  // Issue T-shirts to a volunteer
  const issueTShirt = async (
    volunteerId: string,
    size: string,
    quantity: number = 1,
    allocations: Record<string, number>,
    setAllocations: (allocations: Record<string, number>) => void,
    setIssuances: (issuances: Record<string, string[]>) => void,
    setIssuanceCountsBySize: (counts: Record<string, Record<string, number>>) => void,
    setSaving: (volunteerId: string, isSaving: boolean) => void,
    toast: ReturnType<typeof useToast>["toast"],
    setPendingIssuance?: (data: { volunteerId: string; size: string; quantity: number } | null) => void,
    setConfirmationOpen?: (open: boolean) => void
  ) => {
    if (!isAdmin) return;

    // Check if volunteer has remaining allocation
    if (allocations[volunteerId] < quantity) {
      // For admin, show confirmation dialog instead of hard error
      if (setPendingIssuance && setConfirmationOpen) {
        setPendingIssuance({ volunteerId, size, quantity });
        setConfirmationOpen(true);
        return;
      }
    }

    // If within allocation limits or confirmation dialog not available, process directly
    await processIssuance(
      volunteerId,
      size,
      quantity,
      allocations,
      setAllocations,
      setIssuances,
      setIssuanceCountsBySize,
      setSaving,
      toast
    );
  };

  // Process T-shirt issuance after confirmation
  const processIssuance = async (
    volunteerId: string,
    size: string,
    quantity: number = 1,
    allocations: Record<string, number>,
    setAllocations: (allocations: Record<string, number>) => void,
    setIssuances: (issuances: Record<string, string[]>) => void,
    setIssuanceCountsBySize: (counts: Record<string, Record<string, number>>) => void,
    setSaving: (volunteerId: string, isSaving: boolean) => void,
    toast: ReturnType<typeof useToast>["toast"]
  ) => {
    if (!isAdmin) return;

    console.log(`Starting processIssuance for volunteer ${volunteerId}, size ${size}, quantity ${quantity}`);
    setSaving(volunteerId, true);

    // Update allocation immediately for better UX
    setAllocations(prev => ({
      ...prev,
      [volunteerId]: Math.max(0, (prev[volunteerId] || 0) - quantity)
    }));

    try {
      // Find the size ID
      console.log("Looking for size in tshirtSizes:", tshirtSizes);
      const sizeObj = tshirtSizes.find(s => s.size_name === size);
      if (!sizeObj) {
        console.error(`Size ${size} not found in tshirtSizes:`, tshirtSizes);
        throw new Error(`Size ${size} not found`);
      }

      // Check inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('tshirt_inventory')
        .select('id, quantity, quantity_on_hand')
        .eq('tshirt_size_id', sizeObj.id)
        .single();

      if (inventoryError) {
        console.error("Error fetching inventory:", inventoryError);
        throw inventoryError;
      }

      if (!inventoryData || inventoryData.quantity < quantity) {
        throw new Error(`Only ${inventoryData?.quantity || 0} T-shirts available for size ${size}, but tried to issue ${quantity}`);
      }

      // Update inventory
      const { error: updateError } = await supabase
        .from('tshirt_inventory')
        .update({
          quantity: inventoryData.quantity - quantity,
          quantity_on_hand: inventoryData.quantity_on_hand - quantity
        })
        .eq('id', inventoryData.id);

      if (updateError) {
        console.error("Error updating inventory:", updateError);
        throw updateError;
      }

      // Record issuance in the database
      const insertData = {
        volunteer_id: volunteerId,
        tshirt_inventory_id: inventoryData.id,
        issued_by_profile_id: profileId,
        size: size
      };

      const { error: insertError } = await supabase
        .from('tshirt_issuances')
        .insert(insertData);

      if (insertError) {
        console.error("Error recording issuance:", insertError);
        throw new Error(`Failed to record issuance: ${insertError.message}`);
      }

      // Update preference if it exists
      const { data: prefData, error: prefError } = await supabase
        .from('volunteer_tshirt_preferences')
        .select('id')
        .eq('volunteer_id', volunteerId)
        .eq('event_id', eventId)
        .eq('tshirt_size_id', sizeObj.id)
        .eq('is_fulfilled', false)
        .single();

      if (!prefError && prefData) {
        const { error: updatePrefError } = await supabase
          .from('volunteer_tshirt_preferences')
          .update({ is_fulfilled: true })
          .eq('id', prefData.id);

        if (updatePrefError) {
          console.error("Error updating preference:", updatePrefError);
          // Continue even if this fails
        }
      }

      // Update local state directly first for immediate feedback
      setIssuances(prev => {
        const newIssuances = { ...prev };
        if (!newIssuances[volunteerId]) {
          newIssuances[volunteerId] = [];
        }
        newIssuances[volunteerId] = [...newIssuances[volunteerId], size];
        return newIssuances;
      });

      // Update issuance counts
      setIssuanceCountsBySize(prev => {
        const newCounts = { ...prev };
        if (!newCounts[volunteerId]) {
          newCounts[volunteerId] = {};
        }
        if (!newCounts[volunteerId][size]) {
          newCounts[volunteerId][size] = 0;
        }
        newCounts[volunteerId][size]++;
        return newCounts;
      });

      // Then fetch the latest data from the database to ensure consistency
      try {
        const { data: latestIssuances, error: fetchError } = await supabase
          .from('tshirt_issuances')
          .select('id, size')
          .eq('volunteer_id', volunteerId);

        if (fetchError) {
          console.error("Error fetching latest issuances:", fetchError);
        } else {
          // Update local state with the latest data from the database
          setIssuances(prev => {
            const newIssuances = { ...prev };
            newIssuances[volunteerId] = latestIssuances.map(i => i.size);
            return newIssuances;
          });

          // Recalculate issuance counts
          setIssuanceCountsBySize(prev => {
            const newCounts = { ...prev };
            newCounts[volunteerId] = {};

            // Count by size
            latestIssuances.forEach(issuance => {
              if (!newCounts[volunteerId][issuance.size]) {
                newCounts[volunteerId][issuance.size] = 0;
              }
              newCounts[volunteerId][issuance.size]++;
            });

            return newCounts;
          });
        }
      } catch (error) {
        console.error("Error updating issuance data:", error);
      }

      // Update allocation
      setAllocations(prev => ({
        ...prev,
        [volunteerId]: Math.max(0, (prev[volunteerId] || 0) - quantity)
      }));

      toast({
        title: "Success",
        description: quantity === 1
          ? `T-shirt (size ${size}) issued successfully.`
          : `${quantity} T-shirts (size ${size}) issued successfully.`,
      });
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

  return {
    issueTShirt,
    processIssuance
  };
}
