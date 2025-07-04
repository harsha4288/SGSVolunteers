# Requirements Test Data Population

## Status: Completed
**Completed Date:** 2025-06-18

## Overview
Populate test data in the requirements table based on volunteer count allocation for all AM and PM timeslots, excluding reference-only slots (ALLDAY and All Days).

## Requirements
- Generate requirement counts between 90-110% of allocated volunteer counts
- Target only AM/PM timeslots (exclude All Days and Full Day slots)
- **Hierarchical Structure**: Requirements must be populated at the generic level (location_id NULL) first
- **Location Constraints**: Location-specific requirements must be less than or equal to the generic level count for the same seva category and timeslot
- **Example**: If Parking 8th PM has a generic requirement of 10, then Event Center location can have at most 10 (not more)
- **Distribution Rule**: Sum of all location-specific requirements for a seva/timeslot cannot exceed the generic requirement count
- Provide review mechanism before inserting into actual table
- Clean existing test data before population
- Handle edge cases for slots with no volunteers

## Updated Solution (Hierarchical Structure)

### 1. Data Cleanup Query
```sql
-- Clean existing test data from requirements table
DELETE FROM requirements 
WHERE notes LIKE '%test%' 
   OR notes LIKE '%Test%'
   OR notes LIKE '%Generated from%'
   OR notes LIKE '%90-110%'
   OR notes LIKE '%volunteers (%';
```

### 2. Generic Level Requirements (Step 1)
```sql
-- First, modify requirements table to allow NULL location_id for generic requirements
ALTER TABLE requirements ALTER COLUMN location_id DROP NOT NULL;

-- Create temp table for generic level requirements (location_id NULL)
CREATE TEMP TABLE temp_generic_requirements AS
WITH am_pm_timeslots AS (
  SELECT id as timeslot_id, slot_name, description
  FROM time_slots 
  WHERE slot_name NOT IN ('All Days') 
    AND slot_name NOT LIKE '%Full%'
    AND slot_name NOT LIKE '%All Day%'
    AND (slot_name LIKE '%AM%' OR slot_name LIKE '%PM%')
),
volunteer_counts AS (
  SELECT 
    vc.seva_category_id,
    vc.time_slot_id,
    COUNT(*) as volunteer_count
  FROM volunteer_commitments vc
  WHERE vc.commitment_type = 'ASSIGNED_TASK'
    AND vc.time_slot_id IN (SELECT timeslot_id FROM am_pm_timeslots)
  GROUP BY vc.seva_category_id, vc.time_slot_id
),
requirements_calculation AS (
  SELECT 
    sc.id as seva_category_id,
    ts.timeslot_id,
    ts.slot_name,
    sc.category_name,
    COALESCE(vc.volunteer_count, 0) as volunteer_count,
    CASE 
      WHEN COALESCE(vc.volunteer_count, 0) = 0 
      THEN FLOOR(RANDOM() * 11) + 5  -- Random 5-15 for zero volunteers
      ELSE GREATEST(1, LEAST(50, 
        FLOOR(COALESCE(vc.volunteer_count, 0) * (0.9 + RANDOM() * 0.2))
      ))
    END as required_count
  FROM seva_categories sc
  CROSS JOIN am_pm_timeslots ts
  LEFT JOIN volunteer_counts vc ON sc.id = vc.seva_category_id 
    AND ts.timeslot_id = vc.time_slot_id
)
SELECT 
  seva_category_id,
  NULL::integer as location_id,  -- Generic level (NULL)
  timeslot_id,
  required_count,
  slot_name,
  category_name,
  volunteer_count,
  CONCAT(
    'Generic requirement for ', category_name, ' ', slot_name, 
    ' (based on ', volunteer_count, ' volunteers, 90-110% range)'
  ) as notes
FROM requirements_calculation
ORDER BY category_name, slot_name;
```

