# 🔧 Plano de Refinamento - MÓDULO CLIENTES

**Data de Criação:** 03/08/2025  
**Status:** 📋 Documento de Planejamento  
**Módulo:** Clientes (Sistema de Leads e CRM)  
**Última Atualização:** 03/08/2025  

---

## 📋 **Visão Geral**

Este documento detalha o plano de ações de implementação, correção e desenvolvimento para tornar o **Módulo Clientes** **100% funcional**, com correção de bugs críticos, integração completa com banco de dados e testes robustos.

Baseado na auditoria técnica realizada, o módulo Clientes apresenta funcionalidades avançadas mas possui bugs críticos que impedem seu funcionamento correto. O refinamento será executado através de 5 etapas estruturadas utilizando os MCPs e agents especializados disponíveis no Claude Code.

---

## 🎯 **STATUS ATUAL E PROBLEMAS IDENTIFICADOS**

### **📊 Status Atual (Baseado na Auditoria)**

| Aspecto | Status Atual | Meta |
|---------|-------------|------|
| **Funcionalidades** | 85% (arquitetura completa) | 100% operacionais |
| **Bugs Críticos** | 3 bugs impeditivos | 0 bugs críticos |
| **Testes** | 0% cobertura | 80% cobertura |
| **Segurança** | Vulnerável (RLS) | Seguro e auditado |
| **Performance** | Otimizada (cache) | Mantida otimizada |

### **🚨 Problemas Críticos Identificados**

1. **Bugs Impeditivos**:
   - Dependência incorreta de tipos Prisma no frontend
   - Importação de hook inexistente (`useLeadCreation`)
   - Sistema de fallback sempre ativo mesmo com usuário real

2. **Problemas de Segurança**:
   - Queries sem filtro de empresa/companyId
   - Ausência de validação de permissões no backend
   - Dados sensíveis expostos em logs de debug

3. **Limitações Técnicas**:
   - ClientsService muito complexo (773 linhas)
   - Memória vazando em listas grandes
   - Validação de email permitindo strings vazias

4. **Ausência Total de Testes**:
   - 0% cobertura para funcionalidades críticas
   - Sistema de scoring sem validação
   - Drag & drop não testado

---

## 🗓️ **CRONOGRAMA DE REFINAMENTO - 8-12 DIAS**

| Etapa | Descrição | Duração | Prioridade |
|-------|-----------|---------|------------|
| **1** | Correção de Bugs Críticos | 2-3 dias | 🔴 CRÍTICA |
| **2** | Segurança e Validações | 2-3 dias | 🔴 CRÍTICA |
| **3** | Refatoração e Performance | 2-3 dias | 🟡 ALTA |
| **4** | Testes e Cobertura | 2-3 dias | 🟡 ALTA |
| **5** | Melhorias UX e Finalização | 1-2 dias | 🟠 MÉDIA |

---

## 🔧 **ETAPA 1: CORREÇÃO DE BUGS CRÍTICOS**
**Duração:** 2-3 dias | **Prioridade:** 🔴 CRÍTICA

### **🎯 Contexto**
O módulo possui 3 bugs críticos que impedem seu funcionamento correto, incluindo imports incorretos, dependências quebradas e sistema de fallback sempre ativo.

### **📋 Objetivos Específicos**
- [ ] Corrigir imports e dependências incorretas
- [ ] Resolver dependência de tipos Prisma no frontend
- [ ] Consertar sistema de fallback mockado
- [ ] Validar conexão com banco de dados
- [ ] Implementar CSS classes ausentes

### **🗂️ Tarefas Detalhadas**

#### **Task 1.1: Corrigir Imports e Dependências**
```typescript
// src/components/clients/LeadFunnelKanban.tsx:61
// ANTES: import type { LeadStage } from '@prisma/client'
// DEPOIS: import type { LeadStage } from '@/types/clients'

// src/components/clients/NewLeadForm.tsx:38
// ANTES: import { useCreateContact } from '@/hooks/useLeadCreation'
// DEPOIS: import { useCreateContact } from '@/hooks/useClients'
```

