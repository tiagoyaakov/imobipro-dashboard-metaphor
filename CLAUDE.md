# 🏢 Regras de Desenvolvimento - ImobiPRO Dashboard

**Versão adaptada para o projeto atual**

---

## 1. 🌐 Idioma & Comunicação

- **Sempre responder em português do Brasil**
- Comentários de código em PT-BR
- Documentação e commits em português (de forma automatizada realizada pelo próprio claude code)
- Mensagens de erro e logs em português

---

## 2. 🎨 Padrões de Interface

- **Tailwind CSS obrigatório** - zero CSS inline
- Componentes shadcn/ui como base
- Dark mode suportado em todos os componentes
- Layout responsivo (mobile-first)
- Dados mock em `src/mocks/` (formato JSON)

---

## 3. 🔐 Segurança & Variáveis

- **NUNCA commitar** arquivos `.env*`
- Manter `.env.example` atualizado
- Variáveis frontend com prefixo `VITE_`
- Variáveis Supabase obrigatórias:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- **Jamais expor** `SUPABASE_SERVICE_ROLE` no frontend

---

## 4. 🗄️ Padrões de Banco de Dados (Supabase)

### ⚠️ OBRIGATÓRIO - Nomenclatura camelCase:
- **Tabelas**: PascalCase (`User`, `Company`, `Property`)
- **Colunas**: **SEMPRE camelCase** (`isActive`, `companyId`, `createdAt`, `updatedAt`)
- **Relacionamentos**: usar `!` para joins (`Company!companyId`)
- **JAMAIS usar snake_case** (`is_active`, `company_id`) - PROIBIDO
- **JAMAIS usar lowercase** (`users`, `companies`) - PROIBIDO

### Regras de Consistência:
- **Frontend**: Todos os tipos TypeScript em camelCase
- **Backend**: Queries Supabase devem usar exatamente os nomes camelCase do banco
- **Mapeamento**: NÃO fazer conversão snake_case ↔ camelCase
- **Validação**: Sempre verificar que banco e código usam mesma nomenclatura

### Estrutura:
- Migrations versionadas em `supabase/migrations/`
- RLS policies obrigatórias para todas as tabelas
- Índices para colunas de busca frequente
- Schema Prisma deve refletir exatamente a estrutura do Supabase

---

## 5. 📁 Estrutura de Arquivos

```
src/
├── components/          # Componentes React organizados por módulo
│   ├── ui/             # Componentes shadcn/ui
│   ├── users/          # Módulo usuários
│   ├── properties/     # Módulo propriedades
│   └── ...
├── hooks/              # Hooks customizados (prefixo 'use')
├── services/           # Lógica de negócio e APIs
├── types/              # Definições TypeScript
├── pages/              # Páginas da aplicação
├── mocks/              # Dados fake (JSON)
└── integrations/       # Integrações externas
```

---

## 6. 💻 Padrões de Código

### TypeScript:
- **TypeScript estrito** - zero `any` não justificado
- Interfaces para todos os tipos de dados
- Validação com **Zod** em formulários
- Props tipadas para todos os componentes

### React:
- Componentes funcionais com hooks
- **TanStack Query** para gerenciamento de estado servidor
- Custom hooks para lógica reutilizável
- Props destructuring com tipos

### Nomenclatura:
- **Arquivos**: camelCase (`userList.tsx`)
- **Componentes**: PascalCase (`UserList`)
- **Hooks**: camelCase com prefixo `use` (`useUsers`)
- **Constants**: UPPER_SNAKE_CASE
- **Funções**: camelCase (`getUserById`)

---

## 7. 🔧 Ferramentas do Projeto

### Gerenciamento de pacotes:
- **pnpm** como gerenciador preferido
- Sempre atualizar `pnpm-lock.yaml`

### Build & Dev:
- **Vite** para desenvolvimento e build
- **Vercel** para deploy
- Scripts úteis no `package.json`

### Linting & Formatação:
- ESLint configurado
- Prettier para formatação
- Pre-commit hooks quando disponível

---

## 8. 📋 MCPs Disponíveis e Regras de Uso

**O Claude Code deve ser PROATIVO em utilizar estes MCPs durante o desenvolvimento, conforme as oportunidades surgem.**

### MCPs Atualmente Configurados:

