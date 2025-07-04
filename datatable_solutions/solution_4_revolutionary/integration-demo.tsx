import React from 'react';
import { 
  DataTable, 
  DataTableHeader, 
  DataTableBody, 
  DataTableRow, 
  DataTableHead, 
  DataTableCell, 
  DataTableBadge 
} from './DataTable';
import './styles.css';

/**
 * Revolutionary Responsive Layout Adapter Integration Demo
 * 
 * Demonstrates a completely new paradigm for data presentation that abandons
 * traditional table constraints on mobile/tablet devices:
 * 
 * - Desktop: Traditional table (familiar and powerful)
 * - Tablet: Card-based layouts with volunteer prominence
 * - Mobile: Timeline/accordion layouts with progressive disclosure
 * 
 * This solution reimagines how users interact with complex data on different devices.
 */

// Enhanced data structures with metadata for revolutionary layouts
interface VolunteerAssignment {
  id: string;
  volunteer_name: string;
  volunteer_email: string;
  phone?: string;
  assignments: Array<{
    slot_name: string;
    seva_category: string;
    status: 'assigned' | 'present' | 'absent' | 'pending';
    time: string;
  }>;
  total_assignments: number;
  attendance_rate: number;
}

interface TShirtRecord {
  id: string;
  volunteer_name: string;
  volunteer_email: string;
  allocation: number;
  sizes: {
    XS?: number; S?: number; M?: number; L?: number; 
    XL?: number; '2XL'?: number; '3XL'?: number;
  };
  total_issued: number;
  preference_status: 'complete' | 'partial' | 'none';
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
}

// Sample data with rich metadata
const assignmentData: VolunteerAssignment[] = [
  {
    id: '1',
    volunteer_name: 'Sarah Elizabeth Johnson-Williams',
    volunteer_email: 'sarah.johnson.williams@example.com',
    phone: '+1 (555) 123-4567',
    assignments: [
      { slot_name: 'Setup', seva_category: 'Crowd Management', status: 'assigned', time: '07:00-09:00' },
      { slot_name: 'Session 1', seva_category: 'Help Desk', status: 'present', time: '09:00-12:00' },
      { slot_name: 'Lunch', seva_category: 'Meal Prep', status: 'present', time: '12:00-13:00' },
      { slot_name: 'Evening', seva_category: 'Stage Management', status: 'pending', time: '19:00-21:00' },
    ],
    total_assignments: 4,
    attendance_rate: 75
  },
  {
    id: '2',
    volunteer_name: 'Michael Christopher Rodriguez-Thompson',
    volunteer_email: 'michael.rodriguez.thompson@domain.com',
    phone: '+1 (555) 987-6543',
    assignments: [
      { slot_name: 'Session 1', seva_category: 'Hospitality', status: 'present', time: '09:00-12:00' },
      { slot_name: 'Tea', seva_category: 'Snacks', status: 'present', time: '16:00-16:30' },
      { slot_name: 'Cleanup', seva_category: 'General', status: 'assigned', time: '21:00-22:00' },
    ],
    total_assignments: 3,
    attendance_rate: 85
  },
  {
    id: '3',
    volunteer_name: 'John Smith',
    volunteer_email: 'john@example.com',
    assignments: [
      { slot_name: 'Setup', seva_category: 'Mobile', status: 'present', time: '07:00-09:00' },
      { slot_name: 'Dinner', seva_category: 'Meal Prep', status: 'assigned', time: '18:00-19:00' },
    ],
    total_assignments: 2,
    attendance_rate: 50
  }
];

