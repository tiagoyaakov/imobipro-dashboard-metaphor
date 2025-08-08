### Módulo 3 — Clientes (Integração Front ↔ Back com RLS)

#### 1) O que já foi feito (resumo executivo)
- Ajuste no Supabase (RLS) para destravar 403 no `public.dados_cliente` sem abrir excessos:
  - Criada policy transitória de SELECT (`temp_select_dados_cliente_roles`) para `authenticated`:
    - DEV_MASTER e ADMIN: leitura total.
    - AGENT: leitura quando `funcionario = auth.uid()` ou `funcionario IS NULL` (fase de transição/atribuição futura).
  - Mantidas as policies existentes (ALL) com checagens por papel baseadas em `public."User"`.
- Verificação de ambiente:
  - `.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` corretos.
  - Tabela `public.dados_cliente` confirmada e acessível (SELECT count OK).

Objetivo deste plano: integrar o front-end ao back-end e começar a testar CRUD com RLS correta por usuário e ação, evoluindo do ajuste transitório para policies definitivas.
#### 2) Plano de ações (curto prazo — viabilizar integração e testes CRUD)

- Padronizar uso do Supabase Client no front-end
  - Ação: usar apenas `@/lib/supabase-client` em hooks e services do módulo Clientes.
  - Impacto: evita sessões duplicadas e comportamentos divergentes.

- Provisionamento de usuário em `public."User"`
  - Ação: garantir que todo usuário autenticado tenha linha correspondente em `public."User"` (on-login).
  - Opções:
    - Trigger/Function no banco (existe base no repo) ou Edge Function pós-login.
  - Impacto: permite voltar às policies originais sem policy transitória.

- Garantir compatibilidade de schema
  - Ação: alinhar valores de `status` no front com os persistidos em `dados_cliente` (ex.: `novos`, `contatados`, `qualificados`, ...). Evitar capitalização divergente.
  - Ação: evitar uso de campos não existentes (mantendo hooks MVP atuais que usam apenas colunas reais).

- Testes CRUD com RLS por papel
  - Cenários mínimos:
    - DEV_MASTER: CREATE/READ/UPDATE/DELETE livre (verificação de leitura de todos).
    - ADMIN: leitura de todos e operações restritas à empresa (conforme policies existentes); checar ao menos READ e UPDATE.
    - AGENT: apenas registros com `funcionario = auth.uid()`; checar READ/INSERT/UPDATE/DELETE.
  - Critério de aceite: zero 403 inesperado; operações negadas apenas quando a policy exige.

- Observabilidade e UX de erro
  - Ação: exibir mensagens de autorização quando `error.code` indicar RLS (ex.: 42501/301) nos toasts do módulo.

- Segurança de variáveis
  - Ação: remover `SUPABASE_SERVICE_ROLE_KEY` do `.env` do front; manter apenas em backend/Edge Functions.

#### 3) Passo a passo dinâmico (ideal para começar a testar)

1. Ambiente e client
   - Confirmar `.env` com `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_AUTH_REDIRECT_URL`.
   - Unificar imports para `@/lib/supabase-client` no módulo Clientes (hooks/services).

2. Provisionamento de `public."User"`
   - Implementar (ou habilitar) rotina pós-login que garante um registro em `public."User"` com `id = auth.uid()` e `role`/`companyId` adequados.
   - Verificar com query: `select count(*) from "public"."User" where id = auth.uid();`.

3. Testes CRUD por papel (com usuários reais)
   - AGENT:
     - CREATE: inserir `dados_cliente` com `funcionario = auth.uid()`.
     - READ: listar apenas seus registros e os sem `funcionario` (transitório).
     - UPDATE/DELETE: operar apenas nos próprios.
   - ADMIN:
     - READ: ver todos (da empresa) — validar policies existentes.
     - UPDATE: atualizar clientes da empresa.
   - DEV_MASTER:
     - CRUD completo, sem restrições.

4. Ajustes finos de filtros e status
   - Consolidar enumerações de `status` no front (usar os valores efetivos do banco: `novos`, `contatados`, `qualificados`, `interessados`, `negociando`, `convertidos`, `perdidos`).
   - Revisar componentes que calculam estatísticas e HEAD counts (já funcionam com a policy transitória).

5. Remoção controlada da policy transitória
   - Após garantir provisionamento automático de `public."User"` e validação dos cenários acima, remover a policy `temp_select_dados_cliente_roles`.
   - Critério de aceite: todos os testes CRUD passam sem a policy transitória.

6. Endurecimento opcional
   - Habilitar RLS em `imoveisvivareal4` (Ativado ✅) e manter policies existentes.
   - Removida a policy transitória `temp_select_dados_cliente_roles` de `dados_cliente` (✅).
   - Otimizar policies para substituir `auth.*()` por `(SELECT auth.*())` quando aplicável (performance em escala).

