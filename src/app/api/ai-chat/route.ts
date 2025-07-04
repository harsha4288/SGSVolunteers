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
    const supabase = await createSupabaseServerClient();
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

          if (parsedResult.countOnly) {
            // Get unique volunteer count for this seva category
            const { data: commitData, error: commitErr } = await supabase
              .from('volunteer_commitments')
              .select('volunteer_id')
              .eq('seva_category_id', sevaCatData.id);
            
            if (commitErr) throw commitErr;
            
            const uniqueVolunteers = new Set(commitData?.map(c => c.volunteer_id) || []);
            data = `There are ${uniqueVolunteers.size} volunteers assigned to ${parsedResult.sevaCategory}.`;
          } else {
            // Get volunteer details for this seva category
            const { data: commitData, error: commitErr } = await supabase
              .from('volunteer_commitments')
              .select(`
                volunteer_id,
                volunteers!inner(first_name, last_name, email)
              `)
              .eq('seva_category_id', sevaCatData.id);
            
            if (commitErr) throw commitErr;
            
            if (commitData && commitData.length > 0) {
              // Get unique volunteers
              const uniqueVolunteers = new Map();
              commitData.forEach((commitment: any) => {
                const volunteer = commitment.volunteers;
                if (volunteer) {
                  uniqueVolunteers.set(volunteer.email, `${volunteer.first_name} ${volunteer.last_name}`);
                }
              });
              
              const volunteerList = Array.from(uniqueVolunteers.values()).join(', ');
              data = `Volunteers assigned to ${parsedResult.sevaCategory}: ${volunteerList}`;
            } else {
              data = `No volunteers found for ${parsedResult.sevaCategory}.`;
            }
          }

        } else { // General volunteer stats without specific seva
          // Check if this is a request for volunteer count by seva category
          const isSevaBreakdownRequest = parsedResult.countOnly &&
            !parsedResult.isGMFamily &&
            !parsedResult.studentBatch;

          if (isSevaBreakdownRequest) {
            // Get volunteer count by seva category using a more efficient query
            const { data: sevaData, error: sevaError } = await supabase
              .from('volunteer_commitments')
              .select(`
                volunteer_id,
                seva_categories!inner(category_name)
              `);

            if (sevaError) throw sevaError;

            if (sevaData && sevaData.length > 0) {
              // Count unique volunteers by seva category
              const sevaCounts: { [key: string]: Set<string> } = {};
              sevaData.forEach((commitment: any) => {
                const sevaName = commitment.seva_categories?.category_name;
                if (sevaName) {
                  if (!sevaCounts[sevaName]) {
                    sevaCounts[sevaName] = new Set();
                  }
                  sevaCounts[sevaName].add(commitment.volunteer_id);
                }
              });

              const sevaBreakdown = Object.entries(sevaCounts)
                .map(([seva, volunteerSet]) => `${seva}: ${volunteerSet.size}`)
                .sort((a, b) => b.split(': ')[1] - a.split(': ')[1])
                .join('\n');

              data = `Volunteer count by seva category:\n${sevaBreakdown}`;
            } else {
              data = "No volunteer commitments found.";
            }
          } else {
            // Regular volunteer stats
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
                const names = volunteerData.map((v: any) => `${v.first_name} ${v.last_name}`).join(', ');
                data = `Some volunteers matching: ${names}. (List limited to 10)`;
              } else {
                data = "No volunteers found matching your criteria.";
              }
            }
          }
        }
        break;

      case 'CHECK_IN_STATS':
        // Handle date parsing for 'today', 'yesterday', and ISO dates
        let checkInQuery = supabase.from('volunteer_check_ins').select('*', { count: 'exact' });
        if (parsedResult.date) {
          // Convert 'today', 'yesterday' to ISO date format
          let targetDate: string;
          const today = new Date();
          
          if (parsedResult.date.toLowerCase() === 'today') {
            targetDate = today.toISOString().split('T')[0];
          } else if (parsedResult.date.toLowerCase() === 'yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            targetDate = yesterday.toISOString().split('T')[0];
          } else {
            // Assume it's already in YYYY-MM-DD format or similar
            targetDate = parsedResult.date;
          }
          
          // Query for check-ins on the specific date
          checkInQuery = checkInQuery
            .gte('check_in_time', `${targetDate}T00:00:00Z`)
            .lte('check_in_time', `${targetDate}T23:59:59Z`);
            
          if (parsedResult.countOnly) {
            const { count, error } = await checkInQuery;
            if (error) throw error;
            data = `There are ${count} check-ins for ${parsedResult.date === 'today' ? 'today' : parsedResult.date === 'yesterday' ? 'yesterday' : targetDate}.`;
          } else {
            const { data: checkInData, error } = await checkInQuery
              .select('*, volunteers(first_name, last_name)')
              .order('check_in_time', { ascending: false })
              .limit(10);
            if (error) throw error;
            if (checkInData && checkInData.length > 0) {
              const checkInList = checkInData.map((checkin: any) => 
                `${checkin.volunteers?.first_name || 'Unknown'} ${checkin.volunteers?.last_name || 'Volunteer'} - ${new Date(checkin.check_in_time).toLocaleTimeString()}`
              ).join('\n');
              data = `Check-ins for ${parsedResult.date === 'today' ? 'today' : parsedResult.date === 'yesterday' ? 'yesterday' : targetDate}:\n${checkInList}`;
            } else {
              data = `No check-ins found for ${parsedResult.date === 'today' ? 'today' : parsedResult.date === 'yesterday' ? 'yesterday' : targetDate}.`;
            }
          }
        } else if (parsedResult.volunteerName) {
          // Find volunteer by name and get their check-ins
          const { data: volunteerData, error: volunteerError } = await supabase
            .from('volunteers')
            .select('id, first_name, last_name')
            .or(`first_name.ilike.%${parsedResult.volunteerName}%,last_name.ilike.%${parsedResult.volunteerName}%`)
            .limit(1);
            
          if (volunteerError) throw volunteerError;
          
          if (volunteerData && volunteerData.length > 0) {
            const volunteer = volunteerData[0];
            const { data: checkInData, error: checkInError } = await supabase
              .from('volunteer_check_ins')
              .select('check_in_time, check_out_time')
              .eq('volunteer_id', volunteer.id)
              .order('check_in_time', { ascending: false })
              .limit(5);
              
            if (checkInError) throw checkInError;
            
            if (checkInData && checkInData.length > 0) {
              const recentCheckIns = checkInData.map(checkin => 
                `${new Date(checkin.check_in_time).toLocaleString()}${checkin.check_out_time ? ' - ' + new Date(checkin.check_out_time).toLocaleString() : ' (still checked in)'}`
              ).join('\n');
              data = `Recent check-ins for ${volunteer.first_name} ${volunteer.last_name}:\n${recentCheckIns}`;
            } else {
              data = `No check-in records found for ${volunteer.first_name} ${volunteer.last_name}.`;
            }
          } else {
            data = `Could not find volunteer with name "${parsedResult.volunteerName}".`;
          }
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
        data = `I'm sorry, I didn't understand that question. Here's what I can help you with:

📦 **T-shirt Inventory**
• "How many large T-shirts are left?"
• "What's the stock for M size t-shirts?"
• "Show me all t-shirt inventory"

👥 **Volunteer Statistics**
• "How many volunteers do we have?"
• "Give me volunteer count by seva category"
• "List volunteers in Registration seva"
• "How many GM family volunteers are there?"

✅ **Check-in Information**
• "How many volunteers checked in today?"
• "Who checked in yesterday?"
• "Check-in status for John Smith"

Try asking your question in a different way, or use one of these examples!`;
        break;
    }

    return NextResponse.json({ reply: data });

  } catch (error: any) {
    console.error('Error in Ask AI API:', error);
    
    // Provide user-friendly error messages based on error type
    let reply = "Sorry, I encountered an error while processing your request. ";
    
    if (error.message?.includes('API key')) {
      reply += "The AI service may be temporarily unavailable. Please try again later.";
    } else if (error.message?.includes('PGRST')) {
      reply += "There was an issue accessing the database. Please try again.";
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      reply += "There was a network issue. Please check your connection and try again.";
    } else {
      reply += "Please try rephrasing your question or contact support if the issue persists.";
    }
    
    return NextResponse.json({ reply }, { status: 500 });
  }
}
