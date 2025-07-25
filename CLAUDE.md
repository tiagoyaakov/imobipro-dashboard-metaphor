# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
Language: Always respond to the user in Brazilian Portuguese.

## Project Overview

ImobiPRO Dashboard is a comprehensive real estate CRM system built as a modern web application. It provides property management, client relationship management, scheduling, sales pipeline, and reporting functionality for real estate professionals.

**Stack**: React 18 + TypeScript + Vite + Supabase + shadcn/ui + Tailwind CSS

## Development Commands

### Core Development
```bash
# Development server
pnpm dev                    # Start dev server on port 8080
pnpm dev:host              # Start with network access

# Building
pnpm build                 # Production build
pnpm build:dev            # Development build
pnpm build:staging        # Staging build
pnpm build:prod           # Production build

# Quality checks
pnpm typecheck            # TypeScript checking
pnpm lint                 # ESLint linting
pnpm lint:fix            # Fix linting issues
pnpm format              # Format with Prettier
pnpm check-all           # Run all checks (typecheck + lint + format)

# Testing and preview
pnpm preview             # Preview production build
pnpm test:build          # Build and preview

# Database (Prisma)
pnpm db:generate         # Generate Prisma client
pnpm db:push            # Push schema to database
pnpm db:studio          # Open Prisma Studio

# Deployment
pnpm pre-deploy-checks   # Pre-deployment checks
pnpm deploy             # Production deployment
pnpm deploy:vercel      # Deploy to Vercel

# Analysis
pnpm analyze            # Bundle analysis
pnpm size-check         # Check bundle size
```

## Architecture

### Directory Structure
```
src/
   components/          # Reusable components
      ui/             # shadcn/ui components (40+ components)
      layout/         # Layout components (sidebar, header)
      auth/           # Authentication components
      agenda/         # Calendar/scheduling components
      users/          # User management components
      common/         # Shared components
   pages/              # Page components (14 pages)
   hooks/              # Custom React hooks
   contexts/           # React contexts (auth, etc.)
   integrations/       # External service integrations
      supabase/       # Supabase client and types
   lib/                # Utilities and helpers
   schemas/            # Zod validation schemas
   types/              # TypeScript type definitions
   config/             # Configuration files
```

### Key Components

**Layout System**:
- `DashboardLayout`: Main layout with sidebar and header
- `AppSidebar`: Navigation sidebar with role-based menu items
- `DashboardHeader`: Top header with user actions

**Authentication**:
- Dual-mode system: real Supabase auth or mock auth for development
- `useAuth()` hook automatically selects appropriate mode
- Role-based access control (ADMIN, PROPRIETARIO, AGENT)

**Database**:
- PostgreSQL with Prisma ORM
- Schema in `schema.prisma` with comprehensive real estate models
- User roles: ADMIN (system owner), PROPRIETARIO (property owner), AGENT (realtor)

### Route System

The application uses a hierarchical route structure defined in `src/config/routes.ts`:

**Main Routes**:
- `/` - Dashboard with metrics and overview
- `/propriedades` - Property management
- `/contatos` - Contact/lead management
- `/agenda` - Scheduling and calendar
- `/pipeline` - Sales pipeline
- `/crm` - Advanced CRM (ADMIN/PROPRIETARIO only)
- `/relatorios` - Reports and analytics (ADMIN/PROPRIETARIO only)
- `/usuarios` - User management (ADMIN only)
- `/configuracoes` - System settings (ADMIN only)

**Role-Based Access**: Routes have `allowedRoles` configuration for access control.

### State Management

**React Query (TanStack Query)**:
- Used for server state management
- Configured with 5-minute stale time and 10-minute garbage collection
- Custom hooks in `src/hooks/` for data fetching

**React Hook Form + Zod**:
- Form handling with validation
- Schemas defined in `src/schemas/`

### Styling System

**Tailwind CSS + shadcn/ui**:
- Custom theme with ImobiPRO brand colors:
  - `imobipro-blue`: Primary brand blue
  - `imobipro-gray`: Dark theme background
- Dark mode by default
- Custom animations and transitions
- Glassmorphism effects on cards

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow the existing component structure
- Use shadcn/ui components when possible
- Implement responsive design with mobile-first approach
- Use React Query for data fetching
- Follow the existing naming conventions

