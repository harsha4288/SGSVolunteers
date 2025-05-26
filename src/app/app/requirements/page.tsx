// src/app/app/requirements/page.tsx
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, ListChecks } from 'lucide-react';

import { useRequirementsData, RequirementsPageData } from './hooks/use-requirements-data';
import { FiltersBar } from './components/filters-bar';
import { RequirementsGrid } from './components/requirements-grid';
import { RequirementEditModal } from './components/requirement-edit-modal';
import type { RequirementCellData, Requirement } from './types';

// Mock user data for now - this should come from an auth context or session
const MOCK_USER_ROLE = 'admin' as 'admin' | 'coordinator' | 'volunteer';
const MOCK_USER_SEVA_CATEGORY_IDS = MOCK_USER_ROLE === 'coordinator' ? [1, 2] : []; // Example IDs if coordinator

export default function RequirementsPage() {
  const {
    displaySevaCategories,
    allTimeslots,
    allLocations,
    gridData,
    isLoading,
    loadingInitial, // Use this for overall page skeleton if needed
    loadingRequirements, // For modal save operation
    error,
    refreshData,
    updateRequirementsForCell,
    userRole,
    // userSevaCategoryIds, // Already part of the hook's context
    // onFilterChange, // To be implemented if FiltersBar becomes active
  }: RequirementsPageData = useRequirementsData({
    userRole: MOCK_USER_ROLE,
    userSevaCategoryIds: MOCK_USER_SEVA_CATEGORY_IDS
  });

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedCellDataForModal, setSelectedCellDataForModal] = React.useState<RequirementCellData | null>(null);

  const handleCellSelect = (cellData: RequirementCellData) => {
    // Only open modal if the role allows editing (this check can also be inside RequirementCell)
    if (userRole === 'admin' || userRole === 'coordinator') {
      setSelectedCellDataForModal(cellData);
      setIsModalOpen(true);
    } else {
      // Optionally, show a read-only view or a toast message for volunteers
      // toast({ title: "Read-only", description: "Volunteer view is read-only." });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCellDataForModal(null);
  };

  const handleSaveModal = async (
    sevaCategoryId: number,
    timeslotId: number,
    requirementsToUpsert: Array<Omit<Requirement, 'id'|'created_at'|'updated_at'>>
  ) => {
    // The hook's updateRequirementsForCell will show toasts on success/failure.
    // It also re-fetches data, which will update the gridData.
    await updateRequirementsForCell(sevaCategoryId, timeslotId, requirementsToUpsert);
    // No need to manually close modal here if updateRequirementsForCell doesn't throw,
    // Form will close itself via its own onSave prop if it's designed that way OR
    // we can rely on the fact that RequirementEditModal has its own onSave that calls this, then its own onClose.
    // For clarity, let's assume modal closes itself on successful internal save.
    // If not, add: handleCloseModal();
  };

  // Initial loading state for the entire page content
  if (loadingInitial && displaySevaCategories.length === 0 && allTimeslots.length === 0) {
    // Basic skeleton, can be enhanced
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
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-accent flex-shrink-0" />
            <div>
              <CardTitle>Volunteer Requirements Matrix</CardTitle>
              <CardDescription>
                Define volunteer needs per Seva Category (Task) and Timeslot. Click a cell to edit details by location.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <FiltersBar
            userRole={userRole}
            // onFilterChange={onFilterChange} // Pass if filter logic is active in hook
          />

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Data</AlertTitle>
              <AlertDescription>
                {error} <Button variant="link" onClick={refreshData} className="p-0 h-auto">Try again?</Button>
              </AlertDescription>
            </Alert>
          )}

          <RequirementsGrid
            sevaCategories={displaySevaCategories}
            timeslots={allTimeslots}
            gridData={gridData}
            onCellSelect={handleCellSelect}
            userRole={userRole}
            isLoading={isLoading} // Pass overall loading state for grid skeleton
          />
        </CardContent>
      </Card>

      {selectedCellDataForModal && (
        <RequirementEditModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveModal}
          // modalData requires RequirementEditModalData, which is { sevaCategory, timeslot, requirementsForCell }
          // selectedCellDataForModal directly matches this structure from RequirementCellData
          modalData={{
            sevaCategory: selectedCellDataForModal.sevaCategory,
            timeslot: selectedCellDataForModal.timeslot,
            requirementsForCell: selectedCellDataForModal.requirements_for_cell
          }}
          allLocations={allLocations}
          userRole={userRole}
          isLoading={loadingRequirements} // Specific loading state for modal save operations
        />
      )}
    </div>
  );
}
