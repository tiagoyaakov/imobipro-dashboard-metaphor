-- ================================================================
-- SISTEMA DE CONVITE POR EMAIL PARA NOVOS USUÁRIOS
-- ================================================================

-- 1. Atualizar função create_user para trabalhar com Supabase Auth
CREATE OR REPLACE FUNCTION create_user_with_invite(
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
  new_user_id uuid;
  auth_user_id uuid;
  result json;
  invite_token text;
BEGIN
  -- Verificar se usuário está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Obter role do usuário atual
  current_user_role := get_user_role_from_auth();

  -- Verificar permissões
  IF current_user_role NOT IN ('DEV_MASTER', 'ADMIN') THEN
    RAISE EXCEPTION 'Acesso negado. Apenas DEV_MASTER e ADMIN podem criar usuários.';
  END IF;

  -- Validar hierarquia
  IF current_user_role = 'ADMIN' AND user_role != 'AGENT' THEN
    RAISE EXCEPTION 'Administradores podem criar apenas Corretores.';
  END IF;

  -- Verificar se email já existe
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    RAISE EXCEPTION 'Email já está em uso.';
  END IF;

  -- Verificar se empresa existe
  IF NOT EXISTS (SELECT 1 FROM "Company" WHERE id = user_company_id AND active = true) THEN
    RAISE EXCEPTION 'Empresa não encontrada ou inativa.';
  END IF;

  -- Gerar novo UUID
  new_user_id := gen_random_uuid();

  -- 1. Criar usuário no Supabase Auth (sem senha, apenas com email)
  -- Isso criará um usuário "invited" que precisa definir senha
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    created_at,
    updated_at,
    is_sso_user,
    role
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    user_email,
    '', -- Sem senha inicial
    NULL, -- Email não confirmado ainda
    now(), -- Marcado como convidado
    encode(gen_random_bytes(32), 'hex'), -- Token de confirmação
    now(),
    encode(gen_random_bytes(32), 'hex'), -- Token de recuperação para criar senha
    now(),
    NULL,
    NULL,
    now(),
    now(),
    false,
    'authenticated'
  )
  RETURNING 
    id,
    recovery_token INTO auth_user_id, invite_token;

  -- 2. Criar usuário na tabela pública
  INSERT INTO public."User" (
    id,
    email,
    name,
    role,
    "isActive",
    "companyId",
    telefone,
    "avatarUrl",
    password,
    "createdAt",
    "updatedAt"
  ) VALUES (
    auth_user_id::text,
    user_email,
    user_name,
    user_role::"UserRole",
    true,
    user_company_id,
    user_telefone,
    user_avatar_url,
    'PENDING_INVITE', -- Indicador de senha pendente
    now(),
    now()
  );

  -- 3. Atualizar metadata do usuário no auth
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_build_object(
    'name', user_name,
    'role', user_role,
    'company_id', user_company_id,
    'telefone', user_telefone,
    'avatar_url', user_avatar_url,
    'invited_by', auth.uid()::text,
    'invited_at', now()
  )
  WHERE id = auth_user_id;

  -- Preparar resultado com token para email
  result := json_build_object(
    'success', true,
    'user_id', auth_user_id,
    'email', user_email,
    'invite_token', invite_token,
    'message', 'Usuário criado. Email de convite será enviado.'
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Se houver erro, limpar dados criados
    DELETE FROM auth.users WHERE id = new_user_id;
    DELETE FROM public."User" WHERE id = new_user_id::text;
    
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- ================================================================
-- 2. Função para enviar email de convite (chamada após criar usuário)
-- ================================================================

CREATE OR REPLACE FUNCTION send_user_invite_email(
  user_email text,
  invite_token text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  base_url text;
BEGIN
  -- Obter URL base do projeto
  base_url := current_setting('app.settings.site_url', true);
  
  -- Se não configurado, usar default
  IF base_url IS NULL THEN
    base_url := 'https://imobpro-brown.vercel.app';
  END IF;

  -- Construir URL de redefinição
  -- O token será usado para identificar o usuário
  -- Formato: /reset-password?token=XXXXX&type=invite
  
  -- NOTA: O Supabase tem funções internas para envio de email
  -- mas precisam ser configuradas no dashboard
  
  result := json_build_object(
    'success', true,
    'reset_url', base_url || '/reset-password?token=' || invite_token || '&type=invite',
    'message', 'URL de convite gerada. Configure o envio de email no Supabase.'
  );

  RETURN result;
END;
$$;

-- ================================================================
-- 3. Função para validar token de convite e permitir criação de senha
-- ================================================================

CREATE OR REPLACE FUNCTION validate_invite_token(
  token text,
  new_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record record;
  result json;
BEGIN
  -- Buscar usuário pelo token
  SELECT 
    u.id,
    u.email,
    u.recovery_token,
    u.recovery_sent_at
  INTO user_record
  FROM auth.users u
  WHERE u.recovery_token = token
  AND u.recovery_sent_at > now() - interval '24 hours'; -- Token válido por 24h

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token inválido ou expirado';
  END IF;

  -- Atualizar senha do usuário
  UPDATE auth.users
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    email_confirmed_at = now(),
    recovery_token = NULL,
    recovery_sent_at = NULL,
    updated_at = now()
  WHERE id = user_record.id;

  -- Atualizar status na tabela pública
  UPDATE public."User"
  SET 
    password = 'SET_BY_USER',
    "updatedAt" = now()
  WHERE id = user_record.id::text;

  result := json_build_object(
    'success', true,
    'email', user_record.email,
    'message', 'Senha definida com sucesso! Você já pode fazer login.'
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