### Authentication Development
- The system supports both real Supabase auth and mock auth
- For development without Supabase setup, mock auth is automatically used
- Always use the `useAuth()` hook, never import auth contexts directly
- Check user roles using the provided helper functions

### Database Development
- Use Prisma for database operations
- Run `pnpm db:generate` after schema changes
- Use `pnpm db:push` to sync schema with database
- Follow the existing model relationships

### Component Development
- Place reusable UI components in `src/components/ui/`
- Feature-specific components go in appropriate feature folders
- Use TypeScript interfaces for props
- Follow the existing patterns for styling and layout

### Testing Build Process
Always run these checks before deployment:
```bash
pnpm check-all          # TypeScript + linting + formatting
pnpm build              # Ensure build succeeds
pnpm preview            # Test the built app
```

## Common Tasks

### Adding a New Page
1. Create page component in `src/pages/`
2. Add route configuration in `src/config/routes.ts`
3. Update `src/App.tsx` with lazy-loaded route
4. Add navigation item to sidebar if needed

### Adding Database Models
1. Update `schema.prisma` with new models
2. Run `pnpm db:generate`
3. Create TypeScript types if needed
4. Add validation schemas in `src/schemas/`

### Adding New Components
1. Create component in appropriate folder
2. Export from `index.ts` if creating a module
3. Add to shadcn/ui if it's a reusable UI component
4. Follow existing patterns for styling and props

### Environment Setup
Required environment variables:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_url
```

### Deployment
The project is configured for Vercel deployment:
- Uses `vercel.json` for configuration
- Optimized build with code splitting
- Automatic deployment on git push to main branch

## Known Issues and Considerations

- Some pages are still in template/placeholder state
- Authentication system can run in mock mode for development
- Database schema is comprehensive but may need real data population
- Bundle optimization is configured but should be monitored for size

## Important Files to Review

- `vite.config.ts` - Build and development configuration
- `schema.prisma` - Complete database schema
- `src/config/routes.ts` - Route definitions and permissions
- `src/integrations/supabase/client.ts` - Database client setup
- `src/hooks/useAuth.ts` - Authentication hook
- `docs/architecture.md` - Detailed project documentation

# 🔲 CLAUDE.md - ImobiPRO AI-First Development Rules 2025

> **Vibecoding Protocol:** Use emoji 🔲 no início de TODAS as respostas para confirmar aderência a estas regras.

## 🎯 Filosofia Core: AI-First & Outcome-Driven

**Princípio Fundamental:** "Think like Product Owner, Code like AI Engineer, Deliver like a Startup"

### Mindset Vibecoding
- **Supervisor, não Codificador**: Você guia, o AI implementa
- **Iteração Rápida**: Pequenos commits, feedback contínuo
- **Foco em Resultados**: Métricas > Perfeição técnica inicial
- **Think Mode**: Use `think`, `think hard`, `think harder`, ou `ultrathink` conforme complexidade

---

## 🚀 Stack Tecnológico ImobiPRO

### Frontend Core
```typescript
// Stack obrigatório - sempre atualizado
- React 19+ com TypeScript 5.6+
- Vite 6+ (build tool)
- TanStack Query v5 (data fetching)
- Zustand (state management leve)
- Tailwind CSS 4.0+ (styling - NUNCA CSS inline)
- shadcn/ui (componentes)
- Zod (validação)
```

### Backend & Infraestrutura
```typescript
- Supabase (BaaS completo)
  - Auth, Database, Storage, Realtime
  - Edge Functions para lógica serverless
