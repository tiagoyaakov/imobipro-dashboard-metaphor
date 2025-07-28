# 🏢 PLANEJAMENTO ULTRA DETALHADO - MVP IMOBIPRO DASHBOARD

**Data:** Dezembro 2024  
**Versão:** 1.0  
**Status:** Planejamento Executivo  

---

## 📊 **ANÁLISE ARQUITETURAL ATUAL**

### **Schema Prisma - Lacunas Identificadas**

#### **Modelos Existentes (Base Sólida)**
- ✅ `User` - Usuários com roles (CREATOR, ADMIN, AGENT)
- ✅ `Company` - Empresas/Imobiliárias
- ✅ `Property` - Propriedades básicas
- ✅ `Contact` - Contatos/Clientes
- ✅ `Appointment` - Agendamentos
- ✅ `Deal` - Negócios/Pipeline
- ✅ `Chat` & `Message` - Sistema de mensagens
- ✅ `Activity` - Log de atividades

#### **Lacunas Críticas Identificadas**
1. **Horários de Trabalho** - Não existe modelo para horários dos corretores
2. **Integração Viva Real** - Campos específicos da API não mapeados
3. **Funil de Leads** - Estágios específicos não definidos
4. **WhatsApp Integration** - Instâncias e QR codes
5. **Relatórios** - Templates e agendamento
6. **Features Flags** - Controle de funcionalidades por plano

---

## 🎯 **ORDEM DE IMPLEMENTAÇÃO - MVP**

### **FASE 1: FUNDAÇÃO (Módulos Críticos)**
1. **AGENDA** - Sistema de horários e agendamentos
2. **PROPRIEDADES** - Gestão de imóveis com Viva Real
3. **CLIENTES** - Funil de leads e gestão

### **FASE 2: COMUNICAÇÃO**
4. **CHATS** - Sistema de mensagens
5. **CONEXÕES** - Integração WhatsApp

### **FASE 3: GESTÃO AVANÇADA**
6. **PIPELINE** - Funil de vendas detalhado
7. **CONTATOS** - Análise detalhada
8. **RELATÓRIOS** - Métricas e exportação

### **FASE 4: CONFIGURAÇÃO**
9. **CONFIGURAÇÕES** - Controle de permissões
10. **CRM AVANÇADO** - Funcionalidades avançadas (futuro)

---

## 📅 **MÓDULO 1: AGENDA (N8N-FIRST ARCHITECTURE)**

### **🎯 Visão Geral - Revolução na Automação Imobiliária**

O módulo de agenda do ImobiPRO representa uma **revolução tecnológica** no setor imobiliário brasileiro, sendo o primeiro CRM 100% integrado com n8n para automação inteligente de agendamentos. Com sincronização bidirecional em tempo real com Google Calendar e interface mobile-first, oferece uma experiência sem precedentes tanto para corretores quanto para clientes.

### **🚀 Diferenciais Competitivos**

- **Automação 100% n8n**: Primeiro CRM imobiliário totalmente integrado com n8n
- **Sync Bidirecional Real-time**: Google Calendar sincronizado instantaneamente  
- **AI-Powered Scheduling**: Sugestões inteligentes baseadas em padrões de comportamento
- **Conflict-Free Architecture**: Sistema à prova de double-booking
- **Mobile-First UX**: Interface moderna e responsiva otimizada para dispositivos móveis
- **Zero-Touch Booking**: Agendamentos automáticos via WhatsApp sem intervenção humana

### **🏗️ Arquitetura de Dados Robusta**

