"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Check,
  X,
  Plus,
  Minus,
  Edit3,
  Trash2,
  MoreHorizontal,
  Loader2,
  RefreshCw,
  Save,
  type LucideIcon,
} from "lucide-react";

type UserRole = "admin" | "team_lead" | "volunteer";
type ActionVariant = "success" | "destructive" | "primary" | "secondary" | "ghost";
type CellLayout = "grouped" | "single" | "dropdown" | "inline";

interface ActionButtonConfig {
  id: string;
  icon: LucideIcon;
  label: string;
  variant: ActionVariant;
  permissions?: UserRole[];
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  tooltip?: string;
  className?: string;
  size?: "sm" | "icon";
  hideLabel?: boolean;
}

interface ActionButtonCellProps {
  actions: ActionButtonConfig[];
  userRole?: UserRole;
  layout?: CellLayout;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  maxVisibleActions?: number; // For dropdown overflow
  showTooltips?: boolean;
}

// Variant styling configurations
const getVariantClasses = (variant: ActionVariant, size: "sm" | "md" | "lg" = "md") => {
  const baseClasses = {
    sm: "h-6 w-6 p-0",
    md: "h-8 w-8 p-0", 
    lg: "h-10 w-10 p-0",
  };

  const variantClasses: Record<ActionVariant, string> = {
    success: "text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30",
    destructive: "text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30",
    primary: "text-primary hover:text-primary hover:bg-primary/20",
    secondary: "text-muted-foreground hover:text-foreground hover:bg-accent/20",
    ghost: "text-muted-foreground hover:text-foreground hover:bg-accent",
  };

  return cn(baseClasses[size], variantClasses[variant]);
};

// Permission check helper
const hasPermission = (action: ActionButtonConfig, userRole?: UserRole): boolean => {
  if (!action.permissions || action.permissions.length === 0) return true;
  if (!userRole) return false;
  return action.permissions.includes(userRole);
};

