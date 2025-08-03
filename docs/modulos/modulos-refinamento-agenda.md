# 🔧 Plano de Refinamento - MÓDULO AGENDA

**Data de Criação:** 03/08/2025  
**Status:** 📋 Documento de Planejamento  
**Módulo:** Agenda (Sistema de Agendamentos Inteligente)  
**Última Atualização:** 03/08/2025  

---

## 📋 **Visão Geral**

Este documento detalha o plano de ações de implementação, correção e desenvolvimento para tornar o **Módulo Agenda** **100% funcional**, com integração completa ao banco de dados, sincronização Google Calendar e automações N8N.

O módulo Agenda está em situação única: possui **70% do backend implementado** e **80% da UI completa**, mas apenas **30% de integração real**. O foco será conectar a infraestrutura existente aos dados reais.

---

## 🎯 **STATUS ATUAL E PROBLEMAS IDENTIFICADOS**

### **📊 Status Atual (Baseado na Auditoria)**

| Aspecto | Status Atual | Meta |
|---------|-------------|------|
| **Backend/Serviços** | 70% (estrutura criada) | 100% conectado |
| **UI/Componentes** | 80% (interface pronta) | 100% funcional |
| **Integração Real** | 30% (dados mockados) | 100% dados reais |
| **Google Calendar** | 60% (OAuth pronto) | 100% sincronizado |
| **N8N Integration** | 20% (dashboard criado) | 100% configurado |
| **Testes** | 0% | 80% cobertura |

### **🚨 Problemas Críticos Identificados**

1. **Interface usa dados 100% mockados** - Appointments não vêm do Supabase
2. **Ações não funcionais** - Botões apenas fazem console.log()
3. **Tabs importantes ocultas** - AgentAvailability e configurações inacessíveis
4. **Console.logs em produção** - 15+ ocorrências de debug logs
5. **Sincronização parcial** - Google Calendar conecta mas não sincroniza eventos
6. **N8N dashboard sem backend** - Interface existe mas não funciona
7. **Conflitos não tratados** - UI preparada mas lógica ausente

### **✅ Pontos Fortes Identificados**
- Arquitetura bem estruturada e modular
- Sistema de slots e disponibilidade robusto
- Schema do banco bem projetado
- Hooks e serviços bem organizados
- Integração Google Calendar 60% implementada

---

## 🗓️ **CRONOGRAMA DE REFINAMENTO - 6-10 DIAS**

| Etapa | Descrição | Duração | Prioridade |
|-------|-----------|---------|------------|
| **1** | Conectar Dados Reais | 2-3 dias | 🔴 CRÍTICA |
| **2** | Funcionalidades Principais | 2-3 dias | 🟡 ALTA |
| **3** | Integrações Avançadas | 1-2 dias | 🟠 MÉDIA |
| **4** | Testes e Validação | 1-2 dias | 🟢 IMPORTANTE |

---

## 🔧 **ETAPA 1: CONECTAR DADOS REAIS**
**Duração:** 2-3 dias | **Prioridade:** 🔴 CRÍTICA

### **🎯 Contexto**
A interface está 80% pronta mas usa dados mockados. Os serviços existem (70% implementados) mas não estão conectados à UI. Precisa substituir dados mockados por calls reais ao Supabase.

### **📋 Objetivos Específicos**
- [ ] Conectar appointments mockados ao Supabase real
- [ ] Implementar CRUD real usando hooks existentes
- [ ] Ativar sistema de slots de disponibilidade
- [ ] Implementar validação de conflitos de horário
- [ ] Remover userId mockado e usar auth real

### **🗂️ Tarefas Detalhadas**

#### **Task 1.1: Conectar Appointments ao Supabase**
```typescript
// src/pages/Agenda.tsx - Remover dados mockados
const mockAppointments = [...] // REMOVER ESTA LINHA

// Usar hook real:
const { appointments, isLoading, error } = useAppointments(user?.id);
```

#### **Task 1.2: Implementar CRUD Real de Appointments**
```typescript
// Conectar ações aos serviços existentes:
- createAppointment() → agendaService.createAppointment()
- updateAppointment() → agendaService.updateAppointment() 
- deleteAppointment() → agendaService.deleteAppointment()
- Remover todos os console.log() e implementar ações reais
```

#### **Task 1.3: Ativar Sistema de Slots**
```typescript
// src/hooks/useAgenda.ts
- Conectar useAvailabilitySlots() aos dados reais
- Implementar geração automática de slots
- Validar disponibilidade em tempo real
- Sistema de reserva de slots
```

