"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Minus, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RequirementEditModalData, Location, RequirementWithDetails } from "../types";

interface EnhancedRequirementEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (
        seva_category_id: number,
        timeslot_id: number,
        requirementsToUpsert: Array<Omit<RequirementWithDetails, 'id' | 'created_at' | 'updated_at'>>
    ) => Promise<void>;
    modalData: RequirementEditModalData | null;
    allLocations: Location[];
    userRole: 'admin' | 'coordinator' | 'volunteer';
    isLoading: boolean;
}

interface FormInputState {
    total_required_count: string;
    notes: string;
    location_breakdown: Array<{
        location_id: number;
        location_name: string;
        required_count: string;
        assigned_count: number;
        attended_count: number;
        notes: string;
        original_req_id?: number;
    }>;
}

export function EnhancedRequirementEditModal({
    isOpen,
    onClose,
    onSave,
    modalData,
    allLocations,
    userRole,
    isLoading,
}: EnhancedRequirementEditModalProps) {
    const [formInput, setFormInput] = React.useState<FormInputState>({
        total_required_count: '0',
        notes: '',
        location_breakdown: [],
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
                    assigned_count: existingReq?.assigned_count || 0,
                    attended_count: existingReq?.attended_count || 0,
                    notes: existingReq?.notes || '',
                    original_req_id: existingReq?.id,
                };
            });

            setFormInput({
                total_required_count: totalCount.toString(),
                notes: combinedNotes || '',
                location_breakdown: locationBreakdown,
            });
        } else {
            setFormInput({
                total_required_count: '0',
                notes: '',
                location_breakdown: [],
            });
        }
    }, [modalData, allLocations, isOpen]);

    if (!modalData) return null;

    const { sevaCategory, timeslot } = modalData;
    const isEditable = (userRole === 'admin' || userRole === 'coordinator') && !isLoading && !isSavingInternal;

    const handleLocationInputChange = (locationId: number, field: 'required_count' | 'notes', value: string) => {
        setFormInput(prev => ({
            ...prev,
            location_breakdown: prev.location_breakdown.map(loc =>
                loc.location_id === locationId ? { ...loc, [field]: value } : loc
            ),
        }));
    };

    const handleSave = async () => {
        if (!isEditable) return;
        setIsSavingInternal(true);

        try {
            const requirementsToUpsert = formInput.location_breakdown
                .filter(loc => parseInt(loc.required_count) > 0 || loc.original_req_id)
                .map(loc => ({
                    seva_category_id: sevaCategory.id,
                    timeslot_id: timeslot.id,
                    location_id: loc.location_id,
                    required_count: parseInt(loc.required_count) || 0,
                    notes: loc.notes,
                }));

            await onSave(sevaCategory.id, timeslot.id, requirementsToUpsert);
            onClose();
        } catch (error) {
            console.error("Error saving requirements:", error);
        } finally {
            setIsSavingInternal(false);
        }
    };

    const getVarianceColor = (required: number, assigned: number) => {
        const variance = assigned - required;
        if (variance === 0) return "bg-accent/10 text-accent-foreground";
        if (variance > 0) return "bg-success/10 text-success-foreground";
        return "bg-destructive/10 text-destructive-foreground";
    };

    const getVarianceIcon = (required: number, assigned: number) => {
        const variance = assigned - required;
        if (variance === 0) return <CheckCircle2 className="h-3.5 w-3.5" />;
        if (variance > 0) return <Plus className="h-3.5 w-3.5" />;
        return <Minus className="h-3.5 w-3.5" />;
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-lg md:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Edit Requirements</DialogTitle>
                    <DialogDescription className="text-sm">
                        Set volunteer requirements for <span className="font-semibold text-primary">{sevaCategory.name}</span> during <span className="font-semibold text-primary">{timeslot.name}</span>.
                        <br />
                        <span className="text-xs text-muted-foreground mt-1 block">Specify requirements by location.</span>
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh]">
                    <div className="space-y-6 py-4">
                        {/* Location Breakdown */}
                        <div className="space-y-4">
                            {formInput.location_breakdown.map((loc) => {
                                const variance = loc.assigned_count - parseInt(loc.required_count || '0');
                                const attendanceRate = loc.assigned_count ? (loc.attended_count / loc.assigned_count) * 100 : 0;

                                return (
                                    <div key={loc.location_id} className="space-y-2 pb-4 border-b last:border-0">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium">
                                                {loc.location_name}
                                            </Label>
                                            <div className="flex items-center gap-1.5">
                                                <Badge
                                                    variant="secondary"
                                                    className={cn(
                                                        "h-6 flex items-center gap-1",
                                                        getVarianceColor(parseInt(loc.required_count || '0'), loc.assigned_count)
                                                    )}
                                                >
                                                    {getVarianceIcon(parseInt(loc.required_count || '0'), loc.assigned_count)}
                                                    <span className="text-xs">
                                                        {variance > 0 ? "+" : ""}
                                                        {variance}
                                                    </span>
                                                </Badge>

                                                {attendanceRate < 90 && attendanceRate > 0 && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="h-6 bg-warning/10 text-warning-foreground"
                                                    >
                                                        <AlertCircle className="h-3.5 w-3.5 mr-1" />
                                                        <span className="text-xs">
                                                            {Math.round(attendanceRate)}%
                                                        </span>
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor={`required-${loc.location_id}`} className="text-xs">
                                                    Required
                                                </Label>
                                                <Input
                                                    id={`required-${loc.location_id}`}
                                                    type="number"
                                                    min="0"
                                                    value={loc.required_count}
                                                    onChange={(e) => handleLocationInputChange(loc.location_id, 'required_count', e.target.value)}
                                                    className="h-8"
                                                    disabled={!isEditable}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Stats</Label>
                                                <div className="text-sm space-x-2">
                                                    <span>{loc.assigned_count} assigned</span>
                                                    <span>•</span>
                                                    <span>{loc.attended_count} attended</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor={`notes-${loc.location_id}`} className="text-xs">
                                                Notes
                                            </Label>
                                            <Textarea
                                                id={`notes-${loc.location_id}`}
                                                value={loc.notes}
                                                onChange={(e) => handleLocationInputChange(loc.location_id, 'notes', e.target.value)}
                                                className="h-16 resize-none"
                                                disabled={!isEditable}
                                                placeholder="Add any special requirements or notes for this location..."
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSavingInternal}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!isEditable || isSavingInternal}
                    >
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 