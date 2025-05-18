"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Download, RefreshCw, AlertCircle, Check, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { QRCodeCanvas } from "qrcode.react";

interface QRCodeGeneratorProps {
  volunteerId: string;
  eventId: number;
}

export function QRCodeGenerator({ volunteerId, eventId }: QRCodeGeneratorProps) {
  const [qrCodeData, setQrCodeData] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [qrStatus, setQrStatus] = React.useState<{
    is_used: boolean;
    expires_at: string | null;
  } | null>(null);
  const { toast } = useToast();
  const [supabase] = React.useState(() => createClient());

  // Check for existing QR code on component mount
  React.useEffect(() => {
    const fetchExistingQRCode = async () => {
      if (!volunteerId || !eventId) return;

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
        if (data) {
          setQrCodeData(data.qr_code_data);
          setQrStatus({
            is_used: data.is_used,
            expires_at: data.expires_at
          });
        }
      } catch (err) {
        console.error("Error fetching existing QR code:", err);
        setError("Could not check for existing QR codes.");
      } finally {
        setLoading(false);
      }
    };

    fetchExistingQRCode();
  }, [volunteerId, eventId, supabase]);

  const generateQRCode = async () => {
    if (!volunteerId || !eventId) {
      toast({ title: "Error", description: "Missing volunteer or event information.", variant: "destructive" });
      return;
    }

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
      setQrStatus({
        is_used: false,
        expires_at: null
      });

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

    try {
      const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
      if (!canvas) {
        toast({ title: "Error", description: "QR code canvas not found.", variant: "destructive" });
        return;
      }

      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `tshirt-qr-code-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      toast({ title: "Success", description: "QR code downloaded successfully." });
    } catch (error) {
      console.error("Error downloading QR code:", error);
      toast({ title: "Error", description: "Failed to download QR code.", variant: "destructive" });
    }
  };

  const getQrStatusMessage = () => {
    if (!qrStatus) return null;

    if (qrStatus.is_used) {
      return (
        <Alert variant="warning" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>QR Code Already Used</AlertTitle>
          <AlertDescription>This QR code has already been used. Generate a new one if needed.</AlertDescription>
        </Alert>
      );
    }

    if (qrStatus.expires_at && new Date(qrStatus.expires_at) < new Date()) {
      return (
        <Alert variant="warning" className="mt-4">
          <Clock className="h-4 w-4" />
          <AlertTitle>QR Code Expired</AlertTitle>
          <AlertDescription>This QR code has expired. Please generate a new one.</AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert variant="success" className="mt-4">
        <Check className="h-4 w-4" />
        <AlertTitle>QR Code Valid</AlertTitle>
        <AlertDescription>This QR code is valid and ready to use.</AlertDescription>
      </Alert>
    );
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
              <QRCodeCanvas
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

        {qrStatus && getQrStatusMessage()}

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