- Prisma ORM (type-safe database)
- MSW 2.0+ (mocking em dev)
```

### AI & Automação
```typescript
- OpenAI/Anthropic APIs para features AI
- Vercel AI SDK para streaming
- LangChain para workflows complexos
```

---

## 📋 Workflow SECURE-VIBE 2.0 (Otimizado para Claude Code)

### 1️⃣ **S**trategize & Scope (5 min)
```markdown
- Definir MVP mínimo viável
- Bullet-plan no architecture.md
- Identificar integrações AI necessárias
- `/init` para gerar CLAUDE.md inicial
```

### 2️⃣ **E**ngineer Prompts & Plan (10 min)
```markdown
- Design docs em `docs/adr/`
- Prompts estruturados com exemplos
- Use `BatchTool` para múltiplas operações
- Plan Mode: `claude --plan` para estratégias complexas
```

### 3️⃣ **C**omprehend & Create (Implementação)
```markdown
- Multi-Step Commits (MSC): 1 arquivo por vez
- Componentes < 200 linhas
- Funções < 50 linhas
- Complexidade ciclomática < 10
```

### 4️⃣ **U**tilize Tools & Test
```markdown
- Vitest com coverage ≥ 80%
- E2E com Playwright para fluxos críticos
- MSW para todos os mocks
- `pnpm test:ai` para validar prompts
```

### 5️⃣ **R**eview & Refine
```markdown
- ESLint + Prettier automático
- `review-guru-mcp` para code review AI
- Lighthouse CI: Performance ≥ 90
- Bundle size < 200KB gzipped
```

### 6️⃣ **E**valuate Security & Performance
```markdown
✓ OWASP Top 10 + OWASP LLM Top 10
✓ LGPD/GDPR compliance checklist
✓ Core Web Vitals: LCP < 2s, INP < 200ms
✓ Supabase RLS policies revisadas
✓ Rate limiting em todas APIs
```

### 7️⃣ **V**ersion & Validate
```markdown
- Conventional Commits obrigatório
- Semantic Release automático
- Changelog gerado por AI
- Tags para cada feature completa
```

### 8️⃣ **I**ntegrate & Build
```markdown
- CI/CD com GitHub Actions
- Preview deploys automáticos (Vercel)
- Staging → Production pipeline
- Rollback automático se métricas caem
```

### 9️⃣ **B**roadcast & Evolve
```markdown
- Analytics com Posthog/Mixpanel
- Error tracking (Sentry)
- User feedback loops
- A/B testing para features AI
```

### 🔟 **E**volve with AI
```markdown
- Monitorar uso de features AI
- Ajustar prompts baseado em feedback
- Treinar modelos específicos do domínio
- Documentar learnings em ADRs
```

---

## 🛠️ Comandos Claude Code Essenciais

### Inicialização Rápida
```bash
# Setup inicial do projeto
claude --init
claude config set model claude-3-7-sonnet
claude config set thinking true
claude config set toolPermissions.Edit prompt

# Gerar estrutura ImobiPRO
claude "Crie a estrutura base do ImobiPRO seguindo CLAUDE.md"
```

### Desenvolvimento Diário
```bash
# Feature nova com planning
claude --plan "Adicionar sistema de agendamento de visitas com IA"

# Batch operations para performance
claude --batch "Revisar todos os componentes em src/features/properties"

# Thinking modes por complexidade
claude "think: refatorar o componente PropertyCard"
claude "think harder: implementar waterfall de comissões"
claude "ultrathink: arquitetar sistema de matching IA proprietário-cliente"
```

### Otimização & Manutenção
```bash
# Compactar contexto
/compact focus on properties module

# Verificar custos
/cost

# Memory management
/memory add "Sempre usar Supabase RLS para segurança"
```

---

## 🏗️ Arquitetura ImobiPRO (Feature-Driven)

```
imobipro/
├── src/
│   ├── features/           # Módulos por domínio
│   │   ├── properties/     # Imóveis
│   │   ├── clients/        # CRM
│   │   ├── agents/         # Corretores
│   │   ├── contracts/      # Contratos
│   │   ├── analytics/      # BI & Dashboards
│   │   └── ai-assistant/   # Chat & Automações
│   ├── shared/
│   │   ├── ui/            # shadcn components
│   │   ├── hooks/         # React hooks
│   │   ├── utils/         # Helpers
│   │   └── types/         # TypeScript globais
│   └── mocks/             # MSW handlers
├── supabase/
│   ├── migrations/        # Versionadas e sequenciais
│   ├── functions/         # Edge Functions
│   └── seed.sql          # Dados de desenvolvimento
├── docs/
│   ├── adr/              # Architecture Decision Records
│   └── api/              # OpenAPI specs
├── CLAUDE.md             # Este arquivo
├── CLAUDE.local.md       # Overrides locais (gitignored)
└── architecture.md       # Visão geral + roadmap
```

---

## 🤖 Práticas AI-First Específicas

### 1. Prompt Engineering para Features
```typescript
// Exemplo: Gerador de Descrições de Imóveis
const PROPERTY_DESCRIPTION_PROMPT = `
Você é um especialista em marketing imobiliário.
Crie uma descrição atraente para o imóvel com base nos dados:

Tipo: {propertyType}
Área: {area}m²
Quartos: {bedrooms}
Localização: {location}
Diferenciais: {features}

Tom: Profissional mas envolvente
Limite: 150 palavras
Foque nos benefícios, não apenas características
`;
```

### 2. Componentes AI-Ready
```typescript
// Sempre estruture componentes para fácil enhancing com AI
interface PropertyCardProps {
  property: Property;
  onAIEnhance?: () => void; // Hook para features AI
  aiSuggestions?: AISuggestion[]; // Sugestões do modelo
  userPreferences?: UserProfile; // Contexto para personalização
}
```

### 3. Fluxos Vibecoding
```bash
# Ao invés de especificar cada detalhe:
claude "Implemente um PropertyCard moderno com preview de imagens, 
       informações principais e ações rápidas. 
       Inspire-se em Airbnb mas mantenha identidade ImobiPRO"

