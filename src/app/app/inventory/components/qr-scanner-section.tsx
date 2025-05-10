
"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { QrCode, CameraOff } from "lucide-react";
// Note: QuaggaJS or a similar library would be integrated here for actual QR scanning functionality.
// This is a placeholder for the UI and camera access logic.

export function QrScannerSection() {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [scannedData, setScannedData] = React.useState<string | null>(null);
  const [isScanning, setIsScanning] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    // Clean up camera stream when component unmounts or scanning stops
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);


  const startScan = async () => {
    setScannedData(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        variant: "destructive",
        title: "Camera Not Supported",
        description: "Your browser does not support camera access.",
      });
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
        // Here you would initialize QuaggaJS or other QR library
        // For demo, we'll simulate a scan after a delay
        console.log("QR Scanner Initialized (Simulated)");
        // Example: Quagga.init({...}, () => Quagga.start()); Quagga.onDetected(handleDetected);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setHasCameraPermission(false);
      setIsScanning(false);
      let description = "Please enable camera permissions in your browser settings.";
      if (error instanceof Error && error.name === "NotAllowedError") {
        description = "Camera access was denied. Please allow access in your browser settings.";
      } else if (error instanceof Error && error.name === "NotFoundError") {
        description = "No camera was found. Please ensure a camera is connected and enabled.";
      }
      toast({
        variant: "destructive",
        title: "Camera Access Error",
        description: description,
      });
    }
  };

  const stopScan = () => {
    setIsScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      // Example: Quagga.stop();
    }
    console.log("QR Scanner Stopped (Simulated)");
  };

  // Placeholder for QR detection logic
  const handleDetected = (data: string) => {
    setScannedData(data);
    stopScan();
    toast({
      title: "QR Code Scanned!",
      description: `Data: ${data}. Logging T-shirt issuance... (Simulated)`,
    });
    // Here you would typically send the scanned data to your backend (Supabase)
    // to log the T-shirt issuance against the volunteer's ID.
  };

  // Simulate a scan for demo purposes if scanning is active
  React.useEffect(() => {
    let simTimer: NodeJS.Timeout;
    if (isScanning && hasCameraPermission) {
      simTimer = setTimeout(() => {
        // Simulate a successful scan with a dummy volunteer ID
        if(isScanning) handleDetected(`VOLUNTEER_ID_${Date.now()}`);
      }, 5000); // Simulate scan after 5 seconds
    }
    return () => clearTimeout(simTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning, hasCameraPermission]);


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center">
          <QrCode className="mr-2 h-5 w-5 text-accent" />
          Scan QR Code for T-Shirt Issuance
        </CardTitle>
        <CardDescription>
          Use the camera to scan a volunteer's QR code to log T-shirt issuance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isScanning ? (
          <Button onClick={startScan} className="w-full sm:w-auto">
            <QrCode className="mr-2 h-4 w-4" /> Start Scanning
          </Button>
        ) : (
          <Button onClick={stopScan} variant="outline" className="w-full sm:w-auto">
            <CameraOff className="mr-2 h-4 w-4" /> Stop Scanning
          </Button>
        )}

        <div className="mt-4 p-4 border rounded-md bg-muted/30 min-h-[200px] flex items-center justify-center">
          {isScanning && hasCameraPermission && (
            <video ref={videoRef} className="w-full max-w-md aspect-video rounded-md bg-black" autoPlay playsInline muted />
          )}
          {!isScanning && hasCameraPermission === null && <p className="text-muted-foreground">Click 'Start Scanning' to activate the camera.</p>}
          {hasCameraPermission === false && (
             <Alert variant="destructive" className="w-full max-w-md">
              <CameraOff className="h-5 w-5" />
              <AlertTitle>Camera Access Issue</AlertTitle>
              <AlertDescription>
                Could not access the camera. Please ensure permissions are granted and a camera is available.
              </AlertDescription>
            </Alert>
          )}
           {isScanning && hasCameraPermission && <p className="text-muted-foreground absolute">Aim camera at QR code... (Simulating scan)</p>}
        </div>

        {scannedData && (
          <Alert variant="default">
            <QrCode className="h-5 w-5" />
            <AlertTitle>Scan Successful!</AlertTitle>
            <AlertDescription>
              Scanned Data: <strong>{scannedData}</strong>. T-shirt issuance logged (simulated).
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
