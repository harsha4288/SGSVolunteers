
import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shirt, Package, AlertCircle } from "lucide-react";
import { QrScannerSection } from "./components/qr-scanner-section";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TShirtInventory, TShirtSize } from "@/lib/types/supabase";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = {
  title: "T-shirt Inventory & Issuance",
  description: "Manage T-shirt inventory and log issuance using QR codes.",
};

// Assume a default event ID for now
const CURRENT_EVENT_ID = 1; 

type TShirtInventoryWithDetails = TShirtInventory & {
  tshirt_sizes: Pick<TShirtSize, 'size_name'> | null;
};

async function getTShirtInventoryData() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tshirt_inventory')
    .select(`
      id,
      quantity_initial,
      quantity_on_hand,
      tshirt_sizes (size_name) 
    `)
    .eq('event_id', CURRENT_EVENT_ID)
    .order('tshirt_sizes(sort_order)', { ascending: true }); // Assuming tshirt_sizes has a sort_order

  if (error) {
    console.error("Error fetching T-shirt inventory:", error);
    return { inventory: [], error: error.message };
  }
  return { inventory: data as TShirtInventoryWithDetails[] || [], error: null };
}


export default async function InventoryPage() {
  const { inventory, error } = await getTShirtInventoryData();

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <Package className="mr-2 h-6 w-6 text-accent" />
            T-shirt Inventory Management
          </CardTitle>
          <CardDescription>
            Track T-shirt sizes and quantities. Issuance via QR scanning below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Inventory</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {inventory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Initial Stock</TableHead>
                  <TableHead className="text-right">Available Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.tshirt_sizes?.size_name || 'Unknown Size'}</TableCell>
                    <TableCell className="text-right">{item.quantity_initial}</TableCell>
                    <TableCell className="text-right">{item.quantity_on_hand}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            !error && <p className="text-muted-foreground">No T-shirt inventory data found for the current event.</p>
          )}
        </CardContent>
      </Card>

      <QrScannerSection />
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Manual T-Shirt Logging</CardTitle>
          <CardDescription>
            For volunteers without mobile data or if QR scanning is unavailable.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground mb-4">
                Manual T-shirt issuance can be logged directly in Supabase or via an import process (TBD).
                This ensures all issuances are tracked even in offline scenarios.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
