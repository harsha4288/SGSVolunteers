// src/app/app/reports/page.tsx
"use client";

import * as React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VarianceReport } from './components/variance-report';
import { AttendanceReport } from './components/attendance-report';
import { BarChart2, FileText } from 'lucide-react'; // Added FileText for potential new report

export default function ReportsPage() {
  // For now, we'll stick to two tabs as per the original design.
  // If RequirementDetailData was to be displayed in a new tab, we'd add a new TabsTrigger and TabsContent.
  // e.g., <TabsTrigger value="requirementDetails">Details</TabsTrigger>
  // and <TabsContent value="requirementDetails"><RequirementDetailsReport /></TabsContent> 
  // (assuming a new RequirementDetailsReport component is created).

  return (
    <div className="container mx-auto py-3 px-2 space-y-3">
      <Card className="mb-4">
        <CardHeader>
            <div className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-accent flex-shrink-0" />
                <div>
                    <CardTitle>Volunteer Reports</CardTitle>
                    <CardDescription>
                    View reports on volunteer requirements, availability, and attendance.
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="varianceSummary" className="space-y-4"> {/* Updated defaultValue */}
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3">
          {/* Updated value for Variance Report to match the reportType in the hook */}
          <TabsTrigger value="varianceSummary">Variance Summary</TabsTrigger> 
          <TabsTrigger value="attendance">Attendance Report</TabsTrigger>
        </TabsList>
        <TabsContent value="varianceSummary"> {/* Updated value */}
          <VarianceReport />
        </TabsContent>
        <TabsContent value="attendance">
          <AttendanceReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
