-- ========================================
-- SCRIPT PRINCIPAL: EXECUTAR MIGRAÇÃO COMPLETA
-- Data: 05/08/2025
-- Autor: Sistema de Migração ImobiPRO
-- ========================================
-- IMPORTANTE: Executar os scripts na ordem correta
-- Tempo estimado: 10-15 minutos
-- ========================================

-- PASSO 1: BACKUP (5 minutos)
-- Execute primeiro o backup para segurança
\echo '========================================';
\echo 'PASSO 1: Criando backup do schema atual...';
\echo '========================================';
\i scripts/backup/backup_old_schema.sql

-- Aguardar confirmação antes de prosseguir
\echo '';
\echo 'Backup concluído! Pressione ENTER para continuar com a migração...';
\prompt continue

-- PASSO 2: CRIAR NOVAS TABELAS (2 minutos)
\echo '';
\echo '========================================';
\echo 'PASSO 2: Criando novas tabelas...';
\echo '========================================';
\i scripts/migration/01_create_new_tables.sql

-- PASSO 3: CONFIGURAR RLS (1 minuto)
\echo '';
\echo '========================================';
\echo 'PASSO 3: Configurando Row Level Security...';
\echo '========================================';
\i scripts/migration/02_setup_rls.sql

-- PASSO 4: MIGRAR DADOS (5-10 minutos dependendo do volume)
\echo '';
\echo '========================================';
\echo 'PASSO 4: Migrando dados das tabelas antigas...';
\echo '========================================';
\i scripts/migration/03_migrate_data.sql

-- PASSO 5: VALIDAÇÃO FINAL
\echo '';
\echo '========================================';
\echo 'PASSO 5: Validando migração...';
\echo '========================================';

-- Verificar se as novas tabelas foram criadas
SELECT 
    'Tabelas criadas:' as info,
    COUNT(*) as total
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('dados_cliente', 'chats', 'chat_messages', 'imobipro_messages', 'interesse_imoveis');

-- Contar registros em cada tabela nova
SELECT 
    'dados_cliente' as tabela, 
    COUNT(*) as registros 
FROM public.dados_cliente
UNION ALL
SELECT 
    'chats' as tabela, 
    COUNT(*) as registros 
FROM public.chats
UNION ALL
SELECT 
    'chat_messages' as tabela, 
    COUNT(*) as registros 
FROM public.chat_messages
UNION ALL
SELECT 
    'imobipro_messages' as tabela, 
    COUNT(*) as registros 
FROM public.imobipro_messages
UNION ALL
SELECT 
    'interesse_imoveis' as tabela, 
    COUNT(*) as registros 
FROM public.interesse_imoveis
ORDER BY tabela;

-- Verificar RLS
SELECT 
    'RLS Status:' as info,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('dados_cliente', 'chats', 'chat_messages', 'imobipro_messages', 'interesse_imoveis');

\echo '';
\echo '========================================';
\echo 'MIGRAÇÃO CONCLUÍDA!';
\echo '========================================';
\echo '';
\echo 'Próximos passos:';
\echo '1. Verificar se todos os dados foram migrados corretamente';
\echo '2. Testar as funcionalidades no frontend';
\echo '3. Atualizar os tipos TypeScript no código';
\echo '4. Testar integrações N8N';
\echo '';
\echo 'Em caso de problemas, execute:';
\echo '\i scripts/rollback/rollback_migration.sql';
\echo '';
\echo '========================================';

-- FIM DO SCRIPT DE EXECUÇÃO