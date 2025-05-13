"use client";

import * as React from "react";
import { createProxyClient } from "@/lib/supabase/proxy-client";
import type { Database } from "@/lib/types/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

export default function TestProxyPage() {
  const [supabase, setSupabase] = React.useState<SupabaseClient<Database> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Initialize the Supabase client with the proxy
  React.useEffect(() => {
    try {
      const client = createProxyClient();
      setSupabase(client);
      console.log("Proxy client initialized");
    } catch (err: any) {
      console.error("Error initializing proxy client:", err);
      setError(`Failed to initialize proxy client: ${err.message}`);
    }
  }, []);

  const testConnection = async () => {
    if (!supabase) {
      setError("Supabase client not initialized");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setResults([]);

    try {
      console.log("Testing connection with proxy client...");
      
      // Test connection with a simple query
      const { data, error } = await supabase.from("events").select("*").limit(5);

      if (error) {
        throw error;
      }

      setSuccess("Successfully connected to Supabase via proxy!");
      setResults(data || []);
    } catch (err: any) {
      console.error("Database connection test error:", err);
      setError(`Error: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const testProfiles = async () => {
    if (!supabase) {
      setError("Supabase client not initialized");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setResults([]);

    try {
      console.log("Testing profiles query with proxy client...");
      
      // Test the profiles table specifically
      const { data, error } = await supabase.from("profiles").select("*").limit(5);

      if (error) {
        throw error;
      }

      setSuccess("Successfully fetched profiles via proxy!");
      setResults(data || []);
    } catch (err: any) {
      console.error("Profiles query error:", err);
      setError(`Error: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>CORS Proxy Test</CardTitle>
          <CardDescription>
            Test the connection to Supabase using a CORS proxy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Make sure the CORS proxy server is running: <code>node cors-proxy-server.js</code>
            </AlertDescription>
          </Alert>

          <div className="flex space-x-4">
            <Button 
              onClick={testConnection} 
              disabled={loading || !supabase}
              variant="default"
            >
              {loading ? "Testing..." : "Test Basic Connection"}
            </Button>
            <Button 
              onClick={testProfiles} 
              disabled={loading || !supabase}
              variant="outline"
            >
              {loading ? "Testing..." : "Test Profiles Table"}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {results.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Results:</h3>
              <pre className="bg-slate-100 p-4 rounded-md overflow-auto max-h-96">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
