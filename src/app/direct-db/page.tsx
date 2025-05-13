"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Database } from "lucide-react";
import { fetchProfilesDirectly, fetchEventsDirectly, fetchVolunteersDirectly } from "./actions";

export default function DirectDbPage() {
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const testProfiles = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setResults([]);

    try {
      const result = await fetchProfilesDirectly();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch profiles");
      }

      setSuccess(`Successfully fetched ${result.count} profiles directly from the database!`);
      setResults(result.data || []);
    } catch (err: any) {
      console.error("Error fetching profiles:", err);
      setError(`Error: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const testEvents = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setResults([]);

    try {
      const result = await fetchEventsDirectly();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch events");
      }

      setSuccess(`Successfully fetched ${result.count} events directly from the database!`);
      setResults(result.data || []);
    } catch (err: any) {
      console.error("Error fetching events:", err);
      setError(`Error: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const testVolunteers = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setResults([]);

    try {
      const result = await fetchVolunteersDirectly();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch volunteers");
      }

      setSuccess(`Successfully fetched ${result.count} volunteers directly from the database!`);
      setResults(result.data || []);
    } catch (err: any) {
      console.error("Error fetching volunteers:", err);
      setError(`Error: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-6 w-6" />
            Direct Database Access
          </CardTitle>
          <CardDescription>
            Test direct PostgreSQL connection to Supabase (bypassing the JavaScript client)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Server-Side Only</AlertTitle>
            <AlertDescription>
              This page uses server actions with direct PostgreSQL connections, bypassing the Supabase JavaScript client entirely.
            </AlertDescription>
          </Alert>

          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={testProfiles} 
              disabled={loading}
              variant="default"
            >
              {loading ? "Loading..." : "Fetch Profiles"}
            </Button>
            <Button 
              onClick={testEvents} 
              disabled={loading}
              variant="outline"
            >
              {loading ? "Loading..." : "Fetch Events"}
            </Button>
            <Button 
              onClick={testVolunteers} 
              disabled={loading}
              variant="outline"
            >
              {loading ? "Loading..." : "Fetch Volunteers"}
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