| MCP | Servidor | Status | Regra de Uso Proativa |
|---|---|---|---|
| **Sequential Thinking** | `smithery-ai-server-sequential-thinking` | ✅ Conectado | **OBRIGATÓRIO** - usar para **estruturar pensamento** e **desenvolvimento de ações complexas** |
| **Supabase Integration** | `supabase-community-supabase-mcp` | ✅ Conectado | **SEMPRE** usar para operações de banco de dados, consultas SQL, verificação de schema |
| **Memory Management** | `big-omega-mem-0-mcp` | ✅ Conectado | Utilizar para **armazenar contexto** de sessões longas, preferências do usuário, histórico |
| **Context & Documentation** | `context7` | ✅ Conectado | Usar para **buscar documentação** on-demand, exemplos de código, referências técnicas |
| **Exa AI Web Search** | `exa` | ✅ Conectado | Utilizar para **pesquisas avançadas** na web, research de empresas, crawling de URLs |
| **Semgrep Security** | `semgrep-mcp` | ✅ Conectado | **SEMPRE** verificar **segurança de código** antes de commits e durante desenvolvimento |

### Configuração dos Servidores:
- **Smithery.ai** (5 MCPs): Sequential Thinking, Supabase, Memory, Exa, Semgrep
- **Context7.com** (1 MCP): Documentation & Context

### Regras de Uso Obrigatórias:

1. **`smithery-ai-server-sequential-thinking`**: SEMPRE utilizar para:
   - Estruturar o pensamento antes de implementações complexas
   - Quebrar tarefas grandes em etapas menores
   - Documentar o processo de tomada de decisão
   - Planejar refatorações e melhorias

2. **`supabase-community-supabase-mcp`**: Usar AUTOMATICAMENTE para:
   - Todas as operações de banco de dados do projeto
   - Consultas SQL complexas e verificação de schema
   - Validação de estruturas de tabelas e relacionamentos
   - Debugging de problemas de RLS e permissões

3. **`big-omega-mem-0-mcp`**: Utilizar para:
   - Armazenar contexto de sessões longas de desenvolvimento
   - Salvar preferências e configurações do usuário
   - Manter histórico de decisões técnicas importantes
   - Lembrar de padrões específicos do projeto

4. **`context7`**: Usar para:
   - Buscar documentação técnica on-demand
   - Encontrar exemplos de código e melhores práticas
   - Consultar referências de bibliotecas e frameworks
   - Obter contexto sobre tecnologias utilizadas

5. **`exa`**: Utilizar para:
   - Pesquisas avançadas na web para soluções técnicas
   - Research de empresas e análise de mercado
   - Crawling de URLs para obter informações específicas
   - Busca de exemplos e documentações externas

6. **`semgrep-mcp`**: Usar AUTOMATICAMENTE:
   - Antes de cada commit para verificar vulnerabilidades
   - Durante desenvolvimento para análise de segurança
   - Após grandes refatorações para validar code security
   - Quando implementar funcionalidades críticas de segurança

**IMPORTANTE**: O Claude Code deve utilizar estes MCPs **SEM que o usuário precise solicitar explicitamente**, tomando iniciativa quando a situação exigir.

---

## 9. 🤖 Agentes Disponíveis e Delegação de Funções

**O Claude Code deve PROATIVAMENTE utilizar os agentes especializados disponíveis em `C:\Users\1992t\.claude\agents` para delegar tarefas específicas durante o desenvolvimento.**

### Agentes Especializados Disponíveis:

| Agente | Função Específica | Quando Utilizar Proativamente |
|---|---|---|
| **general-purpose** | Pesquisa de código e tarefas multi-step | Ao procurar implementações específicas no codebase ou executar tarefas complexas |
| **workflow-optimizer** | Otimização de workflows humano-IA | Ao identificar gargalos no desenvolvimento ou melhorar processos |
| **tool-evaluator** | Avaliação de ferramentas e frameworks | Ao considerar novas bibliotecas ou tecnologias para o projeto |
| **test-results-analyzer** | Análise de resultados de testes | Após executar testes para identificar tendências e melhorias |
| **performance-benchmarker** | Testes de performance e otimização | Ao detectar lentidão ou necessidade de otimização |
| **api-tester** | Testes completos de API | Ao implementar ou modificar endpoints da API |
| **tiktok-strategist** | Estratégias de marketing TikTok | Para features virais ou campanhas de divulgação |
| **app-store-optimizer** | Otimização para app stores | Ao preparar releases ou melhorar visibilidade |
| **test-writer-fixer** | Escrita e correção de testes | **SEMPRE** após modificações de código |
| **rapid-prototyper** | Prototipagem rápida de MVPs | Ao iniciar novos módulos ou experimentos |
| **mobile-app-builder** | Desenvolvimento mobile nativo | Para features mobile específicas |
| **frontend-developer** | Desenvolvimento de interfaces | Ao criar ou modificar componentes UI |
| **devops-automator** | Automação DevOps e CI/CD | Para pipelines e infraestrutura |
| **backend-architect** | Arquitetura backend e APIs | Ao projetar sistemas backend |
| **ai-engineer** | Implementação de features IA/ML | Para funcionalidades com IA |
| **support-responder** | Gestão de suporte ao cliente | Para documentação de suporte |
| **legal-compliance-checker** | Verificação de compliance legal | Para termos e privacidade |
| **infrastructure-maintainer** | Manutenção de infraestrutura | Para monitoramento e scaling |
| **finance-tracker** | Gestão financeira e orçamentos | Para controle de custos |
| **analytics-reporter** | Relatórios e análises de dados | Para métricas e insights |
| **joker** | Humor e leveza no desenvolvimento | Para aliviar tensão em sprints |
| **studio-producer** | Coordenação entre equipes | Ao gerenciar dependências entre módulos |
| **project-shipper** | Gestão de releases e launches | Ao preparar deployments |
| **experiment-tracker** | Tracking de experimentos A/B | Para features experimentais |
| **studio-coach** | Coach para outros agentes | Quando agentes precisam de orientação |
| **ui-designer** | Design de interfaces e UX | Ao criar novos layouts |
| **whimsy-injector** | Adicionar elementos divertidos | **SEMPRE** após mudanças de UI |
| **brand-guardian** | Manutenção de identidade visual | Para consistência de marca |
| **sprint-prioritizer** | Priorização de sprints 6-day | No planejamento de ciclos |
| **ux-researcher** | Pesquisa de usuário e validação | Para validar decisões de design |
| **feedback-synthesizer** | Análise de feedback de usuários | Ao processar reviews e sugestões |
| **trend-researcher** | Pesquisa de tendências de mercado | Para identificar oportunidades |
| **visual-storyteller** | Criação de narrativas visuais | Para apresentações e demos |

