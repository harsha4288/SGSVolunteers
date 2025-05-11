
"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { QrCode, CameraOff, Shirt } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { InsertTShirtIssuance, TShirtInventory, TShirtSize, Volunteer, Database } from "@/lib/types/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { SupabaseClient } from "@supabase/supabase-js";


// Assume a default event ID for now
const CURRENT_EVENT_ID = 1; 

export function QrScannerSection() {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [scannedVolunteerId, setScannedVolunteerId] = React.useState<string | null>(null);
  const [scannedVolunteerInfo, setScannedVolunteerInfo] = React.useState<Volunteer | null>(null);
  const [isScanning, setIsScanning] = React.useState(false);
  const { toast } = useToast();
  const [supabase, setSupabase] = React.useState<SupabaseClient<Database> | null>(null);
  const [availableTShirts, setAvailableTShirts] = React.useState<(TShirtInventory & { tshirt_sizes: Pick<TShirtSize, 'size_name'> | null })[]>([]);
  const [selectedTShirtInventoryId, setSelectedTShirtInventoryId] = React.useState<string>("");
  const [issuing, setIssuing] = React.useState(false);

  React.useEffect(() => {
    const supabaseInstance = createClient();
    setSupabase(supabaseInstance);
  }, []);


  // Fetch T-Shirt inventory
  React.useEffect(() => {
    if (!supabase) return;

    const fetchTShirtInventory = async () => {
      const { data, error } = await supabase
        .from('tshirt_inventory')
        .select(`
          *,
          tshirt_sizes (size_name)
        `)
        .eq('event_id', CURRENT_EVENT_ID)
        .gt('quantity_on_hand', 0) // Only show sizes with stock
        .order('tshirt_sizes(sort_order)', { ascending: true });

      if (error) {
        console.error("Error fetching T-shirt inventory:", error);
        toast({ title: "Error", description: "Could not load T-shirt inventory.", variant: "destructive" });
      } else {
        setAvailableTShirts(data as any[] || []); // TODO: Fix type cast once relationships are fully typed
      }
    };
    fetchTShirtInventory();
  }, [supabase, toast]);


  React.useEffect(() => {
    // Clean up camera stream
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  const startScan = async () => {
    if (!supabase) {
      toast({ variant: "destructive", title: "Error", description: "Supabase client not initialized." });
      return;
    }
    setScannedVolunteerId(null);
    setScannedVolunteerInfo(null);
    setSelectedTShirtInventoryId("");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({ variant: "destructive", title: "Camera Not Supported", description: "Your browser does not support camera access." });
      setHasCameraPermission(false);
      setIsScanning(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setHasCameraPermission(true);
      setIsScanning(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // TODO: Integrate actual QR scanning library like html5-qrcode or similar
        console.log("QR Scanner Initialized (Actual library integration needed)");
        // For demo, simulate a scan:
        setTimeout(() => handleDetected(`VOLUNTEER_UUID_${Date.now()}`), 3000); // Simulate scan after 3s with a dummy UUID
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setHasCameraPermission(false);
      setIsScanning(false);
      let description = "Please enable camera permissions in your browser settings.";
      if (error instanceof Error && error.name === "NotAllowedError") description = "Camera access denied.";
      else if (error instanceof Error && error.name === "NotFoundError") description = "No camera found.";
      toast({ variant: "destructive", title: "Camera Access Error", description });
    }
  };

  const stopScan = () => {
    setIsScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    console.log("QR Scanner Stopped");
  };

  const handleDetected = async (data: string) => {
    if (!supabase) return;
    // Assuming QR code contains the volunteer's UUID
    setScannedVolunteerId(data); 
    stopScan();

    // Fetch volunteer info
    const { data: volunteerData, error: volunteerError } = await supabase
        .from('volunteers')
        .select('id, first_name, last_name, email')
        .eq('id', data)
        .single();

    if (volunteerError || !volunteerData) {
        console.error("Error fetching volunteer:", volunteerError);
        toast({ title: "Volunteer Not Found", description: `No volunteer found with ID: ${data}`, variant: "destructive" });
        setScannedVolunteerInfo(null);
        return;
    }
    setScannedVolunteerInfo(volunteerData);
    toast({ title: "QR Code Scanned!", description: `Volunteer: ${volunteerData.first_name} ${volunteerData.last_name}. Select T-shirt size.` });
  };


  const handleIssueTShirt = async () => {
    if (!supabase) {
      toast({ title: "Error", description: "Supabase client not initialized.", variant: "destructive" });
      return;
    }
    if (!scannedVolunteerId || !selectedTShirtInventoryId) {
      toast({ title: "Missing Information", description: "Volunteer ID or T-shirt size not selected.", variant: "destructive" });
      return;
    }
    setIssuing(true);

    // Get current user for issued_by_profile_id
    const { data: { user } } = await supabase.auth.getUser();
    let issuedByProfileId: string | null = null;
    if (user) {
        const {data: profile} = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
        if(profile) issuedByProfileId = profile.id;
    }


    const issuanceData: InsertTShirtIssuance = {
      event_id: CURRENT_EVENT_ID,
      volunteer_id: scannedVolunteerId,
      tshirt_inventory_id: parseInt(selectedTShirtInventoryId, 10),
      issued_at: new Date().toISOString(),
      issued_by_profile_id: issuedByProfileId,
    };

    // Start a transaction
    try {
      // 1. Insert into tshirt_issuances
      const { error: issuanceError } = await supabase.from('tshirt_issuances').insert(issuanceData);
      if (issuanceError) throw issuanceError;

      // 2. Decrement quantity_on_hand in tshirt_inventory
      // This should ideally be an RPC call for atomicity (supabase.rpc('decrement_tshirt_quantity', { p_inventory_id: ... }))
      // For simplicity here, doing a select then update (potential race condition without db-level locking/transaction)
      const { data: inventoryItem, error: inventorySelectError } = await supabase
        .from('tshirt_inventory')
        .select('quantity_on_hand')
        .eq('id', selectedTShirtInventoryId)
        .single();
      
      if (inventorySelectError || !inventoryItem) throw inventorySelectError || new Error("Inventory item not found");

      if (inventoryItem.quantity_on_hand <= 0) throw new Error("T-shirt out of stock, issuance aborted.");

      const { error: inventoryUpdateError } = await supabase
        .from('tshirt_inventory')
        .update({ quantity_on_hand: inventoryItem.quantity_on_hand - 1 })
        .eq('id', selectedTShirtInventoryId);
      
      if (inventoryUpdateError) throw inventoryUpdateError;


      toast({ title: "T-Shirt Issued!", description: `Logged for volunteer ${scannedVolunteerInfo?.first_name || scannedVolunteerId}.` });
      setScannedVolunteerId(null);
      setScannedVolunteerInfo(null);
      setSelectedTShirtInventoryId("");
      // Re-fetch inventory to update counts
       const { data: updatedInv, error: refetchError } = await supabase
        .from('tshirt_inventory')
        .select(`*, tshirt_sizes (size_name)`)
        .eq('event_id', CURRENT_EVENT_ID)
        .gt('quantity_on_hand', 0)
        .order('tshirt_sizes(sort_order)', { ascending: true });
      if (!refetchError) setAvailableTShirts(updatedInv as any[] || []);


    } catch (error: any) {
      console.error("Error issuing T-shirt:", error);
      toast({ title: "Issuance Failed", description: error.message || "Could not log T-shirt issuance.", variant: "destructive" });
    } finally {
      setIssuing(false);
    }
  };


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center">
          <QrCode className="mr-2 h-5 w-5 text-accent" />
          Scan QR Code for T-Shirt Issuance
        </CardTitle>
        <CardDescription>
          Use camera to scan volunteer's QR (containing their ID) to log T-shirt issuance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isScanning ? (
          <Button onClick={startScan} className="w-full sm:w-auto" disabled={!supabase}>
            <QrCode className="mr-2 h-4 w-4" /> Start Scanning
          </Button>
        ) : (
          <Button onClick={stopScan} variant="outline" className="w-full sm:w-auto" disabled={!supabase}>
            <CameraOff className="mr-2 h-4 w-4" /> Stop Scanning
          </Button>
        )}

        <div className="mt-4 p-4 border rounded-md bg-muted/30 min-h-[200px] flex items-center justify-center relative">
          {isScanning && hasCameraPermission && (
            <video ref={videoRef} className="w-full max-w-md aspect-video rounded-md bg-black" autoPlay playsInline muted />
          )}
          {!isScanning && hasCameraPermission === null && <p className="text-muted-foreground">Click 'Start Scanning' to activate camera.</p>}
          {hasCameraPermission === false && (
             <Alert variant="destructive" className="w-full max-w-md">
              <CameraOff className="h-5 w-5" /> <AlertTitle>Camera Access Issue</AlertTitle>
              <AlertDescription>Could not access camera. Ensure permissions granted.</AlertDescription>
            </Alert>
          )}
           {isScanning && hasCameraPermission && <p className="text-muted-foreground absolute bottom-2 left-1/2 -translate-x-1/2">Aim camera at QR code... (Simulating scan)</p>}
        </div>

        {scannedVolunteerInfo && (
          <Card className="p-4 space-y-3">
            <h3 className="font-semibold">Volunteer: {scannedVolunteerInfo.first_name} {scannedVolunteerInfo.last_name} ({scannedVolunteerInfo.email})</h3>
             <div>
              <Label htmlFor="tshirt-size-select">Select T-Shirt Size</Label>
              <Select
                value={selectedTShirtInventoryId}
                onValueChange={setSelectedTShirtInventoryId}
                disabled={issuing || !supabase}
              >
                <SelectTrigger id="tshirt-size-select">
                  <SelectValue placeholder="Select T-Shirt Size" />
                </SelectTrigger>
                <SelectContent>
                  {availableTShirts.length > 0 ? availableTShirts.map(item => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.tshirt_sizes?.size_name} (Available: {item.quantity_on_hand})
                    </SelectItem>
                  )) : <SelectItem value="none" disabled>No sizes available</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleIssueTShirt} disabled={!selectedTShirtInventoryId || issuing || !supabase} className="w-full">
              {issuing ? "Issuing..." : "Confirm & Issue T-Shirt"} <Shirt className="ml-2 h-4 w-4" />
            </Button>
          </Card>
        )}
         {scannedVolunteerId && !scannedVolunteerInfo && !isScanning && (
             <Alert variant="info">
                <AlertTitle>Volunteer Processed</AlertTitle>
                <AlertDescription>Previously scanned: {scannedVolunteerId}. Ready for new scan.</AlertDescription>
            </Alert>
         )}
      </CardContent>
    </Card>
  );
}

