"use client";

import * as React from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";

interface TShirtSize {
  id: number;
  event_id: number;
  size_name: string;
  sort_order: number;
}

interface TShirtInventoryItem {
  id: number;
  tshirt_size_id: number;
  quantity_initial: number;
  quantity: number;
  tshirt_sizes?: TShirtSize;
}

interface UseTShirtInventoryProps {
  supabase: SupabaseClient<Database>;
  eventId: number;
  tshirtSizes: TShirtSize[];
}

export function useTShirtInventory({
  supabase,
  eventId,
  tshirtSizes,
}: UseTShirtInventoryProps) {
  const [tshirtInventory, setTshirtInventory] = React.useState<TShirtInventoryItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Fetch T-shirt inventory
  React.useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      console.log("Fetching inventory for event ID:", eventId);

      try {
        // First, let's check if the tshirt_inventory table exists
        const { data: tableInfo, error: tableError } = await supabase
          .from('tshirt_inventory')
          .select('id')
          .limit(1);

        if (tableError) {
          console.error("Error checking tshirt_inventory table:", tableError);
          setLoading(false);
          return;
        }

        // Now fetch the actual inventory data
        const { data, error } = await supabase
          .from('tshirt_inventory')
          .select(`
            id,
            tshirt_size_id,
            quantity_initial,
            quantity,
            tshirt_sizes (
              id,
              size_name,
              sort_order
            )
          `);

        if (error) {
          console.error("Error fetching inventory:", error);
          setLoading(false);
          return;
        }

        if (!data || data.length === 0) {
          console.log("No inventory data found");
          setLoading(false);
          return;
        }

        setTshirtInventory(data);
      } catch (err) {
        console.error("Unexpected error in fetchInventory:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [supabase, eventId]);

  // Store the sizes in state to make them stable
  const [displaySizes, setDisplaySizes] = React.useState<TShirtSize[]>([]);

  // Initialize displaySizes once on mount
  React.useEffect(() => {
    console.log("Initializing displaySizes from tshirtSizes:", tshirtSizes);

    if (tshirtSizes && tshirtSizes.length > 0) {
      console.log("Using provided tshirtSizes:", tshirtSizes);
      setDisplaySizes(tshirtSizes);
    } else {
      // Default sizes if nothing else is available
      const defaultSizes = [
        { id: 1, event_id: eventId, size_name: 'XS', sort_order: 1 },
        { id: 2, event_id: eventId, size_name: 'S', sort_order: 2 },
        { id: 3, event_id: eventId, size_name: 'M', sort_order: 3 },
        { id: 4, event_id: eventId, size_name: 'L', sort_order: 4 },
        { id: 5, event_id: eventId, size_name: 'XL', sort_order: 5 },
        { id: 6, event_id: eventId, size_name: '2XL', sort_order: 6 },
        { id: 7, event_id: eventId, size_name: '3XL', sort_order: 7 },
      ];

      console.log("Using default sizes:", defaultSizes);
      setDisplaySizes(defaultSizes);
    }
  }, []);

  return {
    tshirtInventory,
    displaySizes,
    loading
  };
}
