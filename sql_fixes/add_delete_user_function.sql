-- ================================================================
-- FUNÇÃO RPC PARA EXCLUIR USUÁRIO PERMANENTEMENTE
-- ================================================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- Data: 04/08/2025
-- Autor: Claude AI
-- Descrição: Adiciona função para excluir usuários permanentemente
-- ================================================================

CREATE OR REPLACE FUNCTION delete_user(target_user_id uuid, reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_info record;
    target_user_info record;
    result jsonb;
BEGIN
    -- Obter informações do usuário atual usando função auxiliar
    SELECT * INTO current_user_info FROM get_current_user_info();
    
    -- Verificar se usuário atual existe
    IF current_user_info.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;
    
    -- Verificar permissões - apenas DEV_MASTER e ADMIN podem deletar usuários
    IF current_user_info.role NOT IN ('DEV_MASTER', 'ADMIN') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Acesso negado. Apenas DEV_MASTER e Administradores podem excluir usuários.'
        );
    END IF;
    
    -- Buscar informações do usuário alvo
    SELECT id, email, name, role, "isActive", "companyId"
    INTO target_user_info
    FROM public."User"
    WHERE id = target_user_id;
    
    -- Verificar se usuário alvo existe
    IF target_user_info.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Usuário não encontrado'
        );
    END IF;
    
    -- Prevenir auto-exclusão
    IF target_user_id = current_user_info.id THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Você não pode excluir sua própria conta'
        );
    END IF;
    
    -- Verificar hierarquia - ADMIN não pode deletar DEV_MASTER
    IF current_user_info.role = 'ADMIN' AND target_user_info.role = 'DEV_MASTER' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Administradores não podem excluir usuários DEV_MASTER'
        );
    END IF;
    
    -- Verificar se ADMIN está tentando deletar usuário de outra empresa
    IF current_user_info.role = 'ADMIN' AND current_user_info."companyId" != target_user_info."companyId" THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Você só pode excluir usuários da sua própria empresa'
        );
    END IF;
    
    -- Registrar a ação antes de deletar (para auditoria)
    INSERT INTO public."Activity" (
        id,
        type,
        description,
        "entityId",
        "entityType",
        "userId",
        "createdAt"
    ) VALUES (
        gen_random_uuid(),
        'USER_DELETED',
        CASE 
            WHEN reason IS NOT NULL THEN 
                format('Usuário %s (%s) foi excluído permanentemente. Motivo: %s', 
                       target_user_info.name, target_user_info.email, reason)
            ELSE 
                format('Usuário %s (%s) foi excluído permanentemente', 
                       target_user_info.name, target_user_info.email)
        END,
        target_user_id::text,
        'User',
        current_user_info.id,
        now()
    );
    
    BEGIN
        -- 1. Primeiro, deletar da tabela public.User
        DELETE FROM public."User" WHERE id = target_user_id;
        
        -- 2. Deletar das tabelas auth (se existir)
        -- IMPORTANTE: auth.users pode não existir se usuário foi criado via convite e nunca fez login
        DELETE FROM auth.identities WHERE user_id = target_user_id;
        DELETE FROM auth.users WHERE id = target_user_id;
        
        -- Preparar resultado de sucesso
        result := jsonb_build_object(
            'success', true,
            'message', 'Usuário excluído permanentemente com sucesso',
            'deleted_user', jsonb_build_object(
                'id', target_user_info.id,
                'email', target_user_info.email,
                'name', target_user_info.name,
                'role', target_user_info.role
            ),
            'deleted_by', jsonb_build_object(
                'id', current_user_info.id,
                'email', current_user_info.email,
                'name', current_user_info.name,
                'role', current_user_info.role
            ),
            'deleted_at', now(),
            'reason', reason
        );
        
        RETURN result;
        
    EXCEPTION WHEN OTHERS THEN
        -- Em caso de erro, retornar informações do erro
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Erro ao excluir usuário: %s', SQLERRM),
            'error_detail', SQLSTATE
        );
    END;
    
END;
$$;

-- ================================================================
-- COMENTÁRIOS E INSTRUÇÕES
-- ================================================================

COMMENT ON FUNCTION delete_user(uuid, text) IS 
'Função para excluir usuários permanentemente do sistema.
ATENÇÃO: Esta ação é IRREVERSÍVEL!

Funcionalidades:
- Verifica permissões (apenas DEV_MASTER e ADMIN)
- Impede auto-exclusão
- Respeita hierarquia (ADMIN não pode deletar DEV_MASTER)
- Registra ação para auditoria
- Deleta de auth.users e public.User
- Retorna resultado detalhado em JSON

Exemplo de uso:
SELECT delete_user(
  ''12345678-1234-1234-1234-123456789012''::uuid,
  ''Usuário inativo por mais de 6 meses''
);';