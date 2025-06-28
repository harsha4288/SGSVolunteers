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
 * Dynamic CSS Variables Integration DataTable Demo
 * 
 * Demonstrates the Dynamic CSS Variables solution working with actual data structures from:
 * 1. Assignments module (20+ columns)
 * 2. T-shirts module (7 size columns)  
 * 3. Requirements module (3 columns)
 * 
 * Key Innovation: CSS custom properties that adapt to content measurements.
 * Dynamically calculates optimal widths to prevent the 40% width issue.
 */

// Sample data structures (same as previous solutions)

interface Assignment {
  id: number;
  volunteer_id: string;
  time_slot_id: number;
  seva_category_id: number | null;
  commitment_type: string;
  task_notes: string | null;
  volunteer: {
    first_name: string;
    last_name: string;
    email: string;
  };
  time_slot: {
    slot_name: string;
    start_time: string;
    end_time: string;
  };
  seva_category: {
    category_name: string;
  } | null;
  check_in_status?: "checked_in" | "absent" | null;
}

interface TimeSlot {
  id: number;
  event_id: number;
  slot_name: string;
  start_time: string;
  end_time: string;
  description: string | null;
}

interface Volunteer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  requested_tshirt_quantity?: number;
  tshirt_size_preference?: string;
}

interface TShirtInventory {
  size_cd: string;
  size_name: string;
  sort_order: number;
  quantity: number;
  quantity_on_hand: number;
}

interface RequirementWithDetails {
  id?: number;
  seva_category_id: number;
  timeslot_id: number;
  location_id: number | null;
  required_count: number;
  notes?: string;
  seva_category: {
    id: number;
    name: string;
    category_name: string;
  };
  timeslot: {
    id: number;
    slot_name: string;
    start_time: string;
    end_time: string;
  };
  location: {
    id: number;
    name: string;
  };
  assigned_count?: number;
  attended_count?: number;
}

// Sample data with varying name lengths to test dynamic sizing
const sampleTimeSlots: TimeSlot[] = [
  { id: 1, event_id: 1, slot_name: "Setup", start_time: "07:00", end_time: "09:00", description: null },
  { id: 2, event_id: 1, slot_name: "Session 1", start_time: "09:00", end_time: "12:00", description: null },
  { id: 3, event_id: 1, slot_name: "Lunch", start_time: "12:00", end_time: "13:00", description: null },
  { id: 4, event_id: 1, slot_name: "Session 2", start_time: "13:00", end_time: "16:00", description: null },
  { id: 5, event_id: 1, slot_name: "Tea", start_time: "16:00", end_time: "16:30", description: null },
  { id: 6, event_id: 1, slot_name: "Session 3", start_time: "16:30", end_time: "18:00", description: null },
  { id: 7, event_id: 1, slot_name: "Dinner", start_time: "18:00", end_time: "19:00", description: null },
  { id: 8, event_id: 1, slot_name: "Evening", start_time: "19:00", end_time: "21:00", description: null },
  { id: 9, event_id: 1, slot_name: "Cleanup", start_time: "21:00", end_time: "22:00", description: null },
];

// Volunteers with varying name lengths to test dynamic measurement
const sampleVolunteers: Volunteer[] = [
  { id: "1", first_name: "John", last_name: "Smith", email: "john.smith@example.com", requested_tshirt_quantity: 2 },
  { id: "2", first_name: "Sarah Elizabeth", last_name: "Johnson-Williams", email: "sarah.johnson.williams@example.com", requested_tshirt_quantity: 1 },
  { id: "3", first_name: "Michael Christopher", last_name: "Brown", email: "michael.brown@example.com", requested_tshirt_quantity: 3 },
  { id: "4", first_name: "Emily", last_name: "Davis", email: "emily.davis@example.com", requested_tshirt_quantity: 1 },
  { id: "5", first_name: "Christopher Alexander", last_name: "Wilson-Thompson", email: "christopher.wilson.thompson@example.com", requested_tshirt_quantity: 2 },
];

const sampleTShirtSizes: TShirtInventory[] = [
  { size_cd: "XS", size_name: "Extra Small", sort_order: 1, quantity: 50, quantity_on_hand: 45 },
  { size_cd: "S", size_name: "Small", sort_order: 2, quantity: 100, quantity_on_hand: 82 },
  { size_cd: "M", size_name: "Medium", sort_order: 3, quantity: 150, quantity_on_hand: 134 },
  { size_cd: "L", size_name: "Large", sort_order: 4, quantity: 120, quantity_on_hand: 98 },
  { size_cd: "XL", size_name: "Extra Large", sort_order: 5, quantity: 80, quantity_on_hand: 67 },
  { size_cd: "2XL", size_name: "2X Large", sort_order: 6, quantity: 40, quantity_on_hand: 32 },
  { size_cd: "3XL", size_name: "3X Large", sort_order: 7, quantity: 20, quantity_on_hand: 18 },
];

