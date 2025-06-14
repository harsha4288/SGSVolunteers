"use server";

import { createSupabaseServerActionClient } from "@/lib/supabase/server-actions";

export async function runVolunteerCommitmentsDiagnostic() {
  const supabase = await createSupabaseServerActionClient();
  const diagnosticResults: Record<string, any> = {};

  try {
    // 1. Check if volunteer_commitments table exists and basic structure
    console.log("🔍 Checking volunteer_commitments table structure...");
    const { data: sampleCommitments, error: sampleError } = await supabase
      .from('volunteer_commitments')
      .select('id, volunteer_id, time_slot_id, seva_category_id')
      .limit(1);
    
    diagnosticResults.table_structure = {
      exists: !sampleError,
      error: sampleError?.message || null,
      sample_data: sampleCommitments
    };

    // 2. Check if volunteers table exists
    console.log("🔍 Checking volunteers table structure...");
    const { data: sampleVolunteers, error: volunteersError } = await supabase
      .from('volunteers')
      .select('id, email, first_name, last_name')
      .limit(1);
    
    diagnosticResults.volunteers_table = {
      exists: !volunteersError,
      error: volunteersError?.message || null,
      sample_data: sampleVolunteers
    };

    // 3. Check for orphaned records (volunteer_commitments with non-existent volunteer_id)
    console.log("🔍 Checking for orphaned volunteer_commitments records...");
    const { data: orphanedCommitments, error: orphanError } = await supabase
      .from('volunteer_commitments')
      .select(`
        id,
        volunteer_id,
        time_slot_id,
        seva_category_id
      `)
      .not('volunteer_id', 'in', `(SELECT id FROM volunteers)`)
      .limit(10);

    diagnosticResults.orphaned_records = {
      count: orphanedCommitments?.length || 0,
      error: orphanError?.message || null,
      sample_orphans: orphanedCommitments
    };

    // 4. Test the problematic relationship query directly
    console.log("🔍 Testing the problematic relationship query...");
    const { data: relationshipTest, error: relationshipError } = await supabase
      .from('volunteer_commitments')
      .select(`
        id,
        volunteer_id,
        volunteer:volunteer_id (
          first_name,
          last_name,
          email
        )
      `)
      .limit(1);

    diagnosticResults.relationship_query = {
      success: !relationshipError,
      error: relationshipError?.message || null,
      data: relationshipTest
    };

    // 5. Check foreign key constraints using SQL query
    console.log("🔍 Checking foreign key constraints...");
    try {
      // Use a direct SQL query to check constraints
      const { data: constraintCheck, error: constraintError } = await supabase
        .rpc('exec_sql', {
          query: `
            SELECT
              constraint_name,
              constraint_type,
              table_name,
              column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'volunteer_commitments'
              AND tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_schema = 'public'
          `
        });

      if (constraintError) {
        // Simple fallback - just try to detect if FK exists by testing violation
        diagnosticResults.foreign_key_constraints = {
          method: 'test_violation',
          error: constraintError.message,
          note: "Could not query constraints directly, will test with invalid insert"
        };
      } else {
        diagnosticResults.foreign_key_constraints = {
          method: 'sql_query',
          constraints: constraintCheck
        };
      }
    } catch (error: any) {
      diagnosticResults.foreign_key_constraints = {
        method: 'failed',
        error: error.message
      };
    }

    // 6. Count records in both tables
    console.log("🔍 Counting records in both tables...");
    const { count: commitmentCount, error: commitmentCountError } = await supabase
      .from('volunteer_commitments')
      .select('*', { count: 'exact', head: true });

    const { count: volunteerCount, error: volunteerCountError } = await supabase
      .from('volunteers')
      .select('*', { count: 'exact', head: true });

    diagnosticResults.record_counts = {
      volunteer_commitments: commitmentCount,
      volunteers: volunteerCount,
      commitment_count_error: commitmentCountError?.message || null,
      volunteer_count_error: volunteerCountError?.message || null
    };

    // 7. Test a simple join to see if the relationship works at all
    console.log("🔍 Testing simple JOIN query...");
    const { data: joinTest, error: joinError } = await supabase
      .from('volunteer_commitments')
      .select(`
        id,
        volunteer_id,
        volunteers!inner(first_name, last_name, email)
      `)
      .limit(1);

    diagnosticResults.simple_join = {
      success: !joinError,
      error: joinError?.message || null,
      data: joinTest
    };

    return {
      success: true,
      diagnostics: diagnosticResults,
      summary: {
        tables_exist: diagnosticResults.table_structure?.exists && diagnosticResults.volunteers_table?.exists,
        has_orphaned_records: (diagnosticResults.orphaned_records?.count || 0) > 0,
        relationship_works: diagnosticResults.relationship_query?.success,
        simple_join_works: diagnosticResults.simple_join?.success
      }
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      diagnostics: diagnosticResults
    };
  }
}

// Helper function to test FK constraint by attempting an invalid insert
export async function checkConstraintCreation() {
  const supabase = await createSupabaseServerActionClient();

  try {
    // Test if FK constraint exists by trying to insert invalid data
    const invalidVolunteerId = '00000000-0000-0000-0000-000000000000';
    
    const { error } = await supabase
      .from('volunteer_commitments')
      .insert([{
        volunteer_id: invalidVolunteerId,
        time_slot_id: 1,
        commitment_type: 'ASSIGNED_TASK',
        seva_category_id: 1,
        task_notes: 'TEST_CONSTRAINT_CHECK'
      }]);

    if (error) {
      // Check if it's a FK constraint error
      const isFKError = error.message.includes('foreign key') ||
                       error.message.includes('violates') ||
                       error.message.includes('constraint');
      
      return {
        can_check_constraints: true,
        foreign_key_exists: isFKError,
        error_message: error.message,
        test_method: 'invalid_insert'
      };
    } else {
      // If insert succeeded, FK constraint doesn't exist (we need to clean up)
      await supabase
        .from('volunteer_commitments')
        .delete()
        .eq('volunteer_id', invalidVolunteerId)
        .eq('task_notes', 'TEST_CONSTRAINT_CHECK');

      return {
        can_check_constraints: true,
        foreign_key_exists: false,
        test_method: 'invalid_insert',
        note: 'Insert succeeded - FK constraint is missing'
      };
    }

  } catch (error: any) {
    return {
      can_check_constraints: false,
      error: error.message
    };
  }
}