-- ========================================
-- SCRIPT: REMOÇÃO DAS TABELAS ANTIGAS
-- Data: 05/08/2025
-- Descrição: Remover tabelas antigas após migração
-- ATENÇÃO: Só executar após confirmação que migração está funcionando!
-- ========================================

-- IMPORTANTE: Este script remove as tabelas antigas que foram substituídas
-- Execute apenas depois de:
-- 1. Confirmar que a migração funcionou
-- 2. Testar as novas tabelas no frontend
-- 3. Validar que não há dependências ativas

BEGIN;

-- ========================================
-- VERIFICAÇÕES DE SEGURANÇA ANTES DA REMOÇÃO
-- ========================================

-- Verificar se as novas tabelas têm dados
DO $$
DECLARE
    v_dados_cliente_count INTEGER;
    v_chats_count INTEGER;
    v_messages_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_dados_cliente_count FROM public.dados_cliente;
    SELECT COUNT(*) INTO v_chats_count FROM public.chats;
    SELECT COUNT(*) INTO v_messages_count FROM public.chat_messages;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICAÇÃO PRÉ-REMOÇÃO:';
    RAISE NOTICE '- dados_cliente: % registros', v_dados_cliente_count;
    RAISE NOTICE '- chats: % registros', v_chats_count;
    RAISE NOTICE '- chat_messages: % registros', v_messages_count;
    RAISE NOTICE '========================================';
    
    IF v_dados_cliente_count = 0 THEN
        RAISE EXCEPTION 'ATENÇÃO: dados_cliente está vazia! Cancelando remoção.';
    END IF;
END $$;

-- ========================================
-- REMOÇÃO SEGURA DAS TABELAS ANTIGAS
-- ========================================

-- Função auxiliar para remover tabela se existir
CREATE OR REPLACE FUNCTION drop_table_if_exists(table_name text)
RETURNS void AS $$
DECLARE
    table_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND tables.table_name = drop_table_if_exists.table_name
    ) INTO table_exists;
    
    IF table_exists THEN
        EXECUTE format('DROP TABLE public.%I CASCADE', table_name);
        RAISE NOTICE 'Tabela % removida', table_name;
    ELSE
        RAISE NOTICE 'Tabela % não existe, pulando', table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- REMOVER TABELAS SUBSTITUÍDAS PELA MIGRAÇÃO
-- ========================================

-- Tabelas de clientes/leads (substituídas por dados_cliente)
SELECT drop_table_if_exists('Contact');
SELECT drop_table_if_exists('LeadActivity');
SELECT drop_table_if_exists('MessageCampaign');
SELECT drop_table_if_exists('MessageCampaignParticipation');

-- Tabelas de chat (substituídas por chats + chat_messages)
SELECT drop_table_if_exists('Chat');
SELECT drop_table_if_exists('ChatSummary');
SELECT drop_table_if_exists('Message');
SELECT drop_table_if_exists('WhatsAppMessage');

-- Tabelas de conexões WhatsApp (substituídas por estrutura simplificada)
SELECT drop_table_if_exists('WhatsAppInstance');
SELECT drop_table_if_exists('WhatsAppConnectionLog');
SELECT drop_table_if_exists('WhatsAppConfig');

-- Tabelas de deals/pipeline (substituídas por interesse_imoveis)
SELECT drop_table_if_exists('Deal');
SELECT drop_table_if_exists('DealStageHistory');
SELECT drop_table_if_exists('DealActivity');

-- Tabelas de agenda complexas (substituídas por estrutura simplificada)
SELECT drop_table_if_exists('AgentSchedule');
SELECT drop_table_if_exists('AvailabilitySlot');
SELECT drop_table_if_exists('AppointmentConflictLog');
SELECT drop_table_if_exists('CalendarSyncLog');

-- Tabelas de integração Google Calendar (não utilizadas no MVP)
SELECT drop_table_if_exists('GoogleCalendarCredentials');
SELECT drop_table_if_exists('GoogleCalendarConfig');

-- Tabelas de workflows N8N (não utilizadas no MVP)
SELECT drop_table_if_exists('N8nWorkflowConfig');
SELECT drop_table_if_exists('N8nExecutionLog');

-- Tabelas de relatórios (não utilizadas no MVP)
SELECT drop_table_if_exists('ReportTemplate');
SELECT drop_table_if_exists('ScheduledReport');
SELECT drop_table_if_exists('ReportHistory');

-- Tabelas de configurações (não utilizadas no MVP)
SELECT drop_table_if_exists('FeatureFlag');
SELECT drop_table_if_exists('CompanySettings');
SELECT drop_table_if_exists('UserSettings');

-- ========================================
-- TABELAS PRESERVADAS (NÃO REMOVER)
-- ========================================

/*
TABELAS QUE DEVEM SER MANTIDAS:
- User (sistema de usuários)
- Company (empresas)
- Property (propriedades - pode ser renomeada para imoveisvivareal4 futuramente)
- PropertyImage (imagens das propriedades)
- Appointment (agendamentos básicos)
- Activity (log de atividades gerais)

NOVAS TABELAS MVP:
- dados_cliente ✅
- chats ✅
- chat_messages ✅
- imobipro_messages ✅
- interesse_imoveis ✅
*/

-- ========================================
-- LIMPEZA E VALIDAÇÃO FINAL
-- ========================================

-- Remover função auxiliar
DROP FUNCTION IF EXISTS drop_table_if_exists(text);

-- Contar tabelas restantes
DO $$
DECLARE
    v_total_tables INTEGER;
    v_old_tables_remaining INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_tables 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    SELECT COUNT(*) INTO v_old_tables_remaining
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name IN (
        'Contact', 'Chat', 'Message', 'Deal', 'WhatsAppMessage',
        'LeadActivity', 'MessageCampaign', 'AgentSchedule',
        'GoogleCalendarCredentials', 'N8nWorkflowConfig'
    );
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'LIMPEZA CONCLUÍDA';
    RAISE NOTICE 'Total de tabelas restantes: %', v_total_tables;
    RAISE NOTICE 'Tabelas antigas restantes: %', v_old_tables_remaining;
    
    IF v_old_tables_remaining = 0 THEN
        RAISE NOTICE 'SUCESSO: Todas as tabelas antigas foram removidas!';
    ELSE
        RAISE NOTICE 'AVISO: Ainda restam % tabelas antigas', v_old_tables_remaining;
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- Confirmar transação
COMMIT;

-- ========================================
-- NOTAS IMPORTANTES
-- ========================================

/*
BENEFÍCIOS ESPERADOS APÓS LIMPEZA:
- Redução significativa no tamanho do banco
- Melhoria na performance das consultas
- Simplificação da estrutura
- Redução na complexidade de manutenção

PRÓXIMOS PASSOS APÓS REMOÇÃO:
1. Executar VACUUM FULL; para reclamar espaço
2. Atualizar estatísticas: ANALYZE;
3. Verificar se o frontend continua funcionando
4. Testar todas as funcionalidades críticas
5. Monitorar performance por 24-48h

ROLLBACK DE EMERGÊNCIA:
Se algo der errado, restore do backup criado em backup_migration schema
ou do backup externo do Supabase Dashboard.
*/

-- ========================================
-- FIM DO SCRIPT DE LIMPEZA
-- ========================================