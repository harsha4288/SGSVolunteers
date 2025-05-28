// src/app/app/requirements/page.tsx
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, ListChecks, ChevronDown, ChevronUp } from 'lucide-react';

import { useUnifiedRequirements } from './hooks/use-unified-requirements';
import { FiltersBar } from './components/filters-bar';
import { EnhancedRequirementsGrid } from './components/enhanced-requirements-grid';
import { EnhancedRequirementEditModal } from './components/enhanced-requirement-edit-modal';
import type { RequirementCellData } from './types';

// Mock user data for now - this should come from an auth context or session
const MOCK_USER_ROLE = 'admin' as 'admin' | 'coordinator' | 'volunteer';

export default function RequirementsPage() {
  const [isFilterExpanded, setIsFilterExpanded] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedCellDataForModal, setSelectedCellDataForModal] = React.useState<RequirementCellData | null>(null);

  const {
    displaySevaCategories,
    allTimeslots,
    allLocations,
    gridData,
    loading,
    loadingInitial,
    loadingRequirements,
    error,
    refreshData,
    updateRequirement,
    updateFilters,
  } = useUnifiedRequirements({
    userRole: MOCK_USER_ROLE,
  });

  const handleCellSelect = (cellData: RequirementCellData) => {
    if (MOCK_USER_ROLE === 'admin' || MOCK_USER_ROLE === 'coordinator') {
      setSelectedCellDataForModal(cellData);
      setIsModalOpen(true);
    }
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
    // The hook's updateRequirement will show toasts on success/failure
    for (const req of requirementsToUpsert) {
      await updateRequirement(
        req.seva_category_id,
        req.timeslot_id,
        req.location_id,
        req.required_count,
        req.notes
      );
    }
  };

  // Initial loading state for the entire page content
  if (loadingInitial && displaySevaCategories.length === 0 && allTimeslots.length === 0) {
    return (
      <div className="container mx-auto py-3 px-2 space-y-3">
        <Card><CardHeader><CardTitle>Loading Requirements...</CardTitle></CardHeader></Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-3 px-2 space-y-4">
      <Card className="mb-4">
        <CardHeader>
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
        <CardContent>
          {isFilterExpanded && (
            <div className="mb-4">
              <FiltersBar
                userRole={MOCK_USER_ROLE}
                onFilterChange={updateFilters}
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
            userRole={MOCK_USER_ROLE}
            isLoading={loading}
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
