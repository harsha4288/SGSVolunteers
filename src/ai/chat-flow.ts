import { configureGenkit } from '@google-genkit';
import { googleAI } from '@google-genkit/googleai';
import { defineFlow, startFlowsServer } from '@google-genkit/flow';
import * as z from 'zod';

// Configure Genkit
configureGenkit({
  plugins: [
    googleAI({
      // API key is usually set via GOOGLE_API_KEY environment variable
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

// Define schemas for intents and entities
const TShirtInventoryIntentSchema = z.object({
  intent: z.literal('T_SHIRT_INVENTORY'),
  size: z.string().optional().describe("T-shirt size (e.g., S, M, L, XL)"),
  quantity: z.number().optional().describe("Specific quantity being asked about"),
});

const VolunteerStatsIntentSchema = z.object({
  intent: z.literal('VOLUNTEER_STATS'),
  sevaCategory: z.string().optional().describe("Seva category (e.g., Registration, Food Service)"),
  isGMFamily: z.boolean().optional().describe("Filter by Gita Mahayajna family status"),
  studentBatch: z.string().optional().describe("Filter by student batch"),
  countOnly: z.boolean().optional().default(true).describe("Whether to only return a count or detailed list"),
});

const CheckInStatsIntentSchema = z.object({
  intent: z.literal('CHECK_IN_STATS'),
  date: z.string().optional().describe("Date for check-in stats (e.g., YYYY-MM-DD, 'today', 'yesterday')"),
  volunteerName: z.string().optional().describe("Name of the volunteer to check status for"),
  countOnly: z.boolean().optional().default(true).describe("Whether to only return a count or detailed list"),
});

const UnrecognizedIntentSchema = z.object({
  intent: z.literal('UNRECOGNIZED'),
  originalQuery: z.string(),
});

const ParsedQuerySchema = z.union([
  TShirtInventoryIntentSchema,
  VolunteerStatsIntentSchema,
  CheckInStatsIntentSchema,
  UnrecognizedIntentSchema,
]);

// Define the Genkit flow
export const chatQueryParserFlow = defineFlow(
  {
    name: 'chatQueryParserFlow',
    inputSchema: z.string().describe("User's natural language question"),
    outputSchema: ParsedQuerySchema,
  },
  async (userQuery) => {
    const llm = googleAI().text(); // Using a text generation model

    const prompt = `
      You are an expert at understanding user questions about volunteer event management.
      Your task is to parse the user's question and identify the intent and any relevant entities.
      The possible intents are: T_SHIRT_INVENTORY, VOLUNTEER_STATS, CHECK_IN_STATS.

      If the question is about T-shirt inventory, identify:
      - size: The T-shirt size (e.g., S, M, L, XL, 2XL, 3XL, XS).
      - quantity: If a specific quantity is mentioned.

      If the question is about volunteer statistics, identify:
      - sevaCategory: The specific seva or team (e.g., Registration, Food Service, Logistics).
      - isGMFamily: If the user is asking specifically about GM family members (true/false).
      - studentBatch: If a specific student batch is mentioned.
      - countOnly: Determine if the user wants a count (e.g., "how many") or a list (e.g., "who are"). Default to true (count) if unsure.

      If the question is about check-in statistics, identify:
      - date: The date of interest (e.g., YYYY-MM-DD, 'today', 'yesterday').
      - volunteerName: If the user is asking about a specific volunteer.
      - countOnly: Determine if the user wants a count or a list. Default to true (count) if unsure.

      If the intent is unclear or doesn't fit any of the above, classify it as UNRECOGNIZED.

      Return the output as a JSON object matching one of the defined schemas.

      Examples:
      User: "How many large T-shirts are left?"
      Output: {"intent": "T_SHIRT_INVENTORY", "size": "L"}

      User: "What's the stock for M size t-shirts?"
      Output: {"intent": "T_SHIRT_INVENTORY", "size": "M"}

      User: "List volunteers in the Registration seva."
      Output: {"intent": "VOLUNTEER_STATS", "sevaCategory": "Registration", "countOnly": false}

      User: "How many volunteers are from the GM family?"
      Output: {"intent": "VOLUNTEER_STATS", "isGMFamily": true, "countOnly": true}

      User: "Who checked in yesterday?"
      Output: {"intent": "CHECK_IN_STATS", "date": "yesterday", "countOnly": false}

      User: "How many volunteers checked in on 2025-07-10?"
      Output: {"intent": "CHECK_IN_STATS", "date": "2025-07-10", "countOnly": true}

      User: "What is the meaning of life?"
      Output: {"intent": "UNRECOGNIZED", "originalQuery": "What is the meaning of life?"}

      User question: "${userQuery}"
      Output:
    `;

    const result = await llm.generate(prompt);
    const jsonOutput = result.text();

    try {
      // Attempt to parse the JSON output
      const parsedJson = JSON.parse(jsonOutput);
      // Validate against the schema (optional but good practice)
      // For simplicity, we'll assume the LLM produces valid JSON according to the prompt for now.
      // More robust error handling and validation can be added here.
      if (parsedJson.intent === "T_SHIRT_INVENTORY" ||
          parsedJson.intent === "VOLUNTEER_STATS" ||
          parsedJson.intent === "CHECK_IN_STATS" ||
          parsedJson.intent === "UNRECOGNIZED"
      ) {
        return parsedJson as z.infer<typeof ParsedQuerySchema>;
      }
      // If intent is not one of the known ones, consider it unrecognized.
      // This can happen if the LLM hallucinates an intent.
      console.warn("LLM output an unknown intent structure:", parsedJson);
      return { intent: 'UNRECOGNIZED', originalQuery: userQuery };

    } catch (e) {
      console.error("Error parsing LLM JSON output:", e, "
Raw output:", jsonOutput);
      return { intent: 'UNRECOGNIZED', originalQuery: userQuery };
    }
  }
);

// Note: To run this flow, you would typically use `startFlowsServer()`
// or call it from another flow/API route.
// For now, this defines the flow. The next step will be to create an API endpoint.
