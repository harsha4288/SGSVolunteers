// src/app/app/requirements/page.tsx
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, ListChecks, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { useRequirementsData } from './hooks/use-requirements-data';
import { FiltersBar } from './components/filters-bar';
import { EnhancedRequirementsGrid } from './components/enhanced-requirements-grid';
import { EnhancedRequirementEditModal } from './components/enhanced-requirement-edit-modal';
import type { RequirementCellData } from './types';

// Mock user data for now - this should come from an auth context or session
const MOCK_USER_ROLE = 'admin' as 'admin' | 'coordinator' | 'volunteer';
const MOCK_USER_SEVA_CATEGORY_IDS: number[] = []; // For admin, this is not used by useRequirementsData filtering

export default function RequirementsPage() {
  const { toast } = useToast();
  const [isFilterExpanded, setIsFilterExpanded] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedCellDataForModal, setSelectedCellDataForModal] = React.useState<RequirementCellData | null>(null);

  const {
    displaySevaCategories,
    allTimeslots,
    allLocations,
    gridData,
    loadingInitial,
    loadingRequirements,
    error,
    refreshData,
    updateRequirementsForCell,
    userRole,
  } = useRequirementsData({
    userRole: MOCK_USER_ROLE,
    userSevaCategoryIds: MOCK_USER_SEVA_CATEGORY_IDS,
  });

  // Temporarily disabled modal to focus on inline editing
  const handleCellSelect = (cellData: RequirementCellData) => {
    // Inline editing is now handled directly in the cell component
    // Modal opening is temporarily disabled
    console.log('Cell selected for inline editing:', cellData);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCellDataForModal(null);
  };

  const handleSaveModal = async (
    seva_category_id: number,
    timeslot_id: number,
    requirementsToUpsert: Array<any>
  ) => {
    const cellSpecificRequirements = requirementsToUpsert.map(req => ({
      seva_category_id,
      timeslot_id,
      location_id: req.location_id,
      required_count: req.required_count,
      notes: req.notes,
    }));

    try {
      await updateRequirementsForCell(seva_category_id, timeslot_id, cellSpecificRequirements);
      handleCloseModal();
    } catch (saveError) {
      console.error("Failed to save modal data:", saveError);
    }
  };

  const handleRequirementUpdate = async (cellData: RequirementCellData, newRequiredCount: number) => {
    const { sevaCategory, timeslot, requirements_for_cell } = cellData;

    // Calculate the current total required count
    const currentTotal = requirements_for_cell.reduce((sum, req) => sum + req.required_count, 0);
    
    // Skip update if the total hasn't changed
    if (currentTotal === newRequiredCount) {
      console.log('Requirement count unchanged, skipping update');
      return;
    }

    // Calculate the ratio between current and new total required count
    const ratio = currentTotal > 0 ? newRequiredCount / currentTotal : 0;

    // Update each requirement proportionally
    const updatedRequirements = requirements_for_cell.map((req) => {
      let newCount = Math.round(req.required_count * ratio);
      
      // Ensure we distribute any remainder to meet the exact total
      return {
        id: req.id,
        required_count: newCount,
        location_id: req.location_id
      };
    });

    // Ensure the sum of updated requirements equals the new total
    const updatedTotal = updatedRequirements.reduce((sum, req) => sum + req.required_count, 0);
    if (updatedTotal !== newRequiredCount && updatedRequirements.length > 0) {
      // Add any difference to the first requirement to ensure exact total
      updatedRequirements[0].required_count += (newRequiredCount - updatedTotal);
    }

    try {
      await updateRequirementsForCell(sevaCategory.id, timeslot.id, updatedRequirements);
      toast({
        title: "Success",
        description: "Requirements updated successfully."
      });
    } catch (error) {
      console.error('Failed to update requirements:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update requirements. Please try again."
      });
    }
  };

  // Initial loading state for the entire page content
  if (loadingInitial && displaySevaCategories.length === 0 && allTimeslots.length === 0) {
    return (
      <div className="container mx-auto py-3 px-1 space-y-3">
        <Card><CardHeader><CardTitle>Loading Requirements...</CardTitle></CardHeader></Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-3 px-1 space-y-4">
      <Card className="mb-4">
        <CardHeader className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-accent flex-shrink-0" />
              <div>
                <CardTitle>Volunteer Requirements Matrix</CardTitle>
                <CardDescription>
                  Define volunteer needs per Seva Category (Task) and Timeslot. Click a cell to edit details by location.
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className="flex items-center gap-2"
            >
              {isFilterExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          {isFilterExpanded && (
            <div className="mb-4">
              <FiltersBar
                userRole={MOCK_USER_ROLE}
                onFilterChange={() => { /* Placeholder for filter logic */ }}
              />
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Data</AlertTitle>
              <AlertDescription>
                {error} <Button variant="link" onClick={refreshData} className="p-0 h-auto">Try again?</Button>
              </AlertDescription>
            </Alert>
          )}

          <EnhancedRequirementsGrid
            sevaCategories={displaySevaCategories}
            timeslots={allTimeslots}
            gridData={gridData}
            onCellSelect={handleCellSelect}
            onRequirementUpdate={handleRequirementUpdate}
            userRole={MOCK_USER_ROLE}
            isLoading={loadingInitial || loadingRequirements}
          />
        </CardContent>
      </Card>

      {selectedCellDataForModal && (
        <EnhancedRequirementEditModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveModal}
          modalData={{
            sevaCategory: selectedCellDataForModal.sevaCategory,
            timeslot: selectedCellDataForModal.timeslot,
            requirementsForCell: selectedCellDataForModal.requirements_for_cell
          }}
          allLocations={allLocations}
          userRole={MOCK_USER_ROLE}
          isLoading={loadingRequirements}
        />
      )}
    </div>
  );
}