```prisma
// === MODELOS PRINCIPAIS ===

// Horários de trabalho dos corretores (estrutura otimizada)
model AgentSchedule {
  id        String   @id @default(uuid())
  agentId   String
  agent     User     @relation(fields: [agentId], references: [id])
  
  // Configuração semanal estruturada
  workingHours Json    // Schema validado: { monday: { start: "09:00", end: "18:00", breaks: [...] }, ... }
  timezone     String  @default("America/Sao_Paulo")
  isActive     Boolean @default(true)
  
  // Configurações avançadas
  bufferTime          Int     @default(15) // minutos entre agendamentos
  maxDailyAppointments Int?   @default(8)
  allowWeekendWork    Boolean @default(false)
  autoAssignEnabled   Boolean @default(true)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([agentId])
}

// Slots de disponibilidade otimizados
model AvailabilitySlot {
  id          String   @id @default(uuid())
  agentId     String
  agent       User     @relation(fields: [agentId], references: [id])
  
  // Informações temporais
  date        DateTime @db.Date
  startTime   String   // "09:00" - formato HH:mm
  endTime     String   // "10:00" - formato HH:mm
  duration    Int      // duração em minutos
  
  // Status e controle
  status      SlotStatus @default(AVAILABLE)
  slotType    SlotType   @default(REGULAR)
  priority    Int        @default(0) // para ordenação inteligente
  
  // Relacionamentos
  appointmentId String?
  appointment   Appointment? @relation(fields: [appointmentId], references: [id])
  
  // Metadados para automação
  source         String?  // "manual", "google_calendar", "n8n", "auto_generated"
  externalId     String?  // ID do evento no sistema externo
  automationData Json?    // dados para workflows n8n
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([agentId, date, status])
  @@index([date, status, slotType])
}

enum SlotStatus {
  AVAILABLE   // Disponível para agendamento
  BOOKED      // Agendado com confirmação
  BLOCKED     // Bloqueado manualmente
  PENDING     // Aguardando confirmação
  CANCELLED   // Cancelado
  TENTATIVE   // Tentativo (sincronização)
}

enum SlotType {
  REGULAR     // Agendamento regular
  URGENT      // Agendamento urgente
  FOLLOW_UP   // Follow-up de cliente
  VIEWING     // Visita a imóvel
  MEETING     // Reunião interna
  BREAK       // Intervalo/almoço
}

// Estender Appointment com campos de sincronização e automação
model Appointment {
  // ... campos existentes mantidos ...
  
  // === NOVOS CAMPOS DE INTEGRAÇÃO ===
  
  // Google Calendar Sync
  googleCalendarEventId String?  @unique
  googleCalendarId      String?  // ID do calendário específico
  syncStatus           SyncStatus @default(PENDING)
  syncAttempts         Int       @default(0)
  lastSyncAt           DateTime?
  syncError            String?
  
  // n8n Integration
  n8nWorkflowId        String?   // ID do workflow que criou
  n8nExecutionId       String?   // ID da execução específica
  automationTrigger    AutomationTrigger?
  automationData       Json?     // dados para workflows
  
  // Smart Assignment
  autoAssigned         Boolean   @default(false)
  assignmentScore      Float?    // score do algoritmo de atribuição
  assignmentReason     String?   // razão da atribuição automática
  reassignmentCount    Int       @default(0)
  
  // Advanced Features  
  conflictResolved     Boolean   @default(false)
  conflictStrategy     ConflictStrategy?
  originalSlotId       String?   // slot original antes de conflito
  
  // Enhanced Metadata
  source              AppointmentSource @default(MANUAL)
  priority            AppointmentPriority @default(NORMAL)
  estimatedDuration   Int       @default(60) // minutos
  actualDuration      Int?      // minutos reais
  
  // Client Experience
  confirmationSent    Boolean   @default(false)
  remindersSent       Json?     // { "24h": true, "1h": false }
  clientFeedback      Json?     // feedback pós-agendamento
  reschedulingCount   Int       @default(0)
  
  // Relacionamentos novos
  availabilitySlotId  String?
  availabilitySlot    AvailabilitySlot? @relation(fields: [availabilitySlotId], references: [id])
  conflictLogs        AppointmentConflictLog[]
  syncLogs            CalendarSyncLog[]
  
  @@index([syncStatus, lastSyncAt])
  @@index([source, createdAt])
  @@index([agentId, status, scheduledFor])
}

// === MODELOS DE SINCRONIZAÇÃO GOOGLE CALENDAR ===

// Credenciais OAuth seguras por usuário
model GoogleCalendarCredentials {
  id           String   @id @default(uuid())
  userId       String   @unique
  user         User     @relation(fields: [userId], references: [id])
  
  // Tokens OAuth criptografados
  accessToken       String    // Criptografado
  refreshToken      String    // Criptografado  
  tokenExpiry       DateTime
  scope            String     // escopos autorizados
  
  // Configurações
  defaultCalendarId String?   // calendário padrão
  watchChannelId    String?   // ID do canal de notificações
  watchExpiration   DateTime? // expiração do canal
  
  isActive         Boolean   @default(true)
  lastSyncAt       DateTime?
  syncErrors       Int       @default(0)
  
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  
  calendars        GoogleCalendarConfig[]
}

// Configuração por calendário
model GoogleCalendarConfig {
  id           String   @id @default(uuid())
  credentialId String
  credential   GoogleCalendarCredentials @relation(fields: [credentialId], references: [id])
  
  calendarId   String   // ID do calendário no Google
  calendarName String   // nome amigável
  color        String?  // cor hex
  isPrimary    Boolean  @default(false)
  isActive     Boolean  @default(true)
  
  // Configurações de sincronização
  syncDirection    SyncDirection @default(BIDIRECTIONAL)
  syncEvents       Boolean       @default(true)
  syncAvailability Boolean       @default(true)
  autoCreateSlots  Boolean       @default(true)
  
  // Filtros
  eventFilter      Json?         // filtros de eventos
  timeRange        Json?         // { start: "09:00", end: "18:00" }
  
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  
  @@unique([credentialId, calendarId])
}

// Log de sincronizações
model CalendarSyncLog {
  id              String   @id @default(uuid())
  appointmentId   String?
  appointment     Appointment? @relation(fields: [appointmentId], references: [id])
  
  operation       SyncOperation
  direction       SyncDirection
  status          SyncLogStatus
  
  googleEventId   String?
  googleCalendarId String?
  
  // Dados da operação
  requestData     Json?    // dados enviados
  responseData    Json?    // resposta recebida
  errorMessage    String?  // erro se houver
  
  // Métricas
  duration        Int?     // duração em ms
  retryCount      Int      @default(0)
  
  createdAt       DateTime @default(now())
  
  @@index([status, createdAt])
  @@index([operation, direction])
}

// Resolução de conflitos
model AppointmentConflictLog {
  id              String   @id @default(uuid())
  appointmentId   String
  appointment     Appointment @relation(fields: [appointmentId], references: [id])
  
  conflictType    ConflictType
  conflictSource  ConflictSource
  
  // Dados do conflito
  originalData    Json     // dados originais
  conflictingData Json     // dados conflitantes
  resolvedData    Json?    // dados após resolução
  
  strategy        ConflictStrategy
  resolution      ConflictResolution
  
  resolvedBy      String?  // ID do usuário que resolveu
  resolvedAt      DateTime?
  
  createdAt       DateTime @default(now())
}

// === MODELOS N8N INTEGRATION ===

// Configuração de workflows n8n
model N8nWorkflowConfig {
  id           String   @id @default(uuid())
  name         String
  description  String?
  workflowId   String   @unique // ID no n8n
  
  // Configuração
  isActive     Boolean  @default(true)
  triggerType  N8nTriggerType
  webhookUrl   String?  // URL do webhook se aplicável
  
  // Contexto
  companyId    String?
  company      Company? @relation(fields: [companyId], references: [id])
  agentId      String?
  agent        User?    @relation(fields: [agentId], references: [id])
  
  // Configurações
  settings     Json?    // configurações específicas
  mapping      Json?    // mapeamento de campos
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  executions   N8nExecutionLog[]
}

// Log de execuções n8n
model N8nExecutionLog {
  id              String   @id @default(uuid())
  workflowConfigId String
  workflowConfig  N8nWorkflowConfig @relation(fields: [workflowConfigId], references: [id])
  
  executionId     String   // ID da execução no n8n
  status          N8nExecutionStatus
  
  // Dados da execução
  inputData       Json?    // dados de entrada
  outputData      Json?    // dados de saída
  errorData       Json?    // dados de erro
  
  // Métricas
  startedAt       DateTime
  finishedAt      DateTime?
  duration        Int?     // duração em ms
  
  // Contexto
  appointmentId   String?
  appointment     Appointment? @relation(fields: [appointmentId], references: [id])
  
  createdAt       DateTime @default(now())
}

// === ENUMS ===

enum SyncStatus {
  PENDING     // Aguardando sincronização
  SYNCING     // Sincronizando
  SYNCED      // Sincronizado
  FAILED      // Falha na sincronização
  CONFLICT    // Conflito detectado
}

enum SyncDirection {
  TO_GOOGLE       // ImobiPRO → Google
  FROM_GOOGLE     // Google → ImobiPRO  
  BIDIRECTIONAL   // Ambos os sentidos
}

enum SyncOperation {
  CREATE
  UPDATE
  DELETE
  SYNC_CHECK
}

enum SyncLogStatus {
  SUCCESS
  FAILED
  RETRYING
  CANCELLED
}

enum AutomationTrigger {
  N8N_WEBHOOK     // Criado via webhook n8n
  WHATSAPP_BOT    // Criado via bot WhatsApp
  CALENDAR_SYNC   // Criado via sincronização
  AUTO_ASSIGNMENT // Criado por atribuição automática
  MANUAL_CREATION // Criado manualmente
}

enum ConflictType {
  TIME_OVERLAP    // Sobreposição de horários
  DOUBLE_BOOKING  // Duplo agendamento
  SYNC_MISMATCH   // Dados divergentes entre sistemas
  AVAILABILITY    // Conflito de disponibilidade
}

enum ConflictSource {
  GOOGLE_CALENDAR
  N8N_WORKFLOW
  MANUAL_EDIT
  AUTO_ASSIGNMENT
}

enum ConflictStrategy {
  LATEST_WINS     // Última modificação prevalece
  IMOBIPRO_WINS   // ImobiPRO prevalece
  GOOGLE_WINS     // Google Calendar prevalece
  MANUAL_REVIEW   // Revisão manual necessária
}

enum ConflictResolution {
  AUTO_RESOLVED   // Resolvido automaticamente
  MANUAL_RESOLVED // Resolvido manualmente
  ESCALATED       // Escalado para supervisor
  PENDING         // Aguardando resolução
}

enum AppointmentSource {
  MANUAL          // Criado manualmente
  WHATSAPP        // Criado via WhatsApp
  N8N_AUTOMATION  // Criado via n8n
  GOOGLE_CALENDAR // Importado do Google Calendar
  API_INTEGRATION // Criado via API externa
  BULK_IMPORT     // Importado em lote
}

enum AppointmentPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum N8nTriggerType {
  WEBHOOK         // Webhook de entrada
  SCHEDULE        // Agendamento/cron
  MANUAL          // Execução manual
  EVENT_DRIVEN    // Baseado em eventos
}

enum N8nExecutionStatus {
  RUNNING
  SUCCESS
  FAILED
  CANCELLED
  WAITING
}
```

