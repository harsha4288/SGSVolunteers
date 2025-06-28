'use client';

import * as React from "react";
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableColGroup,
  DataTableCol,
  DataTableBadge
} from "./DataTable";

// Enhanced data structures for context analysis
interface VolunteerAssignment {
  id: string;
  volunteer_name: string;
  volunteer_email: string;
  phone?: string;
  assignments: Array<{
    slot_name: string;
    seva_category: string;
    status: 'assigned' | 'present' | 'absent' | 'pending';
  }>;
  total_assignments: number;
  attendance_rate: number;
  long_role_description: string;
}

interface TShirtRecord {
  id: string;
  volunteer_name: string;
  volunteer_email: string;
  allocation: number;
  sizes: {
    XS?: number; S?: number; M?: number; L?: number; 
    XL?: number; '2XL'?: number;
  };
  total_issued: number;
  preference_status: 'complete' | 'partial' | 'none';
  detailed_preferences: string;
}

interface RequirementRecord {
  id: string;
  location_name: string;
  seva_category: string;
  time_slot: string;
  required_count: number;
  assigned_count: number;
  attended_count: number;
  fulfillment_rate: number;
  variance: number;
  detailed_requirements: string;
}

// Sample data with varying content lengths to demonstrate context-aware behavior
const assignmentData: VolunteerAssignment[] = [
  {
    id: '1',
    volunteer_name: 'Sarah Elizabeth Johnson',
    volunteer_email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    assignments: [
      { slot_name: 'Setup', seva_category: 'Crowd Management', status: 'assigned' },
      { slot_name: 'Session 1', seva_category: 'Help Desk', status: 'present' },
    ],
    total_assignments: 4,
    attendance_rate: 75,
    long_role_description: 'Event Coordinator and Community Outreach Specialist with extensive experience in managing large-scale community events, responsible for coordinating volunteer activities and ensuring smooth event operations'
  },
  {
    id: '2',
    volunteer_name: 'Michael Christopher Rodriguez',
    volunteer_email: 'michael.rodriguez@email.com',
    phone: '+1 (555) 987-6543',
    assignments: [
      { slot_name: 'Session 1', seva_category: 'Hospitality', status: 'present' },
      { slot_name: 'Tea', seva_category: 'Snacks', status: 'present' },
    ],
    total_assignments: 3,
    attendance_rate: 85,
    long_role_description: 'Registration and Check-in Assistant responsible for greeting guests, managing volunteer schedules, and providing information about event logistics'
  },
  {
    id: '3',
    volunteer_name: 'John Smith',
    volunteer_email: 'john@email.com',
    assignments: [
      { slot_name: 'Setup', seva_category: 'Mobile', status: 'present' },
    ],
    total_assignments: 2,
    attendance_rate: 50,
    long_role_description: 'Technical Support and Audio Visual Equipment Manager overseeing all technical aspects of the event including sound, lighting, and presentation equipment setup and operation'
  }
];

const tshirtData: TShirtRecord[] = [
  {
    id: '1',
    volunteer_name: 'Sarah Elizabeth Johnson',
    volunteer_email: 'sarah.johnson@email.com',
    allocation: 2,
    sizes: { M: 1, L: 1 },
    total_issued: 2,
    preference_status: 'complete',
    detailed_preferences: '👕 Preferred medium for regular activities and large for outdoor events with weather considerations and layering requirements 🌤️'
  },
  {
    id: '2',
    volunteer_name: 'Michael Christopher Rodriguez', 
    volunteer_email: 'michael.rodriguez@email.com',
    allocation: 3,
    sizes: { L: 2, XL: 1 },
    total_issued: 3,
    preference_status: 'complete',
    detailed_preferences: '👕👕 Two large shirts for general wear and one extra-large for comfort during long volunteer shifts 💪'
  },
  {
    id: '3',
    volunteer_name: 'John Smith',
    volunteer_email: 'john@email.com',
    allocation: 1,
    sizes: { M: 1 },
    total_issued: 0,
    preference_status: 'partial',
    detailed_preferences: '👕 Medium size preferred but willing to accept large if medium not available for technical work requirements 🔧'
  }
];

