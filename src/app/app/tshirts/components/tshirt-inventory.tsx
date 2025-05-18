"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Shirt, AlertCircle, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";

interface TShirtInventoryProps {
  supabase: SupabaseClient<Database>;
  eventId: number;
}

interface InventoryItem {
  id: number;
  event_id: number;
  size: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export function TShirtInventory({ supabase, eventId }: TShirtInventoryProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [inventory, setInventory] = React.useState<InventoryItem[]>([]);
  const [newSize, setNewSize] = React.useState("");
  const [newQuantity, setNewQuantity] = React.useState(0);
  const [editingItem, setEditingItem] = React.useState<InventoryItem | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Fetch inventory data
  React.useEffect(() => {
    async function fetchInventory() {
      setLoading(true);
      try {
        // First, check if we have any inventory data
        const { data: existingData, error: existingError } = await supabase
          .from('tshirt_inventory')
          .select('*')
          .eq('event_id', eventId)
          .order('size');

        if (existingError) throw existingError;

        if (existingData && existingData.length > 0) {
          setInventory(existingData);
        } else {
          // If no inventory exists, let's create some based on tshirt_sizes
          const { data: sizesData, error: sizesError } = await supabase
            .from('tshirt_sizes')
            .select('*')
            .eq('event_id', eventId)
            .order('sort_order');

          if (sizesError) throw sizesError;

          // Create inventory entries for each size
          if (sizesData && sizesData.length > 0) {
            const inventoryPromises = sizesData.map(size =>
              supabase
                .from('tshirt_inventory')
                .insert({
                  event_id: eventId,
                  size: size.size_name,
                  quantity: 0,
                  tshirt_size_id: size.id,
                  quantity_initial: 0,
                  quantity_on_hand: 0
                })
            );

            await Promise.all(inventoryPromises);

            // Fetch the newly created inventory
            const { data: newData, error: newError } = await supabase
              .from('tshirt_inventory')
              .select('*')
              .eq('event_id', eventId)
              .order('size');

            if (newError) throw newError;
            setInventory(newData || []);
          }
        }
      } catch (error) {
        console.error("Error fetching inventory:", error);
        toast({
          title: "Error",
          description: "Failed to load T-shirt inventory data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchInventory();
  }, [supabase, eventId, toast]);

  const handleAddInventory = async () => {
    setSaving(true);
    try {
      // Check if size already exists for this event
      const existingItem = inventory.find(item =>
        item.event_id === eventId && item.size.toLowerCase() === newSize.toLowerCase()
      );

      if (existingItem) {
        // Update existing inventory
        const { error } = await supabase
          .from('tshirt_inventory')
          .update({
            quantity: existingItem.quantity + newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        // Add new inventory item
        const { error } = await supabase
          .from('tshirt_inventory')
          .insert({
            event_id: eventId,
            size: newSize,
            quantity: newQuantity
          });

        if (error) throw error;
      }

      // Refresh inventory data
      const { data, error } = await supabase
        .from('tshirt_inventory')
        .select('*')
        .eq('event_id', eventId)
        .order('size');

      if (error) throw error;

      setInventory(data || []);
      setNewSize("");
      setNewQuantity(0);
      setIsAddDialogOpen(false);

      toast({
        title: "Success",
        description: "T-shirt inventory updated successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating inventory:", error);
      toast({
        title: "Error",
        description: "Failed to update T-shirt inventory.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditInventory = async () => {
    if (!editingItem) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('tshirt_inventory')
        .update({
          quantity: editingItem.quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      // Refresh inventory data
      const { data, error: fetchError } = await supabase
        .from('tshirt_inventory')
        .select('*')
        .eq('event_id', eventId)
        .order('size');

      if (fetchError) throw fetchError;

      setInventory(data || []);
      setEditingItem(null);
      setIsEditDialogOpen(false);

      toast({
        title: "Success",
        description: "T-shirt inventory updated successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating inventory:", error);
      toast({
        title: "Error",
        description: "Failed to update T-shirt inventory.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInventory = async (id: number) => {
    if (!confirm("Are you sure you want to delete this inventory item?")) return;

    try {
      const { error } = await supabase
        .from('tshirt_inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setInventory(inventory.filter(item => item.id !== id));

      toast({
        title: "Success",
        description: "T-shirt inventory item deleted successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      toast({
        title: "Error",
        description: "Failed to delete T-shirt inventory item.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-4">Loading inventory data...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl flex items-center">
            <Shirt className="mr-2 h-5 w-5 text-primary" />
            T-Shirt Inventory Management
          </CardTitle>
          <CardDescription>
            Manage T-shirt inventory for the current event.
          </CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Inventory
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add T-Shirt Inventory</DialogTitle>
              <DialogDescription>
                Add new T-shirts to the inventory.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="size" className="text-right">
                  Size
                </Label>
                <Input
                  id="size"
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., S, M, L, XL"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">
                  Quantity
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddInventory} disabled={saving || !newSize || newQuantity <= 0}>
                {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {inventory.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Inventory</AlertTitle>
            <AlertDescription>
              No T-shirt inventory found for the current event. Add inventory using the button above.
            </AlertDescription>
          </Alert>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Size</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.size}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{new Date(item.updated_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingItem(item);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteInventory(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit T-Shirt Inventory</DialogTitle>
              <DialogDescription>
                Update the quantity for {editingItem?.size} T-shirts.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-quantity" className="text-right">
                  Quantity
                </Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="0"
                  value={editingItem?.quantity || 0}
                  onChange={(e) => setEditingItem(prev =>
                    prev ? { ...prev, quantity: parseInt(e.target.value) || 0 } : null
                  )}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleEditInventory} disabled={saving}>
                {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
