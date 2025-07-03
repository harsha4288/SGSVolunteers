"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type CellElement = React.ReactNode;
type LayoutDirection = 'horizontal' | 'vertical' | 'grid';
type Alignment = 'start' | 'center' | 'end' | 'stretch';
type Spacing = 'none' | 'xs' | 'sm' | 'md' | 'lg';

interface GridConfig {
  columns: number;
  rows?: number;
  columnGap?: Spacing;
  rowGap?: Spacing;
}

interface CompoundCellProps {
  elements: CellElement[];
  layout?: LayoutDirection;
  alignment?: Alignment;
  spacing?: Spacing;
  gridConfig?: GridConfig;
  className?: string;
  
  // Container options
  bordered?: boolean;
  background?: boolean;
  rounded?: boolean;
  padding?: Spacing;
  
  // Responsive behavior
  responsive?: {
    mobile?: LayoutDirection;
    tablet?: LayoutDirection;
    desktop?: LayoutDirection;
  };
  
  // Advanced layout
  wrap?: boolean;
  reverse?: boolean;
  
  // Interaction
  onClick?: () => void;
  disabled?: boolean;
}

// Spacing configurations
const spacingClasses = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
};

const paddingClasses = {
  none: 'p-0',
  xs: 'p-1',
  sm: 'p-2', 
  md: 'p-3',
  lg: 'p-4',
};

// Alignment configurations for different layouts
const alignmentClasses = {
  horizontal: {
    start: 'justify-start items-center',
    center: 'justify-center items-center',
    end: 'justify-end items-center',
    stretch: 'justify-between items-stretch',
  },
  vertical: {
    start: 'items-start justify-start',
    center: 'items-center justify-center', 
    end: 'items-end justify-end',
    stretch: 'items-stretch justify-stretch',
  },
  grid: {
    start: 'justify-items-start items-start',
    center: 'justify-items-center items-center',
    end: 'justify-items-end items-end', 
    stretch: 'justify-items-stretch items-stretch',
  },
};

// Grid class generators
const getGridClasses = (config: GridConfig): string => {
  const { columns, rows, columnGap = 'sm', rowGap = 'sm' } = config;
  
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2', 
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };
  
  const gridRows = rows ? {
    1: 'grid-rows-1',
    2: 'grid-rows-2',
    3: 'grid-rows-3', 
    4: 'grid-rows-4',
    5: 'grid-rows-5',
    6: 'grid-rows-6',
  }[rows] || '' : '';
  
  const colGap = spacingClasses[columnGap] || spacingClasses.sm;
  const rowGapClass = spacingClasses[rowGap] || spacingClasses.sm;
  
  return cn(
    'grid',
    gridCols[columns] || 'grid-cols-1',
    gridRows,
    colGap,
    rowGapClass !== colGap && `gap-y-${rowGapClass.split('-')[1]}`
  );
};

// Responsive class generators
const getResponsiveClasses = (
  responsive?: CompoundCellProps['responsive']
): string => {
  if (!responsive) return '';
  
  const classes: string[] = [];
  
  if (responsive.mobile) {
    const mobileClass = responsive.mobile === 'horizontal' ? 'flex-row' : 
                       responsive.mobile === 'vertical' ? 'flex-col' : 'grid';
    classes.push(`flex ${mobileClass} sm:hidden`);
  }
  
  if (responsive.tablet) {
    const tabletClass = responsive.tablet === 'horizontal' ? 'flex-row' :
                       responsive.tablet === 'vertical' ? 'flex-col' : 'grid';
    classes.push(`hidden sm:flex ${tabletClass} lg:hidden`);
  }
  
  if (responsive.desktop) {
    const desktopClass = responsive.desktop === 'horizontal' ? 'flex-row' :
                        responsive.desktop === 'vertical' ? 'flex-col' : 'grid';
    classes.push(`hidden lg:flex ${desktopClass}`);
  }
  
  return classes.join(' ');
};

