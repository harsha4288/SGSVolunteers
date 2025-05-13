-- SQL script to check roles in the database

-- Check all roles in the system
SELECT * FROM public.roles;

-- Check all profile_roles assignments
SELECT 
    pr.profile_id,
    pr.role_id,
    r.role_name,
    p.email,
    p.user_id
FROM 
    public.profile_roles pr
JOIN 
    public.roles r ON pr.role_id = r.id
JOIN 
    public.profiles p ON pr.profile_id = p.id
ORDER BY 
    p.email, r.role_name;

-- Check if datta.rajesh@gmail.com has the Admin role
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

-- Check all users with Admin role
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

-- Check all profiles
SELECT 
    id, 
    email, 
    user_id, 
    display_name
FROM 
    public.profiles;

-- Check if the admin role assignment trigger is working
SELECT 
    COUNT(*) AS profiles_count,
    (SELECT COUNT(*) FROM public.profile_roles WHERE role_id = 3) AS volunteer_role_count
FROM 
    public.profiles;

-- Check if the admin role exists with ID 1
SELECT * FROM public.roles WHERE id = 1;

-- Check if any roles have been assigned to profiles
SELECT COUNT(*) FROM public.profile_roles;

-- Check if the trigger for assigning default volunteer role exists
SELECT 
    tgname AS trigger_name,
    proname AS function_name
FROM 
    pg_trigger t
JOIN 
    pg_proc p ON t.tgfoid = p.oid
JOIN 
    pg_class c ON t.tgrelid = c.oid
WHERE 
    c.relname = 'profiles';