### **🔌 Integrações Avançadas**

#### **1. Google Calendar API - Sincronização Bidirecional**

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

#### **2. n8n Workflows - Automação Inteligente**

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

### **🎨 Interface Moderna Mobile-First**

#### **Componentes React + TypeScript:**

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

#### **Design System:**
- **Cores ImobiPRO**: `imobipro-blue` e `imobipro-gray` 
- **Tema Dark**: Consistente com o projeto
- **shadcn/ui**: Componentes modernos e acessíveis
- **Tailwind CSS**: Responsividade e performance
- **Micro-interações**: Feedback visual imediato

### **🔐 Segurança e Confiabilidade**

#### **Autenticação & Autorização:**
- **JWT tokens** com refresh automático
- **Row Level Security (RLS)** no Supabase
- **API rate limiting** inteligente
- **Webhook signature validation** (HMAC-SHA256)

#### **Proteção de Dados:**
- **Criptografia AES-256-GCM** para tokens OAuth
- **Compliance LGPD** com auditoria completa
- **Backup automático** de dados críticos
- **Logs estruturados** para investigação forense

#### **Resiliência:**
- **Circuit breaker** para APIs externas
- **Retry mechanisms** com backoff exponencial
- **Dead letter queue** para falhas críticas
- **Health checks** automáticos