const tshirtData: TShirtRecord[] = [
  {
    id: '1',
    volunteer_name: 'Sarah Elizabeth Johnson-Williams',
    volunteer_email: 'sarah.johnson.williams@example.com',
    allocation: 2,
    sizes: { M: 1, L: 1 },
    total_issued: 2,
    preference_status: 'complete'
  },
  {
    id: '2',
    volunteer_name: 'Michael Christopher Rodriguez-Thompson', 
    volunteer_email: 'michael.rodriguez.thompson@domain.com',
    allocation: 3,
    sizes: { L: 2, XL: 1 },
    total_issued: 3,
    preference_status: 'complete'
  },
  {
    id: '3',
    volunteer_name: 'John Smith',
    volunteer_email: 'john@example.com',
    allocation: 1,
    sizes: { M: 1 },
    total_issued: 0,
    preference_status: 'partial'
  }
];

const requirementData: RequirementRecord[] = [
  {
    id: '1',
    location_name: 'Main Hall - North Wing Reception Area',
    seva_category: 'Crowd Management',
    time_slot: 'Setup (07:00-09:00)',
    required_count: 5,
    assigned_count: 4,
    attended_count: 3,
    fulfillment_rate: 80,
    variance: -1
  },
  {
    id: '2',
    location_name: 'Information Center - Welcome Desk',
    seva_category: 'Help Desk',
    time_slot: 'Session 1 (09:00-12:00)',
    required_count: 3,
    assigned_count: 3,
    attended_count: 3,
    fulfillment_rate: 100,
    variance: 0
  },
  {
    id: '3',
    location_name: 'Kitchen - Food Preparation Area',
    seva_category: 'Meal Preparation',
    time_slot: 'Lunch (12:00-13:00)',
    required_count: 8,
    assigned_count: 6,
    attended_count: 5,
    fulfillment_rate: 75,
    variance: -2
  }
];

// Metadata for revolutionary layouts
const assignmentColumns = [
  { key: 'volunteer_name', label: 'Volunteer', type: 'text', priority: 'primary', mobileVisible: true, tabletVisible: true },
  { key: 'volunteer_email', label: 'Email', type: 'text', priority: 'secondary', mobileVisible: true, tabletVisible: true },
  { key: 'phone', label: 'Phone', type: 'text', priority: 'tertiary', mobileVisible: false, tabletVisible: true },
  { key: 'total_assignments', label: 'Assignments', type: 'number', priority: 'secondary', mobileVisible: true, tabletVisible: true },
  { key: 'attendance_rate', label: 'Attendance', type: 'badge', priority: 'secondary', mobileVisible: true, tabletVisible: true },
  { key: 'assignments', label: 'Details', type: 'text', priority: 'tertiary', mobileVisible: false, tabletVisible: false }
];

const tshirtColumns = [
  { key: 'volunteer_name', label: 'Volunteer', type: 'text', priority: 'primary', mobileVisible: true, tabletVisible: true },
  { key: 'volunteer_email', label: 'Email', type: 'text', priority: 'secondary', mobileVisible: true, tabletVisible: true },
  { key: 'allocation', label: 'Max', type: 'number', priority: 'secondary', mobileVisible: true, tabletVisible: true },
  { key: 'total_issued', label: 'Issued', type: 'number', priority: 'secondary', mobileVisible: true, tabletVisible: true },
  { key: 'preference_status', label: 'Status', type: 'badge', priority: 'secondary', mobileVisible: true, tabletVisible: true },
  { key: 'sizes', label: 'Sizes', type: 'text', priority: 'tertiary', mobileVisible: false, tabletVisible: true }
];

const requirementColumns = [
  { key: 'location_name', label: 'Location', type: 'text', priority: 'primary', mobileVisible: true, tabletVisible: true },
  { key: 'seva_category', label: 'Category', type: 'text', priority: 'secondary', mobileVisible: true, tabletVisible: true },
  { key: 'time_slot', label: 'Time Slot', type: 'text', priority: 'secondary', mobileVisible: true, tabletVisible: true },
  { key: 'required_count', label: 'Required', type: 'number', priority: 'secondary', mobileVisible: true, tabletVisible: true },
  { key: 'assigned_count', label: 'Assigned', type: 'number', priority: 'secondary', mobileVisible: true, tabletVisible: true },
  { key: 'fulfillment_rate', label: 'Fulfillment', type: 'badge', priority: 'secondary', mobileVisible: true, tabletVisible: true },
  { key: 'variance', label: 'Variance', type: 'number', priority: 'tertiary', mobileVisible: false, tabletVisible: true }
];

