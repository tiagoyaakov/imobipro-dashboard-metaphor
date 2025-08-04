-- ============================================================================
-- CORREÇÃO: Função create_user com integração Supabase Auth
-- Data: 04/08/2025
-- Objetivo: Criar usuários usando Supabase Auth e enviar email de convite
-- ============================================================================

-- Função para criar usuário com integração completa do Supabase Auth
CREATE OR REPLACE FUNCTION create_user(
  user_email text,
  user_name text,
  user_role "UserRole",
  user_company_id text,
  user_telefone text DEFAULT NULL,
  user_avatar_url text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
  auth_user_id uuid;
  new_user_id text;
  result jsonb;
  invite_response jsonb;
BEGIN
  -- Verificar se usuário está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Obter role do usuário atual usando função auxiliar (SEM RECURSÃO)
  current_user_role := get_user_role_from_auth();

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

  -- Verificar se email já existe na tabela User
  IF EXISTS (SELECT 1 FROM "User" WHERE email = user_email) THEN
    RAISE EXCEPTION 'Email já está em uso no sistema.';
  END IF;

  -- Verificar se email já existe no auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    RAISE EXCEPTION 'Email já possui conta de autenticação.';
  END IF;

  -- Verificar se empresa existe
  IF NOT EXISTS (SELECT 1 FROM "Company" WHERE id = user_company_id AND active = true) THEN
    RAISE EXCEPTION 'Empresa não encontrada ou inativa.';
  END IF;

  -- ETAPA 1: Criar usuário no Supabase Auth usando admin API
  -- Vamos usar a função admin_create_user do Supabase
  SELECT auth.admin_create_user(
    user_email,
    NULL, -- password (será definida pelo usuário via link)
    jsonb_build_object(
      'email_confirm', false, -- usuário precisa confirmar email
      'user_metadata', jsonb_build_object(
        'name', user_name,
        'role', user_role,
        'company_id', user_company_id,
        'telefone', user_telefone,
        'avatar_url', user_avatar_url
      )
    )
  ) INTO auth_user_id;

  -- Gerar ID para a tabela User (mesmo ID do auth)
  new_user_id := auth_user_id::text;

  -- ETAPA 2: Inserir usuário na tabela User
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
    'auth_managed', -- Indicar que senha é gerenciada pelo auth
    now(),
    now()
  );

  -- ETAPA 3: Chamar Edge Function para envio de email
  BEGIN
    -- Chamar a Edge Function para enviar email de convite
    SELECT content::jsonb INTO invite_response
    FROM http((
      'POST',
      current_setting('app.base_url', true) || '/functions/v1/send-user-invite',
      ARRAY[
        http_header('Authorization', 'Bearer ' || current_setting('app.service_role_key', true)),
        http_header('Content-Type', 'application/json')
      ],
      'application/json',
      jsonb_build_object(
        'email', user_email,
        'name', user_name,
        'role', user_role,
        'company_id', user_company_id
      )::text
    ));

    -- Log da tentativa de envio de email
    RAISE NOTICE 'Email enviado para %: %', user_email, invite_response;

  EXCEPTION
    WHEN OTHERS THEN
      -- Log do erro mas não falha a criação do usuário
      RAISE NOTICE 'Erro ao enviar email para %: %', user_email, SQLERRM;
      invite_response := jsonb_build_object(
        'success', false,
        'error', 'Falha no envio do email: ' || SQLERRM
      );
  END;

  -- ETAPA 4: Registrar atividade de auditoria
  INSERT INTO "Activity" (
    id, type, description, "userId", "createdAt"
  ) VALUES (
    gen_random_uuid()::text,
    'USER_CREATED',
    format('Usuário %s (%s) criado com role %s na empresa %s', 
           user_name, user_email, user_role, user_company_id),
    auth.uid()::text,
    now()
  );

  -- ETAPA 5: Preparar resultado
  result := jsonb_build_object(
    'success', true,
    'user_id', new_user_id,
    'auth_user_id', auth_user_id,
    'email_sent', COALESCE(invite_response->>'success', 'false')::boolean,
    'email_details', invite_response,
    'message', 'Usuário criado com sucesso. ' || 
               CASE 
                 WHEN COALESCE(invite_response->>'success', 'false')::boolean 
                 THEN 'Email de convite enviado.'
                 ELSE 'Email de convite NÃO foi enviado - verifique configurações SMTP.'
               END
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback automático em caso de erro
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', 'Erro durante criação do usuário. Todas as alterações foram revertidas.'
    );
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION create_user(text, text, "UserRole", text, text, text) IS 
'Cria usuário com integração completa do Supabase Auth, envia email de convite e registra auditoria';

-- ============================================================================
-- CONFIGURAÇÕES NECESSÁRIAS
-- ============================================================================

-- Estas configurações precisam ser definidas no Supabase Dashboard:
-- 1. app.base_url - URL base do projeto (ex: https://xyz.supabase.co)
-- 2. app.service_role_key - Service role key para chamadas admin

-- Para definir no Supabase Dashboard > Settings > API:
-- ALTER DATABASE postgres SET app.base_url = 'https://eeceyvenrnyyqvilezgr.supabase.co';
-- ALTER DATABASE postgres SET app.service_role_key = 'sua_service_role_key_aqui';

-- ============================================================================
-- EXEMPLO DE USO
-- ============================================================================

/*
-- Exemplo de criação de usuário
SELECT create_user(
  'novousuario@exemplo.com',
  'João Silva',
  'AGENT',
  'sua-company-id-aqui',
  '11999887766',
  'https://exemplo.com/avatar.jpg'
);
*/

-- ============================================================================
-- VERIFICAÇÕES PARA DEBUG
-- ============================================================================

-- Verificar se configurações estão definidas
-- SELECT current_setting('app.base_url', true) as base_url;
-- SELECT current_setting('app.service_role_key', true) as service_key;

-- Verificar usuários criados recentemente
-- SELECT id, email, name, role, "createdAt" 
-- FROM "User" 
-- WHERE "createdAt" > now() - interval '1 hour'
-- ORDER BY "createdAt" DESC;