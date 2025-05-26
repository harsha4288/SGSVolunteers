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
import { Textarea } from "@/components/ui/textarea"; // For potential 'notes' field per requirement
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Requirement, SevaCategoryRef, Timeslot, Location, RequirementEditModalData } from '../types';
import { useToast } from '@/hooks/use-toast';

interface RequirementEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Takes the full list of requirements for *this specific cell* to be saved
  onSave: (
    sevaCategoryId: number, 
    timeslotId: number, 
    requirementsToUpsert: Array<Omit<Requirement, 'id'|'created_at'|'updated_at'>>
  ) => Promise<void>;
  modalData: RequirementEditModalData | null;
  allLocations: Location[]; // Full list of available locations
  userRole: 'admin' | 'coordinator' | 'volunteer'; // For disabling edits
  isLoading: boolean; // To disable form while parent is saving
}

interface FormInputState {
  location_id: number;
  location_name: string;
  required_count: string; // Store as string for input field
  notes?: string;
  original_req_id?: number; // To track existing requirements for updates
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
  const [formInputs, setFormInputs] = React.useState<FormInputState[]>([]);
  const [isSavingInternal, setIsSavingInternal] = React.useState(false);

  React.useEffect(() => {
    if (modalData && allLocations.length > 0) {
      const initialFormState: FormInputState[] = allLocations.map(loc => {
        const existingReq = modalData.requirementsForCell.find(r => r.location_id === loc.id);
        return {
          location_id: loc.id,
          location_name: loc.name,
          required_count: existingReq?.required_count.toString() || '0',
          notes: existingReq?.notes || '',
          original_req_id: existingReq?.id,
        };
      });
      setFormInputs(initialFormState);
    } else {
      setFormInputs([]); // Reset if no data or locations
    }
  }, [modalData, allLocations, isOpen]); // Re-initialize when modalData changes or modal opens

  if (!modalData) return null;

  const { sevaCategory, timeslot } = modalData;
  const isEditable = (userRole === 'admin' || userRole === 'coordinator') && !isLoading && !isSavingInternal;

  const handleInputChange = (locationId: number, field: 'required_count' | 'notes', value: string) => {
    setFormInputs(prevInputs =>
      prevInputs.map(input =>
        input.location_id === locationId ? { ...input, [field]: value } : input
      )
    );
  };

  const handleSubmit = async () => {
    if (!isEditable) return;

    const requirementsToUpsert: Array<Omit<Requirement, 'id'|'created_at'|'updated_at'>> = [];
    let hasInvalidInput = false;

    for (const input of formInputs) {
      const count = parseInt(input.required_count, 10);
      if (isNaN(count) || count < 0) {
        // Allow 0, but not negative or NaN
        if (input.required_count !== '' && input.required_count !== '0' ) { // Allow empty string to mean 0 if desired, or enforce number
             toast({ title: "Validation Error", description: `Invalid count for ${input.location_name}. Please enter a valid non-negative number.`, variant: "destructive"});
             hasInvalidInput = true;
             break;
        }
      }
      // Only include if count > 0, or if it's an existing requirement being zeroed out.
      // The service's upsertRequirementsForCell handles deletion of records not in the list,
      // or records with count 0 if that's the desired behavior.
      // For simplicity here, we'll send all, and the service can filter or upsert 0s.
      requirementsToUpsert.push({
        seva_category_id: sevaCategory.id,
        timeslot_id: timeslot.id,
        location_id: input.location_id,
        required_count: isNaN(count) || count < 0 ? 0 : count, // Default NaN/negative to 0
        notes: input.notes || null, // Ensure notes is null if empty string
      });
    }

    if (hasInvalidInput) return;

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
            Set volunteer counts for <span className="font-semibold text-primary">{sevaCategory.name}</span> during <span className="font-semibold text-primary">{timeslot.name}</span>.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-6"> {/* Added pr-6 for scrollbar visibility */}
          <div className="space-y-4 py-4">
            {formInputs.map((input, index) => (
              <div key={input.location_id} className="grid grid-cols-12 items-center gap-2 pb-2 border-b last:border-b-0">
                <Label htmlFor={`count-${input.location_id}`} className="col-span-5 text-xs sm:text-sm truncate" title={input.location_name}>
                  {input.location_name}
                </Label>
                <Input
                  id={`count-${input.location_id}`}
                  type="number"
                  min="0"
                  value={input.required_count}
                  onChange={(e) => handleInputChange(input.location_id, 'required_count', e.target.value)}
                  className="col-span-3 h-9 text-sm"
                  disabled={!isEditable}
                  placeholder="0"
                />
                <Textarea
                  id={`notes-${input.location_id}`}
                  value={input.notes || ''}
                  onChange={(e) => handleInputChange(input.location_id, 'notes', e.target.value)}
                  className="col-span-4 h-9 text-xs resize-none" // Using h-9 to match input, allow resize if needed
                  placeholder="Notes (opt.)"
                  disabled={!isEditable}
                  rows={1}
                />
              </div>
            ))}
            {formInputs.length === 0 && <p className="text-muted-foreground text-center">No locations available.</p>}
          </div>
        </ScrollArea>

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
