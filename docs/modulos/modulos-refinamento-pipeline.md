# 🔧 Plano de Refinamento - MÓDULO PIPELINE

**Data de Criação:** 03/08/2025  
**Status:** 📋 Documento de Planejamento  
**Módulo:** Pipeline (Funil de Vendas Interativo)  
**Última Atualização:** 03/08/2025  

---

## 📋 **Visão Geral**

Este documento detalha o plano de ações de implementação, correção e desenvolvimento para tornar o **Módulo Pipeline** **100% funcional**, com funil de vendas interativo, drag-and-drop operacional, métricas de conversão reais e integração completa com banco de dados.

Baseado na auditoria técnica realizada e no planejamento pós-auditoria, o Pipeline será refinado através de 5 etapas estruturadas utilizando os MCPs e agents especializados disponíveis no Claude Code.

---

## 🎯 **STATUS ATUAL E PROBLEMAS IDENTIFICADOS**

### **📊 Status Atual (Baseado na Auditoria)**

| Aspecto | Status Atual | Meta |
|---------|-------------|------|
| **Funcionalidade** | 70% (problemas críticos) | 100% operacional |
| **Drag & Drop** | 0% (apenas placeholder) | 100% funcional |
| **Banco de Dados** | 0% (schema inconsistente) | 100% integrado |
| **Segurança** | 0% (sem RLS) | 100% seguro |
| **Testes** | 0% | 80% cobertura |

### **🚨 Problemas Críticos Identificados**

1. **Componentes faltantes que impedem funcionamento**:
   - `DealFormModal` não existe (causa erro de build)
   - `DealDetailsModal` não existe (causa erro de build)
2. **Schema de banco inconsistente**:
   - Tabelas `DealStageHistory` e `DealActivity` não existem
   - Campos `currentStage`, `probability`, `expectedValue` ausentes na tabela `Deal`
3. **Drag & Drop não funcional** - Sistema apenas visual, frustra usuários
4. **Ausência total de RLS** - Compromete segurança em produção
5. **Zero testes implementados** - Compromete qualidade e confiabilidade

---

## 🗓️ **CRONOGRAMA DE REFINAMENTO - 8-12 DIAS**

| Etapa | Descrição | Duração | Prioridade |
|-------|-----------|---------|------------|
| **1** | Correções Críticas e Schema | 2-3 dias | 🔴 CRÍTICA |
| **2** | Drag & Drop Funcional | 2-3 dias | 🔴 CRÍTICA |
| **3** | Métricas e Analytics Reais | 2-3 dias | 🟡 ALTA |
| **4** | Segurança e Automações | 1-2 dias | 🟡 ALTA |
| **5** | Testes e Validação | 1-2 dias | 🟢 IMPORTANTE |

---

## 🔧 **ETAPA 1: CORREÇÕES CRÍTICAS E SCHEMA**
**Duração:** 2-3 dias | **Prioridade:** 🔴 CRÍTICA

### **🎯 Contexto**
O módulo Pipeline possui componentes faltantes que impedem o build e um schema de banco inconsistente que causa erros nas operações CRUD. Esta etapa resolve os bloqueadores fundamentais.

### **📋 Objetivos Específicos**
- [ ] Implementar `DealFormModal` e `DealDetailsModal` funcionais
- [ ] Corrigir schema do banco de dados (adicionar tabelas e campos)
- [ ] Implementar políticas RLS básicas
- [ ] Corrigir imports e dependências quebradas
- [ ] Validação com Zod para todas as operações

### **🗂️ Tarefas Detalhadas**

#### **Task 1.1: Implementar Modais Faltantes**
```typescript
// src/components/pipeline/DealFormModal.tsx
- Modal de criação/edição de deals
- Formulário com React Hook Form + Zod
- Seleção de contato, propriedade, agente
- Validação robusta de campos obrigatórios
- Estados de loading e error handling
```

