-- Script SQL para criar dados iniciais
-- Execute este script diretamente no Supabase Dashboard

-- 1. Criar empresa padrão
INSERT INTO companies (id, name, active, created_at, updated_at) 
VALUES (
    'company-default-001',
    'ImobiPRO Demo',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();

-- 2. Criar usuários na tabela users
INSERT INTO users (id, email, name, role, company_id, is_active, created_at, updated_at)
VALUES 
    (
        'user-dev-master-001',
        '1992tiagofranca@gmail.com',
        'Tiago França (DEV MASTER)',
        'DEV_MASTER',
        'company-default-001',
        true,
        NOW(),
        NOW()
    ),
    (
        'user-admin-001', 
        'admin@imobipro.demo',
        'Administrador Demo',
        'ADMIN',
        'company-default-001',
        true,
        NOW(),
        NOW()
    ),
    (
        'user-agent-001',
        'corretor@imobipro.demo', 
        'Corretor Demo',
        'AGENT',
        'company-default-001',
        true,
        NOW(),
        NOW()
    )
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 3. Verificar dados criados
SELECT 'Empresas criadas:' as info, count(*) as total FROM companies;
SELECT 'Usuários criados:' as info, count(*) as total FROM users;

-- 4. Mostrar usuários por role
SELECT 
    role,
    count(*) as quantidade,
    string_agg(email, ', ') as emails
FROM users 
GROUP BY role 
ORDER BY 
    CASE role 
        WHEN 'DEV_MASTER' THEN 1
        WHEN 'ADMIN' THEN 2  
        WHEN 'AGENT' THEN 3
        ELSE 4
    END;