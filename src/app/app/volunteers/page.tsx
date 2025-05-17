
import type { Metadata } from "next";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FacetedFilterOption, FacetedFilterColumn } from "./components/data-table-faceted-filter";
import type { SearchableColumn } from "./components/data-table-toolbar";
import type { Volunteer } from "@/lib/types/supabase"; // Updated import
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Volunteers List",
  description: "View and manage volunteer data from Supabase.",
};

// Helper to extract unique values for faceted filters from the fetched data
const getUniqueValuesForFacetedFilter = (data: Volunteer[], accessorKey: keyof Volunteer): FacetedFilterOption[] => {
  const uniqueValues = new Set<string>();
  data.forEach(item => {
    const value = item[accessorKey] as string | null | undefined; // Field might be null
    if (value) uniqueValues.add(value);
  });
  return Array.from(uniqueValues).sort().map(value => ({ label: value, value }));
};

const getBooleanFilterOptions = (labelTrue: string, labelFalse: string): FacetedFilterOption[] => [
  {label: labelTrue, value: "true"},
  {label: labelFalse, value: "false"}
];


async function getVolunteersData() {
  const supabase = createSupabaseServerClient();
  // For now, fetch all volunteers. In a real app, you'd paginate or filter by event.
  // Also, consider fetching related profile data if needed for display (e.g. profile.display_name)
  // For simplicity, fetching only from 'volunteers' table for now.
  const { data: volunteers, error } = await supabase
    .from('volunteers')
    .select(`
      id,
      profile_id,
      email,
      first_name,
      last_name,
      phone,
      gender,
      gm_family,
      association_with_mahayajna,
      additional_notes,
      tags,
      location,
      created_at,
      updated_at
    `)
    .order('created_at', { ascending: false }); // Example ordering

  if (error) {
    console.error("Error fetching volunteers:", error);
    return { volunteers: [], error: error.message };
  }
  return { volunteers: volunteers || [], error: null };
}


export default async function VolunteersPage() {
  const { volunteers, error } = await getVolunteersData();

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Fetching Data</AlertTitle>
          <AlertDescription>{error} Please check the console or contact support.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const searchableColumns: SearchableColumn[] = [
    { id: 'first_name', title: 'First Name'},
    { id: 'last_name', title: 'Last Name'},
    { id: 'email', title: 'Email'},
  ];

  // Faceted filters based on the new 'Volunteer' schema
  const facetedFilterColumns: FacetedFilterColumn<Volunteer>[] = [
    {
      id: 'gender', // accessorKey in columns.tsx must match
      title: 'Gender',
      options: getUniqueValuesForFacetedFilter(volunteers, 'gender'),
    },
    {
      id: 'location', // accessorKey
      title: 'Location',
      options: getUniqueValuesForFacetedFilter(volunteers, 'location'),
    },
    {
      id: 'gm_family', // accessorKey
      title: 'GM Family',
      options: getBooleanFilterOptions("Yes", "No"),
    }
    // Add more faceted filters as needed e.g. for event_id if multiple events are shown
  ];

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Volunteer Management</CardTitle>
          <CardDescription>
            Browse, filter, and manage all volunteer records. Data is fetched from Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={volunteers}
            filterColumnAccessorKey="email" // Default global text search target
            filterColumnName="Email" // Placeholder for the global text search
            searchableColumns={searchableColumns} // Pass this to the toolbar
            facetedFilterColumns={facetedFilterColumns}
          />
        </CardContent>
      </Card>
    </div>
  );
}

