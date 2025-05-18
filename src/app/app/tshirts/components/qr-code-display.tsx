"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Download, RefreshCw, AlertCircle, Check, Clock } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";

interface QRCodeDisplayProps {
  volunteerId: string;
  eventId: number;
  supabase: SupabaseClient<Database>;
}

export function QRCodeDisplay({ volunteerId, eventId, supabase }: QRCodeDisplayProps) {
  const [qrCodeData, setQrCodeData] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [qrStatus, setQrStatus] = React.useState<{
    is_used: boolean;
    expires_at: string | null;
  } | null>(null);
  const { toast } = useToast();

  // Check for existing QR code on component mount
  React.useEffect(() => {
    async function checkExistingQRCode() {
      if (!volunteerId) return;
      
      try {
        setLoading(true);
        
        // Check if volunteer has a QR code
        const { data, error } = await supabase
          .from('volunteer_qr_codes')
          .select('*')
          .eq('volunteer_id', volunteerId)
          .eq('event_id', eventId)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data) {
          setQrCodeData(`${data.email}|${data.volunteer_id}`);
          setQrStatus({
            is_used: data.is_used,
            expires_at: data.expires_at
          });
        }
      } catch (err) {
        console.error("Error checking QR code:", err);
        setError("Failed to check for existing QR code");
      } finally {
        setLoading(false);
      }
    }
    
    checkExistingQRCode();
  }, [volunteerId, eventId, supabase]);

  const generateQRCode = async () => {
    if (!volunteerId) return;
    
    setLoading(true);
    try {
      // Get volunteer email
      const { data: volunteer, error: volunteerError } = await supabase
        .from('volunteers')
        .select('email')
        .eq('id', volunteerId)
        .single();
      
      if (volunteerError) throw volunteerError;
      
      if (!volunteer?.email) {
        throw new Error("Volunteer email not found");
      }
      
      // Create QR code data
      const qrData = `${volunteer.email}|${volunteerId}`;
      setQrCodeData(qrData);
      
      // Check if QR code already exists
      const { data: existingQR, error: existingError } = await supabase
        .from('volunteer_qr_codes')
        .select('id')
        .eq('volunteer_id', volunteerId)
        .eq('event_id', eventId)
        .single();
      
      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }
      
      // Set expiration date (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      if (existingQR) {
        // Update existing QR code
        const { error: updateError } = await supabase
          .from('volunteer_qr_codes')
          .update({
            is_used: false,
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingQR.id);
        
        if (updateError) throw updateError;
      } else {
        // Create new QR code
        const { error: insertError } = await supabase
          .from('volunteer_qr_codes')
          .insert({
            volunteer_id: volunteerId,
            event_id: eventId,
            email: volunteer.email,
            is_used: false,
            expires_at: expiresAt.toISOString()
          });
        
        if (insertError) throw insertError;
      }
      
      setQrStatus({
        is_used: false,
        expires_at: expiresAt.toISOString()
      });
      
      toast({
        title: "Success",
        description: "QR code generated successfully.",
      });
    } catch (err) {
      console.error("Error generating QR code:", err);
      setError("Failed to generate QR code");
      toast({
        title: "Error",
        description: "Failed to generate QR code.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeData) return;
    
    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `tshirt-qr-code-${volunteerId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Success",
      description: "QR code downloaded successfully.",
    });
  };

  const getQrStatusMessage = () => {
    if (!qrStatus) return null;
    
    if (qrStatus.is_used) {
      return (
        <Alert className="mt-2">
          <Check className="h-4 w-4 text-success" />
          <AlertTitle>QR Code Used</AlertTitle>
          <AlertDescription>
            This QR code has already been used.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (qrStatus.expires_at) {
      const expiresAt = new Date(qrStatus.expires_at);
      const now = new Date();
      
      if (expiresAt < now) {
        return (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>QR Code Expired</AlertTitle>
            <AlertDescription>
              This QR code has expired. Please generate a new one.
            </AlertDescription>
          </Alert>
        );
      }
      
      return (
        <Alert className="mt-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <AlertTitle>QR Code Valid</AlertTitle>
          <AlertDescription>
            Valid until {expiresAt.toLocaleDateString()}.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <QrCode className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-medium">Your T-Shirt QR Code</h3>
        </div>
        
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
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>
          ) : (
            <div className="p-4 border rounded-md bg-muted/30 h-[180px] w-[180px] flex items-center justify-center">
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
            size="sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {qrCodeData ? "Regenerate" : "Generate QR Code"}
          </Button>

          {qrCodeData && (
            <Button onClick={downloadQRCode} disabled={loading} size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
