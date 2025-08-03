de# 🔧 Plano de Refinamento - MÓDULO DASHBOARD

**Data de Criação:** 03/08/2025  
**Status:** 📋 Documento de Planejamento  
**Módulo:** Dashboard (Entrada Principal do Sistema)  
**Última Atualização:** 03/08/2025  

---

## 📋 **Visão Geral**

Este documento detalha o plano de ações de implementação, correção e desenvolvimento para tornar o **Módulo Dashboard** **100% funcional**, com botões funcionais, integração completa com banco de dados e design operacional.

Baseado na auditoria técnica realizada e no planejamento pós-auditoria, o Dashboard será refinado através de 5 etapas estruturadas utilizando os MCPs e agents especializados disponíveis no Claude Code.

---

## 🎯 **STATUS ATUAL E PROBLEMAS IDENTIFICADOS**

### **📊 Status Atual (Baseado na Auditoria)**

| Aspecto | Status Atual | Meta |
|---------|-------------|------|
| **Dados Reais** | 0% (100% mockado) | 100% integrado |
| **Gráficos** | 0% (placeholders) | 100% funcionais |
| **Funcionalidades** | 20% (visual apenas) | 100% operacionais |
| **Testes** | 0% | 80% cobertura |
| **Performance** | Boa (estático) | Otimizada (dinâmica) |

### **🚨 Problemas Críticos Identificados**

1. **Dashboard 100% mockado** - Nenhum dado real do Supabase
2. **Gráficos placeholders** - Apenas divs com texto estático
3. **Funcionalidades não implementadas**:
   - Busca global não funciona
   - Notificações não implementadas
   - Ações rápidas não funcionais
   - Filtros por período ausentes
4. **Sem personalização por role** - Todos veem os mesmos dados
5. **Ausência total de testes automatizados**

---

## 🗓️ **CRONOGRAMA DE REFINAMENTO - 7-10 DIAS**

| Etapa | Descrição | Duração | Prioridade |
|-------|-----------|---------|------------|
| **1** | Integração de Dados Reais | 2-3 dias | 🔴 CRÍTICA |
| **2** | Gráficos Funcionais | 1-2 dias | 🟡 ALTA |
| **3** | Funcionalidades Pendentes | 2-3 dias | 🟡 ALTA |
| **4** | UX e Performance | 1-2 dias | 🟠 MÉDIA |
| **5** | Testes e Validação | 1-2 dias | 🟢 IMPORTANTE |

---

## 🔧 **ETAPA 1: INTEGRAÇÃO DE DADOS REAIS**
**Duração:** 2-3 dias | **Prioridade:** 🔴 CRÍTICA

### **🎯 Contexto**
O Dashboard atual exibe dados estáticos hardcoded. Precisa ser conectado ao Supabase para mostrar métricas reais baseadas no role do usuário (DEV_MASTER = global, ADMIN = empresa, AGENT = pessoal).

### **📋 Objetivos Específicos**
- [ ] Implementar hook `useDashboard` com React Query
- [ ] Conectar aos serviços PropertyService, ContactService, AppointmentService, DealService
- [ ] Aplicar RLS personalizado por role de usuário
- [ ] Implementar cache inteligente com estratégias definidas
- [ ] Adicionar loading states e error handling

### **🗂️ Tarefas Detalhadas**

#### **Task 1.1: Criar Hook Dashboard Integrado**
```typescript
// src/hooks/useDashboard.ts
- Implementar queries por role usando React Query
- Conectar aos serviços do Supabase
- Cache strategy: DYNAMIC (30s) para métricas
- Fallback para dados mockados em caso de erro
```

#### **Task 1.2: Implementar Métricas por Role**
```typescript
// Personalização por usuário:
// DEV_MASTER: Métricas de todas as empresas
// ADMIN: Métricas da empresa do usuário
// AGENT: Métricas pessoais do corretor
```

#### **Task 1.3: Conectar Serviços Existentes**
```typescript
// Integrar com:
- PropertyService.getStats() - Total de propriedades
- ContactService.getActiveClients() - Clientes ativos  
- AppointmentService.getScheduledVisits() - Visitas agendadas
- DealService.getMonthlyRevenue() - Receita mensal
```

