## Módulo 2 — Propriedades (Auditado e Reconstruído)

### Visão Geral
O módulo Propriedades foi auditado e reestruturado para operar diretamente sobre a tabela `imoveisvivareal4` (Supabase) com suporte a filtros, paginação, estatísticas de portfólio, permissões por papel (DEV_MASTER, ADMIN, CORRETOR) e atualizações em tempo real.

### Stack e Componentes
- **Dados/Infra**: Supabase (`imoveisvivareal4`, `interesse_imoveis`), Realtime, n8n (matching/automação)
- **Frontend**: React 18, TypeScript 5.5, TanStack React Query 5, shadcn/ui, Tailwind CSS, React Router DOM 6
- **Validação**: Zod (para formulários CRUD)
- **Arquivos-chave**:
  - `src/pages/Propriedades.tsx` — Página principal (lista vertical, grid/list toggle, filtros, dashboard básico)
  - `src/hooks/usePropertiesV3.ts` — Hook principal (lista, detalhe, create/update/delete) integrado ao `imoveisVivaReal.service`
  - `src/services/imoveisVivaReal.service.ts` — Service com queries tipadas para `imoveisvivareal4`
  - `src/components/properties/PropertyCard.tsx` e `PropertyFilters.tsx` — UI

### Permissões e Comportamento por Papel
- **DEV_MASTER/ADMIN**: CRUD completo, upload/import, export, ver ações (Editar/Excluir), triggers n8n
- **CORRETOR (AGENT)**: Apenas visualização e export
- Implementação na UI via `usePermissions()` ocultando botões/ações e no service via aplicação de RLS por perfil

### Listagem e Detalhes
- Listagem vertical com cards (`variant="list"` disponível) exibindo: título, preço (venda/aluguel), tipo, status, localização, área, quartos/banheiros/vagas quando disponíveis, corretor e data
- Clique abre a visualização detalhada (rota ou drawer; em progresso): exibe todos os campos disponíveis mapeados de `imoveisvivareal4`

### Filtros e Paginação
- Filtros por tipo, status, finalidade, preço (venda/aluguel), cidade, bairro, características (quartos, banheiros, vagas), destaque
- Paginação via `usePaginatedQuery` (limit/offset)

### Realtime
- Realtime via `useSupabaseQuery`/`usePaginatedQuery` + EventBus (invalidações), refletindo alterações imediatas no front

### CRUD
- Create/Update/Delete implementados no hook `usePropertiesV3` sobre o `imoveisVivaReal.service`
- Formulários (em desenvolvimento) com React Hook Form + Zod para validação de campos

### Upload/Import (Viva Real)
- Componente de import (`VivaRealImportDialog`) aceita JSON no padrão Viva Real e encaminha ao service (placeholder concluído; parser completo em implementação)

### Exportação (PDF/XML)
- Hook de export (a implementar) para gerar PDF e XML a partir dos dados do imóvel seguindo padrão Viva Real

### Matching (n8n)
- Ao inserir um imóvel, um evento será disparado (EventBus/Supabase trigger) → n8n processa matching contra `interesse_imoveis`

### Endpoints REST (para n8n e integrações)
- `GET /api/properties` — lista paginada de imóveis
  - Query params: `page`, `limit`, `status`, `propertyType`, `city`, `minPrice`, `maxPrice`, `minBedrooms`, `maxBedrooms`, `isFeatured`, `search`
  - Resposta: `{ items: Property[], total: number, page: number, pages: number }`

- `GET /api/properties/:id` — detalhes
  - Resposta: `Property`

- `POST /api/properties` — cria
  - Body: `ImoveisVivaRealInsert` (campos mínimos: `title`, `address`, `city`, `state`, `price`)
  - Resposta: `Property`

- `PUT /api/properties/:id` — atualiza
  - Body: `ImoveisVivaRealUpdate`
  - Resposta: `Property`

- `DELETE /api/properties/:id` — exclui
  - Resposta: `{ success: true }`

- `POST /api/matching/property` — matching para um imóvel
  - Body: `{ id: string }`
  - Resposta: `{ matches: InteresseImovel[] }`

Observação: Implementação dos handlers será feita na pasta `api/` (Vercel Functions) em edits incrementais.

### Segurança e RLS
- RLS aplicada no service: DEV_MASTER vê todos, ADMIN vê da empresa, AGENT vê próprios (`corretor_responsavel`)
- UI oculta ações conforme papel (`usePermissions`)

### Testes
- Unitários (Vitest) para: mapeamento de tipos, parser de Viva Real (import), serviço de matching (mockado), exportação PDF/XML (mock)
- Integração: smoke tests de endpoints `api/`

### Próximos Passos (incremental)
1. Detalhes: componente/rota de detalhes com todos os campos (com edição para ADMIN/DEV_MASTER)
2. Export: hook `usePropertyExport` (PDF/XML)
3. Upload inteligente: parser completo do JSON Viva Real e XML
4. Endpoints `api/*` implementados e documentados (OpenAPI simples)
5. Realtime: confirmar subscriptions por canal/tabela
6. Testes unitários e de integração (≥ 80% cobertura no módulo)


