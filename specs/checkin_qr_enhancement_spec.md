# Feature Specification: Volunteer Self Check-In Interface

## 1. Overview
- **Summary:** Create a new self-service check-in interface for volunteers using location-based URLs and stateless verification, separate from the existing admin check-in functionality.
- **Goals:** 
  - Enable volunteers to self check-in for events with 100+ participants
  - Reduce admin/team lead workload for large seva categories
  - Provide secure verification without requiring authentication/OTP
  - Protect volunteer privacy during the verification process
- **Non-Goals:** 
  - Modify or replace existing admin check-in functionality in assignments module
  - Implement full authentication system with OTP
  - Support offline check-in capability
  - Create admin management features (existing assignment module handles this)
- **Success Metrics:** 
  - 80% of volunteers can successfully self check-in without admin assistance
  - Reduced admin check-in workload by 70% for large events
  - Zero unauthorized check-ins through security verification
  - Sub-30 second check-in time for verified volunteers

## 2. Detailed Description

### User Stories
- **As a Volunteer**, I want to self check-in using a location-specific URL so I don't need to wait for admin assistance at large events
- **As a Volunteer**, I want to verify my identity securely without creating an account or receiving OTP messages
- **As a Family Member**, I want to enter my first name to check-in when multiple people share the same contact information
- **As an Admin**, I want volunteers to self check-in without compromising security or exposing personal data
- **As an Admin**, I want to maintain the existing admin check-in functionality unchanged for administrative tasks

### Current Behavior
- Volunteers arrive at events and wait for team leads/admins to check them in
- Team leads manually search through assignment lists to find and check in volunteers
- For large events (100+ volunteers), this creates bottlenecks and delays
- All check-in happens through the admin assignments module interface
- No self-service option exists for volunteers

### Proposed Behavior
**New Volunteer Self Check-In Interface:**
1. **Location-Based Access**: Volunteer scans QR code at seva location → `/volunteer-checkin/{locationCode}`
2. **Contact Verification**: System prompts for phone number (10-digit normalized) or email
3. **Identity Verification**: If multiple volunteers share contact info, enter first name only
   - **Smart Name Matching**: Handles variations in name registration vs entry
   - **Single Volunteer**: Skip name entry and proceed directly
4. **Assignment Confirmation**: Review current assignment details for the location
5. **Time Slot Detection**: Automatically determine AM/PM check-in based on current time
6. **Success Confirmation**: Show check-in success with timestamp

**Admin Check-In (Unchanged):**
- All existing admin check-in functionality remains identical
- Admins can still check-in volunteers, handle corrections, and back-fill check-ins
- Visual indicators show which check-ins were self-service vs admin-assisted

### Edge Cases & Error Handling
- **Invalid Location Code**: Clear error message with instructions to contact admin
- **Volunteer Not Found**: Error message suggesting registration verification
- **No Current Assignments**: Show message that volunteer has no active assignments for this location
- **Already Checked In**: Display current check-in status and timestamp
- **Multiple Family Members**: Prompt for first name entry with smart matching (handles name variations)
- **Contact Info Mismatch**: Secure verification failure with retry option
- **Name Matching Failure**: Clear guidance on name entry variations
- **Multiple Active Assignments**: Allow selection of correct assignment to check into
- **Time Window Violations**: Clear messaging about valid check-in times
- **Rate Limiting**: 3 attempts per contact info, then redirect to team lead assistance

## 3. Technical Details

### 3.1. UI/UX Design
**New Volunteer Self Check-In Interface:**
- **Location-Based Check-In Page**: New route `/volunteer-checkin/{locationCode}` accessible without login
- **Contact Verification Form**: Phone (10-digit normalized) or email verification
- **First Name Entry**: Smart matching for family members sharing contact info
- **Assignment Confirmation**: Minimal data display for privacy
- **Success/Error States**: Clear feedback with next steps

**User Flow:**
1. Volunteer scans QR code at seva location → redirects to `/volunteer-checkin/{locationCode}`
2. Enter phone number (normalized to 10 digits) or email address
3. If multiple volunteers share contact: enter first name for identification
4. System matches volunteer to location assignment using smart name matching
5. Confirm assignment details and time slot (AM/PM auto-detected)
6. Complete check-in with success confirmation

**Privacy & Security Considerations:**
- **Minimal Data Exposure**: Only show necessary information at each step
- **No Authentication Required**: Avoid OTP costs while maintaining security
- **Stateless Design**: No session management required - volunteers can navigate freely
- **Rate Limiting**: 3 attempts per contact info, then direct to team lead
- **Data Minimization**: First name entry only for family member identification
- **Smart Contact Matching**: 10-digit phone normalization handles formatting variations
- **No Data Persistence**: No verification data stored beyond check-in completion
- **Clear Error Messages**: Detailed feedback without exposing personal information