#### **Task 1.4: Implementar Feed de Atividades Real**
```typescript
// src/hooks/useActivities.ts
- Buscar atividades reais do banco
- Sistema real-time com WebSockets
- Paginação automática
- Filtros por tipo de atividade
```

### **📁 Arquivos a Criar/Modificar**
- `src/hooks/useDashboard.ts` - Hook principal (CRIAR)
- `src/hooks/useActivities.ts` - Hook de atividades (CRIAR)
- `src/services/dashboardService.ts` - Serviço específico (CRIAR)
- `src/pages/Dashboard.tsx` - Modificar para usar hooks (MODIFICAR)
- `src/types/dashboard.ts` - Tipos TypeScript (CRIAR)

### **🤖 MCPs e Agents a Utilizar**
- **Supabase Integration MCP**: Para queries e RLS
- **backend-architect**: Para arquitetura dos serviços
- **frontend-developer**: Para integração React
- **performance-benchmarker**: Para otimização de queries

### **✅ Critérios de Aceite**
- Dashboard mostra dados reais baseados no role do usuário
- Métricas atualizadas automaticamente (cache 30s)
- Loading states funcionais durante carregamento
- Error handling adequado com fallback para dados mockados
- Feed de atividades atualizado em tempo real

### **⚠️ Riscos e Mitigações**
- **Risco**: Queries lentas no Supabase
- **Mitigação**: Implementar cache e otimizar queries com índices
- **Risco**: RLS mal configurado
- **Mitigação**: Testar com diferentes roles antes do deploy

### **🔗 Dependências**
- Supabase configurado e funcionando
- Serviços base (PropertyService, ContactService, etc.) operacionais
- RLS policies implementadas
- Sistema de autenticação funcionando

---

## 📊 **ETAPA 2: GRÁFICOS FUNCIONAIS**
**Duração:** 1-2 dias | **Prioridade:** 🟡 ALTA

### **🎯 Contexto**
Os gráficos atuais são apenas placeholders com texto. Precisam ser substituídos por componentes Recharts funcionais mostrando dados reais com filtros por período.

### **📋 Objetivos Específicos**
- [ ] Substituir placeholders por componentes Recharts
- [ ] Implementar gráfico de vendas mensais
- [ ] Implementar gráfico de propriedades por status
- [ ] Adicionar filtros por período (7 dias, 30 dias, 3 meses, 1 ano)
- [ ] Responsividade completa dos gráficos

### **🗂️ Tarefas Detalhadas**

#### **Task 2.1: Componente de Gráfico de Vendas**
```typescript
// src/components/dashboard/SalesChart.tsx
- LineChart para vendas ao longo do tempo
- Filtros por período
- Tooltips informativos
- Responsivo para mobile
```

#### **Task 2.2: Componente de Gráfico de Propriedades**
```typescript
// src/components/dashboard/PropertiesChart.tsx
- PieChart para distribuição por status
- BarChart para propriedades por tipo
- Animações suaves
- Cores temáticas do sistema
```

#### **Task 2.3: Sistema de Filtros Temporais**
```typescript
// src/components/dashboard/PeriodFilter.tsx
- Seletor de período (7d, 30d, 3m, 1a)
- Estado global compartilhado
- Atualização automática dos gráficos
```

### **📁 Arquivos a Criar/Modificar**
- `src/components/dashboard/SalesChart.tsx` (CRIAR)
- `src/components/dashboard/PropertiesChart.tsx` (CRIAR)
- `src/components/dashboard/PeriodFilter.tsx` (CRIAR)
- `src/hooks/useChartData.ts` (CRIAR)
- `src/pages/Dashboard.tsx` (MODIFICAR)

### **🤖 MCPs e Agents a Utilizar**
- **Context7**: Para documentação do Recharts
- **frontend-developer**: Para componentes React
- **ui-designer**: Para design dos gráficos

### **✅ Critérios de Aceite**
- Gráficos mostram dados reais do Supabase
- Filtros por período funcionais
- Responsividade em mobile/tablet/desktop
- Animações suaves e performance adequada
- Tooltips informativos e interativos

---

## ⚙️ **ETAPA 3: FUNCIONALIDADES PENDENTES**
**Duração:** 2-3 dias | **Prioridade:** 🟡 ALTA

### **🎯 Contexto**
Várias funcionalidades do Dashboard estão visualmente implementadas mas não funcionais: busca global, notificações, ações rápidas e filtros personalizados.

