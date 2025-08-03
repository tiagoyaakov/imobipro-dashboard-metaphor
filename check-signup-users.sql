-- Script para verificar usuários criados via signup
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Verificar usuários recentes no Authentication (últimos 7 dias)
SELECT 
    '=== AUTHENTICATION - USUÁRIOS ÚLTIMOS 7 DIAS ===' as section,
    NULL as id,
    NULL as email,
    NULL as created_at,
    NULL as role,
    NULL as confirmed
UNION ALL
SELECT 
    '',
    id::text,
    email,
    created_at::text,
    (raw_user_meta_data->>'role') as role,
    (email_confirmed_at IS NOT NULL)::text as confirmed
FROM auth.users 
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- 2. Verificar usuários recentes na tabela User
SELECT 
    '=== TABELA USER - USUÁRIOS ÚLTIMOS 7 DIAS ===' as section,
    NULL as id,
    NULL as email,
    NULL as created_at,
    NULL as role,
    NULL as active
UNION ALL
SELECT 
    '',
    id::text,
    email,
    "createdAt"::text,
    role::text,
    "isActive"::text
FROM "User" 
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
ORDER BY "createdAt" DESC;

-- 3. Verificar sincronização entre auth.users e User table
SELECT 
    '=== SINCRONIZAÇÃO AUTH vs USER ===' as section,
    NULL as email,
    NULL as auth_exists,
    NULL as user_exists,
    NULL as roles_match,
    NULL as status
UNION ALL
SELECT 
    '',
    COALESCE(a.email, u.email) as email,
    (a.email IS NOT NULL)::text as auth_exists,
    (u.email IS NOT NULL)::text as user_exists,
    CASE 
        WHEN a.raw_user_meta_data->>'role' = u.role::text THEN 'true'
        WHEN a.raw_user_meta_data->>'role' IS NULL AND u.role::text IS NULL THEN 'true'
        ELSE 'false'
    END as roles_match,
    CASE 
        WHEN a.email IS NOT NULL AND u.email IS NOT NULL THEN 'SINCRONIZADO'
        WHEN a.email IS NOT NULL AND u.email IS NULL THEN 'APENAS_AUTH'
        WHEN a.email IS NULL AND u.email IS NOT NULL THEN 'APENAS_USER'
    END as status
FROM auth.users a
FULL OUTER JOIN "User" u ON a.id = u.id
ORDER BY email;

-- 4. Contar usuários por role (apenas os ativos)
SELECT 
    '=== CONTAGEM FINAL POR ROLE ===' as section,
    role::text as role_name,
    COUNT(*)::text as quantidade,
    NULL as percentage,
    '' as notes
FROM "User" 
WHERE "isActive" = true
GROUP BY role
UNION ALL
SELECT 
    '=== TOTAL ATIVO ===',
    'TOTAL',
    COUNT(*)::text,
    '100%',
    'todos os usuários ativos'
FROM "User" 
WHERE "isActive" = true;

-- 5. Verificar se há empresa padrão para novos usuários
SELECT 
    '=== EMPRESAS DISPONÍVEIS ===' as section,
    name as company_name,
    active::text as is_active,
    id::text as company_id,
    '' as notes
FROM "Company"
ORDER BY name;

-- EXPECTATIVAS:
-- - Usuários criados via signup devem ter role='AGENT'
-- - Devem estar sincronizados entre auth.users e User table
-- - Devem ter email_confirmed_at preenchido para fazer login
-- - Devem estar vinculados a uma empresa