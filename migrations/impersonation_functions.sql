-- =====================================================
-- FUNÇÕES DE IMPERSONATION - ImobiPRO Dashboard
-- =====================================================
-- 
-- IMPORTANTE: Execute este arquivo no SQL Editor do Supabase
-- para habilitar o sistema de impersonation
-- 
-- Baseado em: docs/user-impersonation-guide.md
-- =====================================================

-- Habilitar extensão uuid-ossp se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA DE IMPERSONATIONS
-- =====================================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.user_impersonations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  impersonated_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT unique_active_impersonation UNIQUE (admin_user_id, is_active) 
    WHERE is_active = true,
  CONSTRAINT impersonation_not_self CHECK (admin_user_id != impersonated_user_id)
);

-- Habilitar RLS na tabela
ALTER TABLE public.user_impersonations ENABLE ROW LEVEL SECURITY;

-- Política para visualizar próprias impersonations
CREATE POLICY "Users can view own impersonations" ON public.user_impersonations
FOR SELECT USING (admin_user_id = auth.uid());

-- Política para inserir próprias impersonations
CREATE POLICY "Users can insert own impersonations" ON public.user_impersonations
FOR INSERT WITH CHECK (admin_user_id = auth.uid());

-- Política para atualizar próprias impersonations
CREATE POLICY "Users can update own impersonations" ON public.user_impersonations
FOR UPDATE USING (admin_user_id = auth.uid());

-- =====================================================
-- FUNÇÃO PARA GERAR TOKEN ÚNICO
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_session_token()
RETURNS TEXT AS $$
BEGIN
  -- Usar uuid_generate_v4() + timestamp para garantir unicidade
  RETURN 'imp_' || uuid_generate_v4()::text || '_' || extract(epoch from now())::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
-- FUNÇÃO PARA INICIAR IMPERSONATION
-- =====================================================