### 3. Location-Specific Requirements (Step 2)
```sql
-- Create temp table for location-specific requirements
CREATE TEMP TABLE temp_location_requirements AS
WITH location_counts AS (
  SELECT COUNT(*) as total_locations FROM locations WHERE name != 'General'
),
location_distribution AS (
  SELECT 
    tgr.seva_category_id,
    tgr.timeslot_id,
    tgr.required_count as generic_count,
    tgr.category_name,
    tgr.slot_name,
    l.id as location_id,
    l.name as location_name,
    ROW_NUMBER() OVER (PARTITION BY tgr.seva_category_id, tgr.timeslot_id ORDER BY RANDOM()) as location_rank,
    lc.total_locations
  FROM temp_generic_requirements tgr
  CROSS JOIN locations l
  CROSS JOIN location_counts lc
  WHERE tgr.required_count > 0
    AND l.name != 'General'  -- Exclude generic location entries if exists
),
proportional_distribution AS (
  SELECT 
    seva_category_id,
    location_id,
    timeslot_id,
    category_name,
    slot_name,
    location_name,
    generic_count,
    location_rank,
    total_locations,
    -- Distribute requirements proportionally to ensure sum <= generic_count
    CASE 
      WHEN location_rank <= (generic_count::INTEGER % total_locations::INTEGER) 
      THEN FLOOR(generic_count::DOUBLE PRECISION / total_locations::DOUBLE PRECISION) + 1
      ELSE FLOOR(generic_count::DOUBLE PRECISION / total_locations::DOUBLE PRECISION)
    END as base_requirement,
    -- Add some controlled randomness while keeping sum intact
    CASE 
      WHEN generic_count >= total_locations 
      THEN CASE 
        WHEN location_rank <= (generic_count::INTEGER % total_locations::INTEGER) 
        THEN FLOOR(generic_count::DOUBLE PRECISION / total_locations::DOUBLE PRECISION) + 1
        ELSE FLOOR(generic_count::DOUBLE PRECISION / total_locations::DOUBLE PRECISION)
      END
      ELSE CASE WHEN location_rank <= generic_count THEN 1 ELSE 0 END
    END as required_count
  FROM location_distribution
)
SELECT 
  seva_category_id,
  location_id,
  timeslot_id,
  required_count,
  slot_name,
  category_name,
  location_name,
  generic_count,
  CONCAT(
    'Location-specific requirement for ', category_name, ' at ', location_name, 
    ' ', slot_name, ' (', required_count, '/', generic_count, ' total)'
  ) as notes
FROM proportional_distribution
WHERE required_count > 0
ORDER BY category_name, location_name, slot_name;
```

### 4. Review Queries
```sql
-- Test: Verify distribution logic produces correct sums
SELECT 
  seva_category_id,
  category_name,
  slot_name,
  generic_count,
  SUM(required_count) as calculated_sum,
  CASE 
    WHEN SUM(required_count) = generic_count THEN 'PERFECT'
    WHEN SUM(required_count) < generic_count THEN 'UNDER (OK)'
    ELSE 'VIOLATION'
  END as distribution_test
FROM temp_location_requirements
GROUP BY seva_category_id, category_name, slot_name, generic_count
ORDER BY category_name, slot_name;

-- Review generic requirements
SELECT seva_category_id, category_name, slot_name, required_count, notes
FROM temp_generic_requirements
ORDER BY category_name, slot_name;

-- Review location requirements with constraint validation
SELECT 
  tlr.seva_category_id,
  tlr.category_name,
  tlr.slot_name,
  tlr.location_name,
  tlr.required_count as location_count,
  tgr.required_count as generic_count,
  CASE 
    WHEN tlr.required_count <= tgr.required_count THEN 'VALID'
    ELSE 'VIOLATION: Exceeds generic count'
  END as validation_status
FROM temp_location_requirements tlr
JOIN temp_generic_requirements tgr ON 
  tlr.seva_category_id = tgr.seva_category_id 
  AND tlr.timeslot_id = tgr.timeslot_id
ORDER BY tlr.category_name, tlr.location_name, tlr.slot_name;

-- Check sum of location requirements vs generic count
SELECT 
  tgr.seva_category_id,
  tgr.category_name,
  tgr.slot_name,
  tgr.required_count as generic_count,
  COALESCE(SUM(tlr.required_count), 0) as total_location_count,
  CASE 
    WHEN COALESCE(SUM(tlr.required_count), 0) <= tgr.required_count THEN 'VALID'
    ELSE 'VIOLATION: Total locations exceed generic'
  END as sum_validation
FROM temp_generic_requirements tgr
LEFT JOIN temp_location_requirements tlr ON 
  tgr.seva_category_id = tlr.seva_category_id 
  AND tgr.timeslot_id = tlr.timeslot_id
GROUP BY tgr.seva_category_id, tgr.category_name, tgr.slot_name, tgr.required_count
ORDER BY tgr.category_name, tgr.slot_name;
```

