// ---------- Configurações básicas ----------

generator client {
  provider = "prisma-client-js" // Gera cliente JS/TS para acessar o banco
}

datasource db {
  provider = "postgresql" // Supabase usa PostgreSQL por padrão
  url      = env("DATABASE_URL") // URL da conexão com o banco
}

// ---------- Enums (tipos fixos) ----------

/// Papéis de usuário dentro da aplicação
enum UserRole {
  CREATOR   // Dono do sistema (ex: Tiago - pode ver tudo de todas as empresas)
  ADMIN     // Dono da imobiliária (administra sua própria empresa)
  AGENT     // Corretor de imóveis (acesso restrito aos próprios dados)
}

/// Tipos de imóvel possíveis
enum PropertyType {
  APARTMENT
  HOUSE
  COMMERCIAL
  LAND
  OTHER
}

/// Status de uma propriedade
enum PropertyStatus {
  AVAILABLE
  SOLD
  RESERVED
}

/// Categorização de contatos (clientes/leads)
enum ContactCategory {
  CLIENT
  LEAD
  PARTNER
}

/// Status do contato no CRM
enum ContactStatus {
  ACTIVE
  NEW
  INACTIVE
}

/// Tipo de agendamento criado
enum AppointmentType {
  VISIT
  MEETING
  CALL
  OTHER
}

/// Status de um agendamento
enum AppointmentStatus {
  CONFIRMED
  PENDING
  COMPLETED
  CANCELED
}

/// Etapas do pipeline de vendas
enum DealStage {
  LEAD_IN
  QUALIFICATION
  PROPOSAL
  NEGOTIATION
  WON
  LOST
}

/// Tipos de ações para log de atividade do sistema
enum ActivityType {
  USER_CREATED
  PROPERTY_CREATED
  PROPERTY_UPDATED
  PROPERTY_DELETED
  CONTACT_CREATED
  CONTACT_UPDATED
  CONTACT_DELETED
  APPOINTMENT_SCHEDULED
  APPOINTMENT_UPDATED
  APPOINTMENT_CANCELED
  DEAL_CREATED
  DEAL_UPDATED
  DEAL_CLOSED
  CHAT_MESSAGE_SENT
}

// ---------- Modelos de dados ----------