/**
 * CompoundCell component for complex multi-element table cells
 * Supports all compound cell patterns from Requirements and other modules
 * - Multi-element layouts (horizontal, vertical, grid)
 * - Flexible alignment and spacing options
 * - Responsive behavior for different screen sizes
 * - Container styling (borders, backgrounds, padding)
 * - Grid layouts for matrix-style data
 * - Interactive compound cells with click handlers
 * 
 * Examples:
 * - Requirements matrix cells with variance calculations
 * - Multi-status indicators in assignments
 * - Grouped controls in t-shirt inventory
 * - Complex data visualizations
 */
export function CompoundCell({
  elements,
  layout = 'horizontal',
  alignment = 'center',
  spacing = 'sm',
  gridConfig,
  className,
  bordered = false,
  background = false,
  rounded = false,
  padding = 'none',
  responsive,
  wrap = false,
  reverse = false,
  onClick,
  disabled = false,
}: CompoundCellProps) {
  
  // Filter out null/undefined elements
  const validElements = elements.filter(Boolean);
  
  if (validElements.length === 0) {
    return null;
  }
  
  // Determine base layout classes
  const getLayoutClasses = (): string => {
    if (layout === 'grid' && gridConfig) {
      return getGridClasses(gridConfig);
    }
    
    const baseClasses = layout === 'vertical' ? 'flex flex-col' : 'flex flex-row';
    const wrapClass = wrap ? 'flex-wrap' : '';
    const reverseClass = reverse ? (layout === 'vertical' ? 'flex-col-reverse' : 'flex-row-reverse') : '';
    
    return cn(baseClasses, wrapClass, reverseClass);
  };
  
  const isClickable = Boolean(onClick && !disabled);
  
  const containerClasses = cn(
    // Base layout
    getLayoutClasses(),
    
    // Alignment
    alignmentClasses[layout][alignment],
    
    // Spacing
    layout !== 'grid' && spacingClasses[spacing],
    
    // Container styling
    bordered && 'border border-border',
    background && 'bg-muted/50',
    rounded && 'rounded-md',
    paddingClasses[padding],
    
    // Interaction
    isClickable && 'cursor-pointer hover:bg-muted/80 transition-colors',
    disabled && 'opacity-50 cursor-not-allowed',
    
    // Responsive
    getResponsiveClasses(responsive),
    
    className
  );
  
  return (
    <div
      className={containerClasses}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {validElements.map((element, index) => (
        <React.Fragment key={index}>
          {element}
        </React.Fragment>
      ))}
    </div>
  );
}

// Export common compound cell patterns
export const compoundCellPresets = {
  // Requirements variance cell with value + indicator
  varianceCell: (value: React.ReactNode, variance: React.ReactNode): CompoundCellProps => ({
    elements: [value, variance],
    layout: 'horizontal',
    alignment: 'center',
    spacing: 'xs',
    bordered: true,
    padding: 'xs',
    rounded: true,
  }),
  
  // Status with action buttons
  statusWithActions: (status: React.ReactNode, actions: React.ReactNode): CompoundCellProps => ({
    elements: [status, actions],
    layout: 'horizontal', 
    alignment: 'stretch',
    spacing: 'sm',
  }),
  
  // Icon with multiple labels
  iconWithLabels: (icon: React.ReactNode, ...labels: React.ReactNode[]): CompoundCellProps => ({
    elements: [icon, ...labels],
    layout: 'vertical',
    alignment: 'center',
    spacing: 'xs',
  }),
  
  // Grid layout for matrix data
  matrixCell: (elements: React.ReactNode[], columns: number): CompoundCellProps => ({
    elements,
    layout: 'grid',
    gridConfig: { columns, columnGap: 'xs', rowGap: 'xs' },
    alignment: 'center',
    bordered: true,
    padding: 'xs',
  }),
  
  // Responsive card-like cell
  responsiveCard: (elements: React.ReactNode[]): CompoundCellProps => ({
    elements,
    layout: 'vertical',
    alignment: 'start',
    spacing: 'sm',
    background: true,
    bordered: true,
    rounded: true,
    padding: 'sm',
    responsive: {
      mobile: 'vertical',
      tablet: 'horizontal',
      desktop: 'horizontal',
    },
  }),
  
  // Inline form controls
  inlineControls: (elements: React.ReactNode[]): CompoundCellProps => ({
    elements,
    layout: 'horizontal',
    alignment: 'center',
    spacing: 'xs',
    wrap: true,
  }),
};