### **📋 Objetivos Específicos**
- [ ] Implementar busca global funcional
- [ ] Sistema de notificações em tempo real
- [ ] Ações rápidas operacionais
- [ ] Filtros avançados e personalização
- [ ] Export de dados do Dashboard

### **🗂️ Tarefas Detalhadas**

#### **Task 3.1: Busca Global**
```typescript
// src/components/shared/GlobalSearch.tsx
- Busca em propriedades, contatos, agendamentos
- Autocomplete com resultados dinâmicos
- Navegação direta para resultados
- Histórico de buscas
```

#### **Task 3.2: Sistema de Notificações**
```typescript
// src/components/notifications/NotificationSystem.tsx
- Notificações real-time via WebSockets
- Toast notifications para ações
- Centro de notificações no header
- Marcação como lida/não lida
```

#### **Task 3.3: Ações Rápidas Funcionais**
```typescript
// Implementar navegação e funcionalidades:
- "Nova Propriedade" → Formulário de cadastro
- "Agendar Visita" → Modal de agendamento
- "Novo Cliente" → Formulário de contato
- "Gerar Relatório" → Modal de relatórios
```

#### **Task 3.4: Filtros e Personalização**
```typescript
// src/components/dashboard/DashboardFilters.tsx
- Filtros por período personalizado
- Filtros por tipo de propriedade
- Filtros por status de cliente
- Salvamento de preferências do usuário
```

### **📁 Arquivos a Criar/Modificar**
- `src/components/shared/GlobalSearch.tsx` (CRIAR)
- `src/components/notifications/NotificationSystem.tsx` (CRIAR)
- `src/components/dashboard/QuickActions.tsx` (CRIAR)
- `src/components/dashboard/DashboardFilters.tsx` (CRIAR)
- `src/hooks/useNotifications.ts` (CRIAR)
- `src/pages/Dashboard.tsx` (MODIFICAR)

### **🤖 MCPs e Agents a Utilizar**
- **frontend-developer**: Para componentes complexos
- **backend-architect**: Para WebSockets e notificações
- **ui-designer**: Para UX das funcionalidades

### **✅ Critérios de Aceite**
- Busca global funciona com resultados precisos
- Notificações aparecem em tempo real
- Todas as ações rápidas navegam corretamente
- Filtros aplicam-se instantaneamente
- Preferências são salvas e persistidas

---

## 🚀 **ETAPA 4: UX E PERFORMANCE**
**Duração:** 1-2 dias | **Prioridade:** 🟠 MÉDIA

### **🎯 Contexto**
Melhorar a experiência do usuário com loading states adequados, error handling robusto e otimizações de performance para garantir uma experiência fluida.

### **📋 Objetivos Específicos**
- [ ] Loading skeletons para todos os componentes
- [ ] Error boundaries com recovery actions
- [ ] Otimizações de re-render (memo/useCallback)
- [ ] Lazy loading de componentes pesados
- [ ] Prefetch inteligente de dados

### **🗂️ Tarefas Detalhadas**

#### **Task 4.1: Loading States Avançados**
```typescript
// src/components/shared/LoadingSkeletons.tsx
- Skeleton para cards de métricas
- Skeleton para gráficos
- Skeleton para feed de atividades
- Estados de loading contextuais
```

#### **Task 4.2: Error Handling Robusto**
```typescript
// src/components/shared/ErrorBoundary.tsx
- Classificação automática de erros
- Recovery strategies por tipo
- Fallback UI específicos
- Logging automático de erros
```

#### **Task 4.3: Otimizações de Performance**
```typescript
// Implementar:
- React.memo em componentes pesados
- useCallback para funções
- useMemo para cálculos complexos
- Lazy loading com React.lazy
```

### **📁 Arquivos a Criar/Modificar**
- `src/components/shared/LoadingSkeletons.tsx` (CRIAR)
- `src/components/shared/ErrorBoundary.tsx` (CRIAR)
- `src/hooks/usePerformanceOptimization.ts` (CRIAR)
- Todos os componentes do Dashboard (MODIFICAR)

### **🤖 MCPs e Agents a Utilizar**
- **performance-benchmarker**: Para otimizações
- **frontend-developer**: Para implementação UX
- **test-writer-fixer**: Para validar melhorias

