-- Politica de Seguranca RLS: Permitir que usuarios leiam seus proprios dados
-- Esta politica garante que um usuario autenticado so possa ver sua propria linha na tabela 'users'.
-- A funcao `auth.uid()` retorna o UUID do usuario do token JWT, que e comparado diretamente
-- com a coluna `id` da tabela, que tambem e um UUID.

-- Habilita a Row Level Security na tabela se ainda nao estiver habilitada.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Remove a politica antiga e incorreta, se ela existir, para evitar conflitos.
-- O `IF EXISTS` garante que o comando nao falhe se a politica nao for encontrada.
DROP POLICY IF EXISTS "Allow user to read their own data" ON public.users;
DROP POLICY IF EXISTS "Allow individual user read access" ON public.users;


-- Cria a nova politica de leitura correta
CREATE POLICY "Allow user to read their own data v2"
ON public.users
FOR SELECT
USING (auth.uid() = id);
