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


### Como usar os endpoints no n8n (HTTP Request)

- **Base URL**: `https://SEU_DEPLOY.vercel.app`
  - Em dev local (com Vite + dev serverless): `http://localhost:5173/api` (ou conforme setup do hosting)

- **Lista de propriedades** (GET)
  - Método: GET
  - URL: `/api/properties?limit=20&page=1&status=AVAILABLE&city=Sao%20Paulo&search=apartamento`
  - Resposta (200):
    ```json
    {
      "items": [ { "id": "...", "title": "...", "city": "..." } ],
      "total": 120,
      "page": 1,
      "pages": 6
    }
    ```

- **Detalhe de propriedade** (GET)
  - Método: GET
  - URL: `/api/properties/IMOVEL_ID`
  - Resposta (200): objeto do imóvel

- **Criar propriedade** (POST)
  - Método: POST
  - URL: `/api/properties`
  - Body (JSON):
    ```json
    {
      "title": "Apartamento 2 dorm",
      "address": "Rua Exemplo, 123",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01234-567",
      "propertyType": "APARTMENT",
      "status": "AVAILABLE",
      "listingType": "SALE",
      "salePrice": 450000,
      "bedrooms": 2,
      "bathrooms": 1,
      "totalArea": 60
    }
    ```
  - Resposta (201): objeto criado

- **Atualizar propriedade** (PUT)
  - Método: PUT
  - URL: `/api/properties/IMOVEL_ID`
  - Body (JSON): apenas campos a atualizar (ex.: `{ "status": "RESERVED" }`)
  - Resposta (200): objeto atualizado

- **Excluir propriedade** (DELETE)
  - Método: DELETE
  - URL: `/api/properties/IMOVEL_ID`
  - Resposta (200): `{ "success": true }`

- **Matching por propriedade** (POST)
  - Método: POST
  - URL: `/api/matching/property`
  - Body (JSON): `{ "id": "IMOVEL_ID" }`
  - Resposta (200): `{ "matches": [ /* interesses compatíveis */ ] }`

- Dica n8n:
  - Use o nó "HTTP Request" com "Send Body" = JSON para POST/PUT
  - Mapeie dados com Expression (ex.: `{{$json["id"]}}`) para encadear fluxos


### Arquivos serverless (api/) e comportamento

- `api/properties.js`
  - Métodos: `GET` (lista paginada com filtros), `POST` (criação)
  - Lê query params (`status`, `propertyType`, `city`, `minPrice`, `maxPrice`, `minBedrooms`, `search`, etc.)
  - Persiste em `imoveisvivareal4` (campos: `title`, `address`, `city`, `state`, `zipCode`, `price`, `area`, `bedrooms`, `bathrooms`, `propertyType`, `status`, `listingType`, `images`, `isActive`, timestamps)

- `api/properties_[id].js`
  - Métodos: `GET` (detalhe), `PUT` (atualização), `DELETE` (remoção)
  - Atualização aplica `updated_at` e mapeia `salePrice/rentPrice → price` quando enviados

- `api/matching_property.js`
  - Método: `POST` com `{ id }`
  - Busca o imóvel (tipo/cidade/preço) e filtra `interesse_imoveis` por critérios simples (cidade e faixa ±20% do preço). Pode ser enriquecido conforme necessidade

- Segurança/Configs
  - Os handlers usam `@supabase/supabase-js` com `SUPABASE_SERVICE_ROLE_KEY` (backend) e `VITE_SUPABASE_URL` / `SUPABASE_URL`
  - Configure as variáveis no ambiente do hosting (Vercel). Nunca exponha o `SERVICE_ROLE_KEY` no frontend
  - CORS: padrão `*` no exemplo; restrinja para os domínios da sua aplicação em produção


