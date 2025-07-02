// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // Supabase utiliza PostgreSQL
  url      = env("DATABASE_URL")
}

// -----------------------------------------------------------
// Enums para Tipagens e Status
// -----------------------------------------------------------

/// Representa os diferentes papéis que um usuário pode ter no sistema.
enum UserRole {
  ADMIN    // Administrador do sistema
  AGENT    // Agente imobiliário (padrão para profissionais)
  MANAGER  // Gerente de equipe
  VIEWER   // Usuário com acesso somente leitura (para futuras expansões)
}

/// Representa os tipos de propriedades suportados.
enum PropertyType {
  APARTMENT   // Apartamento
  HOUSE       // Casa
  COMMERCIAL  // Imóvel comercial
  LAND        // Terreno
  OTHER       // Outros tipos de imóveis
}

/// Representa o status atual de uma propriedade.
enum PropertyStatus {
  AVAILABLE // Disponível para venda/locação
  SOLD      // Vendido
  RESERVED  // Reservado
}

/// Representa as categorias de contatos.
enum ContactCategory {
  CLIENT  // Cliente já estabelecido
  LEAD    // Potencial cliente
  PARTNER // Parceiro de negócios (para futuras expansões)
}

/// Representa o status de um contato no CRM.
enum ContactStatus {
  ACTIVE   // Contato ativo
  NEW      // Novo contato/lead
  INACTIVE // Contato inativo
}

/// Representa os tipos de agendamentos.
enum AppointmentType {
  VISIT   // Visita a propriedade
  MEETING // Reunião
  CALL    // Chamada telefônica
  OTHER   // Outros tipos de agendamento
}

/// Representa o status de um agendamento.
enum AppointmentStatus {
  CONFIRMED // Agendamento confirmado
  PENDING   // Agendamento pendente
  COMPLETED // Agendamento concluído
  CANCELED  // Agendamento cancelado
}

/// Representa os estágios no pipeline de vendas.
enum DealStage {
  LEAD_IN       // Entrada de lead
  QUALIFICATION // Qualificação do lead
  PROPOSAL      // Proposta enviada
  NEGOTIATION   // Negociação em andamento
  WON           // Negócio fechado (ganho)
  LOST          // Negócio perdido
}

/// Representa o tipo de atividade registrada no log.
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
  // Podem ser adicionados mais tipos conforme as funcionalidades avançam
}

// -----------------------------------------------------------
// Modelos (Tabelas do Banco de Dados)
// -----------------------------------------------------------

/// Modelo para representar os usuários do sistema.
model User {
  id           String        @id @default(uuid()) // ID único do usuário
  email        String        @unique               // Email para login (único)
  password     String                               // Senha hashed do usuário
  name         String                               // Nome completo do usuário
  role         UserRole      @default(AGENT)      // Papel do usuário no sistema
  createdAt    DateTime      @default(now())      // Data de criação do registro
  updatedAt    DateTime      @updatedAt           // Última atualização do registro

  properties   Property[]                          // Propriedades gerenciadas por este usuário
  contacts     Contact[]                           // Contatos atribuídos a este usuário
  appointments Appointment[]                       // Agendamentos criados por este usuário
  deals        Deal[]                              // Negócios gerenciados por este usuário
  activities   Activity[]                          // Atividades realizadas por este usuário
}

/// Modelo para representar as propriedades imobiliárias.
model Property {
  id             String         @id @default(uuid()) // ID único da propriedade
  title          String                               // Título descritivo da propriedade
  description    String?                              // Descrição detalhada da propriedade
  address        String                               // Endereço completo
  city           String                               // Cidade
  state          String                               // Estado
  zipCode        String                               // CEP
  price          Decimal                              // Preço da propriedade
  area           Float                                // Área da propriedade (e.g., m²)
  bedrooms       Int?                                 // Número de quartos
  bathrooms      Int?                                 // Número de banheiros
  type           PropertyType   @default(HOUSE)      // Tipo da propriedade (ex: Casa, Apartamento)
  status         PropertyStatus @default(AVAILABLE)  // Status atual da propriedade (Disponível, Vendida, Reservada)
  characteristics Json?                               // Características da propriedade (ex: ["garagem", "piscina"])
  images         String[]                             // URLs das imagens da propriedade

  agentId        String                               // ID do agente responsável pela propriedade
  agent          User           @relation(fields: [agentId], references: [id]) // Relação com o modelo User

  appointments   Appointment[]                       // Agendamentos relacionados a esta propriedade
  deals          Deal[]                              // Negócios/vendas relacionados a esta propriedade

  createdAt      DateTime       @default(now())      // Data de criação do registro
  updatedAt      DateTime       @updatedAt           // Última atualização do registro
}

