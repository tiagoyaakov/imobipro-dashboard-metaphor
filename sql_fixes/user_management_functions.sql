-- =====================================================
-- CORREÇÃO CRÍTICA: Funções RPC para Módulo de Usuários
-- Data: 04/08/2025
-- Descrição: Implementa todas as funções necessárias para corrigir erros 500/404
-- =====================================================

-- 1. Função para obter empresas disponíveis
CREATE OR REPLACE FUNCTION get_available_companies()
RETURNS TABLE (
  id text,
  name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se usuário está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verificar se usuário tem permissão (DEV_MASTER ou ADMIN)
  IF NOT EXISTS (
    SELECT 1 FROM "User" 
    WHERE "User".id = auth.uid()::text 
    AND "User".role IN ('DEV_MASTER', 'ADMIN')
  ) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas DEV_MASTER e ADMIN podem visualizar empresas.';
  END IF;

  -- Retornar empresas
  RETURN QUERY
  SELECT "Company".id, "Company".name
  FROM "Company"
  WHERE "Company".active = true
  ORDER BY "Company".name;
END;
$$;

-- 2. Função para criar usuário
CREATE OR REPLACE FUNCTION create_user(
  user_email text,
  user_name text,
  user_role text,
  user_company_id text,
  user_telefone text DEFAULT NULL,
  user_avatar_url text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role text;
  new_user_id text;
  result json;
BEGIN
  -- Verificar se usuário está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Obter role do usuário atual
  SELECT role INTO current_user_role
  FROM "User"
  WHERE id = auth.uid()::text;

  -- Verificar permissões
  IF current_user_role NOT IN ('DEV_MASTER', 'ADMIN') THEN
    RAISE EXCEPTION 'Acesso negado. Apenas DEV_MASTER e ADMIN podem criar usuários.';
  END IF;

  -- Validar hierarquia
  IF current_user_role = 'ADMIN' AND user_role != 'AGENT' THEN
    RAISE EXCEPTION 'Administradores podem criar apenas Corretores.';
  END IF;

  IF current_user_role = 'DEV_MASTER' AND user_role = 'DEV_MASTER' THEN
    RAISE EXCEPTION 'DEV_MASTER não pode criar outros usuários DEV_MASTER.';
  END IF;

  -- Verificar se email já existe
  IF EXISTS (SELECT 1 FROM "User" WHERE email = user_email) THEN
    RAISE EXCEPTION 'Email já está em uso.';
  END IF;

  -- Gerar ID para novo usuário
  new_user_id := gen_random_uuid()::text;

  -- Inserir novo usuário
  INSERT INTO "User" (
    id, email, name, role, "isActive", "companyId", 
    telefone, "avatarUrl", password, "createdAt", "updatedAt"
  ) VALUES (
    new_user_id,
    user_email,
    user_name,
    user_role::"UserRole",
    true,
    user_company_id,
    user_telefone,
    user_avatar_url,
    'temp_password_' || substr(md5(random()::text), 1, 8), -- Senha temporária
    now(),
    now()
  );

  -- Preparar resultado
  result := json_build_object(
    'success', true,
    'user_id', new_user_id,
    'message', 'Usuário criado com sucesso'
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 3. Função para atualizar role do usuário
CREATE OR REPLACE FUNCTION update_user_role(
  target_user_id text,
  new_role text,
  reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role text;
  target_user_role text;
  result json;
BEGIN
  -- Verificar se usuário está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Obter role do usuário atual
  SELECT role INTO current_user_role
  FROM "User"
  WHERE id = auth.uid()::text;

  -- Obter role do usuário alvo
  SELECT role INTO target_user_role
  FROM "User"
  WHERE id = target_user_id;

  -- Verificar se usuário alvo existe
  IF target_user_role IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado.';
  END IF;

  -- Verificar permissões
  IF current_user_role NOT IN ('DEV_MASTER', 'ADMIN') THEN
    RAISE EXCEPTION 'Acesso negado. Apenas DEV_MASTER e ADMIN podem alterar funções.';
  END IF;

  -- Não pode alterar própria função
  IF target_user_id = auth.uid()::text THEN
    RAISE EXCEPTION 'Você não pode alterar sua própria função.';
  END IF;

  -- Validar hierarquia
  IF current_user_role = 'ADMIN' THEN
    IF target_user_role = 'DEV_MASTER' THEN
      RAISE EXCEPTION 'Administradores não podem alterar usuários DEV_MASTER.';
    END IF;
    IF new_role = 'DEV_MASTER' THEN
      RAISE EXCEPTION 'Administradores não podem promover usuários para DEV_MASTER.';
    END IF;
    IF new_role = 'ADMIN' THEN
      RAISE EXCEPTION 'Administradores não podem criar outros Administradores.';
    END IF;
  END IF;

  IF current_user_role = 'DEV_MASTER' AND new_role = 'DEV_MASTER' THEN
    RAISE EXCEPTION 'DEV_MASTER não pode criar outros usuários DEV_MASTER.';
  END IF;

  -- Atualizar role
  UPDATE "User"
  SET 
    role = new_role::"UserRole",
    "updatedAt" = now()
  WHERE id = target_user_id;

  -- Preparar resultado
  result := json_build_object(
    'success', true,
    'message', 'Função atualizada com sucesso'
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 4. Função para ativar/desativar usuário
CREATE OR REPLACE FUNCTION toggle_user_status(
  target_user_id text,
  new_status boolean,
  reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role text;
  target_user_role text;
  result json;
BEGIN
  -- Verificar se usuário está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Obter role do usuário atual
  SELECT role INTO current_user_role
  FROM "User"
  WHERE id = auth.uid()::text;

  -- Obter role do usuário alvo
  SELECT role INTO target_user_role
  FROM "User"
  WHERE id = target_user_id;

  -- Verificar se usuário alvo existe
  IF target_user_role IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado.';
  END IF;

  -- Verificar permissões
  IF current_user_role NOT IN ('DEV_MASTER', 'ADMIN') THEN
    RAISE EXCEPTION 'Acesso negado. Apenas DEV_MASTER e ADMIN podem alterar status.';
  END IF;

  -- Não pode alterar próprio status
  IF target_user_id = auth.uid()::text THEN
    RAISE EXCEPTION 'Você não pode alterar seu próprio status.';
  END IF;

  -- ADMIN não pode alterar status de DEV_MASTER
  IF current_user_role = 'ADMIN' AND target_user_role = 'DEV_MASTER' THEN
    RAISE EXCEPTION 'Administradores não podem alterar status de usuários DEV_MASTER.';
  END IF;

  -- Atualizar status
  UPDATE "User"
  SET 
    "isActive" = new_status,
    "updatedAt" = now()
  WHERE id = target_user_id;

  -- Preparar resultado
  result := json_build_object(
    'success', true,
    'message', 'Status atualizado com sucesso'
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 5. Função para obter impersonation ativo (placeholder)
CREATE OR REPLACE FUNCTION get_active_impersonation()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Verificar se usuário está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Por enquanto, retornar que não há impersonation ativo
  -- (A funcionalidade de impersonation será implementada posteriormente)
  result := json_build_object(
    'success', true,
    'impersonation', null,
    'message', 'Nenhuma impersonation ativa'
  );

  RETURN result;
END;
$$;

-- 6. Corrigir políticas RLS problemáticas
-- Recriar política de SELECT mais simples e robusta
DROP POLICY IF EXISTS "users_select_policy" ON public."User";

CREATE POLICY "users_select_policy" ON public."User"
FOR SELECT USING (
  -- DEV_MASTER pode ver todos os usuários
  (EXISTS (
    SELECT 1 FROM "User" u 
    WHERE u.id = auth.uid()::text 
    AND u.role = 'DEV_MASTER'
  ))
  OR
  -- ADMIN pode ver usuários da mesma empresa (exceto DEV_MASTER)
  (EXISTS (
    SELECT 1 FROM "User" u 
    WHERE u.id = auth.uid()::text 
    AND u.role = 'ADMIN'
    AND u."companyId" = "User"."companyId"
    AND "User".role != 'DEV_MASTER'
  ))
  OR
  -- Usuários podem ver a si mesmos
  (id = auth.uid()::text)
);

-- Comentários para execução:
-- 1. Execute este arquivo no editor SQL do Supabase
-- 2. Verifique se todas as funções foram criadas com sucesso
-- 3. Teste o módulo de usuários no frontend
-- 4. Se necessário, ajuste as políticas RLS conforme os testes