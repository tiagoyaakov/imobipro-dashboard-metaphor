-- =====================================================
-- FASE 3: RLS COMPLETO - POLÍTICAS DE SEGURANÇA
-- =====================================================
-- Data: 01/08/2025
-- Descrição: Implementação completa de Row Level Security
-- para todas as tabelas do sistema ImobiPRO
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_conflict_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_workflow_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_campaign_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_connection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_histories ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FUNÇÕES AUXILIARES PARA RLS
-- =====================================================

-- Função para obter o role do usuário atual
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role FROM users WHERE id = auth.uid()),
    'AGENT'  -- Fallback seguro
  )::TEXT
$$;

-- Função para obter o company_id do usuário atual
CREATE OR REPLACE FUNCTION auth.user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT company_id FROM users WHERE id = auth.uid()
$$;

-- Função para verificar se é DEV_MASTER
CREATE OR REPLACE FUNCTION auth.is_dev_master()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT auth.user_role() = 'DEV_MASTER'
$$;

-- Função para verificar se é ADMIN
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT auth.user_role() IN ('DEV_MASTER', 'ADMIN')
$$;

-- Função para verificar se pertence à mesma empresa
CREATE OR REPLACE FUNCTION auth.same_company(company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT auth.user_company_id() = company_id OR auth.is_dev_master()
$$;

-- =====================================================
-- POLÍTICAS PARA TABELA: companies
-- =====================================================

-- SELECT: DEV_MASTER vê todas, outros vêem apenas sua empresa
CREATE POLICY "companies_select_policy" ON companies
FOR SELECT USING (
  auth.is_dev_master() OR 
  id = auth.user_company_id()
);

-- INSERT: Apenas DEV_MASTER pode criar empresas
CREATE POLICY "companies_insert_policy" ON companies
FOR INSERT WITH CHECK (
  auth.is_dev_master()
);

-- UPDATE: DEV_MASTER todas, ADMIN sua própria
CREATE POLICY "companies_update_policy" ON companies
FOR UPDATE USING (
  auth.is_dev_master() OR 
  (auth.is_admin() AND id = auth.user_company_id())
);

-- DELETE: Apenas DEV_MASTER
CREATE POLICY "companies_delete_policy" ON companies
FOR DELETE USING (
  auth.is_dev_master()
);

-- =====================================================
-- POLÍTICAS PARA TABELA: users
-- =====================================================

-- SELECT: DEV_MASTER todos, ADMIN sua empresa, AGENT apenas si mesmo
CREATE POLICY "users_select_policy" ON users
FOR SELECT USING (
  CASE 
    WHEN auth.is_dev_master() THEN true
    WHEN auth.is_admin() THEN company_id = auth.user_company_id()
    ELSE id = auth.uid()
  END
);

-- INSERT: DEV_MASTER e ADMIN podem criar usuários
CREATE POLICY "users_insert_policy" ON users
FOR INSERT WITH CHECK (
  auth.is_dev_master() OR
  (auth.is_admin() AND company_id = auth.user_company_id() AND role = 'AGENT')
);

-- UPDATE: DEV_MASTER todos, ADMIN sua empresa (exceto DEV_MASTER), AGENT apenas perfil próprio
CREATE POLICY "users_update_policy" ON users
FOR UPDATE USING (
  CASE
    WHEN auth.is_dev_master() THEN true
    WHEN auth.is_admin() THEN 
      company_id = auth.user_company_id() AND 
      role != 'DEV_MASTER' AND
      id != auth.uid()  -- Não pode editar a si mesmo como ADMIN
    ELSE id = auth.uid()  -- AGENT edita apenas perfil próprio
  END
);

-- DELETE: Apenas DEV_MASTER
CREATE POLICY "users_delete_policy" ON users
FOR DELETE USING (
  auth.is_dev_master()
);

-- =====================================================
-- POLÍTICAS PARA TABELA: properties
-- =====================================================

-- SELECT: Todos da mesma empresa
CREATE POLICY "properties_select_policy" ON properties
FOR SELECT USING (
  auth.same_company(
    (SELECT company_id FROM users WHERE id = agent_id)
  )
);

-- INSERT: ADMIN e AGENT da mesma empresa
CREATE POLICY "properties_insert_policy" ON properties
FOR INSERT WITH CHECK (
  agent_id = auth.uid() OR
  (auth.is_admin() AND auth.same_company(
    (SELECT company_id FROM users WHERE id = agent_id)
  ))
);

-- UPDATE: Próprio agente ou ADMIN da empresa
CREATE POLICY "properties_update_policy" ON properties
FOR UPDATE USING (
  agent_id = auth.uid() OR
  (auth.is_admin() AND auth.same_company(
    (SELECT company_id FROM users WHERE id = agent_id)
  ))
);

-- DELETE: Apenas ADMIN da empresa
CREATE POLICY "properties_delete_policy" ON properties
FOR DELETE USING (
  auth.is_admin() AND auth.same_company(
    (SELECT company_id FROM users WHERE id = agent_id)
  )
);

-- =====================================================
-- POLÍTICAS PARA TABELA: contacts
-- =====================================================

-- SELECT: ADMIN vê todos da empresa, AGENT vê apenas seus
CREATE POLICY "contacts_select_policy" ON contacts
FOR SELECT USING (
  agent_id = auth.uid() OR
  (auth.is_admin() AND auth.same_company(
    (SELECT company_id FROM users WHERE id = agent_id)
  ))
);

-- INSERT: AGENT pode criar seus contatos
CREATE POLICY "contacts_insert_policy" ON contacts
FOR INSERT WITH CHECK (
  agent_id = auth.uid()
);

-- UPDATE: Próprio agente ou ADMIN da empresa
CREATE POLICY "contacts_update_policy" ON contacts
FOR UPDATE USING (
  agent_id = auth.uid() OR
  (auth.is_admin() AND auth.same_company(
    (SELECT company_id FROM users WHERE id = agent_id)
  ))
);

-- DELETE: Próprio agente ou ADMIN da empresa
CREATE POLICY "contacts_delete_policy" ON contacts
FOR DELETE USING (
  agent_id = auth.uid() OR
  (auth.is_admin() AND auth.same_company(
    (SELECT company_id FROM users WHERE id = agent_id)
  ))
);

-- =====================================================
-- POLÍTICAS PARA TABELA: appointments
-- =====================================================

-- SELECT: ADMIN vê todos da empresa, AGENT vê apenas seus
CREATE POLICY "appointments_select_policy" ON appointments
FOR SELECT USING (
  agent_id = auth.uid() OR
  (auth.is_admin() AND auth.same_company(
    (SELECT company_id FROM users WHERE id = agent_id)
  ))
);

-- INSERT: AGENT pode criar seus agendamentos
CREATE POLICY "appointments_insert_policy" ON appointments
FOR INSERT WITH CHECK (
  agent_id = auth.uid()
);

-- UPDATE: Próprio agente ou ADMIN da empresa
CREATE POLICY "appointments_update_policy" ON appointments
FOR UPDATE USING (
  agent_id = auth.uid() OR
  (auth.is_admin() AND auth.same_company(
    (SELECT company_id FROM users WHERE id = agent_id)
  ))
);

-- DELETE: Próprio agente ou ADMIN da empresa
CREATE POLICY "appointments_delete_policy" ON appointments
FOR DELETE USING (
  agent_id = auth.uid() OR
  (auth.is_admin() AND auth.same_company(
    (SELECT company_id FROM users WHERE id = agent_id)
  ))
);

-- =====================================================
-- POLÍTICAS PARA TABELA: deals
-- =====================================================

-- SELECT: ADMIN vê todos da empresa, AGENT vê apenas seus
CREATE POLICY "deals_select_policy" ON deals
FOR SELECT USING (
  agent_id = auth.uid() OR
  (auth.is_admin() AND auth.same_company(
    (SELECT company_id FROM users WHERE id = agent_id)
  ))
);

-- INSERT: AGENT pode criar seus negócios
CREATE POLICY "deals_insert_policy" ON deals
FOR INSERT WITH CHECK (
  agent_id = auth.uid()
);

-- UPDATE: Próprio agente ou ADMIN da empresa
CREATE POLICY "deals_update_policy" ON deals
FOR UPDATE USING (
  agent_id = auth.uid() OR
  (auth.is_admin() AND auth.same_company(
    (SELECT company_id FROM users WHERE id = agent_id)
  ))
);

-- DELETE: Apenas ADMIN da empresa
CREATE POLICY "deals_delete_policy" ON deals
FOR DELETE USING (
  auth.is_admin() AND auth.same_company(
    (SELECT company_id FROM users WHERE id = agent_id)
  )
);

-- =====================================================
-- POLÍTICAS PARA TABELA: activities
-- =====================================================

-- SELECT: Todos da mesma empresa
CREATE POLICY "activities_select_policy" ON activities
FOR SELECT USING (
  auth.same_company(
    (SELECT company_id FROM users WHERE id = user_id)
  )
);

-- INSERT: Qualquer usuário autenticado (atividades são logs)
CREATE POLICY "activities_insert_policy" ON activities
FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- UPDATE/DELETE: Ninguém (atividades são imutáveis)
-- Não criar políticas de UPDATE/DELETE para manter histórico íntegro

-- =====================================================
-- POLÍTICAS PARA TABELA: chats
-- =====================================================

-- SELECT: ADMIN vê todos da empresa, AGENT vê apenas seus
CREATE POLICY "chats_select_policy" ON chats
FOR SELECT USING (
  agent_id = auth.uid() OR
  (auth.is_admin() AND auth.same_company(
    (SELECT company_id FROM users WHERE id = agent_id)
  ))
);

-- INSERT: AGENT pode criar chats
CREATE POLICY "chats_insert_policy" ON chats
FOR INSERT WITH CHECK (
  agent_id = auth.uid()
);

-- UPDATE: Próprio agente ou ADMIN da empresa
CREATE POLICY "chats_update_policy" ON chats
FOR UPDATE USING (
  agent_id = auth.uid() OR
  (auth.is_admin() AND auth.same_company(
    (SELECT company_id FROM users WHERE id = agent_id)
  ))
);

-- DELETE: Apenas ADMIN da empresa
CREATE POLICY "chats_delete_policy" ON chats
FOR DELETE USING (
  auth.is_admin() AND auth.same_company(
    (SELECT company_id FROM users WHERE id = agent_id)
  )
);

-- =====================================================
-- POLÍTICAS PARA TABELA: messages
-- =====================================================

-- SELECT: Baseado no chat associado
CREATE POLICY "messages_select_policy" ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chats 
    WHERE chats.id = messages.chat_id
    AND (
      chats.agent_id = auth.uid() OR
      (auth.is_admin() AND auth.same_company(
        (SELECT company_id FROM users WHERE id = chats.agent_id)
      ))
    )
  )
);

