-- Debug completo do usuário yaakovsurvival@gmail.com
-- Execute no Supabase Dashboard SQL Editor

-- 1. Verificar dados na tabela User
SELECT 
    '=== DADOS NA TABELA USER ===' as section,
    id,
    name,
    email,
    role::text,
    "isActive"::text as active,
    "companyId",
    "createdAt"::text as created
FROM "User" 
WHERE email = 'yaakovsurvival@gmail.com';

-- 2. Verificar dados completos no auth.users
SELECT 
    '=== DADOS COMPLETOS NO AUTH.USERS ===' as section,
    id::text as auth_id,
    email,
    raw_user_meta_data::text as all_metadata,
    (raw_user_meta_data->>'name') as metadata_name,
    (raw_user_meta_data->>'role') as metadata_role,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at::text as auth_created
FROM auth.users 
WHERE email = 'yaakovsurvival@gmail.com';

-- 3. Verificar se os IDs batem
SELECT 
    '=== COMPARAÇÃO DE IDs ===' as section,
    COALESCE(u.email, a.email) as email,
    u.id as user_table_id,
    a.id::text as auth_users_id,
    (u.id = a.id::text) as ids_match,
    CASE 
        WHEN u.id IS NULL THEN 'APENAS_AUTH'
        WHEN a.id IS NULL THEN 'APENAS_USER'
        WHEN u.id = a.id::text THEN 'SINCRONIZADO'
        ELSE 'DESSINCRONIZADO'
    END as sync_status
FROM "User" u
FULL OUTER JOIN auth.users a ON u.id = a.id::text
WHERE COALESCE(u.email, a.email) = 'yaakovsurvival@gmail.com';

-- 4. Verificar se há erros de permissão na tabela User
-- (Este pode ser o motivo do fallback estar sendo acionado)
SELECT 
    '=== TESTE DE PERMISSÃO ===' as section,
    COUNT(*) as total_users_accessible
FROM "User";

-- INTERPRETAÇÃO DOS RESULTADOS:
-- Se aparecer apenas no auth.users mas não na User = problema de sincronização no signup
-- Se IDs não batem = problema de sincronização
-- Se metadata_role é diferente do role na tabela = inconsistência
-- Se total_users_accessible = 0 = problema de RLS/permissões