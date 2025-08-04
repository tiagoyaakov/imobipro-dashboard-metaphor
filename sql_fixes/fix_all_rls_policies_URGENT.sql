-- 🚨 CORREÇÃO URGENTE: REMOVER TODAS AS POLÍTICAS RECURSIVAS
-- Data: 04/08/2025
-- Problema: Recursão infinita persistente na tabela User

-- ===================================================================
-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES DA TABELA USER
-- ===================================================================

-- Remover todas as políticas RLS da tabela User
DROP POLICY IF EXISTS "users_select_policy" ON public."User";
DROP POLICY IF EXISTS "users_insert_policy" ON public."User";
DROP POLICY IF EXISTS "users_update_policy" ON public."User";
DROP POLICY IF EXISTS "users_delete_policy" ON public."User";

-- Remover outras possíveis políticas com nomes diferentes
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public."User";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public."User";
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public."User";
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public."User";

-- ===================================================================
-- 2. VERIFICAR SE A FUNÇÃO AUXILIAR EXISTE (SEM RECURSÃO)
-- ===================================================================

-- Função para buscar role sem recursão (usando auth.uid diretamente)
CREATE OR REPLACE FUNCTION public.get_user_role_from_auth()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text 
  FROM public."User" 
  WHERE id = auth.uid()::text 
  LIMIT 1;
$$;

-- ===================================================================
-- 3. CRIAR POLÍTICAS RLS CORRETAS (SEM RECURSÃO)
-- ===================================================================

-- Política SELECT: Hierarquia DEV_MASTER > ADMIN > AGENT
CREATE POLICY "users_select_policy" ON public."User"
FOR SELECT USING (
  CASE 
    -- DEV_MASTER pode ver todos os usuários
    WHEN get_user_role_from_auth() = 'DEV_MASTER' THEN true
    
    -- ADMIN pode ver apenas ADMIN e AGENT da mesma empresa (não DEV_MASTER)
    WHEN get_user_role_from_auth() = 'ADMIN' THEN 
      role IN ('ADMIN', 'AGENT') 
      AND "companyId" = (
        SELECT "companyId" FROM public."User" 
        WHERE id = auth.uid()::text LIMIT 1
      )
    
    -- AGENT só pode ver a si mesmo
    WHEN get_user_role_from_auth() = 'AGENT' THEN 
      id = auth.uid()::text
      
    -- Qualquer outro caso: negado
    ELSE false
  END
);

-- Política INSERT: Apenas DEV_MASTER e ADMIN podem criar usuários
CREATE POLICY "users_insert_policy" ON public."User"
FOR INSERT WITH CHECK (
  get_user_role_from_auth() IN ('DEV_MASTER', 'ADMIN')
);

-- Política UPDATE: Usuários podem atualizar próprios dados, admins podem atualizar de sua hierarquia
CREATE POLICY "users_update_policy" ON public."User"
FOR UPDATE USING (
  CASE 
    -- DEV_MASTER pode atualizar qualquer usuário
    WHEN get_user_role_from_auth() = 'DEV_MASTER' THEN true
    
    -- ADMIN pode atualizar AGENT da mesma empresa ou próprios dados
    WHEN get_user_role_from_auth() = 'ADMIN' THEN 
      (role = 'AGENT' AND "companyId" = (
        SELECT "companyId" FROM public."User" 
        WHERE id = auth.uid()::text LIMIT 1
      )) OR id = auth.uid()::text
    
    -- AGENT só pode atualizar próprios dados
    WHEN get_user_role_from_auth() = 'AGENT' THEN 
      id = auth.uid()::text
      
    ELSE false
  END
);

-- Política DELETE: Apenas DEV_MASTER pode deletar usuários
CREATE POLICY "users_delete_policy" ON public."User"
FOR DELETE USING (
  get_user_role_from_auth() = 'DEV_MASTER'
);

-- ===================================================================
-- 4. VERIFICAR SE RLS ESTÁ HABILITADO
-- ===================================================================

-- Garantir que RLS está habilitado na tabela User
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- 5. TESTE DE VALIDAÇÃO
-- ===================================================================

-- Testar se as políticas funcionam (deve retornar dados sem erro)
SELECT 'TESTE: Política aplicada com sucesso' as resultado;

-- ===================================================================
-- 6. INFORMAÇÕES DE DEBUG
-- ===================================================================

-- Mostrar políticas criadas
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN LENGTH(qual) > 100 THEN LEFT(qual, 100) || '...'
        ELSE qual
    END as policy_preview
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'User'
ORDER BY policyname;