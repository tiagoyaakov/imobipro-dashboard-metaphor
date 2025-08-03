-- Corrigir role do usuário yaakovsurvival@gmail.com de ADMIN para AGENT

-- 1. Verificar estado atual
SELECT 
    '=== ANTES DA CORREÇÃO ===' as section,
    email,
    role::text,
    "createdAt"::text
FROM "User"
WHERE email = 'yaakovsurvival@gmail.com';

-- 2. Corrigir role para AGENT
UPDATE "User" 
SET 
    role = 'AGENT',
    "updatedAt" = NOW()
WHERE email = 'yaakovsurvival@gmail.com';

-- 3. Verificar após correção
SELECT 
    '=== APÓS CORREÇÃO ===' as section,
    email,
    role::text,
    "updatedAt"::text as updated_time
FROM "User"
WHERE email = 'yaakovsurvival@gmail.com';

-- 4. Verificar contagem de usuários por role
SELECT 
    '=== CONTAGEM POR ROLE ===' as section,
    role::text,
    COUNT(*)::text as quantidade
FROM "User"
GROUP BY role
ORDER BY role;