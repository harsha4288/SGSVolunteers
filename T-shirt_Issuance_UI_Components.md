# T-shirt Issuance UI Components

## 1. Volunteer Profile T-shirt Preferences Component

This component will be added to the volunteer profile page to allow volunteers to set their T-shirt size preference.

### Location
`src/app/app/profile/components/tshirt-preferences.tsx`

### Component Structure
```tsx
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

interface TShirtPreferencesProps {
  volunteerId: string;
  currentPreference?: string | null;
}

export function TShirtPreferences({ volunteerId, currentPreference }: TShirtPreferencesProps) {
  const [selectedSize, setSelectedSize] = React.useState<string>(currentPreference || "");
  const [availableSizes, setAvailableSizes] = React.useState<TShirtSize[]>([]);
  const [saving, setSaving] = React.useState(false);
  const { toast } = useToast();
  const [supabase] = React.useState(() => createClient());

  // Fetch available T-shirt sizes
  React.useEffect(() => {
    const fetchSizes = async () => {
      const { data, error } = await supabase
        .from('tshirt_sizes')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error("Error fetching T-shirt sizes:", error);
        toast({ title: "Error", description: "Could not load T-shirt sizes.", variant: "destructive" });
      } else {
        setAvailableSizes(data || []);
      }
    };
    fetchSizes();
  }, [supabase, toast]);

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
        <div>
          <Label htmlFor="tshirt-size-select">T-shirt Size</Label>
          <Select
            value={selectedSize}
            onValueChange={setSelectedSize}
            disabled={saving}
          >
            <SelectTrigger id="tshirt-size-select">
              <SelectValue placeholder="Select T-shirt Size" />
            </SelectTrigger>
            <SelectContent>
              {availableSizes.length > 0 ? availableSizes.map(size => (
                <SelectItem key={size.id} value={size.size_name}>
                  {size.size_name}
                </SelectItem>
              )) : <SelectItem value="none" disabled>No sizes available</SelectItem>}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSavePreference} disabled={saving || !selectedSize} className="w-full sm:w-auto">
          {saving ? "Saving..." : "Save Preference"}
        </Button>
      </CardContent>
    </Card>
  );
}
```

## 2. QR Code Generator Component

This component will allow volunteers to generate QR codes for T-shirt issuance.

### Location
`src/app/app/profile/components/qr-code-generator.tsx`

### Component Structure
```tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Download, RefreshCw, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import QRCode from "qrcode.react"; // Need to install this package

interface QRCodeGeneratorProps {
  volunteerId: string;
  eventId: number;
}

export function QRCodeGenerator({ volunteerId, eventId }: QRCodeGeneratorProps) {
  const [qrCodeData, setQrCodeData] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();
  const [supabase] = React.useState(() => createClient());

  // Check for existing QR code on component mount
  React.useEffect(() => {
    const fetchExistingQRCode = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('volunteer_qr_codes')
          .select('qr_code_data, is_used, expires_at')
          .eq('volunteer_id', volunteerId)
          .eq('event_id', eventId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
          throw error;
        }

        // If we have a valid, unused QR code, use it
        if (data && !data.is_used && (!data.expires_at || new Date(data.expires_at) > new Date())) {
          setQrCodeData(data.qr_code_data);
        }
      } catch (err) {
        console.error("Error fetching existing QR code:", err);
        setError("Could not check for existing QR codes.");
      } finally {
        setLoading(false);
      }
    };

    if (volunteerId && eventId) {
      fetchExistingQRCode();
    }
  }, [volunteerId, eventId, supabase]);

  const generateQRCode = async () => {
    setLoading(true);
    setError(null);
    try {
      // Call the RPC function to generate a QR code
      const { data, error } = await supabase
        .rpc('generate_volunteer_qr_code', {
          p_volunteer_id: volunteerId,
          p_event_id: eventId
        });

      if (error) throw error;
      setQrCodeData(data);
      toast({ title: "Success", description: "QR code generated successfully." });
    } catch (err) {
      console.error("Error generating QR code:", err);
      setError("Could not generate QR code. Please try again.");
      toast({ title: "Error", description: "Failed to generate QR code.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeData) return;

    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `tshirt-qr-code-${new Date().toISOString().split('T')[0]}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center">
          <QrCode className="mr-2 h-5 w-5 text-accent" />
          T-shirt QR Code
        </CardTitle>
        <CardDescription>
          Generate a QR code to present at the help desk for T-shirt pickup.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center">
          {qrCodeData ? (
            <div className="p-4 border rounded-md bg-white">
              <QRCode
                id="qr-code-canvas"
                value={qrCodeData}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
          ) : (
            <div className="p-4 border rounded-md bg-muted/30 h-[200px] w-[200px] flex items-center justify-center">
              <p className="text-muted-foreground text-center">
                {loading ? "Generating QR code..." : "No QR code generated yet"}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button 
            onClick={generateQRCode} 
            disabled={loading}
            variant={qrCodeData ? "outline" : "default"}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {qrCodeData ? "Regenerate QR Code" : "Generate QR Code"}
          </Button>
          
          {qrCodeData && (
            <Button onClick={downloadQRCode} disabled={loading}>
              <Download className="mr-2 h-4 w-4" />
              Download QR Code
            </Button>
          )}
        </div>

        {qrCodeData && (
          <p className="text-sm text-muted-foreground text-center mt-2">
            Present this QR code at the help desk to receive your T-shirt.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

## 3. Enhanced QR Scanner Component

Enhance the existing QR scanner component to properly validate QR codes and handle T-shirt issuance.

### Location
`src/app/app/inventory/components/qr-scanner-section.tsx`

### Key Enhancements
1. Integrate an actual QR code scanning library (e.g., `html5-qrcode`)
2. Validate scanned QR codes using the database function
3. Display volunteer information including their size preference
4. Update inventory when T-shirts are issued

## 4. T-shirt Inventory Management Component

Enhance the existing inventory management page with better CRUD operations.

### Location
`src/app/app/inventory/components/inventory-management.tsx`

### Key Features
1. Add/update T-shirt inventory
2. Display inventory status indicators
3. Filter and sort inventory
4. Generate inventory reports

## 5. Integration with Profile Page

Add the T-shirt preferences and QR code generator components to the volunteer profile page.

### Location
`src/app/app/profile/page.tsx`

### Implementation
Include the new components in the profile page layout, passing the necessary props.

## Dependencies

The following npm packages will need to be installed:

```bash
npm install qrcode.react html5-qrcode
```

## Next Steps

1. Implement the database changes outlined in the SQL file
2. Create the UI components described above
3. Update the existing inventory and QR scanner components
4. Test the complete workflow from preference setting to T-shirt issuance
5. Add reporting functionality for inventory management
