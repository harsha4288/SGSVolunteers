"use client";

import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  HelpCircle,
  Loader2,
  type LucideIcon,
} from "lucide-react";

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type IconVariant = 'icon-only' | 'icon-text' | 'icon-code' | 'responsive' | 'with-background';
type ColorScheme = 'default' | 'seva-category' | 'status' | 'custom';
type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface CustomColors {
  icon: string;
  background?: string;
  text?: string;
  border?: string;
}

interface IconCellProps {
  // Core icon configuration
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  emoji?: string;
  categoryName?: string;
  code?: string;
  label?: string;
  
  // Display options
  size?: IconSize;
  variant?: IconVariant;
  showLabel?: boolean;
  showCode?: boolean;
  
  // Styling and theming
  colorScheme?: ColorScheme;
  status?: StatusType;
  customColors?: CustomColors;
  
  // Interaction
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  
  // Accessibility
  ariaLabel?: string;
  tooltip?: string;
  showTooltip?: boolean;
  
  // Layout
  alignment?: 'left' | 'center' | 'right';
  className?: string;
  containerClassName?: string;
}

// Size configurations
const sizeClasses = {
  xs: "h-3 w-3",
  sm: "h-4 w-4", 
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

const containerSizeClasses = {
  xs: "h-5 w-5 p-0.5",
  sm: "h-6 w-6 p-1",
  md: "h-8 w-8 p-1.5", 
  lg: "h-10 w-10 p-2",
  xl: "h-12 w-12 p-2.5",
};

const textSizeClasses = {
  xs: "text-xs",
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
};

// Status color schemes
const statusColors: Record<StatusType, CustomColors> = {
  success: {
    icon: "text-green-600 dark:text-green-400",
    background: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-700 dark:text-green-300",
  },
  warning: {
    icon: "text-amber-600 dark:text-amber-400", 
    background: "bg-amber-100 dark:bg-amber-900/30",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-300",
  },
  error: {
    icon: "text-red-600 dark:text-red-400",
    background: "bg-red-100 dark:bg-red-900/30", 
    border: "border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-300",
  },
  info: {
    icon: "text-blue-600 dark:text-blue-400",
    background: "bg-blue-100 dark:bg-blue-900/30",
    border: "border-blue-200 dark:border-blue-800", 
    text: "text-blue-700 dark:text-blue-300",
  },
  neutral: {
    icon: "text-gray-600 dark:text-gray-400",
    background: "bg-gray-100 dark:bg-gray-800/50",
    border: "border-gray-200 dark:border-gray-700",
    text: "text-gray-700 dark:text-gray-300",
  },
};

// Default seva category colors (simplified version)
const sevaColors: Record<string, CustomColors> = {
  default: {
    icon: "text-primary",
    background: "bg-primary/10",
    border: "border-primary/20",
    text: "text-primary-foreground",
  },
  crowd: {
    icon: "text-blue-600 dark:text-blue-400",
    background: "bg-blue-100 dark:bg-blue-900/30",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-300",
  },
  health: {
    icon: "text-green-600 dark:text-green-400", 
    background: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-700 dark:text-green-300",
  },
  logistics: {
    icon: "text-orange-600 dark:text-orange-400",
    background: "bg-orange-100 dark:bg-orange-900/30",
    border: "border-orange-200 dark:border-orange-800", 
    text: "text-orange-700 dark:text-orange-300",
  },
};

// Get color scheme based on props
const getColors = (
  colorScheme: ColorScheme,
  status?: StatusType,
  categoryName?: string,
  customColors?: CustomColors
): CustomColors => {
  if (customColors) return customColors;
  
  if (colorScheme === 'status' && status) {
    return statusColors[status];
  }
  
  if (colorScheme === 'seva-category' && categoryName) {
    return sevaColors[categoryName.toLowerCase()] || sevaColors.default;
  }
  
  return {
    icon: "text-foreground",
    background: "bg-muted",
    border: "border-border",
    text: "text-muted-foreground",
  };
};

// Generate fallback icon from category name
const generateFallbackIcon = (name: string, size: IconSize): React.ReactNode => {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
    
  return (
    <span className={cn(
      "inline-flex items-center justify-center font-semibold rounded-full bg-muted text-muted-foreground",
      sizeClasses[size],
      textSizeClasses[size]
    )}>
      {initials}
    </span>
  );
};

/**
 * Reusable icon cell component for data tables
 * Supports all icon patterns from Assignments, T-shirts, and Requirements modules
 * - Seva category icons with semantic colors
 * - Status indicators with consistent theming
 * - Loading states and interaction support
 * - Flexible layouts (icon-only, icon+text, icon+code, responsive)
 * - Full accessibility with tooltips and ARIA labels
 * - Dark mode support with proper contrast
 */
export function IconCell({
  icon: IconComponent,
  emoji,
  categoryName,
  code,
  label,
  size = 'md',
  variant = 'icon-only',
  showLabel = true,
  showCode = true,
  colorScheme = 'default',
  status,
  customColors,
  onClick,
  loading = false,
  disabled = false,
  ariaLabel,
  tooltip,
  showTooltip = true,
  alignment = 'center',
  className,
  containerClassName,
}: IconCellProps) {
  const colors = getColors(colorScheme, status, categoryName, customColors);
  const isClickable = Boolean(onClick && !disabled && !loading);
  
  // Determine which icon to render
  const renderIcon = () => {
    if (loading) {
      return <Loader2 className={cn(sizeClasses[size], "animate-spin", colors.icon)} />;
    }
    
    if (emoji) {
      return (
        <span className={cn(sizeClasses[size], "inline-flex items-center justify-center")}>
          {emoji}
        </span>
      );
    }
    
    if (IconComponent) {
      return <IconComponent className={cn(sizeClasses[size], colors.icon)} />;
    }
    
    if (categoryName) {
      return generateFallbackIcon(categoryName, size);
    }
    
    return <HelpCircle className={cn(sizeClasses[size], colors.icon)} />;
  };

  // Render content based on variant
  const renderContent = () => {
    const iconElement = renderIcon();
    
    switch (variant) {
      case 'icon-only':
        return iconElement;
        
      case 'icon-text':
        return (
          <div className="inline-flex items-center gap-2">
            {iconElement}
            {showLabel && label && (
              <span className={cn(textSizeClasses[size], colors.text, "truncate max-w-[120px]")}>
                {label}
              </span>
            )}
          </div>
        );
        
      case 'icon-code':
        return (
          <div className="inline-flex items-center gap-1">
            {iconElement}
            {showCode && code && (
              <span className={cn(textSizeClasses[size], "font-bold", colors.text)}>
                {code}
              </span>
            )}
          </div>
        );
        
      case 'responsive':
        return (
          <div className="inline-flex flex-col items-center gap-1">
            <div className="inline-flex items-center gap-1">
              {iconElement}
              {showCode && code && (
                <span className={cn("text-xs font-bold", colors.text)}>
                  {code}
                </span>
              )}
            </div>
            {showLabel && label && (
              <span className={cn("text-xs max-w-[80px] truncate text-center", colors.text)}>
                {label}
              </span>
            )}
          </div>
        );
        
      case 'with-background':
        return (
          <div className={cn(
            "inline-flex items-center justify-center rounded-md border",
            containerSizeClasses[size],
            colors.background,
            colors.border,
            isClickable && "hover:opacity-80 transition-opacity"
          )}>
            {iconElement}
          </div>
        );
        
      default:
        return iconElement;
    }
  };

  const alignmentClasses = {
    left: "justify-start",
    center: "justify-center", 
    right: "justify-end",
  };

  const content = (
    <div
      className={cn(
        "inline-flex items-center",
        alignmentClasses[alignment],
        isClickable && "cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        containerClassName
      )}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={ariaLabel || label || categoryName}
    >
      <div className={cn(className)}>
        {renderContent()}
      </div>
    </div>
  );

  // Wrap with tooltip if needed
  if (showTooltip && (tooltip || label || categoryName)) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip || label || categoryName}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

// Export commonly used icon configurations
export const iconPresets = {
  sevaCategory: (categoryName: string, code: string, icon?: LucideIcon): Partial<IconCellProps> => ({
    icon,
    categoryName,
    code,
    variant: 'responsive',
    colorScheme: 'seva-category',
    showTooltip: true,
  }),
  
  status: (status: StatusType, icon?: LucideIcon): Partial<IconCellProps> => ({
    icon,
    colorScheme: 'status',
    status,
    variant: 'with-background',
    size: 'sm',
  }),
  
  action: (icon: LucideIcon, label: string): Partial<IconCellProps> => ({
    icon,
    label,
    variant: 'icon-only',
    size: 'md',
    showTooltip: true,
    tooltip: label,
  }),
};