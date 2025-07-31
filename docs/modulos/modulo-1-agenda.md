# 📅 MÓDULO 1: AGENDA (N8N-FIRST ARCHITECTURE)

## 🎯 Visão Geral - Revolução na Automação Imobiliária

O módulo de agenda do ImobiPRO representa uma **revolução tecnológica** no setor imobiliário brasileiro, sendo o primeiro CRM 100% integrado com n8n para automação inteligente de agendamentos. Com sincronização bidirecional em tempo real com Google Calendar e interface mobile-first, oferece uma experiência sem precedentes tanto para corretores quanto para clientes.

## 🚀 Diferenciais Competitivos

- **Automação 100% n8n**: Primeiro CRM imobiliário totalmente integrado com n8n
- **Sync Bidirecional Real-time**: Google Calendar sincronizado instantaneamente  
- **AI-Powered Scheduling**: Sugestões inteligentes baseadas em padrões de comportamento
- **Conflict-Free Architecture**: Sistema à prova de double-booking
- **Mobile-First UX**: Interface moderna e responsiva otimizada para dispositivos móveis
- **Zero-Touch Booking**: Agendamentos automáticos via WhatsApp sem intervenção humana

## 🏗️ Database Schema

Ver arquivo dedicado: `docs/database-schema.md` - Seção: Módulo 1 - Agenda

## 🔌 Integrações Avançadas

### 1. Google Calendar API - Sincronização Bidirecional

**Funcionalidades Principais:**
- **OAuth 2.0 seguro** com refresh automático de tokens
- **Webhook notifications** para mudanças em tempo real
- **Conflict resolution** inteligente com 4 estratégias
- **Multi-calendar support** por usuário
- **Batch operations** para alta performance

**Fluxos de Sincronização:**
```typescript
// Fluxo de criação de agendamento
ImobiPRO → Google Calendar → Webhook → n8n → Notificações

// Fluxo de edição externa
Google Calendar → Webhook → Conflict Detection → Resolution → ImobiPRO

// Fluxo de automação
n8n Trigger → ImobiPRO API → Google Calendar → Confirmação
```

### 2. n8n Workflows - Automação Inteligente

**27 Endpoints REST** organizados em categorias:
- **Webhook Handlers** (5 endpoints) - Recebimento de dados externos
- **Trigger Events** (6 endpoints) - Disparos para workflows
- **Data Management** (8 endpoints) - CRUD de agendamentos
- **Monitoring** (4 endpoints) - Métricas e saúde do sistema  
- **Configuration** (4 endpoints) - Configurações de workflows

**Workflows Pré-configurados:**
1. **Agendamento via WhatsApp** - Processamento de linguagem natural
2. **Lembretes Inteligentes** - 24h, 1h e confirmação
3. **Follow-up Automático** - Pós-visita e nutrição de leads
4. **Resolução de Conflitos** - IA para resolução automática
5. **Otimização de Rotas** - Agendamentos geograficamente otimizados

## 🎨 Interface Moderna Mobile-First

### Componentes React + TypeScript:

**CalendarView** - Calendário responsivo principal
```typescript
interface CalendarViewProps {
  view: 'month' | 'week' | 'day';
  agents: Agent[];
  onAppointmentCreate: (data: AppointmentData) => void;
  onSlotSelect: (slot: AvailabilitySlot) => void;
  realTimeUpdates: boolean;
}
```

**AgentAvailability** - Gestão de disponibilidade
```typescript
interface AgentAvailabilityProps {
  agentId: string;
  workingHours: WorkingHours;
  onUpdate: (hours: WorkingHours) => void;
  syncWithGoogle: boolean;
}
```

**BookingWizard** - Fluxo de criação guiado
```typescript
interface BookingWizardProps {
  initialData?: Partial<AppointmentData>;
  availableSlots: AvailabilitySlot[];
  onComplete: (appointment: Appointment) => void;
  conflictDetection: boolean;
}
```

### Design System:
- **Cores ImobiPRO**: `imobipro-blue` e `imobipro-gray` 
- **Tema Dark**: Consistente com o projeto
- **shadcn/ui**: Componentes modernos e acessíveis
- **Tailwind CSS**: Responsividade e performance
- **Micro-interações**: Feedback visual imediato

## 🔐 Segurança e Confiabilidade

