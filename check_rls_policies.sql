-- Check if WhatsApp tables exist and have RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    hasoids
FROM pg_tables 
WHERE tablename LIKE '%WhatsApp%'
ORDER BY tablename;

-- Check current RLS policies on WhatsAppInstance table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'WhatsAppInstance'
ORDER BY policyname;

-- Test if the auth.uid() function is working
SELECT auth.uid() as current_user_id;

-- Check the specific user mentioned in the error
SELECT id, email, role, "companyId" FROM "User" WHERE id = '8a8c11cd-9165-4f15-9174-6a22afcc1465';

-- Check all users to understand the data
SELECT id, email, role FROM "User" LIMIT 5;

-- Check if we have any WhatsApp instances
SELECT COUNT(*) as total_instances FROM "WhatsAppInstance";

-- Check the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'WhatsAppInstance' 
ORDER BY ordinal_position;