-- INSERT: Se tem acesso ao chat
CREATE POLICY "messages_insert_policy" ON messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM chats 
    WHERE chats.id = messages.chat_id
    AND (
      chats.agent_id = auth.uid() OR
      (auth.is_admin() AND auth.same_company(
        (SELECT company_id FROM users WHERE id = chats.agent_id)
      ))
    )
  )
);

-- UPDATE/DELETE: Não permitido (mensagens são imutáveis)

-- =====================================================
-- POLÍTICAS PARA TABELAS DE AGENDA
-- =====================================================

-- agent_schedules: Próprio agente ou ADMIN
CREATE POLICY "agent_schedules_select_policy" ON agent_schedules
FOR SELECT USING (
  agent_id = auth.uid() OR
  (auth.is_admin() AND auth.same_company(
    (SELECT company_id FROM users WHERE id = agent_id)
  ))
);

CREATE POLICY "agent_schedules_insert_policy" ON agent_schedules
FOR INSERT WITH CHECK (
  agent_id = auth.uid()
);

CREATE POLICY "agent_schedules_update_policy" ON agent_schedules
FOR UPDATE USING (
  agent_id = auth.uid() OR
  (auth.is_admin() AND auth.same_company(
    (SELECT company_id FROM users WHERE id = agent_id)
  ))
);