// Transform data for revolutionary layouts
const prepareAssignmentData = (data: VolunteerAssignment[]) => {
  return data.map(item => ({
    volunteer_name: item.volunteer_name,
    volunteer_email: item.volunteer_email,
    phone: item.phone || 'Not provided',
    total_assignments: item.total_assignments,
    attendance_rate: `${item.attendance_rate}%`,
    assignments: item.assignments.map(a => `${a.slot_name}: ${a.seva_category} (${a.status})`).join(', ')
  }));
};

const prepareTShirtData = (data: TShirtRecord[]) => {
  return data.map(item => ({
    volunteer_name: item.volunteer_name,
    volunteer_email: item.volunteer_email,
    allocation: item.allocation,
    total_issued: item.total_issued,
    preference_status: item.preference_status,
    sizes: Object.entries(item.sizes).map(([size, count]) => `${size}:${count}`).join(', ')
  }));
};

const prepareRequirementData = (data: RequirementRecord[]) => {
  return data.map(item => ({
    location_name: item.location_name,
    seva_category: item.seva_category,
    time_slot: item.time_slot,
    required_count: item.required_count,
    assigned_count: item.assigned_count,
    fulfillment_rate: `${item.fulfillment_rate}%`,
    variance: item.variance >= 0 ? `+${item.variance}` : `${item.variance}`
  }));
};

// Demo Components

