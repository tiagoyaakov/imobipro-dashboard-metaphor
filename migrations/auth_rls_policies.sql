-- =====================================================
-- RLS POLICIES para Autenticação Supabase
-- ImobiPRO Dashboard - Sistema de Autenticação
-- =====================================================
-- 
-- IMPORTANTE: Execute este arquivo no SQL Editor do Supabase
-- após configurar a autenticação no dashboard
-- 
-- Baseado em: docs/rules-supabase-auth.md
-- =====================================================

-- Primeiro, vamos habilitar RLS em todas as tabelas sensíveis
-- OBRIGATÓRIO: Conforme regra 4.1

-- Habilitar RLS para todas as tabelas principais
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Property" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Deal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Activity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Chat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA TABELA Company
-- =====================================================

-- Política para visualizar dados da própria empresa
CREATE POLICY "Users can view own company data" ON "Company"
FOR SELECT USING (
  id IN (
    SELECT "companyId" FROM "User" WHERE id = auth.uid()::text
  )
);

-- Política para atualizar dados da própria empresa (apenas ADMIN)
CREATE POLICY "Admins can update own company" ON "Company"
FOR UPDATE USING (
  id IN (
    SELECT "companyId" FROM "User" 
    WHERE id = auth.uid()::text 
    AND role IN ('ADMIN', 'CREATOR')
  )
);

-- =====================================================
-- POLÍTICAS PARA TABELA User
-- =====================================================

-- Política para usuários visualizarem próprios dados
CREATE POLICY "Users can view own profile" ON "User"
FOR SELECT USING (id = auth.uid()::text);

-- Política para usuários da mesma empresa se visualizarem
CREATE POLICY "Company users can view colleagues" ON "User"
FOR SELECT USING (
  "companyId" IN (
    SELECT "companyId" FROM "User" WHERE id = auth.uid()::text
  )
);

-- Política para usuários atualizarem próprio perfil
CREATE POLICY "Users can update own profile" ON "User"
FOR UPDATE USING (id = auth.uid()::text);

-- Política para ADMINs gerenciarem usuários da empresa
CREATE POLICY "Admins can manage company users" ON "User"
FOR ALL USING (
  "companyId" IN (
    SELECT "companyId" FROM "User" 
    WHERE id = auth.uid()::text 
    AND role IN ('ADMIN', 'CREATOR')
  )
);

-- =====================================================
-- POLÍTICAS PARA TABELA Property
-- =====================================================

-- Política para visualizar propriedades da empresa
CREATE POLICY "Users can view company properties" ON "Property"
FOR SELECT USING (
  "agentId" IN (
    SELECT id FROM "User" 
    WHERE "companyId" IN (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()::text
    )
  )
);

-- Política para agentes gerenciarem próprias propriedades
CREATE POLICY "Agents can manage own properties" ON "Property"
FOR ALL USING ("agentId" = auth.uid()::text);

-- Política para ADMINs gerenciarem todas as propriedades da empresa
CREATE POLICY "Admins can manage company properties" ON "Property"
FOR ALL USING (
  "agentId" IN (
    SELECT id FROM "User" 
    WHERE "companyId" IN (
      SELECT "companyId" FROM "User" 
      WHERE id = auth.uid()::text 
      AND role IN ('ADMIN', 'CREATOR')
    )
  )
);

-- =====================================================
-- POLÍTICAS PARA TABELA Contact
-- =====================================================

-- Política para visualizar contatos da empresa
CREATE POLICY "Users can view company contacts" ON "Contact"
FOR SELECT USING (
  "agentId" IN (
    SELECT id FROM "User" 
    WHERE "companyId" IN (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()::text
    )
  )
);

-- Política para agentes gerenciarem próprios contatos
CREATE POLICY "Agents can manage own contacts" ON "Contact"
FOR ALL USING ("agentId" = auth.uid()::text);

-- Política para ADMINs gerenciarem todos os contatos da empresa
CREATE POLICY "Admins can manage company contacts" ON "Contact"
FOR ALL USING (
  "agentId" IN (
    SELECT id FROM "User" 
    WHERE "companyId" IN (
      SELECT "companyId" FROM "User" 
      WHERE id = auth.uid()::text 
      AND role IN ('ADMIN', 'CREATOR')
    )
  )
);

-- =====================================================
-- POLÍTICAS PARA TABELA Appointment
-- =====================================================

