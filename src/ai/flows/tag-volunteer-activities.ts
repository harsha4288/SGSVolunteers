'use server';
/**
 * @fileOverview AI flow to automatically tag volunteer activities based on the 'Seva' and 'AdditionalInfo' fields.
 *
 * - tagVolunteerActivities - A function that handles the tagging of volunteer activities.
 * - TagVolunteerActivitiesInput - The input type for the tagVolunteerActivities function.
 * - TagVolunteerActivitiesOutput - The return type for the tagVolunteerActivities function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TagVolunteerActivitiesInputSchema = z.object({
  seva: z.string().describe('The type of service/task performed by the volunteer.'),
  additionalInfo: z.string().describe('Additional information about the volunteer activity.'),
});
export type TagVolunteerActivitiesInput = z.infer<typeof TagVolunteerActivitiesInputSchema>;

const TagVolunteerActivitiesOutputSchema = z.object({
  tags: z.array(z.string()).describe('An array of tags that categorize the volunteer activity.'),
});
export type TagVolunteerActivitiesOutput = z.infer<typeof TagVolunteerActivitiesOutputSchema>;

export async function tagVolunteerActivities(input: TagVolunteerActivitiesInput): Promise<TagVolunteerActivitiesOutput> {
  return tagVolunteerActivitiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tagVolunteerActivitiesPrompt',
  input: {schema: TagVolunteerActivitiesInputSchema},
  output: {schema: TagVolunteerActivitiesOutputSchema},
  prompt: `You are an expert in categorizing volunteer activities.

  Based on the seva (type of service/task) and additional information provided, generate a list of tags that accurately describe the activity.
  The tags should be concise and relevant to the activity.

  Seva: {{{seva}}}
  Additional Information: {{{additionalInfo}}}

  Return ONLY a JSON array of strings.
  `,
});

const tagVolunteerActivitiesFlow = ai.defineFlow(
  {
    name: 'tagVolunteerActivitiesFlow',
    inputSchema: TagVolunteerActivitiesInputSchema,
    outputSchema: TagVolunteerActivitiesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
