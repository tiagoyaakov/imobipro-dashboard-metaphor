-- Script de teste após correção do bug de signup
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Verificar se há empresas disponíveis para novos usuários
SELECT 
    '=== EMPRESAS DISPONÍVEIS PARA SIGNUP ===' as section,
    name as company_name,
    active::text as is_active,
    id::text as company_id,
    '' as notes
FROM "Company"
ORDER BY name;

-- 2. Verificar estrutura da tabela User (campos corretos)
SELECT 
    '=== ESTRUTURA TABELA USER ===' as section,
    column_name as field_name,
    data_type as field_type,
    is_nullable as nullable,
    '' as notes
FROM information_schema.columns 
WHERE table_name = 'User' 
ORDER BY ordinal_position;

-- 3. Status atual dos usuários na tabela User
SELECT 
    '=== USUÁRIOS ATUAIS NA TABELA USER ===' as section,
    name as user_name,
    email,
    role::text,
    "isActive"::text as active,
    "createdAt"::text as created
FROM "User"
ORDER BY "createdAt" DESC;

-- 4. Verificar sincronização entre auth.users e User
SELECT 
    '=== SINCRONIZAÇÃO AUTH vs USER ===' as section,
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
    END as sync_status
FROM auth.users a
FULL OUTER JOIN "User" u ON a.id = u.id
ORDER BY email;

-- 5. Resumo para verificação do signup
SELECT 
    '=== RESUMO PARA TESTE SIGNUP ===' as section,
    'TOTAL_COMPANIES' as metric,
    COUNT(*)::text as value,
    'empresas disponíveis para novos usuários' as description
FROM "Company" WHERE active = true
UNION ALL
SELECT 
    '',
    'TOTAL_USERS_USER_TABLE',
    COUNT(*)::text,
    'usuários na tabela User'
FROM "User"
UNION ALL
SELECT 
    '',
    'TOTAL_USERS_AUTH',
    COUNT(*)::text,
    'usuários no Supabase Auth'
FROM auth.users
UNION ALL
SELECT 
    '',
    'AGENTS_COUNT',
    COUNT(*)::text,
    'usuários com role AGENT'
FROM "User" WHERE role = 'AGENT';

-- INSTRUÇÕES PARA TESTE:
-- 1. Execute este script primeiro para ver o estado atual
-- 2. Teste o signup em https://imobipro-brown.vercel.app/auth/signup
-- 3. Execute novamente este script para ver se o usuário foi criado
-- 4. Verifique se aparecem novos registros em ambas as tabelas (auth.users e User)