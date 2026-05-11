-- Grant admin role to admin@zeroday.test (user_id 5518f727-04e8-468e-ad98-86dbca734490)
-- The original migration targeted the wrong UUID.
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id = '5518f727-04e8-468e-ad98-86dbca734490';