### Autenticação & Autorização:
- **JWT tokens** com refresh automático
- **Row Level Security (RLS)** no Supabase
- **API rate limiting** inteligente
- **Webhook signature validation** (HMAC-SHA256)

### Proteção de Dados:
- **Criptografia AES-256-GCM** para tokens OAuth
- **Compliance LGPD** com auditoria completa
- **Backup automático** de dados críticos
- **Logs estruturados** para investigação forense

### Resiliência:
- **Circuit breaker** para APIs externas
- **Retry mechanisms** com backoff exponencial
- **Dead letter queue** para falhas críticas
- **Health checks** automáticos

## 📊 Métricas e Monitoramento

### KPIs Técnicos:
- **Sync Latency**: < 2 segundos para Google Calendar
- **API Response**: < 500ms para operações críticas
- **Uptime**: 99.9% de disponibilidade
- **Conflict Rate**: < 1% de conflitos de agendamento

### KPIs de Negócio:
- **Booking Conversion**: +40% na conversão de agendamentos
- **Agent Efficiency**: +30% na utilização de tempo
- **Customer Satisfaction**: +25% na experiência de agendamento
- **Automation Rate**: 80% dos agendamentos via automação

## 🚀 Plano de Implementação Estratégico

### ✅ FASE 1: Fundação (CONCLUÍDA - 100%)
1. **✅ Database Migration**: ✅ Novos modelos Prisma implementados
   - 15 novos modelos adicionados ao schema.prisma
   - 12 enums criados para tipagem
   - Relacionamentos complexos configurados
   - Índices otimizados para performance

2. **✅ Basic API Endpoints**: ✅ CRUD para AgentSchedule e AvailabilitySlot
   - `src/services/agendaService.ts` - 20+ funções CRUD
   - `src/hooks/useAgenda.ts` - 15+ React Query hooks
   - Validação completa com Zod schemas
   - Cache inteligente com invalidação automática

3. **✅ n8n Setup**: ✅ Configurar instância n8n e workflows básicos
   - `src/services/n8nService.ts` - Cliente API completo
   - `src/hooks/useN8n.ts` - Hooks para gerenciamento
   - 5 workflows templates pré-configurados
   - Sistema de monitoramento e health checks

4. **✅ Google Calendar OAuth**: ✅ Implementar autenticação e tokens
   - `src/services/googleCalendarService.ts` - Serviço completo
   - `src/hooks/useGoogleCalendar.ts` - 15+ hooks especializados  
   - `src/pages/GoogleCalendarCallback.tsx` - Página callback OAuth
   - `src/components/agenda/GoogleCalendarIntegration.tsx` - UI completa
   - Rota `/auth/google/callback` configurada
   - Refresh automático de tokens implementado

### 🔄 FASE 2: Core Features (EM PROGRESSO - 25%)
1. **🔄 Calendar UI Moderna**: Interface principal em desenvolvimento
   - Componentes base criados (CalendarView, BookingWizard)
   - Integração Google Calendar funcional
   - Falta: Sincronização em tempo real

2. **⚠️ Availability Settings**: Interface básica implementada
   - AgendaTest.tsx para demonstração
   - Configuração de horários funcional
   - Falta: Validações avançadas e bulk operations

3. **⚠️ Smart Booking Flow**: Estrutura criada
   - BookingWizard implementado
   - Detecção de conflitos básica
   - Falta: IA para sugestões inteligentes

4. **❌ Real-time Sync**: Não iniciado
   - Webhooks estruturados (falta implementação server-side)
   - WebSockets não implementados
   - Sincronização bidirecional parcial

### ❌ FASE 3: Automação Avançada (NÃO INICIADA)
1. **❌ n8n Workflows**: Templates criados, implementação pendente
2. **❌ Conflict Resolution**: Estrutura no banco, lógica pendente
3. **❌ AI Suggestions**: Não iniciado
4. **❌ Performance Optimization**: Básico implementado

### ❌ FASE 4: Produção (NÃO INICIADA)
1. **❌ Testing**: Estrutura básica
2. **❌ Security Audit**: Não iniciado
3. **❌ Monitoring**: Básico implementado
4. **✅ Documentation**: Completa e atualizada

## 💰 ROI Esperado

- **Redução 70%** no tempo gasto com agendamentos manuais
- **Aumento 50%** na conversão de leads em agendamentos
- **Eliminação 95%** de conflitos de horário
- **Melhoria 60%** na experiência do cliente
- **Automação 80%** das tarefas repetitivas

