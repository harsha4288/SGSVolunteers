
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { tagVolunteerActivities, type TagVolunteerActivitiesInput, type TagVolunteerActivitiesOutput } from "@/ai/flows/tag-volunteer-activities";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  seva: z.string().min(10, {
    message: "Seva description must be at least 10 characters.",
  }).max(500, {
    message: "Seva description must not exceed 500 characters."
  }),
  additionalInfo: z.string().max(1000, {
    message: "Additional info must not exceed 1000 characters."
  }).optional(),
});

type TaggingFormValues = z.infer<typeof formSchema>;

export function TaggingForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [generatedTags, setGeneratedTags] = React.useState<string[] | null>(null);

  const form = useForm<TaggingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      seva: "",
      additionalInfo: "",
    },
  });

  async function onSubmit(values: TaggingFormValues) {
    setIsLoading(true);
    setGeneratedTags(null);
    try {
      const input: TagVolunteerActivitiesInput = {
        seva: values.seva,
        additionalInfo: values.additionalInfo || "",
      };
      const result: TagVolunteerActivitiesOutput = await tagVolunteerActivities(input);
      setGeneratedTags(result.tags);
      toast({
        title: "Tags Generated Successfully!",
        description: `Found ${result.tags.length} tags.`,
      });
    } catch (error) {
      console.error("Error tagging activity:", error);
      toast({
        title: "Error Generating Tags",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
          <Sparkles className="h-6 w-6 text-accent" />
          AI Activity Tagger
        </CardTitle>
        <CardDescription>
          Enter details about a volunteer activity to automatically generate relevant tags using AI.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="seva"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seva / Task Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'Managed registration desk and assisted attendees with queries'"
                      className="min-h-[100px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe the main service or task performed by the volunteer.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Information (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'Required knowledge of event schedule and venue layout. Handled cash transactions for merchandise.'"
                      className="min-h-[80px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide any other relevant details about the activity.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4">
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? "Generating Tags..." : "Generate Tags"}
              {!isLoading && <Sparkles className="ml-2 h-4 w-4" />}
            </Button>
            {generatedTags && (
              <div className="w-full pt-4 mt-4 border-t">
                <h3 className="text-lg font-semibold mb-2">Generated Tags:</h3>
                {generatedTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {generatedTags.map((tag, index) => (
                      <Badge key={index} variant="default" className="text-sm px-3 py-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No specific tags could be generated based on the input.</p>
                )}
              </div>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
