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

interface TShirtReturnServiceProps {
  supabase: SupabaseClient<Database>;
  eventId: number;
  tshirtSizes: TShirtSize[];
  isAdmin: boolean;
}

export function createTShirtReturnService({
  supabase,
  eventId,
  tshirtSizes,
  isAdmin,
}: TShirtReturnServiceProps) {
  // Return a T-shirt (decrement issuance count)
  const returnTShirt = async (
    volunteerId: string,
    size: string,
    issuances: Record<string, string[]>,
    setIssuances: (issuances: Record<string, string[]>) => void,
    setIssuanceCountsBySize: (counts: Record<string, Record<string, number>>) => void,
    setAllocations: (allocations: Record<string, number>) => void,
    setSaving: (volunteerId: string, isSaving: boolean) => void,
    toast: ReturnType<typeof useToast>["toast"]
  ) => {
    if (!isAdmin) return;

    console.log(`Starting returnTShirt for volunteer ${volunteerId}, size ${size}`);
    setSaving(volunteerId, true);

    try {
      // Check if volunteer has any T-shirts of this size
      const issuedCount = issuances[volunteerId]?.filter(s => s === size).length || 0;
      console.log(`Volunteer has ${issuedCount} ${size} T-shirts issued`);

      if (issuedCount <= 0) {
        throw new Error(`No ${size} T-shirts issued to this volunteer`);
      }

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

      // Update inventory (increment quantity)
      const { error: updateError } = await supabase
        .from('tshirt_inventory')
        .update({
          quantity: (inventoryData?.quantity || 0) + 1,
          quantity_on_hand: (inventoryData?.quantity_on_hand || 0) + 1
        })
        .eq('id', inventoryData.id);

      if (updateError) {
        console.error("Error updating inventory:", updateError);
        throw updateError;
      }

      // Find the issuance to delete
      const { data: issuanceData, error: findError } = await supabase
        .from('tshirt_issuances')
        .select('id, tshirt_inventory_id')
        .eq('volunteer_id', volunteerId)
        .eq('size', size)
        .order('id', { ascending: false })
        .limit(1);

      if (findError) {
        console.error("Error finding issuance to delete:", findError);
        throw new Error(`Failed to find issuance to delete: ${findError.message}`);
      }

      if (!issuanceData || issuanceData.length === 0) {
        throw new Error(`No issuance found to delete for volunteer ${volunteerId}`);
      }

      // Delete the issuance
      const { error: deleteError } = await supabase
        .from('tshirt_issuances')
        .delete()
        .eq('id', issuanceData[0].id);

      if (deleteError) {
        console.error("Error deleting issuance:", deleteError);
        throw new Error(`Failed to delete issuance: ${deleteError.message}`);
      }

      // Fetch the latest issuances for this volunteer
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

      // Update allocation (increment)
      setAllocations(prev => ({
        ...prev,
        [volunteerId]: (prev[volunteerId] || 0) + 1
      }));

      toast({
        title: "Success",
        description: `T-shirt (size ${size}) returned successfully.`,
      });
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

  return {
    returnTShirt
  };
}
