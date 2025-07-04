"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { VolunteersTable } from "./components/volunteers-table";
import { VolunteerForm } from "../dashboard/components/volunteer-form";
import { useVolunteersData } from "./hooks/use-volunteers-data";

export default function VolunteersPage() {
  const { refreshData } = useVolunteersData();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Volunteers
              </CardTitle>
              <CardDescription>
                Manage volunteer records, search, and view volunteer information
              </CardDescription>
            </div>
            <VolunteerForm 
              mode="create" 
              currentEventId={1} // TODO: Get from context/event selector
              onSuccess={refreshData}
            />
          </div>
        </CardHeader>
        <CardContent>
          <VolunteersTable />
        </CardContent>
      </Card>
    </div>
  );
}