const sampleRequirements: RequirementWithDetails[] = [
  {
    id: 1,
    seva_category_id: 1,
    timeslot_id: 1,
    location_id: 1,
    required_count: 5,
    seva_category: { id: 1, name: "Crowd Management", category_name: "Crowd Management" },
    timeslot: { id: 1, slot_name: "Setup", start_time: "07:00", end_time: "09:00" },
    location: { id: 1, name: "Main Hall - North Wing" },
    assigned_count: 4,
    attended_count: 3,
  },
  {
    id: 2,
    seva_category_id: 2,
    timeslot_id: 1,
    location_id: 1,
    required_count: 3,
    seva_category: { id: 2, name: "Help Desk", category_name: "Help Desk" },
    timeslot: { id: 1, slot_name: "Setup", start_time: "07:00", end_time: "09:00" },
    location: { id: 1, name: "Reception Area - Information Center" },
    assigned_count: 3,
    attended_count: 3,
  },
];

// Demo Components

export const AssignmentsTableDemo: React.FC = () => {
  const [debugMode, setDebugMode] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Assignments Table Demo (20+ Columns)</h3>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">Dynamic: Content-based column sizing</div>
          <button
            onClick={() => setDebugMode(!debugMode)}
            className="px-2 py-1 text-xs bg-muted rounded hover:bg-muted/80"
          >
            {debugMode ? 'Hide Debug' : 'Show Debug'}
          </button>
        </div>
      </div>
      
      <DataTable 
        useDynamicSizing={true}
        dynamicConfig={{
          enableContentMeasurement: true,
          firstColumnMaxWidth: 280,
          firstColumnMinWidth: 180,
          otherColumnsMinWidth: 70,
          measurementDebounce: 150
        }}
        frozenColumns={[0]}
        maxHeight="400px"
        className="many-columns"
        data-debug={debugMode}
      >
        <DataTableHeader>
          <DataTableRow>
            <DataTableHead align="left" colIndex={0} className="font-semibold">
              Volunteer
            </DataTableHead>
            {sampleTimeSlots.map((slot, index) => (
              <DataTableHead key={slot.id} colIndex={index + 1} align="center" className="font-semibold text-xs">
                {slot.slot_name}
              </DataTableHead>
            ))}
          </DataTableRow>
        </DataTableHeader>
        <DataTableBody>
          {sampleVolunteers.map((volunteer, index) => (
            <DataTableRow key={volunteer.id}>
              <DataTableCell align="left" colIndex={0} className="font-medium">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">
                    {volunteer.first_name} {volunteer.last_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {volunteer.email}
                  </span>
                </div>
              </DataTableCell>
              {sampleTimeSlots.map((slot, slotIndex) => (
                <DataTableCell key={slot.id} colIndex={slotIndex + 1} align="center">
                  {/* Simulate different assignment states */}
                  {(index + slotIndex) % 4 === 0 ? (
                    <DataTableBadge variant="default" className="text-xs">
                      📋 CM
                    </DataTableBadge>
                  ) : (index + slotIndex) % 4 === 1 ? (
                    <DataTableBadge variant="secondary" className="text-xs">
                      🍽️ MP
                    </DataTableBadge>
                  ) : (index + slotIndex) % 4 === 2 ? (
                    <DataTableBadge variant="outline" className="text-xs">
                      🖥️ HD
                    </DataTableBadge>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </DataTableCell>
              ))}
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
};

export const TShirtsTableDemo: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">T-Shirts Table Demo (7 Size Columns)</h3>
        <div className="text-sm text-muted-foreground">Dynamic: Measures volunteer names + optimal size distribution</div>
      </div>
      
      <DataTable 
        useDynamicSizing={true}
        dynamicConfig={{
          enableContentMeasurement: true,
          firstColumnMaxWidth: 300,
          firstColumnMinWidth: 200,
          otherColumnsMinWidth: 60,
          measurementDebounce: 100
        }}
        frozenColumns={[0]}
        maxHeight="400px"
        className="size-columns"
      >
        <DataTableHeader>
          <DataTableRow>
            <DataTableHead align="left" colIndex={0} rowSpan={2} className="font-semibold">
              Volunteer
            </DataTableHead>
            <DataTableHead align="center" colIndex={1} rowSpan={2} className="font-semibold text-xs">
              Max
            </DataTableHead>
            <DataTableHead align="center" colSpan={7} className="font-semibold text-xs border-b">
              Issued
            </DataTableHead>
          </DataTableRow>
          <DataTableRow>
            {sampleTShirtSizes.map((size, index) => (
              <DataTableHead key={size.size_cd} colIndex={index + 2} align="center" className="font-semibold text-xs">
                <div className="flex flex-col items-center space-y-1">
                  <span>{size.size_cd}</span>
                  <DataTableBadge variant="outline" className="text-xs px-1">
                    {size.quantity_on_hand}/{size.quantity}
                  </DataTableBadge>
                </div>
              </DataTableHead>
            ))}
          </DataTableRow>
        </DataTableHeader>
        <DataTableBody>
          {sampleVolunteers.map((volunteer, index) => (
            <DataTableRow key={volunteer.id}>
              <DataTableCell align="left" colIndex={0} className="font-medium">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">
                    {volunteer.first_name} {volunteer.last_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {volunteer.email}
                  </span>
                </div>
              </DataTableCell>
              <DataTableCell align="center" colIndex={1} className="text-sm font-medium">
                {volunteer.requested_tshirt_quantity || 0}
              </DataTableCell>
              {sampleTShirtSizes.map((size, sizeIndex) => (
                <DataTableCell key={size.size_cd} colIndex={sizeIndex + 2} align="center">
                  {/* Simulate different issue quantities */}
                  {(index + sizeIndex) % 5 === 0 ? (
                    <span className="font-medium text-sm">1</span>
                  ) : (index + sizeIndex) % 7 === 0 ? (
                    <span className="font-medium text-sm">2</span>
                  ) : (
                    <button className="w-6 h-6 rounded border border-dashed border-muted-foreground/50 hover:border-primary hover:bg-primary/10 transition-colors">
                      <span className="text-xs">👕</span>
                    </button>
                  )}
                </DataTableCell>
              ))}
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
};

export const RequirementsTableDemo: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Requirements Table Demo (3 Columns)</h3>
        <div className="text-sm text-muted-foreground">Dynamic: Measures location names + distributes remaining space</div>
      </div>
      
      <DataTable 
        useDynamicSizing={true}
        dynamicConfig={{
          enableContentMeasurement: true,
          firstColumnMaxWidth: 350,
          firstColumnMinWidth: 200,
          otherColumnsMinWidth: 150,
          measurementDebounce: 100
        }}
        frozenColumns={[0]}
        maxHeight="400px"
        className="few-columns"
      >
        <DataTableHeader>
          <DataTableRow>
            <DataTableHead align="left" colIndex={0} className="font-semibold">
              Location
            </DataTableHead>
            <DataTableHead align="left" colIndex={1} className="font-semibold">
              Timeslot
            </DataTableHead>
            <DataTableHead align="center" colIndex={2} className="font-semibold">
              Required Volunteers
            </DataTableHead>
          </DataTableRow>
        </DataTableHeader>
        <DataTableBody>
          {sampleRequirements.map((requirement) => (
            <DataTableRow key={requirement.id}>
              <DataTableCell align="left" colIndex={0} className="font-medium">
                {requirement.location.name}
              </DataTableCell>
              <DataTableCell align="left" colIndex={1}>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">
                    {requirement.timeslot.slot_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {requirement.timeslot.start_time} - {requirement.timeslot.end_time}
                  </span>
                </div>
              </DataTableCell>
              <DataTableCell align="center" colIndex={2}>
                <div className="flex items-center justify-center space-x-2">
                  <span className="font-medium">{requirement.required_count}</span>
                  <div className="flex space-x-1">
                    <DataTableBadge 
                      variant={requirement.assigned_count! >= requirement.required_count ? "default" : "destructive"}
                      className="text-xs"
                    >
                      A: {requirement.assigned_count}
                    </DataTableBadge>
                    <DataTableBadge variant="secondary" className="text-xs">
                      P: {requirement.attended_count}
                    </DataTableBadge>
                  </div>
                </div>
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
};

// Dynamic content demo - changes content to test measurement
export const DynamicContentDemo: React.FC = () => {
  const [contentMode, setContentMode] = React.useState<'short' | 'medium' | 'long'>('short');
  
  const getVolunteers = () => {
    switch (contentMode) {
      case 'short':
        return [
          { id: "1", first_name: "John", last_name: "Doe", email: "j@example.com" },
          { id: "2", first_name: "Jane", last_name: "Smith", email: "jane@example.com" },
        ];
      case 'medium':
        return [
          { id: "1", first_name: "John Michael", last_name: "Doe-Smith", email: "john.michael@example.com" },
          { id: "2", first_name: "Jane Elizabeth", last_name: "Smith-Jones", email: "jane.elizabeth@example.com" },
        ];
      case 'long':
        return [
          { id: "1", first_name: "John Michael Christopher", last_name: "Doe-Smith-Wilson", email: "john.michael.christopher@very-long-domain-name.com" },
          { id: "2", first_name: "Jane Elizabeth Alexandra", last_name: "Smith-Jones-Brown", email: "jane.elizabeth.alexandra@another-very-long-domain.com" },
        ];
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Dynamic Content Measurement Demo</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm">Content Length:</span>
          <select 
            value={contentMode} 
            onChange={(e) => setContentMode(e.target.value as any)}
            className="px-2 py-1 text-sm border rounded"
          >
            <option value="short">Short Names</option>
            <option value="medium">Medium Names</option>
            <option value="long">Long Names</option>
          </select>
        </div>
      </div>
      
      <DataTable 
        useDynamicSizing={true}
        dynamicConfig={{
          enableContentMeasurement: true,
          firstColumnMaxWidth: 400,
          firstColumnMinWidth: 150,
          otherColumnsMinWidth: 80,
          measurementDebounce: 50
        }}
        frozenColumns={[0]}
        maxHeight="300px"
        data-debug="true"
      >
        <DataTableHeader>
          <DataTableRow>
            <DataTableHead align="left" colIndex={0} className="font-semibold">
              Volunteer (Watch this column resize!)
            </DataTableHead>
            <DataTableHead align="center" colIndex={1} className="font-semibold text-xs">Col 1</DataTableHead>
            <DataTableHead align="center" colIndex={2} className="font-semibold text-xs">Col 2</DataTableHead>
            <DataTableHead align="center" colIndex={3} className="font-semibold text-xs">Col 3</DataTableHead>
          </DataTableRow>
        </DataTableHeader>
        <DataTableBody>
          {getVolunteers().map((volunteer) => (
            <DataTableRow key={volunteer.id}>
              <DataTableCell align="left" colIndex={0} className="font-medium">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">
                    {volunteer.first_name} {volunteer.last_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {volunteer.email}
                  </span>
                </div>
              </DataTableCell>
              <DataTableCell align="center" colIndex={1}>Data</DataTableCell>
              <DataTableCell align="center" colIndex={2}>Data</DataTableCell>
              <DataTableCell align="center" colIndex={3}>Data</DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
      
      <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded">
        <strong>Dynamic Measurement:</strong> The first column automatically resizes based on content width. 
        CSS variables are updated in real-time as content changes. Watch the debug info to see the measurements.
      </div>
    </div>
  );
};

// Main Integration Demo Component
export const DynamicIntegrationDemo: React.FC = () => {
  const [activeDemo, setActiveDemo] = React.useState<'dynamic' | 'assignments' | 'tshirts' | 'requirements'>('dynamic');

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Dynamic CSS Variables Integration DataTable - Demo</h2>
        <p className="text-muted-foreground">
          Demonstrates the Dynamic CSS Variables solution that measures content and adapts column widths using CSS custom properties.
          The first column automatically sizes to content while preventing the 40% width issue.
        </p>
      </div>

      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setActiveDemo('dynamic')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeDemo === 'dynamic' 
              ? 'border-primary text-primary font-medium' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Dynamic Content
        </button>
        <button
          onClick={() => setActiveDemo('assignments')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeDemo === 'assignments' 
              ? 'border-primary text-primary font-medium' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Assignments (20+ cols)
        </button>
        <button
          onClick={() => setActiveDemo('tshirts')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeDemo === 'tshirts' 
              ? 'border-primary text-primary font-medium' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          T-Shirts (7 cols)
        </button>
        <button
          onClick={() => setActiveDemo('requirements')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeDemo === 'requirements' 
              ? 'border-primary text-primary font-medium' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Requirements (3 cols)
        </button>
      </div>

      <div>
        {activeDemo === 'dynamic' && <DynamicContentDemo />}
        {activeDemo === 'assignments' && <AssignmentsTableDemo />}
        {activeDemo === 'tshirts' && <TShirtsTableDemo />}
        {activeDemo === 'requirements' && <RequirementsTableDemo />}
      </div>

      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h4 className="font-semibold mb-2">Key Benefits of Dynamic CSS Variables Solution:</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li><strong>Content-aware sizing:</strong> Measures actual content to determine optimal column widths</li>
          <li><strong>CSS Variables:</strong> Uses CSS custom properties for performant, hardware-accelerated sizing</li>
          <li><strong>Intelligent constraints:</strong> Prevents first column from exceeding 35% of container width</li>
          <li><strong>Real-time adaptation:</strong> Automatically adjusts when content changes or container resizes</li>
          <li><strong>API compatible:</strong> Drop-in replacement for existing DataTable component</li>
          <li><strong>Debug mode:</strong> Visual feedback shows current measurements and calculations</li>
        </ul>
      </div>
    </div>
  );
};

export default DynamicIntegrationDemo;