// src/app/app/requirements/components/requirement-edit-modal.tsx
"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { Requirement, SevaCategoryRef, Timeslot, Location, RequirementEditModalData } from '../types';
import { useToast } from '@/hooks/use-toast';

interface RequirementEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Takes the full list of requirements for *this specific cell* to be saved
  onSave: (
    sevaCategoryId: number,
    timeslotId: number,
    requirementsToUpsert: Array<Omit<Requirement, 'id' | 'created_at' | 'updated_at'>>
  ) => Promise<void>;
  modalData: RequirementEditModalData | null;
  allLocations: Location[]; // Full list of available locations
  userRole: 'admin' | 'coordinator' | 'volunteer'; // For disabling edits
  isLoading: boolean; // To disable form while parent is saving
}

interface FormInputState {
  total_required_count: string; // Store as string for input field
  notes?: string;
  location_breakdown: Array<{
    location_id: number;
    location_name: string;
    required_count: string;
    notes?: string;
    original_req_id?: number;
  }>;
  use_location_breakdown: boolean; // Toggle for location-specific requirements
}

export function RequirementEditModal({
  isOpen,
  onClose,
  onSave,
  modalData,
  allLocations,
  userRole,
  isLoading,
}: RequirementEditModalProps) {
  const { toast } = useToast();
  const [formInput, setFormInput] = React.useState<FormInputState>({
    total_required_count: '0',
    notes: '',
    location_breakdown: [],
    use_location_breakdown: false
  });
  const [isSavingInternal, setIsSavingInternal] = React.useState(false);

  React.useEffect(() => {
    if (modalData && allLocations.length > 0) {
      // Calculate total from all existing requirements for this cell
      const totalCount = modalData.requirementsForCell.reduce((sum, req) => sum + req.required_count, 0);
      const combinedNotes = modalData.requirementsForCell.map(req => req.notes).filter(Boolean).join('; ');

      // Initialize location breakdown
      const locationBreakdown = allLocations.map(loc => {
        const existingReq = modalData.requirementsForCell.find(r => r.location_id === loc.id);
        return {
          location_id: loc.id,
          location_name: loc.name,
          required_count: existingReq?.required_count.toString() || '0',
          notes: existingReq?.notes || '',
          original_req_id: existingReq?.id,
        };
      });

      // Determine if location breakdown is being used (any location has > 0 requirements)
      const hasLocationBreakdown = modalData.requirementsForCell.length > 1 ||
        (modalData.requirementsForCell.length === 1 && allLocations.length > 1);

      setFormInput({
        total_required_count: totalCount.toString(),
        notes: combinedNotes || '',
        location_breakdown: locationBreakdown,
        use_location_breakdown: hasLocationBreakdown,
      });
    } else {
      setFormInput({
        total_required_count: '0',
        notes: '',
        location_breakdown: [],
        use_location_breakdown: false
      });
    }
  }, [modalData, allLocations, isOpen]); // Re-initialize when modalData changes or modal opens

  if (!modalData) return null;

  const { sevaCategory, timeslot } = modalData;
  const isEditable = (userRole === 'admin' || userRole === 'coordinator') && !isLoading && !isSavingInternal;

  const handleInputChange = (field: 'total_required_count' | 'notes' | 'use_location_breakdown', value: string | boolean) => {
    setFormInput(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationInputChange = (locationId: number, field: 'required_count' | 'notes', value: string) => {
    setFormInput(prev => ({
      ...prev,
      location_breakdown: prev.location_breakdown.map(loc =>
        loc.location_id === locationId ? { ...loc, [field]: value } : loc
      )
    }));
  };

  // Calculate total from location breakdown
  const calculateLocationTotal = () => {
    return formInput.location_breakdown.reduce((sum, loc) => {
      const count = parseInt(loc.required_count, 10);
      return sum + (isNaN(count) ? 0 : count);
    }, 0);
  };

  const handleSubmit = async () => {
    if (!isEditable) return;

    const totalCount = parseInt(formInput.total_required_count, 10);
    if (isNaN(totalCount) || totalCount < 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid non-negative number for total volunteers needed.",
        variant: "destructive"
      });
      return;
    }

    const requirementsToUpsert: Array<Omit<Requirement, 'id' | 'created_at' | 'updated_at'>> = [];

    if (formInput.use_location_breakdown) {
      // Validate location breakdown totals match
      const locationTotal = calculateLocationTotal();
      if (locationTotal !== totalCount) {
        toast({
          title: "Validation Error",
          description: `Location breakdown total (${locationTotal}) must equal total required (${totalCount}).`,
          variant: "destructive"
        });
        return;
      }

      // Use location breakdown
      for (const loc of formInput.location_breakdown) {
        const count = parseInt(loc.required_count, 10);
        if (!isNaN(count) && count > 0) {
          requirementsToUpsert.push({
            seva_category_id: sevaCategory.id,
            timeslot_id: timeslot.id,
            location_id: loc.location_id,
            required_count: count,
            notes: loc.notes || null,
          });
        }
      }
    } else {
      // Use simple total approach - assign to first location
      const defaultLocation = allLocations[0];
      if (!defaultLocation) {
        toast({
          title: "Error",
          description: "No locations available. Please set up locations first.",
          variant: "destructive"
        });
        return;
      }

      if (totalCount > 0) {
        requirementsToUpsert.push({
          seva_category_id: sevaCategory.id,
          timeslot_id: timeslot.id,
          location_id: defaultLocation.id,
          required_count: totalCount,
          notes: formInput.notes || null,
        });
      }
    }

    setIsSavingInternal(true);
    try {
      await onSave(sevaCategory.id, timeslot.id, requirementsToUpsert);
      onClose(); // Close modal on successful save
    } catch (error) {
      // Error toast is likely handled by the calling hook, but can add one here if needed
      console.error("Failed to save requirements from modal:", error);
    } finally {
      setIsSavingInternal(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg md:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Requirements</DialogTitle>
          <DialogDescription className="text-sm">
            Set volunteer requirements for <span className="font-semibold text-primary">{sevaCategory.name}</span> during <span className="font-semibold text-primary">{timeslot.name}</span>.
            <br />
            <span className="text-xs text-muted-foreground mt-1 block">Optionally specify location breakdown if needed for this task.</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Total Required Count */}
          <div className="space-y-1">
            <Label htmlFor="total-count" className="text-sm font-medium mb-0">
              Total Volunteers Needed *
            </Label>
            <Input
              id="total-count"
              type="number"
              min="0"
              value={formInput.total_required_count}
              onChange={(e) => handleInputChange('total_required_count', e.target.value)}
              className="text-lg font-semibold text-center"
              disabled={!isEditable}
              placeholder="0"
            />
          </div>

          {/* Location Breakdown Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="use-location-breakdown"
              checked={formInput.use_location_breakdown}
              onCheckedChange={(checked) => handleInputChange('use_location_breakdown', checked as boolean)}
              disabled={!isEditable}
            />
            <Label htmlFor="use-location-breakdown" className="text-sm font-medium cursor-pointer mb-0">
              Specify location breakdown
            </Label>
          </div>

          {/* Location Breakdown Section */}
          {formInput.use_location_breakdown && (
            <div className="space-y-2 p-4 border rounded-lg bg-muted/20">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium mb-0">Location Requirements</Label>
                <span className="text-xs text-muted-foreground">
                  Total: {calculateLocationTotal()} / {formInput.total_required_count}
                  {calculateLocationTotal() !== parseInt(formInput.total_required_count) &&
                    <span className="text-destructive ml-1">⚠️</span>
                  }
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {formInput.location_breakdown.map((loc) => (
                  <div key={loc.location_id} className="grid grid-cols-12 items-center gap-2 p-2 bg-background rounded border">
                    <Label className="col-span-4 text-xs font-medium truncate mb-0" title={loc.location_name}>
                      {loc.location_name}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={loc.required_count}
                      onChange={(e) => handleLocationInputChange(loc.location_id, 'required_count', e.target.value)}
                      className="col-span-2 h-8 text-sm text-center"
                      disabled={!isEditable}
                      placeholder="0"
                    />
                    <Input
                      value={loc.notes || ''}
                      onChange={(e) => handleLocationInputChange(loc.location_id, 'notes', e.target.value)}
                      className="col-span-6 h-8 text-xs"
                      placeholder="Notes (optional)"
                      disabled={!isEditable}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* General Notes */}
          {!formInput.use_location_breakdown && (
            <div className="space-y-1">
              <Label htmlFor="notes" className="text-sm font-medium mb-0">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                value={formInput.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="resize-none"
                placeholder="Additional requirements or special instructions..."
                disabled={!isEditable}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSavingInternal || isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={!isEditable || isSavingInternal || isLoading}>
            {isSavingInternal || isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