#### **Task 1.2: Implementar Validação de Tabela Contact**
```typescript
// src/services/clientsService.ts:614-622
// Implementar verificação robusta da tabela Contact
// Com retry automático e error handling adequado
```

#### **Task 1.3: Corrigir Sistema de Fallback**
```typescript
// src/pages/Clientes.tsx:37-38
// PROBLEMA: const userWithFallback = user || { id: 'mock-user', role: 'AGENT' }
// SOLUÇÃO: Usar fallback apenas quando necessário
```

#### **Task 1.4: Criar CSS Classes Ausentes**
```css
/* src/styles/kanban.css - arquivo não existe */
/* Implementar estilos específicos do Kanban */
.kanban-container { /* estilos */ }
.kanban-column { /* estilos */ }
.kanban-card { /* estilos */ }
```

#### **Task 1.5: Resolver Importação Circular**
```typescript
// src/services/clientsService.ts:533
// Implementar leadAssignmentService com tratamento robusto
// Evitar importações circulares
```

### **📁 Arquivos a Criar/Modificar**
- `src/components/clients/LeadFunnelKanban.tsx` (MODIFICAR)
- `src/components/clients/NewLeadForm.tsx` (MODIFICAR)
- `src/services/clientsService.ts` (MODIFICAR)
- `src/pages/Clientes.tsx` (MODIFICAR)
- `src/styles/kanban.css` (CRIAR)
- `src/services/leadAssignmentService.ts` (CRIAR)

### **🤖 MCPs e Agents a Utilizar**
- **Semgrep Security**: Para identificar problemas de código
- **Sequential Thinking**: Para estruturar correções complexas
- **frontend-developer**: Para correções de React
- **backend-architect**: Para refatoração de serviços

### **✅ Critérios de Aceite**
- Build sem erros de TypeScript
- Todos os imports funcionando corretamente
- Sistema de fallback inteligente (não sempre ativo)
- Tabela Contact validada e funcional
- CSS do Kanban implementado e funcionando

### **⚠️ Riscos e Mitigações**
- **Risco**: Quebrar funcionalidades existentes
- **Mitigação**: Testes manuais após cada correção
- **Risco**: Problemas de performance após correções
- **Mitigação**: Monitorar métricas durante desenvolvimento

### **🔗 Dependências**
- Supabase configurado com tabela Contact
- Sistema de tipos TypeScript local
- Build system funcionando

---

## 🔒 **ETAPA 2: SEGURANÇA E VALIDAÇÕES**
**Duração:** 2-3 dias | **Prioridade:** 🔴 CRÍTICA

### **🎯 Contexto**
O módulo possui vulnerabilidades de segurança críticas, incluindo ausência de filtros por empresa, validações de permissões inadequadas e exposição de dados sensíveis.

### **📋 Objetivos Específicos**
- [ ] Implementar filtros por companyId em todas queries
- [ ] Adicionar validações de permissões no backend
- [ ] Implementar RLS policies robustas
- [ ] Remover dados sensíveis de logs
- [ ] Adicionar rate limiting nas APIs

### **🗂️ Tarefas Detalhadas**

#### **Task 2.1: Implementar Filtros por Empresa**
```typescript
// Todas as queries devem incluir companyId
// Exemplo: ClientsService.getContacts(agentId, companyId)
// Validar isolamento entre empresas diferentes
```

#### **Task 2.2: Validações de Permissões Backend**
```typescript
// src/services/clientsService.ts
// Implementar validações:
// - AGENT: só vê próprios leads
// - ADMIN: vê leads da empresa
// - DEV_MASTER: acesso irrestrito
```

#### **Task 2.3: RLS Policies no Supabase**
```sql
-- Implementar policies robustas para Contact
-- Garantir isolamento por empresa e agent
-- Testar com diferentes roles
```

#### **Task 2.4: Sanitização de Logs**
```typescript
// Remover dados sensíveis como:
// - Emails dos contatos
// - Números de telefone
// - Informações pessoais
// Manter apenas IDs e métricas agregadas
```

#### **Task 2.5: Rate Limiting**
```typescript
// Implementar rate limiting para:
// - Criação de contatos (max 10/min)
// - Busca/filtros (max 60/min)
// - Bulk operations (max 5/min)
```

