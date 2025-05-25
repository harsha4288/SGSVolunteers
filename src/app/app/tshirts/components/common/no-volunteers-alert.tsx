"use client";

import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface NoVolunteersAlertProps {
  isAdmin: boolean;
}

/**
 * Alert shown when no volunteers are available to display
 */
export function NoVolunteersAlert({ isAdmin }: NoVolunteersAlertProps) {
  return (
    <Alert className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Ready to Manage T-Shirts</AlertTitle>
      <AlertDescription>
        {isAdmin
          ? "Use the QR scanner or search box above to find volunteers and manage their T-shirt preferences and issuances."
          : "No volunteer records found for your account."}
      </AlertDescription>
    </Alert>
  );
}
