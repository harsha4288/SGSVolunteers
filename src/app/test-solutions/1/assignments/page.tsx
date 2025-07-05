"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Monitor, Smartphone, Tablet, Star, Grid3X3 } from 'lucide-react';
// Temporarily commented out due to missing datatable solution iteration
// import { AssignmentsTable } from '@/components/ui/data-table-solutions/solution-1-assignments-table';

// Mock data for testing
const mockTimeSlots = [
  { id: 1, slot_name: 'Morning Setup', start_time: '2024-01-20T08:00:00Z' },
  { id: 2, slot_name: 'Registration', start_time: '2024-01-20T09:00:00Z' },
  { id: 3, slot_name: 'Welcome', start_time: '2024-01-20T10:00:00Z' },
  { id: 4, slot_name: 'Main Event', start_time: '2024-01-20T11:00:00Z' },
  { id: 5, slot_name: 'Lunch Prep', start_time: '2024-01-20T12:00:00Z' },
  { id: 6, slot_name: 'Lunch Service', start_time: '2024-01-20T13:00:00Z' },
  { id: 7, slot_name: 'Afternoon', start_time: '2024-01-20T14:00:00Z' },
  { id: 8, slot_name: 'Cleanup', start_time: '2024-01-20T16:00:00Z' },
];

const mockAssignments = [
  {
    id: 1,
    volunteer: { first_name: 'John', last_name: 'Smith', email: 'john.smith@example.com' },
    seva_category: { category_name: 'Registration' },
    time_slot_id: 1,
    check_in_status: 'checked_in' as const
  },
  {
    id: 2,
    volunteer: { first_name: 'Maria', last_name: 'Garcia-Rodriguez', email: 'maria.garcia.rodriguez@example.com' },
    seva_category: { category_name: 'Food Service' },
    time_slot_id: 2,
    check_in_status: 'pending' as const
  },
  {
    id: 3,
    volunteer: { first_name: 'Alexander', last_name: 'Constantinopolous', email: 'alex.constantinopolous@example.com' },
    seva_category: { category_name: 'Setup & Logistics' },
    time_slot_id: 3,
    check_in_status: 'absent' as const
  },
  {
    id: 4,
    volunteer: { first_name: 'Wei', last_name: 'Zhang', email: 'wei.zhang@example.com' },
    seva_category: { category_name: 'Audio/Visual' },
    time_slot_id: 1,
    check_in_status: 'checked_in' as const
  },
  {
    id: 5,
    volunteer: { first_name: 'Sarah', last_name: 'Johnson-Williams', email: 'sarah.johnson.williams@example.com' },
    seva_category: { category_name: 'Guest Relations' },
    time_slot_id: 4,
    check_in_status: 'pending' as const
  }
];

// Simple placeholder component
function AssignmentsTablePlaceholder() {
  return (
    <div className="border rounded-lg p-8 text-center">
      <div className="text-muted-foreground mb-4">
        <Grid3X3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Solution 1: CSS Grid Approach</h3>
        <p className="text-sm">
          This solution prototype has been archived. The component used iteration_1
          datatable solution which is no longer available.
        </p>
      </div>
      <div className="bg-muted rounded-lg p-4 text-left">
        <p className="text-xs text-muted-foreground mb-2">Key Features (Archived):</p>
        <ul className="text-xs space-y-1">
          <li>• CSS Grid replaces table structure</li>
          <li>• Grid template: minmax(150px, 0.22fr) repeat(auto-fit, 1fr)</li>
          <li>• Perfect column control without JavaScript</li>
          <li>• Container queries for responsive design</li>
        </ul>
      </div>
    </div>
  );
}

export default function Solution1AssignmentsPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/test-solutions">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Solutions
            </Button>
          </Link>
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
            #10 Ranked Solution
          </Badge>
          <Badge variant="outline">
            Score: 97/100
          </Badge>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <Star className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Solution 1: CSS Grid Approach</h1>
        </div>
        <p className="text-lg text-muted-foreground mb-4">
          Assignments Table - Replace table structure with CSS Grid for flexible column sizing
        </p>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Grid3X3 className="h-4 w-4" />
                CSS Grid Layout
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                Modern grid system for perfect column control
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="h-4 w-4" />
                Clean Approach
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                minmax(150px, 0.22fr) repeat(auto-fit, 1fr) template
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Good Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                No JavaScript overhead, GPU-accelerated layout
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Testing Instructions */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-sm mb-2">🧪 Testing Checklist:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Volunteer column ≤ 22% width
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              CSS Grid structure visible in DevTools
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Frozen column sticks on scroll
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Container queries work responsively
            </div>
          </div>
        </div>

        {/* Device Testing */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={() => window.resizeTo(375, 667)}>
            <Smartphone className="h-3 w-3 mr-1" />
            Mobile (375px)
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.resizeTo(768, 1024)}>
            <Tablet className="h-3 w-3 mr-1" />
            Tablet (768px)
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.resizeTo(1280, 720)}>
            <Monitor className="h-3 w-3 mr-1" />
            Desktop (1280px)
          </Button>
        </div>
      </div>

      {/* The Actual Table - replaced with placeholder */}
      <div className="border rounded-lg bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Live Demo - Assignments Table (CSS Grid)</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This solution prototype has been archived. See other active solutions for live demos.
        </p>

        <AssignmentsTablePlaceholder />
      </div>

      {/* Navigation */}
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link href="/test-solutions/1/tshirts">
          <Button variant="outline">
            Test T-shirts Table →
          </Button>
        </Link>
        <Link href="/test-solutions/1/requirements">
          <Button variant="outline">
            Test Requirements Table →
          </Button>
        </Link>
        <Link href="/test-solutions/comparison">
          <Button variant="outline">
            📊 Compare with Other Solutions
          </Button>
        </Link>
      </div>
    </div>
  );
}