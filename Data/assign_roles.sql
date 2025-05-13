-- SQL script to assign roles to specific users
-- This script will:
-- 1. Assign Admin role to user with email datta.rajesh@gmail.com
-- 2. Assign Team Lead role to user with email harshayarlagadda2@gmail.com

-- First, let's create a function to handle the role assignment
-- This function will check if the profile exists, and if not, create it
-- Then it will assign the specified role to the profile

CREATE OR REPLACE FUNCTION assign_role_to_user(
    p_email TEXT,
    p_role_name TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_profile_id UUID;
    v_role_id BIGINT;
    v_result TEXT;
BEGIN
    -- Check if the profile exists
    SELECT id INTO v_profile_id FROM public.profiles WHERE email = p_email;
    
    -- If profile doesn't exist, create it
    IF v_profile_id IS NULL THEN
        INSERT INTO public.profiles (email, display_name)
        VALUES (p_email, split_part(p_email, '@', 1))
        RETURNING id INTO v_profile_id;
        
        v_result := 'Created new profile for ' || p_email || ' with ID ' || v_profile_id;
    ELSE
        v_result := 'Found existing profile for ' || p_email || ' with ID ' || v_profile_id;
    END IF;
    
    -- Get the role ID
    SELECT id INTO v_role_id FROM public.roles WHERE role_name = p_role_name;
    
    IF v_role_id IS NULL THEN
        RETURN 'Error: Role ' || p_role_name || ' not found';
    END IF;
    
    -- Check if the role assignment already exists
    IF EXISTS (SELECT 1 FROM public.profile_roles WHERE profile_id = v_profile_id AND role_id = v_role_id) THEN
        RETURN v_result || '. User already has the ' || p_role_name || ' role.';
    END IF;
    
    -- Assign the role
    INSERT INTO public.profile_roles (profile_id, role_id, assigned_at)
    VALUES (v_profile_id, v_role_id, NOW());
    
    RETURN v_result || '. Successfully assigned ' || p_role_name || ' role.';
END;
$$ LANGUAGE plpgsql;

-- Now, let's assign the roles

-- Assign Admin role to datta.rajesh@gmail.com
SELECT assign_role_to_user('datta.rajesh@gmail.com', 'Admin') AS result;

-- Assign Team Lead role to harshayarlagadda2@gmail.com
SELECT assign_role_to_user('harshayarlagadda2@gmail.com', 'Team Lead') AS result;

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
