-- ========================================
-- SCRIPT: BACKUP DO SCHEMA ANTIGO
-- Data: 05/08/2025
-- Descrição: Criar backup das tabelas antigas antes da migração
-- ========================================

-- Este script cria uma cópia de segurança de todas as tabelas antigas
-- em um schema separado chamado 'backup_migration'

-- Criar schema de backup se não existir
CREATE SCHEMA IF NOT EXISTS backup_migration;

-- ========================================
-- BACKUP DAS TABELAS PRINCIPAIS
-- ========================================

-- Função auxiliar para fazer backup de tabelas
CREATE OR REPLACE FUNCTION backup_table_if_exists(source_table text, backup_schema text DEFAULT 'backup_migration')
RETURNS void AS $$
DECLARE
    table_exists boolean;
BEGIN
    -- Verificar se a tabela existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = source_table
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Criar backup da tabela
        EXECUTE format('CREATE TABLE %I.%I AS SELECT * FROM public.%I', 
                      backup_schema, source_table || '_backup', source_table);
        RAISE NOTICE 'Backup criado: %.%', backup_schema, source_table || '_backup';
    ELSE
        RAISE NOTICE 'Tabela % não existe, pulando backup', source_table;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- EXECUTAR BACKUP DAS TABELAS
-- ========================================

-- Tabelas do módulo Usuários (NÃO FAZER BACKUP - PRESERVAR)
-- User, Company, user_impersonations

-- Tabelas do módulo Agenda
SELECT backup_table_if_exists('AgentSchedule');
SELECT backup_table_if_exists('AvailabilitySlot');
SELECT backup_table_if_exists('Appointment');
SELECT backup_table_if_exists('AppointmentConflictLog');
SELECT backup_table_if_exists('GoogleCalendarCredentials');
SELECT backup_table_if_exists('GoogleCalendarConfig');
SELECT backup_table_if_exists('CalendarSyncLog');
SELECT backup_table_if_exists('N8nWorkflowConfig');
SELECT backup_table_if_exists('N8nExecutionLog');

-- Tabelas do módulo Clientes
SELECT backup_table_if_exists('Contact');
SELECT backup_table_if_exists('LeadActivity');
SELECT backup_table_if_exists('MessageCampaign');
SELECT backup_table_if_exists('MessageCampaignParticipation');

-- Tabelas do módulo Propriedades
SELECT backup_table_if_exists('Property');
SELECT backup_table_if_exists('PropertyOwner');
SELECT backup_table_if_exists('PropertyImage');

-- Tabelas do módulo Chats
SELECT backup_table_if_exists('Chat');
SELECT backup_table_if_exists('ChatSummary');
SELECT backup_table_if_exists('Message');

-- Tabelas do módulo Conexões
SELECT backup_table_if_exists('WhatsAppInstance');
SELECT backup_table_if_exists('WhatsAppConnectionLog');
SELECT backup_table_if_exists('WhatsAppMessage');
SELECT backup_table_if_exists('WhatsAppConfig');

-- Tabelas do módulo Pipeline
SELECT backup_table_if_exists('Deal');
SELECT backup_table_if_exists('DealStageHistory');
SELECT backup_table_if_exists('DealActivity');

-- Tabelas do módulo Relatórios
SELECT backup_table_if_exists('ReportTemplate');
SELECT backup_table_if_exists('ScheduledReport');
SELECT backup_table_if_exists('ReportHistory');

-- Tabelas do módulo Configurações
SELECT backup_table_if_exists('FeatureFlag');
SELECT backup_table_if_exists('CompanySettings');
SELECT backup_table_if_exists('UserSettings');

-- Tabela de Atividades
SELECT backup_table_if_exists('Activity');

-- ========================================
-- CRIAR TIMESTAMP DO BACKUP
-- ========================================

CREATE TABLE IF NOT EXISTS backup_migration.backup_info (
    id SERIAL PRIMARY KEY,
    backup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT DEFAULT 'Backup antes da migração para 6 tabelas MVP',
    tables_backed_up TEXT[],
    created_by TEXT DEFAULT 'migration_script'
);

-- Registrar informações do backup
INSERT INTO backup_migration.backup_info (tables_backed_up)
SELECT array_agg(table_name || '_backup')
FROM information_schema.tables
WHERE table_schema = 'backup_migration'
AND table_name LIKE '%_backup';

-- ========================================
-- VALIDAÇÃO DO BACKUP
-- ========================================

DO $$
DECLARE
    v_backup_count INTEGER;
    v_backup_list TEXT;
BEGIN
    -- Contar tabelas no backup
    SELECT COUNT(*), string_agg(table_name, ', ' ORDER BY table_name)
    INTO v_backup_count, v_backup_list
    FROM information_schema.tables
    WHERE table_schema = 'backup_migration'
    AND table_name LIKE '%_backup';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'BACKUP CONCLUÍDO COM SUCESSO';
    RAISE NOTICE 'Total de tabelas no backup: %', v_backup_count;
    RAISE NOTICE 'Tabelas: %', v_backup_list;
    RAISE NOTICE 'Schema de backup: backup_migration';
    RAISE NOTICE '========================================';
END $$;

-- Limpar função temporária
DROP FUNCTION IF EXISTS backup_table_if_exists(text, text);

-- ========================================
-- FIM DO SCRIPT DE BACKUP
-- ========================================