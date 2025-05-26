"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogIn, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { SupabaseClient } from "@supabase/supabase-js";

// Simple Google Icon component
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.08-2.58 2.03-4.66 2.03-3.86 0-6.99-3.11-6.99-6.91s3.13-6.91 6.99-6.91c2.03 0 3.59.79 4.5 1.73l2.65-2.58C17.08 3.18 15.03 2 12.48 2 7.18 2 3.06 6.02 3.06 11.25S7.18 20.5 12.48 20.5c2.76 0 4.94-.91 6.49-2.35 1.59-1.48 2.35-3.76 2.35-6.56 0-.6-.05-1.18-.15-1.73H12.48z"
      fill="#4285F4"
    />
  </svg>
);


export default function LoginPage() {
  const { toast } = useToast();
  const [supabase, setSupabase] = React.useState<SupabaseClient<Database> | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false); // For Google login button

  // Initialize Supabase client
  React.useEffect(() => {
    try {
      const supabaseInstance = createClient();
      setSupabase(supabaseInstance);
    } catch (e: any) {
      console.error("Error initializing Supabase client in LoginPage:", e.message);
      setError(`Failed to initialize Supabase: ${e.message}. Please check your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.`);
    }
  }, []);

  const handleGoogleLogin = async () => {
    if (!supabase) {
      toast({
        title: "Error",
        description: "Supabase client not available. Please try again later.",
        variant: "destructive",
      });
      console.error("Supabase client not initialized for handleGoogleLogin");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`, // Ensure this matches your Supabase config
        },
      });

      if (signInError) {
        throw signInError;
      }
      // The user will be redirected to Google and then back to the callback URL.
      // No need to setLoading(false) here as the page will navigate away.
    } catch (err: any) {
      console.error("Error during Google Sign-In:", err);
      toast({
        title: "Sign-In Failed",
        description: err.message || "An unexpected error occurred during sign-in. Please try again.",
        variant: "destructive",
      });
      setError(err.message || "An unexpected error occurred during sign-in.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <LogIn className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Login to {process.env.NEXT_PUBLIC_APP_NAME || "VolunteerVerse"}
          </CardTitle>
          <CardDescription className="text-md">
            Sign in using your Google account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Login Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleGoogleLogin}
            className="w-full"
            disabled={loading || !supabase}
          >
            {loading ? (
              <>
                {/* <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Pending... */}
                Signing In...
              </>
            ) : (
              <>
                <GoogleIcon className="mr-2 h-5 w-5" />
                Sign in with Google
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
