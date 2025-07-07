# Safe Data Migration Plan: Preserve Authenticated Users

## Critical Issue Identified

The current DataMigration.py script will **wipe out all authenticated users** because:
- Line 222: `DELETE FROM public.profiles;` removes ALL profiles including those with `user_id` links
- Line 271: New profiles created with `user_id = NULL` 
- Authenticated users will lose access to their data

## Authentication System Analysis

### Current Profile Linking System
- **Profile Table**: Contains `user_id` field linking to Supabase Auth users
- **Authentication Flow**: Users authenticate via OTP → Profile linked via email → `user_id` field populated
- **Data Access**: All queries use `user_id` to connect authenticated users to their profiles
- **Profile Linking Service**: Automatically links existing profiles to authenticated users by email

### Risk Assessment
- **HIGH RISK**: Complete deletion of profiles table will break all authenticated user access
- **Impact**: Users who completed OTP authentication will be unable to access their data
- **Data Loss**: All `user_id` linkages will be permanently lost

## Minimal Fix Strategy

### 1. Preserve Authenticated Profiles
- Before deletion, backup profiles that have `user_id IS NOT NULL` (authenticated users)
- After Excel import, restore these authenticated profiles
- Merge/update volunteer data for authenticated users instead of recreating

### 2. Safe Migration Process
- **Step 1**: Extract authenticated profiles (`user_id IS NOT NULL`)
- **Step 2**: Clear only non-authenticated data
- **Step 3**: Import fresh Excel data
- **Step 4**: Restore authenticated profiles
- **Step 5**: Update volunteer records for authenticated users (preserve `user_id` links)

### 3. Key Changes Required to DataMigration.py

#### Current Problematic Code (Lines 219-225):
```python
# 2. Clear existing data from relevant tables
print("🧹 Clearing target tables...")
cur.execute("DELETE FROM public.volunteer_commitments;")
cur.execute("DELETE FROM public.volunteers;")
cur.execute("DELETE FROM public.profiles;")  # ❌ THIS KILLS AUTHENTICATED USERS
cur.execute("DELETE FROM public.seva_categories;")
cur.execute("DELETE FROM public.time_slots;")
```

#### Safe Replacement Strategy:
```python
# 2. Preserve authenticated users before clearing
print("🔒 Backing up authenticated profiles...")
# Backup authenticated profiles
# Clear only non-authenticated data
# Import fresh data
# Restore authenticated profiles
```

### 4. Specific Implementation Changes

#### A. Profile Backup/Restore Logic
- Create temporary backup of authenticated profiles
- Selective deletion instead of blanket DELETE
- Profile restoration with proper merging

#### B. Volunteer Data Handling
- Preserve existing `user_id` links for authenticated users
- Update volunteer records instead of recreating for authenticated profiles
- Maintain data integrity between profiles and volunteers

#### C. Selective Data Clearing
- Clear only profiles with `user_id IS NULL`
- Clear volunteers linked to non-authenticated profiles
- Preserve commitments for authenticated users

### 5. Seva Categories & Assignments Status
- ✅ Current script properly handles wiping and reloading seva categories (lines 430-447)
- ✅ Assignment processing works correctly with the new category system
- ✅ No changes needed for this part

## Expected Outcomes

This approach ensures:
- ✅ Existing authenticated users keep their access
- ✅ Latest Excel data gets synced
- ✅ Seva categories get wiped and reloaded as needed
- ✅ Minimal code changes, focused solution
- ✅ No disruption to OTP authentication system
- ✅ Maintains data integrity for profile-volunteer relationships

## Implementation Priority

1. **HIGH PRIORITY**: Fix profile deletion to preserve authenticated users
2. **MEDIUM PRIORITY**: Update volunteer data handling for authenticated profiles
3. **LOW PRIORITY**: Add logging and validation for the migration process

## Testing Strategy

1. **Pre-Migration**: Verify authenticated users exist in database
2. **Post-Migration**: Confirm authenticated users can still access their data
3. **Data Validation**: Ensure Excel data properly synchronized
4. **Authentication Test**: Verify OTP login still works for existing users

---

**Status**: Plan created - awaiting implementation approval
**Created**: 2025-07-07
**Critical**: This fix is essential before running any data migration