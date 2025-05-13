"use client";

import * as React from "react";
import { createClient } from "@supabase/supabase-js";
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
import { AlertCircle, CheckCircle, Server, Laptop } from "lucide-react";
import { testServerConnection, testMultipleTablesServer } from "./actions";

export default function TestDbPage() {
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setResults([]);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase URL or Anon Key is missing from environment variables.");
      }

      // Log the connection attempt
      console.log("Creating Supabase client with:", {
        url: supabaseUrl,
        keyLength: supabaseAnonKey.length
      });

      // Create a direct Supabase client
      const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

      // Test connection with a simple query
      const { data, error } = await supabase.from("events").select("*").limit(5);

      if (error) {
        throw error;
      }

      setSuccess("Successfully connected to Supabase!");
      setResults(data || []);
    } catch (err: any) {
      console.error("Database connection test error:", err);
      setError(`Error: ${err.message || "Unknown error"}`);

      // Additional debugging for network errors
      if (err.message?.includes("fetch failed") || err.message?.includes("Failed to fetch")) {
        setError(`Network error: ${err.message}. This could be due to CORS issues, network connectivity, or firewall settings.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const testDirectTables = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setResults([]);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase URL or Anon Key is missing from environment variables.");
      }

      // Create a direct Supabase client
      const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

      // Test multiple tables to see if any work
      const tables = ["events", "profiles", "volunteers", "time_slots", "seva_categories"];
      const results: any[] = [];

      for (const table of tables) {
        try {
          console.log(`Testing table: ${table}`);
          const { data, error } = await supabase.from(table).select("*").limit(1);

          results.push({
            table,
            success: !error,
            data: data || [],
            error: error ? error.message : null
          });
        } catch (tableErr: any) {
          results.push({
            table,
            success: false,
            data: [],
            error: tableErr.message || "Unknown error"
          });
        }
      }

      setResults(results);

      // Check if any tables were successful
      const anySuccess = results.some(r => r.success);
      if (anySuccess) {
        setSuccess("Successfully connected to at least one table!");
      } else {
        setError("Failed to access any tables. This might be an RLS issue.");
      }
    } catch (err: any) {
      console.error("Database tables test error:", err);
      setError(`Error: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const testServerSide = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setResults([]);

    try {
      const result = await testServerConnection();

      if (!result.success) {
        setError(`Server-side error: ${result.error}`);
      } else {
        setSuccess("Successfully connected to Supabase from the server!");
        setResults(result.data || []);
      }
    } catch (err) {
      console.error("Error calling server action:", err);
      setError(`Error calling server action: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const testServerMultipleTables = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setResults([]);

    try {
      const result = await testMultipleTablesServer();

      if (!result.success) {
        setError(`Server-side error: ${result.error || "Failed to access any tables"}`);
      } else {
        setSuccess("Successfully connected to at least one table from the server!");
      }

      if (result.results) {
        setResults(result.results);
      }
    } catch (err) {
      console.error("Error calling server action:", err);
      setError(`Error calling server action: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Database Connection Test</CardTitle>
          <CardDescription>
            Test the connection to your Supabase database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2 flex items-center">
              <Laptop className="mr-2 h-5 w-5" />
              Client-side Tests
            </h3>
            <div className="flex space-x-4">
              <Button
                onClick={testConnection}
                disabled={loading}
                variant="default"
              >
                {loading ? "Testing..." : "Test Basic Connection"}
              </Button>
              <Button
                onClick={testDirectTables}
                disabled={loading}
                variant="outline"
              >
                {loading ? "Testing..." : "Test Multiple Tables"}
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2 flex items-center">
              <Server className="mr-2 h-5 w-5" />
              Server-side Tests
            </h3>
            <div className="flex space-x-4">
              <Button
                onClick={testServerSide}
                disabled={loading}
                variant="default"
              >
                {loading ? "Testing..." : "Test Server Connection"}
              </Button>
              <Button
                onClick={testServerMultipleTables}
                disabled={loading}
                variant="outline"
              >
                {loading ? "Testing..." : "Test Server Tables"}
              </Button>
            </div>
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
