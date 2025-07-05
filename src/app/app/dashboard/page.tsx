// src/app/app/dashboard/page.tsx
import { getCurrentUserProfile } from "./actions";
import { ClientDashboard } from "./components/client-dashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function DashboardPage() {
  const { profileId, error } = await getCurrentUserProfile();

  if (error || !profileId) {
    return (
      <div className="container mx-auto py-3 px-2">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            {error || "Please log in to access the dashboard."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-3 px-2">
      <ClientDashboard defaultProfileId={profileId} />
    </div>
  );
}