### Regras de Delegação Automática:

1. **Após Modificações de Código**: SEMPRE usar `test-writer-fixer` para garantir testes adequados
2. **Mudanças de UI/UX**: SEMPRE usar `whimsy-injector` para adicionar toques de personalidade
3. **Novos Módulos**: Usar `rapid-prototyper` para scaffolding inicial
4. **Problemas de Performance**: Delegar para `performance-benchmarker`
5. **Coordenação Complexa**: Ativar `studio-producer` para gerenciar dependências
6. **Preparação de Release**: Engajar `project-shipper` para coordenar lançamento

### Exemplo de Uso Proativo:

```typescript
// Ao detectar modificação em componente React
// Claude Code automaticamente:
// 1. Usa frontend-developer para melhorias de UI
// 2. Ativa whimsy-injector para adicionar microinterações
// 3. Chama test-writer-fixer para atualizar testes
// 4. Se necessário, usa performance-benchmarker para otimização
```

**IMPORTANTE**: A delegação aos agentes deve ser NATURAL e AUTOMÁTICA, sem necessidade de solicitação explícita do usuário. O Claude Code deve reconhecer padrões e situações onde cada agente especializado pode agregar valor ao desenvolvimento.

---

## 10. 🏗️ Arquitetura do Sistema

### Módulos Principais:
- **Dashboard**: Visão geral e métricas principais
- **Usuários**: Gestão de usuários e permissões *(Apenas DEV_MASTER e ADMIN)*
- **Propriedades**: Catálogo e gestão de imóveis
- **Pipeline**: Funil de vendas e oportunidades
- **WhatsApp**: Integração de mensagens
- **Agenda**: Agendamento e calendário
- **Relatórios**: Dashboards e analytics *(Apenas DEV_MASTER e ADMIN)*
- **Clientes**: Gestão de leads e relacionamento
- **Conexões**: Integrações com sistemas externos
- **Contatos**: Base de contatos e comunicação
- **Lei do Inquilino**: Assistente jurídico com IA
- **Chats**: Sistema de mensagens integrado
- **CRM AVANÇADO**: Funcionalidades avançadas de CRM *(Apenas DEV_MASTER e ADMIN)*
- **CONFIGURAÇÕES**: Configurações do sistema *(Apenas DEV_MASTER e ADMIN)*

### Hierarquia de Usuários (baseada em @docs/hierarquia-usuarios.md):

#### **DEV_MASTER (Desenvolvedor Principal)**
- **ACESSO FULL** a todos os módulos e funcionalidades
- **Invisível** para outros usuários (ninja mode)
- Pode impersonar ADMIN e AGENT
- Controle total sobre configurações globais
- Gerenciamento de features flags e liberação de funcionalidades
- Acesso a logs de auditoria completos

#### **ADMIN (Administrador/Dono da Imobiliária)**
- **Acesso completo** à sua imobiliária
- **Não vê** dados de outras imobiliárias
- Pode gerenciar apenas corretores (AGENT) da sua empresa
- Pode impersonar apenas AGENT
- Acesso a: Usuários, Relatórios, CRM Avançado, Configurações
- **Não pode** criar outros ADMIN (apenas DEV_MASTER pode)

