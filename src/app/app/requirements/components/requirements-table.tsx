// src/app/app/requirements/components/requirements-table.tsx
"use client";

import * as React from 'react';
import { DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { RequirementsData } from '../hooks/use-requirements-data';
import type { RequirementRow } from '../types';
import { RefreshCw, Save, AlertCircle } from 'lucide-react';

interface RequirementsTableProps {
  requirementsData: RequirementsData;
}

interface InlineCountEditorProps {
  row: RequirementRow;
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
    requirementRows,
    loadingInitial, 
    loadingRequirements,
    error, 
    currentSevaCategoryId, // Renamed from currentTaskId
    updateRequirementCount,
    sevaCategories, // Renamed from tasks
  } = requirementsData;
  
  if (loadingInitial && !currentSevaCategoryId && sevaCategories.length === 0) { // Renamed from currentTaskId and tasks
    return (
      <div className="space-y-2 mt-4">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }
  
  if (error && (!sevaCategories || sevaCategories.length === 0)) { // Renamed from tasks
     return <div className="flex items-center gap-2 text-destructive p-4 border border-destructive bg-destructive/10 rounded-md mt-4"> <AlertCircle className="h-5 w-5" /> <p>Error loading essential data: {error}</p> </div>;
  }

  if (!currentSevaCategoryId) { // Renamed from currentTaskId
    return <p className="text-muted-foreground mt-4 text-center">Please select a Seva Category to view or define its volunteer requirements.</p>; // Updated text
  }
  
  if (loadingRequirements && requirementRows.length === 0 && !error) {
     return (
      <div className="space-y-2 mt-4">
        <p className="text-center text-muted-foreground">Loading requirements for selected Seva Category...</p> {/* Updated text */}
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }
  
  if (!loadingInitial && !loadingRequirements && requirementRows.length === 0 && currentSevaCategoryId && !error) { // Renamed from currentTaskId
    return <p className="text-muted-foreground mt-4 text-center">No locations or timeslots found. Please set these up first, or requirements for this Seva Category have not been defined.</p>; // Updated text
  }
  
  if (error && requirementRows.length === 0) { 
     return <div className="flex items-center gap-2 text-destructive p-4 border border-destructive bg-destructive/10 rounded-md mt-4"> <AlertCircle className="h-5 w-5" /> <p>Error loading requirements for this Seva Category: {error}. Please try selecting the Seva Category again or refresh.</p> </div>; // Updated text
  }

  return (
    <div className="mt-4">
      <DataTable>
        <DataTableHeader>
          <DataTableRow>
            <DataTableHead>Location</DataTableHead>
            <DataTableHead>Timeslot</DataTableHead>
            <DataTableHead align="center">Required Volunteers</DataTableHead>
          </DataTableRow>
        </DataTableHeader>
        <DataTableBody>
          {requirementRows.map((row) => (
            <DataTableRow key={`${row.location_id}-${row.timeslot_id}`}>
              <DataTableCell>{row.location_name}</DataTableCell>
              <DataTableCell>{row.timeslot_name}</DataTableCell>
              <DataTableCell align="center">
                <InlineCountEditor
                  row={row}
                  onSave={(newCount) =>
                    updateRequirementCount(
                      row.seva_category_id, // Changed from task_id
                      row.location_id,
                      row.timeslot_id,
                      newCount
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
