"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit } from "lucide-react";

// Define Zod schema for volunteer validation
const volunteerSchema = z.object({
  id: z.string().optional(),
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  gender: z.enum(["Male", "Female"]).optional(),
  gm_family: z.boolean().optional(),
  association_with_mahayajna: z.string().optional(),
  mahayajna_student_name: z.string().optional(),
  student_batch: z.string().optional(),
  hospitality_needed: z.boolean().optional(),
  location: z.string().optional(),
  other_location: z.string().optional(),
  additional_info: z.string().optional(),
  requested_tshirt_quantity: z.coerce.number().min(0).max(10).optional(),
  tshirt_size_preference: z.enum(["XS", "S", "M", "L", "XL", "XXL"]).optional(),
});

type VolunteerFormData = z.infer<typeof volunteerSchema>;

interface VolunteerFormProps {
  mode: 'create' | 'edit';
  trigger?: React.ReactNode;
  initialData?: Partial<VolunteerFormData> | null;
  onSuccess?: () => void;
  currentEventId: number | null;
}

export function VolunteerForm({ mode, trigger, initialData, onSuccess, currentEventId }: VolunteerFormProps) {
  const [formOpen, setFormOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const supabase = createClient();

  const form = useForm<VolunteerFormData>({
    resolver: zodResolver(volunteerSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      first_name: initialData?.first_name || "",
      last_name: initialData?.last_name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      gender: initialData?.gender || undefined,
      gm_family: initialData?.gm_family || false,
      association_with_mahayajna: initialData?.association_with_mahayajna || "",
      mahayajna_student_name: initialData?.mahayajna_student_name || "",
      student_batch: initialData?.student_batch || "",
      hospitality_needed: initialData?.hospitality_needed || false,
      location: initialData?.location || "",
      other_location: initialData?.other_location || "",
      additional_info: initialData?.additional_info || "",
      requested_tshirt_quantity: initialData?.requested_tshirt_quantity || 1,
      tshirt_size_preference: initialData?.tshirt_size_preference || undefined,
    },
  });

  const onSubmit: SubmitHandler<VolunteerFormData> = async (data) => {
    setLoading(true);
    try {
      if (mode === 'create') {
        // Smart duplicate prevention: check for existing volunteer with same name AND (email OR phone)
        const { data: existingVolunteers, error: volunteerLookupError } = await supabase
          .from('volunteers')
          .select('id, profile_id, email, first_name, last_name, phone')
          .eq('first_name', data.first_name)
          .eq('last_name', data.last_name);

        if (volunteerLookupError) {
          console.error('Volunteer lookup error:', volunteerLookupError);
          throw new Error('Failed to check existing volunteers');
        }

        // Check if any existing volunteer has matching email or phone
        const duplicateVolunteer = existingVolunteers?.find(volunteer => 
          volunteer.email === data.email || 
          (data.phone && volunteer.phone === data.phone)
        );

        if (duplicateVolunteer) {
          // Duplicate volunteer found - same person already exists
          const matchType = duplicateVolunteer.email === data.email ? 'email' : 'phone';
          throw new Error(`Volunteer ${data.first_name} ${data.last_name} with this ${matchType} already exists`);
        }

        // Check if a profile with this email already exists
        const { data: existingProfile, error: profileLookupError } = await supabase
          .from('profiles')
          .select('id, email, display_name')
          .eq('email', data.email)
          .maybeSingle();

        if (profileLookupError && profileLookupError.code !== 'PGRST116') {
          console.error('Profile lookup error:', profileLookupError);
          throw new Error('Failed to check existing profile');
        }

        let profileId: string;

        if (existingProfile) {
          // Use existing profile (family members can share email)
          profileId = existingProfile.id;
          console.log('Using existing profile for email:', data.email);
        } else {
          // Create new profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert({
              email: data.email,
              display_name: `${data.first_name} ${data.last_name}`
            })
            .select()
            .single();

          if (profileError) {
            console.error('Profile creation error:', profileError);
            throw new Error('Failed to create profile');
          }

          profileId = profileData.id;
        }

        // Create the volunteer record
        const { error: volunteerError } = await supabase
          .from('volunteers')
          .insert({
            ...data,
            profile_id: profileId,
          });

        if (volunteerError) {
          console.error('Volunteer creation error:', volunteerError);
          throw new Error('Failed to create volunteer');
        }

        toast({
          title: "Success",
          description: "Volunteer added successfully",
        });
      } else {
        // For edit mode, update the existing volunteer
        console.log('Updating volunteer with data:', data);
        const { id, ...updateData } = data;
        
        if (!id) {
          throw new Error('No volunteer ID provided for update');
        }

        // Check for duplicate volunteer (excluding current volunteer being updated)
        const { data: duplicateChecks, error: duplicateError } = await supabase
          .from('volunteers')
          .select('id, email, phone')
          .eq('first_name', data.first_name)
          .eq('last_name', data.last_name)
          .neq('id', id);

        if (duplicateError) {
          console.error('Duplicate check error:', duplicateError);
          throw new Error('Failed to check for duplicates');
        }

        // Check if any existing volunteer has matching email or phone
        const duplicateVolunteer = duplicateChecks?.find(volunteer => 
          volunteer.email === data.email || 
          (data.phone && volunteer.phone === data.phone)
        );

        if (duplicateVolunteer) {
          const matchType = duplicateVolunteer.email === data.email ? 'email' : 'phone';
          throw new Error(`A volunteer with the name "${data.first_name} ${data.last_name}" and this ${matchType} already exists`);
        }

        const { data: updateResult, error: volunteerError } = await supabase
          .from('volunteers')
          .update(updateData)
          .eq('id', id)
          .select();

        if (volunteerError) {
          console.error('Volunteer update error:', volunteerError);
          throw new Error(`Failed to update volunteer: ${volunteerError.message || 'Unknown error'}`);
        }

        if (!updateResult || updateResult.length === 0) {
          throw new Error('No volunteer found with the provided ID');
        }

        console.log('Volunteer updated successfully:', updateResult);

        toast({
          title: "Success",
          description: "Volunteer updated successfully",
        });
      }

      form.reset();
      setFormOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save volunteer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={formOpen} onOpenChange={setFormOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            {mode === 'create' ? (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Volunteer
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Volunteer' : 'Edit Volunteer'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a new volunteer profile with basic information and preferences.'
              : 'Update volunteer information and preferences.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* T-shirt Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">T-shirt Preferences</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="requested_tshirt_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requested Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="10" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tshirt_size_preference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size Preference</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="XS">XS</SelectItem>
                          <SelectItem value="S">S</SelectItem>
                          <SelectItem value="M">M</SelectItem>
                          <SelectItem value="L">L</SelectItem>
                          <SelectItem value="XL">XL</SelectItem>
                          <SelectItem value="XXL">XXL</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Additional Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="association_with_mahayajna"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Association with Mahayajna</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter association" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gm_family"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">GM Family</FormLabel>
                        <FormDescription>
                          Is this volunteer part of the GM family?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="hospitality_needed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Hospitality Needed</FormLabel>
                        <FormDescription>
                          Does this volunteer need hospitality?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="additional_info"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Information</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter any additional notes or information" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'create' ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  mode === 'create' ? 'Create Volunteer' : 'Update Volunteer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}