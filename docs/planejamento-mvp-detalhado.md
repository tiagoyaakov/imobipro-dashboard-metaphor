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

## 📅 **MÓDULO 1: AGENDA**

### **Requisitos Específicos**
- Visualização de agenda de todos corretores ou individual
- Filtros dinâmicos e inteligentes
- Integração Google Calendar
- Automação via n8n para verificação de disponibilidade
- Atribuição aleatória de corretores
- Configuração de horários de trabalho por corretor

### **🔗 INTEGRAÇÃO GOOGLE CALENDAR API - PASSO A PASSO**

#### **1. Configuração Inicial**

**1.1. Instalação das Dependências**
```bash
# Instalar Google Calendar API client
npm install @googleapis/calendar

# Instalar dependências de autenticação
npm install googleapis
```

**1.2. Configuração no Google Cloud Console**
- Acessar [Google Cloud Console](https://console.cloud.google.com/)
- Criar novo projeto ou selecionar existente
- Habilitar Google Calendar API
- Configurar OAuth 2.0 credentials:
  - Tipo: Web Application
  - Redirect URIs: `http://localhost:3000/oauth2callback` (desenvolvimento)
  - Scopes necessários:
    - `https://www.googleapis.com/auth/calendar`
    - `https://www.googleapis.com/auth/calendar.events`

**1.3. Arquivo de Configuração OAuth**
```json
// oauth2.keys.json
{
  "web": {
    "redirect_uris": ["http://localhost:3000/oauth2callback"],
    "client_id": "<YOUR_CLIENT_ID>",
    "client_secret": "<YOUR_CLIENT_SECRET>",
    "project_id": "<YOUR_PROJECT_ID>"
  }
}
```

#### **2. Implementação da Autenticação**

**2.1. Configuração do Cliente OAuth2**
```typescript
// src/integrations/google-calendar/auth.ts
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export class GoogleCalendarAuth {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Configurar refresh token automaticamente
    this.oauth2Client.on('tokens', (tokens) => {
      if (tokens.refresh_token) {
        // Salvar refresh_token no banco de dados
        this.saveRefreshToken(tokens.refresh_token);
      }
    });
  }

  // Gerar URL de autorização
  generateAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId, // Para identificar o usuário após callback
      prompt: 'consent' // Força obtenção do refresh_token
    });
  }

  // Trocar código por tokens
  async exchangeCodeForTokens(code: string): Promise<any> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error('Erro ao trocar código por tokens:', error);
      throw error;
    }
  }

  // Configurar credenciais com refresh token
  async setCredentialsFromRefreshToken(refreshToken: string): Promise<void> {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
  }

  private async saveRefreshToken(refreshToken: string): Promise<void> {
    // Implementar salvamento no banco de dados
    // await prisma.user.update({
    //   where: { id: userId },
    //   data: { googleRefreshToken: refreshToken }
    // });
  }
}
```

#### **3. Serviço de Integração com Google Calendar**

**3.1. Cliente do Google Calendar**
```typescript
// src/integrations/google-calendar/client.ts
import { google } from 'googleapis';
import { GoogleCalendarAuth } from './auth';

export class GoogleCalendarClient {
  private calendar: any;
  private auth: GoogleCalendarAuth;

  constructor(auth: GoogleCalendarAuth) {
    this.auth = auth;
    this.calendar = google.calendar({
      version: 'v3',
      auth: auth.getOAuth2Client()
    });
  }

  // Criar evento no Google Calendar
  async createEvent(calendarId: string, eventData: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    attendees?: Array<{ email: string }>;
    reminders?: {
      useDefault: boolean;
      overrides?: Array<{ method: string; minutes: number }>;
    };
  }): Promise<any> {
    try {
      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: eventData,
        sendUpdates: 'all' // Enviar notificações para participantes
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw error;
    }
  }

  // Buscar eventos
  async listEvents(calendarId: string, params: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    singleEvents?: boolean;
    orderBy?: string;
  } = {}): Promise<any> {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        ...params,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items;
    } catch (error) {
      console.error('Erro ao listar eventos:', error);
      throw error;
    }
  }

  // Atualizar evento
  async updateEvent(calendarId: string, eventId: string, eventData: any): Promise<any> {
    try {
      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        requestBody: eventData,
        sendUpdates: 'all'
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw error;
    }
  }

  // Deletar evento
  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
        sendUpdates: 'all'
      });
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      throw error;
    }
  }

  // Buscar calendários do usuário
  async listCalendars(): Promise<any> {
    try {
      const response = await this.calendar.calendarList.list();
      return response.data.items;
    } catch (error) {
      console.error('Erro ao listar calendários:', error);
      throw error;
    }
  }

  // Criar calendário personalizado
  async createCalendar(calendarData: {
    summary: string;
    description?: string;
    timeZone?: string;
  }): Promise<any> {
    try {
      const response = await this.calendar.calendars.insert({
        requestBody: calendarData
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao criar calendário:', error);
      throw error;
    }
  }
}
```

#### **4. Sincronização Bidirecional**

**4.1. Serviço de Sincronização**
```typescript
// src/integrations/google-calendar/sync.ts
import { GoogleCalendarClient } from './client';
import { prisma } from '@/lib/prisma';

export class GoogleCalendarSync {
  private client: GoogleCalendarClient;

  constructor(client: GoogleCalendarClient) {
    this.client = client;
  }

  // Sincronizar agendamento do banco para Google Calendar
  async syncAppointmentToGoogle(appointmentId: string): Promise<void> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          agent: true,
          contact: true,
          property: true
        }
      });

      if (!appointment || appointment.googleCalendarEventId) {
        return; // Já sincronizado ou não encontrado
      }

      const eventData = {
        summary: `Agendamento - ${appointment.property?.title || 'Imóvel'}`,
        description: `
          Cliente: ${appointment.contact?.name}
          Corretor: ${appointment.agent?.name}
          Propriedade: ${appointment.property?.title}
          Observações: ${appointment.notes || 'Nenhuma'}
        `,
        start: {
          dateTime: appointment.startTime.toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: appointment.endTime.toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        attendees: [
          { email: appointment.agent?.email },
          { email: appointment.contact?.email }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 dia antes
            { method: 'popup', minutes: 30 } // 30 min antes
          ]
        }
      };

      const googleEvent = await this.client.createEvent('primary', eventData);

      // Atualizar agendamento com ID do evento Google
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { googleCalendarEventId: googleEvent.id }
      });

    } catch (error) {
      console.error('Erro na sincronização para Google Calendar:', error);
      throw error;
    }
  }

  // Sincronizar eventos do Google Calendar para o banco
  async syncFromGoogleCalendar(userId: string, calendarId: string = 'primary'): Promise<void> {
    try {
      const timeMin = new Date();
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 30); // Próximos 30 dias

      const events = await this.client.listEvents(calendarId, {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString()
      });

      for (const event of events) {
        // Verificar se já existe no banco
        const existingAppointment = await prisma.appointment.findFirst({
          where: { googleCalendarEventId: event.id }
        });

        if (!existingAppointment) {
          // Criar novo agendamento baseado no evento Google
          await prisma.appointment.create({
            data: {
              title: event.summary,
              notes: event.description,
              startTime: new Date(event.start.dateTime),
              endTime: new Date(event.end.dateTime),
              googleCalendarEventId: event.id,
              agentId: userId, // Assumir que é do usuário logado
              status: 'CONFIRMED'
            }
          });
        }
      }

    } catch (error) {
      console.error('Erro na sincronização do Google Calendar:', error);
      throw error;
    }
  }
}
```

#### **5. Webhooks para Sincronização em Tempo Real**

**5.1. Configuração de Webhooks**
```typescript
// src/integrations/google-calendar/webhooks.ts
import { GoogleCalendarClient } from './client';
import { prisma } from '@/lib/prisma';

export class GoogleCalendarWebhooks {
  private client: GoogleCalendarClient;

  constructor(client: GoogleCalendarClient) {
    this.client = client;
  }

  // Configurar webhook para um calendário
  async setupWebhook(calendarId: string, webhookUrl: string): Promise<void> {
    try {
      const response = await this.client.calendar.events.watch({
        calendarId,
        requestBody: {
          id: `imobipro-${calendarId}-${Date.now()}`,
          type: 'web_hook',
          address: webhookUrl,
          params: {
            ttl: '86400' // 24 horas
          }
        }
      });

      // Salvar informações do webhook no banco
      await prisma.googleCalendarWebhook.create({
        data: {
          calendarId,
          webhookUrl,
          resourceId: response.data.resourceId,
          expiration: new Date(response.data.expiration)
        }
      });

    } catch (error) {
      console.error('Erro ao configurar webhook:', error);
      throw error;
    }
  }

  // Processar notificação de webhook
  async processWebhookNotification(notification: any): Promise<void> {
    try {
      const { resourceId, resourceUri } = notification;

      // Buscar eventos atualizados
      const events = await this.client.listEvents('primary', {
        timeMin: new Date().toISOString(),
        maxResults: 10
      });

      // Sincronizar eventos atualizados
      for (const event of events) {
        await this.syncEventToDatabase(event);
      }

    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      throw error;
    }
  }

  private async syncEventToDatabase(event: any): Promise<void> {
    // Implementar lógica de sincronização específica
    // Baseado no tipo de mudança (criado, atualizado, deletado)
  }
}
```

#### **6. Integração com o Sistema de Agendamentos**

**6.1. Hook Personalizado para Google Calendar**
```typescript
// src/hooks/useGoogleCalendar.ts
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export const useGoogleCalendar = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Verificar se usuário tem Google Calendar conectado
  useEffect(() => {
    if (user?.googleRefreshToken) {
      setIsConnected(true);
    }
  }, [user]);

  // Conectar Google Calendar
  const connectGoogleCalendar = async (): Promise<string> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/google-calendar/auth-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });

      const { authUrl } = await response.json();
      return authUrl;
    } catch (error) {
      console.error('Erro ao gerar URL de autenticação:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Processar callback de autenticação
  const handleAuthCallback = async (code: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/google-calendar/auth-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userId: user?.id })
      });

      if (response.ok) {
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Erro no callback de autenticação:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sincronizar agendamento
  const syncAppointment = async (appointmentId: string): Promise<void> => {
    if (!isConnected) {
      throw new Error('Google Calendar não conectado');
    }

    try {
      await fetch('/api/google-calendar/sync-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId })
      });
    } catch (error) {
      console.error('Erro na sincronização:', error);
      throw error;
    }
  };

  return {
    isConnected,
    isLoading,
    connectGoogleCalendar,
    handleAuthCallback,
    syncAppointment
  };
};
```

#### **7. APIs para Integração**

**7.1. Endpoint de Autenticação**
```typescript
// src/pages/api/google-calendar/auth-url.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleCalendarAuth } from '@/integrations/google-calendar/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;
    const auth = new GoogleCalendarAuth();
    const authUrl = auth.generateAuthUrl(userId);

    res.status(200).json({ authUrl });
  } catch (error) {
    console.error('Erro ao gerar URL de autenticação:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

**7.2. Endpoint de Callback**
```typescript
// src/pages/api/google-calendar/auth-callback.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleCalendarAuth } from '@/integrations/google-calendar/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, userId } = req.body;
    const auth = new GoogleCalendarAuth();
    const tokens = await auth.exchangeCodeForTokens(code);

    // Salvar tokens no banco
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleRefreshToken: tokens.refresh_token,
        googleAccessToken: tokens.access_token,
        googleTokenExpiry: new Date(tokens.expiry_date)
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro no callback de autenticação:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

#### **8. Variáveis de Ambiente Necessárias**

```env
# .env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
GOOGLE_CALENDAR_WEBHOOK_URL=https://your-domain.com/api/google-calendar/webhook
```

#### **9. Considerações de Segurança**

1. **Armazenamento Seguro de Tokens**
   - Criptografar refresh tokens no banco
   - Usar variáveis de ambiente para credenciais
   - Implementar rotação automática de tokens

2. **Validação de Webhooks**
   - Verificar assinatura dos webhooks do Google
   - Implementar rate limiting
   - Validar origem das requisições

3. **Controle de Acesso**
   - Verificar permissões do usuário antes de sincronizar
   - Implementar Row Level Security (RLS)
   - Logs de auditoria para todas as operações

#### **10. Monitoramento e Logs**

```typescript
// src/integrations/google-calendar/monitoring.ts
export class GoogleCalendarMonitoring {
  static logSyncOperation(operation: string, details: any): void {
    console.log(`[Google Calendar Sync] ${operation}:`, details);
    // Implementar logging estruturado
  }

  static logError(operation: string, error: any): void {
    console.error(`[Google Calendar Error] ${operation}:`, error);
    // Implementar alertas e notificações
  }
}
```

### **Novos Modelos Necessários**

```prisma
// Horários de trabalho dos corretores
model AgentSchedule {
  id        String   @id @default(uuid())
  agentId   String
  agent     User     @relation(fields: [agentId], references: [id])
  
  // Configuração por dia da semana
  monday    Json?    // { start: "09:00", end: "18:00", available: true }
  tuesday   Json?
  wednesday Json?
  thursday  Json?
  friday    Json?
  saturday  Json?
  sunday    Json?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Slots de disponibilidade
model AvailabilitySlot {
  id          String   @id @default(uuid())
  agentId     String
  agent       User     @relation(fields: [agentId], references: [id])
  
  date        DateTime
  startTime   String   // "09:00"
  endTime     String   // "18:00"
  isAvailable Boolean  @default(true)
  isBooked    Boolean  @default(false)
  
  appointmentId String?
  appointment   Appointment? @relation(fields: [appointmentId], references: [id])
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Estender Appointment existente
model Appointment {
  // ... campos existentes ...
  
  // Novos campos
  googleCalendarEventId String?
  n8nWorkflowId        String?
  autoAssigned         Boolean @default(false)
  availabilitySlotId   String?
  availabilitySlot     AvailabilitySlot? @relation(fields: [availabilitySlotId], references: [id])
}

// Webhooks do Google Calendar
model GoogleCalendarWebhook {
  id          String   @id @default(uuid())
  calendarId  String
  webhookUrl  String
  resourceId  String
  expiration  DateTime
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Estender User para tokens do Google
model User {
  // ... campos existentes ...
  
  // Google Calendar integration
  googleRefreshToken   String?
  googleAccessToken    String?
  googleTokenExpiry    DateTime?
  googleCalendarId     String?
}
```

### **Integrações Necessárias**
1. **Google Calendar API** - Sincronização bidirecional
2. **n8n Workflows** - Automação de agendamentos
3. **WhatsApp Business API** - Notificações

### **Funcionalidades Específicas**
- Interface de configuração de horários (como nas imagens)
- Calendário visual com slots disponíveis
- Sistema de atribuição automática
- Notificações automáticas
- Relatórios de ocupação

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

---

## 📋 **STATUS ATUAL DO DESENVOLVIMENTO**

### **Última Atualização:** 24 de Julho de 2025 - 01:09 UTC-3

### **MÓDULO 1: AGENDA - STATUS DETALHADO**

#### **✅ CONCLUÍDO:**
1. **Integração Google Calendar API**
   - ✅ Configuração OAuth2 e credenciais
   - ✅ Cliente Google Calendar (`src/integrations/google-calendar/client.ts`)
   - ✅ Autenticação (`src/integrations/google-calendar/auth.ts`)
   - ✅ Sincronização (`src/integrations/google-calendar/sync.ts`)
   - ✅ Webhooks (`src/integrations/google-calendar/webhooks.ts`)
   - ✅ API Endpoints (`src/pages/api/google-calendar/*`)
   - ✅ Hook React (`src/hooks/useGoogleCalendar.ts`)

2. **Componentes Base**
   - ✅ `AgendaCalendar.tsx` - Calendário principal com FullCalendar
   - ✅ `AgendaSidebar.tsx` - Sidebar com estatísticas e próximos agendamentos
   - ✅ `AgendaFilters.tsx` - Filtros dinâmicos
   - ✅ `AppointmentModal.tsx` - Modal de criação/edição
   - ✅ `Agenda.tsx` - Página principal com layout responsivo

3. **Correções de Deploy**
   - ✅ Resolvido erro `node-fetch` no Vercel (refatoração client-server)
   - ✅ Resolvido erro JSON no `package.json`
   - ✅ Resolvido erro `pnpm-lock.yaml` desatualizado
   - ✅ Revertido alterações acidentais na paleta de cores global

#### **🔄 EM PROGRESSO:**
1. **Auditoria de Design do Módulo Agenda**
   - ✅ Melhorias de responsividade implementadas
   - ✅ Correção de erros de linter
   - ✅ Layout focado no calendário como elemento principal
   - ✅ Sidebar responsiva com overlay mobile
   - ✅ Componentes organizados e responsivos

#### **📋 PRÓXIMAS ETAPAS:**
1. **Otimização da organização e layout**
   - Melhorar hierarquia visual dos componentes
   - Refinar espaçamentos e alinhamentos
   - Otimizar uso do espaço disponível

2. **Aprimoramento da UX e interações**
   - Melhorar feedback visual
   - Otimizar estados de loading
   - Refinar micro-interações

3. **Testes e validação**
   - Testar responsividade em diferentes dispositivos
   - Validar funcionalidades de agendamento
   - Verificar integração com Google Calendar

#### **🚨 PROBLEMAS RESOLVIDOS:**
1. **Erro de Deploy Vercel:** `node-fetch` não exportado
   - **Causa:** Dependências server-side sendo bundladas para client
   - **Solução:** Refatoração para usar API endpoints server-side

2. **Erro JSON:** `package.json` com sintaxe inválida
   - **Causa:** Comentários inválidos no JSON
   - **Solução:** Remoção de comentários e validação

3. **Erro Lockfile:** `pnpm-lock.yaml` desatualizado
   - **Causa:** Dependências comentadas no `package.json`
   - **Solução:** Regeneração do lockfile

4. **Alteração Acidental:** Paleta de cores global modificada
   - **Causa:** CSS global alterado durante auditoria do Agenda
   - **Solução:** Revertido commit `da18c17` com `git revert`

#### **📊 MÉTRICAS ATUAIS:**
- **Build Status:** ✅ Funcionando localmente
- **Deploy Status:** ✅ Vercel funcionando
- **Linter Status:** ✅ Sem erros
- **Responsividade:** ✅ Implementada
- **Google Calendar:** 🔄 Integração preparada (dependências temporariamente comentadas)

#### **🎯 OBJETIVO IMEDIATO:**
Completar a auditoria de design do módulo Agenda mantendo o padrão visual existente e focando no calendário como elemento principal, seguindo as diretrizes de design do projeto.

---

**Status:** 🔄 Desenvolvimento em Andamento  
**Próxima Ação:** Continuar auditoria de design do Agenda 