#### **Task 1.2: Corrigir Schema do Banco**
```prisma
// schema.prisma - Adicionar campos faltantes na tabela Deal:
currentStage: DealStage @default(LEAD_IN)
probability: Float @default(0.0)
expectedValue: Decimal?
daysInStage: Int @default(0)
nextAction: String?
nextActionDate: DateTime?

// Criar tabelas faltantes:
model DealStageHistory {
  id: String @id @default(uuid())
  dealId: String
  fromStage: DealStage
  toStage: DealStage
  changedAt: DateTime @default(now())
  changedBy: String
  reason: String?
}

model DealActivity {
  id: String @id @default(uuid())
  dealId: String
  type: DealActivityType
  description: String
  metadata: Json?
  createdAt: DateTime @default(now())
}
```

#### **Task 1.3: Implementar Políticas RLS**
```sql
-- Criar políticas de segurança para isolamento por agente/empresa
CREATE POLICY "deals_select_policy" ON public.deals
FOR SELECT USING (
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'DEV_MASTER') 
      THEN true
    WHEN EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN') 
      THEN company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    ELSE agent_id = auth.uid()
  END
);
```

#### **Task 1.4: Validação com Zod**
```typescript
// src/schemas/pipeline.ts
- CreateDealSchema para validação de criação
- UpdateDealSchema para validação de edição
- MoveDealSchema para validação de movimentação
- PipelineFiltersSchema para validação de filtros
```

### **📁 Arquivos a Criar/Modificar**
- `src/components/pipeline/DealFormModal.tsx` (CRIAR)
- `src/components/pipeline/DealDetailsModal.tsx` (CRIAR)
- `src/schemas/pipeline.ts` (CRIAR)
- `schema.prisma` (MODIFICAR - adicionar campos e tabelas)
- `supabase/migrations/` (CRIAR - migration para schema)
- `src/services/pipelineService.ts` (MODIFICAR - corrigir hardcoded values)

### **🤖 MCPs e Agents a Utilizar**
- **Sequential Thinking**: Para estruturar correções complexas
- **Supabase Integration**: Para schema e queries
- **backend-architect**: Para design das correções
- **frontend-developer**: Para implementação dos modais
- **Semgrep Security**: Para validar políticas RLS

### **✅ Critérios de Aceite**
- Build do projeto funciona sem erros
- Modais de deal abrem e funcionam corretamente
- Todas as operações CRUD funcionam com o banco real
- RLS policies implementadas e testadas
- Validação Zod funcionando em todas as operações

### **⚠️ Riscos e Mitigações**
- **Risco**: Migration complexa quebrar dados existentes
- **Mitigação**: Testar migration em ambiente de desenvolvimento primeiro
- **Risco**: RLS policies muito restritivas
- **Mitigação**: Implementar políticas incrementalmente com fallbacks

### **🔗 Dependências**
- Supabase configurado e funcionando
- Sistema de autenticação operacional
- Permissões de DEV_MASTER para alterações de schema

---

## 🎯 **ETAPA 2: DRAG & DROP FUNCIONAL**
**Duração:** 2-3 dias | **Prioridade:** 🔴 CRÍTICA

### **🎯 Contexto**
O sistema atual sugere drag & drop mas é apenas visual. Usuários tentam arrastar cards sem sucesso, causando frustração. Precisa ser implementado um sistema real de drag & drop.

### **📋 Objetivos Específicos**
- [ ] Implementar biblioteca react-beautiful-dnd ou @dnd-kit
- [ ] Drag & drop entre colunas com validação de transições
- [ ] Animações suaves e feedback visual
- [ ] Sincronização automática com banco de dados
- [ ] Otimistic updates para responsividade

### **🗂️ Tarefas Detalhadas**

#### **Task 2.1: Integrar Biblioteca de DnD**
```typescript
// Avaliar e implementar:
// @dnd-kit/core (mais moderno, melhor acessibilidade)
// ou react-beautiful-dnd (mais maduro, ampla adoção)
// Critério: Suporte a mobile e acessibilidade
```

