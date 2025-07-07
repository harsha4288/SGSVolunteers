# Feature Specification: Passwordless OTP Authentication

## 1. Overview
- **Summary:** Secure passwordless authentication using email-based OTP verification via Supabase Auth
- **Goals:** 
  - Secure user authentication with email OTP verification
  - Seamless session management and user identification
  - Automatic profile-volunteer linking for authenticated users
- **Success Metrics:** 
  - Successful OTP delivery and verification rate >95%
  - User session persistence across browser sessions
  - Zero authentication bypass vulnerabilities

## 2. User Authentication Flow

### Current Implementation (✅ COMPLETED)
1. **Email Entry Flow:**
   - User visits `/login` and enters email address
   - System validates email format and sends 6-digit OTP via Supabase Auth
   - User sees "Check your email" confirmation message

2. **OTP Verification Flow:**
   - User receives 6-digit OTP code via email (1-hour expiration)
   - User enters code in verification form
   - System validates OTP with Supabase Auth
   - On success: User is authenticated and redirected to dashboard

3. **Session Management:**
   - Authenticated sessions persist across browser sessions
   - User profile data loaded automatically based on authenticated user
   - Session automatically refreshes when valid
   - Logout clears session and redirects to login

## 3. Technical Architecture

### 3.1. Authentication Components (✅ IMPLEMENTED)
- `EmailInputForm`: Email entry with validation (`src/app/login/components/`)
- `OTPVerificationForm`: 6-digit code input with resend option
- `AuthLoadingSpinner`: Loading states during OTP operations

### 3.2. Service Layer (✅ IMPLEMENTED)
- `otp-service.ts`: Handles OTP send/verify operations (`src/lib/auth/`)
- `profile-linking-service.ts`: Links authenticated users to existing profiles
- SSR-compatible Supabase client (`src/lib/supabase/client-ssr.ts`)

### 3.3. Authentication Hooks (✅ IMPLEMENTED)
- `useOTPAuth()`: Manages OTP send/verify flow states (`src/hooks/`)
- `useAuthSession()`: Manages user session state
- Updated existing hooks to use proper authentication pattern

### 3.4. Profile and Volunteer Data Syncing

#### Current Data Flow
1. **User Authentication:**
   ```typescript
   // Get authenticated user
   const { data: { user } } = await supabase.auth.getUser();
   
   // Get user's profile
   const { data: profile } = await supabase
     .from('profiles')
     .select('id')
     .eq('user_id', user.id)
     .single();
   ```

2. **Volunteer Data Access:**
   ```typescript
   // Get volunteers linked to user's profile
   const { data: volunteers } = await supabase
     .from('volunteers')
     .select('*')
     .eq('profile_id', profile.id);
   ```

3. **Role-Based Access:**
   ```typescript
   // Get user roles for permissions
   const { data: roles } = await supabase
     .from("profile_roles")
     .select(`role_id, roles:role_id (role_name)`)
     .eq("profile_id", profile.id);
   ```

#### Profile Linking Strategy
- **New Users:** Profile created automatically with authenticated user data
- **Existing Users:** `user_id` linked to `auth.uid()` on first OTP authentication
- **Email Matching:** Profiles linked via email address for seamless migration

## 4. Security Implementation

### 4.1. Authentication Pattern (✅ STANDARDIZED)
All application modules now use consistent authentication:
```typescript
// Standard authentication pattern used across all pages
const { data: { user }, error: userError } = await supabase.auth.getUser();
if (userError || !user) {
  throw new Error("Not authenticated. Please log in again.");
}

const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('id')
  .eq('user_id', user.id)
  .single();
```

### 4.2. Session Security
- Middleware-level authentication protection for all `/app/*` routes
- SSR-compatible client ensures session consistency
- Secure cookie handling with proper session persistence

### 4.3. Error Handling
- Comprehensive error messages for all failure scenarios
- Rate limiting: 1 OTP per 60 seconds (Supabase default)
- Network error recovery with retry options

## 5. Future Development Considerations

### 5.1. Row Level Security (RLS) - Next Phase
**User Isolation Policies:**
```sql
-- Users can only access their own profile data
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only access volunteers linked to their profile  
CREATE POLICY "Users can view their volunteers" ON public.volunteers
  FOR SELECT USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE auth.uid() = user_id
    )
  );
```

**Role-Based Access Policies:**
- **Admin:** Full access to all data
- **Team Lead:** Access to volunteers within assigned seva categories
- **Volunteer:** Access only to their own data

### 5.2. Volunteer Data Synchronization

#### Current Implementation Status (✅ WORKING)
- **Profile Linking:** Automatic via email on first authentication
- **Volunteer Access:** Profile-based queries for all volunteer data
- **Family Members:** Multiple volunteers per profile supported
- **Role Management:** Role-based access working across all modules

#### Standardized Access Pattern
All modules (Dashboard, T-shirts, Profile, Assignments, Reports) now use:
1. Authenticate user via OTP session
2. Get profile via `user_id` linkage  
3. Access volunteers via `profile_id`
4. Apply role-based permissions

### 5.3. Monitoring and Debugging

#### Debug Tools Available
- `debug-scripts/debug-profile.js` - Verify profile existence and linking
- `debug-scripts/debug-auth-settings.js` - Test OTP functionality
- `debug-scripts/debug-session-refresh.js` - Diagnose session issues

#### Known Issues
- **Refresh Token Warnings:** Minor console errors may appear but don't affect functionality
- **Monitoring Required:** Session refresh mechanism needs occasional monitoring

## 6. Email Configuration (✅ COMPLETED)

### Supabase Email Template
- **Template Type:** Modified Magic Link template to send OTP tokens
- **Token Delivery:** Uses `{{ .Token }}` instead of `{{ .ConfirmationURL }}`
- **Professional Design:** Branded SGS Volunteers email with anti-spam features
- **Expiration:** 1-hour expiration with clear security messaging

### Configuration Requirements
- Email auth enabled in Supabase Dashboard
- User signups enabled for auth user creation
- Rate limiting: 1 OTP per 60 seconds
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 7. Implementation Status

### ✅ COMPLETED (Production Ready)
- **Security:** All impersonation code removed, zero hardcoded credentials
- **Authentication:** Complete OTP flow working across all modules
- **Session Management:** Persistent sessions with proper refresh handling
- **Profile Linking:** Automatic linking via email for seamless user experience
- **Module Standardization:** Consistent auth pattern across Dashboard, T-shirts, Profile, Assignments, Reports
- **Error Handling:** Comprehensive error messages and recovery options

### 🔄 FUTURE ENHANCEMENTS
- **Row Level Security:** Database-level access policies (Medium Priority)
- **Unit Testing:** Comprehensive test coverage (Low Priority)
- **Advanced Monitoring:** Enhanced session and error tracking (Low Priority)

---

**Current Status:** OTP authentication system is **PRODUCTION READY** with all critical functionality implemented and tested. All application modules use consistent authentication patterns with proper profile-volunteer data synchronization.