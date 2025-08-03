-- Script para atualizar usuários conforme solicitado
-- Execute este SQL no Supabase Dashboard

-- 1. Remover usuários indesejados da tabela User
DELETE FROM "User" 
WHERE email NOT IN ('n8nlabz@gmail.com', '1992tiagofranca@gmail.com');

-- 2. Verificar se precisamos adicionar DEV_MASTER ao enum (se não existir)
-- Este comando pode dar erro se DEV_MASTER já existir, mas é seguro
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid 
                   WHERE t.typname = 'UserRole' AND e.enumlabel = 'DEV_MASTER') THEN
        ALTER TYPE "UserRole" ADD VALUE 'DEV_MASTER';
    END IF;
END $$;

-- 3. Atualizar os usuários restantes para DEV_MASTER
UPDATE "User" 
SET role = 'DEV_MASTER', "updatedAt" = NOW()
WHERE email IN ('n8nlabz@gmail.com', '1992tiagofranca@gmail.com');

-- 4. Remover usuários indesejados do Supabase Auth
-- NOTA: Esta parte precisa ser feita manualmente no dashboard Supabase > Authentication
-- Excluir os seguintes usuários:
-- - tiago.ykv@gmail.com
-- - james.maranatha@gmail.com  
-- - yaakovsurvival@gmail.com
-- (Manter apenas n8nlabz@gmail.com e 1992tiagofranca@gmail.com)

-- 5. Verificar resultado
SELECT 
    email,
    name,
    role,
    "isActive",
    "createdAt"
FROM "User" 
ORDER BY email;

-- Mensagem de confirmação
SELECT 'Usuários atualizados com sucesso! Agora execute as próximas etapas no Authentication.' AS message;