### **📁 Arquivos a Criar/Modificar**
- `src/services/clientsService.ts` (MODIFICAR)
- `src/hooks/useClients.ts` (MODIFICAR)
- `src/utils/permissions.ts` (CRIAR)
- `src/utils/rateLimiter.ts` (CRIAR)
- `supabase/migrations/rls_policies_contacts.sql` (CRIAR)
- `src/utils/logger.ts` (CRIAR)

### **🤖 MCPs e Agents a Utilizar**
- **Supabase Integration MCP**: Para RLS policies
- **Semgrep Security**: Para análise de vulnerabilidades
- **backend-architect**: Para arquitetura de segurança
- **legal-compliance-checker**: Para conformidade

### **✅ Critérios de Aceite**
- Todas queries filtradas por companyId
- RLS policies testadas e funcionando
- Logs sanitizados sem dados sensíveis
- Rate limiting implementado e testado
- Diferentes roles com acessos corretos

### **⚠️ Riscos e Mitigações**
- **Risco**: RLS muito restritivo quebrando funcionalidades
- **Mitigação**: Testes extensivos com dados reais
- **Risco**: Rate limiting muito agressivo
- **Mitigação**: Configuração ajustável por ambiente

---

## 🚀 **ETAPA 3: REFATORAÇÃO E PERFORMANCE**
**Duração:** 2-3 dias | **Prioridade:** 🟡 ALTA

### **🎯 Contexto**
O ClientsService está muito complexo (773 linhas), há vazamentos de memória em listas grandes e o sistema precisa de otimizações para escalar adequadamente.

### **📋 Objetivos Específicos**
- [ ] Refatorar ClientsService em módulos menores
- [ ] Corrigir vazamentos de memória no Kanban
- [ ] Otimizar useMemo para grandes datasets
- [ ] Implementar virtualização de listas
- [ ] Otimizar queries com paginação inteligente

### **🗂️ Tarefas Detalhadas**

#### **Task 3.1: Refatoração do ClientsService**
```typescript
// Dividir em múltiplos serviços:
// - ContactService: CRUD básico
// - LeadScoringService: Algoritmo de scoring
// - LeadAssignmentService: Atribuição automática
// - CampaignService: Gestão de campanhas
// - ActivityService: Atividades de leads
```

#### **Task 3.2: Otimização do Kanban**
```typescript
// src/components/clients/LeadFunnelKanban.tsx:183-222
// Problemas identificados:
// - useMemo não otimizado para grandes datasets
// - Re-renders desnecessários
// - Memória não liberada adequadamente
```

#### **Task 3.3: Virtualização de Listas**
```typescript
// Implementar react-window para:
// - Lista de leads (>100 items)
// - Histórico de atividades
// - Lista de campanhas
// Manter performance com milhares de items
```

#### **Task 3.4: Paginação Inteligente**
```typescript
// Implementar:
// - Infinite scroll no Kanban
// - Paginação server-side
// - Cache inteligente com React Query
// - Prefetch de próximas páginas
```

#### **Task 3.5: Otimizações de Bundle**
```typescript
// Code splitting:
// - Lazy loading de tabs não ativas
// - Dynamic imports para componentes pesados
// - Tree shaking otimizado
```

### **📁 Arquivos a Criar/Modificar**
- `src/services/contactService.ts` (CRIAR)
- `src/services/leadScoringService.ts` (CRIAR)
- `src/services/leadAssignmentService.ts` (REFATORAR)
- `src/services/campaignService.ts` (CRIAR)
- `src/components/clients/VirtualizedKanban.tsx` (CRIAR)
- `src/hooks/useVirtualization.ts` (CRIAR)
- `src/services/clientsService.ts` (REFATORAR)

### **🤖 MCPs e Agents a Utilizar**
- **Sequential Thinking**: Para planejar refatoração complexa
- **performance-benchmarker**: Para otimizações
- **backend-architect**: Para arquitetura de serviços
- **frontend-developer**: Para otimizações React

### **✅ Critérios de Aceite**
- ClientsService dividido em <5 serviços menores
- Performance mantida com >1000 leads
- Memória não crescendo indefinidamente
- Paginação funcionando suavemente
- Bundle size reduzido em >20%

