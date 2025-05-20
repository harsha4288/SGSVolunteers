"use client";

import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface NoVolunteersAlertProps {
  isAdmin: boolean;
}

export function NoVolunteersAlert({ isAdmin }: NoVolunteersAlertProps) {
  return (
    <Alert className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>No Volunteers Found</AlertTitle>
      <AlertDescription>
        {isAdmin ? (
          "Use the search box above to find volunteers."
        ) : (
          <>
            No volunteer record found for you or your family members.
            <div className="mt-2">
              If you believe this is an error, please contact the event administrators.
            </div>
          </>
        )}
      </AlertDescription>
    </Alert>
  );
}
