"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, AlertTriangle, FileCheck } from "lucide-react";
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableColGroup,
  DataTableCol,
  DataTableBadge,
} from "../../../../../../datatable_solutions/iteration_1/implementation/components/ui/data-table";

// Mock data types for requirements
interface RequirementStatus {
  volunteer_id: string;
  requirement_type: string;
  status: 'completed' | 'pending' | 'missing' | 'expired';
  completion_date?: string;
  expiry_date?: string;
  notes?: string;
}

interface Volunteer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface RequirementType {
  id: string;
  name: string;
  required: boolean;
  expiry_months?: number;
}

interface RequirementsTableProps {
  volunteers: Volunteer[];
  requirementTypes: RequirementType[];
  requirementStatuses: RequirementStatus[];
  onUpdateStatus?: (volunteerId: string, requirementType: string, newStatus: RequirementStatus['status']) => void;
}

// Default props for demo purposes
const defaultVolunteers: Volunteer[] = [
  { id: '1', first_name: 'John', last_name: 'Smith', email: 'john.smith@example.com' },
  { id: '2', first_name: 'Maria', last_name: 'Garcia-Rodriguez', email: 'maria.garcia.rodriguez@example.com' },
  { id: '3', first_name: 'Alexander', last_name: 'Constantinopolous', email: 'alex.constantinopolous@example.com' },
  { id: '4', first_name: 'Wei', last_name: 'Zhang', email: 'wei.zhang@example.com' },
  { id: '5', first_name: 'Sarah', last_name: 'Johnson-Williams', email: 'sarah.johnson.williams@example.com' },
];

const defaultRequirementTypes: RequirementType[] = [
  { id: 'background_check', name: 'Background Check', required: true, expiry_months: 24 },
  { id: 'safety_training', name: 'Safety Training', required: true, expiry_months: 12 },
  { id: 'food_handler', name: 'Food Handler Cert', required: false, expiry_months: 24 },
  { id: 'waiver', name: 'Waiver Signed', required: true },
  { id: 'emergency_contact', name: 'Emergency Contact', required: true },
];

const defaultStatuses: RequirementStatus[] = [
  { volunteer_id: '1', requirement_type: 'background_check', status: 'completed', completion_date: '2023-01-15' },
  { volunteer_id: '1', requirement_type: 'safety_training', status: 'completed', completion_date: '2023-06-20' },
  { volunteer_id: '1', requirement_type: 'waiver', status: 'completed', completion_date: '2023-12-01' },
  { volunteer_id: '1', requirement_type: 'emergency_contact', status: 'completed', completion_date: '2023-12-01' },
  
  { volunteer_id: '2', requirement_type: 'background_check', status: 'pending' },
  { volunteer_id: '2', requirement_type: 'waiver', status: 'completed', completion_date: '2023-11-15' },
  { volunteer_id: '2', requirement_type: 'emergency_contact', status: 'completed', completion_date: '2023-11-15' },
  
  { volunteer_id: '3', requirement_type: 'background_check', status: 'completed', completion_date: '2023-03-10' },
  { volunteer_id: '3', requirement_type: 'safety_training', status: 'expired', completion_date: '2022-05-15' },
  { volunteer_id: '3', requirement_type: 'food_handler', status: 'completed', completion_date: '2023-08-20' },
  { volunteer_id: '3', requirement_type: 'waiver', status: 'completed', completion_date: '2023-12-05' },
  
  { volunteer_id: '4', requirement_type: 'background_check', status: 'completed', completion_date: '2023-07-22' },
  { volunteer_id: '4', requirement_type: 'safety_training', status: 'completed', completion_date: '2023-09-10' },
  { volunteer_id: '4', requirement_type: 'waiver', status: 'completed', completion_date: '2023-10-30' },
  { volunteer_id: '4', requirement_type: 'emergency_contact', status: 'missing' },
  
  { volunteer_id: '5', requirement_type: 'waiver', status: 'pending' },
  { volunteer_id: '5', requirement_type: 'emergency_contact', status: 'pending' },
];

