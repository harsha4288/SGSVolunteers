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
import type { PendingIssuance } from "../../types";

interface TShirtConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingIssuance: PendingIssuance | null;
  allocations: Record<string, number>;
  onConfirm: () => void;
}

/**
 * Confirmation dialog for T-shirt issuance when exceeding allocation
 */
export function TShirtConfirmationDialog({
  open,
  onOpenChange,
  pendingIssuance,
  allocations,
  onConfirm,
}: TShirtConfirmationDialogProps) {
  if (!pendingIssuance) return null;

  const allocation = allocations[pendingIssuance.volunteerId] || 0;
  const exceededBy = pendingIssuance.quantity - allocation;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Exceed Allocation?</AlertDialogTitle>
          <AlertDialogDescription>
            This volunteer has {allocation} T-shirts remaining in their allocation,
            but you are trying to issue {pendingIssuance.quantity} T-shirt(s) of size {pendingIssuance.size}.
            <br /><br />
            This will exceed their allocation by {exceededBy} T-shirt(s).
            <br /><br />
            Do you want to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Proceed</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
