"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Shirt, AlertCircle, Check, RefreshCw } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";

interface FamilyTShirtPreferencesProps {
  supabase: SupabaseClient<Database>;
  volunteer: any | null;
  familyMembers: any[];
  eventId: number;
}

export function FamilyTShirtPreferences({ 
  supabase, 
  volunteer, 
  familyMembers, 
  eventId 
}: FamilyTShirtPreferencesProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [tshirtSizes, setTshirtSizes] = React.useState<string[]>([]);
  const [preferences, setPreferences] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState<Record<string, boolean>>({});

  // Fetch available T-shirt sizes
  React.useEffect(() => {
    async function fetchTshirtSizes() {
      try {
        const { data, error } = await supabase
          .from('tshirt_inventory')
          .select('size')
          .eq('event_id', eventId)
          .gt('quantity', 0);

        if (error) throw error;

        // Extract unique sizes
        const uniqueSizes = [...new Set(data.map(item => item.size))];
        setTshirtSizes(uniqueSizes);
      } catch (error) {
        console.error("Error fetching T-shirt sizes:", error);
        toast({
          title: "Error",
          description: "Failed to load available T-shirt sizes.",
          variant: "destructive",
        });
      }
    }

    fetchTshirtSizes();
  }, [supabase, eventId, toast]);

  // Initialize preferences
  React.useEffect(() => {
    const initialPreferences: Record<string, string> = {};
    
    if (volunteer) {
      initialPreferences[volunteer.id] = volunteer.tshirt_size_preference || '';
    }
    
    familyMembers.forEach(member => {
      initialPreferences[member.id] = member.tshirt_size_preference || '';
    });
    
    setPreferences(initialPreferences);
  }, [volunteer, familyMembers]);

  const handlePreferenceChange = (volunteerId: string, size: string) => {
    setPreferences(prev => ({
      ...prev,
      [volunteerId]: size
    }));
  };

  const savePreference = async (volunteerId: string) => {
    setSaving(prev => ({ ...prev, [volunteerId]: true }));
    
    try {
      const { error } = await supabase
        .from('volunteers')
        .update({ tshirt_size_preference: preferences[volunteerId] })
        .eq('id', volunteerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "T-shirt size preference updated.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error saving preference:", error);
      toast({
        title: "Error",
        description: "Failed to save T-shirt size preference.",
        variant: "destructive",
      });
    } finally {
      setSaving(prev => ({ ...prev, [volunteerId]: false }));
    }
  };

  if (!volunteer && familyMembers.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Volunteer Record</AlertTitle>
        <AlertDescription>
          No volunteer record found for you or your family members. Please contact an administrator.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Shirt className="mr-2 h-5 w-5 text-primary" />
          Family T-Shirt Preferences
        </CardTitle>
        <CardDescription>
          Set T-shirt size preferences for yourself and family members registered with the same email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>T-Shirt Size</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {volunteer && (
              <TableRow key={volunteer.id}>
                <TableCell className="font-medium">
                  {volunteer.first_name} {volunteer.last_name} (You)
                </TableCell>
                <TableCell>{volunteer.email}</TableCell>
                <TableCell>
                  <Select
                    value={preferences[volunteer.id] || ''}
                    onValueChange={(value) => handlePreferenceChange(volunteer.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {tshirtSizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => savePreference(volunteer.id)}
                    disabled={saving[volunteer.id]}
                  >
                    {saving[volunteer.id] ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </TableCell>
              </TableRow>
            )}
            
            {familyMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  {member.first_name} {member.last_name}
                </TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>
                  <Select
                    value={preferences[member.id] || ''}
                    onValueChange={(value) => handlePreferenceChange(member.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {tshirtSizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => savePreference(member.id)}
                    disabled={saving[member.id]}
                  >
                    {saving[member.id] ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
