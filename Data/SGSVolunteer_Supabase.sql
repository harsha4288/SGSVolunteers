-- SGS Volunteers Database Schema
-- Main schema file for SGS Volunteers application
-- This file contains the core table definitions and constraints

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Volunteer Check-ins table
-- Records volunteer attendance for specific time slots within events, marked by team leaders.
-- Updated to include time_slot_id for proper attendance tracking per time slot
CREATE TABLE IF NOT EXISTS public.volunteer_check_ins (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    time_slot_id BIGINT REFERENCES public.time_slots(id) ON DELETE SET NULL, -- Links to specific time slot for attendance tracking
    recorded_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Team leader who marked attendance
    check_in_time TIMESTAMPTZ NOT NULL, -- Timestamp of when the volunteer checked in
    check_out_time TIMESTAMPTZ, -- Timestamp of check-out. NULL if currently checked in, or used to mark as absent
    location TEXT, -- Location or task description for the check-in
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments for volunteer_check_ins table
COMMENT ON TABLE public.volunteer_check_ins IS 'Records volunteer attendance for specific time slots within events, marked by team leaders.';
COMMENT ON COLUMN public.volunteer_check_ins.volunteer_id IS 'ID of the volunteer being checked in.';
COMMENT ON COLUMN public.volunteer_check_ins.event_id IS 'ID of the event for which attendance is being recorded.';
COMMENT ON COLUMN public.volunteer_check_ins.time_slot_id IS 'ID of the specific time slot for which attendance is being recorded. NULL for event-level check-ins.';
COMMENT ON COLUMN public.volunteer_check_ins.recorded_by_profile_id IS 'ID of the team leader (from public.profiles) who performed the check-in.';
COMMENT ON COLUMN public.volunteer_check_ins.check_in_time IS 'Timestamp when the volunteer checked in.';
COMMENT ON COLUMN public.volunteer_check_ins.check_out_time IS 'Timestamp when marked as absent. NULL means checked in and present.';
COMMENT ON COLUMN public.volunteer_check_ins.location IS 'Location or task description for the check-in.';

-- Indexes for volunteer_check_ins table
CREATE INDEX IF NOT EXISTS idx_volunteer_check_ins_volunteer_id ON public.volunteer_check_ins(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_check_ins_event_id ON public.volunteer_check_ins(event_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_check_ins_time_slot_id ON public.volunteer_check_ins(time_slot_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_check_ins_volunteer_timeslot ON public.volunteer_check_ins(volunteer_id, time_slot_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_check_ins_recorded_by ON public.volunteer_check_ins(recorded_by_profile_id);

-- Note: This table structure fixes the issue where attendance taken on one time slot
-- was incorrectly showing for all time slots. The time_slot_id field ensures each
-- check-in record is linked to a specific time slot, providing accurate attendance tracking.