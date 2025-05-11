
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Volunteer } from "@/lib/types/supabase"; // Updated import
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, MoreHorizontal, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

// Helper to format names, etc. if needed - though direct access is fine for simple fields
// const formatName = (row: any) => `${row.getValue("first_name")} ${row.getValue("last_name")}`;

export const columns: ColumnDef<Volunteer>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "first_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          First Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("first_name")}</div>,
  },
  {
    accessorKey: "last_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue("last_name")}</div>,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => <div>{row.getValue("phone") || "-"}</div>,
  },
  {
    accessorKey: "gender",
    header: "Gender",
    cell: ({ row }) => <div className="capitalize">{row.getValue("gender") || "-"}</div>,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "location", // General location if available on volunteer record
    header: "Primary Location",
     cell: ({ row }) => <div>{row.getValue("location") || "-"}</div>,
     filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "gm_family",
    header: "GM Family",
    cell: ({ row }) => {
      const isGMFamily = row.getValue("gm_family");
      return isGMFamily ? <Badge variant="default">Yes</Badge> : <Badge variant="secondary">No</Badge>;
    },
     filterFn: (row, id, value) => {
      // value will be array of selected string options e.g. ["true", "false"]
      const rowValue = String(row.getValue(id));
      return value.includes(rowValue);
    },
  },
  {
    accessorKey: "tags",
    header: "AI Tags",
    cell: ({ row }) => {
      const tags = row.getValue("tags") as string[] | undefined | null;
      if (!tags || tags.length === 0) return <span className="text-muted-foreground">N/A</span>;
      return (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {tags.slice(0,3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {tags.length > 3 && <Badge variant="outline" className="text-xs">+{tags.length -3}</Badge>}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const volunteer = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(volunteer.email)}
            >
              Copy Email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* This link needs to be defined, e.g. /app/volunteers/[volunteer_id]/schedule or /app/volunteers/[volunteer_id]/details */}
            <Link href={`/app/volunteers/${volunteer.id}/schedule`} passHref>
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View Schedule
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem disabled>Edit volunteer (TBD)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

