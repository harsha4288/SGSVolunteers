"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Check, 
  X, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  ArrowUpRight,
  ArrowDownRight,
  type LucideIcon 
} from "lucide-react";

// Status type definitions
type AttendanceStatus = 'present' | 'absent' | 'pending' | 'upcoming' | 'not-recorded';
type ActiveStatus = 'active' | 'inactive';
type AlertStatus = 'success' | 'warning' | 'error' | 'info';
type VarianceStatus = 'positive' | 'negative' | 'neutral';
type InventoryLevel = number; // 0-100 percentage

type StatusType = AttendanceStatus | ActiveStatus | AlertStatus | VarianceStatus | 'inventory';

interface BaseStatusConfig {
  label: string;
  icon?: LucideIcon;
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

interface InventoryStatusConfig extends BaseStatusConfig {
  percentage: number;
  showPercentage?: boolean;
  multiLine?: boolean;
}

interface StatusBadgeCellProps {
  status: StatusType;
  value?: string | number;
  size?: 'sm' | 'default' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  showIcon?: boolean;
  showTooltip?: boolean;
  customConfig?: BaseStatusConfig | InventoryStatusConfig;
  inventoryPercentage?: number; // For inventory type
}

// Default status configurations
const getStatusConfig = (
  status: StatusType, 
  inventoryPercentage?: number
): BaseStatusConfig | InventoryStatusConfig => {
  
  switch (status) {
    // Attendance statuses
    case 'present':
      return {
        label: 'Present',
        icon: Check,
        className: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
      };
    case 'absent':
      return {
        label: 'Absent',
        icon: X,
        className: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
      };
    case 'pending':
      return {
        label: 'Pending',
        icon: Clock,
        className: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      };
    case 'upcoming':
      return {
        label: 'Upcoming',
        icon: Clock,
        className: 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700',
      };
    case 'not-recorded':
      return {
        label: 'Not Recorded',
        icon: AlertCircle,
        className: 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border-red-100 dark:border-red-800',
      };
    
    // Active statuses
    case 'active':
      return {
        label: 'Active',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
      };
    case 'inactive':
      return {
        label: 'Inactive',
        icon: XCircle,
        className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700',
      };
    
    // Alert statuses
    case 'success':
      return {
        label: 'Success',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
      };
    case 'warning':
      return {
        label: 'Warning',
        icon: AlertCircle,
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
      };
    case 'error':
      return {
        label: 'Error',
        icon: X,
        className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
      };
    case 'info':
      return {
        label: 'Info',
        className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
      };
    
    // Variance statuses
    case 'positive':
      return {
        label: 'Overstaffed',
        icon: ArrowUpRight,
        className: 'border-blue-700 text-blue-700 dark:border-blue-400 dark:text-blue-400',
      };
    case 'negative':
      return {
        label: 'Understaffed',
        icon: ArrowDownRight,
        className: 'border-red-700 text-red-700 dark:border-red-400 dark:text-red-400',
      };
    case 'neutral':
      return {
        label: 'Perfect',
        icon: ArrowUpRight, // rotated in styling
        className: 'border-green-700 text-green-700 dark:border-green-400 dark:text-green-400',
      };
    
    // Inventory status (percentage-based)
    case 'inventory':
      return getInventoryConfig(inventoryPercentage || 0);
    
    default:
      return {
        label: String(status),
        className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700',
      };
  }
};

// Inventory color configuration (10-level system)
const getInventoryConfig = (percentage: number): InventoryStatusConfig => {
  let className: string;
  
  if (percentage === 0) {
    className = 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
  } else if (percentage <= 10) {
    className = 'bg-red-50 text-red-700 border-red-150 dark:bg-red-900/25 dark:text-red-400 dark:border-red-800';
  } else if (percentage <= 20) {
    className = 'bg-orange-50 text-orange-700 border-orange-150 dark:bg-orange-900/25 dark:text-orange-400 dark:border-orange-800';
  } else if (percentage <= 30) {
    className = 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
  } else if (percentage <= 40) {
    className = 'bg-yellow-50 text-yellow-700 border-yellow-150 dark:bg-yellow-900/25 dark:text-yellow-400 dark:border-yellow-800';
  } else if (percentage <= 50) {
    className = 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
  } else if (percentage <= 60) {
    className = 'bg-lime-50 text-lime-700 border-lime-150 dark:bg-lime-900/25 dark:text-lime-400 dark:border-lime-800';
  } else if (percentage <= 70) {
    className = 'bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800';
  } else if (percentage <= 80) {
    className = 'bg-green-50 text-green-700 border-green-150 dark:bg-green-900/25 dark:text-green-400 dark:border-green-800';
  } else if (percentage <= 90) {
    className = 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
  } else {
    className = 'bg-green-200 text-green-900 border-green-300 dark:bg-green-900/40 dark:text-green-200 dark:border-green-700';
  }

  return {
    label: `${percentage}%`,
    className,
    percentage,
    showPercentage: true,
  };
};

/**
 * Reusable status badge cell component
 * Supports all status patterns from Assignments, T-shirts, and Requirements modules
 * - Attendance tracking (present, absent, pending, upcoming)
 * - Active/inactive states
 * - Alert levels (success, warning, error, info)  
 * - Variance indicators (positive, negative, neutral)
 * - Inventory levels with percentage-based colors
 * - Full dark mode support
 * - Optional icons and tooltips
 * - Clickable interactions
 */
export function StatusBadgeCell({
  status,
  value,
  size = 'default',
  onClick,
  disabled = false,
  className,
  showIcon = true,
  showTooltip = false,
  customConfig,
  inventoryPercentage,
}: StatusBadgeCellProps) {
  const config = customConfig || getStatusConfig(status, inventoryPercentage);
  const isInventory = status === 'inventory' && 'percentage' in config;
  
  const Icon = showIcon && config.icon ? config.icon : null;
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    default: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  const badgeContent = (
    <Badge
      variant={config.variant || 'outline'}
      className={cn(
        'inline-flex items-center gap-1 font-semibold border transition-colors',
        sizeClasses[size],
        onClick && !disabled && 'cursor-pointer hover:opacity-80',
        disabled && 'opacity-50 cursor-not-allowed',
        status === 'neutral' && Icon && '[&_svg]:rotate-45', // Rotate neutral arrow
        config.className,
        className
      )}
      onClick={onClick && !disabled ? onClick : undefined}
      title={showTooltip ? config.label : undefined}
    >
      {Icon && <Icon className="h-3 w-3" />}
      <span>
        {value || config.label}
        {isInventory && config.showPercentage && ` (${config.percentage}%)`}
      </span>
    </Badge>
  );

  if (isInventory && config.multiLine) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        {badgeContent}
        <span className="text-xs text-muted-foreground">
          {config.percentage}%
        </span>
      </div>
    );
  }

  return badgeContent;
}