// Single action button component
const ActionButton: React.FC<{
  action: ActionButtonConfig;
  size: "sm" | "md" | "lg";
  showTooltips: boolean;
  disabled: boolean;
}> = ({ action, size, showTooltips, disabled }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const Icon = action.icon;
  const LoadingIcon = action.loading || isLoading ? Loader2 : Icon;

  const handleClick = async () => {
    if (disabled || action.disabled || isLoading) return;

    try {
      setIsLoading(true);
      await action.onClick();
    } catch (error) {
      console.error(`Error executing action ${action.id}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonContent = (
    <Button
      variant="ghost"
      size={action.size || (size === "sm" ? "sm" : "icon")}
      onClick={handleClick}
      disabled={disabled || action.disabled || isLoading}
      className={cn(
        getVariantClasses(action.variant, size),
        "transition-colors",
        action.className
      )}
      aria-label={action.label}
    >
      <LoadingIcon 
        className={cn(
          size === "sm" ? "h-3 w-3" : "h-4 w-4",
          (action.loading || isLoading) && "animate-spin"
        )} 
      />
      {!action.hideLabel && action.size !== "icon" && (
        <span className="ml-1 text-xs">{action.label}</span>
      )}
    </Button>
  );

  if (showTooltips && action.tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{action.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonContent;
};

// Grouped buttons component
const GroupedActions: React.FC<{
  actions: ActionButtonConfig[];
  size: "sm" | "md" | "lg";
  showTooltips: boolean;
  disabled: boolean;
}> = ({ actions, size, showTooltips, disabled }) => {
  if (actions.length === 0) return null;

  return (
    <div className={cn(
      "inline-flex rounded-md border bg-background",
      size === "sm" ? "gap-0" : "gap-0.5 p-0.5"
    )}>
      {actions.map((action) => (
        <ActionButton
          key={action.id}
          action={action}
          size={size}
          showTooltips={showTooltips}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

// Dropdown menu for overflow actions
const DropdownActions: React.FC<{
  actions: ActionButtonConfig[];
  visibleActions: ActionButtonConfig[];
  overflowActions: ActionButtonConfig[];
  size: "sm" | "md" | "lg";
  showTooltips: boolean;
  disabled: boolean;
}> = ({ actions, visibleActions, overflowActions, size, showTooltips, disabled }) => {
  if (actions.length === 0) return null;

  return (
    <div className="inline-flex items-center gap-1">
      {/* Visible actions */}
      {visibleActions.map((action) => (
        <ActionButton
          key={action.id}
          action={action}
          size={size}
          showTooltips={showTooltips}
          disabled={disabled}
        />
      ))}
      
      {/* Overflow dropdown */}
      {overflowActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "text-muted-foreground hover:text-foreground",
                getVariantClasses("ghost", size)
              )}
              disabled={disabled}
            >
              <MoreHorizontal className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {overflowActions.map((action, index) => (
              <React.Fragment key={action.id}>
                <DropdownMenuItem
                  onClick={() => action.onClick()}
                  disabled={disabled || action.disabled || action.loading}
                  className={cn(
                    action.variant === "destructive" && "text-destructive focus:text-destructive"
                  )}
                >
                  <action.icon className="mr-2 h-4 w-4" />
                  {action.label}
                </DropdownMenuItem>
                {index < overflowActions.length - 1 && 
                 overflowActions[index + 1]?.variant === "destructive" && 
                 action.variant !== "destructive" && (
                  <DropdownMenuSeparator />
                )}
              </React.Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

/**
 * Reusable action button cell component for data tables
 * Supports all action patterns from Assignments, T-shirts, and Requirements modules
 * - Role-based permission control
 * - Multiple layout options (grouped, single, dropdown, inline)
 * - Loading states and error handling
 * - Customizable button variants and sizes
 * - Tooltip support
 * - Overflow handling with dropdown menu
 */
export function ActionButtonCell({
  actions,
  userRole,
  layout = "single",
  size = "md",
  disabled = false,
  className,
  maxVisibleActions = 3,
  showTooltips = true,
}: ActionButtonCellProps) {
  // Filter actions based on permissions
  const visibleActions = actions.filter(action => 
    hasPermission(action, userRole)
  );

  if (visibleActions.length === 0) {
    return null;
  }

  // Handle different layouts
  switch (layout) {
    case "grouped":
      return (
        <div className={cn("flex justify-center", className)}>
          <GroupedActions
            actions={visibleActions}
            size={size}
            showTooltips={showTooltips}
            disabled={disabled}
          />
        </div>
      );

    case "dropdown":
      return (
        <div className={cn("flex justify-center", className)}>
          <DropdownActions
            actions={visibleActions}
            visibleActions={visibleActions.slice(0, maxVisibleActions)}
            overflowActions={visibleActions.slice(maxVisibleActions)}
            size={size}
            showTooltips={showTooltips}
            disabled={disabled}
          />
        </div>
      );

    case "inline":
      return (
        <div className={cn("inline-flex items-center gap-1", className)}>
          {visibleActions.map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              size={size}
              showTooltips={showTooltips}
              disabled={disabled}
            />
          ))}
        </div>
      );

    case "single":
    default:
      // For single layout, show first action or use dropdown if multiple
      if (visibleActions.length === 1) {
        return (
          <div className={cn("flex justify-center", className)}>
            <ActionButton
              action={visibleActions[0]}
              size={size}
              showTooltips={showTooltips}
              disabled={disabled}
            />
          </div>
        );
      } else {
        return (
          <div className={cn("flex justify-center", className)}>
            <DropdownActions
              actions={visibleActions}
              visibleActions={[]}
              overflowActions={visibleActions}
              size={size}
              showTooltips={showTooltips}
              disabled={disabled}
            />
          </div>
        );
      }
  }
}

// Export commonly used action configurations
export const commonActions = {
  checkIn: (onClick: () => void): ActionButtonConfig => ({
    id: "check-in",
    icon: Check,
    label: "Check In",
    variant: "success",
    permissions: ["admin", "team_lead"],
    onClick,
    tooltip: "Mark as present",
  }),
  
  markAbsent: (onClick: () => void): ActionButtonConfig => ({
    id: "mark-absent",
    icon: X,
    label: "Mark Absent",
    variant: "destructive", 
    permissions: ["admin", "team_lead"],
    onClick,
    tooltip: "Mark as absent",
  }),
  
  increment: (onClick: () => void): ActionButtonConfig => ({
    id: "increment",
    icon: Plus,
    label: "Add",
    variant: "primary",
    onClick,
    size: "sm",
    tooltip: "Increase quantity",
  }),
  
  decrement: (onClick: () => void): ActionButtonConfig => ({
    id: "decrement", 
    icon: Minus,
    label: "Remove",
    variant: "destructive",
    onClick,
    size: "sm",
    tooltip: "Decrease quantity",
  }),
  
  edit: (onClick: () => void): ActionButtonConfig => ({
    id: "edit",
    icon: Edit3,
    label: "Edit",
    variant: "primary",
    onClick,
    tooltip: "Edit item",
  }),
  
  delete: (onClick: () => void): ActionButtonConfig => ({
    id: "delete",
    icon: Trash2,
    label: "Delete",
    variant: "destructive",
    onClick,
    tooltip: "Delete item",
  }),
  
  save: (onClick: () => void, loading?: boolean): ActionButtonConfig => ({
    id: "save",
    icon: Save,
    label: "Save",
    variant: "success",
    onClick,
    loading,
    tooltip: "Save changes",
  }),
};