#### **Task 1.4: Validação de Conflitos**
```typescript
// Implementar lógica de detecção de conflitos:
- Sobreposição de horários
- Duplo agendamento
- Limites de agendamentos por dia
- Validação de horário de trabalho
```

### **📁 Arquivos a Criar/Modificar**
- `src/pages/Agenda.tsx` - Conectar aos dados reais (MODIFICAR)
- `src/hooks/useAgenda.ts` - Ativar hooks reais (MODIFICAR)
- `src/services/agendaService.ts` - Completar implementação (MODIFICAR)
- `src/components/agenda/ConflictValidator.tsx` - Validação de conflitos (CRIAR)
- `src/utils/slotGenerator.ts` - Gerador de slots automático (CRIAR)

### **🤖 MCPs e Agents a Utilizar**
- **Supabase Integration MCP**: Para conectar aos dados reais
- **backend-architect**: Para validar integração dos serviços
- **frontend-developer**: Para conectar UI aos hooks
- **api-tester**: Para testar fluxos de CRUD

### **✅ Critérios de Aceite**
- Appointments carregados do Supabase em tempo real
- CRUD de appointments funcionando completamente
- Sistema de slots gerando disponibilidade automática
- Validação de conflitos impedindo agendamentos inválidos
- Zero console.log() em ações de produção

### **⚠️ Riscos e Mitigações**
- **Risco**: Hooks existentes não funcionarem como esperado
- **Mitigação**: Testar cada hook individualmente antes da integração
- **Risco**: Conflitos complexos não detectados
- **Mitigação**: Implementar validação em múltiplas camadas (frontend + backend)

### **🔗 Dependências**
- Supabase configurado com tabelas Appointment, AgentSchedule, AvailabilitySlot
- Sistema de autenticação funcionando (userId real)
- RLS policies implementadas para agenda

---

## ⚙️ **ETAPA 2: FUNCIONALIDADES PRINCIPAIS**
**Duração:** 2-3 dias | **Prioridade:** 🟡 ALTA

### **🎯 Contexto**
Várias funcionalidades estão implementadas mas ocultas ou não funcionais. Precisa tornar visíveis as tabs ocultas, implementar o booking wizard completo e sistema de notificações.

### **📋 Objetivos Específicos**
- [ ] Tornar visíveis tabs ocultas (AgentAvailability, NotificationSystem, etc.)
- [ ] Implementar booking wizard funcional completo
- [ ] Sistema de notificações real-time
- [ ] Configuração de disponibilidade de agentes
- [ ] Status de sincronização funcionais

### **🗂️ Tarefas Detalhadas**

#### **Task 2.1: Tabs Ocultas - Investigar e Corrigir**
```typescript
// src/pages/Agenda.tsx - Investigar por que tabs estão hidden
// Remover hidden={true} ou implementar lógica de visibilidade:
<TabsContent value="availability" className="hidden"> // REMOVER HIDDEN
<TabsContent value="notifications" className="hidden"> // REMOVER HIDDEN
<TabsContent value="sync" className="hidden"> // REMOVER HIDDEN
```

#### **Task 2.2: Booking Wizard Funcional**
```typescript
// src/components/agenda/BookingWizard.tsx
- Step 1: Seleção de tipo de agendamento (IMPLEMENTAR)
- Step 2: Seleção de data e horário disponível (IMPLEMENTAR)
- Step 3: Seleção de agente disponível (IMPLEMENTAR)
- Step 4: Confirmação e criação (IMPLEMENTAR)
- Integrar com slots de disponibilidade reais
```

#### **Task 2.3: Sistema de Notificações**
```typescript
// src/components/agenda/NotificationSystem.tsx
- Notificações de agendamentos criados
- Lembretes automáticos (24h, 1h antes)
- Notificações de cancelamentos
- Status de confirmação de clientes
```

#### **Task 2.4: Configuração de Disponibilidade**
```typescript
// src/components/agenda/AgentAvailability.tsx
- Interface para configurar horários de trabalho
- Bloqueio de horários específicos
- Configuração de buffer time
- Limite de agendamentos por dia
```