### **📊 Métricas e Monitoramento**

#### **KPIs Técnicos:**
- **Sync Latency**: < 2 segundos para Google Calendar
- **API Response**: < 500ms para operações críticas
- **Uptime**: 99.9% de disponibilidade
- **Conflict Rate**: < 1% de conflitos de agendamento

#### **KPIs de Negócio:**
- **Booking Conversion**: +40% na conversão de agendamentos
- **Agent Efficiency**: +30% na utilização de tempo
- **Customer Satisfaction**: +25% na experiência de agendamento
- **Automation Rate**: 80% dos agendamentos via automação

### **🚀 Plano de Implementação Estratégico**

#### **✅ FASE 1: Fundação (CONCLUÍDA - 100%)**
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

#### **🔄 FASE 2: Core Features (EM PROGRESSO - 25%)**
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

#### **❌ FASE 3: Automação Avançada (NÃO INICIADA)**
1. **❌ n8n Workflows**: Templates criados, implementação pendente
2. **❌ Conflict Resolution**: Estrutura no banco, lógica pendente
3. **❌ AI Suggestions**: Não iniciado
4. **❌ Performance Optimization**: Básico implementado

#### **❌ FASE 4: Produção (NÃO INICIADA)**
1. **❌ Testing**: Estrutura básica
2. **❌ Security Audit**: Não iniciado
3. **❌ Monitoring**: Básico implementado
4. **✅ Documentation**: Completa e atualizada

### **💰 ROI Esperado**

- **Redução 70%** no tempo gasto com agendamentos manuais
- **Aumento 50%** na conversão de leads em agendamentos
- **Eliminação 95%** de conflitos de horário
- **Melhoria 60%** na experiência do cliente
- **Automação 80%** das tarefas repetitivas

### **🏆 Conclusão Estratégica**

A nova arquitetura n8n-first para o módulo de agenda representa uma **evolução radical** do sistema atual, transformando-o de um calendário básico em uma **plataforma de automação inteligente**. 

Esta implementação posiciona o ImobiPRO como **líder tecnológico** no setor imobiliário brasileiro, oferecendo um nível de automação e integração que nenhum concorrente possui atualmente.

---

## 📡 **ENDPOINTS E WEBHOOKS DETALHADOS - MÓDULO AGENDA**

### **🏗️ Arquivos de Implementação em Produção**

Para implementar os endpoints server-side em produção, os seguintes arquivos devem ser criados:

#### **📁 Estrutura de Diretórios Sugerida:**
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

### **🔌 Endpoints CRUD - AgentSchedule**

#### **1. GET /api/agenda/agent-schedule/[id]**
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

#### **2. POST /api/agenda/agent-schedule**
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

### **🔌 Endpoints CRUD - AvailabilitySlot**

#### **3. GET /api/agenda/availability-slots**
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

#### **4. POST /api/agenda/availability-slots/generate**
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

### **🔌 Endpoints de Sincronização**

#### **5. POST /api/agenda/sync/google-calendar**
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

#### **6. GET /api/agenda/sync/status**
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

### **🔌 Webhooks n8n (Recebimento)**

#### **7. POST /api/webhooks/n8n/appointment/created**
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

#### **8. POST /api/webhooks/n8n/appointment/updated**
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

#### **9. POST /api/webhooks/n8n/appointment/cancelled**
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

### **🔌 Webhooks Google Calendar (Recebimento)**

#### **10. POST /api/webhooks/google-calendar/notifications**
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

### **🔌 Endpoints n8n (Envio)**

#### **11. POST /api/n8n/workflows/execute**
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

### **🔌 Webhooks n8n (Envio)**

