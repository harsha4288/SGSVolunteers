import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Standardized interactive card component with consistent accent border styling
 * Used for functional/interactive components like tables, forms, search sections
 */
const InteractiveCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn(
      "border-accent/20", // Consistent accent border for all interactive components
      className
    )}
    {...props}
  />
))
InteractiveCard.displayName = "InteractiveCard"

/**
 * Compact interactive card variant for smaller sections
 */
const CompactInteractiveCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-muted/30 rounded-md border border-accent/20", // Matches search card styling
      className
    )}
    {...props}
  />
))
CompactInteractiveCard.displayName = "CompactInteractiveCard"

/**
 * Table container with consistent styling
 */
const TableCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-md border border-accent/20 bg-card overflow-hidden", // Consistent table styling
      className
    )}
    {...props}
  />
))
TableCard.displayName = "TableCard"

export { 
  InteractiveCard, 
  CompactInteractiveCard, 
  TableCard,
  // Re-export standard card components for convenience
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
}