### **📁 Arquivos a Criar/Modificar**
- `src/pages/Agenda.tsx` - Tornar tabs visíveis (MODIFICAR)
- `src/components/agenda/BookingWizard.tsx` - Implementar passos (MODIFICAR)
- `src/components/agenda/NotificationSystem.tsx` - Sistema real (CRIAR)
- `src/components/agenda/AgentAvailability.tsx` - Interface completa (MODIFICAR)
- `src/hooks/useNotifications.ts` - Hook de notificações (CRIAR)

### **🤖 MCPs e Agents a Utilizar**
- **frontend-developer**: Para componentes de UI complexos
- **ui-designer**: Para melhor UX do booking wizard
- **backend-architect**: Para sistema de notificações

### **✅ Critérios de Aceite**
- Todas as tabs principais visíveis e funcionais
- Booking wizard completo com 4 passos funcionais
- Notificações enviadas automaticamente
- Configuração de disponibilidade salva e aplicada
- UI consistente e intuitiva

---

## 🔗 **ETAPA 3: INTEGRAÇÕES AVANÇADAS**
**Duração:** 1-2 dias | **Prioridade:** 🟠 MÉDIA

### **🎯 Contexto**
Completar integrações com Google Calendar (60% pronta) e configurar N8N dashboard (20% pronto) para automações avançadas.

### **📋 Objetivos Específicos**
- [ ] Completar sincronização bidirecional Google Calendar
- [ ] Configurar N8N backend e workflows
- [ ] Sistema de webhooks funcionais
- [ ] Automações de lembretes e follow-ups
- [ ] Logs de sincronização detalhados

### **🗂️ Tarefas Detalhadas**

#### **Task 3.1: Google Calendar Sincronização Completa**
```typescript
// src/services/googleCalendarService.ts
- Sincronização bidirecional (ImobiPRO ↔ Google)
- Webhooks para push notifications
- Atualização automática de eventos
- Tratamento de conflitos entre sistemas
```

#### **Task 3.2: N8N Backend Configuration**
```typescript
// Configurar workflows N8N:
- Webhook para novos agendamentos
- Automação de lembretes via WhatsApp/Email
- Integração com Google Calendar via N8N
- Dashboard de monitoramento funcionais
```

#### **Task 3.3: Sistema de Webhooks**
```typescript
// src/services/webhookService.ts
- Receber webhooks do Google Calendar
- Processar updates de eventos
- Sincronizar mudanças automaticamente
- Log de todas as operações
```

#### **Task 3.4: Logs e Monitoramento**
```typescript
// src/components/agenda/SyncStatus.tsx
- Status em tempo real de sincronizações
- Histórico de operações
- Alertas de falhas
- Métricas de performance
```

### **📁 Arquivos a Criar/Modificar**
- `src/services/googleCalendarService.ts` - Sincronização completa (MODIFICAR)
- `src/services/webhookService.ts` - Sistema de webhooks (CRIAR)
- `src/components/agenda/N8nDashboard.tsx` - Backend real (MODIFICAR)
- `src/components/agenda/SyncStatus.tsx` - Logs detalhados (MODIFICAR)
- `src/hooks/useGoogleCalendar.ts` - Hooks completos (MODIFICAR)

### **🤖 MCPs e Agents a Utilizar**
- **Context7**: Para documentação Google Calendar API
- **api-tester**: Para testar webhooks e integrações
- **backend-architect**: Para arquitetura de sincronização

### **✅ Critérios de Aceite**
- Sincronização bidirecional Google Calendar funcionando
- N8N workflows executando automações
- Webhooks recebendo e processando eventos
- Dashboard de monitoramento com métricas reais
- Logs detalhados de todas as operações

---

## 🧪 **ETAPA 4: TESTES E VALIDAÇÃO**
**Duração:** 1-2 dias | **Prioridade:** 🟢 IMPORTANTE

### **🎯 Contexto**
Implementar cobertura completa de testes (atualmente 0%) para garantir qualidade e confiabilidade do sistema de agenda, incluindo cenários complexos de sincronização e conflitos.

### **📋 Objetivos Específicos**
- [ ] Testes unitários para todos os componentes
- [ ] Testes de integração com Supabase e Google Calendar
- [ ] Testes de validação de conflitos
- [ ] Testes de automações N8N
- [ ] Testes de performance com múltiplos agendamentos

### **🗂️ Tarefas Detalhadas**

#### **Task 4.1: Testes Unitários Core**
```typescript
// src/tests/agenda/
- BookingWizard.test.tsx - Fluxo de agendamento completo
- AgentAvailability.test.tsx - Configuração de disponibilidade
- ConflictValidator.test.tsx - Validação de conflitos
- SlotGenerator.test.tsx - Geração de slots
```