Estes são os endpoints que **enviam** dados para n8n quando eventos acontecem no ImobiPRO:

#### **12. Trigger: Appointment Created (ImobiPRO → n8n)**
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

### **🔒 Segurança dos Webhooks**

#### **Validação HMAC-SHA256:**
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

### **📊 Monitoramento e Logs**

#### **13. GET /api/webhooks/health**
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

### **⚡ Implementação Recomendada**

Para implementar em produção, siga esta ordem:

1. **SEMANA 1**: Endpoints CRUD básicos (AgentSchedule, AvailabilitySlot)
2. **SEMANA 2**: Webhooks n8n (created, updated, cancelled)
3. **SEMANA 3**: Google Calendar webhooks e sincronização
4. **SEMANA 4**: Monitoramento, logs e health checks
5. **SEMANA 5**: Testes de integração e otimização

### **🧪 Como Testar**

#### **Teste Local:**
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

#### **Teste Produção:**
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

---

## 🏠 **MÓDULO 2: PROPRIEDADES**

### **Requisitos Específicos**
- Integração com Viva Real API
- Extração em tempo real de dados
- Armazenamento de imagens múltiplas
- Integração Google Maps
- Gestão de proprietários
- Adição manual de imóveis

### **Extensões do Modelo Property**

```prisma
// Estender Property existente
model Property {
  // ... campos existentes ...
  
  // Campos Viva Real API
  vivaRealId           String?  @unique
  priceValue           Int?
  siteUrl              String?
  areaUnit             String?
  countryName          String?
  neighborhoodName     String?
  zoneName             String?
  currencySymbol       String?
  garages              Int?
  latitude             Float?
  longitude            Float?
  thumbnails           String[]
  isDevelopmentUnit    Boolean  @default(false)
  listingType          String?
  stateNormalized      String?
  geolocationPrecision String?
  externalId           String?
  propertyTypeName     String?
  propertyTypeId       String?
  legend               String?
  accountName          String?
  accountLogo          String?
  accountRole          String?
  accountLicenseNumber String?
  account              String?
  leadEmails           String[]
  contactName          String?
  contactLogo          String?
  contactPhoneNumber   String?
  contactCellPhoneNumber String?
  contactAddress       String?
  usageId              String?
  usageName            String?
  businessId           String?
  businessName         String?
  publicationType      String?
  positioning          String?
  salePrice            Decimal?
  baseSalePrice        Decimal?
  rentPrice            Decimal?
  baseRentPrice        Decimal?
  currency             String?
  numImages            Int?
  showAddress          Boolean  @default(true)
  zipCode              String?
  locationId           String?
  backgroundImage      String?
  video                String?
  constructionStatus   String?
  rentPeriodId         String?
  rentPeriod           String?
  suites               Int?
  condominiumPrice     Decimal?
  iptu                 Decimal?
  additionalFeatures   Json?
  developmentInformation Json?
  creationDate         DateTime?
  promotions           Json?
  geoDistance          Float?
  isFeatured           Boolean  @default(false)
  streetId             String?
  streetName           String?
  streetNumber         String?
  accountPagePath      String?
  links                Json?
  
  // Relacionamentos
  ownerId              String?
  owner                PropertyOwner? @relation(fields: [ownerId], references: [id])
  propertyImages       PropertyImage[]
}

// Proprietário do imóvel
model PropertyOwner {
  id          String   @id @default(uuid())
  name        String
  email       String?
  phone       String?
  cpf         String?
  cnpj        String?
  address     String?
  city        String?
  state       String?
  zipCode     String?
  
  properties  Property[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Imagens do imóvel
model PropertyImage {
  id         String   @id @default(uuid())
  propertyId String
  property   Property @relation(fields: [propertyId], references: [id])
  
  url        String
  alt        String?
  order      Int      @default(0)
  isMain     Boolean  @default(false)
  
  createdAt  DateTime @default(now())
}
```

### **Integrações Necessárias**
1. **Viva Real API** - Extração de dados
2. **Google Maps API** - Geocodificação e mapas
3. **Supabase Storage** - Armazenamento de imagens

### **Funcionalidades Específicas**
- Sincronização automática com Viva Real
- Interface de adição manual de imóveis
- Visualização em mapa
- Galeria de imagens
- Filtros avançados

---

## 👥 **MÓDULO 3: CLIENTES**

### **Requisitos Específicos**
- Funil: novo lead > lead interessado > lead qualificado
- Visualização Kanban
- Sistema de disparo de mensagens
- Atribuição aleatória de corretores
- Gestão individual por corretor

### **Extensões do Modelo Contact**

