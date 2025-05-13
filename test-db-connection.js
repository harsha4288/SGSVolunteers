// test-db-connection.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Anon Key:', supabaseAnonKey ? 'Key is set (not showing for security)' : 'Key is not set');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Supabase URL or Anon Key is missing from environment variables.');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test a simple query
    console.log('Attempting to query the events table...');
    const { data, error } = await supabase.from('events').select('*').limit(1);
    
    if (error) {
      console.error('Error querying events table:', error);
      
      // Check if it's a RLS policy issue
      if (error.code === 'PGRST301' || error.message.includes('permission denied')) {
        console.log('\nThis appears to be a Row Level Security (RLS) issue.');
        console.log('Possible solutions:');
        console.log('1. Disable RLS for testing purposes');
        console.log('2. Create appropriate RLS policies for the table');
        console.log('3. Use a service role key instead of the anon key for admin operations');
      }
    } else {
      console.log('Successfully connected to Supabase!');
      console.log('Data from events table:', data);
    }
    
    // Test a direct connection to check if RLS is the issue
    console.log('\nTesting direct connection to check if RLS is the issue...');
    const { data: publicData, error: publicError } = await supabase.from('events').select('*').limit(1);
    
    if (publicError) {
      console.error('Error with public access:', publicError);
    } else {
      console.log('Public access successful:', publicData);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testConnection();
