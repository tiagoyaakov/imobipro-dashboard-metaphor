# ImobiPRO Database Schema

This document contains the complete database schema for the ImobiPRO Dashboard application. The schema is designed using Prisma ORM and includes all models, enums, relationships, and indexes organized by functional modules.

---

## MÓDULO 1: AGENDA - Sistema de Agendamentos Avançado

### Models

```prisma
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
```

### Enums - Módulo Agenda

```prisma
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

---

## MÓDULO 2: PROPRIEDADES - Gestão de Imóveis

### Models

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

---

## MÓDULO 3: CLIENTES - Sistema de Leads

### Models

```prisma
// Contact existente + Campos de Lead implementados
model Contact {
  // ... campos existentes ...
  
  // ✅ Funil de leads implementado
  leadStage      LeadStage @default(NEW)
  leadScore      Int       @default(50)
  lastActivityAt DateTime?
  nextFollowUpAt DateTime?
  
  // ✅ Atribuição automática
  assignedAt     DateTime?
  autoAssigned   Boolean   @default(false)
  
  // ✅ Integração n8n
  n8nData        Json?     // Dados de integração n8n
  
  // ✅ Sistema de scoring
  leadSource     LeadSource @default(SITE)
  leadSourceDetails String?
  
  // ✅ Gestão por agente
  agentId        String
  agent          User @relation(fields: [agentId], references: [id])
  
  // ✅ Relacionamentos implementados
  leadActivities Activity[]
}
```

### Enums - Módulo Clientes

```prisma
// ✅ Estágios do funil implementados
enum LeadStage {
  NEW             // Novo lead (acabou de entrar)
  QUALIFIED       // Lead qualificado (respondeu positivamente)
  CONVERTED       // Convertido em cliente
  NEGOTIATING     // Em negociação
  LOST            // Perdido
}

// ✅ Sources de lead implementados
enum LeadSource {
  SITE            // Site da empresa
  WHATSAPP        // WhatsApp
  INDICACAO       // Indicação
  FACEBOOK        // Facebook
  INSTAGRAM       // Instagram
  GOOGLE          // Google Ads
  OUTROS          // Outros
}
```

---

## MÓDULO 4: CHATS - Sistema de Mensagens

### Models

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
```

### Enums - Módulo Chats

```prisma
enum MessageType {
  TEXT
  IMAGE
  AUDIO
  VIDEO
  DOCUMENT
  LOCATION
}
```

---

## MÓDULO 5: CONEXÕES - Integração WhatsApp

### Models

```prisma
// ✅ IMPLEMENTADO - Instâncias WhatsApp por agente
model WhatsAppInstance {
  id            String   @id @default(uuid())
  name          String   // Nome personalizado da instância
  agentId       String   // ID do agente/corretor
  agent         User     @relation(fields: [agentId], references: [id])
  
  // Status e conexão
  status        WhatsAppStatus @default(DISCONNECTED)
  phoneNumber   String?  // Número após conexão
  qrCode        String?  // QR code para conexão
  qrCodeExpiry  DateTime? // Expiração do QR code
  
  // Configurações
  autoReply     Boolean  @default(false)
  autoReplyMessage String?
  businessHours Json?    // Horários de funcionamento
  
  // Permissões e controle
  isActive      Boolean  @default(true)
  canConnect    Boolean  @default(true)
  maxDaily      Int?     // Limite de mensagens por dia
  
  // Metadados
  lastConnection DateTime?
  lastActivity   DateTime?
  metadata       Json?    // Dados adicionais
  
  // Relacionamentos
  connectionLogs WhatsAppConnectionLog[]
  messages       WhatsAppMessage[]
  companyId      String
  company        Company @relation(fields: [companyId], references: [id])
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([agentId, name]) // Instância única por agente
}

// ✅ IMPLEMENTADO - Logs de conexão para auditoria
model WhatsAppConnectionLog {
  id          String   @id @default(uuid())
  instanceId  String
  instance    WhatsAppInstance @relation(fields: [instanceId], references: [id])
  
  action      ConnectionAction
  status      String   // Status resultante
  errorCode   String?  // Código de erro se houver
  errorMessage String? // Mensagem de erro
  metadata    Json?    // Dados adicionais da operação
  ipAddress   String?  // IP de origem
  userAgent   String?  // User agent do cliente
  
  createdAt   DateTime @default(now())
  
  @@index([instanceId, createdAt])
  @@index([action, status])
}

// ✅ IMPLEMENTADO - Mensagens WhatsApp
model WhatsAppMessage {
  id            String   @id @default(uuid())
  instanceId    String
  instance      WhatsAppInstance @relation(fields: [instanceId], references: [id])
  
  // Identificação da mensagem
  whatsappId    String   @unique // ID da mensagem no WhatsApp
  fromNumber    String   // Número remetente
  toNumber      String   // Número destinatário
  
  // Conteúdo
  messageType   MessageType @default(TEXT)
  content       String   // Conteúdo da mensagem
  mediaUrl      String?  // URL da mídia se houver
  metadata      Json?    // Metadados adicionais
  
  // Status
  status        MessageStatus @default(SENT)
  deliveredAt   DateTime?
  readAt        DateTime?
  
  // Relacionamentos
  contactId     String?
  contact       Contact? @relation(fields: [contactId], references: [id])
  
  createdAt     DateTime @default(now())
  
  @@index([instanceId, createdAt])
  @@index([fromNumber, toNumber])
}

// ✅ IMPLEMENTADO - Configurações por empresa
model WhatsAppConfig {
  id              String   @id @default(uuid())
  companyId       String   @unique
  company         Company  @relation(fields: [companyId], references: [id])
  
  // Configurações globais
  maxInstances    Int      @default(5)    // Máximo de instâncias por empresa
  maxMessages     Int      @default(1000) // Máx mensagens/dia por empresa
  autoReplyEnabled Boolean @default(true) // Auto resposta habilitada
  
  // Templates de mensagem
  defaultGreeting String?  // Saudação padrão
  businessHours   Json?    // Horários de funcionamento
  autoReplyRules  Json?    // Regras de auto resposta
  
  // Integrações
  webhookUrl      String?  // URL para receber webhooks
  n8nEnabled      Boolean  @default(false)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Enums - Módulo Conexões

```prisma
// ✅ IMPLEMENTADO - Status das instâncias
enum WhatsAppStatus {
  DISCONNECTED  // Desconectado
  CONNECTING    // Conectando (QR code ativo)
  CONNECTED     // Conectado e funcionando
  ERROR         // Erro de conexão
  MAINTENANCE   // Em manutenção
}