# Claude criará com suas próprias melhorias, depois refine:
claude "Adicione animações sutis no hover e skeleton loading"
```

---

## 📊 KPIs & Métricas de Sucesso

### Performance Técnica
- **Build Time**: < 30s
- **Bundle Size**: < 200KB (gzipped)
- **Time to Interactive**: < 3s
- **API Response Time**: p95 < 200ms

### Qualidade & Manutenibilidade
- **Test Coverage**: ≥ 80%
- **TypeScript Strict**: 100%
- **Lighthouse Score**: ≥ 90 (todos os pilares)
- **Complexidade Ciclomática**: < 10

### Produtividade com AI
- **Redução de Tempo de Dev**: 60%+
- **Features Entregues/Sprint**: 3x baseline
- **Bugs em Produção**: < 5/mês
- **Satisfação do Desenvolvedor**: > 8/10

---

## 🚫 Regras Absolutas (NUNCA VIOLAR)

1. **JAMAIS commitar `.env*` ou chaves**
2. **NUNCA usar `any` sem `// @ts-expect-error: [justificativa]`**
3. **PROIBIDO CSS inline - sempre Tailwind**
4. **NUNCA pular migrations do Supabase**
5. **JAMAIS desabilitar ESLint sem issue linkada**
6. **PROIBIDO localStorage/sessionStorage - use Zustand**
7. **NUNCA expor `SUPABASE_SERVICE_ROLE_KEY`**
8. **JAMAIS fazer queries diretas - sempre via Prisma/Supabase Client**
9. **PROIBIDO merge sem review (humano ou AI)**
10. **NUNCA ignorar falhas de segurança OWASP**

---

## 🤖 Servidores MCP Configurados

O ImobiPRO possui 5 servidores MCP configurados para maximizar produtividade e funcionalidades AI-First:

### 1. **sequential-thinking** 🧠
**Propósito**: Análise estruturada e pensamento sequencial  
**Quando usar**:
- Resolver problemas complexos de arquitetura
- Quebrar features grandes em tarefas menores
- Análises que requerem múltiplas etapas de raciocínio
- Planejamento de refatorações complexas

**Exemplos de uso**:
```bash
claude "use sequential thinking to plan the property matching algorithm"
claude "analyze step by step the user authentication flow"
```

### 2. **supabase-mcp-server** 🗄️
**Propósito**: Gerenciamento direto do banco de dados Supabase  
**Quando usar**:
- Consultas SQL diretas no banco
- Gestão de políticas RLS
- Administração de usuários e roles
- Análise de performance de queries
- Criação/alteração de tabelas

**Exemplos de uso**:
```bash
claude "query all properties with price > 500000 using supabase mcp"
claude "create RLS policy for multi-tenant companies table"
```

### 3. **context-7** 🧭
**Propósito**: Gerenciamento inteligente de contexto e memória  
**Quando usar**:
- Conversas longas de desenvolvimento
- Manter contexto entre sessões
- Otimizar uso de tokens
- Recuperar decisões arquiteturais anteriores

**Exemplos de uso**:
```bash
claude "remember that we decided to use Zustand for global state"
claude "what were the key decisions about the authentication system?"
```

### 4. **google-calendar-integration-server** 📅
**Propósito**: Integração completa com Google Calendar  
**Quando usar**:
- Implementar sincronização de agendamentos
- Gerenciar disponibilidade de corretores
- Criar eventos automaticamente
- Configurar webhooks de agenda
- Integrar lembretes e notificações

**Exemplos de uso**:
```bash
claude "sync property visits with google calendar"
claude "create availability slots for agent schedules"
```