const requirementData: RequirementRecord[] = [
  {
    id: '1',
    location_name: 'Main Hall North Wing Reception and Welcome Area',
    seva_category: 'Crowd Management',
    time_slot: 'Setup (07:00-09:00)',
    required_count: 5,
    assigned_count: 4,
    attended_count: 3,
    fulfillment_rate: 80,
    variance: -1,
    detailed_requirements: 'Volunteers needed for crowd control, guest guidance, and maintaining order during high-traffic setup period with special attention to accessibility needs'
  },
  {
    id: '2',
    location_name: 'Information Center and Help Desk Station',
    seva_category: 'Help Desk',
    time_slot: 'Session 1 (09:00-12:00)',
    required_count: 3,
    assigned_count: 3,
    attended_count: 3,
    fulfillment_rate: 100,
    variance: 0,
    detailed_requirements: 'Information assistance volunteers to help guests with directions, event schedules, and general inquiries throughout the morning session'
  },
  {
    id: '3',
    location_name: 'Kitchen and Food Preparation Service Area',
    seva_category: 'Meal Preparation',
    time_slot: 'Lunch (12:00-13:00)',
    required_count: 8,
    assigned_count: 6,
    attended_count: 5,
    fulfillment_rate: 75,
    variance: -2,
    detailed_requirements: 'Food service volunteers for meal preparation, serving, and cleanup with food safety certification requirements and dietary restriction awareness'
  }
];

