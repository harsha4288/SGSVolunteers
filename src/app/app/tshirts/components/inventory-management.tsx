"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Package, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useInventoryData } from "../hooks/use-inventory-data";
import { InlineQuantityEditor } from "./common/inline-quantity-editor";
import { InlineEditor } from "./common/inline-editor";
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableColGroup,
  DataTableCol
} from "@/components/ui/data-table";

interface InventoryManagementProps {
  eventId: number;
}

/**
 * T-shirt inventory management component
 * Provides Excel-style editing for inventory quantities
 * Uses reusable DataTable and InlineQuantityEditor components
 */
export function InventoryManagement({ eventId }: InventoryManagementProps) {
  const {
    inventory,
    loading,
    saving,
    updateQuantity,
    updateSizeCode,
    updateSortOrder,
    addSize,
    removeSize,
    refreshInventory,
    getSaving,
  } = useInventoryData({ eventId });

  const [newSizeCode, setNewSizeCode] = React.useState("");
  const [newInitialQuantity, setNewInitialQuantity] = React.useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  // Handle adding new size
  const handleAddSize = async () => {
    if (!newSizeCode.trim() || !newInitialQuantity.trim()) return;

    const quantity = parseInt(newInitialQuantity, 10);
    if (isNaN(quantity) || quantity < 0) return;

    try {
      await addSize(newSizeCode.trim().toUpperCase(), quantity);
      setNewSizeCode("");
      setNewInitialQuantity("");
      setIsAddDialogOpen(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  // Handle removing size
  const handleRemoveSize = async (sizeCode: string) => {
    if (!confirm(`Are you sure you want to remove size ${sizeCode}? This action cannot be undone.`)) {
      return;
    }

    try {
      await removeSize(sizeCode);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-accent" />
            T-shirt Inventory Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage T-shirt sizes and quantities for Event ID: {eventId} (hardcoded for now)
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Note: Event selection will be handled in settings module in future versions
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Size
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New T-shirt Size</DialogTitle>
              <DialogDescription>
                Add a new T-shirt size to the inventory for this event.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="size-code">Size Code</Label>
                <Input
                  id="size-code"
                  value={newSizeCode}
                  onChange={(e) => setNewSizeCode(e.target.value.toUpperCase())}
                  placeholder="e.g., XS, S, M, L, XL, XXL"
                  maxLength={5}
                />
              </div>
              <div>
                <Label htmlFor="initial-quantity">Initial Quantity</Label>
                <Input
                  id="initial-quantity"
                  type="number"
                  value={newInitialQuantity}
                  onChange={(e) => setNewInitialQuantity(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSize}
                disabled={!newSizeCode.trim() || !newInitialQuantity.trim()}
              >
                Add Size
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Inventory Table */}
      {inventory.length > 0 ? (
        <Card className="border-accent/20">
          <CardContent className="p-0">
            <DataTable maxHeight="calc(100vh - 400px)">
              <DataTableColGroup>
                <DataTableCol width="20%" />
                <DataTableCol width="12%" />
                <DataTableCol width="22%" />
                <DataTableCol width="22%" />
                <DataTableCol width="12%" />
                <DataTableCol width="12%" />
              </DataTableColGroup>

              <DataTableHeader>
                <DataTableRow>
                  <DataTableHead align="left">Size Code</DataTableHead>
                  <DataTableHead align="center">Order</DataTableHead>
                  <DataTableHead align="center">Initial Stock</DataTableHead>
                  <DataTableHead align="center">Current Stock</DataTableHead>
                  <DataTableHead align="center">Issued</DataTableHead>
                  <DataTableHead align="center">Actions</DataTableHead>
                </DataTableRow>
              </DataTableHeader>

              <DataTableBody>
                {inventory.map((item) => {
                  const issued = item.quantity - item.quantity_on_hand;
                  const isSaving = getSaving(item.size_cd);
                  const hasIssuances = issued > 0;

                  return (
                    <DataTableRow key={item.size_cd}>
                      <DataTableCell align="left">
                        {hasIssuances ? (
                          <span className="font-medium text-sm">{item.size_cd}</span>
                        ) : (
                          <InlineEditor
                            value={item.size_cd}
                            onSave={(newValue) => updateSizeCode(item.size_cd, newValue as string)}
                            disabled={isSaving}
                            className="mx-auto font-medium"
                            isText={true}
                            maxLength={5}
                          />
                        )}
                      </DataTableCell>

                      <DataTableCell align="center">
                        <InlineQuantityEditor
                          value={item.sort_order}
                          onSave={(newValue) => updateSortOrder(item.size_cd, newValue)}
                          disabled={isSaving}
                          className="mx-auto"
                        />
                      </DataTableCell>

                      <DataTableCell align="center">
                        <InlineQuantityEditor
                          value={item.quantity}
                          onSave={(newValue) => updateQuantity(item.size_cd, newValue, 'initial')}
                          disabled={isSaving}
                          className="mx-auto"
                        />
                      </DataTableCell>

                      <DataTableCell align="center">
                        <span className="text-sm font-medium text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                          {item.quantity_on_hand}
                        </span>
                      </DataTableCell>

                      <DataTableCell align="center">
                        <span className={cn(
                          "text-sm font-medium px-2 py-1 rounded",
                          issued > 0
                            ? "text-destructive bg-destructive/10"
                            : "text-muted-foreground"
                        )}>
                          {issued}
                        </span>
                      </DataTableCell>

                      <DataTableCell align="center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSize(item.size_cd)}
                          disabled={isSaving || hasIssuances}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title={hasIssuances ? "Cannot remove: T-shirts have been issued" : "Remove size"}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </DataTableCell>
                    </DataTableRow>
                  );
                })}
              </DataTableBody>
            </DataTable>
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Inventory Data</AlertTitle>
          <AlertDescription>
            No T-shirt inventory found for this event. Add sizes using the "Add Size" button above.
          </AlertDescription>
        </Alert>
      )}

      {/* Help Text */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Click on editable values to edit them inline (Excel-style)</p>
        <p>• <strong>Size Code:</strong> Editable only when no T-shirts have been issued</p>
        <p>• <strong>Order:</strong> Sort order for display (always editable)</p>
        <p>• <strong>Initial Stock:</strong> Total T-shirts ordered for this size (editable)</p>
        <p>• <strong>Current Stock:</strong> Calculated field (Initial - Issued) - not editable</p>
        <p>• <strong>Issued:</strong> T-shirts already given to volunteers (calculated, highlighted in red if > 0)</p>
        <p>• Sizes with issued T-shirts cannot be removed or have size code changed</p>
      </div>
    </div>
  );
}
