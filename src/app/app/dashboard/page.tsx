// src/app/app/dashboard/page.tsx
"use client";

import * as React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from './components/stat-card';
import { AlertsFaqsPanel } from './components/alerts-faqs-panel';
import { useDashboardStats } from './hooks/use-dashboard-stats';
import { Users, ListChecks, BarChartHorizontal, AlertCircle } from 'lucide-react'; // Added AlertCircle
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added Alert components

export default function DashboardPage() {
  const { stats, loading: loadingStats, error: statsError } = useDashboardStats(); // Added error state

  return (
    <div className="container mx-auto py-3 px-2 space-y-4">
      {/* Header Card (Optional, can be part of layout) */}
      <Card className="mb-4">
        <CardHeader>
            <CardTitle>Volunteer Dashboard</CardTitle>
            <CardDescription>Overview of volunteer activities and system status.</CardDescription>
        </CardHeader>
      </Card>

      {/* Display error if stats fetching failed */}
      {statsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Stats</AlertTitle>
          <AlertDescription>{statsError}</AlertDescription>
        </Alert>
      )}

      {/* Grid for StatCards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Volunteers"
          value={stats.totalVolunteers}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          description="Registered and active"
          loading={loadingStats}
        />
        <StatCard
          title="Tasks Filled"
          value={`${stats.tasksFilledPercentage}%`}
          icon={<ListChecks className="h-4 w-4 text-muted-foreground" />}
          description="Percentage of required spots filled"
          loading={loadingStats}
        />
        <StatCard
          title="Overall Attendance"
          value={`${stats.overallAttendancePercentage}%`}
          icon={<BarChartHorizontal className="h-4 w-4 text-muted-foreground" />}
          description="Attendance rate across all tasks"
          loading={loadingStats}
        />
        {/* Add more StatCards as needed */}
      </div>

      {/* Alerts and FAQs Panel */}
      <div>
        <AlertsFaqsPanel />
      </div>
      
      {/* Placeholder for more dashboard components */}
      {/* 
      <Card>
        <CardHeader><CardTitle>Activity Feed</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Future location for activity logs or charts...</p></CardContent>
      </Card>
      */}
    </div>
  );
}
