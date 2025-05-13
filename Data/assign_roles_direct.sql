-- Direct SQL script to assign roles to specific users
-- This script assumes the profiles already exist in the database
-- This script will:
-- 1. Assign Admin role to user with email datta.rajesh@gmail.com
-- 2. Assign Team Lead role to user with email harshayarlagadda2@gmail.com

-- Assign Admin role (ID: 1) to datta.rajesh@gmail.com
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

-- Assign Team Lead role (ID: 2) to harshayarlagadda2@gmail.com
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

-- Verify the assignments
SELECT 
    p.email, 
    r.role_name, 
    pr.assigned_at
FROM 
    public.profile_roles pr
JOIN 
    public.profiles p ON pr.profile_id = p.id
JOIN 
    public.roles r ON pr.role_id = r.id
WHERE 
    p.email IN ('datta.rajesh@gmail.com', 'harshayarlagadda2@gmail.com')
ORDER BY 
    p.email, r.role_name;
