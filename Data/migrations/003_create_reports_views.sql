-- View for Requirements vs Availability
-- This view will need to join 'requirements' with a table that shows 'availability'
-- Assuming 'volunteer_assignments' or a similar table tracks availability per task/timeslot/location
CREATE OR REPLACE VIEW vw_requirements_vs_availability AS
SELECT
    r.task_id,
    t.name AS task_name,
    r.timeslot_id,
    ts.name AS timeslot_name, -- Assuming timeslots table has a 'name' column
    r.location_id,
    l.name AS location_name, -- Assuming locations table has a 'name' column
    r.required_count,
    COALESCE(SUM(CASE WHEN va.status = 'assigned' THEN 1 ELSE 0 END), 0) AS available_volunteers -- Example: count from 'volunteer_assignments'
    -- Add other relevant fields from tasks, timeslots, locations
FROM
    requirements r
JOIN
    tasks t ON r.task_id = t.id
JOIN
    timeslots ts ON r.timeslot_id = ts.id -- Assuming join to timeslots
JOIN
    locations l ON r.location_id = l.id   -- Assuming join to locations
LEFT JOIN
    volunteer_assignments va ON r.task_id = va.task_id AND r.timeslot_id = va.timeslot_id AND r.location_id = va.location_id -- This join needs to be adapted based on actual availability tracking
GROUP BY
    r.task_id, t.name, r.timeslot_id, ts.name, r.location_id, l.name, r.required_count;

-- View for Availability vs Actual Attendance
-- This view will need 'volunteer_assignments' and a way to track 'actual_attendance'
-- Assuming 'volunteer_assignments' has an 'attended' status or similar
CREATE OR REPLACE VIEW vw_availability_vs_actual_attendance AS
SELECT
    va.task_id,
    t.name AS task_name,
    va.timeslot_id,
    ts.name AS timeslot_name,
    va.location_id,
    l.name AS location_name,
    COALESCE(COUNT(va.volunteer_id), 0) AS assigned_volunteers, -- Total assigned/available
    COALESCE(SUM(CASE WHEN va.status = 'attended' THEN 1 ELSE 0 END), 0) AS actual_attendance -- Example: count from 'volunteer_assignments' where status is 'attended'
    -- Add other relevant fields
FROM
    volunteer_assignments va -- Assuming this table tracks assignments and attendance
JOIN
    tasks t ON va.task_id = t.id
JOIN
    timeslots ts ON va.timeslot_id = ts.id
JOIN
    locations l ON va.location_id = l.id
GROUP BY
    va.task_id, t.name, va.timeslot_id, ts.name, va.location_id, l.name;

-- Note: The definitions for 'volunteer_assignments', 'tasks', 'timeslots', and 'locations' tables
-- (especially columns like 'name', 'status', 'volunteer_id') are assumed.
-- These views may need adjustment based on the exact schema of those tables.
