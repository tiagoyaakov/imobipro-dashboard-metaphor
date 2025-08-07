-- ========================================
-- SCRIPT: ROLLBACK DA MIGRAÇÃO
-- Data: 05/08/2025
-- Descrição: Reverter para o schema antigo em caso de problemas
-- ATENÇÃO: Só executar em caso de emergência!
-- ========================================

-- IMPORTANTE: Este script desfaz a migração e restaura as tabelas antigas
BEGIN;

-- ========================================
-- PASSO 1: REMOVER AS NOVAS TABELAS
-- ========================================

-- Desabilitar RLS antes de dropar
ALTER TABLE IF EXISTS public.dados_cliente DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.imobipro_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.interesse_imoveis DISABLE ROW LEVEL SECURITY;

-- Dropar políticas RLS
DROP POLICY IF EXISTS "dev_master_all_dados_cliente" ON public.dados_cliente;
DROP POLICY IF EXISTS "admin_company_dados_cliente" ON public.dados_cliente;
DROP POLICY IF EXISTS "agent_own_dados_cliente" ON public.dados_cliente;

DROP POLICY IF EXISTS "dev_master_all_chats" ON public.chats;
DROP POLICY IF EXISTS "admin_company_chats" ON public.chats;
DROP POLICY IF EXISTS "agent_own_chats" ON public.chats;

DROP POLICY IF EXISTS "dev_master_all_chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "admin_company_chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "agent_own_chat_messages" ON public.chat_messages;

DROP POLICY IF EXISTS "dev_master_all_imobipro_messages" ON public.imobipro_messages;
DROP POLICY IF EXISTS "admin_company_imobipro_messages" ON public.imobipro_messages;
DROP POLICY IF EXISTS "agent_own_imobipro_messages" ON public.imobipro_messages;

DROP POLICY IF EXISTS "dev_master_all_interesse_imoveis" ON public.interesse_imoveis;
DROP POLICY IF EXISTS "admin_company_interesse_imoveis" ON public.interesse_imoveis;
DROP POLICY IF EXISTS "agent_own_interesse_imoveis" ON public.interesse_imoveis;

-- Dropar triggers
DROP TRIGGER IF EXISTS update_dados_cliente_updated_at ON public.dados_cliente;
DROP TRIGGER IF EXISTS update_chats_updated_at ON public.chats;
DROP TRIGGER IF EXISTS update_interesse_imoveis_updated_at ON public.interesse_imoveis;

-- Dropar tabelas novas
DROP TABLE IF EXISTS public.interesse_imoveis CASCADE;
DROP TABLE IF EXISTS public.imobipro_messages CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chats CASCADE;
DROP TABLE IF EXISTS public.dados_cliente CASCADE;

-- Não dropar imoveisvivareal4 pois já existia com dados

-- ========================================
-- PASSO 2: RESTAURAR TABELAS DO BACKUP
-- ========================================

-- Função auxiliar para restaurar tabelas
CREATE OR REPLACE FUNCTION restore_table_from_backup(table_name text, backup_schema text DEFAULT 'backup_migration')
RETURNS void AS $$
DECLARE
    backup_exists boolean;
BEGIN
    -- Verificar se o backup existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = backup_schema 
        AND table_name = table_name || '_backup'
    ) INTO backup_exists;
    
    IF backup_exists THEN
        -- Dropar tabela atual se existir
        EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', table_name);
        
        -- Restaurar do backup
        EXECUTE format('CREATE TABLE public.%I AS SELECT * FROM %I.%I', 
                      table_name, backup_schema, table_name || '_backup');
        
        RAISE NOTICE 'Tabela % restaurada do backup', table_name;
    ELSE
        RAISE NOTICE 'Backup da tabela % não encontrado', table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Restaurar tabelas antigas (se existirem backups)
SELECT restore_table_from_backup('Contact');
SELECT restore_table_from_backup('LeadActivity');
SELECT restore_table_from_backup('MessageCampaign');
SELECT restore_table_from_backup('MessageCampaignParticipation');
SELECT restore_table_from_backup('Chat');
SELECT restore_table_from_backup('ChatSummary');
SELECT restore_table_from_backup('Message');
SELECT restore_table_from_backup('WhatsAppInstance');
SELECT restore_table_from_backup('WhatsAppConnectionLog');
SELECT restore_table_from_backup('WhatsAppMessage');
SELECT restore_table_from_backup('Deal');
SELECT restore_table_from_backup('DealStageHistory');
SELECT restore_table_from_backup('DealActivity');

-- Limpar função temporária
DROP FUNCTION IF EXISTS restore_table_from_backup(text, text);

-- ========================================
-- PASSO 3: RECRIAR CONSTRAINTS E ÍNDICES
-- ========================================

-- Nota: As constraints e índices originais precisariam ser recriados manualmente
-- baseados no schema.prisma original ou em um backup DDL completo

-- ========================================
-- PASSO 4: VALIDAÇÃO DO ROLLBACK
-- ========================================

DO $$
DECLARE
    v_restored_tables TEXT;
BEGIN
    -- Listar tabelas restauradas
    SELECT string_agg(table_name, ', ' ORDER BY table_name)
    INTO v_restored_tables
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('Contact', 'LeadActivity', 'Chat', 'Message', 'Deal', 
                       'WhatsAppInstance', 'WhatsAppMessage');
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ROLLBACK EXECUTADO';
    RAISE NOTICE 'Tabelas restauradas: %', COALESCE(v_restored_tables, 'Nenhuma');
    RAISE NOTICE '========================================';
    RAISE NOTICE 'IMPORTANTE: Verificar e recriar constraints/índices manualmente';
    RAISE NOTICE '========================================';
END $$;

-- Confirmar rollback
COMMIT;

-- ========================================
-- ROLLBACK DE EMERGÊNCIA (se a transação falhar)
-- ========================================

-- Se algo der errado durante o rollback, executar:
-- ROLLBACK;

-- E então tentar restaurar manualmente do backup:
-- 1. Conectar ao banco via Supabase Dashboard
-- 2. Navegar até o schema 'backup_migration'
-- 3. Copiar manualmente as tabelas de volta para 'public'

-- ========================================
-- FIM DO SCRIPT DE ROLLBACK
-- ========================================