/// Modelo para representar contatos (clientes, leads).
model Contact {
  id            String          @id @default(uuid()) // ID único do contato
  name          String                                 // Nome do contato
  email         String?         @unique                // Email do contato (pode ser opcional para leads, mas único se presente)
  phone         String?                                // Telefone do contato
  category      ContactCategory @default(LEAD)         // Categoria do contato (Cliente, Lead)
  status        ContactStatus   @default(NEW)          // Status do contato (Ativo, Novo, Inativo)
  lastContactAt DateTime?                              // Data do último contato
  avatarUrl     String?                                // URL do avatar do contato

  agentId       String                                 // ID do agente responsável pelo contato
  agent         User            @relation(fields: [agentId], references: [id]) // Relação com o modelo User

  appointments  Appointment[]                          // Agendamentos com este contato
  deals         Deal[]                                 // Negócios relacionados a este contato

  createdAt     DateTime        @default(now())      // Data de criação do registro
  updatedAt     DateTime        @updatedAt           // Última atualização do registro
}

/// Modelo para representar agendamentos (visitas, reuniões).
model Appointment {
  id          String           @id @default(uuid()) // ID único do agendamento
  title       String                                 // Título breve do agendamento
  description String?                                // Descrição detalhada do agendamento
  date        DateTime                               // Data e hora do agendamento
  type        AppointmentType  @default(VISIT)      // Tipo do agendamento (Visita, Reunião)
  status      AppointmentStatus @default(PENDING)   // Status do agendamento (Confirmado, Pendente)

  agentId     String                                 // ID do agente que agendou
  agent       User             @relation(fields: [agentId], references: [id]) // Relação com o modelo User

  contactId   String                                 // ID do contato envolvido no agendamento
  contact     Contact          @relation(fields: [contactId], references: [id]) // Relação com o modelo Contact

  propertyId  String?                                // ID da propriedade (opcional, para visitas)
  property    Property?        @relation(fields: [propertyId], references: [id]) // Relação com o modelo Property

  createdAt   DateTime         @default(now())      // Data de criação do registro
  updatedAt   DateTime         @updatedAt           // Última atualização do registro
}

/// Modelo para representar negociações ou oportunidades de vendas.
model Deal {
  id                String    @id @default(uuid()) // ID único do negócio
  title             String                           // Título do negócio (ex: "Venda de Apartamento X")
  value             Decimal                          // Valor estimado ou final do negócio
  stage             DealStage @default(LEAD_IN)      // Estágio atual no pipeline de vendas
  status            String    @default("ACTIVE")     // Status geral do negócio (ativo, arquivado)
  expectedCloseDate DateTime?                        // Data esperada para fechamento
  closedAt          DateTime?                        // Data real de fechamento (se ganho/perdido)

  propertyId        String                           // ID da propriedade associada ao negócio
  property          Property  @relation(fields: [propertyId], references: [id]) // Relação com o modelo Property

  clientId          String                           // ID do cliente/contato envolvido no negócio
  client            Contact   @relation(fields: [clientId], references: [id]) // Relação com o modelo Contact

  agentId           String                           // ID do agente responsável pelo negócio
  agent             User      @relation(fields: [agentId], references: [id]) // Relação com o modelo User

  createdAt         DateTime  @default(now())      // Data de criação do registro
  updatedAt         DateTime  @updatedAt           // Última atualização do registro
}

/// Modelo para registrar atividades no sistema (log de atividades).
model Activity {
  id          String       @id @default(uuid()) // ID único da atividade
  type        ActivityType                     // Tipo de atividade (ex: PROPERTY_CREATED)
  description String                           // Descrição detalhada da atividade
  entityId    String?                          // ID da entidade relacionada (ex: ID da propriedade criada)
  entityType  String?                          // Tipo da entidade relacionada (ex: 'PROPERTY', 'CONTACT')

  userId      String                           // ID do usuário que realizou a atividade
  user        User         @relation(fields: [userId], references: [id]) // Relação com o modelo User

  createdAt   DateTime     @default(now())    // Data e hora da atividade
}