#### 4) Critérios de aceite
- Tela de Clientes carrega sem 403 para usuários autenticados.
- AGENT consegue CRUD apenas nos próprios registros.
- ADMIN consegue ler todos (da empresa) e atualizar registros de sua empresa.
- DEV_MASTER consegue CRUD completo.
- Erros de autorização exibem toast com mensagem clara.

#### 5) Observações e riscos
- Enquanto a policy transitória existir, registros sem `funcionario` serão visíveis a AGENT — usar apenas durante fase de transição. (Removida ✅)
- Garanta o provisionamento consistente de `public."User"` para remover a policy transitória.
- Evitar uso do client alternativo em `@/integrations/supabase/client` neste módulo.

#### 6) Próximos passos sugeridos
- Padronizar client em todo o app.
- Implementar/validar rotina de provisionamento de `public."User"` pós-login.
- Consolidar e auditar status usados no front (alinhados ao banco ✅).
- Registrar decisões e checagens no `docs/architecture.md` (SECURE-VIBE).

#### 7) Registro do que foi feito (auditoria incremental)
- Lint (módulo Clientes):
  - `src/components/clientes/ClientesList.tsx`: correção do `no-case-declarations` no switch de ordenação.
  - `src/components/clientes/NovoClienteModal.tsx`: regex de telefone sem escapes desnecessários.
- Padronização do client Supabase:
  - Serviços/hooks do módulo Clientes usando `@/lib/supabase-client`.
- Consolidação de status no front:
  - `src/types/clientes.ts` centraliza `novos | contatados | qualificados | interessados | negociando | convertidos | perdidos`.
  - Componentes/Hooks ajustados para usar o conjunto consolidado.
- Policies e RLS (Supabase):
  - Removida a policy transitória `temp_select_dados_cliente_roles` (SELECT) em `public.dados_cliente`.
  - Habilitado RLS em `public.imoveisvivareal4` (mantidas policies ALL existentes).
  - Refatoradas policies de `public.dados_cliente` para evitar recursão:
    - `agent_own_dados_cliente`: ALL usando `funcionario = auth.uid()` (with check idem).
    - `admin_company_dados_cliente`: ALL usando funções SECURITY DEFINER `public.is_admin()` + `public.same_company_as(funcionario)`.
    - `dev_master_all_dados_cliente`: ALL usando `public.is_dev_master()`.
  - Grants mínimos para o papel `authenticated`:
    - `GRANT USAGE ON SCHEMA public TO authenticated`.
    - `GRANT SELECT, INSERT, UPDATE, DELETE ON public.dados_cliente TO authenticated`.
    - `GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO authenticated`.
- Redirecionamento pós-login por role:
  - `src/pages/auth/LoginPage.tsx`: ADMIN/DEV_MASTER → `/`; AGENT → `/clientes`.
- Teste CRUD automatizado (AGENT via login real):
  - Script `scripts/test-clientes-crud-login.mjs` criado e executado com sucesso (INSERT → SELECT → UPDATE → DELETE), respeitando RLS.

#### 8) Próxima ação — Análise do modal de criação de cliente (NovoClienteModal)
- Contexto: usuário reporta que o modal não está criando cliente.
- Hipóteses principais:
  - Para ADMIN/DEV_MASTER, `funcionario` pode estar ficando `null` quando nenhum corretor é selecionado → falha em RLS (`with check`) nas policies de INSERT.
  - Possível erro de superfície/UX: erro do Supabase não propagado claramente ao usuário (toast). Verificar mensagens e `error.code`/`error.message` no `useClientesMutationsMVP`.
  - Validações do formulário (Zod) impedindo submissão (telefone/nome), ou dados divergentes do schema (campos opcionais/string vazia vs null) causando erro no INSERT.
- Plano de análise (passo a passo):
  1) Instrumentação temporária de logs no `NovoClienteModal.tsx` (entrada → payload → resposta) e no `dadosCliente.service.ts` (pontos de erro em `create`).
  2) Verificar fluxo de `funcionario` por role:
     - AGENT: forçar `funcionario = auth.uid()` (já implementado).
     - ADMIN/DEV_MASTER: exigir seleção de corretor (bloquear salvar se `funcionario` vazio) ou aplicar fallback seguro documentado.
  3) Reproduzir com usuário AGENT e ADMIN/DEV_MASTER e coletar `error.code` e `error.message`.
  4) Se confirmado `with check` por `funcionario` nulo para ADMIN/DEV_MASTER, implementar regra de UI: campo obrigatório (ou explicitar que sem corretor não é possível criar com RLS atual).
  5) Validar novamente com o script e pela interface.
- Critério de aceite para o modal:
  - AGENT cria cliente sempre com `funcionario = auth.uid()`.
  - ADMIN/DEV_MASTER criam cliente somente quando um corretor for selecionado (ou regra/fallback decidido), sem erro de RLS.
  - Toast de sucesso/erro claros, exibindo mensagens amigáveis quando for RLS (código 42501/301) ou validação.
