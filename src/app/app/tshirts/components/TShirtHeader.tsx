"use client";

import * as React from "react";
import { Shirt } from "lucide-react";

interface TShirtHeaderProps {
  tshirtSizesCount: number;
}

export function TShirtHeader({ tshirtSizesCount }: TShirtHeaderProps) {
  return (
    <div className="mb-4 p-3 bg-accent/10 rounded-md border border-accent/20">
      <h3 className="text-lg font-medium flex items-center">
        <Shirt className="mr-2 h-5 w-5 text-accent" />
        T-Shirt Size Grid
      </h3>
      {tshirtSizesCount === 0 && (
        <div className="mt-2 text-sm text-muted-foreground">
          No T-shirt sizes found. Using default sizes.
        </div>
      )}
    </div>
  );
}
