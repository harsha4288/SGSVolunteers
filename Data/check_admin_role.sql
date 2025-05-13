-- SQL script to check if the admin role is correctly assigned

-- Check if the roles table has the expected values
SELECT * FROM public.roles;

-- Check if datta.rajesh@gmail.com has the admin role
SELECT 
    p.id AS profile_id,
    p.email,
    p.user_id,
    r.id AS role_id,
    r.role_name
FROM 
    public.profiles p
LEFT JOIN 
    public.profile_roles pr ON p.id = pr.profile_id
LEFT JOIN 
    public.roles r ON pr.role_id = r.id
WHERE 
    p.email = 'datta.rajesh@gmail.com';

-- Check all users with admin role
SELECT 
    p.id AS profile_id,
    p.email,
    p.user_id,
    r.id AS role_id,
    r.role_name
FROM 
    public.profiles p
JOIN 
    public.profile_roles pr ON p.id = pr.profile_id
JOIN 
    public.roles r ON pr.role_id = r.id
WHERE 
    r.role_name = 'Admin';

-- Check if the admin role assignment script was executed
SELECT 
    COUNT(*) AS admin_role_count
FROM 
    public.profile_roles pr
JOIN 
    public.roles r ON pr.role_id = r.id
WHERE 
    r.role_name = 'Admin';