export const AssignmentsRevolutionaryDemo: React.FC = () => {
  const dataRows = prepareAssignmentData(assignmentData);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Assignments - Revolutionary Layout</h3>
        <div className="text-sm text-muted-foreground">
          Desktop: Table • Tablet: Cards • Mobile: Timeline
        </div>
      </div>
      
      <DataTable 
        useRevolutionaryLayout={true}
        revolutionaryConfig={{
          breakpoints: { mobile: 768, tablet: 1024 },
          layouts: { desktop: 'table', tablet: 'cards', mobile: 'timeline' },
          enableLayoutToggle: true,
          primaryColumn: 0
        }}
        columnsMetadata={assignmentColumns}
        dataRows={dataRows}
        maxHeight="500px"
      >
        {/* Traditional table structure for desktop */}
        <DataTableHeader>
          <DataTableRow>
            <DataTableHead>Volunteer</DataTableHead>
            <DataTableHead>Email</DataTableHead>
            <DataTableHead>Phone</DataTableHead>
            <DataTableHead align="center">Assignments</DataTableHead>
            <DataTableHead align="center">Attendance</DataTableHead>
          </DataTableRow>
        </DataTableHeader>
        <DataTableBody>
          {assignmentData.map((volunteer) => (
            <DataTableRow key={volunteer.id}>
              <DataTableCell className="font-medium">
                {volunteer.volunteer_name}
              </DataTableCell>
              <DataTableCell className="text-muted-foreground">
                {volunteer.volunteer_email}
              </DataTableCell>
              <DataTableCell>
                {volunteer.phone || 'Not provided'}
              </DataTableCell>
              <DataTableCell align="center">
                <DataTableBadge variant="outline">
                  {volunteer.total_assignments}
                </DataTableBadge>
              </DataTableCell>
              <DataTableCell align="center">
                <DataTableBadge 
                  variant={volunteer.attendance_rate >= 80 ? "default" : volunteer.attendance_rate >= 60 ? "secondary" : "destructive"}
                >
                  {volunteer.attendance_rate}%
                </DataTableBadge>
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
};

export const TShirtsRevolutionaryDemo: React.FC = () => {
  const dataRows = prepareTShirtData(tshirtData);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">T-Shirts - Revolutionary Layout</h3>
        <div className="text-sm text-muted-foreground">
          Desktop: Table • Tablet: Grid • Mobile: Accordion
        </div>
      </div>
      
      <DataTable 
        useRevolutionaryLayout={true}
        revolutionaryConfig={{
          breakpoints: { mobile: 768, tablet: 1024 },
          layouts: { desktop: 'table', tablet: 'grid', mobile: 'accordion' },
          enableLayoutToggle: true,
          primaryColumn: 0
        }}
        columnsMetadata={tshirtColumns}
        dataRows={dataRows}
        maxHeight="500px"
      >
        {/* Traditional table structure for desktop */}
        <DataTableHeader>
          <DataTableRow>
            <DataTableHead>Volunteer</DataTableHead>
            <DataTableHead>Email</DataTableHead>
            <DataTableHead align="center">Max</DataTableHead>
            <DataTableHead align="center">Issued</DataTableHead>
            <DataTableHead align="center">Status</DataTableHead>
            <DataTableHead>Sizes</DataTableHead>
          </DataTableRow>
        </DataTableHeader>
        <DataTableBody>
          {tshirtData.map((record) => (
            <DataTableRow key={record.id}>
              <DataTableCell className="font-medium">
                {record.volunteer_name}
              </DataTableCell>
              <DataTableCell className="text-muted-foreground">
                {record.volunteer_email}
              </DataTableCell>
              <DataTableCell align="center">
                {record.allocation}
              </DataTableCell>
              <DataTableCell align="center">
                <DataTableBadge variant="outline">
                  {record.total_issued}
                </DataTableBadge>
              </DataTableCell>
              <DataTableCell align="center">
                <DataTableBadge 
                  variant={record.preference_status === 'complete' ? "default" : record.preference_status === 'partial' ? "secondary" : "destructive"}
                >
                  {record.preference_status}
                </DataTableBadge>
              </DataTableCell>
              <DataTableCell>
                {Object.entries(record.sizes).map(([size, count]) => `${size}: ${count}`).join(', ')}
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
};

export const RequirementsRevolutionaryDemo: React.FC = () => {
  const dataRows = prepareRequirementData(requirementData);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Requirements - Revolutionary Layout</h3>
        <div className="text-sm text-muted-foreground">
          Desktop: Table • Tablet: Masonry • Mobile: Feed
        </div>
      </div>
      
      <DataTable 
        useRevolutionaryLayout={true}
        revolutionaryConfig={{
          breakpoints: { mobile: 768, tablet: 1024 },
          layouts: { desktop: 'table', tablet: 'masonry', mobile: 'feed' },
          enableLayoutToggle: true,
          primaryColumn: 0
        }}
        columnsMetadata={requirementColumns}
        dataRows={dataRows}
        maxHeight="500px"
      >
        {/* Traditional table structure for desktop */}
        <DataTableHeader>
          <DataTableRow>
            <DataTableHead>Location</DataTableHead>
            <DataTableHead>Category</DataTableHead>
            <DataTableHead>Time Slot</DataTableHead>
            <DataTableHead align="center">Required</DataTableHead>
            <DataTableHead align="center">Assigned</DataTableHead>
            <DataTableHead align="center">Fulfillment</DataTableHead>
            <DataTableHead align="center">Variance</DataTableHead>
          </DataTableRow>
        </DataTableHeader>
        <DataTableBody>
          {requirementData.map((req) => (
            <DataTableRow key={req.id}>
              <DataTableCell className="font-medium">
                {req.location_name}
              </DataTableCell>
              <DataTableCell>
                {req.seva_category}
              </DataTableCell>
              <DataTableCell>
                {req.time_slot}
              </DataTableCell>
              <DataTableCell align="center">
                {req.required_count}
              </DataTableCell>
              <DataTableCell align="center">
                <DataTableBadge variant="outline">
                  {req.assigned_count}
                </DataTableBadge>
              </DataTableCell>
              <DataTableCell align="center">
                <DataTableBadge 
                  variant={req.fulfillment_rate >= 90 ? "default" : req.fulfillment_rate >= 70 ? "secondary" : "destructive"}
                >
                  {req.fulfillment_rate}%
                </DataTableBadge>
              </DataTableCell>
              <DataTableCell align="center">
                <DataTableBadge 
                  variant={req.variance >= 0 ? "default" : "destructive"}
                >
                  {req.variance >= 0 ? `+${req.variance}` : req.variance}
                </DataTableBadge>
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
};

// Layout showcase demo
export const LayoutShowcaseDemo: React.FC = () => {
  const [screenSize, setScreenSize] = React.useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const simulateScreenSize = (size: 'desktop' | 'tablet' | 'mobile') => {
    setScreenSize(size);
    const width = size === 'desktop' ? 1200 : size === 'tablet' ? 800 : 400;
    // This is for demo purposes - in real implementation, resize observer handles this
    console.log(`Simulating ${size} view (${width}px)`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Revolutionary Layout Showcase</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => simulateScreenSize('desktop')}
            className={`px-3 py-1 text-sm rounded ${screenSize === 'desktop' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            Desktop
          </button>
          <button
            onClick={() => simulateScreenSize('tablet')}
            className={`px-3 py-1 text-sm rounded ${screenSize === 'tablet' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            Tablet
          </button>
          <button
            onClick={() => simulateScreenSize('mobile')}
            className={`px-3 py-1 text-sm rounded ${screenSize === 'mobile' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            Mobile
          </button>
        </div>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">Current Approach: {screenSize}</h4>
        <div className="text-sm text-muted-foreground">
          {screenSize === 'desktop' && "Traditional table layout - familiar and powerful for complex data interaction"}
          {screenSize === 'tablet' && "Card/Grid layouts - balance between detail and usability on medium screens"}
          {screenSize === 'mobile' && "Timeline/List layouts - progressive disclosure for optimal mobile experience"}
        </div>
      </div>

      <AssignmentsRevolutionaryDemo />
    </div>
  );
};

// Main Integration Demo Component
export const RevolutionaryIntegrationDemo: React.FC = () => {
  const [activeDemo, setActiveDemo] = React.useState<'showcase' | 'assignments' | 'tshirts' | 'requirements'>('showcase');

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Revolutionary Responsive Layout Adapter - Demo</h2>
        <p className="text-muted-foreground">
          Completely reimagines data presentation by abandoning table constraints on mobile/tablet. 
          Uses context-aware layouts that transform based on device capabilities and user needs.
        </p>
      </div>

      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setActiveDemo('showcase')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeDemo === 'showcase' 
              ? 'border-primary text-primary font-medium' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Layout Showcase
        </button>
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

      <div>
        {activeDemo === 'showcase' && <LayoutShowcaseDemo />}
        {activeDemo === 'assignments' && <AssignmentsRevolutionaryDemo />}
        {activeDemo === 'tshirts' && <TShirtsRevolutionaryDemo />}
        {activeDemo === 'requirements' && <RequirementsRevolutionaryDemo />}
      </div>

      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h4 className="font-semibold mb-2">Revolutionary Paradigm Benefits:</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li><strong>Context-Aware:</strong> Each device gets optimal layout for its capabilities</li>
          <li><strong>Progressive Disclosure:</strong> Mobile users see essential info first, details on demand</li>
          <li><strong>Volunteer-Centric:</strong> Primary column (volunteer) gets prominence without width constraints</li>
          <li><strong>Gesture-Friendly:</strong> Touch-optimized interactions for mobile/tablet</li>
          <li><strong>Layout Flexibility:</strong> Users can toggle between layout styles per device</li>
          <li><strong>Information Hierarchy:</strong> Data priority determines visibility across breakpoints</li>
        </ul>
      </div>
    </div>
  );
};

export default RevolutionaryIntegrationDemo;