### **✅ Critérios de Aceite**
- Loading states em todos os componentes
- Zero quebras por erros não tratados
- Tempo de carregamento < 2s
- Re-renders desnecessários eliminados
- UX consistente em cenários de erro

---

## 🧪 **ETAPA 5: TESTES E VALIDAÇÃO**
**Duração:** 1-2 dias | **Prioridade:** 🟢 IMPORTANTE

### **🎯 Contexto**
Implementar cobertura completa de testes para garantir qualidade e confiabilidade do Dashboard, incluindo testes unitários, de integração e responsividade.

### **📋 Objetivos Específicos**
- [ ] Testes unitários para todos os componentes
- [ ] Testes de integração com Supabase
- [ ] Testes de responsividade
- [ ] Testes por diferentes roles de usuário
- [ ] Testes de performance

### **🗂️ Tarefas Detalhadas**

#### **Task 5.1: Testes Unitários**
```typescript
// src/tests/Dashboard.test.tsx
- Renderização de componentes
- Interações do usuário
- Estados de loading/error
- Funções de callback
```

#### **Task 5.2: Testes de Integração**
```typescript
// src/tests/integration/Dashboard.integration.test.tsx
- Fluxo completo de carregamento
- Integração com hooks de dados
- Personalização por role
- Cache e atualizações
```

#### **Task 5.3: Testes de Responsividade**
```typescript
// Validar comportamento em:
- Mobile (< 768px)
- Tablet (768px - 1024px)  
- Desktop (> 1024px)
- Estados de hover/touch
```

### **📁 Arquivos a Criar/Modificar**
- `src/tests/Dashboard.test.tsx` (CRIAR)
- `src/tests/integration/Dashboard.integration.test.tsx` (CRIAR)
- `src/tests/hooks/useDashboard.test.ts` (CRIAR)
- `src/tests/components/DashboardCharts.test.tsx` (CRIAR)

### **🤖 MCPs e Agents a Utilizar**
- **test-writer-fixer**: Para criação e manutenção dos testes
- **performance-benchmarker**: Para testes de performance

### **✅ Critérios de Aceite**
- Cobertura de testes > 80%
- Todos os testes passando
- Responsividade validada em 3 breakpoints
- Performance validada (< 2s carregamento)
- Testes passam para todos os roles

---

## 📊 **MÉTRICAS DE SUCESSO**

| Métrica | Estado Atual | Meta | Como Medir |
|---------|-------------|------|------------|
| **Dados Reais** | 0% | 100% | Todas métricas do Supabase |
| **Funcionalidades** | 20% | 100% | Todas funções operacionais |
| **Testes** | 0% | 80% | Coverage report |
| **Performance** | N/A | < 2s | Lighthouse score |
| **UX** | Boa | Excelente | Feedback de usuários |

---

## 🎯 **RECURSOS NECESSÁRIOS**

### **MCPs Principais**
- **Sequential Thinking**: Estruturação de tarefas complexas
- **Supabase Integration**: Operações de banco de dados
- **Context7**: Documentação de bibliotecas (Recharts, React Query)
- **Semgrep Security**: Validação de código seguro

### **Agents Especializados**
- **frontend-developer**: Componentes React e integração
- **backend-architect**: APIs e integração Supabase  
- **ui-designer**: Design e UX dos componentes
- **performance-benchmarker**: Otimizações e performance
- **test-writer-fixer**: Testes automatizados

---

## 🔄 **PRÓXIMOS PASSOS**

1. **Validar plano com stakeholders** - Confirmar prioridades e timeline
2. **Iniciar Etapa 1** - Integração de dados reais (mais crítica)
3. **Setup de monitoramento** - Métricas de progresso em tempo real
4. **Preparar ambiente de testes** - Dados de teste e configurações
5. **Documentar processo** - Para aplicar a outros módulos

---

## 📝 **Observações Finais**

Este plano foca exclusivamente no **Módulo Dashboard** como piloto para o processo de refinamento. O sucesso desta implementação definirá os padrões e metodologias para os demais módulos do sistema.

**Tempo Total Estimado:** 7-10 dias  
**Risco:** Médio (dependências externas do Supabase)  
**Impacto:** Alto (Dashboard é entrada principal do sistema)

---

**Documento criado por:** Claude Code com Sequential Thinking MCP  
**Próxima atualização:** Após conclusão da Etapa 1  
**Status:** 📋 Pronto para implementação