-- =====================================================
-- FUNÇÕES DE GERENCIAMENTO DE USUÁRIOS - ImobiPRO Dashboard
-- =====================================================
-- 
-- IMPORTANTE: Execute este arquivo no SQL Editor do Supabase
-- para habilitar o sistema completo de gerenciamento de usuários
-- 
-- Baseado em: docs/architecture.md
-- =====================================================

-- Habilitar extensão uuid-ossp se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- FUNÇÃO PARA VERIFICAR SE USUÁRIO É DEV_MASTER
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_dev_master_user(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id::text 
    AND role = 'DEV_MASTER'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO PARA VERIFICAR SE USUÁRIO É ADMIN
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id::text 
    AND role = 'ADMIN'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO PARA CRIAR NOVO USUÁRIO
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_user(
  user_email TEXT,
  user_name TEXT,
  user_role TEXT,
  user_company_id TEXT,
  user_telefone TEXT DEFAULT NULL,
  user_avatar_url TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  new_user_id UUID;
  current_user_role TEXT;
  has_permission BOOLEAN := false;
BEGIN
  -- Verificar se usuário atual tem permissão para criar usuários
  SELECT role INTO current_user_role 
  FROM public.users 
  WHERE id = auth.uid()::text 
  AND is_active = true;

  -- DEV_MASTER pode criar ADMIN e AGENT
  -- ADMIN pode criar apenas AGENT
  IF current_user_role = 'DEV_MASTER' THEN
    has_permission := user_role IN ('ADMIN', 'AGENT');
  ELSIF current_user_role = 'ADMIN' THEN
    has_permission := user_role = 'AGENT';
  END IF;

  IF NOT has_permission THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Você não tem permissão para criar usuários com esta função'
    );
  END IF;

  -- Verificar se email já existe
  IF EXISTS (SELECT 1 FROM public.users WHERE email = user_email) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email já está em uso'
    );
  END IF;

  -- Verificar se company_id existe
  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = user_company_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Empresa não encontrada'
    );
  END IF;

  -- Validar role
  IF user_role NOT IN ('DEV_MASTER', 'ADMIN', 'AGENT') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Função inválida'
    );
  END IF;

  -- Gerar senha temporária (hash simples para demonstração)
  -- Em produção, usar bcrypt ou similar
  new_user_id := uuid_generate_v4();

  -- Inserir novo usuário
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    is_active,
    company_id,
    telefone,
    avatar_url,
    created_at,
    updated_at
  ) VALUES (
    new_user_id::text,
    user_email,
    user_name,
    user_role::user_role,
    true,
    user_company_id,
    user_telefone,
    user_avatar_url,
    NOW(),
    NOW()
  );

  -- Retornar sucesso com dados do usuário criado
  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', new_user_id::text,
      'email', user_email,
      'name', user_name,
      'role', user_role,
      'is_active', true,
      'company_id', user_company_id,
      'telefone', user_telefone,
      'avatar_url', user_avatar_url,
      'created_at', NOW(),
      'updated_at', NOW()
    ),
    'message', 'Usuário criado com sucesso'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Erro interno: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO PARA ATUALIZAR FUNÇÃO DO USUÁRIO
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_user_role(
  target_user_id UUID,
  new_role TEXT,
  reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  current_user_role TEXT;
  target_user_role TEXT;
  has_permission BOOLEAN := false;
BEGIN
  -- Verificar se usuário atual tem permissão
  SELECT role INTO current_user_role 
  FROM public.users 
  WHERE id = auth.uid()::text 
  AND is_active = true;

  -- Verificar função do usuário alvo
  SELECT role INTO target_user_role 
  FROM public.users 
  WHERE id = target_user_id::text 
  AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário alvo não encontrado'
    );
  END IF;

  -- Verificar permissões
  IF current_user_role = 'DEV_MASTER' THEN
    -- DEV_MASTER pode promover AGENT para ADMIN
    has_permission := target_user_role = 'AGENT' AND new_role = 'ADMIN';
  ELSIF current_user_role = 'ADMIN' THEN
    -- ADMIN não pode alterar funções
    has_permission := false;
  END IF;

  IF NOT has_permission THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Você não tem permissão para alterar esta função'
    );
  END IF;

  -- Verificar se não está tentando alterar a si mesmo
  IF auth.uid() = target_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Você não pode alterar sua própria função'
    );
  END IF;

  -- Atualizar função
  UPDATE public.users 
  SET role = new_role::user_role, updated_at = NOW()
  WHERE id = target_user_id::text;

  -- Registrar atividade (se tabela de atividades existir)
  -- INSERT INTO public.activities (user_id, activity_type, details) VALUES ...

  RETURN json_build_object(
    'success', true,
    'message', 'Função atualizada com sucesso',
    'old_role', target_user_role,
    'new_role', new_role
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Erro interno: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO PARA ATIVAR/DESATIVAR USUÁRIO
-- =====================================================

CREATE OR REPLACE FUNCTION public.toggle_user_status(
  target_user_id UUID,
  new_status BOOLEAN,
  reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  current_user_role TEXT;
  target_user_role TEXT;
  has_permission BOOLEAN := false;
BEGIN
  -- Verificar se usuário atual tem permissão
  SELECT role INTO current_user_role 
  FROM public.users 
  WHERE id = auth.uid()::text 
  AND is_active = true;

  -- Verificar função do usuário alvo
  SELECT role INTO target_user_role 
  FROM public.users 
  WHERE id = target_user_id::text;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário alvo não encontrado'
    );
  END IF;

  -- Verificar permissões
  IF current_user_role = 'DEV_MASTER' THEN
    -- DEV_MASTER pode ativar/desativar ADMIN e AGENT
    has_permission := target_user_role IN ('ADMIN', 'AGENT');
  ELSIF current_user_role = 'ADMIN' THEN
    -- ADMIN pode ativar/desativar apenas AGENT
    has_permission := target_user_role = 'AGENT';
  END IF;

  IF NOT has_permission THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Você não tem permissão para alterar o status deste usuário'
    );
  END IF;

  -- Verificar se não está tentando alterar a si mesmo
  IF auth.uid() = target_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Você não pode alterar seu próprio status'
    );
  END IF;

  -- Atualizar status
  UPDATE public.users 
  SET is_active = new_status, updated_at = NOW()
  WHERE id = target_user_id::text;

  -- Registrar atividade (se tabela de atividades existir)
  -- INSERT INTO public.activities (user_id, activity_type, details) VALUES ...

  RETURN json_build_object(
    'success', true,
    'message', CASE 
      WHEN new_status THEN 'Usuário ativado com sucesso'
      ELSE 'Usuário desativado com sucesso'
    END,
    'new_status', new_status
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Erro interno: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO PARA LISTAR USUÁRIOS COM PERMISSÕES
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_manageable_users()
RETURNS TABLE (
  id TEXT,
  email TEXT,
  name TEXT,
  role TEXT,
  is_active BOOLEAN,
  company_id TEXT,
  avatar_url TEXT,
  telefone TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Verificar se usuário atual tem permissão
  SELECT role INTO current_user_role 
  FROM public.users 
  WHERE id = auth.uid()::text 
  AND is_active = true;

  IF current_user_role IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado ou inativo';
  END IF;

  -- Retornar usuários baseado na hierarquia
  IF current_user_role = 'DEV_MASTER' THEN
    -- DEV_MASTER pode ver ADMIN e AGENT
    RETURN QUERY
    SELECT 
      u.id,
      u.email,
      u.name,
      u.role::text,
      u.is_active,
      u.company_id,
      u.avatar_url,
      u.telefone,
      u.created_at,
      u.updated_at
    FROM public.users u
    WHERE u.role IN ('ADMIN', 'AGENT')
    ORDER BY u.created_at DESC;
  ELSIF current_user_role = 'ADMIN' THEN
    -- ADMIN pode ver apenas AGENT
    RETURN QUERY
    SELECT 
      u.id,
      u.email,
      u.name,
      u.role::text,
      u.is_active,
      u.company_id,
      u.avatar_url,
      u.telefone,
      u.created_at,
      u.updated_at
    FROM public.users u
    WHERE u.role = 'AGENT'
    ORDER BY u.created_at DESC;
  ELSE
    -- AGENT não pode ver outros usuários
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO PARA OBTER DADOS DE UMA EMPRESA
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_company_info(company_id TEXT)
RETURNS JSON AS $$
DECLARE
  company_record RECORD;
BEGIN
  SELECT id, name, active, created_at, updated_at
  INTO company_record
  FROM public.companies
  WHERE id = company_id AND active = true;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Empresa não encontrada'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'company', json_build_object(
      'id', company_record.id,
      'name', company_record.name,
      'active', company_record.active,
      'created_at', company_record.created_at,
      'updated_at', company_record.updated_at
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO PARA LISTAR EMPRESAS DISPONÍVEIS
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_available_companies()
RETURNS TABLE (
  id TEXT,
  name TEXT,
  active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.active
  FROM public.companies c
  WHERE c.active = true
  ORDER BY c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice para busca por email
CREATE INDEX IF NOT EXISTS idx_users_email 
ON public.users(email);

-- Índice para busca por role
CREATE INDEX IF NOT EXISTS idx_users_role 
ON public.users(role);

-- Índice para busca por company_id
CREATE INDEX IF NOT EXISTS idx_users_company_id 
ON public.users(company_id);

-- Índice para busca por status ativo
CREATE INDEX IF NOT EXISTS idx_users_active 
ON public.users(is_active) WHERE is_active = true;

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION public.create_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) IS 'Cria um novo usuário com validações de permissão';
COMMENT ON FUNCTION public.update_user_role(UUID, TEXT, TEXT) IS 'Atualiza a função de um usuário com validações de hierarquia';
COMMENT ON FUNCTION public.toggle_user_status(UUID, BOOLEAN, TEXT) IS 'Ativa ou desativa um usuário com validações de permissão';
COMMENT ON FUNCTION public.get_manageable_users() IS 'Retorna lista de usuários que o usuário atual pode gerenciar';
COMMENT ON FUNCTION public.get_company_info(TEXT) IS 'Retorna informações de uma empresa específica';
COMMENT ON FUNCTION public.get_available_companies() IS 'Retorna lista de empresas ativas disponíveis';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se as funções foram criadas corretamente
SELECT 
  'create_user' as function_name,
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'create_user') as exists
UNION ALL
SELECT 
  'update_user_role' as function_name,
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'update_user_role') as exists
UNION ALL
SELECT 
  'toggle_user_status' as function_name,
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'toggle_user_status') as exists
UNION ALL
SELECT 
  'get_manageable_users' as function_name,
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'get_manageable_users') as exists
UNION ALL
SELECT 
  'get_company_info' as function_name,
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'get_company_info') as exists
UNION ALL
SELECT 
  'get_available_companies' as function_name,
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'get_available_companies') as exists; 