-- Add location_id to tasks table
-- Assumption: A 'locations' table with 'id' as primary key already exists or will be created separately.
ALTER TABLE tasks
ADD COLUMN location_id INTEGER REFERENCES locations(id);

-- Optional: Add an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_location_id ON tasks(location_id);
