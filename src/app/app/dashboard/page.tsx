// src/app/app/dashboard/page.tsx
import { createSupabaseServerActionClient } from "@/lib/supabase/server-actions";
import { ClientDashboard } from "./components/client-dashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function DashboardPage() {
  try {
    const supabase = await createSupabaseServerActionClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return (
        <div className="container mx-auto py-3 px-2">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>Please log in to access the dashboard.</AlertDescription>
          </Alert>
        </div>
      );
    }

    // Get profile ID from profiles table using auth_user_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return (
        <div className="container mx-auto py-3 px-2">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Profile Error</AlertTitle>
            <AlertDescription>Profile not found for the current user.</AlertDescription>
          </Alert>
        </div>
      );
    }

    return (
      <div className="container mx-auto py-3 px-2">
        <ClientDashboard defaultProfileId={profile.id} />
      </div>
    );
  } catch (error) {
    return (
      <div className="container mx-auto py-3 px-2">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load dashboard"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
}
