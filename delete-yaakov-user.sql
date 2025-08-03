-- Script para excluir completamente o usuário yaakovsurvival@gmail.com
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Verificar se o usuário existe antes de excluir
SELECT 
    '=== USUÁRIO ANTES DA EXCLUSÃO ===' as section,
    id,
    name,
    email,
    role::text,
    "createdAt"::text as created
FROM "User" 
WHERE email = 'yaakovsurvival@gmail.com';

-- 2. Excluir da tabela User (dados customizados)
DELETE FROM "User" 
WHERE email = 'yaakovsurvival@gmail.com';

-- 3. Verificar exclusão da tabela User
SELECT 
    '=== APÓS EXCLUSÃO DA TABELA USER ===' as section,
    COUNT(*) as total_usuarios_restantes
FROM "User";

-- 4. Verificar se ainda existe no auth.users
SELECT 
    '=== VERIFICAR SE AINDA EXISTE NO AUTH ===' as section,
    email,
    created_at::text,
    email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users 
WHERE email = 'yaakovsurvival@gmail.com';

-- 5. Tentar excluir do auth.users também (pode não funcionar por permissões)
-- Se der erro, ignore e exclua manualmente no painel Authentication
DELETE FROM auth.users 
WHERE email = 'yaakovsurvival@gmail.com';

-- 6. Verificação final
SELECT 
    '=== VERIFICAÇÃO FINAL ===' as section,
    'TABELA_USER' as tabela,
    COUNT(*)::text as usuarios_encontrados
FROM "User" 
WHERE email = 'yaakovsurvival@gmail.com'
UNION ALL
SELECT 
    '',
    'AUTH_USERS',
    COUNT(*)::text
FROM auth.users 
WHERE email = 'yaakovsurvival@gmail.com';

-- INSTRUÇÕES ADICIONAIS:
-- Se o DELETE do auth.users falhar:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em Authentication > Users
-- 3. Procure por yaakovsurvival@gmail.com
-- 4. Clique nos 3 pontos e Delete User