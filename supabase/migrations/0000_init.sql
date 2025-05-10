-- Create Volunteers Table
CREATE TABLE public.volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    notes TEXT,
    gm_family BOOLEAN DEFAULT FALSE, -- Gita Mahāyajña family membership flag
    location TEXT -- Primary location
);

-- Create Availability Table (Junction table for Volunteers and Shifts/Slots)
CREATE TABLE public.availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE CASCADE NOT NULL,
    event_date DATE NOT NULL,
    time_slot TEXT NOT NULL, -- e.g., 'Morning', 'Afternoon', 'Evening', '9AM-1PM'
    is_available BOOLEAN DEFAULT TRUE,
    task_assigned TEXT, -- Stores the task assigned for this specific availability slot
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (volunteer_id, event_date, time_slot) -- Ensure a volunteer can only have one entry per slot
);

-- Create T-Shirts Table (Inventory)
CREATE TABLE public.t_shirts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    size TEXT NOT NULL, -- e.g., 'S', 'M', 'L', 'XL'
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (size) -- Ensure only one entry per size for quantity tracking
);

-- Create T-Shirt Issuance Log Table
CREATE TABLE public.t_shirt_issuance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE CASCADE NOT NULL,
    t_shirt_size TEXT NOT NULL, -- The size of the t-shirt issued
    issued_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    issued_by TEXT, -- Could be team leader ID, admin, or 'QR_SCANNER'
    notes TEXT,
    UNIQUE (volunteer_id) -- Assuming one T-shirt per volunteer for this event
);

-- Create Check-ins Table
CREATE TABLE public.check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE CASCADE NOT NULL,
    availability_id UUID REFERENCES public.availability(id) ON DELETE SET NULL, -- Link to specific scheduled slot if available
    event_date DATE NOT NULL,
    time_slot TEXT NOT NULL, -- Should match an availability slot or general check-in time
    checked_in_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    checked_in_by TEXT, -- Team leader ID or system
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (volunteer_id, event_date, time_slot) -- Prevent duplicate check-ins for the same slot
);

-- Create Teams Table (Optional, if managing teams formally)
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    leader_id UUID REFERENCES public.volunteers(id) ON DELETE SET NULL, -- A volunteer can be a team leader
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create Volunteer Teams Table (Junction table if a volunteer can be in multiple teams)
CREATE TABLE public.volunteer_teams (
    volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (volunteer_id, team_id)
);


-- Function to automatically update 'updated_at' timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for 'updated_at'
CREATE TRIGGER update_volunteers_updated_at
BEFORE UPDATE ON public.volunteers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_availability_updated_at
BEFORE UPDATE ON public.availability
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_t_shirts_updated_at
BEFORE UPDATE ON public.t_shirts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_check_ins_updated_at
BEFORE UPDATE ON public.check_ins
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.t_shirts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.t_shirt_issuance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_teams ENABLE ROW LEVEL SECURITY;

-- POLICIES
-- Volunteers:
-- 1. Authenticated users can view all volunteers (adjust if needed for privacy)
CREATE POLICY "Allow authenticated users to read volunteers"
ON public.volunteers
FOR SELECT
TO authenticated
USING (true);

-- 2. Users can insert their own volunteer profile (if self-registration is allowed)
-- This might be handled by a backend service using service_role key for Google Forms sync.
-- For direct app interaction where a user registers themselves:
-- CREATE POLICY "Allow users to insert their own volunteer data"
-- ON public.volunteers
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (auth.uid() = id); -- Assuming 'id' in volunteers table matches auth.uid() or a mapping exists

-- 3. Users can update their own volunteer profile
-- CREATE POLICY "Allow users to update their own volunteer data"
-- ON public.volunteers
-- FOR UPDATE
-- TO authenticated
-- USING (auth.uid() = id)
-- WITH CHECK (auth.uid() = id);

-- 4. Admin/Service role can manage all volunteer data (usually handled by service_role key, no explicit policy needed for that role)


-- T-Shirts:
-- 1. Authenticated users can read T-shirt inventory
CREATE POLICY "Allow authenticated users to read t-shirt inventory"
ON public.t_shirts
FOR SELECT
TO authenticated
USING (true);
-- 2. Admins/Service role can update T-shirt quantities (handled by service_role key)


