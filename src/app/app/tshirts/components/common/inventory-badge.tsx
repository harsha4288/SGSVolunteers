"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface InventoryBadgeProps {
  count: number;
  initialQuantity?: number;
  className?: string;
  onClick?: () => void;
  isClickable?: boolean;
}

/**
 * Compact multi-line badge component to display inventory count
 * Shows available/initial quantities with appropriate styling
 * Clickable for admin navigation to inventory management
 */
export function InventoryBadge({
  count,
  initialQuantity,
  className,
  onClick,
  isClickable = false
}: InventoryBadgeProps) {
  // Calculate percentage
  const getPercentage = (available: number, initial?: number) => {
    if (!initial || initial === 0) {
      // If no initial quantity, treat as 100% if we have stock, 0% if empty
      return available > 0 ? 100 : 0;
    }
    return Math.round((available / initial) * 100);
  };

  // Generate dynamic Tailwind classes based on percentage
  const getDynamicClasses = (percentage: number) => {
    // Clamp percentage between 0 and 100
    const clampedPercentage = Math.max(0, Math.min(100, percentage));

    // Define color ranges with proper Tailwind classes for both light and dark modes
    if (clampedPercentage === 0) {
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700";
    } else if (clampedPercentage <= 10) {
      return "bg-red-50 text-red-700 border-red-150 dark:bg-red-900/25 dark:text-red-400 dark:border-red-600";
    } else if (clampedPercentage <= 20) {
      return "bg-orange-50 text-orange-700 border-orange-150 dark:bg-orange-900/25 dark:text-orange-400 dark:border-orange-600";
    } else if (clampedPercentage <= 30) {
      return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700";
    } else if (clampedPercentage <= 40) {
      return "bg-yellow-50 text-yellow-700 border-yellow-150 dark:bg-yellow-900/25 dark:text-yellow-400 dark:border-yellow-600";
    } else if (clampedPercentage <= 50) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700";
    } else if (clampedPercentage <= 60) {
      return "bg-lime-50 text-lime-700 border-lime-150 dark:bg-lime-900/25 dark:text-lime-400 dark:border-lime-600";
    } else if (clampedPercentage <= 70) {
      return "bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-700";
    } else if (clampedPercentage <= 80) {
      return "bg-green-50 text-green-700 border-green-150 dark:bg-green-900/25 dark:text-green-400 dark:border-green-600";
    } else if (clampedPercentage <= 90) {
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700";
    } else {
      return "bg-green-200 text-green-900 border-green-300 dark:bg-green-900/40 dark:text-green-200 dark:border-green-600";
    }
  };

  const percentage = getPercentage(count, initialQuantity);
  const dynamicClasses = getDynamicClasses(percentage);

  const displayText = initialQuantity !== undefined
    ? `${count}/${initialQuantity}`
    : `${count}`;

  const tooltipText = initialQuantity !== undefined
    ? `${count} available of ${initialQuantity} initial (${percentage}%). Click to manage inventory.`
    : `${count} available. Click to manage inventory.`;

  const Component = isClickable ? "button" : "span";

  return (
    <Component
      className={cn(
        "inline-flex flex-col items-center justify-center px-2 py-1 text-xs font-medium rounded border min-w-[2.5rem]",
        dynamicClasses,
        isClickable && "cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current",
        className
      )}
      title={isClickable ? tooltipText : `${count} available${initialQuantity ? ` of ${initialQuantity} initial (${percentage}%)` : ''}`}
      onClick={isClickable ? onClick : undefined}
      type={isClickable ? "button" : undefined}
    >
      <span className="leading-tight">{displayText}</span>
    </Component>
  );
}