-- Política para visualizar agendamentos da empresa
CREATE POLICY "Users can view company appointments" ON "Appointment"
FOR SELECT USING (
  "agentId" IN (
    SELECT id FROM "User" 
    WHERE "companyId" IN (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()::text
    )
  )
);

-- Política para agentes gerenciarem próprios agendamentos
CREATE POLICY "Agents can manage own appointments" ON "Appointment"
FOR ALL USING ("agentId" = auth.uid()::text);

-- =====================================================
-- POLÍTICAS PARA TABELA Deal
-- =====================================================

-- Política para visualizar negócios da empresa
CREATE POLICY "Users can view company deals" ON "Deal"
FOR SELECT USING (
  "agentId" IN (
    SELECT id FROM "User" 
    WHERE "companyId" IN (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()::text
    )
  )
);

-- Política para agentes gerenciarem próprios negócios
CREATE POLICY "Agents can manage own deals" ON "Deal"
FOR ALL USING ("agentId" = auth.uid()::text);

-- =====================================================
-- POLÍTICAS PARA TABELA Activity
-- =====================================================

-- Política para visualizar atividades da empresa
CREATE POLICY "Users can view company activities" ON "Activity"
FOR SELECT USING (
  "userId" IN (
    SELECT id FROM "User" 
    WHERE "companyId" IN (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()::text
    )
  )
);

-- Política para inserir próprias atividades
CREATE POLICY "Users can insert own activities" ON "Activity"
FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

-- =====================================================
-- POLÍTICAS PARA TABELA Chat
-- =====================================================

-- Política para visualizar chats da empresa
CREATE POLICY "Users can view company chats" ON "Chat"
FOR SELECT USING (
  "agentId" IN (
    SELECT id FROM "User" 
    WHERE "companyId" IN (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()::text
    )
  )
);

-- Política para agentes gerenciarem próprios chats
CREATE POLICY "Agents can manage own chats" ON "Chat"
FOR ALL USING ("agentId" = auth.uid()::text);

-- =====================================================
-- POLÍTICAS PARA TABELA Message
-- =====================================================

-- Política para visualizar mensagens de chats da empresa
CREATE POLICY "Users can view company messages" ON "Message"
FOR SELECT USING (
  "chatId" IN (
    SELECT id FROM "Chat" 
    WHERE "agentId" IN (
      SELECT id FROM "User" 
      WHERE "companyId" IN (
        SELECT "companyId" FROM "User" WHERE id = auth.uid()::text
      )
    )
  )
);

-- Política para inserir mensagens em chats próprios
CREATE POLICY "Users can send messages in own chats" ON "Message"
FOR INSERT WITH CHECK (
  "senderId" = auth.uid()::text
  AND "chatId" IN (
    SELECT id FROM "Chat" 
    WHERE "agentId" = auth.uid()::text
  )
);

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para verificar se usuário pertence à empresa
CREATE OR REPLACE FUNCTION auth.user_company_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT "companyId" FROM "User" 
    WHERE id = auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role IN ('ADMIN', 'CREATOR') FROM "User" 
    WHERE id = auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS PARA INTEGRAÇÃO COM AUTH.USERS
-- =====================================================

-- Trigger para criar usuário na tabela User quando criado em auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir novo usuário na tabela User
  -- Nota: Será necessário definir companyId via aplicação
  INSERT INTO "User" (id, email, name, password, role, "companyId")
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    '', -- Password é gerenciado pelo Supabase Auth
    'AGENT'::UserRole,
    COALESCE(NEW.raw_user_meta_data->>'companyId', 
      (SELECT id FROM "Company" LIMIT 1)) -- Fallback para primeira empresa
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

-- IMPORTANTE: Após executar este arquivo:
-- 1. Verificar se todas as políticas foram criadas sem erro
-- 2. Testar autenticação com usuário de teste
-- 3. Verificar se RLS está funcionando corretamente
-- 4. Configurar email templates no dashboard do Supabase
-- 5. Definir redirect URLs para produção

-- Para testar RLS:
-- SELECT * FROM "User"; -- Deve retornar apenas dados do usuário logado
-- SELECT * FROM "Property"; -- Deve retornar apenas propriedades da empresa

-- Para desabilitar RLS temporariamente (APENAS DESENVOLVIMENTO):
-- ALTER TABLE "TableName" DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- FIM DO ARQUIVO
-- ===================================================== 