#### **Task 2.2: Implementar Drag & Drop no Kanban**
```typescript
// src/components/pipeline/PipelineKanban.tsx
- Configurar DndContext e providers
- Implementar onDragEnd handler
- Validação de transições permitidas
- Otimistic updates com React Query
- Rollback em caso de erro
```

#### **Task 2.3: Feedback Visual Avançado**
```typescript
// Implementar:
- Drag overlay customizado
- Drop zones destacadas
- Animações de entrada/saída
- Estados de hover e dragging
- Indicadores de transições válidas/inválidas
```

#### **Task 2.4: Validação de Regras de Negócio**
```typescript
// src/utils/pipelineRules.ts
- Regras de transição entre estágios
- Validação de permissões por role
- Bloqueios temporários (ex: deal em negociação)
- Logs automáticos de movimentações
```

### **📁 Arquivos a Criar/Modificar**
- `package.json` (MODIFICAR - adicionar dependência DnD)
- `src/components/pipeline/PipelineKanban.tsx` (MODIFICAR)
- `src/components/pipeline/KanbanColumn.tsx` (MODIFICAR)
- `src/components/pipeline/DealCard.tsx` (MODIFICAR)
- `src/utils/pipelineRules.ts` (CRIAR)
- `src/hooks/usePipelineDnD.ts` (CRIAR)

### **🤖 MCPs e Agents a Utilizar**
- **Context7**: Para documentação das bibliotecas DnD
- **frontend-developer**: Para implementação React
- **ui-designer**: Para UX das animações
- **performance-benchmarker**: Para otimizar animações

### **✅ Critérios de Aceite**
- Drag & drop funciona suavemente em desktop e mobile
- Transições de estágio respeitam regras de negócio
- Animações são fluidas e informativas
- Sincronização com banco é instantânea
- Rollback automático em caso de erro de API

### **⚠️ Riscos e Mitigações**
- **Risco**: Performance ruim em listas grandes
- **Mitigação**: Virtualização ou paginação dos cards
- **Risco**: Problemas de acessibilidade
- **Mitigação**: Usar @dnd-kit com suporte nativo a a11y

---

## 📊 **ETAPA 3: MÉTRICAS E ANALYTICS REAIS**
**Duração:** 2-3 dias | **Prioridade:** 🟡 ALTA

### **🎯 Contexto**
As métricas atuais são calculadas em memória com dados mockados. Precisam ser conectadas ao banco real com cálculos precisos, filtros por período e comparações históricas.

### **📋 Objetivos Específicos**
- [ ] Métricas de conversão reais por estágio
- [ ] Cálculos de receita projetada baseada em probabilidade
- [ ] Comparações históricas (mês anterior, trimestre)
- [ ] Filtros avançados por agente, período, valor
- [ ] Dashboards visuais com Recharts

### **🗂️ Tarefas Detalhadas**

#### **Task 3.1: Métricas de Conversão Avançadas**
```typescript
// src/services/pipelineAnalytics.ts
- Taxa de conversão entre estágios
- Tempo médio por estágio
- Deals perdidos por motivo
- Performance por agente
- Tendências sazonais
```

#### **Task 3.2: Receita Projetada Inteligente**
```typescript
// Cálculos baseados em:
- Probabilidade histórica por estágio
- Valor médio de fechamento
- Sazonalidade do mercado
- Performance individual do agente
- Fatores externos (economia, mercado)
```

#### **Task 3.3: Dashboards Visuais**
```typescript
// src/components/pipeline/PipelineDashboard.tsx
- Gráfico de funil com conversões
- Timeline de deals por estágio
- Heatmap de performance
- Projeções de receita
- Comparações período a período
```

#### **Task 3.4: Filtros e Segmentação**
```typescript
// src/components/pipeline/PipelineFilters.tsx
- Filtros por data (período personalizado)
- Filtros por agente/equipe
- Filtros por valor (faixas)
- Filtros por fonte de lead
- Segmentação por características do deal
```

