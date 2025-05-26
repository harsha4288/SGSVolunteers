-- Create requirements table
CREATE TABLE requirements (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    timeslot_id INTEGER NOT NULL REFERENCES timeslots(id) ON DELETE CASCADE, -- Assuming 'timeslots' table exists
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE, -- Assuming 'locations' table exists
    required_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_requirements_task_id ON requirements(task_id);
CREATE INDEX IF NOT EXISTS idx_requirements_timeslot_id ON requirements(timeslot_id);
CREATE INDEX IF NOT EXISTS idx_requirements_location_id ON requirements(location_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_requirements_task_timeslot_location ON requirements(task_id, timeslot_id, location_id);

-- Trigger to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_requirements_updated_at
BEFORE UPDATE ON requirements
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