```prisma
// Estender Contact existente
model Contact {
  // ... campos existentes ...
  
  // Funil de leads
  leadStage      LeadStage @default(NEW_LEAD)
  leadScore      Int       @default(0)
  lastActivityAt DateTime?
  nextFollowUpAt DateTime?
  
  // Atribuição
  assignedAt     DateTime?
  autoAssigned   Boolean   @default(false)
  
  // Disparo de mensagens
  messageCampaignId String?
  messageCampaign   MessageCampaign? @relation(fields: [messageCampaignId], references: [id])
  
  // Relacionamentos
  leadActivities LeadActivity[]
}

// Estágios do funil
enum LeadStage {
  NEW_LEAD        // Novo lead (entrou em contato)
  INTERESTED      // Lead interessado (respondeu mas não continuou)
  QUALIFIED       // Lead qualificado (agendou)
  CONVERTED       // Convertido em cliente
  LOST            // Perdido
}

// Campanhas de mensagens
model MessageCampaign {
  id          String   @id @default(uuid())
  name        String
  description String?
  template    String
  status      CampaignStatus @default(DRAFT)
  
  contacts    Contact[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum CampaignStatus {
  DRAFT
  ACTIVE
  PAUSED
  COMPLETED
}

// Atividades do lead
model LeadActivity {
  id          String   @id @default(uuid())
  contactId   String
  contact     Contact  @relation(fields: [contactId], references: [id])
  
  type        LeadActivityType
  description String
  metadata    Json?
  
  createdAt   DateTime @default(now())
}

enum LeadActivityType {
  CONTACT_CREATED
  STAGE_CHANGED
  MESSAGE_SENT
  APPOINTMENT_SCHEDULED
  APPOINTMENT_COMPLETED
  PROPERTY_VIEWED
  OFFER_MADE
}
```

### **Funcionalidades Específicas**
- Interface Kanban para visualização do funil
- Sistema de scoring automático
- Campanhas de mensagens
- Relatórios de conversão
- Atribuição automática de leads

---

## 💬 **MÓDULO 4: CHATS**

### **Requisitos Específicos**
- Corretor vê apenas seus chats
- Administrador vê todos os chats
- Resumo de conversas para admin
- Integração com WhatsApp

### **Extensões dos Modelos Chat/Message**

```prisma
// Estender Chat existente
model Chat {
  // ... campos existentes ...
  
  // Resumo para admin
  summary           String?
  lastMessageAt     DateTime?
  unreadCount       Int       @default(0)
  
  // Integração WhatsApp
  whatsappNumber    String?
  whatsappInstanceId String?
  
  // Relacionamentos
  chatSummary       ChatSummary?
}

// Resumo de conversa
model ChatSummary {
  id          String   @id @default(uuid())
  chatId      String   @unique
  chat        Chat     @relation(fields: [chatId], references: [id])
  
  summary     String
  keyPoints   Json?    // Pontos principais da conversa
  sentiment   String?  // Sentimento da conversa
  nextAction  String?  // Próxima ação recomendada
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Estender Message existente
model Message {
  // ... campos existentes ...
  
  // Integração WhatsApp
  whatsappMessageId String?
  messageType       MessageType @default(TEXT)
  metadata          Json?
}

enum MessageType {
  TEXT
  IMAGE
  AUDIO
  VIDEO
  DOCUMENT
  LOCATION
}
```

### **Funcionalidades Específicas**
- Interface de chat em tempo real
- Filtros por corretor
- Resumos automáticos com IA
- Integração WhatsApp
- Notificações de mensagens não lidas

---

## 🔗 **MÓDULO 5: CONEXÕES**

### **Requisitos Específicos**
- Criação de instâncias WhatsApp por corretor
- Geração de QR codes
- Controle de permissões pelo admin
- Reconexão automática

### **Novos Modelos**

```prisma
// Instâncias WhatsApp
model WhatsAppInstance {
  id          String   @id @default(uuid())
  agentId     String
  agent       User     @relation(fields: [agentId], references: [id])
  
  instanceId  String   @unique
  phoneNumber String
  qrCode      String?
  status      WhatsAppStatus @default(DISCONNECTED)
  
  // Configurações
  autoReply   Boolean  @default(false)
  autoReplyMessage String?
  
  // Permissões
  isActive    Boolean  @default(true)
  canConnect  Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum WhatsAppStatus {
  CONNECTED
  DISCONNECTED
  CONNECTING
  ERROR
}

// Log de conexões
model WhatsAppConnectionLog {
  id          String   @id @default(uuid())
  instanceId  String
  instance    WhatsAppInstance @relation(fields: [instanceId], references: [id])
  
  action      ConnectionAction
  status      String
  metadata    Json?
  
  createdAt   DateTime @default(now())
}

enum ConnectionAction {
  CONNECT
  DISCONNECT
  QR_GENERATED
  ERROR
}
```

### **Integrações Necessárias**
1. **WhatsApp Business API** - Conexão e mensagens
2. **n8n** - Automação de fluxos
3. **QR Code Generation** - Geração de códigos

### **Funcionalidades Específicas**
- Interface de gerenciamento de instâncias
- Geração de QR codes
- Monitoramento de status
- Controle de permissões
- Logs de conexão

---

## 📊 **MÓDULO 6: PIPELINE**

### **Requisitos Específicos**
- Estágios detalhados do funil
- Ações dinâmicas
- Métricas de conversão
- Visualização Kanban