### **📁 Arquivos a Criar/Modificar**
- `src/services/pipelineAnalytics.ts` (CRIAR)
- `src/components/pipeline/PipelineDashboard.tsx` (MODIFICAR - implementar)
- `src/components/pipeline/PipelineFilters.tsx` (CRIAR)
- `src/components/pipeline/ConversionMetrics.tsx` (CRIAR)
- `src/hooks/usePipelineAnalytics.ts` (CRIAR)

### **🤖 MCPs e Agents a Utilizar**
- **Supabase Integration**: Para queries complexas de analytics
- **Context7**: Para documentação do Recharts
- **analytics-reporter**: Para design das métricas
- **backend-architect**: Para otimização de queries

### **✅ Critérios de Aceite**
- Métricas mostram dados reais e precisos
- Filtros aplicam-se instantaneamente
- Gráficos são interativos e informativos
- Performance adequada mesmo com grandes volumes
- Comparações históricas funcionais

### **⚠️ Riscos e Mitigações**
- **Risco**: Queries lentas com grandes volumes de dados
- **Mitigação**: Implementar cache e índices otimizados
- **Risco**: Cálculos incorretos nas métricas
- **Mitigação**: Testes unitários extensivos para fórmulas

---

## 🔒 **ETAPA 4: SEGURANÇA E AUTOMAÇÕES**
**Duração:** 1-2 dias | **Prioridade:** 🟡 ALTA

### **🎯 Contexto**
Implementar segurança robusta com RLS avançado e começar as automações do pipeline, incluindo triggers de entrada/saída de estágios e integrações com N8N.

### **📋 Objetivos Específicos**
- [ ] RLS policies completas e testadas
- [ ] Sistema de automações por estágio
- [ ] Triggers de lembretes automáticos
- [ ] Integração básica com N8N
- [ ] Auditoria de ações críticas

### **🗂️ Tarefas Detalhadas**

#### **Task 4.1: RLS Avançado**
```sql
-- Políticas granulares para:
- Visualização baseada em role e empresa
- Edição apenas pelo agente responsável
- Histórico de estágios com auditoria
- Atividades filtradas por permissão
```

#### **Task 4.2: Sistema de Automações**
```typescript
// src/services/pipelineAutomations.ts
- Triggers por mudança de estágio
- Lembretes automáticos por tempo
- Notificações para equipe
- Atualizações de probabilidade
- Integrações com webhooks
```

#### **Task 4.3: Interface de Configuração**
```typescript
// src/components/pipeline/PipelineAutomations.tsx
- Configuração visual de automações
- Regras condicionais (if/then)
- Testes de automações
- Histórico de execuções
```

### **📁 Arquivos a Criar/Modificar**
- `supabase/migrations/` (CRIAR - RLS policies avançadas)
- `src/services/pipelineAutomations.ts` (CRIAR)
- `src/components/pipeline/PipelineAutomations.tsx` (MODIFICAR - implementar)
- `src/hooks/useAutomations.ts` (CRIAR)

### **🤖 MCPs e Agents a Utilizar**
- **Supabase Integration**: Para políticas RLS
- **Semgrep Security**: Para validação de segurança
- **backend-architect**: Para arquitetura de automações

### **✅ Critérios de Aceite**
- RLS policies funcionam para todos os roles
- Automações executam conforme configurado
- Interface de configuração é intuitiva
- Logs de auditoria capturados
- Performance não é impactada

---

## 🧪 **ETAPA 5: TESTES E VALIDAÇÃO**
**Duração:** 1-2 dias | **Prioridade:** 🟢 IMPORTANTE

### **🎯 Contexto**
Implementar cobertura completa de testes para garantir qualidade e confiabilidade do Pipeline, incluindo testes de drag & drop, métricas e segurança.