-- availability_slots: Similar a agent_schedules
CREATE POLICY "availability_slots_select_policy" ON availability_slots
FOR SELECT USING (
  agent_id = auth.uid() OR
  (auth.is_admin() AND auth.same_company(
    (SELECT company_id FROM users WHERE id = agent_id)
  ))
);

CREATE POLICY "availability_slots_insert_policy" ON availability_slots
FOR INSERT WITH CHECK (
  agent_id = auth.uid()
);

CREATE POLICY "availability_slots_update_policy" ON availability_slots
FOR UPDATE USING (
  agent_id = auth.uid() OR
  (auth.is_admin() AND auth.same_company(
    (SELECT company_id FROM users WHERE id = agent_id)
  ))
);

-- =====================================================
-- POLÍTICAS PARA GOOGLE CALENDAR
-- =====================================================

-- google_calendar_credentials: Apenas próprio usuário
CREATE POLICY "google_calendar_credentials_policy" ON google_calendar_credentials
FOR ALL USING (user_id = auth.uid());

-- google_calendar_configs: Baseado nas credenciais
CREATE POLICY "google_calendar_configs_policy" ON google_calendar_configs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM google_calendar_credentials
    WHERE google_calendar_credentials.id = credential_id
    AND google_calendar_credentials.user_id = auth.uid()
  )
);