export function RequirementsTable({
  volunteers = defaultVolunteers,
  requirementTypes = defaultRequirementTypes,
  requirementStatuses = defaultStatuses,
  onUpdateStatus
}: RequirementsTableProps) {

  // Helper function to get status for a specific volunteer and requirement
  const getRequirementStatus = (volunteerId: string, requirementType: string): RequirementStatus | null => {
    return requirementStatuses.find(
      status => status.volunteer_id === volunteerId && status.requirement_type === requirementType
    ) || null;
  };

  // Render status badge
  const renderStatusBadge = (status: RequirementStatus | null, isRequired: boolean) => {
    if (!status) {
      return isRequired ? (
        <DataTableBadge variant="outline" className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200">
          <X className="h-3 w-3 mr-1" />
          Missing
        </DataTableBadge>
      ) : (
        <DataTableBadge variant="outline" className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 border-gray-200">
          <Clock className="h-3 w-3 mr-1" />
          N/A
        </DataTableBadge>
      );
    }

    switch (status.status) {
      case 'completed':
        return (
          <DataTableBadge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200">
            <Check className="h-3 w-3 mr-1" />
            Complete
          </DataTableBadge>
        );
      case 'pending':
        return (
          <DataTableBadge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </DataTableBadge>
        );
      case 'expired':
        return (
          <DataTableBadge variant="outline" className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Expired
          </DataTableBadge>
        );
      case 'missing':
        return (
          <DataTableBadge variant="outline" className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200">
            <X className="h-3 w-3 mr-1" />
            Missing
          </DataTableBadge>
        );
      default:
        return (
          <DataTableBadge variant="outline" className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 border-gray-200">
            <FileCheck className="h-3 w-3 mr-1" />
            Unknown
          </DataTableBadge>
        );
    }
  };

  return (
    <DataTable
      maxHeight="calc(100vh - 300px)"
      frozenColumns={[0]}
      density="compact"
      useGridLayout={true}
      volunteerColumnGrid={{
        minWidth: '180px',
        maxFraction: '0.25fr'
      }}
    >
      <DataTableColGroup>
        <DataTableCol gridArea="volunteer" />
        {requirementTypes.map((req) => (
          <DataTableCol key={req.id} gridArea={`req-${req.id}`} />
        ))}
      </DataTableColGroup>

      <DataTableHeader>
        <DataTableRow hover={false}>
          <DataTableHead align="left" className="px-3" colIndex={0} vAlign="middle">
            Volunteer
          </DataTableHead>
          {requirementTypes.map((req, index) => (
            <DataTableHead key={req.id} align="center" colIndex={index + 1} vAlign="middle" className="min-w-0">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-medium">{req.name}</span>
                {req.required && (
                  <DataTableBadge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                    Required
                  </DataTableBadge>
                )}
              </div>
            </DataTableHead>
          ))}
        </DataTableRow>
      </DataTableHeader>

      <DataTableBody>
        {volunteers.map((volunteer) => (
          <DataTableRow key={volunteer.id}>
            <DataTableCell
              className="font-medium px-3"
              colIndex={0}
              vAlign="middle"
            >
              <div className="flex flex-col">
                <span className="text-sm">{volunteer.first_name} {volunteer.last_name}</span>
                <span className="text-xs text-muted-foreground">
                  {volunteer.email}
                </span>
              </div>
            </DataTableCell>
            {requirementTypes.map((req, index) => {
              const status = getRequirementStatus(volunteer.id, req.id);
              return (
                <DataTableCell
                  key={req.id}
                  align="center"
                  colIndex={index + 1}
                  vAlign="middle"
                >
                  <div className="flex flex-col items-center gap-1">
                    {renderStatusBadge(status, req.required)}
                    {status?.completion_date && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(status.completion_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </DataTableCell>
              );
            })}
          </DataTableRow>
        ))}
      </DataTableBody>
    </DataTable>
  );
}