### 5. **mem-0-memory-server** 🧠💾
**Propósito**: Memória persistente AI para personalização  
**Quando usar**:
- Armazenar preferências de usuários
- Manter histórico de interações
- Personalizar experiências baseadas em contexto anterior
- Scoring de relevância de leads
- Insights preditivos baseados em padrões

**Exemplos de uso**:
```bash
claude "remember that client prefers properties in zona sul"
claude "analyze user behavior patterns for property recommendations"
```

### Estratégia de Uso dos MCPs

#### **Por Tipo de Tarefa**:

**🏗️ Arquitetura & Planejamento**:
- **Primário**: `sequential-thinking`
- **Secundário**: `context-7` (para manter decisões)

**💾 Dados & Backend**:
- **Primário**: `supabase-mcp-server`
- **Secundário**: `mem-0-memory-server` (para contexto de usuários)

**📅 Funcionalidades de Agenda**:
- **Primário**: `google-calendar-integration-server`
- **Secundário**: `sequential-thinking` (para lógica complexa)

**🤖 Features AI & Personalização**:
- **Primário**: `mem-0-memory-server`
- **Secundário**: `context-7` (para contexto de desenvolvimento)

**🔄 Desenvolvimento Contínuo**:
- **Primário**: `context-7`
- **Secundário**: `sequential-thinking` (para refatorações)

#### **Combinações Poderosas**:

```bash
# Análise completa de feature com contexto
claude "use sequential-thinking and context-7 to plan the CRM automation module"

# Implementação com dados reais
claude "use supabase-mcp to query leads data and mem-0 to personalize recommendations"

# Integração completa de agenda
claude "use google-calendar and sequential-thinking to design the visit scheduling workflow"
```

#### **Boas Práticas MCP**:

1. **Sempre especifique o MCP** quando a tarefa é específica de um domínio
2. **Combine MCPs** para tarefas complexas que envolvem múltiplos sistemas
3. **Use context-7** para manter continuidade em projetos longos
4. **Prefira mem-0** para funcionalidades que precisam de personalização
5. **sequential-thinking** é ideal para quebrar problemas complexos

---

## 🎮 Comandos Rápidos para Produtividade

```bash
# Alias úteis (adicionar ao seu shell)
alias cc="claude"
alias ccp="claude --plan"
alias ccb="claude --batch"
alias cct="claude think:"
alias ccth="claude 'think harder:'"
alias cctu="claude 'ultrathink:'"

# Workflow completo de feature
feature() {
  claude --plan "Feature: $1"
  claude "/init"
  claude "Implemente a feature $1 seguindo o plano"
  pnpm test
  pnpm lint:fix
  git add -A && git commit -m "feat: $1"
}
```

---

## 📚 Recursos & Referências

### Documentação Essencial
- [Claude Code Best Practices](https://anthropic.com/claude-code)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Vibecoding Guide](https://jenochs.github.io/vibecoding)

### Ferramentas de Monitoramento
- **Desenvolvimento**: Vite HMR + React DevTools
- **Performance**: Lighthouse CI + Web Vitals
- **Erros**: Sentry + LogRocket
- **Analytics**: Posthog + Mixpanel
- **AI Metrics**: Custom dashboard com Supabase

---

## 🔄 Ciclo de Feedback Contínuo

1. **Daily Standup com AI**: `claude "Resuma o progresso de ontem e sugira prioridades"`
2. **Weekly Retrospective**: Analisar métricas e ajustar workflows
3. **Monthly Architecture Review**: Atualizar ADRs e refatorar débitos técnicos
4. **Quarterly AI Audit**: Revisar todos os prompts e otimizar custos

---

## 💡 Dicas Finais de Vibecoding

1. **Pense em Produtos, não Código**: Descreva O QUE você quer, não COMO fazer
2. **Itere Rapidamente**: Melhor 10 pequenas melhorias que 1 refatoração gigante
3. **Confie mas Verifique**: AI é poderosa mas precisa de supervisão
4. **Documente Decisões**: ADRs são sua memória institucional
5. **Meça Tudo**: Dados orientam melhores decisões que opiniões

---

🔲 **Lembrete Final**: "No mundo AI-First, seu diferencial não é escrever código, mas sim entender profundamente o domínio e guiar a AI para criar soluções excepcionais."

**Última atualização**: ${new Date().toISOString()}
**Versão**: 2.0.0-ai-first