## 🏆 Conclusão Estratégica

A nova arquitetura n8n-first para o módulo de agenda representa uma **evolução radical** do sistema atual, transformando-o de um calendário básico em uma **plataforma de automação inteligente**. 

Esta implementação posiciona o ImobiPRO como **líder tecnológico** no setor imobiliário brasileiro, oferecendo um nível de automação e integração que nenhum concorrente possui atualmente.

---

## 📡 ENDPOINTS E WEBHOOKS DETALHADOS

### 🏗️ Arquivos de Implementação em Produção

Para implementar os endpoints server-side em produção, os seguintes arquivos devem ser criados:

#### 📁 Estrutura de Diretórios Sugerida:
```
api/
├── agenda/
│   ├── agent-schedule/
│   │   ├── [id].ts            # GET/PUT/DELETE /api/agenda/agent-schedule/[id]
│   │   └── index.ts           # GET/POST /api/agenda/agent-schedule
│   ├── availability-slots/
│   │   ├── [id].ts            # GET/PUT/DELETE /api/agenda/availability-slots/[id]
│   │   ├── generate.ts        # POST /api/agenda/availability-slots/generate
│   │   └── index.ts           # GET/POST /api/agenda/availability-slots
│   ├── sync/
│   │   ├── google-calendar.ts # POST /api/agenda/sync/google-calendar
│   │   └── status.ts          # GET /api/agenda/sync/status
│   └── conflicts/
│       ├── resolve.ts         # POST /api/agenda/conflicts/resolve
│       └── index.ts           # GET /api/agenda/conflicts
├── webhooks/
│   ├── n8n/
│   │   ├── appointment/
│   │   │   ├── created.ts     # POST /api/webhooks/n8n/appointment/created
│   │   │   ├── updated.ts     # POST /api/webhooks/n8n/appointment/updated
│   │   │   └── cancelled.ts   # POST /api/webhooks/n8n/appointment/cancelled
│   │   ├── calendar/
│   │   │   └── event.ts       # POST /api/webhooks/n8n/calendar/event
│   │   └── whatsapp/
│   │       └── message.ts     # POST /api/webhooks/n8n/whatsapp/message
│   ├── google-calendar/
│   │   └── notifications.ts   # POST /api/webhooks/google-calendar/notifications
│   └── health.ts              # GET /api/webhooks/health
└── n8n/
    ├── workflows/
    │   ├── execute.ts          # POST /api/n8n/workflows/execute
    │   ├── status.ts           # GET /api/n8n/workflows/status
    │   └── index.ts            # GET /api/n8n/workflows
    └── health.ts               # GET /api/n8n/health
```

### 🔌 Endpoints CRUD - AgentSchedule

#### 1. GET /api/agenda/agent-schedule/[id]
**Arquivo:** `api/agenda/agent-schedule/[id].ts`
```typescript
// Buscar agenda específica de um corretor
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (req.method === 'GET') {
    // Implementar busca no banco via Prisma
    // Verificar permissões (RLS)
    // Retornar agenda com workingHours
  }
  
  if (req.method === 'PUT') {
    // Atualizar agenda
    // Validar dados com Zod
    // Triggerar webhook n8n se configurado
  }
  
  if (req.method === 'DELETE') {
    // Soft delete da agenda
    // Cancelar agendamentos futuros
    // Notificar integrações
  }
}
```

#### 2. POST /api/agenda/agent-schedule
**Arquivo:** `api/agenda/agent-schedule/index.ts`
```typescript
// Listar agendas e criar novas
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Listar agendas com filtros
    // Paginação
    // Suporte a query params (?agentId=, ?active=)
  }
  
  if (req.method === 'POST') {
    // Criar nova agenda
    // Validar workingHours
    // Auto-gerar slots iniciais
    // Triggerar workflow n8n
  }
}
```

### 🔌 Endpoints CRUD - AvailabilitySlot

#### 3. GET /api/agenda/availability-slots
**Arquivo:** `api/agenda/availability-slots/index.ts`
```typescript
// Listar e filtrar slots de disponibilidade
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { agentId, date, status, timeMin, timeMax } = req.query;
    
    // Implementar filtros complexos:
    // - Por corretor (agentId)
    // - Por data específica ou range
    // - Por status (AVAILABLE, BOOKED, etc.)
    // - Ordenação por startTime
    // - Paginação para performance
    
    // Query Prisma otimizada com índices
    // Retornar com metadados de paginação
  }
  
  if (req.method === 'POST') {
    // Criar slot manual
    // Validar não-conflito
    // Sync com Google Calendar se ativo
  }
}
```