**Admin Interface (Unchanged):**
- All existing assignment module functionality preserved
- Visual indicators show self-service vs admin check-ins
- No changes to current admin workflows

### 3.2. Data Model Changes
**Database Tables Affected:**
- `volunteer_check_ins` (existing) - add self-service tracking
- `volunteers` (existing) - read for verification (minimal data)
- `volunteer_assignments` (existing) - validate current assignments

**New Columns/Relationships:**
```sql
-- Add to volunteer_check_ins table
ALTER TABLE volunteer_check_ins ADD COLUMN check_in_method TEXT DEFAULT 'admin';
ALTER TABLE volunteer_check_ins ADD COLUMN location_code TEXT;
ALTER TABLE volunteer_check_ins ADD COLUMN attempt_count INTEGER DEFAULT 0;
```

**Data Validation:**
- `check_in_method` enum: 'admin', 'self_service'
- `location_code` must match valid seva location codes
- Rate limiting: max 3 attempts per contact info
- Time slot validation: AM/PM based on current time
- Phone normalization: strip formatting, validate 10 digits

**Privacy Protection:**
- Stateless design - no session or verification data stored
- First name entry only for family member identification
- Smart name matching handles registration variations
- Contact information verified but not persisted
- Assignment details shown with minimal personal information

### 3.3. API/Service Layer Changes
**New Services for Self Check-In:**
- `verifyVolunteerContact(locationCode: string, contactInfo: string)`: Verify phone/email for location
- `getVolunteersByContact(contactInfo: string, locationCode: string)`: Get volunteers matching contact
- `matchVolunteerByName(contactInfo: string, firstName: string, locationCode: string)`: Smart name matching
- `getVolunteerAssignment(volunteerId: string, locationCode: string)`: Get location assignment
- `completeLocationCheckIn(volunteerId: string, locationCode: string)`: Complete check-in
- `normalizePhoneNumber(phoneInput: string)`: Normalize to 10 digits

**Unchanged Admin Functions:**
- All existing admin check-in functions remain identical
- `checkInVolunteer()`: Enhanced to track check-in method
- `getAssignmentsForDisplay()`: Include check-in method in display

**Request/Response Payloads:**
```typescript
interface LocationCheckInRequest {
  locationCode: string;
  contactInfo: string; // phone or email
  firstName?: string; // only when multiple volunteers
}

interface ContactVerificationResponse {
  requiresNameEntry: boolean;
  attemptCount: number;
  volunteerFound: boolean;
  errorMessage?: string;
}

interface VolunteerAssignmentResponse {
  volunteer: {
    id: string;
    firstName: string;
  };
  assignment: {
    sevaCategory: string;
    timeSlot: 'AM' | 'PM';
    location: string;
  };
  canCheckIn: boolean;
}
```

### 3.4. Hook Changes
**New Hooks for Self Check-In:**
- `useLocationCheckIn()`: Handle location-based check-in flow
- `useContactVerification()`: Manage contact info verification with attempt tracking
- `useVolunteerMatching()`: Handle first name matching for family members
- `useTimeSlotDetection()`: Determine AM/PM slot based on current time

**Unchanged Admin Hooks:**
- `useAssignments()`: Enhanced to show check-in method
- `useCheckInStatus()`: Include self-service indicators
- All other existing hooks remain unchanged

**State Managed:**
- Location code and assignment validation
- Contact verification with attempt counting
- First name entry and smart matching state
- Check-in confirmation and success states
- Error handling with detailed user feedback
- Time slot detection and validation

## 4. Implementation Tasks

**Phase 1: Database & Location-Based API Setup**
1. Add `check_in_method`, `location_code`, `attempt_count` columns to `volunteer_check_ins` table
2. Create location-based verification service functions
3. Implement contact verification with 3-attempt rate limiting
4. Create smart name matching service for family members
5. Build phone number normalization (10-digit) service
6. Create time slot detection service (AM/PM)
7. Write comprehensive unit tests for all verification services

**Phase 2: Self Check-In Interface**
8. Create new `/volunteer-checkin/[locationCode]` route and page component
9. Build contact verification form with phone normalization
10. Implement first name entry interface for family member matching
11. Build assignment confirmation component (location-specific)
12. Create success/error state components with detailed messaging
13. Add time slot detection and display

**Phase 3: Privacy & Security Implementation**
14. Implement stateless design with no session management
15. Add 3-attempt rate limiting per contact info
16. Create smart name matching with variation handling
17. Implement secure volunteer data handling (stateless)
18. Add comprehensive error handling with user-friendly messages
19. Implement location code validation and security

