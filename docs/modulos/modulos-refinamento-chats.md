# 🔧 Plano de Refinamento - MÓDULO CHATS

**Data de Criação:** 03/08/2025  
**Status:** 📋 Documento de Planejamento  
**Módulo:** Chats (Sistema de Mensagens em Tempo Real)  
**Última Atualização:** 03/08/2025  

---

## 📋 **Visão Geral**

Este documento detalha o plano de ações de implementação, correção e desenvolvimento para tornar o **Módulo Chats** **100% funcional**, com sistema de mensagens real-time, integração WhatsApp completa e funcionalidades avançadas de IA.

Baseado na auditoria técnica realizada e no planejamento pós-auditoria, o módulo Chats será refinado através de 5 etapas estruturadas utilizando os MCPs e agents especializados disponíveis no Claude Code.

---

## 🎯 **STATUS ATUAL E PROBLEMAS IDENTIFICADOS**

### **📊 Status Atual (Baseado na Auditoria)**

| Aspecto | Status Atual | Meta |
|---------|-------------|------|
| **Implementação** | 85% (bem estruturado) | 100% funcional |
| **Dependências** | 60% (alguns gaps críticos) | 100% resolvidas |
| **Integração WhatsApp** | 90% (Evolution API) | 100% operacional |
| **Testes** | 0% | 80% cobertura |
| **Performance** | Boa (com otimizações pendentes) | Excelente |

### **🚨 Problemas Críticos Identificados**

1. **Dependências Faltantes**:
   - `n8nService.ts` não implementado (referenciado em useChatSummary.ts)
   - Inconsistências de schema com banco atual
   - IDs hardcoded em alguns serviços

2. **Performance e Segurança**:
   - Queries N+1 em chatsService.ts
   - Ausência de rate limiting
   - XSS potencial em conteúdo de mensagens
   - Cache ineficiente com localStorage sem TTL

3. **Funcionalidades Incompletas**:
   - Sistema de mensagens lidas (campo readAt faltante)
   - Campos de schema faltantes (lastMessageAt, resumos)
   - Real-time subscriptions com possível overhead

4. **Ausência total de testes automatizados** (0% cobertura)

---

## 🗓️ **CRONOGRAMA DE REFINAMENTO - 8-12 DIAS**

| Etapa | Descrição | Duração | Prioridade |
|-------|-----------|---------|------------|
| **1** | Correção de Dependências Críticas | 2-3 dias | 🔴 CRÍTICA |
| **2** | Otimização de Performance e Segurança | 2-3 dias | 🔴 CRÍTICA |
| **3** | Funcionalidades Avançadas e IA | 2-3 dias | 🟡 ALTA |
| **4** | UX e Real-time Melhorados | 1-2 dias | 🟠 MÉDIA |
| **5** | Testes e Validação Completa | 2-3 dias | 🟢 IMPORTANTE |

---

## 🔧 **ETAPA 1: CORREÇÃO DE DEPENDÊNCIAS CRÍTICAS**
**Duração:** 2-3 dias | **Prioridade:** 🔴 CRÍTICA

### **🎯 Contexto**
O módulo possui dependências críticas faltantes que impedem seu funcionamento adequado, incluindo serviços não implementados, inconsistências de schema e referências quebradas.

### **📋 Objetivos Específicos**
- [ ] Criar n8nService.ts ou remover dependência
- [ ] Atualizar schema do banco para incluir campos de resumo
- [ ] Corrigir IDs hardcoded e referências quebradas
- [ ] Sincronizar interfaces TypeScript com banco real
- [ ] Validar integridade de todas as dependências

### **🗂️ Tarefas Detalhadas**

#### **Task 1.1: Implementar n8nService.ts**
```typescript
// src/services/n8nService.ts
- Implementar workflow de resumos com IA
- Configuração de endpoints n8n
- Sistema de fallback para quando n8n indisponível
- Validação de payloads e responses
```

