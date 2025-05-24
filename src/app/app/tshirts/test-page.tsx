"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shirt, Plus, Minus } from "lucide-react";

/**
 * Simple test page to verify T-shirt functionality
 */
export default function TShirtTestPage() {
  const [supabase] = React.useState(() => createClient());
  const [testData, setTestData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const testDatabaseConnection = async () => {
    setLoading(true);
    try {
      // Test 1: Get T-shirt sizes
      const { data: sizes, error: sizesError } = await supabase.rpc('get_tshirt_sizes', {
        p_event_id: 1,
      });

      // Test 2: Get volunteer T-shirt data
      const { data: tshirtData, error: tshirtError } = await supabase
        .from('volunteer_tshirts')
        .select('*')
        .eq('event_id', 1)
        .limit(5);

      // Test 3: Get a sample volunteer
      const { data: volunteers, error: volunteerError } = await supabase
        .from('volunteers')
        .select('*')
        .limit(1);

      setTestData({
        sizes: sizesError ? `Error: ${sizesError.message}` : sizes,
        tshirtData: tshirtError ? `Error: ${tshirtError.message}` : tshirtData,
        volunteers: volunteerError ? `Error: ${volunteerError.message}` : volunteers,
      });
    } catch (error) {
      console.error("Test error:", error);
      setTestData({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testAddPreference = async () => {
    if (!testData?.volunteers?.[0]) return;
    
    try {
      const { data, error } = await supabase.rpc('add_tshirt_preference', {
        p_volunteer_id: testData.volunteers[0].id,
        p_event_id: 1,
        p_size_cd: 'M',
        p_quantity: 1,
      });

      if (error) throw error;
      alert(`Success! Added preference with ID: ${data}`);
      testDatabaseConnection(); // Refresh data
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shirt className="mr-2 h-5 w-5" />
            T-Shirt System Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testDatabaseConnection} disabled={loading}>
              {loading ? "Testing..." : "Test Database Connection"}
            </Button>
            <Button onClick={testAddPreference} disabled={!testData?.volunteers?.[0]}>
              Test Add Preference
            </Button>
          </div>

          {testData && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">T-Shirt Sizes:</h3>
                <pre className="bg-muted p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(testData.sizes, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold">Sample T-Shirt Data:</h3>
                <pre className="bg-muted p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(testData.tshirtData, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold">Sample Volunteer:</h3>
                <pre className="bg-muted p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(testData.volunteers, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">UI Test - T-Shirt Icons:</h3>
            <div className="flex gap-4">
              {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                <div key={size} className="flex flex-col items-center gap-2">
                  <span className="text-sm font-medium">{size}</span>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 w-8 p-0 relative bg-primary text-primary-foreground"
                  >
                    <Shirt className="h-4 w-4" />
                    <span className="absolute -top-1 -right-1 bg-background text-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center border">
                      2
                    </span>
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-destructive">
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-xs font-medium px-1">2</span>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-primary">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
