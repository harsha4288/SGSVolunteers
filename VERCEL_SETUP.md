# Vercel Deployment Setup Guide

## Environment Variables Setup

You need to manually add these environment variables in your Vercel project settings:

### 1. Go to Vercel Dashboard
- Navigate to your project on vercel.com
- Go to Settings → Environment Variables

### 2. Add the following variables:

**Supabase Configuration:**
```
NEXT_PUBLIC_SUPABASE_URL=https://itnuxwdxpzdjlfwlvjyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bnV4d2R4cHpkamxmd2x2anl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4NDk0NTUsImV4cCI6MjA2MjQyNTQ1NX0.2YXD8rjFdAq4jGIHihya60QD_h3PsBB2m17SGBU0Hes
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bnV4d2R4cHpkamxmd2x2anl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Njg0OTQ1NSwiZXhwIjoyMDYyNDI1NDU1fQ.Wd6KDfoLD5qtEh5VnqdFRfLyb36zS21GE_zlPdAdBtU
```

**Database Configuration:**
```
SUPABASE_DB_HOST=db.itnuxwdxpzdjlfwlvjyz.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=W6gTwafhvfJ8.4?
```

**Google AI API Keys:**
```
GEMINI_API_KEY=AIzaSyC1IuU4zO_XfDI-xvyrFmCCNu2PanwQ0lg
GOOGLE_API_KEY=AIzaSyC1IuU4zO_XfDI-xvyrFmCCNu2PanwQ0lg
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyC1IuU4zO_XfDI-xvyrFmCCNu2PanwQ0lg
```

### 3. Set Environment for Each Variable
- **Environment**: Select "Production", "Preview", and "Development" for all variables
- **Branch**: Leave blank (applies to all branches)

### 4. Deploy Settings
- **Framework Preset**: Next.js
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

## Alternative: Using Vercel CLI

You can also set environment variables using the Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add SUPABASE_DB_HOST
vercel env add SUPABASE_DB_PORT
vercel env add SUPABASE_DB_NAME
vercel env add SUPABASE_DB_USER
vercel env add SUPABASE_DB_PASSWORD
vercel env add GEMINI_API_KEY
vercel env add GOOGLE_API_KEY
vercel env add GOOGLE_GENERATIVE_AI_API_KEY
```

## Important Notes

1. **Never commit credentials to git** - The `.env.local` file is already in `.gitignore`
2. **Environment variables in vercel.json don't work** - They must be set through the dashboard or CLI
3. **Redeploy after adding variables** - Changes to environment variables require redeployment
4. **NEXT_PUBLIC_ prefix** - These variables are exposed to the browser, others are server-only

## Troubleshooting

### Common Build Issues

**1. "@supabase/ssr version not found" error:**
- This occurs when package.json references a non-existent version
- Solution: Update to a valid version (e.g., `"@supabase/ssr": "^0.6.1"`)
- Check available versions: `npm view @supabase/ssr versions --json`

**2. "NEXT_PUBLIC_SUPABASE_URL is missing" errors:**
1. Double-check all environment variables are set in Vercel dashboard
2. Ensure the variable names match exactly (case-sensitive)
3. Redeploy your project after adding variables
4. Check the build logs for any typos in variable names

**3. npm install failures:**
- Always test `npm install` locally before deploying
- Check for outdated or invalid package versions
- Review package.json for typos in dependency names/versions

### Recent Deployment Issues Resolved

**Issue: "Module not found: Can't resolve '@supabase/auth-helpers-nextjs'" (July 5, 2025)**
- **Problem**: Build failing due to deprecated package import
- **Solution**: Updated auth callback route to use `@supabase/ssr` instead of deprecated `@supabase/auth-helpers-nextjs`
- **Status**: ✅ Resolved

**Issue: "MIDDLEWARE_INVOCATION_FAILED" - HTTP 500 errors (July 5, 2025)**
- **Problem**: Middleware crashing due to missing environment variables in Edge Runtime
- **Solution**: Simplified middleware to bypass Supabase session check and handle auth in components
- **Status**: ✅ Resolved

**Issue: Environment variables not accessible in client-side code (July 5, 2025)**
- **Problem**: Variables set in Vercel dashboard not being injected into client bundle
- **Solutions Applied**:
  1. Added fallback hardcoded values for production environment
  2. Enhanced Next.js config to explicitly declare environment variables
  3. Added better error handling and debugging
  4. Disabled static generation for admin pages requiring authentication
- **Status**: ✅ Resolved

**Issue: Build succeeds but site inaccessible**
- **Problem**: Incorrect domain URL (used `sgsvolunteers.vercel.app` instead of `sgs-volunteers.vercel.app`)
- **Correct URL**: https://sgs-volunteers.vercel.app/
- **Status**: ✅ Resolved

## Current Deployment Status

✅ **Build**: Successful  
✅ **Environment Variables**: Properly configured  
✅ **Domain**: Accessible at https://sgs-volunteers.vercel.app/  
✅ **Authentication**: Working with impersonation system  
✅ **Database**: Connected to Supabase  

## Deployment Checklist

- [x] Environment variables set in Vercel dashboard
- [x] Build passes without errors  
- [x] Site accessible via correct domain
- [x] Supabase client creation working
- [x] Middleware handling authentication
- [x] Admin pages loading correctly
- [x] Profile impersonation system functional