#### **AGENT (Corretor/Agente)**
- **Acesso limitado** apenas aos próprios dados
- Não pode gerenciar outros usuários
- **Não pode** usar impersonation
- Não vê dados de outros corretores
- Acesso limitado baseado nas permissões liberadas pelo ADMIN
- Foco em: Dashboard, Propriedades, Pipeline, Clientes, Agenda, Contatos, Chats

---

## 11. 📝 Padrões de Commit

### Formato Obrigatório:
```
tipo: descrição breve

Detalhes opcionais do que foi alterado e por quê.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Tipos:
- `feat`: nova funcionalidade
- `fix`: correção de bug
- `refactor`: refatoração sem mudança de comportamento
- `docs`: documentação
- `style`: formatação, espaços em branco
- `test`: adição ou correção de testes

---

## 12. 🚫 Práticas Proibidas

### Nunca faça:
- Commit de arquivos `.env*` ou secrets
- CSS inline (use apenas Tailwind)
- Usar `any` sem justificativa documentada
- Introduzir dependências sem atualizar lockfile
- `eslint-disable` sem explicação
- Try/catch genérico (trate erros específicos)
- Merge sem migrations aplicadas no Supabase
- Alterar estrutura de tabelas sem migration

### Sempre faça:
- Teste local antes de commit
- Verificar lint e build antes de push
- Documentar mudanças complexas
- Usar tipos TypeScript apropriados
- Seguir convenções de nomenclatura
- Commits pequenos e focados

---

## 13. 🎯 Fluxo de Desenvolvimento

1. **Analisar** requisito e impacto
2. **Planejar** usando TodoWrite para tasks complexas
3. **Implementar** seguindo padrões estabelecidos
4. **Testar** funcionalidade localmente
5. **Lint** e verificar build
6. **Commit** com mensagem descritiva
7. **Documentar** mudanças importantes

---

## 14. 🔍 Qualidade & Performance

### Obrigatório:
- Zero erros de lint
- Build sem warnings
- Componentes responsivos
- Loading states em requisições
- Error boundaries quando apropriado
- Acessibilidade básica (alt texts, labels)

### Recomendado:
- Lazy loading para rotas
- Memoização quando necessário
- Otimização de imagens
- Debounce em buscas
- Cache de requisições com TanStack Query

---

---

## 15. 📊 Documentos de Referência Obrigatórios

### Documentos Vivos (sempre atualizados):
- **@docs/progress_log.md**: Documento vivo com atualizações resumidas de cada módulo, alterações implementadas e próximos passos. **DEVE ser sempre atualizado** pelo Claude Code após implementações. **OBRIGATÓRIO**: Todas as ações tomadas devem ser citadas de forma resumida e simples no final das respostas neste arquivo.

### Documentos Base de Planejamento:
- **@docs/planejamento-imobipro.md**: Planejamento completo e detalhado do sistema. Base fundamental para implementações. **PODE ser alterado** quando necessário para ajustes de planejamento.

### Documentos de Referência Técnica:
- **@docs/database-schema.md**: Schema atual do banco de dados. Referência obrigatória para desenvolvimento que envolve banco de dados.
- **@schema.prisma**: Schema Prisma atual do projeto. Deve ser mantido sincronizado com database-schema.md.
- **@docs/hierarquia-usuarios.md**: Definição completa de permissões e acessos por tipo de usuário.

### Documento de Projeto (PRD):
- **@docs/prd.md**: Document de requisitos do produto. **DEVE ser proativamente atualizado** pelo Claude Code quando:
  - Novas implementações forem concluídas
  - Correções importantes forem realizadas
  - Funcionalidades forem adicionadas ou modificadas
  - Arquitetura do sistema for alterada

### Integração N8N:
**TODAS as implementações** que envolvem banco de dados devem considerar:
- Uso de endpoints e webhooks do N8N para integrações
- Fluxos de automação já elaborados ou futuros
- Compatibilidade com workflows existentes

---

## 16. 🔄 Regras de Atualização de Documentos

### Atualizações Automáticas Obrigatórias:
1. **@docs/progress_log.md**: Atualizar SEMPRE após implementações
2. **@docs/prd.md**: Sugerir atualizações quando houver mudanças significativas
3. **@docs/database-schema.md**: Sincronizar com mudanças no schema.prisma

### Quando Sugerir Atualizações:
- Implementação de novos módulos ou funcionalidades
- Correções críticas que afetem a arquitetura
- Mudanças na estrutura do banco de dados
- Novas integrações ou workflows N8N
- Alterações nas permissões de usuários

**O Claude Code deve ser PROATIVO** em manter estes documentos atualizados para refletir o estado real do projeto.

---

🏢 **ImobiPRO**: *Transformando o mercado imobiliário com tecnologia*