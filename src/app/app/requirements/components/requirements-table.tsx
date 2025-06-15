// src/app/app/requirements/components/requirements-table.tsx
"use client";

import * as React from 'react';
import { DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell, DataTableColGroup, DataTableCol } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { RequirementsPageData } from '../hooks/use-requirements-data';
import type { ProcessedRequirementRow } from '../types';
import { RefreshCw, Save, AlertCircle } from 'lucide-react';

interface RequirementsTableProps {
  requirementsData: RequirementsPageData;
}

interface InlineCountEditorProps {
  row: ProcessedRequirementRow;
  onSave: (newCount: number) => Promise<void>;
  isSavingExternal: boolean; 
}

const InlineCountEditor: React.FC<InlineCountEditorProps> = ({ row, onSave, isSavingExternal }) => {
  const [count, setCount] = React.useState(row.required_count.toString());
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSavingInternal, setIsSavingInternal] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setCount(row.required_count.toString());
    if (isSavingInternal && !isSavingExternal && isEditing) {
        setIsEditing(false);
    }
  }, [row.required_count, isSavingExternal, isSavingInternal, isEditing]);
  
  const handleSave = async () => {
    const newCount = parseInt(count, 10);
    if (isNaN(newCount) || newCount < 0) {
      setCount(row.required_count.toString()); 
      setIsEditing(false);
      return;
    }
    if (newCount === row.required_count) {
      setIsEditing(false); 
      return;
    }

    setIsSavingInternal(true);
    try {
      await onSave(newCount);
      // setIsEditing(false); // Let useEffect handle this based on external state
    } catch (error) {
      // Error toast is handled by the hook, revert local state
      setCount(row.required_count.toString()); 
    } finally {
      setIsSavingInternal(false);
      // If not externally saving, close editor. If externally saving, keep it open but disabled until data updates.
      if (!isSavingExternal) setIsEditing(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') handleSave();
    else if (event.key === 'Escape') {
      setCount(row.required_count.toString());
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          type="number"
          min="0"
          value={count}
          onChange={(e) => setCount(e.target.value)}
          onBlur={() => setTimeout(() => { if(document.activeElement !== inputRef.current) handleSave(); }, 150)}
          onKeyDown={handleKeyDown}
          className="h-8 w-20 text-sm"
          disabled={isSavingInternal || isSavingExternal}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isSavingInternal || isSavingExternal || count === row.required_count.toString()}
          className="h-8 px-2"
        >
          {isSavingInternal || (isSavingExternal && count !== row.required_count.toString()) ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
        </Button>
      </div>
    );
  }

  return (
    <div
      onClick={() => { if (!isSavingExternal && !isSavingInternal) { setIsEditing(true); setTimeout(() => inputRef.current?.select(), 0); }}}
      className={`cursor-pointer hover:bg-muted/30 p-1 rounded min-h-[32px] flex items-center justify-center ${isSavingExternal || isSavingInternal ? 'opacity-50' : ''}`}
      style={{ minWidth: '6rem' }} 
    >
      {isSavingExternal && count !== row.required_count.toString() ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : null}
      {row.required_count}
    </div>
  );
};

export function RequirementsTable({ requirementsData }: RequirementsTableProps) {
  const {
    loadingInitial,
    loadingRequirements,
    error,
    userSevaCategoryIds,
    updateRequirementsForCell, // Note: This function name was updated in a previous step.
    displaySevaCategories,
    gridData,
  } = requirementsData;

  // Derive currentSevaCategoryId from userSevaCategoryIds if it's meant to be a single selection
  const currentSevaCategoryId = userSevaCategoryIds && userSevaCategoryIds.length > 0 ? userSevaCategoryIds[0] : undefined;

  // Filter and flatten gridData to get the rows for this table, and map to ProcessedRequirementRow
  const requirementRows: ProcessedRequirementRow[] = React.useMemo(() => {
    if (!currentSevaCategoryId || !gridData) return [];
    const flatRequirements: ProcessedRequirementRow[] = [];
    gridData.forEach(row => {
      row.forEach(cell => {
        if (cell.sevaCategory.id === currentSevaCategoryId) {
          cell.requirements_for_cell.forEach(req => {
            flatRequirements.push({
              ...req,
              seva_category_name: req.seva_category?.category_name,
              location_name: req.location?.name,
              timeslot_name: req.timeslot?.slot_name,
            });
          });
        }
      });
    });
    return flatRequirements;
  }, [gridData, currentSevaCategoryId]);
  
  if (loadingInitial && !currentSevaCategoryId && displaySevaCategories.length === 0) {
    return (
      <div className="space-y-2 mt-4">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }
  
  if (error && (!displaySevaCategories || displaySevaCategories.length === 0)) {
     return <div className="flex items-center gap-2 text-destructive p-4 border border-destructive bg-destructive/10 rounded-md mt-4"> <AlertCircle className="h-5 w-5" /> <p>Error loading essential data: {error}</p> </div>;
  }

  if (!currentSevaCategoryId) {
    return <p className="text-muted-foreground mt-4 text-center">Please select a Seva Category to view or define its volunteer requirements.</p>;
  }
  
  if (loadingRequirements && requirementRows.length === 0 && !error) {
     return (
      <div className="space-y-2 mt-4">
        <p className="text-center text-muted-foreground">Loading requirements for selected Seva Category...</p>
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }
  
  if (!loadingInitial && !loadingRequirements && requirementRows.length === 0 && currentSevaCategoryId && !error) {
    return <p className="text-muted-foreground mt-4 text-center">No locations or timeslots found. Please set these up first, or requirements for this Seva Category have not been defined.</p>;
  }
  
  if (error && requirementRows.length === 0) { 
     return <div className="flex items-center gap-2 text-destructive p-4 border border-destructive bg-destructive/10 rounded-md mt-4"> <AlertCircle className="h-5 w-5" /> <p>Error loading requirements for this Seva Category: {error}. Please try selecting the Seva Category again or refresh.</p> </div>;
  }

  return (
    <div className="mt-4">
      <DataTable maxHeight="calc(100vh - 400px)" density="compact">
        <DataTableColGroup>
          <DataTableCol widthClass="w-[35%]" /> {/* Location */}
          <DataTableCol widthClass="w-[35%]" /> {/* Timeslot */}
          <DataTableCol widthClass="w-[30%]" /> {/* Required Volunteers */}
        </DataTableColGroup>
        <DataTableHeader>
          <DataTableRow> {/* hover and rowStriping are true by default */}
            <DataTableHead verticalAlign="middle">Location</DataTableHead>
            <DataTableHead verticalAlign="middle">Timeslot</DataTableHead>
            <DataTableHead align="center" verticalAlign="middle">Required Volunteers</DataTableHead>
          </DataTableRow>
        </DataTableHeader>
        <DataTableBody>
          {requirementRows.map((row) => (
            <DataTableRow key={`${row.location_id}-${row.timeslot_id}`}>
              <DataTableCell verticalAlign="middle" overflowHandling="tooltip" tooltipContent={row.location_name}>
                {row.location_name}
              </DataTableCell>
              <DataTableCell verticalAlign="middle" overflowHandling="tooltip" tooltipContent={row.timeslot_name}>
                {row.timeslot_name}
              </DataTableCell>
              <DataTableCell align="center" verticalAlign="middle">
                <InlineCountEditor
                  row={row}
                  onSave={(newCount) =>
                    updateRequirementsForCell(
                      row.seva_category_id,
                      row.timeslot_id,
                      [{ location_id: row.location_id, required_count: newCount }] // Pass as array of partial requirements
                    )
                  }
                  isSavingExternal={loadingRequirements} 
                />
              </DataTableCell>
            </DataTableRow>
          ))}
          {loadingRequirements && requirementRows.length > 0 && (
            <DataTableRow>
              <DataTableCell colSpan={3} align="center" className="py-4">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                   <RefreshCw className="h-4 w-4 animate-spin" /> <span>Updating requirements...</span>
                </div>
              </DataTableCell>
            </DataTableRow>
          )}
        </DataTableBody>
      </DataTable>
    </div>
  );
}