// ✅ IMPLEMENTADO - Ações de conexão
enum ConnectionAction {
  CONNECT       // Tentativa de conexão
  DISCONNECT    // Desconexão
  QR_GENERATED  // QR code gerado
  QR_SCANNED    // QR code escaneado
  ERROR         // Erro de conexão
  HEARTBEAT     // Verificação de saúde
}

// ✅ IMPLEMENTADO - Tipos de mensagem
enum MessageType {
  TEXT      // Texto simples
  IMAGE     // Imagem
  VOICE     // Áudio/voz
  VIDEO     // Vídeo
  DOCUMENT  // Documento
  LOCATION  // Localização
  CONTACT   // Contato
  STICKER   // Sticker
}

// ✅ IMPLEMENTADO - Status das mensagens
enum MessageStatus {
  SENT      // Enviada
  DELIVERED // Entregue
  READ      // Lida
  FAILED    // Falha no envio
}
```

---

## MÓDULO 6: PIPELINE - Funil de Vendas

### Models

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
```

### Enums - Módulo Pipeline

```prisma
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

---

## MÓDULO 7: RELATÓRIOS - Sistema de Relatórios

### Models

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
```

### Enums - Módulo Relatórios

```prisma
enum ReportType {
  WEEKLY_SALES
  LEAD_CONVERSION
  APPOINTMENT_SUMMARY
  AGENT_PERFORMANCE
  PROPERTY_ANALYSIS
}

enum ReportFormat {
  WHATSAPP
  EMAIL
  PDF
  EXCEL
}

enum ReportStatus {
  SENT
  FAILED
  PENDING
}
```

---

## MÓDULO 8: CONFIGURAÇÕES - Sistema de Configurações

### Models

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

### Enums - Módulo Configurações

```prisma
enum PlanType {
  BASIC
  PROFESSIONAL
  ENTERPRISE
  CUSTOM
}
```

---

## Índices e Relacionamentos

### Principais Índices de Performance

```prisma
// Agenda Module
@@index([agentId, date, status]) // AvailabilitySlot
@@index([date, status, slotType]) // AvailabilitySlot
@@index([syncStatus, lastSyncAt]) // Appointment
@@index([source, createdAt]) // Appointment
@@index([agentId, status, scheduledFor]) // Appointment

// WhatsApp Module
@@index([instanceId, createdAt]) // WhatsAppConnectionLog
@@index([action, status]) // WhatsAppConnectionLog
@@index([instanceId, createdAt]) // WhatsAppMessage
@@index([fromNumber, toNumber]) // WhatsAppMessage

// Sync Module
@@index([status, createdAt]) // CalendarSyncLog
@@index([operation, direction]) // CalendarSyncLog
```

### Constraints Únicos

```prisma
@@unique([agentId]) // AgentSchedule
@@unique([agentId, name]) // WhatsAppInstance
@@unique([credentialId, calendarId]) // GoogleCalendarConfig
```

---

## Relacionamentos Entre Módulos

### Relacionamentos Principais

1. **User ↔ AgentSchedule**: 1:1 - Um usuário tem um horário de trabalho
2. **User ↔ AvailabilitySlot**: 1:N - Um usuário tem múltiplos slots
3. **User ↔ WhatsAppInstance**: 1:N - Um usuário pode ter múltiplas instâncias WhatsApp
4. **Company ↔ WhatsAppConfig**: 1:1 - Uma empresa tem uma configuração WhatsApp
5. **Property ↔ PropertyOwner**: N:1 - Múltiplas propriedades podem ter o mesmo proprietário
6. **Contact ↔ Activity**: 1:N - Um contato tem múltiplas atividades
7. **Deal ↔ DealStageHistory**: 1:N - Um negócio tem histórico de estágios

### Relacionamentos Cross-Module

- **Appointment** conecta múltiplos módulos (Agenda, Clientes, N8n)
- **Contact** é central para Clientes, WhatsApp e Pipeline
- **Company** é a entidade organizacional que conecta todos os módulos

---

*Este documento representa o schema completo do banco de dados ImobiPRO, organizando todos os modelos, enums e relacionamentos por módulos funcionais para facilitar o desenvolvimento e manutenção.*