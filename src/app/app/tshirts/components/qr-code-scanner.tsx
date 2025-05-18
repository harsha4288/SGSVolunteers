"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Camera, X } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface QRCodeScannerProps {
  onScan: (result: string) => void;
  onSearch: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function QRCodeScanner({
  onScan,
  onSearch,
  searchQuery,
  setSearchQuery
}: QRCodeScannerProps) {
  const { toast } = useToast();
  const [scanning, setScanning] = React.useState(false);
  const [scanner, setScanner] = React.useState<Html5Qrcode | null>(null);
  const scannerRef = React.useRef<HTMLDivElement>(null);

  const startScanner = async () => {
    if (!scannerRef.current) return;

    try {
      setScanning(true);
      const html5QrCode = new Html5Qrcode("qr-reader");
      setScanner(html5QrCode);

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // QR code detected
          html5QrCode.stop();
          setScanning(false);
          onScan(decodedText);
          toast({
            title: "QR Code Detected",
            description: "Volunteer information loaded successfully.",
          });
        },
        (errorMessage) => {
          // QR scan error (do nothing, this is just for logging)
          console.log(errorMessage);
        }
      );
    } catch (err) {
      console.error("Error starting QR scanner:", err);
      setScanning(false);
      toast({
        title: "Scanner Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopScanner = () => {
    if (scanner) {
      scanner.stop().then(() => {
        setScanning(false);
      });
    }
  };

  React.useEffect(() => {
    return () => {
      // Clean up scanner when component unmounts
      if (scanner) {
        scanner.stop().catch(console.error);
      }
    };
  }, [scanner]);

  return (
    <Card className="shadow-sm border border-accent/30">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <QrCode className="h-6 w-6 text-accent" />
          <h3 className="text-xl font-medium">Find Volunteer</h3>
        </div>

        <div className="flex justify-center">
          {!scanning && (
            <Button onClick={startScanner} variant="default" className="h-10 px-6">
              <Camera className="h-5 w-5 mr-2" />
              Scan QR Code
            </Button>
          )}
        </div>

        {scanning && (
          <div className="flex flex-col items-center border-2 border-accent/20 rounded-md p-6 bg-muted/10 mt-4">
            <div id="qr-reader" ref={scannerRef} className="w-full max-w-[350px] h-[350px]"></div>
            <Button onClick={stopScanner} variant="outline" className="mt-6 px-6">
              <X className="h-5 w-5 mr-2" />
              Cancel Scan
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
