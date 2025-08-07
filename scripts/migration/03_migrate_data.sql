-- ========================================
-- SCRIPT 3: MIGRAÇÃO DE DADOS DAS TABELAS ANTIGAS
-- Data: 05/08/2025
-- Descrição: Migração incremental dos dados existentes
-- ========================================

-- IMPORTANTE: Executar em transação para garantir atomicidade
BEGIN;

-- ========================================
-- 1. MIGRAÇÃO: Contact -> dados_cliente
-- ========================================

-- Verificar se a tabela Contact existe antes de migrar
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Contact' AND table_schema = 'public') THEN
        -- Migrar dados de Contact para dados_cliente
        INSERT INTO public.dados_cliente (
            id,
            nome,
            telefone,
            email,
            status,
            funcionario,
            observacoes,
            ultima_interacao,
            empresa,
            cargo,
            origem_lead,
            score_lead,
            tags,
            proxima_acao,
            created_at,
            updated_at
        )
        SELECT 
            id,
            name as nome,
            COALESCE(phone, 'SEM_TELEFONE_' || id::text) as telefone, -- Telefone é obrigatório
            email,
            CASE 
                WHEN "leadStage" = 'NEW' THEN 'novos'
                WHEN "leadStage" = 'CONTACTED' THEN 'contatados'
                WHEN "leadStage" = 'QUALIFIED' THEN 'qualificados'
                WHEN "leadStage" = 'INTERESTED' THEN 'interessados'
                WHEN "leadStage" = 'NEGOTIATING' THEN 'negociando'
                WHEN "leadStage" = 'CONVERTED' THEN 'convertidos'
                WHEN "leadStage" = 'LOST' THEN 'perdidos'
                ELSE 'novos'
            END as status,
            "agentId" as funcionario,
            "qualificationNotes" as observacoes,
            "lastInteractionAt" as ultima_interacao,
            company as empresa,
            position as cargo,
            "leadSource" as origem_lead,
            COALESCE("leadScore", 50) as score_lead,
            tags,
            "nextFollowUpAt"::date as proxima_acao,
            "createdAt" as created_at,
            "updatedAt" as updated_at
        FROM public."Contact"
        ON CONFLICT (telefone) DO UPDATE SET
            nome = EXCLUDED.nome,
            email = EXCLUDED.email,
            status = EXCLUDED.status,
            updated_at = NOW();
        
        RAISE NOTICE 'Migração Contact -> dados_cliente concluída';
    ELSE
        RAISE NOTICE 'Tabela Contact não existe, pulando migração';
    END IF;
END $$;

-- ========================================
-- 2. MIGRAÇÃO: Chat -> chats
-- ========================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Chat' AND table_schema = 'public') THEN
        -- Migrar dados de Chat para chats
        INSERT INTO public.chats (
            id,
            telefone,
            conversation_id,
            nome_contato,
            funcionario,
            status,
            ultima_mensagem,
            ultima_mensagem_timestamp,
            created_at,
            updated_at
        )
        SELECT 
            c.id,
            COALESCE(cont.phone, 'SEM_TELEFONE_' || c.id::text) as telefone,
            c.id::text as conversation_id, -- Usar ID como conversation_id temporariamente
            cont.name as nome_contato,
            c."agentId" as funcionario,
            'ativo' as status,
            c.summary as ultima_mensagem,
            c."lastMessageAt" as ultima_mensagem_timestamp,
            c."createdAt" as created_at,
            c."updatedAt" as updated_at
        FROM public."Chat" c
        LEFT JOIN public."Contact" cont ON cont.id = c."contactId"
        ON CONFLICT (telefone, conversation_id) DO UPDATE SET
            nome_contato = EXCLUDED.nome_contato,
            ultima_mensagem = EXCLUDED.ultima_mensagem,
            updated_at = NOW();
        
        RAISE NOTICE 'Migração Chat -> chats concluída';
    ELSE
        RAISE NOTICE 'Tabela Chat não existe, pulando migração';
    END IF;
END $$;

-- ========================================
-- 3. MIGRAÇÃO: Message -> chat_messages
-- ========================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Message' AND table_schema = 'public') THEN
        -- Migrar dados de Message para chat_messages
        INSERT INTO public.chat_messages (
            id,
            conversation_id,
            chat_id,
            user_message,
            resposta_agent,
            message_type,
            is_from_me,
            status,
            timestamp,
            created_at
        )
        SELECT 
            m.id,
            m."chatId"::text as conversation_id,
            m."chatId" as chat_id,
            CASE 
                WHEN u.role = 'AGENT' OR u.role = 'ADMIN' OR u.role = 'DEV_MASTER' 
                THEN NULL 
                ELSE m.content 
            END as user_message,
            CASE 
                WHEN u.role = 'AGENT' OR u.role = 'ADMIN' OR u.role = 'DEV_MASTER' 
                THEN m.content 
                ELSE NULL 
            END as resposta_agent,
            COALESCE(m."messageType", 'text') as message_type,
            CASE 
                WHEN u.role = 'AGENT' OR u.role = 'ADMIN' OR u.role = 'DEV_MASTER' 
                THEN true 
                ELSE false 
            END as is_from_me,
            'sent' as status,
            m."sentAt" as timestamp,
            m."sentAt" as created_at
        FROM public."Message" m
        LEFT JOIN public."User" u ON u.id = m."senderId"
        WHERE EXISTS (SELECT 1 FROM public.chats WHERE id = m."chatId")
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Migração Message -> chat_messages concluída';
    ELSE
        RAISE NOTICE 'Tabela Message não existe, pulando migração';
    END IF;
