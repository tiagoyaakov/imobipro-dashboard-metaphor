-- 🔲 ImobiPRO - Correção de Permissões para Tabela Contact
-- 
-- Este script corrige as permissões RLS (Row Level Security) da tabela Contact
-- para permitir que usuários autenticados possam criar e gerenciar leads.
--
-- Autor: ImobiPRO Team
-- Data: 2024-01-15

-- ============================================================================
-- 1. VERIFICAR SE A TABELA CONTACT EXISTE
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Contact') THEN
        RAISE EXCEPTION 'Tabela Contact não encontrada. Execute primeiro as migrações do Prisma.';
    END IF;
END $$;

-- ============================================================================
-- 2. HABILITAR RLS NA TABELA CONTACT
-- ============================================================================

ALTER TABLE "Contact" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. REMOVER POLÍTICAS EXISTENTES (SE HOUVER CONFLITOS)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own contacts" ON "Contact";
DROP POLICY IF EXISTS "Users can insert own contacts" ON "Contact";
DROP POLICY IF EXISTS "Users can update own contacts" ON "Contact";
DROP POLICY IF EXISTS "Users can delete own contacts" ON "Contact";
DROP POLICY IF EXISTS "Agents can manage leads" ON "Contact";
DROP POLICY IF EXISTS "Admins can manage all contacts" ON "Contact";

-- ============================================================================
-- 4. CRIAR POLÍTICAS DE ACESSO PARA LEADS
-- ============================================================================

-- Política para visualizar contatos
-- Usuários podem ver seus próprios leads ou leads atribuídos a eles
CREATE POLICY "Users can view accessible contacts" ON "Contact"
    FOR SELECT
    USING (
        auth.uid()::text = "agentId" OR
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE "User".id = auth.uid()::text 
            AND "User".role IN ('ADMIN', 'CREATOR')
        )
    );

-- Política para inserir novos leads
-- Usuários autenticados podem criar leads
CREATE POLICY "Authenticated users can create contacts" ON "Contact"
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        (
            auth.uid()::text = "agentId" OR
            EXISTS (
                SELECT 1 FROM "User" 
                WHERE "User".id = auth.uid()::text 
                AND "User".role IN ('ADMIN', 'CREATOR', 'AGENT')
            )
        )
    );

-- Política para atualizar leads
-- Usuários podem atualizar seus próprios leads
CREATE POLICY "Users can update own contacts" ON "Contact"
    FOR UPDATE
    USING (
        auth.uid()::text = "agentId" OR
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE "User".id = auth.uid()::text 
            AND "User".role IN ('ADMIN', 'CREATOR')
        )
    );

-- Política para deletar leads
-- Apenas admins podem deletar leads
CREATE POLICY "Admins can delete contacts" ON "Contact"
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE "User".id = auth.uid()::text 
            AND "User".role IN ('ADMIN', 'CREATOR')
        )
    );

-- ============================================================================
-- 5. CRIAR FUNÇÃO PARA VERIFICAR PERMISSÕES
-- ============================================================================

CREATE OR REPLACE FUNCTION check_contact_permissions()
RETURNS TABLE (
    can_select boolean,
    can_insert boolean,
    can_update boolean,
    can_delete boolean,
    user_id text,
    user_role text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Teste de SELECT
        EXISTS(SELECT 1 FROM "Contact" LIMIT 1) as can_select,
        
        -- Teste de INSERT (simulado)
        (auth.role() = 'authenticated') as can_insert,
        
        -- Teste de UPDATE (simulado)  
        (auth.role() = 'authenticated') as can_update,
        
        -- Teste de DELETE (simulado)
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE "User".id = auth.uid()::text 
            AND "User".role IN ('ADMIN', 'CREATOR')
        ) as can_delete,
        
        -- Informações do usuário
        auth.uid()::text as user_id,
        COALESCE(
            (SELECT "User".role FROM "User" WHERE "User".id = auth.uid()::text),
            'unknown'::text
        ) as user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. CRIAR FUNÇÃO PARA CRIAÇÃO DE LEAD VIA API
-- ============================================================================

