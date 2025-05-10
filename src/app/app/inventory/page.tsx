
import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shirt } from "lucide-react";
import { QrScannerSection } from "./components/qr-scanner-section";

export const metadata: Metadata = {
  title: "T-shirt Inventory & Issuance",
  description: "Manage T-shirt inventory and log issuance using QR codes.",
};

export default function InventoryPage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <Shirt className="mr-2 h-6 w-6 text-accent" />
            T-shirt Inventory Management
          </CardTitle>
          <CardDescription>
            Track T-shirt sizes, quantities, and log issuance to volunteers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Inventory details and management tools will be displayed here once the database is connected.
            This section will allow tracking of T-shirt stock (e.g., S, M, L sizes and quantities).
          </p>
          {/* Placeholder for inventory table/summary */}
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
                T-shirt issuance can be logged manually (e.g., in a spreadsheet) and imported into the system later.
                This ensures all issuances are tracked even in offline scenarios.
            </p>
             {/* Placeholder for import functionality or instructions */}
        </CardContent>
      </Card>
    </div>
  );
}
