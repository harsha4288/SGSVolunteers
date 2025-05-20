"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TShirtConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingIssuance: {
    volunteerId: string;
    size: string;
    quantity: number;
  } | null;
  allocations: Record<string, number>;
  onConfirm: () => void;
}

export function TShirtConfirmationDialog({
  open,
  onOpenChange,
  pendingIssuance,
  allocations,
  onConfirm,
}: TShirtConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Exceed Allocation?</AlertDialogTitle>
          <AlertDialogDescription>
            {pendingIssuance && (
              <>
                This volunteer has only {allocations[pendingIssuance.volunteerId]} remaining T-shirt allocation,
                but you're trying to issue {pendingIssuance.quantity} {pendingIssuance.size} T-shirt(s).
                <br /><br />
                Do you want to proceed anyway?
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Yes, Issue Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