-- T-Shirt Issuance Log:
-- 1. Authenticated users (volunteers) can create their own T-shirt issuance log entry (e.g., when they request/confirm via QR)
CREATE POLICY "Allow volunteers to create their own t-shirt issuance log"
ON public.t_shirt_issuance_log
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.volunteers v WHERE v.id = volunteer_id AND v.email = auth.email())); -- Check if volunteer_id matches the logged-in user's record

-- 2. Authenticated users can view their own T-shirt issuance log
CREATE POLICY "Allow volunteers to view their own t-shirt issuance log"
ON public.t_shirt_issuance_log
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.volunteers v WHERE v.id = volunteer_id AND v.email = auth.email()));

-- 3. Admins/Team Leaders might need broader access (consider specific roles or service_role)
-- Example: Allow a user with a 'team_leader' custom claim to read all issuance logs
-- CREATE POLICY "Allow team leaders to read all t-shirt issuance logs"
-- ON public.t_shirt_issuance_log
-- FOR SELECT
-- TO authenticated
-- USING (auth.jwt() ->> 'user_metadata' ->> 'role' = 'team_leader');


-- Availability:
-- 1. Authenticated users can view all availability (or their own/team's if more granular)
CREATE POLICY "Allow authenticated users to read availability"
ON public.availability
FOR SELECT
TO authenticated
USING (true);
-- 2. Volunteers can insert/update their own availability
CREATE POLICY "Allow volunteers to manage their own availability"
ON public.availability
FOR ALL -- INSERT, UPDATE, DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.volunteers v WHERE v.id = volunteer_id AND v.email = auth.email()))
WITH CHECK (EXISTS (SELECT 1 FROM public.volunteers v WHERE v.id = volunteer_id AND v.email = auth.email()));


-- Check-ins:
-- 1. Team leaders / Admins can create check-in records
-- This typically requires a custom role or service key. For simplicity, assuming authenticated users with specific UI can.
-- A more robust policy would check a custom claim for 'role' = 'team_leader'
CREATE POLICY "Allow authenticated users to create check-ins" -- Potentially restrict to team leaders
ON public.check_ins
FOR INSERT
TO authenticated
WITH CHECK (true); -- Add role check here if needed: (auth.jwt() ->> 'user_metadata' ->> 'role' = 'team_leader')

-- 2. Authenticated users can view check-ins (e.g., team leaders view their team, volunteers view their own)
CREATE POLICY "Allow authenticated users to read check-ins"
ON public.check_ins
FOR SELECT
TO authenticated
USING (true); -- Adjust for team/self visibility: (EXISTS (SELECT 1 FROM public.volunteers v WHERE v.id = volunteer_id AND v.email = auth.email())) OR (auth.jwt() ->> 'user_metadata' ->> 'role' = 'team_leader')


-- Teams & VolunteerTeams (if used):
-- Policies would depend on how teams are managed (e.g., admins create teams, leaders manage members)
CREATE POLICY "Allow authenticated users to read teams"
ON public.teams
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to read volunteer_teams"
ON public.volunteer_teams
FOR SELECT
TO authenticated
USING (true);


-- Example data for T-Shirts (run once after table creation if needed)
-- INSERT INTO public.t_shirts (size, quantity) VALUES
-- ('S', 200),
-- ('M', 300),
-- ('L', 300),
-- ('XL', 150),
-- ('XXL', 50)
-- ON CONFLICT (size) DO NOTHING;

-- Note: For a real application, user management (profiles table linked to auth.users)
-- and more granular RLS policies based on user roles (e.g., admin, team_leader, volunteer)
-- would be essential. The policies above are basic examples.
-- For instance, updating volunteer data from Google Forms would typically be done
-- by a backend script using the 'service_role' key, which bypasses RLS.
-- Direct updates by users to their own profiles would need policies like:
-- CREATE POLICY "Users can update their own profile."
--   ON public.volunteers FOR UPDATE USING (auth.email() = email);

-- Storage for QR codes (if generating and storing them)
-- Supabase Storage is implicitly RLS enabled. Buckets and policies need to be configured via Supabase Dashboard or storage API.
-- Example: A 'qrcodes' bucket.
-- Policy: "Allow authenticated users to read their own QR code"
-- (volunteer_id = auth.uid() OR folder[1] = auth.uid()) -- if storing files like /user_id/qr.png

-- Consider creating specific roles in PostgreSQL for finer-grained access control if needed,
-- though Supabase's RLS with custom claims in JWTs is often sufficient.
