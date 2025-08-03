-- Script para criar usuário administrador
-- Execute APÓS executar update-users.sql

-- PARTE 1: Executar no SQL Editor do Supabase
-- =============================================

-- 1. Inserir o usuário admin na tabela User
INSERT INTO "User" (
    id,
    email,
    name,
    role,
    "isActive",
    "companyId",
    password,
    "updatedAt"
) VALUES (
    gen_random_uuid(), -- Gera UUID automaticamente
    'imobprodashboard@gmail.com',
    'Administrador ImobiPRO',
    'ADMIN',
    true,
    (SELECT id FROM "Company" WHERE name = 'ImobiPRO Default' LIMIT 1),
    'encrypted_password',
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = NOW();

-- 2. Verificar todos os usuários finais
SELECT 
    email,
    name,
    role,
    "isActive",
    "companyId"
FROM "User" 
ORDER BY 
    CASE role 
        WHEN 'DEV_MASTER' THEN 1
        WHEN 'ADMIN' THEN 2  
        WHEN 'AGENT' THEN 3
        ELSE 4
    END,
    email;

-- PARTE 2: Executar manualmente no Authentication do Supabase
-- ===========================================================

-- 1. Ir para Authentication > Users no Supabase Dashboard

-- 2. EXCLUIR os seguintes usuários:
--    - tiago.ykv@gmail.com
--    - james.maranatha@gmail.com
--    - yaakovsurvival@gmail.com
--    - imobprodashboard@gmail.com (se existir - será recriado)

-- 3. MANTER apenas:
--    - n8nlabz@gmail.com (Fernando Riolo - DEV_MASTER)
--    - 1992tiagofranca@gmail.com (Tiago França - DEV_MASTER)

-- 4. CRIAR NOVO USUÁRIO:
--    Email: imobprodashboard@gmail.com
--    Senha: Admin123!@#
--    Confirmar Email: ✅ Sim
--    User Metadata:
--    {
--      "name": "Administrador ImobiPRO",
--      "role": "ADMIN"
--    }

-- RESULTADO FINAL ESPERADO:
-- =========================
-- 3 usuários no total:
-- ✅ n8nlabz@gmail.com - Fernando Riolo (DEV_MASTER)
-- ✅ 1992tiagofranca@gmail.com - Tiago França (DEV_MASTER)  
-- ✅ imobprodashboard@gmail.com - Administrador (ADMIN)

SELECT 'Script preparado! Execute as etapas em ordem.' AS instructions;