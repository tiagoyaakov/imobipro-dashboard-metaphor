-- Script de verificação final dos usuários
-- Execute após completar todas as etapas

-- 1. Verificar usuários na tabela User
SELECT 
    '=== USUÁRIOS NA TABELA USER ===' as section,
    NULL as email,
    NULL as name,
    NULL as role,
    NULL as active
UNION ALL
SELECT 
    '',
    email,
    name,
    role::text,
    "isActive"::text
FROM "User" 
ORDER BY 
    CASE role 
        WHEN 'DEV_MASTER' THEN 1
        WHEN 'ADMIN' THEN 2  
        WHEN 'AGENT' THEN 3
        ELSE 4
    END;

-- 2. Contar usuários por role
SELECT 
    '=== CONTAGEM POR ROLE ===' as info,
    role::text as role_name,
    COUNT(*)::text as quantidade
FROM "User" 
GROUP BY role
UNION ALL
SELECT '=== TOTAL ===', 'TOTAL', COUNT(*)::text FROM "User";

-- 3. Verificar empresa
SELECT 
    '=== EMPRESA ===' as info,
    name as company_name,
    active::text as status
FROM "Company";

-- RESULTADO ESPERADO:
-- ===================
-- DEV_MASTER: 2 usuários (n8nlabz@gmail.com, 1992tiagofranca@gmail.com)
-- ADMIN: 1 usuário (imobprodashboard@gmail.com)
-- TOTAL: 3 usuários

-- VERIFICAÇÃO MANUAL NECESSÁRIA:
-- ==============================
-- 1. Authentication > Users deve ter exatamente 3 usuários
-- 2. Testar login com cada uma das 3 contas
-- 3. Verificar permissões de cada role