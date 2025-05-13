-- SQL script to assign the Admin role to a user

-- First, check if the Admin role exists
SELECT * FROM public.roles WHERE role_name = 'Admin';

-- If the Admin role doesn't exist, create it
INSERT INTO public.roles (id, role_name, description, created_at, updated_at)
SELECT 1, 'Admin', 'Full administrative access to all features', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE role_name = 'Admin');

-- Get the profile ID for the user
SELECT id FROM public.profiles WHERE email = 'datta.rajesh@gmail.com';

-- Assign the Admin role to the user
-- Replace 'PROFILE_ID_HERE' with the actual profile ID from the previous query
INSERT INTO public.profile_roles (profile_id, role_id, assigned_at)
SELECT 'PROFILE_ID_HERE', 1, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.profile_roles 
    WHERE profile_id = 'PROFILE_ID_HERE' AND role_id = 1
);

-- Verify the assignment
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
WHERE 
    p.email = 'datta.rajesh@gmail.com';
