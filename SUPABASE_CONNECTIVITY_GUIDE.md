# Supabase Connectivity Troubleshooting Guide

This document provides a comprehensive guide to troubleshooting and resolving database connectivity issues in the SGSVolunteers project.

## Critical Update: Supabase URL Format

We've identified a critical issue with the Supabase URL format in your project. The JavaScript client URL should NOT include the "db." prefix, while direct PostgreSQL connections SHOULD include it.

**Correct URL formats:**
- JavaScript client: `https://itnuxwdxpzdjlfwlvjyz.supabase.co`
- PostgreSQL connection: `db.itnuxwdxpzdjlfwlvjyz.supabase.co`

This has been fixed in your `.env.local` file.

## Identified Issues

Based on our investigation, we've identified several potential issues:

1. **Incorrect Supabase URL Format**: The JavaScript client was using the wrong URL format with a "db." prefix.

2. **CORS Restrictions**: The "Failed to fetch" error suggests CORS restrictions are preventing the browser from connecting to Supabase.

3. **Network Connectivity Issues**: There might be network-level issues preventing the JavaScript client from connecting.

4. **Row Level Security (RLS)**: While RLS is mentioned in the database documentation, our tests show that RLS is not currently enabled on any tables.

## Solution Approaches

We've implemented multiple approaches to solve these issues:

### Approach 1: CORS Proxy Server

A local proxy server that bypasses CORS restrictions:

1. **Start the proxy server**:
   ```bash
   node cors-proxy-server.js
   ```

2. **Test the proxy connection**:
   - Navigate to `/test-proxy` in your browser
   - Use the test buttons to verify connectivity through the proxy

### Approach 2: Direct Database Access

Server-side actions that use direct PostgreSQL connections:

1. **Test direct database access**:
   - Navigate to `/direct-db` in your browser
   - Use the buttons to fetch data directly from the database

### Approach 3: Supabase Project Configuration

If the above approaches don't work, you may need to update your Supabase project settings:

1. **Update CORS settings**:
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Add your application's domain to the allowed origins
   - For local development, add `http://localhost:3000` and `http://localhost:3001`

2. **Check RLS settings**:
   - Use the Python script to check RLS status:
   ```bash
   python Data/test_rls.py
   ```

## Implementation Details

### 1. CORS Proxy Server

The `cors-proxy-server.js` file creates a local proxy server that:
- Runs on port 3005
- Forwards requests to your Supabase project
- Adds necessary CORS headers to bypass restrictions

To use the proxy:
1. Start the server: `node cors-proxy-server.js`
2. Use the `createProxyClient()` function from `src/lib/supabase/proxy-client.ts`

### 2. Direct Database Access

The server actions in `src/app/direct-db/actions.ts` use the `pg` library to:
- Connect directly to the PostgreSQL database
- Bypass the JavaScript client entirely
- Execute SQL queries server-side

This approach is more reliable but limited to server-side operations.

### 3. Testing Tools

We've created several testing pages:
- `/test-db`: Tests the standard Supabase client
- `/test-proxy`: Tests the CORS proxy approach
- `/direct-db`: Tests direct PostgreSQL connections

Use these pages to identify which approach works best for your environment.

## Recommended Solution

Based on our findings, we recommend the following approach:

1. **For client-side operations**:
   - Use the CORS proxy during development
   - Configure proper CORS settings in your Supabase project for production

2. **For critical server-side operations**:
   - Use direct PostgreSQL connections via server actions
   - This ensures reliability regardless of CORS or client-side issues

3. **For authentication**:
   - Continue using the Supabase auth helpers
   - Ensure proper integration between auth and data access

## Next Steps

1. **Test the different approaches** to see which works best in your environment
2. **Update your application code** to use the working approach
3. **Configure your Supabase project** for proper CORS and security settings
4. **Consider enabling RLS** if you need row-level security

## Conclusion

By implementing these solutions, you should be able to resolve the database connectivity issues in your SGSVolunteers project. If problems persist, consider reaching out to Supabase support or consulting the Supabase documentation for more specific guidance.
