// src/app/app/dashboard/page.tsx
"use client";

import * as React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from './components/stat-card';
import { AlertsFaqsPanel } from './components/alerts-faqs-panel';
import { useDashboardStats } from './hooks/use-dashboard-stats'; // New hook for stats
import { Users, ListChecks, BarChartHorizontal } from 'lucide-react'; // Icons for StatCards

export default function DashboardPage() {
  const { stats, loading: loadingStats } = useDashboardStats();

  return (
    <div className="container mx-auto py-3 px-2 space-y-4">
      {/* Header Card (Optional, can be part of layout) */}
      <Card className="mb-4">
        <CardHeader>
            <CardTitle>Volunteer Dashboard</CardTitle>
            <CardDescription>Overview of volunteer activities and system status.</CardDescription>
        </CardHeader>
      </Card>

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
