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
    let responseData: any = null;
    let responseType: string = 'text';
    let errorMessage: string | null = null;

    // 2. Execute database query based on parsed intent
    switch (parsedResult.intent) {
      case 'T_SHIRT_INVENTORY':
        // Ensure size is a string and uppercase it for consistency if it exists
        const size = typeof parsedResult.size === 'string' ? parsedResult.size.toUpperCase() : undefined;
        if (size) {
          const { data: inventoryData, error } = await supabase
            .from('tshirt_inventory')
            .select('size_cd, quantity_on_hand, sort_order')
            .eq('size_cd', size)
            .eq('event_id', 1); // Assuming event_id 1 for now, make dynamic if needed
          if (error) throw error;
          if (inventoryData && inventoryData.length > 0) {
            responseType = 'tshirt_inventory';
            responseData = {
              data: inventoryData,
              title: `T-Shirt Inventory - Size ${size}`,
              message: `Here's what we have for size ${size} T-shirts. We currently have ${inventoryData[0].quantity_on_hand} shirts in stock.`
            };
          } else {
            responseType = 'error';
            responseData = {
              message: `Sorry, I couldn't find inventory information for size ${size}.`,
              suggestions: ['Try asking for "Show me t-shirt inventory"', 'Check available sizes: XS, S, M, L, XL, 2XL, 3XL']
            };
          }
        } else {
           const { data: inventoryData, error } = await supabase
            .from('tshirt_inventory')
            .select('size_cd, quantity_on_hand, sort_order')
            .eq('event_id', 1) // Assuming event_id 1
            .order('sort_order');
          if (error) throw error;
          if (inventoryData && inventoryData.length > 0) {
            responseType = 'tshirt_inventory';
            responseData = {
              data: inventoryData,
              title: 'T-Shirt Inventory - All Sizes',
              message: `Here's our complete T-shirt inventory! We have ${inventoryData.length} different sizes in stock with a total of ${inventoryData.reduce((sum, item) => sum + item.quantity_on_hand, 0)} shirts available.`
            };
          } else {
            responseType = 'error';
            responseData = {
              message: 'Sorry, I could not retrieve the T-shirt inventory at the moment.',
              suggestions: ['Please try again later', 'Contact support if the issue persists']
            };
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
            responseType = 'error';
            responseData = {
              message: `Could not find seva category: ${parsedResult.sevaCategory}`,
              suggestions: ['Try asking for available seva categories', 'Check the spelling of the seva category name']
            };
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
            responseType = 'text';
            responseData = `There are ${uniqueVolunteers.size} volunteers assigned to ${parsedResult.sevaCategory}.`;
          } else {
            // Get volunteer details for this seva category
            const { data: commitData, error: commitErr } = await supabase
              .from('volunteer_commitments')
              .select(`
                volunteer_id,
                volunteers!inner(id, first_name, last_name, email, gm_family)
              `)
              .eq('seva_category_id', sevaCatData.id);
            
            if (commitErr) throw commitErr;
            
            if (commitData && commitData.length > 0) {
              // Get unique volunteers with full details
              const uniqueVolunteers = new Map();
              commitData.forEach((commitment: any) => {
                const volunteer = commitment.volunteers;
                if (volunteer) {
                  uniqueVolunteers.set(volunteer.email, volunteer);
                }
              });
              
              // Convert to volunteer stats format with proper structure
              const volunteerData = Array.from(uniqueVolunteers.values()).map((volunteer: any) => ({
                id: volunteer.id,
                first_name: volunteer.first_name || '',
                last_name: volunteer.last_name || '',
                email: volunteer.email,
                seva_category: parsedResult.sevaCategory,
                gm_family: volunteer.gm_family || false
              }));
              
              const gmFamilyCount = volunteerData.filter(v => v.gm_family).length;
              const nonGmFamilyCount = volunteerData.length - gmFamilyCount;
              
              responseType = 'volunteer_stats';
              responseData = {
                data: volunteerData,
                stats: {
                  total: volunteerData.length,
                  gmFamily: gmFamilyCount,
                  nonGmFamily: nonGmFamilyCount
                },
                title: `Volunteers in ${parsedResult.sevaCategory}`,
                message: `Great! I found ${volunteerData.length} volunteers working in ${parsedResult.sevaCategory}. Here's the complete list with their details:`
              };
            } else {
              responseType = 'error';
              responseData = {
                message: `No volunteers found for ${parsedResult.sevaCategory}.`,
                suggestions: ['Try asking for a different seva category', 'Check if volunteers are assigned to this category']
              };
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

              const sevaStatsData = Object.entries(sevaCounts)
                .map(([category_name, volunteerSet]) => ({
                  category_name,
                  volunteer_count: volunteerSet.size
                }))
                .sort((a, b) => b.volunteer_count - a.volunteer_count);

              responseType = 'seva_category_stats';
              responseData = {
                data: sevaStatsData,
                title: 'Volunteer Count by Seva Category',
                message: `Here's the breakdown of our ${sevaStatsData.reduce((sum, cat) => sum + cat.volunteer_count, 0)} volunteers across ${sevaStatsData.length} seva categories. The categories are sorted by volunteer count:`
              };
            } else {
              responseType = 'error';
              responseData = {
                message: "No volunteer commitments found.",
                suggestions: ['Try asking for general volunteer statistics', 'Check if volunteers are properly assigned to seva categories']
              };
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
              responseType = 'text';
              responseData = `There are ${count} volunteers matching your criteria.`;
            } else {
              // Get total count first
              const { count: totalCount, error: countError } = await query;
              if (countError) throw countError;
              
              // Get actual data with limit
              const { data: volunteerData, error } = await query.limit(10); // Limit results for lists
              if (error) throw error;
              if (volunteerData && volunteerData.length > 0) {
                // Calculate stats from all volunteers for accurate counts
                const { data: allVolunteersForStats, error: allVolError } = await supabase
                  .from('volunteers')
                  .select('gm_family');
                if (allVolError) throw allVolError;
                
                const stats = {
                  total: totalCount || 0,
                  gmFamily: allVolunteersForStats?.filter(v => v.gm_family).length || 0,
                  nonGmFamily: allVolunteersForStats?.filter(v => !v.gm_family).length || 0
                };
                
                responseType = 'volunteer_stats';
                responseData = {
                  data: volunteerData,
                  stats,
                  title: 'Volunteer List',
                  message: `Here are our volunteers! We have ${totalCount} total volunteers registered. ${volunteerData.length < totalCount ? `I'm showing the first ${volunteerData.length} volunteers below:` : 'Here\'s the complete list:'}`
                };
              } else {
                responseType = 'error';
                responseData = {
                  message: "No volunteers found matching your criteria.",
                  suggestions: ['Try broadening your search criteria', 'Check if volunteers are properly registered']
                };
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
            
          const dateContext = parsedResult.date === 'today' ? 'today' : parsedResult.date === 'yesterday' ? 'yesterday' : targetDate;
          
          if (parsedResult.countOnly) {
            const { count, error } = await checkInQuery;
            if (error) throw error;
            responseType = 'text';
            responseData = `There are ${count} check-ins for ${dateContext}.`;
          } else {
            const { data: checkInData, error } = await checkInQuery
              .select('*, volunteers(first_name, last_name)')
              .order('check_in_time', { ascending: false })
              .limit(10);
            if (error) throw error;
            if (checkInData && checkInData.length > 0) {
              const formattedCheckIns = checkInData.map((checkin: any) => ({
                id: checkin.id,
                volunteer_name: `${checkin.volunteers?.first_name || 'Unknown'} ${checkin.volunteers?.last_name || 'Volunteer'}`,
                check_in_time: checkin.check_in_time,
                check_out_time: checkin.check_out_time,
                status: checkin.check_out_time ? 'present' : 'pending'
              }));
              
              responseType = 'check_in_stats';
              responseData = {
                data: formattedCheckIns,
                title: `Check-ins for ${dateContext}`,
                dateContext,
                message: `Here are the check-ins for ${dateContext}! I found ${formattedCheckIns.length} volunteers who checked in. You can see their check-in times and status below:`
              };
            } else {
              responseType = 'error';
              responseData = {
                message: `No check-ins found for ${dateContext}.`,
                suggestions: ['Try asking for a different date', 'Check if any volunteers have checked in recently']
              };
            }
          }
        } else if (parsedResult.volunteerName) {
          // Find volunteer by name using fuzzy matching
          const nameParts = parsedResult.volunteerName.trim().split(/\s+/);
          
          // Get all volunteers first for fuzzy matching
          const { data: allVolunteers, error: allVolunteersError } = await supabase
            .from('volunteers')
            .select('id, first_name, last_name');
            
          if (allVolunteersError) throw allVolunteersError;
          
          let bestMatch = null;
          let bestScore = 0;
          
          // Simple fuzzy matching function
          const fuzzyMatch = (str1: string, str2: string): number => {
            const s1 = str1.toLowerCase();
            const s2 = str2.toLowerCase();
            
            // Exact match
            if (s1 === s2) return 1;
            
            // Contains match
            if (s1.includes(s2) || s2.includes(s1)) return 0.8;
            
            // Levenshtein distance based similarity
            const maxLen = Math.max(s1.length, s2.length);
            const distance = levenshteinDistance(s1, s2);
            return Math.max(0, (maxLen - distance) / maxLen);
          };
          
          // Levenshtein distance function
          const levenshteinDistance = (str1: string, str2: string): number => {
            const matrix = [];
            for (let i = 0; i <= str2.length; i++) {
              matrix[i] = [i];
            }
            for (let j = 0; j <= str1.length; j++) {
              matrix[0][j] = j;
            }
            for (let i = 1; i <= str2.length; i++) {
              for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                  matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                  matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                  );
                }
              }
            }
            return matrix[str2.length][str1.length];
          };
          
          // Find best matching volunteer
          if (allVolunteers && allVolunteers.length > 0) {
            for (const volunteer of allVolunteers) {
              const fullName = `${volunteer.first_name} ${volunteer.last_name}`;
              let score = 0;
              
              if (nameParts.length === 1) {
                // Single name - check against first name, last name, and full name
                const firstNameScore = fuzzyMatch(volunteer.first_name, nameParts[0]);
                const lastNameScore = fuzzyMatch(volunteer.last_name, nameParts[0]);
                const fullNameScore = fuzzyMatch(fullName, nameParts[0]);
                score = Math.max(firstNameScore, lastNameScore, fullNameScore);
              } else if (nameParts.length >= 2) {
                // Multiple names - match against full name and individual parts
                const firstName = nameParts[0];
                const lastName = nameParts[nameParts.length - 1];
                const inputFullName = nameParts.join(' ');
                
                const fullNameScore = fuzzyMatch(fullName, inputFullName);
                const firstNameScore = fuzzyMatch(volunteer.first_name, firstName);
                const lastNameScore = fuzzyMatch(volunteer.last_name, lastName);
                
                // Combine scores with weights
                score = Math.max(
                  fullNameScore,
                  (firstNameScore + lastNameScore) / 2
                );
              }
              
              if (score > bestScore && score > 0.5) { // Minimum threshold for matches
                bestScore = score;
                bestMatch = volunteer;
              }
            }
          }
          
          const volunteerData = bestMatch ? [bestMatch] : [];
          const volunteerError = null;
            
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
              const formattedCheckIns = checkInData.map((checkin: any) => ({
                id: checkin.id || `${volunteer.id}-${checkin.check_in_time}`,
                volunteer_name: `${volunteer.first_name} ${volunteer.last_name}`,
                check_in_time: checkin.check_in_time,
                check_out_time: checkin.check_out_time,
                status: checkin.check_out_time ? 'present' : 'pending'
              }));
              
              responseType = 'check_in_stats';
              responseData = {
                data: formattedCheckIns,
                title: `Check-ins for ${volunteer.first_name} ${volunteer.last_name}`,
                message: `Great! I found the check-in history for ${volunteer.first_name} ${volunteer.last_name}. Here are their ${formattedCheckIns.length} most recent check-ins:`
              };
            } else {
              responseType = 'error';
              responseData = {
                message: `No check-in records found for ${volunteer.first_name} ${volunteer.last_name}.`,
                suggestions: ['Try asking for a different volunteer', 'Check if the volunteer has checked in recently']
              };
            }
          } else {
            responseType = 'error';
            responseData = {
              message: `Could not find volunteer with name "${parsedResult.volunteerName}".`,
              suggestions: ['Try using the full name', 'Check the spelling of the volunteer name']
            };
          }
        } else {
           if (parsedResult.countOnly) {
            const { count, error } = await checkInQuery;
            if (error) throw error;
            responseType = 'text';
            responseData = `There are a total of ${count} check-in records.`;
          } else {
            const { data: checkInData, error } = await checkInQuery
              .select('*, volunteers(first_name, last_name)')
              .limit(10)
              .order('check_in_time', { ascending: false });
            if (error) throw error;
            if (checkInData && checkInData.length > 0) {
              const formattedCheckIns = checkInData.map((checkin: any) => ({
                id: checkin.id,
                volunteer_name: `${checkin.volunteers?.first_name || 'Unknown'} ${checkin.volunteers?.last_name || 'Volunteer'}`,
                check_in_time: checkin.check_in_time,
                check_out_time: checkin.check_out_time,
                status: checkin.check_out_time ? 'present' : 'pending'
              }));
              
              responseType = 'check_in_stats';
              responseData = {
                data: formattedCheckIns,
                title: 'Recent Check-ins',
                message: `Here are the most recent check-ins! I found ${formattedCheckIns.length} volunteers who checked in recently (showing the latest 10 entries):`
              };
            } else {
              responseType = 'error';
              responseData = {
                message: "No check-in records found.",
                suggestions: ['Try asking for check-ins for a specific date', 'Check if volunteers have been checking in']
              };
            }
          }
        }
        break;

      case 'UNRECOGNIZED':
      default:
        responseType = 'help';
        responseData = {
          message: "I'm sorry, I didn't understand that question.",
          originalQuery: userQuery
        };
        break;
    }

    return NextResponse.json({ 
      type: responseType,
      data: responseData,
      // Legacy support for existing frontend
      reply: typeof responseData === 'string' ? responseData : responseData?.message || 'Response processed successfully.'
    });

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
    
    return NextResponse.json({ 
      type: 'error',
      data: {
        message: reply,
        suggestions: ['Please try again later', 'Contact support if the issue persists']
      },
      reply // Legacy support
    }, { status: 500 });
  }
}