### **Extensões do Modelo Deal**

```prisma
// Estender Deal existente
model Deal {
  // ... campos existentes ...
  
  // Estágios detalhados
  currentStage     DealStage @default(LEAD_IN)
  stageHistory     DealStageHistory[]
  
  // Métricas
  probability      Float    @default(0.0) // 0-100%
  expectedValue    Decimal?
  daysInStage      Int      @default(0)
  
  // Ações
  nextAction       String?
  nextActionDate   DateTime?
  
  // Relacionamentos
  dealActivities   DealActivity[]
}

// Histórico de estágios
model DealStageHistory {
  id          String   @id @default(uuid())
  dealId      String
  deal        Deal     @relation(fields: [dealId], references: [id])
  
  fromStage   DealStage
  toStage     DealStage
  changedAt   DateTime @default(now())
  changedBy   String
  reason      String?
}

// Atividades do negócio
model DealActivity {
  id          String   @id @default(uuid())
  dealId      String
  deal        Deal     @relation(fields: [dealId], references: [id])
  
  type        DealActivityType
  description String
  metadata    Json?
  
  createdAt   DateTime @default(now())
}

enum DealActivityType {
  STAGE_CHANGED
  PROPOSAL_SENT
  NEGOTIATION_STARTED
  OFFER_MADE
  OFFER_ACCEPTED
  OFFER_REJECTED
  DOCUMENT_SENT
  MEETING_SCHEDULED
  FOLLOW_UP_SENT
}
```

### **Funcionalidades Específicas**
- Interface Kanban para pipeline
- Métricas de conversão por estágio
- Ações automáticas baseadas em estágio
- Relatórios de performance
- Alertas de negócios em risco

---

## 📈 **MÓDULO 7: RELATÓRIOS**

### **Requisitos Específicos**
- Relatórios semanais via WhatsApp
- Métricas de vendas
- Conversas iniciadas e agendamentos
- Exportação de dados

### **Novos Modelos**

```prisma
// Templates de relatório
model ReportTemplate {
  id          String   @id @default(uuid())
  name        String
  description String?
  type        ReportType
  template    String   // Template HTML/Texto
  variables   Json?    // Variáveis disponíveis
  
  isActive    Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum ReportType {
  WEEKLY_SALES
  LEAD_CONVERSION
  APPOINTMENT_SUMMARY
  AGENT_PERFORMANCE
  PROPERTY_ANALYSIS
}

// Agendamento de relatórios
model ScheduledReport {
  id          String   @id @default(uuid())
  templateId  String
  template    ReportTemplate @relation(fields: [templateId], references: [id])
  
  name        String
  schedule    String   // Cron expression
  recipients  String[] // Lista de destinatários
  format      ReportFormat @default(WHATSAPP)
  
  isActive    Boolean  @default(true)
  lastSentAt  DateTime?
  nextSendAt  DateTime?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum ReportFormat {
  WHATSAPP
  EMAIL
  PDF
  EXCEL
}

// Histórico de relatórios enviados
model ReportHistory {
  id          String   @id @default(uuid())
  scheduledReportId String
  scheduledReport ScheduledReport @relation(fields: [scheduledReportId], references: [id])
  
  content     String
  recipients  String[]
  sentAt      DateTime @default(now())
  status      ReportStatus @default(SENT)
  error       String?
}

enum ReportStatus {
  SENT
  FAILED
  PENDING
}
```

### **Integrações Necessárias**
1. **WhatsApp Business API** - Envio de relatórios
2. **n8n** - Agendamento e automação
3. **PDF Generation** - Geração de relatórios

### **Funcionalidades Específicas**
- Templates de relatório personalizáveis
- Agendamento automático
- Métricas em tempo real
- Exportação em múltiplos formatos
- Dashboard de métricas

---

## ⚙️ **MÓDULO 8: CONFIGURAÇÕES**

### **Requisitos Específicos**
- Controle de funcionalidades por DEV MASTER
- Sistema de features flags
- Controle baseado em planos contratados
- Configurações globais do sistema

### **Novos Modelos**

