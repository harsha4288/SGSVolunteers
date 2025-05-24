"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Shirt } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { TShirtSize, Volunteer } from "@/lib/types/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TShirtPreferencesProps {
  volunteerId: string;
  currentPreference?: string | null;
  eventId?: number;
}

export function TShirtPreferences({ volunteerId, currentPreference, eventId = 1 }: TShirtPreferencesProps) {
  const [selectedSize, setSelectedSize] = React.useState<string>(currentPreference || "");
  const [availableSizes, setAvailableSizes] = React.useState<any[]>([]); // Use any[] to avoid type issues
  const [inventoryStatus, setInventoryStatus] = React.useState<Record<string, number>>({});
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();
  const [supabase] = React.useState(() => createClient());

  // Fetch available T-shirt sizes and inventory
  React.useEffect(() => {
    const fetchSizesAndInventory = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch T-shirt inventory which includes sizes
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('tshirt_inventory')
          .select('event_id, size_cd, quantity_on_hand, sort_order')
          .eq('event_id', eventId)
          .order('sort_order', { ascending: true });

        if (inventoryError) throw inventoryError;

        // Map inventory data to sizes format
        const sizesData = inventoryData?.map(item => ({
          id: item.size_cd, // Use size_cd as the ID
          event_id: item.event_id,
          size_name: item.size_cd, // Use size_cd as size_name
          size_cd: item.size_cd, // Add size_cd field explicitly
          sort_order: item.sort_order,
          created_at: new Date().toISOString() // Add required field
        }));

        setAvailableSizes(sizesData || []);

        // Create a map of size_cd to quantity
        const inventoryMap: Record<string, number> = {};
        inventoryData?.forEach(item => {
          inventoryMap[item.size_cd] = item.quantity_on_hand;
        });
        setInventoryStatus(inventoryMap);
      } catch (err) {
        console.error("Error fetching T-shirt data:", err);
        setError("Could not load T-shirt sizes and inventory. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (volunteerId) {
      fetchSizesAndInventory();
    }
  }, [supabase, volunteerId, eventId]);

  const handleSavePreference = async () => {
    if (!selectedSize) {
      toast({ title: "Error", description: "Please select a T-shirt size.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('volunteers')
        .update({ tshirt_size_preference: selectedSize })
        .eq('id', volunteerId);

      if (error) throw error;
      toast({ title: "Success", description: "T-shirt size preference saved." });
    } catch (error) {
      console.error("Error saving T-shirt preference:", error);
      toast({ title: "Error", description: "Could not save T-shirt size preference.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center">
          <Shirt className="mr-2 h-5 w-5 text-accent" />
          T-shirt Size Preference
        </CardTitle>
        <CardDescription>
          Select your preferred T-shirt size. This helps us prepare the right inventory.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-20">
            <p className="text-muted-foreground">Loading T-shirt sizes...</p>
          </div>
        ) : (
          <>
            <div>
              <Label htmlFor="tshirt-size-select">T-shirt Size</Label>
              <Select
                value={selectedSize}
                onValueChange={setSelectedSize}
                disabled={saving || loading}
              >
                <SelectTrigger id="tshirt-size-select">
                  <SelectValue placeholder="Select T-shirt Size" />
                </SelectTrigger>
                <SelectContent>
                  {availableSizes.length > 0 ? availableSizes.map(size => {
                    const inventory = inventoryStatus[size.size_cd] || 0;
                    const isAvailable = inventory > 0;
                    return (
                      <SelectItem
                        key={size.size_cd}
                        value={size.size_name}
                        disabled={!isAvailable}
                      >
                        {size.size_name} {!isAvailable ? " (Out of Stock)" : ""}
                      </SelectItem>
                    );
                  }) : <SelectItem value="none" disabled>No sizes available</SelectItem>}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Note: Only sizes currently in stock are available for selection.
              </p>
            </div>
            <Button
              onClick={handleSavePreference}
              disabled={saving || !selectedSize}
              className="w-full sm:w-auto"
            >
              {saving ? "Saving..." : "Save Preference"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