### **📋 Objetivos Específicos**
- [ ] Testes unitários para todos os componentes
- [ ] Testes de integração com Supabase
- [ ] Testes de drag & drop
- [ ] Testes de RLS e segurança
- [ ] Testes de performance com grandes volumes

### **🗂️ Tarefas Detalhadas**

#### **Task 5.1: Testes Unitários Abrangentes**
```typescript
// src/tests/pipeline/
- PipelineKanban.test.tsx
- DealCard.test.tsx
- DealFormModal.test.tsx
- pipelineService.test.ts
- pipelineAnalytics.test.ts
```

#### **Task 5.2: Testes de Drag & Drop**
```typescript
// Testes específicos para:
- Movimentação entre colunas
- Validação de transições
- Rollback em erros
- Performance com muitos cards
```

#### **Task 5.3: Testes de Segurança**
```typescript
// Validar:
- RLS policies por diferentes usuários
- Tentativas de acesso não autorizado
- Validação de entrada maliciosa
- Auditoria de ações
```

### **📁 Arquivos a Criar/Modificar**
- `src/tests/pipeline/` (CRIAR - diretório completo)
- `src/tests/integration/Pipeline.integration.test.tsx` (CRIAR)
- `src/tests/security/PipelineRLS.test.ts` (CRIAR)

### **🤖 MCPs e Agents a Utilizar**
- **test-writer-fixer**: Para criação e manutenção dos testes
- **performance-benchmarker**: Para testes de performance
- **Semgrep Security**: Para testes de segurança

### **✅ Critérios de Aceite**
- Cobertura de testes > 80%
- Todos os testes passando
- Drag & drop testado em diferentes cenários
- RLS policies validadas
- Performance adequada com 1000+ deals

---

## 📊 **MÉTRICAS DE SUCESSO**

| Métrica | Estado Atual | Meta | Como Medir |
|---------|-------------|------|------------|
| **Build Status** | ❌ Quebrado | ✅ Funcionando | Sem erros de compilação |
| **Drag & Drop** | 0% | 100% | Funcional em todos os navegadores |
| **Segurança** | 0% | 100% | RLS policies ativas |
| **Métricas** | Mockadas | Reais | Conectadas ao Supabase |
| **Testes** | 0% | 80% | Coverage report |

---

## 🎯 **RECURSOS NECESSÁRIOS**

### **MCPs Principais**
- **Sequential Thinking**: Estruturação de correções complexas
- **Supabase Integration**: Schema e operações de banco
- **Context7**: Documentação de bibliotecas (DnD, Recharts)
- **Semgrep Security**: Validação de políticas RLS

### **Agents Especializados**
- **backend-architect**: Schema e arquitetura de dados
- **frontend-developer**: Componentes React e DnD
- **ui-designer**: UX das interações de drag & drop
- **performance-benchmarker**: Otimizações de queries e animações
- **test-writer-fixer**: Testes abrangentes

---

## 🔄 **PRÓXIMOS PASSOS**

1. **Validar plano com stakeholders** - Confirmar prioridades e timeline
2. **Iniciar Etapa 1** - Correções críticas (bloqueador para demais etapas)
3. **Setup de ambiente de teste** - Dados mockados para testes de DnD
4. **Preparar migrations** - Schema changes sem perder dados
5. **Documentar processo** - Para aplicar a outros módulos

---

## 📝 **Observações Finais**

Este plano foca exclusivamente no **Módulo Pipeline** como um dos módulos mais complexos do sistema. O sucesso desta implementação demonstrará a capacidade de resolver problemas críticos e implementar funcionalidades avançadas.

**Tempo Total Estimado:** 8-12 dias  
**Risco:** Alto (correções críticas + funcionalidades avançadas)  
**Impacto:** Alto (Pipeline é core do negócio imobiliário)

---

**Documento criado por:** Claude Code com Sequential Thinking MCP  
**Próxima atualização:** Após conclusão da Etapa 1  
**Status:** 📋 Pronto para implementação