END $$;

-- ========================================
-- 4. MIGRAÇÃO: Deal -> interesse_imoveis
-- ========================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Deal' AND table_schema = 'public') THEN
        -- Migrar dados de Deal para interesse_imoveis
        INSERT INTO public.interesse_imoveis (
            id,
            cliente_id,
            telefone,
            imovel_id,
            tipo_interesse,
            nivel_interesse,
            observacoes,
            data_visita,
            proposta_enviada,
            valor_proposta,
            status,
            created_at,
            updated_at
        )
        SELECT 
            d.id,
            d."clientId" as cliente_id,
            cont.phone as telefone,
            d."propertyId"::text as imovel_id,
            'venda' as tipo_interesse, -- Default
            CASE 
                WHEN d.stage = 'WON' THEN 10
                WHEN d.stage = 'NEGOTIATION' THEN 8
                WHEN d.stage = 'PROPOSAL' THEN 6
                WHEN d.stage = 'QUALIFICATION' THEN 4
                ELSE 3
            END as nivel_interesse,
            d.title as observacoes,
            d."expectedCloseDate" as data_visita,
            CASE WHEN d.stage IN ('PROPOSAL', 'NEGOTIATION', 'WON') THEN true ELSE false END as proposta_enviada,
            d.value as valor_proposta,
            CASE 
                WHEN d.stage = 'WON' THEN 'fechado'
                WHEN d.stage = 'LOST' THEN 'perdido'
                ELSE 'analisando'
            END as status,
            d."createdAt" as created_at,
            d."updatedAt" as updated_at
        FROM public."Deal" d
        LEFT JOIN public."Contact" cont ON cont.id = d."clientId"
        WHERE EXISTS (SELECT 1 FROM public.dados_cliente WHERE id = d."clientId")
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Migração Deal -> interesse_imoveis concluída';
    ELSE
        RAISE NOTICE 'Tabela Deal não existe, pulando migração';
    END IF;
END $$;

-- ========================================
-- 5. MIGRAÇÃO: WhatsAppMessage -> chat_messages (complementar)
-- ========================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'WhatsAppMessage' AND table_schema = 'public') THEN
        -- Migrar mensagens WhatsApp não migradas anteriormente
        INSERT INTO public.chat_messages (
            conversation_id,
            user_message,
            resposta_agent,
            message_type,
            is_from_me,
            status,
            metadata,
            timestamp,
            created_at
        )
        SELECT 
            wm."conversationId" as conversation_id,
            CASE WHEN wm."isFromMe" = false THEN wm.content ELSE NULL END as user_message,
            CASE WHEN wm."isFromMe" = true THEN wm.content ELSE NULL END as resposta_agent,
            wm."messageType" as message_type,
            wm."isFromMe" as is_from_me,
            wm."messageStatus" as status,
            wm.metadata,
            wm.timestamp,
            wm."createdAt" as created_at
        FROM public."WhatsAppMessage" wm
        WHERE NOT EXISTS (
            SELECT 1 FROM public.chat_messages cm 
            WHERE cm.conversation_id = wm."conversationId" 
            AND cm.timestamp = wm.timestamp
        )
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Migração WhatsAppMessage -> chat_messages concluída';
    ELSE
        RAISE NOTICE 'Tabela WhatsAppMessage não existe, pulando migração';
    END IF;
END $$;

-- ========================================
-- VALIDAÇÃO DA MIGRAÇÃO
-- ========================================

-- Contar registros migrados
DO $$
DECLARE
    v_dados_cliente_count INTEGER;
    v_chats_count INTEGER;
    v_chat_messages_count INTEGER;
    v_interesse_imoveis_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_dados_cliente_count FROM public.dados_cliente;
    SELECT COUNT(*) INTO v_chats_count FROM public.chats;
    SELECT COUNT(*) INTO v_chat_messages_count FROM public.chat_messages;
    SELECT COUNT(*) INTO v_interesse_imoveis_count FROM public.interesse_imoveis;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESULTADO DA MIGRAÇÃO:';
    RAISE NOTICE '- dados_cliente: % registros', v_dados_cliente_count;
    RAISE NOTICE '- chats: % registros', v_chats_count;
    RAISE NOTICE '- chat_messages: % registros', v_chat_messages_count;
    RAISE NOTICE '- interesse_imoveis: % registros', v_interesse_imoveis_count;
    RAISE NOTICE '========================================';
END $$;

-- Confirmar transação
COMMIT;

-- ========================================
-- FIM DO SCRIPT
-- ========================================