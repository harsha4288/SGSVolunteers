
"use client";

import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter, type FacetedFilterColumn } from "./data-table-faceted-filter";


export interface SearchableColumn {
  id: string; // This should be a keyof TData
  title: string;
}
export interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  // filterColumnAccessorKey?: keyof TData extends string ? keyof TData : never ; // e.g., 'email' - This was too restrictive
  filterColumnAccessorKey?: string; // More flexible, e.g. 'first_name'
  filterColumnName?: string; // e.g., 'Name'
  searchableColumns?: SearchableColumn[]; // For global search placeholder
  facetedFilterColumns?: FacetedFilterColumn<TData>[];
}


export function DataTableToolbar<TData>({
  table,
  filterColumnAccessorKey = "first_name", // Default to first_name for volunteers
  filterColumnName = "Name", // Default placeholder name
  searchableColumns = [],
  facetedFilterColumns = []
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  // Using the first searchable column for the input field, if available.
  // This setup is for a single text input that filters one specific column.
  // For a true global filter across multiple columns, you'd use table.setGlobalFilter
  // and define a globalFilterFn in useReactTable.
  const primarySearchColumnId = searchableColumns.length > 0 ? searchableColumns[0].id : filterColumnAccessorKey;
  const primarySearchColumnPlaceholder = searchableColumns.length > 0 
    ? `Filter by ${searchableColumns.map(c => c.title.toLowerCase()).join(', ')}...`
    : `Filter by ${filterColumnName.toLowerCase()}...`;


  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {/* This input filters a specific column, not globally across all. */}
        <Input
          placeholder={primarySearchColumnPlaceholder}
          value={(table.getColumn(primarySearchColumnId)?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn(primarySearchColumnId)?.setFilterValue(event.target.value)
          }
          className="h-9 w-[150px] lg:w-[250px]"
        />
        
        {facetedFilterColumns.map(col => (
          table.getColumn(col.id) && (
            <DataTableFacetedFilter
              key={col.id}
              column={table.getColumn(col.id)}
              title={col.title}
              options={col.options}
            />
          )
        ))}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-9 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}

