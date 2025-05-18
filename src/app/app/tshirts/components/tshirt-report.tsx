"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Shirt, AlertCircle, Download, RefreshCw, FileSpreadsheet } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";

interface TShirtReportProps {
  supabase: SupabaseClient<Database>;
  eventId: number;
}

interface InventorySummary {
  size: string;
  total: number;
  issued: number;
  remaining: number;
}

interface IssuanceRecord {
  id: number;
  volunteer_id: string;
  volunteer_name: string;
  volunteer_email: string;
  size: string;
  issued_at: string;
  issued_by: string;
}

interface PreferenceRecord {
  size: string;
  count: number;
}

export function TShirtReport({ supabase, eventId }: TShirtReportProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [inventorySummary, setInventorySummary] = React.useState<InventorySummary[]>([]);
  const [issuanceRecords, setIssuanceRecords] = React.useState<IssuanceRecord[]>([]);
  const [preferenceRecords, setPreferenceRecords] = React.useState<PreferenceRecord[]>([]);
  const [exportLoading, setExportLoading] = React.useState(false);

  // Fetch report data
  React.useEffect(() => {
    async function fetchReportData() {
      setLoading(true);
      try {
        // Fetch inventory summary
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('tshirt_inventory')
          .select('size, quantity')
          .eq('event_id', eventId)
          .order('size');

        if (inventoryError) throw inventoryError;

        // Fetch issuance counts by size
        const { data: issuanceCounts, error: issuanceCountError } = await supabase
          .from('tshirt_issuances')
          .select('size, count(*)')
          .eq('event_id', eventId)
          .group('size');

        if (issuanceCountError) throw issuanceCountError;

        // Combine data for inventory summary
        const summary: InventorySummary[] = inventoryData.map(item => {
          const issuedCount = issuanceCounts.find(count => count.size === item.size)?.count || 0;
          return {
            size: item.size,
            total: item.quantity + parseInt(issuedCount),
            issued: parseInt(issuedCount),
            remaining: item.quantity
          };
        });

        setInventorySummary(summary);

        // Fetch detailed issuance records
        const { data: issuanceData, error: issuanceError } = await supabase
          .rpc('get_tshirt_issuance_report', { p_event_id: eventId });

        if (issuanceError) throw issuanceError;

        setIssuanceRecords(issuanceData || []);

        // Fetch preference summary
        const { data: preferenceData, error: preferenceError } = await supabase
          .rpc('get_tshirt_preference_summary');

        if (preferenceError) throw preferenceError;

        setPreferenceRecords(preferenceData || []);
      } catch (error) {
        console.error("Error fetching report data:", error);
        toast({
          title: "Error",
          description: "Failed to load T-shirt report data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchReportData();
  }, [supabase, eventId, toast]);

  // Export data to CSV
  const exportToCSV = (data: any[], filename: string) => {
    setExportLoading(true);
    try {
      if (data.length === 0) {
        toast({
          title: "Error",
          description: "No data to export.",
          variant: "destructive",
        });
        return;
      }

      // Get headers from first object
      const headers = Object.keys(data[0]);
      
      // Convert data to CSV
      const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => 
          headers.map(header => {
            // Handle values that might contain commas
            const value = row[header]?.toString() || '';
            return value.includes(',') ? `"${value}"` : value;
          }).join(',')
        )
      ].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: "Report exported successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Error",
        description: "Failed to export report.",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading report data...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Shirt className="mr-2 h-5 w-5 text-primary" />
          T-Shirt Reports
        </CardTitle>
        <CardDescription>
          View and export T-shirt inventory and issuance reports.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inventory">Inventory Summary</TabsTrigger>
            <TabsTrigger value="issuance">Issuance Records</TabsTrigger>
            <TabsTrigger value="preferences">Size Preferences</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inventory" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">T-Shirt Inventory Summary</h3>
              <Button 
                variant="outline" 
                onClick={() => exportToCSV(inventorySummary, 'tshirt-inventory-summary')}
                disabled={exportLoading || inventorySummary.length === 0}
              >
                {exportLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                Export CSV
              </Button>
            </div>
            
            {inventorySummary.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Data</AlertTitle>
                <AlertDescription>
                  No T-shirt inventory data found for the current event.
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Size</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Remaining</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventorySummary.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.size}</TableCell>
                      <TableCell>{item.total}</TableCell>
                      <TableCell>{item.issued}</TableCell>
                      <TableCell>{item.remaining}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
          
          <TabsContent value="issuance" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">T-Shirt Issuance Records</h3>
              <Button 
                variant="outline" 
                onClick={() => exportToCSV(issuanceRecords, 'tshirt-issuance-records')}
                disabled={exportLoading || issuanceRecords.length === 0}
              >
                {exportLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                Export CSV
              </Button>
            </div>
            
            {issuanceRecords.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Data</AlertTitle>
                <AlertDescription>
                  No T-shirt issuance records found for the current event.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Volunteer</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Issued At</TableHead>
                      <TableHead>Issued By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issuanceRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.volunteer_name}</TableCell>
                        <TableCell>{record.volunteer_email}</TableCell>
                        <TableCell>{record.size}</TableCell>
                        <TableCell>{new Date(record.issued_at).toLocaleString()}</TableCell>
                        <TableCell>{record.issued_by}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="preferences" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">T-Shirt Size Preferences</h3>
              <Button 
                variant="outline" 
                onClick={() => exportToCSV(preferenceRecords, 'tshirt-preference-summary')}
                disabled={exportLoading || preferenceRecords.length === 0}
              >
                {exportLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                Export CSV
              </Button>
            </div>
            
            {preferenceRecords.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Data</AlertTitle>
                <AlertDescription>
                  No T-shirt preference data found.
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Size</TableHead>
                    <TableHead>Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preferenceRecords.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{record.size || "No Preference"}</TableCell>
                      <TableCell>{record.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