```prisma
// Features flags
model FeatureFlag {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  isActive    Boolean  @default(false)
  
  // Controle por plano
  requiredPlan PlanType?
  
  // Controle por usuário/empresa
  enabledFor  Json?    // { users: [], companies: [], roles: [] }
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum PlanType {
  BASIC
  PROFESSIONAL
  ENTERPRISE
  CUSTOM
}

// Configurações da empresa
model CompanySettings {
  id          String   @id @default(uuid())
  companyId   String   @unique
  company     Company  @relation(fields: [companyId], references: [id])
  
  // Configurações gerais
  timezone    String   @default("America/Sao_Paulo")
  currency    String   @default("BRL")
  language    String   @default("pt-BR")
  
  // Configurações de negócio
  workingHours Json?   // Horários padrão da empresa
  leadAutoAssignment Boolean @default(true)
  appointmentReminders Boolean @default(true)
  
  // Integrações
  whatsappEnabled Boolean @default(false)
  googleCalendarEnabled Boolean @default(false)
  vivaRealEnabled Boolean @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Configurações do usuário
model UserSettings {
  id          String   @id @default(uuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  
  // Preferências
  theme       String   @default("dark")
  notifications Json?  // Configurações de notificação
  dashboard   Json?    // Configurações do dashboard
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### **Funcionalidades Específicas**
- Interface de gerenciamento de features
- Controle granular de permissões
- Configurações por empresa e usuário
- Sistema de planos e limites
- Auditoria de mudanças

---

## 🔧 **INTEGRAÇÕES EXTERNAS NECESSÁRIAS**

### **1. Google Calendar API**
- **Propósito:** Sincronização de agendamentos
- **Documentação:** Google Calendar API v3
- **Funcionalidades:** Criar, atualizar, deletar eventos
- **Autenticação:** OAuth 2.0

### **2. WhatsApp Business API**
- **Propósito:** Comunicação com clientes
- **Documentação:** WhatsApp Business API
- **Funcionalidades:** Envio de mensagens, QR codes, webhooks
- **Autenticação:** Token de acesso

### **3. Viva Real API**
- **Propósito:** Extração de dados de propriedades
- **Documentação:** Viva Real Developer Portal
- **Funcionalidades:** Busca de imóveis, dados detalhados
- **Autenticação:** API Key

### **4. Google Maps API**
- **Propósito:** Geocodificação e mapas
- **Documentação:** Google Maps Platform
- **Funcionalidades:** Geocoding, Places, Maps
- **Autenticação:** API Key

### **5. n8n Workflows**
- **Propósito:** Automação de processos
- **Documentação:** n8n Documentation
- **Funcionalidades:** Webhooks, automação de agendamentos
- **Autenticação:** API Key

---

## 📚 **DOCUMENTAÇÕES NECESSÁRIAS**

### **Regras de Desenvolvimento**
1. **rules-google-calendar-integration.md** - Integração Google Calendar
2. **rules-whatsapp-business-api.md** - Integração WhatsApp
3. **rules-viva-real-api.md** - Integração Viva Real
4. **rules-n8n-automation.md** - Automação com n8n
5. **rules-feature-flags.md** - Sistema de features flags
6. **rules-reporting-system.md** - Sistema de relatórios

### **Documentação Técnica**
1. **API Documentation** - Endpoints e integrações
2. **Database Schema** - Schema completo atualizado
3. **Deployment Guide** - Guia de deploy com novas integrações
4. **Security Guidelines** - Diretrizes de segurança

---

## 🚀 **PLANO DE EXECUÇÃO**

### **FASE 1: FUNDAÇÃO (4-6 semanas)**
1. **Semana 1-2:** Extensões do schema e migrações
2. **Semana 3-4:** Módulo AGENDA (core)
3. **Semana 5-6:** Módulo PROPRIEDADES (integração Viva Real)

### **FASE 2: COMUNICAÇÃO (3-4 semanas)**
1. **Semana 7-8:** Módulo CLIENTES (funil de leads)
2. **Semana 9-10:** Módulo CHATS (sistema de mensagens)

### **FASE 3: INTEGRAÇÃO (3-4 semanas)**
1. **Semana 11-12:** Módulo CONEXÕES (WhatsApp)
2. **Semana 13-14:** Módulo PIPELINE (funil de vendas)

### **FASE 4: ANÁLISE (2-3 semanas)**
1. **Semana 15-16:** Módulo CONTATOS (análise detalhada)
2. **Semana 17-18:** Módulo RELATÓRIOS (métricas)

### **FASE 5: CONFIGURAÇÃO (2-3 semanas)**
1. **Semana 19-20:** Módulo CONFIGURAÇÕES (controle de permissões)

---

## 🔒 **CONSIDERAÇÕES DE SEGURANÇA**

### **Autenticação e Autorização**
- Manter sistema de roles existente
- Implementar Row Level Security (RLS) no Supabase
- Controle de acesso baseado em features flags

### **Dados Sensíveis**
- Criptografia de dados de WhatsApp
- Proteção de informações de clientes
- Compliance com LGPD

### **Integrações**
- Validação de webhooks
- Rate limiting para APIs externas
- Monitoramento de falhas de integração

---

## 📊 **MÉTRICAS DE SUCESSO**

### **Técnicas**
- Tempo de resposta < 2s
- Uptime > 99.9%
- Cobertura de testes > 80%

### **Funcionais**
- Redução de 50% no tempo de agendamento
- Aumento de 30% na conversão de leads
- Automatização de 80% das tarefas repetitivas

---

## 🎯 **PRÓXIMOS PASSOS**

1. **Aprovação do Planejamento** - Revisão e validação
2. **Setup de Ambiente** - Configuração de integrações
3. **Desenvolvimento Fase 1** - Início da implementação
4. **Testes Contínuos** - Validação de cada módulo
5. **Deploy Incremental** - Lançamento por fases

---

**Status:** ✅ Planejamento Completo  
**Próxima Ação:** Aprovação e início da Fase 1 