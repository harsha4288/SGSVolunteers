// src/app/app/requirements/components/requirement-cell.tsx
"use client";

import * as React from 'react';
import type { RequirementCellData } from '../types'; // Assuming types.ts is in the parent directory
import { ClipboardList, UserCheck, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

interface RequirementCellProps {
  required: number;
  assigned: number;
  variance: number;
  isEditable: boolean;
  onClick: () => void;
  onRequiredChange?: (newValue: number) => void;
}

export function RequirementCell({ required, assigned, variance, isEditable, onClick, onRequiredChange }: RequirementCellProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [requiredValue, setRequiredValue] = React.useState<string>(required.toString());
  const inputRef = React.useRef<HTMLInputElement>(null);
  const cellRef = React.useRef<HTMLTableCellElement>(null);

  const handleClick = () => {
    if (isEditable) {
      onClick();
      setIsEditing(true);
    }
  };
  
  // Ensure layout is reset on window resize to fix potential CSS issues
  React.useEffect(() => {
    const handleResize = () => {
      // Force re-render on window resize
      setRequiredValue(prev => prev);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleBlur = () => {
    if (isEditing) {
      setIsEditing(false);
      const newValue = parseInt(requiredValue, 10);
      
      // Only call onRequiredChange if the value has actually changed
      if (!isNaN(newValue) && newValue >= 0 && onRequiredChange && newValue !== required) {
        onRequiredChange(newValue);
      } else {
        // Reset the input value to the original required count
        setRequiredValue(required.toString());
      }
    }
  };
  
  // Enhanced keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setRequiredValue(required.toString());
    } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
      // Allow cell navigation with arrow keys and tab
      inputRef.current?.blur();
      
      // Find the appropriate sibling cell based on key press
      const currentCell = cellRef.current;
      
      // With DataTable structure, we need to navigate through the nested structure
      // First find the parent DataTableCell
      const parentDataTableCell = currentCell?.closest('[class*="DataTableCell"]');
      const currentRow = parentDataTableCell?.parentElement;
      const allRows = currentRow?.parentElement?.children;
      const currentRowIndex = Array.from(allRows || []).indexOf(currentRow as HTMLTableRowElement);
      
      // Find all DataTableCell elements in the current row
      const cellsInCurrentRow = currentRow?.querySelectorAll('[class*="DataTableCell"]');
      const currentCellIndex = Array.from(cellsInCurrentRow || []).indexOf(parentDataTableCell as Element);
      
      let targetCell: HTMLElement | null = null;
      
      if (e.key === 'ArrowUp' && currentRowIndex > 0) {
        // Move to cell above
        const targetRow = allRows?.[currentRowIndex - 1] as HTMLTableRowElement;
        const targetCells = targetRow?.querySelectorAll('[class*="DataTableCell"]');
        const targetDataTableCell = targetCells?.[currentCellIndex] as HTMLElement;
        targetCell = targetDataTableCell?.querySelector('[tabindex="0"]') as HTMLElement;
      } else if (e.key === 'ArrowDown' && currentRowIndex < (allRows?.length || 0) - 1) {
        // Move to cell below
        const targetRow = allRows?.[currentRowIndex + 1] as HTMLTableRowElement;
        const targetCells = targetRow?.querySelectorAll('[class*="DataTableCell"]');
        const targetDataTableCell = targetCells?.[currentCellIndex] as HTMLElement;
        targetCell = targetDataTableCell?.querySelector('[tabindex="0"]') as HTMLElement;
      } else if (e.key === 'ArrowLeft' && currentCellIndex > 0) {
        // Move to cell to the left
        const targetDataTableCell = cellsInCurrentRow?.[currentCellIndex - 1] as HTMLElement;
        targetCell = targetDataTableCell?.querySelector('[tabindex="0"]') as HTMLElement;
      } else if ((e.key === 'ArrowRight' || (!e.shiftKey && e.key === 'Tab')) && 
                currentCellIndex < (cellsInCurrentRow?.length || 0) - 1) {
        // Move to cell to the right or tab
        const targetDataTableCell = cellsInCurrentRow?.[currentCellIndex + 1] as HTMLElement;
        targetCell = targetDataTableCell?.querySelector('[tabindex="0"]') as HTMLElement;
        if (e.key === 'Tab') e.preventDefault(); // Prevent default tab behavior
      } else if (e.shiftKey && e.key === 'Tab' && currentCellIndex > 0) {
        // Move to cell to the left with shift+tab
        const targetDataTableCell = cellsInCurrentRow?.[currentCellIndex - 1] as HTMLElement;
        targetCell = targetDataTableCell?.querySelector('[tabindex="0"]') as HTMLElement;
        e.preventDefault(); // Prevent default tab behavior
      }
      
      if (targetCell) {
        // Trigger click on the target cell to activate it
        targetCell.click();
        targetCell.focus();
      }
    }
  };
  
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  React.useEffect(() => {
    setRequiredValue(required.toString());
  }, [required]);

  const getVarianceColor = (variance: number) => {
    if (variance < 0) return "bg-destructive/20 text-destructive-foreground";
    if (variance === 0) return "bg-success/20 text-success-foreground";
    return "bg-primary/20 text-primary";
  };

  const getVarianceIcon = (variance: number) => {
    if (variance < 0) return <ArrowDownRight className="h-3 w-3" />;
    if (variance === 0) return <ArrowUpRight className="h-3 w-3 rotate-45 text-success" />;
    return <ArrowUpRight className="h-3 w-3" />;
  };

  // Color for variance (border or text only, no background)
  let varianceClass = "border text-xs";
  if (variance < 0) varianceClass += " border-red-700 text-red-700";
  else if (variance === 0) varianceClass += " border-green-700 text-green-700";
  else varianceClass += " border-blue-700 text-blue-700";

  const cellClasses = `
    p-3 border border-border h-16 flex items-center justify-center
    text-center text-lg font-semibold transition-colors
    ${isEditable ? 'cursor-pointer hover:bg-accent/20 hover:border-accent/50' : 'bg-muted/10 cursor-default'}
    ${required > 0 ? 'bg-background' : 'bg-muted/5'}
  `;

  const valueClasses = `
    ${required > 0 && required < 5 ? 'text-orange-600' : ''}
    ${required >= 5 && required < 10 ? 'text-blue-600' : ''}
    ${required >= 10 ? 'text-green-600' : ''}
    ${required === 0 && isEditable ? 'text-muted-foreground italic text-sm' : ''}
    ${required === 0 && !isEditable ? 'text-muted-foreground' : ''}
  `;

  // Handle keyboard events on the table cell (when not in edit mode)
  const handleCellKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isEditable && e.key === 'Enter') {
      // Enter key activates edit mode
      e.preventDefault();
      onClick();
      setIsEditing(true);
      
      // Focus the input in the next render cycle
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  };

  const cellClassName = cn(
    "cursor-pointer transition-colors group p-0 align-middle text-center h-full",
    isEditable && "hover:bg-accent/10"
  );

  return (
    <div
      ref={cellRef}
      className={`${cellClassName} w-full h-full`}
      onClick={handleClick}
      onKeyDown={handleCellKeyDown}
      tabIndex={0}
    >
      <div className="flex flex-col items-center justify-center gap-0 py-1 px-0 h-full w-full overflow-hidden">
        {/* Row 1: Required & Assigned */}
        <div className="flex items-center gap-0.5 justify-center w-full">
          <span className="block md:hidden">
            <ClipboardList className="h-3 w-3 text-muted-foreground inline" aria-label="Required" />
            {isEditing ? (
              <Input
                ref={inputRef}
                type="number"
                min="0"
                value={requiredValue}
                onChange={(e) => setRequiredValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="inline-flex h-5 w-10 text-[11px] p-1"
                // Remove up/down arrows from number input
                style={{ appearance: 'textfield' }}
              />
            ) : (
              <span className="font-semibold text-[11px]">{required}</span>
            )}
            <UserCheck className="h-3 w-3 text-muted-foreground inline ml-1" aria-label="Assigned" />
            <span className="text-[11px]">{assigned}</span>
          </span>
          <span className="hidden md:flex gap-1 items-center">
            <span className="text-xs">Req:</span>
            {isEditing ? (
              <Input
                ref={inputRef}
                type="number"
                min="0"
                value={requiredValue}
                onChange={(e) => setRequiredValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="h-5 w-10 text-[11px] p-1"
                // Remove up/down arrows from number input
                style={{ appearance: 'textfield' }}
              />
            ) : (
              <span className="font-semibold text-[11px]">{required}</span>
            )}
            <span className="text-xs ml-2">Assn:</span>
            <span className="text-[11px]">{assigned}</span>
          </span>
        </div>
        {/* Row 2: Variance - Single responsive component */}
        <div className="flex items-center justify-center w-full h-full">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {/* Unified variance card with responsive design */}
                <span className={cn(
                  "rounded px-1 py-0.5 font-semibold border mx-auto",
                  "flex flex-row items-center justify-center gap-1",
                  varianceClass
                )}>
                  <span className="inline-flex">{getVarianceIcon(variance)}</span>
                  <span className="hidden md:inline-flex text-xs mr-0.5">Var:</span>
                  <span className="inline-flex">{variance}</span>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Variance = Required - Assigned
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
