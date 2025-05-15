-- Add description field to time_slots table
ALTER TABLE public.time_slots ADD COLUMN description TEXT;
COMMENT ON COLUMN public.time_slots.description IS 'Full descriptive name of the time slot (e.g., "8th July (Tuesday) - Evening")';

-- Update existing time slots to set description = slot_name for now
UPDATE public.time_slots SET description = slot_name;
