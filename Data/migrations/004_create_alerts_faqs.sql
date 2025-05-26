-- Create alerts table
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    timeslot_id_filter INTEGER REFERENCES timeslots(id) ON DELETE SET NULL, -- Optional filter
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to update 'updated_at' timestamp for alerts
CREATE TRIGGER update_alerts_updated_at
BEFORE UPDATE ON alerts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); -- Assumes function from 002_create_requirements.sql

-- Create faqs table
CREATE TABLE faqs (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    timeslot_id_filter INTEGER REFERENCES timeslots(id) ON DELETE SET NULL, -- Optional filter
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to update 'updated_at' timestamp for faqs
CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON faqs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); -- Assumes function from 002_create_requirements.sql

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_alerts_category ON alerts(category);
CREATE INDEX IF NOT EXISTS idx_alerts_timeslot_id_filter ON alerts(timeslot_id_filter);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_timeslot_id_filter ON faqs(timeslot_id_filter);
