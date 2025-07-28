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

#### **FASE 1: Fundação (2-3 semanas)**
1. **Database Migration**: Implementar novos modelos Prisma
2. **Basic API Endpoints**: CRUD para AgentSchedule e AvailabilitySlot
3. **n8n Setup**: Configurar instância n8n e workflows básicos
4. **Google Calendar OAuth**: Implementar autenticação e tokens

#### **FASE 2: Core Features (3-4 semanas)**
1. **Calendar UI Moderna**: Componente principal do calendário
2. **Availability Settings**: Interface de configuração de horários
3. **Smart Booking Flow**: Processo de agendamento otimizado
4. **Real-time Sync**: WebSockets e sincronização bidirecional

#### **FASE 3: Automação Avançada (2-3 semanas)**
1. **n8n Workflows**: Implementar todos os workflows essenciais
2. **Conflict Resolution**: Sistema de resolução de conflitos
3. **AI Suggestions**: Integrar sugestões inteligentes
4. **Performance Optimization**: Cache, indexing, circuit breakers

#### **FASE 4: Produção (1-2 semanas)**
1. **Testing**: Testes unitários e de integração
2. **Security Audit**: Revisão de segurança
3. **Monitoring**: Logs, métricas e alertas
4. **Documentation**: Documentação completa

### **💰 ROI Esperado**

- **Redução 70%** no tempo gasto com agendamentos manuais
- **Aumento 50%** na conversão de leads em agendamentos
- **Eliminação 95%** de conflitos de horário
- **Melhoria 60%** na experiência do cliente
- **Automação 80%** das tarefas repetitivas

### **🏆 Conclusão Estratégica**

A nova arquitetura n8n-first para o módulo de agenda representa uma **evolução radical** do sistema atual, transformando-o de um calendário básico em uma **plataforma de automação inteligente**. 

Esta implementação posiciona o ImobiPRO como **líder tecnológico** no setor imobiliário brasileiro, oferecendo um nível de automação e integração que nenhum concorrente possui atualmente.

**Próximo passo recomendado**: Implementar a Fase 1 com foco na migração do database e setup inicial do n8n para validar a arquitetura proposta.

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