#### 4. POST /api/agenda/availability-slots/generate
**Arquivo:** `api/agenda/availability-slots/generate.ts`
```typescript
// Gerar slots automaticamente baseado na agenda do corretor
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { agentId, dateRange, duration, bufferTime } = req.body;
    
    // 1. Buscar AgentSchedule do corretor
    // 2. Calcular slots baseado em workingHours
    // 3. Verificar conflitos com appointments existentes
    // 4. Considerar buffer time entre slots
    // 5. Criar slots em lote (batch insert)
    // 6. Sync com Google Calendar
    // 7. Triggerar n8n workflow se configurado
    
    // Retornar quantidade de slots criados
  }
}
```

### 🔌 Endpoints de Sincronização

#### 5. POST /api/agenda/sync/google-calendar
**Arquivo:** `api/agenda/sync/google-calendar.ts`
```typescript
// Sincronização manual com Google Calendar
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userId, direction, calendarId } = req.body;
    
    // 1. Verificar credenciais Google válidas
    // 2. Buscar eventos no período configurado
    // 3. Comparar com appointments locais
    // 4. Detectar conflitos
    // 5. Aplicar estratégia de resolução
    // 6. Criar/atualizar appointments
    // 7. Log de sincronização
    // 8. Notificar n8n dos changes
    
    // Retornar estatísticas da sync
  }
}
```

#### 6. GET /api/agenda/sync/status
**Arquivo:** `api/agenda/sync/status.ts`
```typescript
// Status de sincronização por usuário/corretor
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  
  // Buscar último CalendarSyncLog
  // Status de credenciais Google
  // Próxima sincronização agendada
  // Estatísticas de conflitos
  // Health check das integrações
}
```

### 🔌 Webhooks n8n (Recebimento)

#### 7. POST /api/webhooks/n8n/appointment/created
**Arquivo:** `api/webhooks/n8n/appointment/created.ts`
```typescript
// Webhook quando appointment é criado via n8n
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Validar signature HMAC-SHA256
  const signature = req.headers['x-n8n-signature'];
  const isValid = validateWebhookSignature(
    JSON.stringify(req.body), 
    signature, 
    process.env.N8N_WEBHOOK_SECRET
  );
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // 2. Processar dados do appointment
  const appointmentData = req.body;
  
  // 3. Criar appointment no banco
  // 4. Reservar availability slot
  // 5. Sync com Google Calendar
  // 6. Enviar notificações
  // 7. Log da operação
  
  res.status(200).json({ 
    success: true, 
    appointmentId: result.id,
    message: 'Appointment created successfully'
  });
}
```

#### 8. POST /api/webhooks/n8n/appointment/updated
**Arquivo:** `api/webhooks/n8n/appointment/updated.ts`
```typescript
// Webhook quando appointment é atualizado via n8n
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Similar ao created, mas:
  // 1. Validar que appointment existe
  // 2. Detectar mudanças (diff)
  // 3. Resolver conflitos se necessário
  // 4. Atualizar slots de disponibilidade
  // 5. Re-sync com Google Calendar
  // 6. Notificar partes envolvidas
}
```

#### 9. POST /api/webhooks/n8n/appointment/cancelled
**Arquivo:** `api/webhooks/n8n/appointment/cancelled.ts`
```typescript
// Webhook quando appointment é cancelado via n8n
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Atualizar status para CANCELLED
  // 2. Liberar availability slot
  // 3. Cancelar no Google Calendar
  // 4. Notificar cliente e corretor
  // 5. Triggerar workflow de follow-up
  // 6. Logs de auditoria
}
```

### 🔌 Webhooks Google Calendar (Recebimento)

#### 10. POST /api/webhooks/google-calendar/notifications
**Arquivo:** `api/webhooks/google-calendar/notifications.ts`
```typescript
// Webhook do Google Calendar (Push Notifications)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Headers importantes do Google:
  const channelId = req.headers['x-goog-channel-id'];
  const resourceState = req.headers['x-goog-resource-state']; // sync, exists, not_exists
  const resourceId = req.headers['x-goog-resource-id'];
  
  if (resourceState === 'sync') {
    // Primeiro webhook de confirmação
    return res.status(200).json({ success: true });
  }
  
  // 1. Identificar usuário pelo channelId
  // 2. Buscar eventos modificados no Google Calendar
  // 3. Comparar com appointments locais
  // 4. Detectar e resolver conflitos
  // 5. Atualizar banco de dados
  // 6. Triggerar workflows n8n apropriados
  // 7. Notificar usuário se necessário
  
  res.status(200).json({ success: true });
}
```

