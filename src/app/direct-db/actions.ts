'use server';

import { Pool } from 'pg';

// Create a connection pool using environment variables
const pool = new Pool({
  host: process.env.SUPABASE_DB_HOST,
  port: parseInt(process.env.SUPABASE_DB_PORT || '5432'),
  database: process.env.SUPABASE_DB_NAME,
  user: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: true
});

export async function fetchProfilesDirectly() {
  try {
    // Get a client from the pool
    const client = await pool.connect();
    
    try {
      // Execute a query
      const result = await client.query('SELECT * FROM profiles LIMIT 10');
      
      // Return the rows
      return {
        success: true,
        data: result.rows,
        count: result.rowCount
      };
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error: any) {
    console.error('Error executing query:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
}

export async function fetchEventsDirectly() {
  try {
    // Get a client from the pool
    const client = await pool.connect();
    
    try {
      // Execute a query
      const result = await client.query('SELECT * FROM events LIMIT 10');
      
      // Return the rows
      return {
        success: true,
        data: result.rows,
        count: result.rowCount
      };
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error: any) {
    console.error('Error executing query:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
}

export async function fetchVolunteersDirectly() {
  try {
    // Get a client from the pool
    const client = await pool.connect();
    
    try {
      // Execute a query
      const result = await client.query('SELECT * FROM volunteers LIMIT 10');
      
      // Return the rows
      return {
        success: true,
        data: result.rows,
        count: result.rowCount
      };
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error: any) {
    console.error('Error executing query:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
}