### 5. Final Insert Queries
```sql
-- Step 1: Insert generic requirements first
INSERT INTO requirements (seva_category_id, location_id, timeslot_id, required_count, notes)
SELECT seva_category_id, location_id, timeslot_id, required_count, notes
FROM temp_generic_requirements
ON CONFLICT (seva_category_id, location_id, timeslot_id) 
DO UPDATE SET 
  required_count = EXCLUDED.required_count,
  notes = EXCLUDED.notes;

-- Step 2: Insert location-specific requirements
INSERT INTO requirements (seva_category_id, location_id, timeslot_id, required_count, notes)
SELECT seva_category_id, location_id, timeslot_id, required_count, notes
FROM temp_location_requirements
ON CONFLICT (seva_category_id, location_id, timeslot_id) 
DO UPDATE SET 
  required_count = EXCLUDED.required_count,
  notes = EXCLUDED.notes;
```

### 6. Final Validation Query
```sql
-- Validate hierarchical constraints are maintained
SELECT 
  r_generic.seva_category_id,
  sc.category_name,
  ts.slot_name,
  r_generic.required_count as generic_count,
  COUNT(r_location.id) as location_entries,
  COALESCE(SUM(r_location.required_count), 0) as total_location_count,
  CASE 
    WHEN COALESCE(SUM(r_location.required_count), 0) <= r_generic.required_count THEN 'VALID'
    ELSE 'CONSTRAINT VIOLATION'
  END as validation_status
FROM requirements r_generic
JOIN seva_categories sc ON r_generic.seva_category_id = sc.id
JOIN time_slots ts ON r_generic.timeslot_id = ts.id
LEFT JOIN requirements r_location ON 
  r_generic.seva_category_id = r_location.seva_category_id 
  AND r_generic.timeslot_id = r_location.timeslot_id
  AND r_location.location_id IS NOT NULL
WHERE r_generic.location_id IS NULL
  AND r_generic.notes LIKE '%Generic requirement%'
GROUP BY r_generic.seva_category_id, sc.category_name, ts.slot_name, r_generic.required_count
ORDER BY sc.category_name, ts.slot_name;
```

## Timeslot Patterns Identified
Based on codebase analysis:
- **Short Format**: `8th PM`, `9th AM`, `10th AM`, `10th PM`, `11th AM`, `11th PM`, `12th AM`, `12th PM`
- **Excluded**: `All Days`, `9th Full`, `10th Full`, `11th Full`, `12th Full`
- **Event Duration**: July 8-12, 2025

## Database Schema Context
- **requirements table**: seva_category_id + location_id + timeslot_id (unique constraint)
- **volunteer_commitments**: Tracks ASSIGNED_TASK commitments for actual allocation counts
- **time_slots**: Contains slot_name patterns for filtering

## Implementation Notes
- **Two-Step Process**: Generic requirements created first, then location-specific requirements
- **Constraint Enforcement**: Location requirements automatically capped at generic level count
- **Validation Built-in**: Multiple validation queries ensure hierarchical constraints are maintained
- Uses PostgreSQL-specific functions (RANDOM(), FLOOR())
- Implements proper conflict resolution for existing records
- Maintains data integrity with foreign key relationships
- Provides comprehensive logging through notes field
- **Business Rule**: Sum of all location requirements for a seva/timeslot ≤ generic requirement count

## Files Referenced
- `/Data/SGSVolunteer_Supabase.sql` - Database schema
- `/Data/DataMigration.py` - Timeslot patterns and time definitions
- `/Data/README_TimeSlots.md` - Timeslot documentation

## Validation
- **Hierarchical Constraints**: Location requirements never exceed generic level counts
- **Distribution Validation**: Sum of location requirements ≤ generic requirement for each seva/timeslot
- Generated requirements respect 90-110% range of volunteer counts
- Minimum requirement of 1, maximum of 50 for safety
- Proper handling of zero-volunteer scenarios
- Comprehensive review mechanism before actual insertion
- **Multi-level Validation**: Individual location validation + sum validation + final constraint check