// Individual module demos
export const AssignmentsContextualDemo: React.FC = () => {
  const [layoutMode, setLayoutMode] = React.useState<'auto' | 'table' | 'condensed'>('auto');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Assignments - Context-Aware Content Analysis</h3>
        <div className="flex gap-2">
          {(['auto', 'table', 'condensed'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setLayoutMode(mode)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                layoutMode === mode 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
      
      <DataTable 
        useContextualLayout={layoutMode === 'auto' || layoutMode === 'condensed'}
        contentAnalysis={{
          enableContentMeasurement: true,
          longContentThreshold: 80,
          enableRowExpansion: true,
          enableColumnGrouping: true,
          densityMode: 'normal',
          preventContentCutting: true
        }}
        columnGroups={{
          primary: {
            title: 'Primary Information',
            columns: [0, 1, 4], // Name, Email, Attendance
            priority: 'primary'
          },
          contact: {
            title: 'Contact Details',
            columns: [2], // Phone
            priority: 'secondary',
            collapsible: true
          },
          assignment_details: {
            title: 'Assignment Details',
            columns: [3, 5], // Total, Role Description
            priority: 'secondary',
            collapsible: true
          }
        }}
        frozenColumns={[0]}
        minColumnWidths={{
          0: 200, // Volunteer name
          1: 180, // Email
          2: 120, // Phone
          3: 80,  // Total
          4: 100, // Attendance
          5: 250  // Role description
        }}
        maxHeight="400px"
      >
        <DataTableColGroup>
          <DataTableCol width="20%" />
          <DataTableCol width="25%" />
          <DataTableCol width="15%" />
          <DataTableCol width="8%" />
          <DataTableCol width="12%" />
          <DataTableCol width="20%" />
        </DataTableColGroup>

        <DataTableHeader>
          <DataTableRow>
            <DataTableHead>Volunteer</DataTableHead>
            <DataTableHead>Email</DataTableHead>
            <DataTableHead>Phone</DataTableHead>
            <DataTableHead>Total</DataTableHead>
            <DataTableHead>Attendance</DataTableHead>
            <DataTableHead>Role Description</DataTableHead>
          </DataTableRow>
        </DataTableHeader>

        <DataTableBody>
          {assignmentData.map((volunteer) => (
            <DataTableRow key={volunteer.id}>
              <DataTableCell className="font-medium">
                {volunteer.volunteer_name}
              </DataTableCell>
              <DataTableCell>
                {volunteer.volunteer_email}
              </DataTableCell>
              <DataTableCell>
                {volunteer.phone || 'Not provided'}
              </DataTableCell>
              <DataTableCell>
                <DataTableBadge variant="outline">
                  {volunteer.total_assignments}
                </DataTableBadge>
              </DataTableCell>
              <DataTableCell>
                <DataTableBadge 
                  variant={volunteer.attendance_rate >= 80 ? "default" : volunteer.attendance_rate >= 60 ? "secondary" : "destructive"}
                >
                  {volunteer.attendance_rate}%
                </DataTableBadge>
              </DataTableCell>
              <DataTableCell isLongContent={volunteer.long_role_description.length > 80} noTruncate>
                <span className="text-sm leading-tight">
                  {volunteer.long_role_description}
                </span>
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
};

export const TShirtsContextualDemo: React.FC = () => {
  const [layoutMode, setLayoutMode] = React.useState<'auto' | 'table' | 'condensed'>('auto');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">T-Shirts - Context-Aware Content Analysis</h3>
        <div className="flex gap-2">
          {(['auto', 'table', 'condensed'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setLayoutMode(mode)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                layoutMode === mode 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
      
      <DataTable 
        useContextualLayout={layoutMode === 'auto' || layoutMode === 'condensed'}
        contentAnalysis={{
          enableContentMeasurement: true,
          longContentThreshold: 60,
          enableRowExpansion: true,
          enableColumnGrouping: true,
          densityMode: 'normal',
          preventContentCutting: true
        }}
        columnGroups={{
          primary: {
            title: 'Primary Information',
            columns: [0, 1, 4], // Name, Email, Status
            priority: 'primary'
          },
          allocation: {
            title: 'Allocation Details',
            columns: [2, 3], // Max, Issued
            priority: 'secondary',
            collapsible: true
          },
          preferences: {
            title: 'Preference Details',
            columns: [5], // Detailed preferences
            priority: 'tertiary',
            collapsible: true
          }
        }}
        frozenColumns={[0]}
        minColumnWidths={{
          0: 200, // Volunteer name
          1: 180, // Email
          2: 60,  // Max
          3: 60,  // Issued
          4: 100, // Status
          5: 250  // Detailed preferences
        }}
        maxHeight="400px"
      >
        <DataTableColGroup>
          <DataTableCol width="20%" />
          <DataTableCol width="25%" />
          <DataTableCol width="8%" />
          <DataTableCol width="8%" />
          <DataTableCol width="12%" />
          <DataTableCol width="27%" />
        </DataTableColGroup>

        <DataTableHeader>
          <DataTableRow>
            <DataTableHead>Volunteer</DataTableHead>
            <DataTableHead>Email</DataTableHead>
            <DataTableHead>Max</DataTableHead>
            <DataTableHead>Issued</DataTableHead>
            <DataTableHead>Status</DataTableHead>
            <DataTableHead>Detailed Preferences</DataTableHead>
          </DataTableRow>
        </DataTableHeader>

        <DataTableBody>
          {tshirtData.map((record) => (
            <DataTableRow key={record.id}>
              <DataTableCell className="font-medium">
                {record.volunteer_name}
              </DataTableCell>
              <DataTableCell>
                {record.volunteer_email}
              </DataTableCell>
              <DataTableCell>
                <div className="flex items-center gap-1">
                  <span>{record.allocation}</span>
                  <span className="text-lg">👕</span>
                </div>
              </DataTableCell>
              <DataTableCell>
                <DataTableBadge variant="outline">
                  <div className="flex items-center gap-1">
                    <span>{record.total_issued}</span>
                    <span className="text-sm">👕</span>
                  </div>
                </DataTableBadge>
              </DataTableCell>
              <DataTableCell>
                <DataTableBadge 
                  variant={record.preference_status === 'complete' ? "default" : record.preference_status === 'partial' ? "secondary" : "destructive"}
                >
                  {record.preference_status}
                </DataTableBadge>
              </DataTableCell>
              <DataTableCell isLongContent={record.detailed_preferences.length > 60} noTruncate>
                <span className="text-sm leading-tight">
                  {record.detailed_preferences}
                </span>
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
};

export const RequirementsContextualDemo: React.FC = () => {
  const [layoutMode, setLayoutMode] = React.useState<'auto' | 'table' | 'condensed'>('auto');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Requirements - Context-Aware Content Analysis</h3>
        <div className="flex gap-2">
          {(['auto', 'table', 'condensed'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setLayoutMode(mode)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                layoutMode === mode 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
      
      <DataTable 
        useContextualLayout={layoutMode === 'auto' || layoutMode === 'condensed'}
        contentAnalysis={{
          enableContentMeasurement: true,
          longContentThreshold: 70,
          enableRowExpansion: true,
          enableColumnGrouping: true,
          densityMode: 'normal',
          preventContentCutting: true
        }}
        columnGroups={{
          primary: {
            title: 'Primary Information',
            columns: [0, 1, 2], // Location, Category, Time
            priority: 'primary'
          },
          counts: {
            title: 'Count Details',
            columns: [3, 4, 5], // Required, Assigned, Fulfillment
            priority: 'secondary',
            collapsible: true
          },
          details: {
            title: 'Detailed Requirements',
            columns: [6, 7], // Variance, Details
            priority: 'tertiary',
            collapsible: true
          }
        }}
        frozenColumns={[0]}
        minColumnWidths={{
          0: 250, // Location name
          1: 120, // Category
          2: 150, // Time slot
          3: 80,  // Required
          4: 80,  // Assigned
          5: 100, // Fulfillment
          6: 80,  // Variance
          7: 250  // Detailed requirements
        }}
        maxHeight="400px"
      >
        <DataTableColGroup>
          <DataTableCol width="25%" />
          <DataTableCol width="12%" />
          <DataTableCol width="15%" />
          <DataTableCol width="8%" />
          <DataTableCol width="8%" />
          <DataTableCol width="10%" />
          <DataTableCol width="6%" />
          <DataTableCol width="16%" />
        </DataTableColGroup>

        <DataTableHeader>
          <DataTableRow>
            <DataTableHead>Location</DataTableHead>
            <DataTableHead>Category</DataTableHead>
            <DataTableHead>Time Slot</DataTableHead>
            <DataTableHead>Required</DataTableHead>
            <DataTableHead>Assigned</DataTableHead>
            <DataTableHead>Fulfillment</DataTableHead>
            <DataTableHead>Variance</DataTableHead>
            <DataTableHead>Detailed Requirements</DataTableHead>
          </DataTableRow>
        </DataTableHeader>

        <DataTableBody>
          {requirementData.map((req) => (
            <DataTableRow key={req.id}>
              <DataTableCell className="font-medium" isLongContent={req.location_name.length > 30} noTruncate>
                {req.location_name}
              </DataTableCell>
              <DataTableCell>
                {req.seva_category}
              </DataTableCell>
              <DataTableCell>
                <span className="text-xs">
                  {req.time_slot}
                </span>
              </DataTableCell>
              <DataTableCell>
                {req.required_count}
              </DataTableCell>
              <DataTableCell>
                <DataTableBadge variant="outline">
                  {req.assigned_count}
                </DataTableBadge>
              </DataTableCell>
              <DataTableCell>
                <DataTableBadge 
                  variant={req.fulfillment_rate >= 90 ? "default" : req.fulfillment_rate >= 70 ? "secondary" : "destructive"}
                >
                  {req.fulfillment_rate}%
                </DataTableBadge>
              </DataTableCell>
              <DataTableCell>
                <DataTableBadge 
                  variant={req.variance >= 0 ? "default" : "destructive"}
                >
                  {req.variance >= 0 ? `+${req.variance}` : req.variance}
                </DataTableBadge>
              </DataTableCell>
              <DataTableCell isLongContent={req.detailed_requirements.length > 70} noTruncate>
                <span className="text-sm leading-tight">
                  {req.detailed_requirements}
                </span>
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
};

// Main Integration Demo Component
export function ContextualIntegrationDemo() {
  const [activeDemo, setActiveDemo] = React.useState<'assignments' | 'tshirts' | 'requirements'>('assignments');

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Solution 7.1: Enhanced Context-Aware Responsive DataTable</h2>
        <p className="text-muted-foreground">
          Intelligent content-aware responsive behavior with enhanced scrolling and frozen columns. 
          Analyzes actual content length to determine optimal layout while preventing content cutting.
        </p>
        <div className="text-sm text-muted-foreground bg-green-50 dark:bg-green-950 p-3 rounded-lg">
          <strong>Enhanced Features:</strong> Content length analysis, adaptive layout recommendations, 
          expandable row details, column grouping, context-sensitive responsiveness, 
          <strong>proper frozen columns</strong>, and <strong>intelligent overflow handling</strong> that prevents content cutting.
        </div>
      </div>

      {/* Module selector */}
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setActiveDemo('assignments')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeDemo === 'assignments' 
              ? 'border-primary text-primary font-medium' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Assignments
        </button>
        <button
          onClick={() => setActiveDemo('tshirts')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeDemo === 'tshirts' 
              ? 'border-primary text-primary font-medium' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          T-Shirts
        </button>
        <button
          onClick={() => setActiveDemo('requirements')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeDemo === 'requirements' 
              ? 'border-primary text-primary font-medium' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Requirements
        </button>
      </div>

      {/* Current demo */}
      <div>
        {activeDemo === 'assignments' && <AssignmentsContextualDemo />}
        {activeDemo === 'tshirts' && <TShirtsContextualDemo />}
        {activeDemo === 'requirements' && <RequirementsContextualDemo />}
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <h3 className="font-semibold">Context-Aware Analysis Features:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Auto Mode:</strong> Analyzes content length and recommends optimal layout</li>
          <li><strong>Long Content Detection:</strong> Identifies columns with lengthy text content</li>
          <li><strong>Adaptive Truncation:</strong> Smart truncation for long content with expansion options</li>
          <li><strong>Column Grouping:</strong> Groups related columns for better mobile presentation</li>
          <li><strong>Context Sensitivity:</strong> Layout adapts based on actual content, not just screen size</li>
          <li><strong>Expandable Details:</strong> Secondary information accessible through row expansion</li>
          <li><strong>Content Measurement:</strong> Real-time analysis of text length and complexity</li>
        </ul>
      </div>
    </div>
  );
}