CREATE OR REPLACE FUNCTION create_lead_via_api(
    p_name text,
    p_email text DEFAULT NULL,
    p_phone text DEFAULT NULL,
    p_lead_source text DEFAULT 'Site',
    p_lead_source_details text DEFAULT NULL,
    p_company text DEFAULT NULL,
    p_position text DEFAULT NULL,
    p_budget numeric DEFAULT NULL,
    p_timeline text DEFAULT NULL,
    p_preferences jsonb DEFAULT '{}',
    p_tags text[] DEFAULT '{}',
    p_priority text DEFAULT 'MEDIUM',
    p_agent_id text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
    new_contact_id text;
    result jsonb;
    initial_score integer;
BEGIN
    -- Verificar se o usuário está autenticado
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Calcular score inicial simples
    initial_score := 50;
    IF p_budget IS NOT NULL AND p_budget > 500000 THEN
        initial_score := initial_score + 20;
    END IF;
    IF p_lead_source = 'Indicação' THEN
        initial_score := initial_score + 15;
    END IF;
    
    -- Usar o ID do usuário atual se agent_id não foi fornecido
    IF p_agent_id IS NULL THEN
        p_agent_id := auth.uid()::text;
    END IF;
    
    -- Inserir o novo contato
    INSERT INTO "Contact" (
        id,
        name,
        email,
        phone,
        category,
        status,
        "leadStage",
        "leadScore",
        "leadSource",
        "leadSourceDetails",
        company,
        position,
        budget,
        timeline,
        preferences,
        tags,
        priority,
        "isQualified",
        unsubscribed,
        "optInWhatsApp",
        "optInEmail",
        "optInSMS",
        "agentId",
        "interactionCount",
        "engagementLevel",
        "createdAt",
        "updatedAt"
    ) VALUES (
        gen_random_uuid()::text,
        p_name,
        p_email,
        p_phone,
        'LEAD',
        'NEW',
        'NEW',
        initial_score,
        p_lead_source,
        p_lead_source_details,
        p_company,
        p_position,
        p_budget,
        p_timeline,
        p_preferences,
        p_tags,
        p_priority,
        false,
        false,
        false,
        false,
        false,
        p_agent_id,
        0,
        'LOW',
        now(),
        now()
    ) RETURNING id INTO new_contact_id;
    
    -- Buscar o contato criado com dados do agente
    SELECT jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'email', c.email,
        'phone', c.phone,
        'leadStage', c."leadStage",
        'leadScore', c."leadScore",
        'leadSource', c."leadSource",
        'leadSourceDetails', c."leadSourceDetails",
        'company', c.company,
        'position', c.position,
        'budget', c.budget,
        'timeline', c.timeline,
        'preferences', c.preferences,
        'tags', c.tags,
        'priority', c.priority,
        'isQualified', c."isQualified",
        'agentId', c."agentId",
        'agent', jsonb_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email
        ),
        'createdAt', c."createdAt",
        'updatedAt', c."updatedAt"
    )
    INTO result
    FROM "Contact" c
    LEFT JOIN "User" u ON u.id = c."agentId"
    WHERE c.id = new_contact_id;
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao criar lead: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. CONCEDER PERMISSÕES DE EXECUÇÃO
-- ============================================================================

GRANT EXECUTE ON FUNCTION check_contact_permissions() TO authenticated;
GRANT EXECUTE ON FUNCTION create_lead_via_api(text,text,text,text,text,text,text,numeric,text,jsonb,text[],text,text) TO authenticated;

-- ============================================================================
-- 8. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices já existem no schema Prisma, mas vamos garantir alguns importantes
CREATE INDEX IF NOT EXISTS "Contact_agentId_leadStage_idx" ON "Contact"("agentId", "leadStage");
CREATE INDEX IF NOT EXISTS "Contact_leadSource_createdAt_idx" ON "Contact"("leadSource", "createdAt");
CREATE INDEX IF NOT EXISTS "Contact_leadScore_idx" ON "Contact"("leadScore" DESC);

-- ============================================================================
-- 9. MENSAGEM DE SUCESSO
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Permissões da tabela Contact configuradas com sucesso!';
    RAISE NOTICE '   - RLS habilitado';
    RAISE NOTICE '   - Políticas de acesso criadas';
    RAISE NOTICE '   - Função de criação de lead disponível';
    RAISE NOTICE '   - Índices de performance criados';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Para testar as permissões, execute:';
    RAISE NOTICE '   SELECT * FROM check_contact_permissions();';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Para criar um lead via SQL, execute:';
    RAISE NOTICE '   SELECT create_lead_via_api(''Nome Teste'', ''teste@email.com'', ''11999999999'');';
END $$;