CREATE OR REPLACE FUNCTION public.start_user_impersonation(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  admin_user_id UUID;
  session_token TEXT;
  impersonation_record RECORD;
  target_user_record RECORD;
BEGIN
  -- Verificar se usuário atual é DEV_MASTER
  IF NOT public.is_dev_master_user() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Apenas DEV_MASTER pode usar impersonation'
    );
  END IF;

  -- Obter ID do usuário admin atual
  admin_user_id := auth.uid();

  -- Verificar se target_user_id existe e é válido
  SELECT * INTO target_user_record 
  FROM public.users 
  WHERE id = target_user_id::text 
  AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário alvo não encontrado ou inativo'
    );
  END IF;

  -- Verificar se não está tentando impersonar a si mesmo
  IF admin_user_id = target_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Não é possível impersonar a si mesmo'
    );
  END IF;

  -- Verificar se já existe uma impersonation ativa
  SELECT * INTO impersonation_record 
  FROM public.user_impersonations 
  WHERE admin_user_id = admin_user_id 
  AND is_active = true;

  IF FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Já existe uma impersonation ativa. Finalize-a primeiro.'
    );
  END IF;

  -- Gerar token único
  session_token := public.generate_session_token();

  -- Inserir nova impersonation
  INSERT INTO public.user_impersonations (
    admin_user_id,
    impersonated_user_id,
    session_token,
    is_active
  ) VALUES (
    admin_user_id,
    target_user_id,
    session_token,
    true
  );

  -- Retornar sucesso com dados do usuário alvo
  RETURN json_build_object(
    'success', true,
    'session_token', session_token,
    'target_user', json_build_object(
      'id', target_user_record.id,
      'email', target_user_record.email,
      'name', target_user_record.name,
      'role', target_user_record.role
    )
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
-- FUNÇÃO PARA FINALIZAR IMPERSONATION
-- =====================================================

CREATE OR REPLACE FUNCTION public.end_user_impersonation()
RETURNS JSON AS $$
DECLARE
  admin_user_id UUID;
  impersonation_record RECORD;
BEGIN
  -- Verificar se usuário atual é DEV_MASTER
  IF NOT public.is_dev_master_user() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Apenas DEV_MASTER pode finalizar impersonation'
    );
  END IF;

  -- Obter ID do usuário admin atual
  admin_user_id := auth.uid();

  -- Buscar impersonation ativa
  SELECT * INTO impersonation_record 
  FROM public.user_impersonations 
  WHERE admin_user_id = admin_user_id 
  AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Nenhuma impersonation ativa encontrada'
    );
  END IF;

  -- Finalizar impersonation
  UPDATE public.user_impersonations 
  SET is_active = false, ended_at = NOW()
  WHERE id = impersonation_record.id;

  RETURN json_build_object(
    'success', true,
    'message', 'Impersonation finalizada com sucesso'
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
-- FUNÇÃO PARA VERIFICAR IMPERSONATION ATIVA
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_active_impersonation()
RETURNS JSON AS $$
DECLARE
  admin_user_id UUID;
  impersonation_record RECORD;
  target_user_record RECORD;
BEGIN
  -- Verificar se usuário atual é DEV_MASTER
  IF NOT public.is_dev_master_user() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Apenas DEV_MASTER pode verificar impersonation'
    );
  END IF;

  -- Obter ID do usuário admin atual
  admin_user_id := auth.uid();

  -- Buscar impersonation ativa
  SELECT * INTO impersonation_record 
  FROM public.user_impersonations 
  WHERE admin_user_id = admin_user_id 
  AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', true,
      'has_active_impersonation', false
    );
  END IF;

  -- Buscar dados do usuário alvo
  SELECT * INTO target_user_record 
  FROM public.users 
  WHERE id = impersonation_record.impersonated_user_id::text;

  IF NOT FOUND THEN
    -- Se usuário alvo não existe mais, finalizar impersonation
    UPDATE public.user_impersonations 
    SET is_active = false, ended_at = NOW()
    WHERE id = impersonation_record.id;

    RETURN json_build_object(
      'success', true,
      'has_active_impersonation', false
    );
  END IF;

  -- Retornar dados da impersonation ativa
  RETURN json_build_object(
    'success', true,
    'has_active_impersonation', true,
    'impersonation', json_build_object(
      'id', impersonation_record.id,
      'admin_user_id', impersonation_record.admin_user_id,
      'impersonated_user_id', impersonation_record.impersonated_user_id,
      'session_token', impersonation_record.session_token,
      'is_active', impersonation_record.is_active,
      'created_at', impersonation_record.created_at,
      'ended_at', impersonation_record.ended_at
    ),
    'target_user', json_build_object(
      'id', target_user_record.id,
      'email', target_user_record.email,
      'name', target_user_record.name,
      'role', target_user_record.role,
      'is_active', target_user_record.is_active,
      'company_id', target_user_record.company_id,
      'avatar_url', target_user_record.avatar_url,
      'telefone', target_user_record.telefone,
      'created_at', target_user_record.created_at,
      'updated_at', target_user_record.updated_at
    )
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
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice para buscar impersonations ativas
CREATE INDEX IF NOT EXISTS idx_user_impersonations_active 
ON public.user_impersonations(admin_user_id, is_active) 
WHERE is_active = true;

-- Índice para buscar por session_token
CREATE INDEX IF NOT EXISTS idx_user_impersonations_token 
ON public.user_impersonations(session_token);

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.user_impersonations IS 'Tabela para armazenar sessões de impersonation de usuários';
COMMENT ON FUNCTION public.start_user_impersonation(UUID) IS 'Inicia uma sessão de impersonation para DEV_MASTER';
COMMENT ON FUNCTION public.end_user_impersonation() IS 'Finaliza a impersonation ativa do DEV_MASTER';
COMMENT ON FUNCTION public.get_active_impersonation() IS 'Retorna a impersonation ativa do DEV_MASTER';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se as funções foram criadas corretamente
SELECT 
  'start_user_impersonation' as function_name,
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'start_user_impersonation') as exists
UNION ALL
SELECT 
  'end_user_impersonation' as function_name,
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'end_user_impersonation') as exists
UNION ALL
SELECT 
  'get_active_impersonation' as function_name,
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'get_active_impersonation') as exists; 