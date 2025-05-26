// src/app/app/admin/alerts-faqs/components/alerts-faqs-table.tsx
"use client";

import * as React from 'react';
import { DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit3, Trash2, AlertTriangle, HelpCircle } from 'lucide-react';
import type { Alert, FAQ } from '../types'; 
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton'; // Added for loading state


interface AlertsFaqsTableProps<T extends Alert | FAQ> {
  data: T[];
  dataType: 'alert' | 'faq';
  onEdit: (item: T) => void;
  onDelete: (id: number) => Promise<void>;
  loading: boolean;
}

export function AlertsFaqsTable<T extends Alert | FAQ>({ data, dataType, onEdit, onDelete, loading }: AlertsFaqsTableProps<T>) {
  const [itemToDelete, setItemToDelete] = React.useState<T | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDeleteConfirm = async () => {
    if (itemToDelete?.id) {
      setIsDeleting(true);
      try {
        await onDelete(itemToDelete.id);
        setItemToDelete(null);
      } catch (error) {
        // Error toast is expected to be handled by the calling hook/component
        console.error(`Error deleting ${dataType}:`, error);
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  const columns = [
    { header: 'Type', cell: (item: T) => (
        <Badge variant="outline" className="capitalize whitespace-nowrap text-xs">
          {dataType === 'alert' ? <AlertTriangle className="h-3 w-3 mr-1"/> : <HelpCircle className="h-3 w-3 mr-1"/>}
          {dataType}
        </Badge>
      )
    },
    { header: 'Category', cell: (item: T) => item.category || <span className="text-xs text-muted-foreground">N/A</span> },
    { header: dataType === 'alert' ? 'Title' : 'Question', cell: (item: T) => (
        <div className="font-medium text-sm">{dataType === 'alert' ? (item as Alert).title : (item as FAQ).question}</div>
      )
    },
    { header: dataType === 'alert' ? 'Content' : 'Answer', cell: (item: T) => (
        <p className="text-xs text-muted-foreground truncate max-w-xs">
          {dataType === 'alert' ? (item as Alert).content || 'N/A' : (item as FAQ).answer}
        </p>
      )
    },
    { header: 'Timeslot Filter', cell: (item: T) => item.timeslot_name || <span className="text-xs text-muted-foreground">All Timeslots</span> },
    { header: 'Actions', cell: (item: T) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(item)}><Edit3 className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setItemToDelete(item)} className="text-red-500 hover:!text-red-600 focus:!text-red-600 focus:!bg-red-50">
                <Trash2 className="mr-2 h-4 w-4"/>Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  ];

  if (loading && data.length === 0) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        <p className="text-center text-sm text-muted-foreground">Loading {dataType}s...</p>
      </div>
    );
  }
  
  if (!loading && data.length === 0) {
    return <p className="text-muted-foreground text-center py-6 text-sm">No {dataType}s found. Click "Add New {dataType === 'alert' ? 'Alert' : 'FAQ'}" to create one.</p>;
  }

  return (
    <>
      <DataTable>
        <DataTableHeader>
          <DataTableRow>
            {columns.map(col => <DataTableHead key={col.header}>{col.header}</DataTableHead>)}
          </DataTableRow>
        </DataTableHeader>
        <DataTableBody>
          {data.map((item) => (
            <DataTableRow key={item.id}>
              {columns.map(col => <DataTableCell key={`${col.header}-${item.id}`}>{col.cell(item)}</DataTableCell>)}
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
      
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this {dataType}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected {dataType}: 
              <strong> {itemToDelete && (dataType === 'alert' ? (itemToDelete as Alert).title : (itemToDelete as FAQ).question)}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
