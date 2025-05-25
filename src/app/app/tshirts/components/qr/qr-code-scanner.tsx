"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QrCode, X, AlertCircle, RefreshCw } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface QRCodeScannerProps {
  onScan: (result: string) => void;
}

/**
 * Component for scanning QR codes
 */
export function QRCodeScanner({
  onScan
}: QRCodeScannerProps) {
  const [scanning, setScanning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = React.useState<boolean | null>(null);
  const scannerRef = React.useRef<Html5QrcodeScanner | null>(null);
  const scannerContainerRef = React.useRef<HTMLDivElement>(null);

  // Request camera permission manually
  const requestCameraPermission = async () => {
    console.log("QR Scanner: Requesting camera permission manually");
    setError(null);

    try {
      console.log("QR Scanner: Calling getUserMedia...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment" // Prefer back camera
        }
      });

      console.log("QR Scanner: getUserMedia successful, stream:", stream);

      // Permission granted, stop the test stream
      stream.getTracks().forEach(track => {
        console.log("QR Scanner: Stopping track:", track.label);
        track.stop();
      });

      setPermissionGranted(true);
      console.log("QR Scanner: Camera permission granted manually");

      // Don't auto-start scanner, let user click the button
      // This gives them control over when to start scanning

    } catch (error) {
      console.error("QR Scanner: Camera permission error:", error);
      setPermissionGranted(false);

      if (error instanceof Error) {
        console.log("QR Scanner: Error name:", error.name);
        console.log("QR Scanner: Error message:", error.message);

        if (error.name === 'NotAllowedError') {
          setError("Camera permission denied. Please try again and allow camera access when prompted.");
        } else if (error.name === 'NotFoundError') {
          setError("No camera found on this device.");
        } else if (error.name === 'NotSupportedError') {
          setError("Camera not supported in this browser.");
        } else if (error.name === 'AbortError') {
          setError("Camera access was aborted. Please try again.");
        } else if (error.name === 'NotReadableError') {
          setError("Camera is already in use by another application.");
        } else {
          setError(`Camera error: ${error.message}`);
        }
      } else {
        setError("Failed to access camera. Please check your browser settings.");
      }
    }
  };

  // Start QR code scanner
  const startScanner = async () => {
    console.log("QR Scanner: Start button clicked");
    setError(null);

    // Check if we're in a secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      const errorMsg = "Camera access requires HTTPS or localhost. Current protocol: " + window.location.protocol;
      console.error("QR Scanner:", errorMsg);
      setError(errorMsg);
      return;
    }

    // Check if mediaDevices is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = "Camera API not supported in this browser";
      console.error("QR Scanner:", errorMsg);
      setError(errorMsg);
      return;
    }

    // Test camera access before starting scanner
    console.log("QR Scanner: Testing camera access before starting scanner");
    try {
      const testStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      console.log("QR Scanner: Camera test successful");
      testStream.getTracks().forEach(track => track.stop());
    } catch (testError) {
      console.error("QR Scanner: Camera test failed:", testError);
      setPermissionGranted(false);

      if (testError instanceof Error) {
        console.log("QR Scanner: Test error name:", testError.name);
        console.log("QR Scanner: Test error message:", testError.message);

        if (testError.message.includes("Permission denied by system")) {
          setError("System-level camera permission denied. Please check your operating system camera settings and allow camera access for your browser.");
        } else if (testError.name === 'NotAllowedError') {
          setError("Camera permission denied. Please click 'Try Camera Access Again' to grant permission.");
        } else if (testError.name === 'NotFoundError') {
          setError("No camera found. Please ensure your device has a camera connected.");
        } else if (testError.name === 'NotReadableError') {
          setError("Camera is already in use by another application. Please close other camera apps and try again.");
        } else {
          setError(`Camera access failed: ${testError.message}`);
        }
      } else {
        setError("Camera access failed. Please check your camera permissions.");
      }
      return;
    }

    console.log("QR Scanner: Setting scanning state to true");
    setScanning(true);
  };

  // Initialize scanner when scanning state changes to true
  React.useEffect(() => {
    if (!scanning) return;

    const initializeScanner = async () => {
      try {
        // Wait a bit for the DOM to update
        await new Promise(resolve => setTimeout(resolve, 100));

        // Now check if the container is available
        if (!scannerContainerRef.current) {
          console.error("QR Scanner: Container ref not found after DOM update");
          setError("Scanner container not found");
          setScanning(false);
          return;
        }

        console.log("QR Scanner: Container found, initializing scanner");

        // Clear any previous scanner
        if (scannerRef.current) {
          console.log("QR Scanner: Clearing previous scanner");
          try {
            await scannerRef.current.clear();
          } catch (clearError) {
            console.warn("QR Scanner: Error clearing previous scanner:", clearError);
          }
        }

        console.log("QR Scanner: Creating new scanner instance");
        // Create a new scanner - let html5-qrcode handle camera permissions
        scannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
            defaultZoomValueIfSupported: 2,
          },
          /* verbose= */ false
        );

        console.log("QR Scanner: Starting scanner render");
        // Start the scanner - this will handle camera permissions internally
        scannerRef.current.render(
          (decodedText) => {
            // Handle success
            console.log("QR Code scanned:", decodedText);
            onScan(decodedText);
            stopScanner();
          },
          (errorMessage) => {
            // Handle error
            console.log("QR Scanner: Scan error:", errorMessage);

            // Check for permission-related errors
            if (errorMessage.includes("Permission") ||
                errorMessage.includes("NotAllowedError") ||
                errorMessage.includes("permission") ||
                errorMessage.includes("denied")) {
              console.log("QR Scanner: Permission error detected, resetting permission state");
              setPermissionGranted(false);
              setError("Camera permission was denied. Please click 'Try Camera Access Again' to retry.");
              setScanning(false);
              return;
            }

            // Check for camera not found errors
            if (errorMessage.includes("NotFoundError") ||
                errorMessage.includes("No camera found")) {
              setError("No camera found. Please ensure your device has a camera.");
              setScanning(false);
              return;
            }

            // Check for camera in use errors
            if (errorMessage.includes("NotReadableError") ||
                errorMessage.includes("in use") ||
                errorMessage.includes("busy")) {
              setError("Camera is already in use by another application. Please close other camera apps and try again.");
              setScanning(false);
              return;
            }

            // Other errors that should stop scanning
            if (errorMessage.includes("NotSupportedError") ||
                errorMessage.includes("OverconstrainedError")) {
              setError("Camera not supported or constraints cannot be satisfied.");
              setScanning(false);
              return;
            }

            // NotFoundException is normal during scanning (no QR code found)
            if (!errorMessage.includes("NotFoundException")) {
              console.warn("QR Scanner: Unexpected error:", errorMessage);
            }
          }
        );

        console.log("QR Scanner: Scanner render initiated");
      } catch (error) {
        console.error("QR Scanner: Error starting scanner:", error);
        setError(`Failed to start scanner: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setScanning(false);
      }
    };

    initializeScanner();
  }, [scanning, onScan]);

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

  // Check camera permissions on mount
  React.useEffect(() => {
    const checkCameraPermissions = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log("QR Scanner: Camera API not supported");
        return;
      }

      try {
        // Check if we can query permissions
        if ('permissions' in navigator) {
          const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          console.log("QR Scanner: Camera permission status:", permission.state);

          if (permission.state === 'granted') {
            setPermissionGranted(true);
          } else if (permission.state === 'denied') {
            setPermissionGranted(false);
          }
          // If 'prompt', leave as null to show the enable button
        }
      } catch (error) {
        console.log("QR Scanner: Could not check camera permissions:", error);
        // Fallback: leave permission as null to show enable button
      }
    };

    checkCameraPermissions();
  }, []);

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
    <div>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={() => setError(null)}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {scanning ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground text-center mb-2">
              Point your camera at a QR code to scan
            </div>
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

            {/* Camera permission flow */}
            {permissionGranted === null && (
              <Button
                variant="outline"
                className="w-full"
                onClick={requestCameraPermission}
                disabled={!!error}
              >
                <QrCode className="mr-2 h-4 w-4" />
                Enable Camera for QR Scanning
              </Button>
            )}

            {permissionGranted === true && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  console.log("QR Scanner button clicked - onClick handler triggered");
                  startScanner();
                }}
                disabled={!!error}
              >
                <QrCode className="mr-2 h-4 w-4" />
                Start QR Scanner
              </Button>
            )}

            {permissionGranted === false && (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={requestCameraPermission}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Camera Access Again
                </Button>

                {/* Troubleshooting guide */}
                <div className="text-xs text-muted-foreground space-y-2">
                  <div className="font-medium">Troubleshooting Camera Access:</div>
                  <div className="space-y-1">
                    <div>• Check if other apps are using the camera</div>
                    <div>• Restart your browser</div>
                    <div>• Check system camera permissions:</div>
                    <div className="ml-4">
                      - Windows: Settings → Privacy → Camera
                    </div>
                    <div className="ml-4">
                      - Mac: System Preferences → Security & Privacy → Camera
                    </div>
                    <div className="ml-4">
                      - iPhone: Settings → Privacy → Camera
                    </div>
                  </div>
                </div>
              </div>
            )}



            {permissionGranted === null && (
              <div className="text-xs text-muted-foreground text-center">
                Click above to request camera access for QR scanning
              </div>
            )}
          </div>
        )}
    </div>
  );
}
