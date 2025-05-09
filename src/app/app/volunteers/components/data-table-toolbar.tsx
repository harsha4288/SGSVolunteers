
"use client";

import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter, FacetedFilterColumn } from "./data-table-faceted-filter";


export interface SearchableColumn {
  id: string;
  title: string;
}
export interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  filterColumnAccessorKey?: string; // e.g., 'email'
  filterColumnName?: string; // e.g., 'Email'
  searchableColumns?: SearchableColumn[]; // For global search placeholder
  facetedFilterColumns?: FacetedFilterColumn<TData>[];
}


export function DataTableToolbar<TData>({
  table,
  filterColumnAccessorKey = "email", // Default filter target
  filterColumnName = "Email", // Default placeholder name
  searchableColumns = [],
  facetedFilterColumns = []
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const globalFilter = table.getState().globalFilter;
  const onGlobalFilterChange = table.setGlobalFilter;


  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {searchableColumns.length > 0 && (
           <Input
            placeholder={`Filter by ${searchableColumns.map(c => c.title.toLowerCase()).join(', ')}...`}
            value={(table.getColumn(searchableColumns[0].id)?.getFilterValue() as string) ?? ""}
            onChange={(event) => {
                // Apply filter to all searchable columns or a specific global filter
                // For simplicity, this example filters the first searchable column.
                // For global filter: table.setGlobalFilter(event.target.value)
                // You'd need to set up globalFilterFn on the table instance.
                // Here, we filter by the first searchable column for simplicity.
                table.getColumn(searchableColumns[0].id)?.setFilterValue(event.target.value)
            }}
            className="h-9 w-[150px] lg:w-[250px]"
          />
        )}
        
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

