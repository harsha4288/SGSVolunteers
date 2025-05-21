"use client";

import * as React from "react";
import { Shirt } from "lucide-react";

interface TShirtHeaderProps {
  tshirtSizesCount: number;
  isAdmin?: boolean;
}

export function TShirtHeader({ tshirtSizesCount, isAdmin = false }: TShirtHeaderProps) {
  return (
    <div className="mb-4 p-3 bg-accent/10 rounded-md border border-accent/20">
      <h3 className="text-lg font-medium flex items-center">
        <Shirt className="mr-2 h-5 w-5 text-accent" />
        T-Shirt {isAdmin ? "Management" : "Preferences"}
      </h3>
      <div className="mt-1 text-sm text-muted-foreground">
        {isAdmin
          ? "Manage T-shirt issuance for volunteers. Use the plus/minus buttons to issue or return T-shirts."
          : "Set your T-shirt size preferences. You can select up to your allocated number of T-shirts."
        }
      </div>
      {tshirtSizesCount === 0 && (
        <div className="mt-2 text-sm text-muted-foreground">
          No T-shirt sizes found. Using default sizes.
        </div>
      )}
    </div>
  );
}
