"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Shirt, AlertCircle, Search, RefreshCw, Save, Check, X } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";

interface TShirtIssuanceProps {
  supabase: SupabaseClient<Database>;
  eventId: number;
}

interface Volunteer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  tshirt_size_preference: string | null;
}

interface TShirtIssuance {
  id: number;
  volunteer_id: string;
  event_id: number;
  size: string;
  issued_at: string;
  issued_by_profile_id: string;
}

interface InventoryItem {
  id: number;
  event_id: number;
  size: string;
  quantity: number;
}

export function TShirtIssuance({ supabase, eventId }: TShirtIssuanceProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [volunteers, setVolunteers] = React.useState<Volunteer[]>([]);
  const [selectedVolunteer, setSelectedVolunteer] = React.useState<Volunteer | null>(null);
  const [issuedTShirts, setIssuedTShirts] = React.useState<TShirtIssuance[]>([]);
  const [inventory, setInventory] = React.useState<InventoryItem[]>([]);
  const [selectedSize, setSelectedSize] = React.useState("");
  const [isIssueDialogOpen, setIsIssueDialogOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [profileId, setProfileId] = React.useState<string | null>(null);

  // Get current user's profile ID
  React.useEffect(() => {
    async function getProfileId() {
      try {
        // Check for impersonation first
        const impersonatedProfileId = localStorage.getItem('impersonatedProfileId');

        if (impersonatedProfileId) {
          setProfileId(impersonatedProfileId);
        } else {
          const { data: { user } } = await supabase.auth.getUser();

          if (!user) return;

          const { data: profile, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();

          if (error) throw error;

          setProfileId(profile.id);
        }
      } catch (error) {
        console.error("Error getting profile ID:", error);
      }
    }

    getProfileId();
  }, [supabase]);

  // Search for volunteers
  const searchVolunteers = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('last_name', { ascending: true });

      if (error) throw error;

      setVolunteers(data || []);
    } catch (error) {
      console.error("Error searching volunteers:", error);
      toast({
        title: "Error",
        description: "Failed to search for volunteers.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle volunteer selection
  const selectVolunteer = async (volunteer: Volunteer) => {
    setSelectedVolunteer(volunteer);

    try {
      // Fetch T-shirt issuance history for this volunteer
      const { data: issuanceData, error: issuanceError } = await supabase
        .from('tshirt_issuances')
        .select('*')
        .eq('volunteer_id', volunteer.id)
        .eq('event_id', eventId);

      if (issuanceError) throw issuanceError;

      setIssuedTShirts(issuanceData || []);

      // Fetch available inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('tshirt_inventory')
        .select('*')
        .eq('event_id', eventId)
        .gt('quantity', 0)
        .order('size');

      if (inventoryError) throw inventoryError;

      setInventory(inventoryData || []);

      // Pre-select the volunteer's preferred size if available in inventory
      if (volunteer.tshirt_size_preference) {
        const preferredSizeAvailable = inventoryData?.some(
          item => item.size === volunteer.tshirt_size_preference && item.quantity > 0
        );

        if (preferredSizeAvailable) {
          setSelectedSize(volunteer.tshirt_size_preference);
        } else {
          setSelectedSize("");
        }
      } else {
        setSelectedSize("");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load volunteer data.",
        variant: "destructive",
      });
    }
  };

  // Issue T-shirt
  const issueTShirt = async () => {
    if (!selectedVolunteer || !selectedSize || !profileId) return;

    setSaving(true);
    try {
      // Get inventory ID for the selected size
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('tshirt_inventory')
        .select('id, quantity')
        .eq('event_id', eventId)
        .eq('size', selectedSize)
        .single();

      if (inventoryError) throw inventoryError;

      if (!inventoryData || inventoryData.quantity <= 0) {
        throw new Error(`No T-shirts available for size ${selectedSize}`);
      }

      // Check if volunteer already has a T-shirt
      const { data: existingIssuance, error: existingError } = await supabase
        .from('tshirt_issuances')
        .select('id')
        .eq('volunteer_id', selectedVolunteer.id)
        .eq('event_id', eventId);

      if (existingError) throw existingError;

      if (existingIssuance && existingIssuance.length > 0) {
        throw new Error('Volunteer already has a T-shirt for this event');
      }

      // Decrease inventory
      const { error: updateError } = await supabase
        .from('tshirt_inventory')
        .update({
          quantity: inventoryData.quantity - 1,
          quantity_on_hand: inventoryData.quantity_on_hand - 1
        })
        .eq('id', inventoryData.id);

      if (updateError) throw updateError;

      // Record issuance
      const { error: issuanceError } = await supabase
        .from('tshirt_issuances')
        .insert({
          volunteer_id: selectedVolunteer.id,
          event_id: eventId,
          tshirt_inventory_id: inventoryData.id,
          issued_by_profile_id: profileId,
          size: selectedSize
        });

      if (issuanceError) throw issuanceError;

      // Refresh issuance data
      const { data: issuanceData, error: refreshError } = await supabase
        .from('tshirt_issuances')
        .select('*')
        .eq('volunteer_id', selectedVolunteer.id)
        .eq('event_id', eventId);

      if (refreshError) throw refreshError;

      setIssuedTShirts(issuanceData || []);

      // Refresh inventory data
      const { data: updatedInventory, error: inventoryRefreshError } = await supabase
        .from('tshirt_inventory')
        .select('*')
        .eq('event_id', eventId)
        .gt('quantity', 0)
        .order('size');

      if (inventoryRefreshError) throw inventoryRefreshError;

      setInventory(updatedInventory || []);
      setIsIssueDialogOpen(false);

      toast({
        title: "Success",
        description: `T-shirt (size ${selectedSize}) issued to ${selectedVolunteer.first_name} ${selectedVolunteer.last_name}.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error issuing T-shirt:", error);
      toast({
        title: "Error",
        description: "Failed to issue T-shirt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Shirt className="mr-2 h-5 w-5 text-primary" />
          Issue T-Shirts
        </CardTitle>
        <CardDescription>
          Search for volunteers and issue T-shirts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-6">
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <Button onClick={searchVolunteers} disabled={loading || !searchTerm.trim()}>
            {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            Search
          </Button>
        </div>

        {volunteers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Search Results</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Preferred Size</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {volunteers.map((volunteer) => (
                  <TableRow key={volunteer.id}>
                    <TableCell className="font-medium">
                      {volunteer.first_name} {volunteer.last_name}
                    </TableCell>
                    <TableCell>{volunteer.email}</TableCell>
                    <TableCell>{volunteer.tshirt_size_preference || "None"}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => selectVolunteer(volunteer)}
                      >
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {selectedVolunteer && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                Selected Volunteer: {selectedVolunteer.first_name} {selectedVolunteer.last_name}
              </h3>
              <Dialog open={isIssueDialogOpen} onOpenChange={setIsIssueDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={issuedTShirts.length > 0}>
                    Issue T-Shirt
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Issue T-Shirt</DialogTitle>
                    <DialogDescription>
                      Issue a T-shirt to {selectedVolunteer.first_name} {selectedVolunteer.last_name}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="size" className="text-right">
                        Size
                      </Label>
                      <Select value={selectedSize} onValueChange={setSelectedSize}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventory.map((item) => (
                            <SelectItem key={item.id} value={item.size}>
                              {item.size} ({item.quantity} available)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedVolunteer.tshirt_size_preference && selectedVolunteer.tshirt_size_preference !== selectedSize && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Note</AlertTitle>
                        <AlertDescription>
                          This volunteer's preferred size is {selectedVolunteer.tshirt_size_preference}.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <DialogFooter>
                    <Button onClick={issueTShirt} disabled={saving || !selectedSize}>
                      {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Issue
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {issuedTShirts.length > 0 ? (
              <Alert>
                <Check className="h-4 w-4 text-success" />
                <AlertTitle>T-Shirt Already Issued</AlertTitle>
                <AlertDescription>
                  This volunteer has already been issued a T-shirt (size {issuedTShirts[0].size}) on {new Date(issuedTShirts[0].issued_at).toLocaleString()}.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <X className="h-4 w-4 text-warning" />
                <AlertTitle>No T-Shirt Issued</AlertTitle>
                <AlertDescription>
                  This volunteer has not been issued a T-shirt for the current event.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
