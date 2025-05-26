-- SQL File: data_reporting_schema_views.sql
-- Description: Defines views for reporting purposes.

-- View 1: Detailed breakdown of requirements per location
CREATE OR REPLACE VIEW public.vw_requirement_details AS
SELECT
    req.id AS requirement_id,
    req.seva_category_id,
    sc.category_name AS task_name,
    req.location_id,
    loc.name AS location_name,
    req.timeslot_id,
    ts.slot_name AS timeslot_slot_name,
    ts.description AS timeslot_description,
    req.required_count,
    COALESCE(avail.total_available_for_seva_timeslot, 0) AS total_available_for_seva_timeslot
FROM
    public.requirements req
JOIN
    public.seva_categories sc ON req.seva_category_id = sc.id
JOIN
    public.locations loc ON req.location_id = loc.id
JOIN
    public.time_slots ts ON req.timeslot_id = ts.id
LEFT JOIN LATERAL (
    SELECT COUNT(DISTINCT vc.volunteer_id) AS total_available_for_seva_timeslot
    FROM public.volunteer_commitments vc
    WHERE 
        vc.time_slot_id = req.timeslot_id AND
        vc.seva_category_id = req.seva_category_id AND
        vc.commitment_type IN ('PROMISED_AVAILABILITY', 'ASSIGNED_TASK')
) avail ON TRUE;

COMMENT ON VIEW public.vw_requirement_details IS 
'Shows detailed breakdown of volunteer requirements for each Seva Category (Task), specific location, and timeslot. Includes total availability for the parent Seva Category/Timeslot combination for context.';


-- View 2: Summary Variance at Seva Category / Timeslot level
CREATE OR REPLACE VIEW public.vw_seva_timeslot_variance_summary AS
WITH AggregatedRequirements AS (
    SELECT
        r.seva_category_id,
        r.timeslot_id,
        SUM(r.required_count) AS total_required_count
    FROM
        public.requirements r
    GROUP BY
        r.seva_category_id,
        r.timeslot_id
),
AggregatedAvailability AS (
    SELECT
        vc.seva_category_id,
        vc.timeslot_id,
        COUNT(DISTINCT vc.volunteer_id) AS total_available_volunteers
    FROM
        public.volunteer_commitments vc
    WHERE
        vc.commitment_type IN ('PROMISED_AVAILABILITY', 'ASSIGNED_TASK')
    GROUP BY
        vc.seva_category_id,
        vc.timeslot_id
)
SELECT
    ar.seva_category_id,
    sc.category_name AS task_name,
    ar.timeslot_id,
    ts.slot_name AS timeslot_slot_name,
    ts.description AS timeslot_description,
    COALESCE(ar.total_required_count, 0) AS total_required_count,
    COALESCE(aa.total_available_volunteers, 0) AS total_available_volunteers,
    (COALESCE(aa.total_available_volunteers, 0) - COALESCE(ar.total_required_count, 0)) AS overall_variance
FROM
    AggregatedRequirements ar
LEFT JOIN
    AggregatedAvailability aa ON ar.seva_category_id = aa.seva_category_id AND ar.timeslot_id = aa.timeslot_id
JOIN
    public.seva_categories sc ON ar.seva_category_id = sc.id
JOIN
    public.time_slots ts ON ar.timeslot_id = ts.id;

COMMENT ON VIEW public.vw_seva_timeslot_variance_summary IS 
'Summarizes volunteer requirements vs. availability at the Seva Category (Task) and Timeslot level, providing an overall variance. This is the primary view for understanding true shortfalls or surpluses.';


-- View 3: Assignments vs. Actual Attendance
CREATE OR REPLACE VIEW public.vw_assignments_vs_attendance AS
WITH TaskAssignments AS (
    SELECT
        vc.volunteer_id,
        v.first_name || ' ' || v.last_name AS volunteer_name,
        vc.time_slot_id,
        ts.slot_name AS timeslot_slot_name,
        ts.description AS timeslot_description,
        ts.start_time AS timeslot_start_time,
        ts.end_time AS timeslot_end_time,
        vc.seva_category_id, 
        sc.category_name AS task_name,
        COALESCE(sc.location_id, (SELECT id FROM public.locations WHERE name = 'Unassigned' LIMIT 1)) AS assigned_location_id,
        (SELECT name FROM public.locations WHERE id = COALESCE(sc.location_id, (SELECT id FROM public.locations WHERE name = 'Unassigned' LIMIT 1))) AS assigned_location_name
    FROM
        public.volunteer_commitments vc
    JOIN
        public.volunteers v ON vc.volunteer_id = v.id
    JOIN
        public.time_slots ts ON vc.time_slot_id = ts.id
    JOIN
        public.seva_categories sc ON vc.seva_category_id = sc.id
    WHERE
        vc.commitment_type = 'ASSIGNED_TASK'
),
VolunteerAttendance AS (
    SELECT
        vci.volunteer_id,
        e.id AS event_id,
        MIN(vci.check_in_time) AS first_check_in,
        MAX(vci.check_out_time) AS last_check_out 
    FROM
        public.volunteer_check_ins vci
    JOIN public.events e ON vci.event_id = e.id
    GROUP BY
        vci.volunteer_id, e.id
)
SELECT
    ta.seva_category_id AS task_id, 
    ta.task_name,
    ta.timeslot_slot_name,
    ta.timeslot_description,
    ta.assigned_location_id,
    ta.assigned_location_name,
    COUNT(DISTINCT ta.volunteer_id) AS assigned_volunteers_count,
    COUNT(DISTINCT CASE 
                            WHEN va.volunteer_id IS NOT NULL AND 
                                 ts_event.id = va.event_id AND 
                                 (va.first_check_in <= ta.timeslot_end_time AND COALESCE(va.last_check_out, va.first_check_in + INTERVAL '24 hour') >= ta.timeslot_start_time)
                            THEN ta.volunteer_id 
                            ELSE NULL 
                          END) AS actual_attendance_count
FROM
    TaskAssignments ta
JOIN 
    public.time_slots ts_event ON ta.time_slot_id = ts_event.id
LEFT JOIN
    VolunteerAttendance va ON ta.volunteer_id = va.volunteer_id AND ts_event.event_id = va.event_id
GROUP BY
    ta.seva_category_id,
    ta.task_name,
    ta.timeslot_slot_name,
    ta.timeslot_description,
    ta.assigned_location_id,
    ta.assigned_location_name;

COMMENT ON VIEW public.vw_assignments_vs_attendance IS 
'Compares volunteers assigned to a Seva Category/Timeslot against actual attendance. Attendance is counted if a volunteer checked-in during any part of the assigned timeslot for the corresponding event.';