---

## 🧪 **ETAPA 4: TESTES E COBERTURA**
**Duração:** 2-3 dias | **Prioridade:** 🟡 ALTA

### **🎯 Contexto**
O módulo possui 0% de cobertura de testes, incluindo funcionalidades críticas como sistema de scoring, drag & drop e operações CRUD que precisam ser validadas adequadamente.

### **📋 Objetivos Específicos**
- [ ] Testes unitários para componentes críticos
- [ ] Testes de integração para hooks
- [ ] Testes para sistema de scoring
- [ ] Testes E2E para drag & drop
- [ ] Testes de segurança e permissões

### **🗂️ Tarefas Detalhadas**

#### **Task 4.1: Testes Unitários Críticos**
```typescript
// Prioridade alta:
// - LeadFunnelKanban.test.tsx (drag & drop)
// - NewLeadForm.test.tsx (validações)
// - CompactLeadCard.test.tsx (renderização)
// - leadScoringService.test.ts (algoritmo)
```

#### **Task 4.2: Testes de Hooks**
```typescript
// src/hooks/useClients.test.ts
// Testar todos os 12+ hooks:
// - useContacts, useCreateContact
// - useFunnelKanban, useMoveContactInFunnel
// - Cache invalidation strategies
```

#### **Task 4.3: Testes de Integração**
```typescript
// Fluxos completos:
// - Criar Lead → Mover no Funil → Converter
// - Sistema de scoring automático
// - Filtros avançados com múltiplos critérios
// - Bulk operations
```

#### **Task 4.4: Testes E2E Críticos**
```typescript
// Com Playwright/Cypress:
// - Drag & drop entre estágios
// - Formulário de criação completo
// - Filtros e busca avançada
// - Responsividade mobile
```

#### **Task 4.5: Testes de Segurança**
```typescript
// Validar:
// - Isolamento entre empresas diferentes
// - Permissões por role (AGENT, ADMIN, DEV_MASTER)
// - Rate limiting funcionando
// - Dados sensíveis não expostos
```

### **📁 Arquivos a Criar/Modificar**
- `src/tests/components/LeadFunnelKanban.test.tsx` (CRIAR)
- `src/tests/components/NewLeadForm.test.tsx` (CRIAR)
- `src/tests/hooks/useClients.test.ts` (CRIAR)
- `src/tests/services/leadScoringService.test.ts` (CRIAR)
- `src/tests/integration/ClientsFlow.test.tsx` (CRIAR)
- `src/tests/e2e/clients.spec.ts` (CRIAR)
- `src/tests/security/permissions.test.ts` (CRIAR)

### **🤖 MCPs e Agents a Utilizar**
- **test-writer-fixer**: Para criação e manutenção dos testes
- **performance-benchmarker**: Para testes de performance
- **backend-architect**: Para testes de integração
- **legal-compliance-checker**: Para testes de conformidade

### **✅ Critérios de Aceite**
- Cobertura de testes > 80%
- Todos os testes unitários passando
- Testes E2E para fluxos críticos
- Testes de segurança validados
- Performance mantida com testes

---

## 🎨 **ETAPA 5: MELHORIAS UX E FINALIZAÇÃO**
**Duração:** 1-2 dias | **Prioridade:** 🟠 MÉDIA

### **🎯 Contexto**
Aplicar melhorias finais de UX identificadas na auditoria, incluindo otimizações de usabilidade, persistência de filtros e aprimoramentos visuais.

### **📋 Objetivos Específicos**
- [ ] Simplificar formulário NewLeadForm
- [ ] Implementar persistência de filtros
- [ ] Adicionar shortcuts de teclado
- [ ] Melhorar responsividade mobile
- [ ] Adicionar confirmações de exclusão

### **🗂️ Tarefas Detalhadas**

#### **Task 5.1: Otimização do Formulário**
```typescript
// NewLeadForm melhorias:
// - Dividir em steps (wizard)
// - Auto-complete inteligente
// - Validação em tempo real
// - Preview do scoring
```

#### **Task 5.2: Persistência de Estado**
```typescript
// Implementar localStorage para:
// - Filtros avançados aplicados
// - Preferências de visualização
// - Estado das colunas Kanban
// - Tamanho dos cards
```

