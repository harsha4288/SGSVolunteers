# Feature Specification: T-Shirt Request Notes

## 1. Overview
    - **Summary:** Allow volunteers to add a short note to their T-shirt size preferences. Admins will be able to see these notes.
    - **Goals:**
        - Provide a way for volunteers to communicate specific needs or reasons related to their T-shirt choice (e.g., "prefer looser fit", "collecting for family member X").
        - Improve information for admins managing T-shirt distribution.
    - **Non-Goals:**
        - This is not for general chat or complex requests. Notes should be brief.
        - Does not change the T-shirt allocation or issuance process directly.
    - **Success Metrics:**
        - Percentage of T-shirt preferences that include notes (if applicable).
        - Qualitative feedback from admins on usefulness of notes.

## 2. Detailed Description
    - **User Stories:**
        - "As a Volunteer, I want to add a small note to my T-shirt size preference so I can specify why I chose a particular size or if I have a special consideration."
        - "As an Admin, I want to see any notes associated with a volunteer's T-shirt preference so I can better understand their needs during distribution."
    - **Current Behavior (if applicable):** Volunteers can select T-shirt sizes and quantities based on their allocation. There is no field for notes. Admins see selected preferences and can issue T-shirts.
    - **Proposed Behavior:**
        - **Volunteer View:** When a volunteer selects a T-shirt size in the `UnifiedTShirtTable`, an optional text input field will appear allowing them to add a short note (e.g., max 100 characters). This note is saved along with their preference. They can edit/delete this note.
        - **Admin View:** In the `UnifiedTShirtTable`, when viewing volunteer preferences, admins will see an icon or truncated version of the note. Clicking it could reveal the full note in a tooltip or small popover. This note is read-only for admins in this view.
    - **Edge Cases & Error Handling:**
        - Note exceeds character limit: UI should prevent further input and show a warning.
        - Saving note fails: Display an error toast.

## 3. Technical Details

### 3.1. UI/UX Design (if applicable)
    - **Key UI Components:**
        - **Volunteer View (`UnifiedTShirtTable`):**
            - Modify the section where preferences are displayed/edited.
            - Add a small `Input` or `Textarea` component for the note, appearing when a size is selected.
            - Character counter for the note field.
        - **Admin View (`UnifiedTShirtTable`):**
            - Add a `Tooltip` or `Popover` from `@/components/ui/` to display the note when hovering/clicking an icon next to the preference.
            - An icon (e.g., `FileText` from lucide-react) to indicate a note exists.
    - **User Flow:**
        - Volunteer: Clicks on a T-shirt size to add/edit preference -> Note input appears -> Types note -> Saves preference (note saves with it).
        - Admin: Views T-shirt table -> Sees note icon next to a preference -> Hovers/clicks to view note.

### 3.2. Data Model Changes (if applicable)
    - **Database Tables Affected:** `volunteer_tshirts` (currently stores preferences and issuances).
    - **New Columns/Relationships:**
        - Add a new column `notes` (TEXT, nullable) to the `volunteer_tshirts` table. This column will store the note associated with a 'preferred' status entry.
    - **Data Validation:**
        - Database level: Optional, but application layer should enforce character limit (e.g., 100 chars).

### 3.3. API/Service Layer Changes (if applicable)
    - **Modified Endpoints/Functions:**
        - The existing Supabase functions `add_tshirt_preference` and `remove_tshirt_preference` (or the generic `manageTShirt` / `removeTShirt` in `unified-tshirt-service.ts` if it calls these) will need to be updated to accept and store/clear the `notes` field.
        - The `fetchTShirtData` function in `unified-tshirt-service.ts` will need to be updated to select the `notes` field.
    - **Request/Response Payloads:**
        - Payloads for adding/updating preferences will include an optional `notes: string` field.
        - Data returned by `fetchTShirtData` will include the `notes` field for each preference.

### 3.4. Hook Changes (if applicable)
    - **Modified Hooks:** `useUnifiedTShirtData` (`src/app/app/tshirts/hooks/use-unified-tshirt-data.ts`)
        - State will need to be updated to store and manage notes for preferences.
        - Functions like `handleAddPreference`, `handleRemovePreference`, `handleSetQuantity` will need to handle the `notes` field.
        - The hook should expose the note to the `UnifiedTShirtTable` component.

## 4. Implementation Tasks
    1. **DB Migration:** Add `notes TEXT NULL` column to `public.volunteer_tshirts` table. Update relevant RLS policies if needed.
    2. **Service Update:** Modify `unified-tshirt-service.ts` to include `notes` in `addPreference` (and underlying RPC calls) and fetch `notes` in `fetchTShirtData`.
    3. **Hook Update:** Update `useUnifiedTShirtData.ts` to manage `notes` in its state and pass it to/from the service layer.
    4. **Component Update (Volunteer View):** Modify `UnifiedTShirtTable.tsx` to add a note input field for volunteers when they set preferences.
    5. **Component Update (Admin View):** Modify `UnifiedTShirtTable.tsx` to display notes (e.g., via tooltip/popover) for admins.
    6. **Testing:** Add unit tests for hook changes, service changes, and component display logic for notes.

## 5. Testing Plan
    - **Unit Tests:**
        - `useUnifiedTShirtData`: Test adding/removing/updating preferences with notes.
        - `UnifiedTShirtTable`: Test display of note input for volunteers and note display for admins.
    - **Integration Tests:**
        - Test that notes are correctly saved to and fetched from Supabase via the service.
    - **Manual Testing Scenarios:**
        - Volunteer adds a note, saves, reloads, note persists.
        - Volunteer edits a note.
        - Volunteer removes preference, note is removed.
        - Admin can view the note.
        - Note character limit is enforced.

## 6. Open Questions & Discussion Points
    - Exact placement and styling of the note icon/display for admins.
    - Should notes be searchable by admins? (Out of scope for this iteration, but for future consideration).

## 7. Dependencies
    - None.

---
*Self-Review Checklist for AI Assistant:*
- [X] Does this specification align with `ai-docs/STYLE_GUIDE.md` and `ai-docs/ARCHITECTURE.md`? (Assuming they exist as per plan)
- [X] Have I considered reusing existing components/hooks as per `ai-docs/REUSABLE_COMPONENTS.md`? (e.g., Input, Tooltip)
- [X] Are data models consistent with `DB_Documentation.md` and `ai-docs/DATA_MODELS.md`? (Proposing a change, which is documented)
- [X] Is the plan detailed enough for implementation?
- [X] Are potential edge cases and error handling considered?
