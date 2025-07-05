"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, Minus, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableColGroup,
  DataTableCol,
} from "../../../../datatable_solutions/solution_3_dynamic/DataTable";

// Mock data interfaces
interface MockVolunteer {
  first_name: string;
  last_name: string;
  email: string;
}

interface MockSevaCategory {
  category_name: string;
}

interface MockAssignment {
  id: number;
  volunteer: MockVolunteer;
  seva_category: MockSevaCategory;
  time_slot_id: number;
  check_in_status: 'checked_in' | 'pending' | 'absent';
}

interface MockTimeSlot {
  id: number;
  slot_name: string;
  start_time: string;
}

interface AssignmentsTableProps {
  assignments?: MockAssignment[];
  timeSlots?: MockTimeSlot[];
}

export function AssignmentsTable({
  assignments = [],
  timeSlots = []
}: AssignmentsTableProps) {

  // Default mock data if none provided
  const defaultAssignments: MockAssignment[] = [
    {
      id: 1,
      volunteer: { first_name: 'John', last_name: 'Smith', email: 'john.smith@example.com' },
      seva_category: { category_name: 'Registration' },
      time_slot_id: 1,
      check_in_status: 'checked_in'
    },
    {
      id: 2,
      volunteer: { first_name: 'Maria', last_name: 'Garcia-Rodriguez', email: 'maria.garcia.rodriguez@example.com' },
      seva_category: { category_name: 'Food Service' },
      time_slot_id: 2,
      check_in_status: 'pending'
    },
    {
      id: 3,
      volunteer: { first_name: 'Alexander', last_name: 'Constantinopolous', email: 'alex.constantinopolous@example.com' },
      seva_category: { category_name: 'Setup & Logistics' },
      time_slot_id: 3,
      check_in_status: 'absent'
    },
    {
      id: 4,
      volunteer: { first_name: 'Wei', last_name: 'Zhang', email: 'wei.zhang@example.com' },
      seva_category: { category_name: 'Audio/Visual' },
      time_slot_id: 1,
      check_in_status: 'checked_in'
    },
    {
      id: 5,
      volunteer: { first_name: 'Sarah', last_name: 'Johnson-Williams', email: 'sarah.johnson.williams@example.com' },
      seva_category: { category_name: 'Guest Relations' },
      time_slot_id: 4,
      check_in_status: 'pending'
    },
    {
      id: 6,
      volunteer: { first_name: 'Christopher', last_name: 'Vandenberg-Patterson', email: 'chris.vandenberg.patterson@example.com' },
      seva_category: { category_name: 'Parking & Traffic' },
      time_slot_id: 2,
      check_in_status: 'checked_in'
    },
    {
      id: 7,
      volunteer: { first_name: 'Priya', last_name: 'Sharma', email: 'priya.sharma@example.com' },
      seva_category: { category_name: 'Children Activities' },
      time_slot_id: 3,
      check_in_status: 'pending'
    },
    {
      id: 8,
      volunteer: { first_name: 'Robert', last_name: 'Anderson', email: 'robert.anderson@example.com' },
      seva_category: { category_name: 'Cleanup Crew' },
      time_slot_id: 4,
      check_in_status: 'absent'
    }
  ];

  const defaultTimeSlots: MockTimeSlot[] = [
    { id: 1, slot_name: 'Morning Setup', start_time: '2024-01-20T08:00:00Z' },
    { id: 2, slot_name: 'Registration', start_time: '2024-01-20T09:00:00Z' },
    { id: 3, slot_name: 'Main Event', start_time: '2024-01-20T11:00:00Z' },
    { id: 4, slot_name: 'Cleanup', start_time: '2024-01-20T16:00:00Z' },
  ];

  const activeAssignments = assignments.length > 0 ? assignments : defaultAssignments;
  const activeTimeSlots = timeSlots.length > 0 ? timeSlots : defaultTimeSlots;

  // Group assignments by volunteer
  const volunteerAssignments = React.useMemo(() => {
    const grouped: Record<string, MockAssignment[]> = {};
    activeAssignments.forEach((a) => {
      const name = `${a.volunteer.first_name} ${a.volunteer.last_name}`;
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(a);
    });
    return grouped;
  }, [activeAssignments]);

  // Render assignment cell
  const renderAssignmentCell = (assignment: MockAssignment | undefined, slotId: number) => {
    if (!assignment || assignment.time_slot_id !== slotId) {
      return <Minus className="h-4 w-4 text-muted-foreground inline-block" aria-label="Not assigned" />;
    }

    const taskName = assignment.seva_category?.category_name || "";

    return (
      <div className="inline-flex flex-col items-center gap-1">
        <div className="flex items-center gap-1" title={taskName}>
          <span className="text-xs font-medium text-center px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded">
            {taskName}
          </span>
        </div>

        {assignment.check_in_status === "checked_in" ? (
          <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-transparent">
            <Check className="h-3.5 w-3.5" aria-label="Present" />
          </Badge>
        ) : assignment.check_in_status === "absent" ? (
          <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-transparent">
            <X className="h-3.5 w-3.5" aria-label="Absent" />
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-500 border-transparent">
            <Clock className="h-3.5 w-3.5" aria-label="Pending" />
          </Badge>
        )}
      </div>
    );
  };

  const volunteerNames = Object.keys(volunteerAssignments);

  return (
    <div className="space-y-4">
      {/* Demo Info */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-sm mb-2">🎯 Solution 1 Features in Action:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            CSS Grid replaces table structure
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Grid template: minmax(150px, 0.22fr) repeat(auto-fit, 1fr)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Perfect column control without JavaScript
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Container queries for responsive design
          </div>
        </div>
      </div>

      {/* The actual DataTable with Solution 1 implementation */}
      <DataTable
        maxHeight="calc(100vh - 400px)"
        frozenColumns={[0]}
        density="compact"
        useGridLayout={true}
        volunteerColumnGrid={{
          minWidth: '150px',
          maxFraction: '0.22fr'
        }}
      >
        <DataTableColGroup>
          <DataTableCol gridArea="volunteer" />
          {activeTimeSlots.map((slot) => (
            <DataTableCol key={slot.id} gridArea={`slot-${slot.id}`} />
          ))}
        </DataTableColGroup>

        <DataTableHeader>
          <DataTableRow hover={false}>
            <DataTableHead align="left" className="px-3" colIndex={0} vAlign="middle">
              Volunteer
            </DataTableHead>
            {activeTimeSlots.map((slot, index) => (
              <DataTableHead key={slot.id} align="center" colIndex={index + 1} vAlign="middle" className="min-w-0">
                <span className="text-xs">{slot.slot_name}</span>
              </DataTableHead>
            ))}
          </DataTableRow>
        </DataTableHeader>

        <DataTableBody>
          {volunteerNames.map((volunteerName) => (
            <DataTableRow key={volunteerName}>
              <DataTableCell
                className="font-medium px-3"
                colIndex={0}
                vAlign="middle"
              >
                <div className="flex flex-col">
                  <span className="text-sm">{volunteerName}</span>
                  <span className="text-xs text-muted-foreground">
                    {volunteerAssignments[volunteerName][0]?.volunteer.email}
                  </span>
                </div>
              </DataTableCell>
              {activeTimeSlots.map((slot, index) => {
                const assignment = volunteerAssignments[volunteerName].find(
                  (a) => a.time_slot_id === slot.id
                );
                return (
                  <DataTableCell
                    key={slot.id}
                    align="center"
                    colIndex={index + 1}
                    vAlign="middle"
                  >
                    {renderAssignmentCell(assignment, slot.id)}
                  </DataTableCell>
                );
              })}
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>

      {/* Testing Instructions */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="font-semibold text-sm mb-2">🧪 CSS Grid Testing:</h3>
        <ol className="text-xs space-y-1 list-decimal list-inside">
          <li>Inspect element to see CSS Grid layout in developer tools</li>
          <li>Notice volunteer column uses grid-template-columns constraint</li>
          <li>Scroll horizontally to test frozen column with sticky positioning</li>
          <li>Resize browser to see container query responsive adjustments</li>
          <li>Compare performance - zero JavaScript layout calculations</li>
        </ol>
      </div>
    </div>
  );
}