"use client";

import * as React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Download } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";

interface QRCodeDisplayProps {
  volunteerId: string;
  eventId: number;
  supabase: SupabaseClient<Database>;
}

/**
 * Component for displaying a QR code for a volunteer
 */
export function QRCodeDisplay({ volunteerId, eventId, supabase }: QRCodeDisplayProps) {
  const [volunteerData, setVolunteerData] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const qrRef = React.useRef<HTMLDivElement>(null);

  // Fetch volunteer data
  React.useEffect(() => {
    async function fetchVolunteerData() {
      if (!volunteerId || !supabase) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('volunteers')
          .select('id, first_name, last_name, email')
          .eq('id', volunteerId)
          .single();

        if (error) throw error;
        setVolunteerData(data);
      } catch (error) {
        console.error("Error fetching volunteer data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchVolunteerData();
  }, [volunteerId, supabase]);

  // Generate QR code data
  const qrData = React.useMemo(() => {
    if (!volunteerData) return "";

    // Format: email|volunteer_id
    return `${volunteerData.email}|${volunteerData.id}`;
  }, [volunteerData]);

  // Download QR code as PNG
  const downloadQRCode = () => {
    if (!qrRef.current) return;

    try {
      const svg = qrRef.current.querySelector("svg");
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");

        downloadLink.download = `qrcode-${volunteerData?.first_name || ""}-${volunteerData?.last_name || ""}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };

      img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
    } catch (error) {
      console.error("Error downloading QR code:", error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <QrCode className="mr-2 h-5 w-5 text-primary" />
            Your QR Code
          </CardTitle>
          <CardDescription>Loading your QR code...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="w-48 h-48 bg-muted animate-pulse rounded-md"></div>
        </CardContent>
      </Card>
    );
  }

  if (!volunteerData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <QrCode className="mr-2 h-5 w-5 text-primary" />
            Your QR Code
          </CardTitle>
          <CardDescription>Could not load your QR code.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <QrCode className="mr-2 h-5 w-5 text-primary" />
          Your QR Code
        </CardTitle>
        <CardDescription>
          Show this QR code to receive your T-shirt.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div ref={qrRef} className="bg-white p-2 rounded-md mb-4">
            <QRCodeSVG
              value={qrData}
              size={180}
              level="H"
              includeMargin={true}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={downloadQRCode}
          >
            <Download className="mr-2 h-4 w-4" />
            Download QR Code
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