**Phase 4: Admin Interface Updates**
20. Update assignments table to show check-in method indicators
21. Enhance check-in status badges to differentiate self-service vs admin
22. Ensure all existing admin functionality remains unchanged
23. Add admin visibility into self-service check-in metrics

**Phase 5: Testing & Rollout**
24. Write integration tests for complete location-based flow
25. Test multiple family member scenarios with first name matching
26. Validate stateless design and data security measures
27. Test 3-attempt rate limiting and error handling
28. Test phone normalization and smart name matching
29. Conduct UAT with volunteers and admins
30. Test mobile responsiveness across devices
31. Deploy with feature flag for gradual rollout

## 5. Testing Plan

**Unit Tests:**
- Location-based contact verification with 3-attempt rate limiting
- Smart name matching for family members (handles registration variations)
- Phone number normalization (10-digit handling)
- Time slot detection (AM/PM based on current time)
- Stateless check-in completion
- Error handling for all verification steps

**Integration Tests:**
- Complete location-based self-service check-in flow
- Contact verification with first name matching
- Smart name matching with registration variations
- Stateless design validation (no session persistence)
- 3-attempt rate limiting and team lead redirection
- Mobile responsiveness across devices

**Security & Privacy Tests:**
- Stateless design security (no data persistence)
- Data exposure minimization during verification
- 3-attempt rate limiting effectiveness
- Contact information validation and normalization
- Prevention of unauthorized check-ins

**Manual Testing Scenarios:**
- Single volunteer location-based check-in
- Multiple family members with first name entry
- Invalid location codes and error handling
- Contact verification failures and retry logic
- Name matching variations and smart matching
- Phone number format variations and normalization
- Simultaneous self-service and admin check-ins
- Large event scenarios with 100+ volunteers

## 6. Resolved Design Decisions

**Resolved Design Decisions:**

1. **Contact Verification Method**: Phone (10-digit normalized) or email verification
   - Phone matching normalizes to 10 digits (handles +1, -, (), etc.)
   - Email verification uses exact match

2. **Family Member Privacy**: First name entry with smart matching
   - No family member selection display to protect privacy
   - Smart matching handles name variations (registration vs check-in)

3. **Session Management**: Stateless design - no sessions required
   - Allows volunteers to navigate to other screens (FAQs, notifications)
   - Simplifies architecture and improves scalability

4. **Rate Limiting**: 3 attempts per contact info, then redirect to team lead
   - Prevents abuse while allowing reasonable retry attempts

5. **Check-In Time Windows**: AM/PM slot detection based on current time
   - Automatically determines appropriate time slot

6. **Data Retention**: No session data - stateless verification
   - Check-in data stored normally, no verification session persistence

7. **Location Access**: QR codes at seva locations with URL parameters
   - Format: `/volunteer-checkin/{locationCode}`
   - No QR scanning needed within the check-in interface

8. **Error Handling**: Detailed error messages for common scenarios
   - Contact info mismatch, name matching failure, assignment validation

9. **Admin Notifications**: 3-attempt limit then direct to team lead
   - Clear escalation path for volunteers who can't self-check-in

10. **Performance Scale**: Stateless design supports 100+ simultaneous users
    - No session management overhead, database-optimized queries

## 7. Dependencies

**Other Features:**
- Existing volunteer registration system (for QR code data)
- Current assignments module (remains completely unchanged)
- Role-based access control system (for admin features)
- T-shirt module QR infrastructure (reuse existing components)
- Contact information validation system
- Location code management system

**External Libraries:**
- `qrcode.react` (already installed) - QR code generation for location codes
- Phone number normalization utility (to implement)
- No additional external dependencies required for core functionality

---

**Module Creation Process Reference:**
- Follow vertical slice architecture patterns from `ai-docs/ARCHITECTURE.md`
- Use component patterns from `ai-docs/REUSABLE_COMPONENTS.md`
- Apply coding standards from `ai-docs/STYLE_GUIDE.md`
- Reference database models from `ai-docs/DATA_MODELS.md`
- Use implementation planning template from `ai_prompts/PLAN_FEATURE_IMPLEMENTATION.md`

---
*Self-Review Checklist for AI Assistant:*
- [x] Does this specification align with `ai-docs/STYLE_GUIDE.md` and `ai-docs/ARCHITECTURE.md`?
- [x] Have I considered reusing existing components/hooks as per `ai-docs/REUSABLE_COMPONENTS.md`?
- [x] Are data models consistent with `DB_Documentation.md` and `ai-docs/DATA_MODELS.md`?
- [x] Is the plan detailed enough for implementation?
- [x] Are potential edge cases and error handling considered?