-- =====================================================
-- POLÍTICAS PARA N8N
-- =====================================================

-- n8n_workflow_configs: ADMIN da empresa ou agente específico
CREATE POLICY "n8n_workflow_configs_select_policy" ON n8n_workflow_configs
FOR SELECT USING (
  (company_id IS NOT NULL AND auth.same_company(company_id)) OR
  (agent_id IS NOT NULL AND agent_id = auth.uid()) OR
  auth.is_dev_master()
);

CREATE POLICY "n8n_workflow_configs_insert_policy" ON n8n_workflow_configs
FOR INSERT WITH CHECK (
  auth.is_admin() OR auth.is_dev_master()
);

CREATE POLICY "n8n_workflow_configs_update_policy" ON n8n_workflow_configs
FOR UPDATE USING (
  auth.is_admin() OR auth.is_dev_master()
);

-- =====================================================
-- POLÍTICAS PARA WHATSAPP
-- =====================================================

-- whatsapp_instances: Próprio agente ou ADMIN
CREATE POLICY "whatsapp_instances_select_policy" ON whatsapp_instances
FOR SELECT USING (
  agent_id = auth.uid() OR
  auth.is_admin()
);

CREATE POLICY "whatsapp_instances_insert_policy" ON whatsapp_instances
FOR INSERT WITH CHECK (
  (agent_id = auth.uid() AND auth.is_admin()) OR
  auth.is_dev_master()
);

CREATE POLICY "whatsapp_instances_update_policy" ON whatsapp_instances
FOR UPDATE USING (
  agent_id = auth.uid() OR
  auth.is_admin()
);

-- whatsapp_configs: ADMIN da empresa
CREATE POLICY "whatsapp_configs_policy" ON whatsapp_configs
FOR ALL USING (
  auth.is_admin() AND company_id = auth.user_company_id()
);

-- =====================================================
-- POLÍTICAS PARA RELATÓRIOS
-- =====================================================

-- report_templates: Mesma empresa
CREATE POLICY "report_templates_select_policy" ON report_templates
FOR SELECT USING (
  auth.same_company(company_id)
);

CREATE POLICY "report_templates_insert_policy" ON report_templates
FOR INSERT WITH CHECK (
  auth.is_admin() AND company_id = auth.user_company_id()
);

CREATE POLICY "report_templates_update_policy" ON report_templates
FOR UPDATE USING (
  auth.is_admin() AND company_id = auth.user_company_id()
);

-- scheduled_reports: Similar a templates
CREATE POLICY "scheduled_reports_select_policy" ON scheduled_reports
FOR SELECT USING (
  auth.same_company(company_id)
);

CREATE POLICY "scheduled_reports_insert_policy" ON scheduled_reports
FOR INSERT WITH CHECK (
  auth.is_admin() AND company_id = auth.user_company_id()
);

CREATE POLICY "scheduled_reports_update_policy" ON scheduled_reports
FOR UPDATE USING (
  auth.is_admin() AND company_id = auth.user_company_id()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Criar índices para melhorar performance das políticas RLS
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON properties(agent_id);
CREATE INDEX IF NOT EXISTS idx_contacts_agent_id ON contacts(agent_id);
CREATE INDEX IF NOT EXISTS idx_appointments_agent_id ON appointments(agent_id);
CREATE INDEX IF NOT EXISTS idx_deals_agent_id ON deals(agent_id);
CREATE INDEX IF NOT EXISTS idx_chats_agent_id ON chats(agent_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);

-- =====================================================
-- GRANT PERMISSÕES NECESSÁRIAS
-- =====================================================

-- Garantir que authenticated users possam executar as funções
GRANT EXECUTE ON FUNCTION auth.user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.user_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_dev_master() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.same_company(UUID) TO authenticated;

-- =====================================================
-- COMENTÁRIOS DE DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION auth.user_role() IS 'Retorna o role do usuário atual (DEV_MASTER, ADMIN ou AGENT)';
COMMENT ON FUNCTION auth.user_company_id() IS 'Retorna o company_id do usuário atual';
COMMENT ON FUNCTION auth.is_dev_master() IS 'Verifica se o usuário atual é DEV_MASTER';
COMMENT ON FUNCTION auth.is_admin() IS 'Verifica se o usuário atual é ADMIN ou DEV_MASTER';
COMMENT ON FUNCTION auth.same_company(UUID) IS 'Verifica se o usuário pertence à mesma empresa ou é DEV_MASTER';