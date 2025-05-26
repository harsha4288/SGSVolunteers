// src/app/app/admin/alerts-faqs/components/alert-faq-form.tsx
"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"; // Added Switch import
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Alert, FAQ, Timeslot, AlertFAQFormValues } from "../types";

// Define Zod schemas for validation
const commonSchema = {
  category: z.string().optional().nullable(),
  timeslot_id_filter: z.coerce.number().optional().nullable(), // coerce to number from string select
  active: z.boolean().optional(), // Added active to common schema
};
const alertSchema = z.object({
  ...commonSchema,
  id: z.number().optional(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(), 
  end_date: z.string().optional().nullable(),
  // active is in commonSchema
});
const faqSchema = z.object({
  ...commonSchema,
  id: z.number().optional(),
  question: z.string().min(5, "Question must be at least 5 characters"),
  answer: z.string().min(10, "Answer must be at least 10 characters"),
  sort_order: z.coerce.number().optional(), // Added sort_order
  // active is in commonSchema
});

interface AlertFaqFormProps {
  mode: 'alert' | 'faq';
  formOpen: boolean;
  setFormOpen: (open: boolean) => void;
  initialData?: Partial<Alert> | Partial<FAQ> | null;
  onSubmit: (data: any) => Promise<void>; 
  timeslots: Timeslot[];
}

export function AlertFaqForm({ mode, formOpen, setFormOpen, initialData, onSubmit, timeslots }: AlertFaqFormProps) {
  const isAlertMode = mode === 'alert';
  const currentSchema = isAlertMode ? alertSchema : faqSchema;
  type CurrentFormValues = z.infer<typeof currentSchema>;

  const form = useForm<CurrentFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: initialData || {},
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (formOpen) {
      const defaults = {
        ...initialData,
        timeslot_id_filter: initialData?.timeslot_id_filter ?? undefined,
        category: initialData?.category ?? "",
        content: (initialData as Alert)?.content ?? "", // Alert specific
        answer: (initialData as FAQ)?.answer ?? "",     // FAQ specific
        start_date: (initialData as Alert)?.start_date ?? "", // Alert specific
        end_date: (initialData as Alert)?.end_date ?? "",     // Alert specific
        active: initialData?.active ?? true, // Default to true for new items
        sort_order: (initialData as FAQ)?.sort_order ?? 0, // FAQ specific, default to 0
      };
      form.reset(defaults);
    }
  }, [formOpen, initialData, form]);

  const handleSubmit: SubmitHandler<CurrentFormValues> = async (values) => {
    setIsSubmitting(true);
    try {
      const dataToSubmit = {
        ...values,
        // Convert "0" or empty string from select to null for timeslot_id_filter
        timeslot_id_filter: values.timeslot_id_filter && Number(values.timeslot_id_filter) !== 0 ? Number(values.timeslot_id_filter) : null,
        // Ensure optional text fields that are empty strings are submitted as null if schema expects null
        category: values.category || null,
        content: isAlertMode ? (values as Alert).content || null : undefined,
        start_date: isAlertMode ? (values as Alert).start_date || null : undefined,
        end_date: isAlertMode ? (values as Alert).end_date || null : undefined,
      };
      if (!isAlertMode) { // Remove alert-specific fields if in FAQ mode
        delete (dataToSubmit as any).start_date;
        delete (dataToSubmit as any).end_date;
        delete (dataToSubmit as any).content;
        delete (dataToSubmit as any).start_date; // Also ensure these are not on FAQ object if commonSchema puts them there
        delete (dataToSubmit as any).end_date;
      } else { // Alert mode
        delete (dataToSubmit as any).sort_order; // Ensure sort_order is not on Alert object
      }

      await onSubmit(dataToSubmit);
      setFormOpen(false);
    } catch (error) {
      // Error toast is expected to be handled by the calling hook/component
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const title = `${initialData?.id ? 'Edit' : 'Create'} ${isAlertMode ? 'Alert' : 'FAQ'}`;

  return (
    <Dialog open={formOpen} onOpenChange={setFormOpen}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isAlertMode ? "Manage an alert for volunteers." : "Manage a frequently asked question."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name={isAlertMode ? "title" : "question"}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isAlertMode ? "Title" : "Question"}</FormLabel>
                  <FormControl>
                    <Input placeholder={isAlertMode ? "Alert title..." : "Enter the question..."} {...field} value={field.value || ''}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={isAlertMode ? "content" : "answer"}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isAlertMode ? "Content (Optional for Alerts)" : "Answer"}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={isAlertMode ? "Alert details..." : "Provide the answer..."} {...field} value={field.value || ''} className="min-h-[100px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Parking, Check-in" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timeslot_id_filter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timeslot Filter (Optional)</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value?.toString() ?? "0"}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Show for all timeslots" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Show for all timeslots (No filter)</SelectItem>
                      {timeslots.map(ts => (
                        <SelectItem key={ts.id} value={ts.id.toString()}>{ts.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>If selected, this item will only be prominent for the chosen timeslot.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active Switch */}
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      {isAlertMode ? "Inactive alerts will not be shown to users." : "Inactive FAQs will not be shown to users."}
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

            {isAlertMode && (
              <>
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date (Optional)</FormLabel>
                      <FormControl><Input type="datetime-local" {...field} value={field.value || ''} /></FormControl>
                      <FormDescription>Alert will only show after this date/time.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <FormControl><Input type="datetime-local" {...field} value={field.value || ''} /></FormControl>
                      <FormDescription>Alert will hide after this date/time.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {!isAlertMode && ( // Sort Order for FAQs only
                <FormField
                control={form.control}
                name="sort_order"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Sort Order (Optional)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="0" {...field} onChange={event => field.onChange(+event.target.value)} value={field.value ?? 0} />
                    </FormControl>
                    <FormDescription>FAQs with lower numbers appear first.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            )}

            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
