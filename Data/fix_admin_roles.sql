-- SQL script to fix admin roles

-- Make sure the roles table has the correct entries
INSERT INTO public.roles (id, role_name, description, created_at, updated_at)
VALUES 
    (1, 'Admin', 'Full administrative access to all features', NOW(), NOW()),
    (2, 'Team Lead', 'Leads a specific team or seva category, can manage check-ins/T-shirts for their area.', NOW(), NOW()),
    (3, 'Volunteer', 'Standard volunteer user.', NOW(), NOW())
ON CONFLICT (id) DO UPDATE 
SET role_name = EXCLUDED.role_name, 
    description = EXCLUDED.description,
    updated_at = NOW();

-- Assign Admin role to datta.rajesh@gmail.com
INSERT INTO public.profile_roles (profile_id, role_id, assigned_at)
SELECT 
    p.id, 
    1, -- Admin role ID
    NOW()
FROM 
    public.profiles p
WHERE 
    p.email = 'datta.rajesh@gmail.com'
AND 
    NOT EXISTS (
        SELECT 1 
        FROM public.profile_roles pr 
        WHERE pr.profile_id = p.id AND pr.role_id = 1
    );

-- Assign Team Lead role to harshayarlagadda2@gmail.com
INSERT INTO public.profile_roles (profile_id, role_id, assigned_at)
SELECT 
    p.id, 
    2, -- Team Lead role ID
    NOW()
FROM 
    public.profiles p
WHERE 
    p.email = 'harshayarlagadda2@gmail.com'
AND 
    NOT EXISTS (
        SELECT 1 
        FROM public.profile_roles pr 
        WHERE pr.profile_id = p.id AND pr.role_id = 2
    );

-- Assign Volunteer role to all profiles that don't have any role
INSERT INTO public.profile_roles (profile_id, role_id, assigned_at)
SELECT 
    p.id, 
    3, -- Volunteer role ID
    NOW()
FROM 
    public.profiles p
WHERE 
    NOT EXISTS (
        SELECT 1 
        FROM public.profile_roles pr 
        WHERE pr.profile_id = p.id
    );

-- Create or replace the trigger function for assigning default volunteer role
CREATE OR REPLACE FUNCTION assign_default_volunteer_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert the Volunteer role (ID: 3) for the new profile
    INSERT INTO public.profile_roles (profile_id, role_id, assigned_at)
    VALUES (NEW.id, 3, NOW());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trg_assign_default_volunteer_role ON public.profiles;

-- Create the trigger on the profiles table
CREATE TRIGGER trg_assign_default_volunteer_role
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION assign_default_volunteer_role();

-- Verify the assignments
SELECT 
    p.id AS profile_id,
    p.email,
    r.id AS role_id,
    r.role_name
FROM 
    public.profiles p
JOIN 
    public.profile_roles pr ON p.id = pr.profile_id
JOIN 
    public.roles r ON pr.role_id = r.id
ORDER BY 
    p.email, r.role_name;
