-- =====================================================
-- Create Initial Admin User for adminRestu
-- =====================================================
-- Run this script in Supabase SQL Editor to create your first admin user

-- First, create the user in Supabase Auth (you'll need to do this manually in Supabase Dashboard)
-- Go to Authentication > Users > Add User
-- Email: admin@restaurant.com
-- Password: admin123
-- Auto Confirm User: Yes

-- Then run this SQL to create the user profile
INSERT INTO public.user_profiles (
  id,
  username,
  first_name,
  last_name,
  role,
  email,
  phone,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Replace with actual UUID from Supabase Auth
  'admin',
  'System',
  'Administrator',
  'admin',
  'admin@restaurant.com',
  '+63-912-345-6789',
  true
);

-- Create additional test users
INSERT INTO public.user_profiles (
  id,
  username,
  first_name,
  last_name,
  role,
  email,
  phone,
  is_active
) VALUES 
(
  '00000000-0000-0000-0000-000000000002', -- Replace with actual UUID
  'cashier',
  'Maria',
  'Santos',
  'cashier',
  'cashier@restaurant.com',
  '+63-912-345-6788',
  true
),
(
  '00000000-0000-0000-0000-000000000003', -- Replace with actual UUID
  'kitchen',
  'Juan',
  'Cruz',
  'kitchen',
  'kitchen@restaurant.com',
  '+63-912-345-6787',
  true
);

-- Verify the users were created
SELECT id, username, first_name, last_name, role, email, is_active 
FROM public.user_profiles 
WHERE username IN ('admin', 'cashier', 'kitchen');