#### **Task 4.2: Testes de Integração**
```typescript
// src/tests/integration/agenda/
- GoogleCalendarSync.integration.test.tsx
- SupabaseAppointments.integration.test.tsx  
- N8nWebhooks.integration.test.tsx
- ConflictDetection.integration.test.tsx
```

#### **Task 4.3: Testes de Cenários Complexos**
```typescript
// Cenários específicos da agenda:
- Múltiplos agendamentos simultâneos
- Sincronização durante conflitos
- Falhas de rede durante operações
- Recuperação de dados offline
```

#### **Task 4.4: Testes de Performance**
```typescript
// Validar performance com:
- 100+ agendamentos por agente
- Sincronização de calendários grandes
- Geração de slots para múltiplos agentes
- Webhooks em alta frequência
```

### **📁 Arquivos a Criar/Modificar**
- `src/tests/agenda/BookingWizard.test.tsx` (CRIAR)
- `src/tests/agenda/AgentAvailability.test.tsx` (CRIAR)
- `src/tests/integration/agenda/GoogleCalendarSync.test.tsx` (CRIAR)
- `src/tests/integration/agenda/ConflictDetection.test.tsx` (CRIAR)
- `src/tests/utils/agendaTestHelpers.ts` - Helpers de testes (CRIAR)

### **🤖 MCPs e Agents a Utilizar**
- **test-writer-fixer**: Para criação e manutenção dos testes
- **api-tester**: Para testes de integração externa
- **performance-benchmarker**: Para testes de performance

### **✅ Critérios de Aceite**
- Cobertura de testes > 80%
- Todos os cenários críticos testados
- Testes de integração com Google Calendar passando
- Validação de conflitos funcionando em todos os casos
- Performance adequada com alta carga de dados

---

## 📊 **MÉTRICAS DE SUCESSO**

| Métrica | Estado Atual | Meta | Como Medir |
|---------|-------------|------|------------|
| **Integração Real** | 30% | 100% | Dados do Supabase |
| **Funcionalidades** | 40% | 100% | Todas funcions operacionais |
| **Google Calendar** | 60% | 100% | Sincronização bidirecional |
| **N8N Integration** | 20% | 100% | Automações funcionando |
| **Testes** | 0% | 80% | Coverage report |
| **Performance** | N/A | < 3s | Lighthouse + carga |

---

## 🎯 **RECURSOS NECESSÁRIOS**

### **MCPs Principais**
- **Sequential Thinking**: Estruturação de tarefas complexas de integração
- **Supabase Integration**: Operações de banco e RLS
- **Context7**: Documentação Google Calendar API, date-fns, N8N
- **Semgrep Security**: Validação de código das integrações

### **Agents Especializados**
- **backend-architect**: APIs, integrações e sincronização
- **frontend-developer**: Conectar UI aos dados reais  
- **api-tester**: Testes de integrações externas (Google, N8N)
- **ui-designer**: UX do booking wizard e disponibilidade
- **test-writer-fixer**: Testes automatizados completos

---

## 🔄 **PRÓXIMOS PASSOS**

1. **Investigar tabs ocultas** - Entender por que estão hidden
2. **Testar hooks existentes** - Validar funcionamento dos serviços
3. **Configurar ambiente N8N** - Setup de workflows
4. **Preparar dados de teste** - Agendamentos, slots, conflitos
5. **Validar Google Calendar OAuth** - Confirmar tokens funcionais

---

## 📝 **Observações Finais**

O **Módulo Agenda** tem vantagem significativa sobre outros módulos: já possui infraestrutura robusta (70% backend, 80% UI). O trabalho será principalmente de **integração e ativação** das funcionalidades existentes.

**Diferencial Técnico:**
- Sistema de slots sofisticado já implementado
- OAuth Google Calendar funcional  
- Schema de banco bem estruturado
- Hooks e serviços organizados

**Tempo Total Estimado:** 6-10 dias  
**Risco:** Baixo-Médio (infraestrutura já existe)  
**Impacto:** Alto (sistema crítico para operação)  
**Complexidade:** Média (foco em integração)

---

**Documento criado por:** Claude Code com Sequential Thinking MCP  
**Próxima atualização:** Após conclusão da Etapa 1  
**Status:** 📋 Pronto para implementação