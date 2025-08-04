-- =====================================================
-- CORREÇÃO CRÍTICA: Políticas RLS sem Recursão Infinita
-- Data: 04/08/2025
-- Problema: "infinite recursion detected in policy for relation User"
-- Solução: Políticas simples sem subconsultas recursivas
-- =====================================================

-- Remover políticas problemáticas (já executado)
-- DROP POLICY IF EXISTS "users_select_policy" ON public."User";
-- DROP POLICY IF EXISTS "users_update_policy" ON public."User";
-- DROP POLICY IF EXISTS "users_insert_policy" ON public."User";

-- 1. Política SELECT simples (já executada)
-- CREATE POLICY "users_select_policy" ON public."User"
-- FOR SELECT USING (auth.uid() IS NOT NULL);

-- 2. Política INSERT simples (já executada)  
-- CREATE POLICY "users_insert_policy" ON public."User"
-- FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Política UPDATE simples (já executada)
-- CREATE POLICY "users_update_policy" ON public."User"
-- FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- VERSÃO MELHORADA DAS POLÍTICAS (OPCIONAL)
-- Execute APENAS se quiser controle mais granular
-- =====================================================

-- Primeiro, remover as políticas simples atuais
-- DROP POLICY IF EXISTS "users_select_policy" ON public."User";
-- DROP POLICY IF EXISTS "users_update_policy" ON public."User";
-- DROP POLICY IF EXISTS "users_insert_policy" ON public."User";

-- Política SELECT com controle de hierarquia (SEM RECURSÃO)
-- Usa uma função auxiliar para evitar subconsultas recursivas
CREATE OR REPLACE FUNCTION get_user_role_from_auth()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role::text 
  FROM public."User" 
  WHERE id = auth.uid()::text 
  LIMIT 1;
$$;

-- Nova política SELECT usando a função auxiliar
DROP POLICY IF EXISTS "users_select_policy" ON public."User";
CREATE POLICY "users_select_policy" ON public."User"
FOR SELECT USING (
  CASE 
    -- DEV_MASTER pode ver todos
    WHEN get_user_role_from_auth() = 'DEV_MASTER' THEN true
    -- ADMIN pode ver todos exceto DEV_MASTER
    WHEN get_user_role_from_auth() = 'ADMIN' AND role != 'DEV_MASTER' THEN true
    -- Usuários podem ver a si mesmos
    WHEN id = auth.uid()::text THEN true
    ELSE false
  END
);

-- Nova política UPDATE com controle
DROP POLICY IF EXISTS "users_update_policy" ON public."User";
CREATE POLICY "users_update_policy" ON public."User"
FOR UPDATE USING (
  CASE 
    -- DEV_MASTER pode alterar qualquer um (exceto outros DEV_MASTER)
    WHEN get_user_role_from_auth() = 'DEV_MASTER' AND role != 'DEV_MASTER' THEN true
    -- ADMIN pode alterar apenas AGENT
    WHEN get_user_role_from_auth() = 'ADMIN' AND role = 'AGENT' THEN true
    -- Usuários podem alterar a si mesmos
    WHEN id = auth.uid()::text THEN true
    ELSE false
  END
) WITH CHECK (
  -- Mesmas regras para verificação
  CASE 
    WHEN get_user_role_from_auth() = 'DEV_MASTER' AND role != 'DEV_MASTER' THEN true
    WHEN get_user_role_from_auth() = 'ADMIN' AND role = 'AGENT' THEN true
    WHEN id = auth.uid()::text THEN true
    ELSE false
  END
);

-- Política INSERT com controle
DROP POLICY IF EXISTS "users_insert_policy" ON public."User";
CREATE POLICY "users_insert_policy" ON public."User"
FOR INSERT WITH CHECK (
  -- Apenas DEV_MASTER e ADMIN podem criar usuários
  get_user_role_from_auth() IN ('DEV_MASTER', 'ADMIN')
);

-- Comentários:
-- 1. A função auxiliar get_user_role_from_auth() evita recursão infinita
-- 2. As políticas agora respeitam a hierarquia sem causar loops
-- 3. O controle granular funciona corretamente