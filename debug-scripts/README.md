# Debug Scripts

This folder contains debug scripts to help troubleshoot authentication and database issues.

## Available Scripts

### `debug-profile.js`
- **Purpose**: Check if profile records exist in the database
- **Usage**: `node debug-scripts/debug-profile.js`
- **What it does**:
  - Checks for specific email in profiles table
  - Lists all existing profiles (with masked emails for privacy)
  - Helps troubleshoot "User not found" errors

### `debug-auth-settings.js`
- **Purpose**: Test Supabase authentication settings and OTP functionality
- **Usage**: `node debug-scripts/debug-auth-settings.js`
- **What it does**:
  - Tests OTP send functionality
  - Reveals specific auth errors (like signup disabled)
  - Provides solutions for common auth issues

### `debug-session-refresh.js`
- **Purpose**: Debug session refresh and token management issues
- **Usage**: `node debug-scripts/debug-session-refresh.js`
- **What it does**:
  - Tests current session state
  - Checks token refresh functionality
  - Helps troubleshoot "Invalid Refresh Token" errors

### `debug-refresh-token.ts`
- **Purpose**: Advanced debugging for refresh token issues (TypeScript version)
- **Usage**: `npx tsx debug-scripts/debug-refresh-token.ts`
- **What it does**:
  - Comprehensive session and refresh token testing
  - Auth state listener verification
  - Detailed error analysis with solutions

## Requirements

Make sure you have:
- `.env.local` file with Supabase credentials
- Node.js installed
- Required dependencies (`@supabase/supabase-js`, `dotenv`)

## Common Issues & Solutions

### "User not found" Error
1. Run `debug-profile.js` to verify profile exists
2. Check if email matches between volunteer and profile tables
3. Ensure profile is linked to volunteer via `profile_id`

### "Signups not allowed" Error  
1. Run `debug-auth-settings.js` to confirm the issue
2. Go to Supabase Dashboard → Authentication → Settings
3. Enable "User signup" setting

### "Invalid Refresh Token" Error
1. Run `debug-session-refresh.js` or `debug-refresh-token.ts` to analyze the issue
2. Clear browser cookies and localStorage for your domain
3. Check SSR client configuration consistency
4. Login again to get fresh tokens

### Profile-Volunteer Linking Issues
Use this SQL to check the relationship:
```sql
SELECT p.id, p.email, v.email as volunteer_email
FROM profiles p
JOIN volunteers v ON p.id = v.profile_id
WHERE v.email = 'your-email@example.com';
```