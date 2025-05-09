
import type { Metadata } from "next";
import { getVolunteers } from "@/lib/data"; // Using mock data
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FacetedFilterColumn } from "./components/data-table-faceted-filter";
import type { SearchableColumn } from "./components/data-table-toolbar";
import type { Volunteer } from "@/lib/types";

export const metadata: Metadata = {
  title: "Volunteers List",
  description: "View and manage volunteer data.",
};

// Helper to extract unique values for faceted filters
const getUniqueValues = (data: Volunteer[], accessorKey: keyof Volunteer): { label: string, value: string }[] => {
  const uniqueValues = new Set<string>();
  data.forEach(item => {
    const value = item[accessorKey] as string;
    if (value) uniqueValues.add(value);
  });
  return Array.from(uniqueValues).sort().map(value => ({ label: value, value }));
};


export default async function VolunteersPage() {
  const volunteers = await getVolunteers();

  const searchableColumns: SearchableColumn[] = [
    { id: 'firstName', title: 'First Name'},
    { id: 'lastName', title: 'Last Name'},
    { id: 'emailAddress', title: 'Email'},
  ];

  const facetedFilterColumns: FacetedFilterColumn<Volunteer>[] = [
    {
      id: 'volCategory',
      title: 'Category',
      options: getUniqueValues(volunteers, 'volCategory'),
    },
    {
      id: 'location',
      title: 'Location',
      options: getUniqueValues(volunteers, 'location'),
    }
  ];


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Volunteer Management</CardTitle>
          <CardDescription>
            Browse, filter, and manage all volunteer records. Use the filters to narrow down your search.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={volunteers}
            filterColumnAccessorKey="emailAddress" // Default global text search target
            filterColumnName="Email" // Placeholder for the global text search
            searchableColumns={searchableColumns}
            facetedFilterColumns={facetedFilterColumns}
          />
        </CardContent>
      </Card>
    </div>
  );
}