#### **Task 1.2: Atualizar Schema do Banco**
```sql
-- Adicionar campos necessários
ALTER TABLE Chat ADD COLUMN last_message_at TIMESTAMP;
ALTER TABLE Message ADD COLUMN read_at TIMESTAMP;
-- Criar tabela de resumos se necessário
CREATE TABLE chat_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES Chat(id),
  summary TEXT,
  key_points JSONB,
  sentiment TEXT,
  priority TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **Task 1.3: Corrigir Referências Hardcoded**
```typescript
// Substituir IDs hardcoded por contexto real
// Em chatSummaryService.ts e outros serviços
const userId = useAuthContext().user?.id; // Em vez de 'current-user-id'
```

#### **Task 1.4: Validar Interfaces TypeScript**
```typescript
// src/types/chat.ts
- Sincronizar interfaces com schema atual
- Adicionar tipos para resumos e IA
- Validar compatibilidade com Evolution API
```

### **📁 Arquivos a Criar/Modificar**
- `src/services/n8nService.ts` - Serviço n8n (CRIAR)
- `src/types/chat.ts` - Tipos atualizados (MODIFICAR)
- `supabase/migrations/` - Schema update (CRIAR)
- `src/services/chatSummaryService.ts` - Corrigir referências (MODIFICAR)
- `src/hooks/useChatSummary.ts` - Atualizar dependências (MODIFICAR)

### **🤖 MCPs e Agents a Utilizar**
- **Supabase Integration MCP**: Para atualizações de schema
- **Sequential Thinking**: Para estruturar correções
- **backend-architect**: Para arquitetura dos serviços
- **semgrep-mcp**: Para validação de segurança

### **✅ Critérios de Aceite**
- Módulo compila sem erros de dependências
- Schema do banco sincronizado com código
- Todos os IDs vêm de contexto real
- n8nService funcional ou dependência removida
- Build passa sem warnings TypeScript

### **⚠️ Riscos e Mitigações**
- **Risco**: Quebrar funcionalidades existentes
- **Mitigação**: Implementar mudanças incrementalmente com testes
- **Risco**: Migration de banco falhar
- **Mitigação**: Backup completo antes de alterações

### **🔗 Dependências**
- Acesso ao banco Supabase para migrations
- Sistema de autenticação funcionando
- n8n configurado ou estratégia de fallback definida

---

## ⚡ **ETAPA 2: OTIMIZAÇÃO DE PERFORMANCE E SEGURANÇA**
**Duração:** 2-3 dias | **Prioridade:** 🔴 CRÍTICA

### **🎯 Contexto**
O módulo apresenta vulnerabilidades de segurança e problemas de performance que podem impactar a experiência do usuário e a segurança dos dados.

### **📋 Objetivos Específicos**
- [ ] Implementar rate limiting robusto
- [ ] Otimizar queries N+1 para performance
- [ ] Adicionar sanitização rigorosa de conteúdo
- [ ] Implementar cache inteligente com TTL
- [ ] Melhorar cleanup de subscriptions

### **🗂️ Tarefas Detalhadas**

#### **Task 2.1: Rate Limiting e Throttling**
```typescript
// src/hooks/useRateLimit.ts
- Implementar throttle para envio de mensagens
- Limite por usuário (ex: 20 mensagens/minuto)
- UI feedback quando limite atingido
- Sistema de bypass para admins
```

#### **Task 2.2: Otimizar Queries N+1**
```typescript
// src/services/chatsService.ts
- Implementar query otimizada com JOINs
- Buscar dados relacionados em batch
- Cache de resultados com React Query
- Reduzir número de round trips ao banco
```

#### **Task 2.3: Sanitização de Conteúdo**
```typescript
// src/utils/contentSanitizer.ts
- Implementar DOMPurify para mensagens
- Validação de URLs antes de renderizar
- Escape de caracteres especiais
- Whitelist de tags HTML permitidas
```

#### **Task 2.4: Cache Inteligente**
```typescript
// Implementar cache system avançado:
- TTL adequado por tipo de dados
- Compression para dados grandes
- Cleanup automático de cache antigo
- Estratégias de invalidação inteligente
```

### **📁 Arquivos a Criar/Modificar**
- `src/hooks/useRateLimit.ts` - Rate limiting (CRIAR)
- `src/utils/contentSanitizer.ts` - Sanitização (CRIAR)
- `src/services/chatsService.ts` - Otimizar queries (MODIFICAR)
- `src/hooks/useMessages.ts` - Cache melhorado (MODIFICAR)
- `src/components/chats/MessageBubble.tsx` - Sanitização (MODIFICAR)

### **🤖 MCPs e Agents a Utilizar**
- **Semgrep Security MCP**: Para validação de segurança
- **performance-benchmarker**: Para otimizações
- **backend-architect**: Para arquitetura de cache
- **test-writer-fixer**: Para validar melhorias

### **✅ Critérios de Aceite**
- Rate limiting funcional sem impactar UX
- Queries otimizadas (< 100ms response time)
- Zero vulnerabilidades XSS
- Cache hit rate > 80%
- Cleanup automático de subscriptions funcionando

### **⚠️ Riscos e Mitigações**
- **Risco**: Over-optimization quebrar funcionalidades
- **Mitigação**: Benchmark antes/depois de cada mudança
- **Risco**: Rate limiting muito agressivo
- **Mitigação**: Configuração flexível por environment

---

## 🤖 **ETAPA 3: FUNCIONALIDADES AVANÇADAS E IA**
**Duração:** 2-3 dias | **Prioridade:** 🟡 ALTA

### **🎯 Contexto**
Implementar e aprimorar funcionalidades avançadas como resumos automáticos com IA, análise de sentimento e features administrativas para supervisão de chats.

### **📋 Objetivos Específicos**
- [ ] Sistema de resumos automáticos 100% funcional
- [ ] Análise de sentimento em tempo real
- [ ] Painel administrativo completo
- [ ] Sistema de mensagens lidas/não lidas
- [ ] Analytics de conversação

### **🗂️ Tarefas Detalhadas**

#### **Task 3.1: Resumos Automáticos com IA**
```typescript
// Melhorar src/services/chatSummaryService.ts
- Integração robusta com n8n
- Fallback para resumo básico
- Cache inteligente de resumos
- Regeneração automática de resumos antigos
```

#### **Task 3.2: Sistema de Mensagens Lidas**
```typescript
// Implementar tracking de leitura:
- Marcar mensagens como lidas automaticamente
- Indicadores visuais de não lidas
- Contadores precisos de mensagens
- Notificações push para mensagens importantes
```

#### **Task 3.3: Painel Administrativo Avançado**
```typescript
// src/components/chats/AdminPanel.tsx
- Dashboard de supervisão em tempo real
- Métricas de resposta por agente
- Alertas para conversas paradas
- Distribuição automática de chats
```

#### **Task 3.4: Analytics de Conversação**
```typescript
// src/components/chats/ChatAnalytics.tsx
- Tempo médio de resposta
- Taxa de conversão por chat
- Palavras-chave mais frequentes
- Sentiment analysis em tempo real
```

### **📁 Arquivos a Criar/Modificar**
- `src/components/chats/AdminPanel.tsx` - Painel admin (CRIAR)
- `src/components/chats/ChatAnalytics.tsx` - Analytics (CRIAR)
- `src/hooks/useChatAnalytics.ts` - Hook analytics (CRIAR)
- `src/services/chatSummaryService.ts` - Melhorar IA (MODIFICAR)
- `src/hooks/useMessages.ts` - Mensagens lidas (MODIFICAR)

### **🤖 MCPs e Agents a Utilizar**
- **AI Engineer**: Para funcionalidades de IA
- **analytics-reporter**: Para métricas e insights
- **frontend-developer**: Para componentes avançados
- **backend-architect**: Para arquitetura de analytics

### **✅ Critérios de Aceite**
- Resumos automáticos com 95% accuracy
- Análise de sentimento funcionando
- Painel admin com métricas em tempo real
- Sistema de lidas/não lidas preciso
- Analytics exportáveis em CSV/PDF

---

## 🚀 **ETAPA 4: UX E REAL-TIME MELHORADOS**
**Duração:** 1-2 dias | **Prioridade:** 🟠 MÉDIA

### **🎯 Contexto**
Melhorar a experiência do usuário com features avançadas de UI/UX, otimizações de real-time e microinterações que tornam o chat mais intuitivo e responsivo.

### **📋 Objetivos Específicos**
- [ ] Typing indicators em tempo real
- [ ] Status de entrega de mensagens
- [ ] Preview de links compartilhados
- [ ] Drag & drop para anexos
- [ ] Atalhos de teclado

### **🗂️ Tarefas Detalhadas**

#### **Task 4.1: Typing Indicators**
```typescript
// src/components/chats/TypingIndicator.tsx
- Indicator visual quando usuário está digitando
- Broadcast via WebSockets
- Timeout automático após inatividade
- Multiple users typing support
```

#### **Task 4.2: Status de Entrega**
```typescript
// Implementar status visual:
- Mensagem enviada (✓)
- Mensagem entregue (✓✓)
- Mensagem lida (✓✓ azul)
- Mensagem com erro (❌)
```

#### **Task 4.3: Preview de Links**
```typescript
// src/components/chats/LinkPreview.tsx
- Fetch automático de metadata de URLs
- Thumbnail e título de links
- Cache de previews
- Suporte a YouTube, Instagram, etc.
```

#### **Task 4.4: Drag & Drop para Anexos**
```typescript
// src/components/chats/FileDropZone.tsx
- Área de drop visual
- Progress de upload
- Preview de arquivos
- Validação de tipos e tamanhos
```

### **📁 Arquivos a Criar/Modificar**
- `src/components/chats/TypingIndicator.tsx` (CRIAR)
- `src/components/chats/LinkPreview.tsx` (CRIAR)
- `src/components/chats/FileDropZone.tsx` (CRIAR)
- `src/components/chats/MessageBubble.tsx` (MODIFICAR)
- `src/hooks/useMessages.ts` (MODIFICAR)

### **🤖 MCPs e Agents a Utilizar**
- **ui-designer**: Para design das features
- **whimsy-injector**: Para microinterações
- **frontend-developer**: Para implementação
- **mobile-app-builder**: Para responsividade

### **✅ Critérios de Aceite**
- Typing indicators funcionando em tempo real
- Status de entrega preciso
- Preview de links automático
- Drag & drop intuitivo
- Atalhos de teclado documentados

---

## 🧪 **ETAPA 5: TESTES E VALIDAÇÃO COMPLETA**
**Duração:** 2-3 dias | **Prioridade:** 🟢 IMPORTANTE

### **🎯 Contexto**
Implementar cobertura completa de testes para garantir qualidade e confiabilidade do sistema de chats, incluindo testes unitários, de integração e E2E.

### **📋 Objetivos Específicos**
- [ ] Testes unitários para todos os componentes
- [ ] Testes de integração com Evolution API
- [ ] Testes de real-time com WebSockets
- [ ] Testes de segurança e performance
- [ ] Testes E2E de fluxos completos

### **🗂️ Tarefas Detalhadas**

#### **Task 5.1: Testes Unitários**
```typescript
// src/tests/components/chats/
- ChatList.test.tsx - Lista de conversas
- ChatWindow.test.tsx - Interface de chat
- MessageBubble.test.tsx - Componente de mensagem
- EvolutionApiConnection.test.tsx - Conexão WhatsApp
- ChatSummaryPanel.test.tsx - Painel de resumos
```

#### **Task 5.2: Testes de Hooks**
```typescript
// src/tests/hooks/
- useChats.test.ts - Gestão de chats
- useMessages.test.ts - Gestão de mensagens
- useChatSummary.test.ts - Resumos com IA
- useRateLimit.test.ts - Rate limiting
```

#### **Task 5.3: Testes de Serviços**
```typescript
// src/tests/services/
- chatsService.test.ts - CRUD de chats
- messagesService.test.ts - CRUD de mensagens
- chatSummaryService.test.ts - Resumos com IA
- evolutionApiService.test.ts - Evolution API
```

#### **Task 5.4: Testes de Integração**
```typescript
// src/tests/integration/
- ChatFlow.integration.test.tsx - Fluxo completo
- WhatsAppIntegration.test.ts - Integração WhatsApp
- RealtimeUpdates.test.ts - Updates em tempo real
```

#### **Task 5.5: Testes E2E**
```typescript
// cypress/e2e/chats/
- chat-conversation.cy.ts - Conversa completa
- admin-supervision.cy.ts - Supervisão admin
- whatsapp-connection.cy.ts - Conexão WhatsApp
```

### **📁 Arquivos a Criar/Modificar**
- `src/tests/components/chats/` - Testes de componentes (CRIAR)
- `src/tests/hooks/` - Testes de hooks (CRIAR)
- `src/tests/services/` - Testes de serviços (CRIAR)
- `src/tests/integration/` - Testes de integração (CRIAR)
- `cypress/e2e/chats/` - Testes E2E (CRIAR)

### **🤖 MCPs e Agents a Utilizar**
- **test-writer-fixer**: Para criação e manutenção dos testes
- **performance-benchmarker**: Para testes de performance
- **semgrep-mcp**: Para testes de segurança

### **✅ Critérios de Aceite**
- Cobertura de testes > 80%
- Todos os testes unitários passando
- Testes de integração validados
- Testes E2E de fluxos críticos
- Performance validada (< 2s response time)

---

## 📊 **MÉTRICAS DE SUCESSO**

| Métrica | Estado Atual | Meta | Como Medir |
|---------|-------------|------|------------|
| **Funcionalidade** | 85% | 100% | Todas features operacionais |
| **Dependências** | 60% | 100% | Build sem erros |
| **Performance** | Boa | Excelente | Response time < 2s |
| **Segurança** | Média | Alta | Zero vulnerabilidades |
| **Testes** | 0% | 80% | Coverage report |

---

## 🎯 **RECURSOS NECESSÁRIOS**

### **MCPs Principais**
- **Sequential Thinking**: Estruturação de tarefas complexas
- **Supabase Integration**: Operações de banco de dados
- **Semgrep Security**: Validação de código seguro
- **Context7**: Documentação de bibliotecas

### **Agents Especializados**
- **backend-architect**: APIs e integração Supabase  
- **frontend-developer**: Componentes React e integração
- **ai-engineer**: Funcionalidades de IA e resumos
- **performance-benchmarker**: Otimizações e performance
- **test-writer-fixer**: Testes automatizados
- **ui-designer**: Design e UX dos componentes

---

## 🔄 **PRÓXIMOS PASSOS**

1. **Validar plano com stakeholders** - Confirmar prioridades e timeline
2. **Iniciar Etapa 1** - Correção de dependências críticas
3. **Setup de ambiente de testes** - Configurar ferramentas de teste
4. **Preparar dados de teste** - WhatsApp sandbox e dados mock
5. **Documentar APIs** - Para facilitar integração e manutenção

---

## 📝 **Observações Finais**

Este plano foca especificamente no **Módulo Chats** como um sistema crítico de comunicação. O sucesso desta implementação estabelecerá o padrão para sistemas de tempo real na plataforma.

**Tempo Total Estimado:** 8-12 dias  
**Risco:** Médio-Alto (integrações externas e real-time)  
**Impacto:** Alto (comunicação é core para CRM imobiliário)

---

**Documento criado por:** Claude Code com Sequential Thinking MCP  
**Próxima atualização:** Após conclusão da Etapa 1  
**Status:** 📋 Pronto para implementação