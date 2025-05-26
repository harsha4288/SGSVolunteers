// src/app/app/reports/page.tsx
"use client";

import * as React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VarianceReport } from './components/variance-report';
import { AttendanceReport } from './components/attendance-report';
import { BarChart2 } from 'lucide-react'; // Icon for reports

export default function ReportsPage() {
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

      <Tabs defaultValue="variance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3">
          <TabsTrigger value="variance">Variance Report</TabsTrigger>
          <TabsTrigger value="attendance">Attendance Report</TabsTrigger>
        </TabsList>
        <TabsContent value="variance">
          <VarianceReport />
        </TabsContent>
        <TabsContent value="attendance">
          <AttendanceReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