/// Representa uma empresa/imobiliária dentro do sistema.
/// Permite isolar dados via multi-tenancy (ideal para SaaS).
model Company {
  id        String   @id @default(uuid())
  name      String                             // Nome da imobiliária
  active    Boolean  @default(true)            // Empresa ativa?
  users     User[]                             // Todos os usuários dessa empresa
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

/// Representa um usuário do sistema.
/// Pode ser o dono da empresa (ADMIN), corretor (AGENT) ou criador do sistema (CREATOR).
model User {
  id           String     @id @default(uuid())
  email        String     @unique               // Login (email)
  password     String                             // Senha (hash)
  name         String                             // Nome completo
  role         UserRole   @default(AGENT)         // Papel no sistema
  isActive     Boolean    @default(true)          // Pode acessar?
  companyId    String                              
  company      Company    @relation(fields: [companyId], references: [id]) // Relacionamento com imobiliária

  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  // Relacionamentos (tabelas que pertencem a este usuário)
  properties   Property[]                        // Imóveis gerenciados
  contacts     Contact[]                         // Contatos/clientes atribuídos
  appointments Appointment[]                     // Agendamentos criados
  deals        Deal[]                            // Negócios fechados ou em negociação
  activities   Activity[]                        // Logs de atividade
  messages     Message[]                         // Mensagens enviadas em chats
  chats        Chat[]     @relation("ChatOwner") // Chats iniciados por este corretor
}

/// Representa uma propriedade imobiliária (casa, apto, terreno etc.)
model Property {
  id             String         @id @default(uuid())
  title          String                               // Título do imóvel
  description    String?                              // Descrição opcional
  address        String                               // Endereço
  city           String
  state          String
  zipCode        String                               // CEP
  price          Decimal                              // Valor do imóvel
  area           Float                                // Tamanho em m²
  bedrooms       Int?                                 // Quartos
  bathrooms      Int?                                 // Banheiros
  type           PropertyType   @default(HOUSE)       // Tipo (enum)
  status         PropertyStatus @default(AVAILABLE)   // Disponibilidade
  characteristics Json?                               // Características (ex: ["garagem", "piscina"])
  images         String[]                             // URLs das imagens

  // Referência ao corretor responsável
  agentId        String
  agent          User           @relation(fields: [agentId], references: [id])

  // Relacionamentos com outras tabelas
  appointments   Appointment[]                       // Visitas a esse imóvel
  deals          Deal[]                              // Negociações ligadas a esse imóvel

  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
}

/// Representa um contato no CRM (cliente, lead ou parceiro)
model Contact {
  id            String          @id @default(uuid())
  name          String
  email         String?         @unique              // Pode ser opcional, mas único se presente
  phone         String?
  category      ContactCategory @default(LEAD)       // Lead, cliente, parceiro
  status        ContactStatus   @default(NEW)
  lastContactAt DateTime?                             // Último contato
  avatarUrl     String?

  // Corretores (user) relacionados
  agentId       String
  agent         User            @relation(fields: [agentId], references: [id])

  // Relacionamentos
  appointments  Appointment[]                         // Agendamentos com esse contato
  deals         Deal[]                                // Negociações com esse contato
  chats         Chat[]          @relation("ContactChat") // Chats com esse contato

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
}

/// Agendamentos feitos com contatos (visitas, reuniões etc.)
model Appointment {
  id          String            @id @default(uuid())
  title       String
  description String?
  date        DateTime
  type        AppointmentType   @default(VISIT)
  status      AppointmentStatus @default(PENDING)

  agentId     String
  agent       User              @relation(fields: [agentId], references: [id])

  contactId   String
  contact     Contact           @relation(fields: [contactId], references: [id])

  propertyId  String?
  property    Property?         @relation(fields: [propertyId], references: [id])

  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
}

/// Representa um negócio no pipeline de vendas
model Deal {
  id                String    @id @default(uuid())
  title             String                             // Nome do negócio
  value             Decimal                            // Valor da negociação
  stage             DealStage @default(LEAD_IN)         // Estágio atual
  status            String    @default("ACTIVE")        // Pode ser arquivado, ativo etc.
  expectedCloseDate DateTime?                           // Data esperada de fechamento
  closedAt          DateTime?                           // Data real (se houver)

  // Relacionamentos
  propertyId        String
  property          Property  @relation(fields: [propertyId], references: [id])

  clientId          String
  client            Contact   @relation(fields: [clientId], references: [id])

  agentId           String
  agent             User      @relation(fields: [agentId], references: [id])

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

/// Log de atividades para auditoria e histórico
model Activity {
  id          String       @id @default(uuid())
  type        ActivityType                       // Enum com o tipo de ação
  description String                             // Mensagem descritiva
  entityId    String?                            // ID da entidade relacionada (opcional)
  entityType  String?                            // Tipo da entidade (ex: 'PROPERTY')

  userId      String
  user        User         @relation(fields: [userId], references: [id])

  createdAt   DateTime     @default(now())
}

/// Conversa entre corretor e cliente
model Chat {
  id         String   @id @default(uuid())
  
  contactId  String
  contact    Contact  @relation("ContactChat", fields: [contactId], references: [id])

  agentId    String
  agent      User     @relation("ChatOwner", fields: [agentId], references: [id])

  messages   Message[]                            // Todas as mensagens do chat
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

/// Cada mensagem enviada em um chat
model Message {
  id        String   @id @default(uuid())
  content   String                             // Conteúdo da mensagem
  sentAt    DateTime @default(now())           // Horário do envio

  senderId  String
  sender    User     @relation(fields: [senderId], references: [id]) // Quem enviou

  chatId    String
  chat      Chat     @relation(fields: [chatId], references: [id])   // Em qual chat foi enviada
}