#### **Task 5.3: Shortcuts e Acessibilidade**
```typescript
// Adicionar:
// - Ctrl+N: Novo lead
// - Escape: Fechar modais
// - Tab navigation melhorada
// - ARIA labels completos
```

#### **Task 5.4: Responsividade Mobile**
```typescript
// Otimizar para dispositivos pequenos:
// - Cards maiores em mobile
// - Swipe gestures no Kanban
// - Bottom sheets para ações
// - Touch targets adequados
```

#### **Task 5.5: Confirmações e Feedback**
```typescript
// Implementar:
// - Confirmação antes de excluir leads
// - Toast notifications melhoradas
// - Loading states específicos
// - Success/error animations
```

### **📁 Arquivos a Criar/Modificar**
- `src/components/clients/NewLeadFormWizard.tsx` (CRIAR)
- `src/hooks/useLocalStorage.ts` (CRIAR)
- `src/hooks/useKeyboardShortcuts.ts` (CRIAR)
- `src/components/clients/MobileKanban.tsx` (CRIAR)
- `src/components/shared/ConfirmDialog.tsx` (CRIAR)
- `src/utils/accessibility.ts` (CRIAR)

### **🤖 MCPs e Agents a Utilizar**
- **ui-designer**: Para melhorias de UX
- **frontend-developer**: Para implementação
- **whimsy-injector**: Para micro-interações
- **ux-researcher**: Para validação de melhorias

### **✅ Critérios de Aceite**
- Formulário mais intuitivo e menos intimidativo
- Filtros persistem entre sessões
- Shortcuts funcionando corretamente
- Responsividade perfeita em mobile
- Confirmações adequadas implementadas

---

## 📊 **MÉTRICAS DE SUCESSO**

| Métrica | Estado Atual | Meta | Como Medir |
|---------|-------------|------|------------|
| **Bugs Críticos** | 3 bugs | 0 bugs | Build e testes funcionais |
| **Cobertura Testes** | 0% | 80% | Coverage report |
| **Segurança** | Vulnerável | Seguro | Audit security tests |
| **Performance** | Boa | Otimizada | < 2s carregamento |
| **UX** | Problemas leves | Excelente | User feedback |

---

## 🎯 **RECURSOS NECESSÁRIOS**

### **MCPs Principais**
- **Sequential Thinking**: Estruturação de refatorações complexas
- **Supabase Integration**: RLS policies e queries seguras
- **Semgrep Security**: Análise de vulnerabilidades
- **Context7**: Documentação técnica especializada

### **Agents Especializados**
- **test-writer-fixer**: Criação completa da suíte de testes
- **backend-architect**: Refatoração de serviços e arquitetura
- **frontend-developer**: Correções React e otimizações
- **performance-benchmarker**: Otimizações de performance
- **ui-designer**: Melhorias de UX e acessibilidade
- **legal-compliance-checker**: Validação de conformidade

---

## 🔄 **PRÓXIMOS PASSOS**

1. **Validar plano com stakeholders** - Confirmar criticidade dos bugs
2. **Iniciar Etapa 1** - Correção imediata dos bugs críticos
3. **Setup ambiente de testes** - Configurar Jest, React Testing Library
4. **Preparar dados de teste** - Datasets para validação de segurança
5. **Monitorar progresso** - Métricas em tempo real das correções

---

## 📝 **Observações Finais**

Este plano prioriza a **correção de bugs críticos** e **segurança** antes de melhorias de UX, dado que o módulo possui funcionalidades avançadas mas não funciona corretamente devido aos problemas identificados.

A **refatoração do ClientsService** é essencial para manutenibilidade futura, mas pode ser feita gradualmente sem quebrar funcionalidades existentes.

**Tempo Total Estimado:** 8-12 dias  
**Risco:** Alto (bugs críticos impedem funcionamento)  
**Impacto:** Crítico (módulo central do CRM)

---

**Documento criado por:** Claude Code com Sequential Thinking MCP  
**Próxima atualização:** Após conclusão da Etapa 1  
**Status:** 📋 Pronto para implementação