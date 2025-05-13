-- Simple SQL script to assign roles to specific users
-- This script will:
-- 1. Assign Admin role to user with email datta.rajesh@gmail.com
-- 2. Assign Team Lead role to user with email harshayarlagadda2@gmail.com

-- Variables for role IDs (based on the provided role data)
-- Admin role ID: 1
-- Team Lead role ID: 2
-- Volunteer role ID: 3

-- First, ensure the profiles exist
DO $$
DECLARE
    v_datta_profile_id UUID;
    v_harsha_profile_id UUID;
BEGIN
    -- Check if datta.rajesh@gmail.com profile exists
    SELECT id INTO v_datta_profile_id FROM public.profiles WHERE email = 'datta.rajesh@gmail.com';
    
    -- If not, create it
    IF v_datta_profile_id IS NULL THEN
        INSERT INTO public.profiles (email, display_name)
        VALUES ('datta.rajesh@gmail.com', 'datta.rajesh')
        RETURNING id INTO v_datta_profile_id;
        
        RAISE NOTICE 'Created new profile for datta.rajesh@gmail.com with ID %', v_datta_profile_id;
    ELSE
        RAISE NOTICE 'Found existing profile for datta.rajesh@gmail.com with ID %', v_datta_profile_id;
    END IF;
    
    -- Check if harshayarlagadda2@gmail.com profile exists
    SELECT id INTO v_harsha_profile_id FROM public.profiles WHERE email = 'harshayarlagadda2@gmail.com';
    
    -- If not, create it
    IF v_harsha_profile_id IS NULL THEN
        INSERT INTO public.profiles (email, display_name)
        VALUES ('harshayarlagadda2@gmail.com', 'harshayarlagadda2')
        RETURNING id INTO v_harsha_profile_id;
        
        RAISE NOTICE 'Created new profile for harshayarlagadda2@gmail.com with ID %', v_harsha_profile_id;
    ELSE
        RAISE NOTICE 'Found existing profile for harshayarlagadda2@gmail.com with ID %', v_harsha_profile_id;
    END IF;
    
    -- Assign Admin role to datta.rajesh@gmail.com
    IF NOT EXISTS (SELECT 1 FROM public.profile_roles WHERE profile_id = v_datta_profile_id AND role_id = 1) THEN
        INSERT INTO public.profile_roles (profile_id, role_id, assigned_at)
        VALUES (v_datta_profile_id, 1, NOW());
        
        RAISE NOTICE 'Assigned Admin role to datta.rajesh@gmail.com';
    ELSE
        RAISE NOTICE 'datta.rajesh@gmail.com already has Admin role';
    END IF;
    
    -- Assign Team Lead role to harshayarlagadda2@gmail.com
    IF NOT EXISTS (SELECT 1 FROM public.profile_roles WHERE profile_id = v_harsha_profile_id AND role_id = 2) THEN
        INSERT INTO public.profile_roles (profile_id, role_id, assigned_at)
        VALUES (v_harsha_profile_id, 2, NOW());
        
        RAISE NOTICE 'Assigned Team Lead role to harshayarlagadda2@gmail.com';
    ELSE
        RAISE NOTICE 'harshayarlagadda2@gmail.com already has Team Lead role';
    END IF;
END $$;

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
