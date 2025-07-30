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

### Nomenclatura:
- **Tabelas**: PascalCase (`User`, `Company`, `Property`)
- **Colunas**: camelCase (`isActive`, `companyId`, `createdAt`)
- **Relacionamentos**: usar `!` para joins (`Company!companyId`)

### Estrutura:
- Migrations versionadas em `supabase/migrations/`
- RLS policies obrigatórias para todas as tabelas
- Índices para colunas de busca frequente

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

## 9. 🏗️ Arquitetura do Sistema

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

## 10. 📝 Padrões de Commit

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

## 11. 🚫 Práticas Proibidas

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

## 12. 🎯 Fluxo de Desenvolvimento

1. **Analisar** requisito e impacto
2. **Planejar** usando TodoWrite para tasks complexas
3. **Implementar** seguindo padrões estabelecidos
4. **Testar** funcionalidade localmente
5. **Lint** e verificar build
6. **Commit** com mensagem descritiva
7. **Documentar** mudanças importantes

---

## 13. 🔍 Qualidade & Performance

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

## 14. 📊 Documentos de Referência Obrigatórios

### Documentos Vivos (sempre atualizados):
- **@docs/progress_log.md**: Documento vivo com atualizações resumidas de cada módulo, alterações implementadas e próximos passos. **DEVE ser sempre atualizado** pelo Claude Code após implementações.

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

## 15. 🔄 Regras de Atualização de Documentos

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