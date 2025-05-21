"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Search, X } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface QRCodeScannerProps {
  onScan: (result: string) => void;
  onSearch: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

/**
 * Component for scanning QR codes
 */
export function QRCodeScanner({
  onScan,
  onSearch,
  searchQuery,
  setSearchQuery
}: QRCodeScannerProps) {
  const [scanning, setScanning] = React.useState(false);
  const scannerRef = React.useRef<Html5QrcodeScanner | null>(null);
  const scannerContainerRef = React.useRef<HTMLDivElement>(null);

  // Start QR code scanner
  const startScanner = () => {
    if (!scannerContainerRef.current) return;

    setScanning(true);

    // Clear any previous scanner
    if (scannerRef.current) {
      scannerRef.current.clear();
    }

    // Create a new scanner
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      false
    );

    // Start the scanner
    scannerRef.current.render(
      (decodedText) => {
        // Handle success
        console.log("QR Code scanned:", decodedText);
        onScan(decodedText);
        stopScanner();
      },
      (errorMessage) => {
        // Handle error
        console.error("QR Code scan error:", errorMessage);
      }
    );
  };

  // Stop QR code scanner
  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
    setScanning(false);
  };

  // Clean up scanner on unmount
  React.useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (error) {
          console.error("Error cleaning up scanner:", error);
        }
      }
    };
  }, []);

  return (
    <Card className="shadow-sm border border-accent/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <QrCode className="mr-2 h-5 w-5 text-accent" />
          QR Code Scanner
        </CardTitle>
        <CardDescription>
          Scan a volunteer's QR code to quickly find their record.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {scanning ? (
          <div className="space-y-4">
            <div id="qr-reader" ref={scannerContainerRef} className="w-full"></div>
            <Button
              variant="outline"
              className="w-full"
              onClick={stopScanner}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel Scanning
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Email or volunteer ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    onSearch();
                  }
                }}
              />
              <Button
                onClick={onSearch}
                disabled={!searchQuery.trim()}
                className="whitespace-nowrap"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            <div className="text-center">
              <span className="text-sm text-muted-foreground">or</span>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={startScanner}
            >
              <QrCode className="mr-2 h-4 w-4" />
              Scan QR Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