### 🔌 Endpoints n8n (Envio)

#### 11. POST /api/n8n/workflows/execute
**Arquivo:** `api/n8n/workflows/execute.ts`
```typescript
// Executar workflow específico no n8n
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { workflowId, inputData, userId } = req.body;
  
  // 1. Validar permissões do usuário
  // 2. Verificar se workflow existe e está ativo
  // 3. Preparar dados de entrada
  // 4. Fazer chamada para n8n API
  // 5. Log da execução
  // 6. Retornar ID da execução
  
  const n8nResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${workflowId}/execute`, {
    method: 'POST',
    headers: {
      'X-N8N-API-KEY': process.env.N8N_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(inputData)
  });
}
```

### 🔌 Webhooks n8n (Envio)

Estes são os endpoints que **enviam** dados para n8n quando eventos acontecem no ImobiPRO:

#### 12. Trigger: Appointment Created (ImobiPRO → n8n)
**Implementação:** Em `agendaService.ts` ou similar
```typescript
// Quando appointment é criado no ImobiPRO
async function createAppointment(appointmentData) {
  // 1. Criar appointment no banco
  const appointment = await prisma.appointment.create(...);
  
  // 2. Triggerar webhook n8n
  if (appointment.source !== 'N8N_AUTOMATION') {
    await triggerN8nWebhook('appointment.created', {
      appointmentId: appointment.id,
      agentId: appointment.agentId,
      contactId: appointment.contactId,
      scheduledFor: appointment.scheduledFor,
      type: appointment.type,
      metadata: {
        source: 'imobipro',
        trigger: 'appointment.created'
      }
    });
  }
  
  return appointment;
}
```

### 🔒 Segurança dos Webhooks

#### Validação HMAC-SHA256:
```typescript
// Função para validar assinatura dos webhooks
function validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === `sha256=${expectedSignature}`;
}
```

### 📊 Monitoramento e Logs

#### 13. GET /api/webhooks/health
**Arquivo:** `api/webhooks/health.ts`
```typescript
// Health check de todos os webhooks
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const checks = {
    n8n: await checkN8nConnectivity(),
    googleCalendar: await checkGoogleCalendarWebhooks(),
    database: await checkDatabaseConnection(),
    timestamp: new Date().toISOString()
  };
  
  const allHealthy = Object.values(checks).every(check => 
    typeof check === 'boolean' ? check : check.status === 'healthy'
  );
  
  res.status(allHealthy ? 200 : 503).json(checks);
}
```

### ⚡ Implementação Recomendada

Para implementar em produção, siga esta ordem:

1. **SEMANA 1**: Endpoints CRUD básicos (AgentSchedule, AvailabilitySlot)
2. **SEMANA 2**: Webhooks n8n (created, updated, cancelled)
3. **SEMANA 3**: Google Calendar webhooks e sincronização
4. **SEMANA 4**: Monitoramento, logs e health checks
5. **SEMANA 5**: Testes de integração e otimização

### 🧪 Como Testar

#### Teste Local:
```bash
# Testar endpoint de criação de agenda
curl -X POST http://localhost:3000/api/agenda/agent-schedule \
  -H "Content-Type: application/json" \
  -d '{"agentId": "user-uuid", "workingHours": {...}}'

# Testar webhook n8n
curl -X POST http://localhost:3000/api/webhooks/n8n/appointment/created \
  -H "Content-Type: application/json" \
  -H "X-N8N-Signature: sha256=assinatura" \
  -d '{"appointmentId": "uuid", "agentId": "uuid"}'
```

#### Teste Produção:
```bash
# Health check
curl https://imobipro.com/api/webhooks/health

# Teste com dados reais
curl -X POST https://imobipro.com/api/agenda/sync/google-calendar \
  -H "Authorization: Bearer token" \
  -d '{"userId": "real-user-id"}'
```

---

**Próximo passo recomendado**: Implementar os endpoints server-side seguindo a estrutura detalhada acima, priorizando os webhooks n8n para completar a automação.