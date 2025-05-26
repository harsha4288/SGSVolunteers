import { NextRequest, NextResponse } from 'next/server';
import { chatQueryParserFlow } from '@/ai/chat-flow'; // Adjust path if necessary
import { createSupabaseServerClient } from '@/lib/supabase/server'; // Server-side Supabase client
import { Pool }
  from 'pg';

// Basic connection pool setup (consider moving to a separate db utility file if complex)
// Ensure environment variables for Supabase are configured (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
// This direct pool is an alternative if more complex queries or direct DB access is needed
// For many Supabase operations, the client library is sufficient.
// const pool = new Pool({
//   connectionString: process.env.SUPABASE_DB_CONNECTION_STRING, // Custom connection string if needed
// });


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userQuery = body.message;

    if (!userQuery || typeof userQuery !== 'string') {
      return NextResponse.json({ error: 'Invalid message format' }, { status: 400 });
    }

    // 1. Parse the user query using the Genkit flow
    const parsedResult = await chatQueryParserFlow(userQuery);

    // Initialize Supabase client
    const supabase = createSupabaseServerClient();
    let data: any = null;
    let errorMessage: string | null = null;

    // 2. Execute database query based on parsed intent
    switch (parsedResult.intent) {
      case 'T_SHIRT_INVENTORY':
        // Ensure size is a string and uppercase it for consistency if it exists
        const size = typeof parsedResult.size === 'string' ? parsedResult.size.toUpperCase() : undefined;
        if (size) {
          const { data: inventoryData, error } = await supabase
            .from('tshirt_inventory')
            .select('size_cd, quantity_on_hand')
            .eq('size_cd', size)
            .eq('event_id', 1); // Assuming event_id 1 for now, make dynamic if needed
          if (error) throw error;
          if (inventoryData && inventoryData.length > 0) {
            data = `We have ${inventoryData[0].quantity_on_hand} of ${inventoryData[0].size_cd} T-shirts remaining.`;
          } else {
            data = `Sorry, I couldn't find inventory information for size ${size}.`;
          }
        } else {
           const { data: inventoryData, error } = await supabase
            .from('tshirt_inventory')
            .select('size_cd, quantity_on_hand')
            .eq('event_id', 1) // Assuming event_id 1
            .order('sort_order');
          if (error) throw error;
          if (inventoryData && inventoryData.length > 0) {
            const inventoryList = inventoryData.map(item => `${item.size_cd}: ${item.quantity_on_hand}`).join('\n');
            data = `Here's the current T-shirt inventory:\n${inventoryList}`;
          } else {
            data = 'Sorry, I could not retrieve the T-shirt inventory at the moment.';
          }
        }
        break;

      case 'VOLUNTEER_STATS':
        let query = supabase.from('volunteers').select('*', { count: 'exact' });
        if (parsedResult.sevaCategory) {
          // This requires a join. Assuming 'volunteer_commitments' and 'seva_categories' tables
          // For simplicity, let's assume a direct column 'seva_category_name' on volunteers for now
          // or that a view handles this. A more complex query would be needed here.
          // This is a placeholder for a potentially complex join.
          // query = query.eq('seva_category_name', parsedResult.sevaCategory);

          // To make this work with the current schema, we need to query volunteer_commitments
          // and then potentially join back to volunteers or count distinct volunteer_ids.
          // This example will count commitments for a seva category.
          const { data: sevaCatData, error: sevaCatError } = await supabase
            .from('seva_categories')
            .select('id')
            .eq('category_name', parsedResult.sevaCategory)
            .single();

          if (sevaCatError || !sevaCatData) {
            data = `Could not find seva category: ${parsedResult.sevaCategory}`;
            break;
          }

          const commitmentsQuery = supabase
            .from('volunteer_commitments')
            .select('volunteer_id', { count: 'exact', head: parsedResult.countOnly });

          commitmentsQuery.eq('seva_category_id', sevaCatData.id);

          if (!parsedResult.countOnly) {
            // If we need details, this becomes more complex, requiring a join with volunteers table
            // For now, let's return count or a message indicating details require more setup.
            const { data: commitData, error: commitErr, count } = await commitmentsQuery;
             if (commitErr) throw commitErr;
            data = `There are ${count} commitments for ${parsedResult.sevaCategory}. Fetching detailed list is not fully supported yet by the chatbot.`;
          } else {
             const { count, error: commitErr } = await commitmentsQuery;
             if (commitErr) throw commitErr;
             data = `There are ${count} volunteers assigned to ${parsedResult.sevaCategory}.`;
          }

        } else { // General volunteer stats without specific seva
          if (parsedResult.isGMFamily !== undefined) {
            query = query.eq('gm_family', parsedResult.isGMFamily);
          }
          if (parsedResult.studentBatch) {
            query = query.eq('student_batch', parsedResult.studentBatch);
          }

          if (parsedResult.countOnly) {
            const { count, error } = await query;
            if (error) throw error;
            data = `There are ${count} volunteers matching your criteria.`;
          } else {
            const { data: volunteerData, error } = await query.limit(10); // Limit results for lists
            if (error) throw error;
            if (volunteerData && volunteerData.length > 0) {
              const names = volunteerData.map(v => `${v.first_name} ${v.last_name}`).join(', ');
              data = `Some volunteers matching: ${names}. (List limited to 10)`;
            } else {
              data = "No volunteers found matching your criteria.";
            }
          }
        }
        break;

      case 'CHECK_IN_STATS':
        // This also requires careful handling of dates (e.g., 'today', 'yesterday')
        // For simplicity, we'll assume a YYYY-MM-DD format or pass it through.
        // A robust solution would convert 'today', 'yesterday' to actual dates.
        let checkInQuery = supabase.from('volunteer_check_ins').select('*', { count: 'exact' });
        if (parsedResult.date) {
          // This is a simplified date handling. Needs improvement for 'today', 'yesterday'.
          // E.g., if date is 'today', convert to YYYY-MM-DD.
          // For now, assumes date is directly queryable if provided.
          // checkInQuery = checkInQuery.gte('check_in_time', `${parsedResult.date}T00:00:00Z`)
          //                        .lte('check_in_time', `${parsedResult.date}T23:59:59Z`);
           data = "Querying check-ins by specific date is not fully implemented yet. Try asking for general check-in counts.";
        } else if (parsedResult.volunteerName) {
          // Requires joining with 'volunteers' table by name
          data = `Checking status for ${parsedResult.volunteerName} is not fully supported yet.`;
        } else {
           if (parsedResult.countOnly) {
            const { count, error } = await checkInQuery;
            if (error) throw error;
            data = `There are a total of ${count} check-in records.`;
          } else {
            const { data: checkInData, error } = await checkInQuery.limit(10).order('check_in_time', { ascending: false });
            if (error) throw error;
             if (checkInData && checkInData.length > 0) {
                data = `Found ${checkInData.length} recent check-ins. (List limited to 10, details not fully displayed yet).`;
             } else {
                data = "No check-in records found.";
             }
          }
        }
        break;

      case 'UNRECOGNIZED':
      default:
        data = "I'm sorry, I didn't understand that. Could you please rephrase your question? I can help with T-shirt inventory, volunteer statistics, and check-in information.";
        break;
    }

    return NextResponse.json({ reply: data });

  } catch (error: any) {
    console.error('Error in AI Chat API:', error);
    // More specific error handling based on error type if needed
    const reply = "Sorry, I encountered an error while processing your request. " + (error.message || "");
    return NextResponse.json({ reply }, { status: 500 });
  }
}
