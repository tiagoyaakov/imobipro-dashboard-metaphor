# 🤖 Guia de Integração n8n - ImobiPRO

Este documento detalha todos os endpoints, webhooks e configurações necessárias para integrar o ImobiPRO com n8n para automação completa de agendamentos.

## 📋 Índice

1. [Configuração Inicial](#configuração-inicial)
2. [Variáveis de Ambiente](#variáveis-de-ambiente)
3. [Endpoints a Implementar](#endpoints-a-implementar)
4. [Workflows Templates](#workflows-templates)
5. [Estrutura de Dados](#estrutura-de-dados)
6. [Segurança](#segurança)
7. [Testes](#testes)

---

## 🔧 Configuração Inicial

### 1. Instância n8n

**Requisitos:**
- n8n versão 1.0+ 
- API Key configurada
- Webhooks habilitados
- Acesso HTTP/HTTPS ao ImobiPRO

**Variáveis necessárias:**
- **URL da instância**: `https://sua-instancia-n8n.com`
- **API Key**: Gerar em Settings > API Keys
- **Base URL Webhooks**: `https://seu-imobipro.com/api/webhooks`

### 2. Configuração ImobiPRO

Adicionar ao arquivo `.env`:

```bash
# n8n Configuration
VITE_N8N_BASE_URL=https://sua-instancia-n8n.com
VITE_N8N_API_KEY=sua-api-key-aqui
VITE_WEBHOOK_BASE_URL=https://seu-imobipro.com/api/webhooks
VITE_N8N_WEBHOOK_SECRET=seu-secret-para-validacao
```

---

## 🌐 Variáveis de Ambiente

```bash
# ===== n8n INTEGRATION =====
VITE_N8N_BASE_URL=                    # URL da instância n8n
VITE_N8N_API_KEY=                     # API Key do n8n
VITE_WEBHOOK_BASE_URL=                # Base URL para webhooks
VITE_N8N_WEBHOOK_SECRET=              # Secret para validação HMAC

# ===== OPTIONAL =====
VITE_N8N_TIMEOUT=30000               # Timeout requests (ms)
VITE_N8N_RETRY_ATTEMPTS=3            # Tentativas de retry
VITE_N8N_DEBUG=false                 # Debug logs
```

---

## 📥 Endpoints a Implementar (ImobiPRO → n8n)

### **1. Webhook de Agendamento Criado**
```
POST /api/webhooks/n8n/appointment/created
```

**Payload esperado:**
```json
{
  "appointmentId": "uuid",
  "agentId": "uuid",
  "contactId": "uuid",
  "propertyId": "uuid",
  "scheduledFor": "2024-01-15T14:30:00Z",
  "type": "VISIT",
  "status": "CONFIRMED",
  "source": "MANUAL",
  "priority": "NORMAL",
  "estimatedDuration": 60,
  "contact": {
    "name": "João Silva",
    "phone": "+5511999999999",
    "email": "joao@email.com"
  },
  "agent": {
    "name": "Maria Corretor",
    "phone": "+5511888888888",
    "email": "maria@imobiliaria.com"
  },
  "property": {
    "title": "Apartamento 3 quartos",
    "address": "Rua das Flores, 123"
  },
  "metadata": {
    "createdAt": "2024-01-10T10:00:00Z",
    "source": "imobipro",
    "webhookType": "appointment.created"
  }
}
```

**Response esperado:**
```json
{
  "success": true,
  "message": "Agendamento processado com sucesso",
  "workflowExecutionId": "execution-uuid",
  "actions": [
    "reminder_24h_scheduled",
    "agent_notification_sent"
  ]
}
```

### **2. Webhook de Agendamento Atualizado**
```
POST /api/webhooks/n8n/appointment/updated
```

**Payload esperado:**
```json
{
  "appointmentId": "uuid",
  "changes": {
    "scheduledFor": {
      "old": "2024-01-15T14:30:00Z",
      "new": "2024-01-15T16:00:00Z"
    },
    "status": {
      "old": "PENDING",
      "new": "CONFIRMED"
    }
  },
  "updatedBy": "uuid",
  "reason": "Cliente solicitou mudança de horário",
  "metadata": {
    "updatedAt": "2024-01-10T12:00:00Z",
    "source": "imobipro",
    "webhookType": "appointment.updated"
  }
}
```

### **3. Webhook de Agendamento Cancelado**
```
POST /api/webhooks/n8n/appointment/cancelled
```

**Payload esperado:**
```json
{
  "appointmentId": "uuid",
  "cancelledBy": "uuid",
  "cancellationType": "CLIENT_REQUEST", // CLIENT_REQUEST, AGENT_CANCEL, SYSTEM_CANCEL
  "reason": "Cliente não pode comparecer",
  "cancelledAt": "2024-01-10T15:00:00Z",
  "rescheduleRequested": true,
  "metadata": {
    "source": "imobipro",
    "webhookType": "appointment.cancelled"
  }
}
```

### **4. Webhook de Mensagem WhatsApp**
```
POST /api/webhooks/n8n/whatsapp/message
```

**Payload esperado:**
```json
{
  "messageId": "whatsapp-msg-id",
  "from": "+5511999999999",
  "to": "+5511888888888",
  "message": "Olá, gostaria de agendar uma visita para hoje à tarde",
  "messageType": "text",
  "timestamp": "2024-01-10T16:30:00Z",
  "contact": {
    "id": "uuid",
    "name": "João Silva",
    "phone": "+5511999999999"
  },
  "intent": "SCHEDULE_APPOINTMENT", // Detected by NLP
  "entities": {
    "date": "hoje",
    "time": "tarde",
    "propertyType": null
  },
  "metadata": {
    "source": "imobipro",
    "webhookType": "whatsapp.message.received"
  }
}
```

### **5. Webhook de Evento de Calendário**
```
POST /api/webhooks/n8n/calendar/event
```

**Payload esperado:**
```json
{
  "eventId": "google-calendar-event-id",
  "calendarId": "primary",
  "operation": "CREATED", // CREATED, UPDATED, DELETED
  "event": {
    "summary": "Visita - Apartamento 3 quartos",
    "start": "2024-01-15T14:30:00Z",
    "end": "2024-01-15T15:30:00Z",
    "attendees": ["joao@email.com", "maria@imobiliaria.com"]
  },
  "agentId": "uuid",
  "syncDirection": "FROM_GOOGLE",
  "metadata": {
    "source": "google_calendar",
    "webhookType": "calendar.event.changed"
  }
}
```

---

## 📤 Endpoints n8n → ImobiPRO (Você precisa criar no n8n)

### **1. Trigger de Lembrete**
```
URL n8n: https://sua-instancia-n8n.com/webhook/trigger-reminder
Método: POST
```

### **2. Trigger de Follow-up**
```
URL n8n: https://sua-instancia-n8n.com/webhook/trigger-followup
Método: POST
```

### **3. Trigger de Sincronização**
```
URL n8n: https://sua-instancia-n8n.com/webhook/trigger-sync
Método: POST
```

### **4. Trigger de Resolução de Conflito**
```
URL n8n: https://sua-instancia-n8n.com/webhook/trigger-conflict
Método: POST
```

### **5. Trigger de Notificação**
```
URL n8n: https://sua-instancia-n8n.com/webhook/trigger-notification
Método: POST
```

---

## 🤖 Workflows Templates

### **1. Agendamento via WhatsApp**
**Workflow ID:** `whatsapp-scheduling`
**Trigger:** Webhook recebe mensagem WhatsApp
**Fluxo:**
1. Receber mensagem → Processar NLP → Extrair entidades
2. Verificar disponibilidade do agente
3. Criar agendamento se slot disponível
4. Responder ao cliente via WhatsApp
5. Notificar agente

### **2. Lembretes Automáticos**
**Workflow ID:** `appointment-reminders`
**Trigger:** Cron job a cada hora
**Fluxo:**
1. Buscar agendamentos nas próximas 24h e 1h
2. Enviar lembretes por WhatsApp/Email/SMS
3. Marcar como enviado no ImobiPRO
4. Aguardar confirmação do cliente

### **3. Follow-up Pós-Visita**
**Workflow ID:** `post-visit-followup`
**Trigger:** Agendamento marcado como COMPLETED
**Fluxo:**
1. Aguardar 2 horas após visita
2. Enviar pesquisa de satisfação
3. Coletar feedback
4. Agendar follow-up baseado na resposta
5. Atualizar CRM com informações

### **4. Resolução de Conflitos**
**Workflow ID:** `conflict-resolution`
**Trigger:** Conflito detectado no sistema
**Fluxo:**
1. Analisar tipo de conflito
2. Aplicar estratégia de resolução
3. Notificar partes envolvidas
4. Reagendar se necessário
5. Registrar resolução

### **5. Sincronização Google Calendar**
**Workflow ID:** `calendar-sync`
**Trigger:** Evento modificado no Google Calendar
**Fluxo:**
1. Receber webhook do Google Calendar
2. Validar mudanças
3. Detectar conflitos
4. Sincronizar com ImobiPRO
5. Atualizar slots de disponibilidade

---

## 📋 Estrutura de Dados

### **Agendamento (Appointment)**
```typescript
interface AppointmentWebhookPayload {
  appointmentId: string;
  agentId: string;
  contactId: string;
  propertyId?: string;
  scheduledFor: string; // ISO 8601
  type: 'VISIT' | 'MEETING' | 'CALL' | 'OTHER';
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED';
  source: 'MANUAL' | 'WHATSAPP' | 'N8N_AUTOMATION' | 'GOOGLE_CALENDAR';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  estimatedDuration: number; // minutes
  
  contact: ContactInfo;
  agent: AgentInfo;
  property?: PropertyInfo;
  metadata: WebhookMetadata;
}
```

### **Contato (Contact)**
```typescript
interface ContactInfo {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  preferences?: {
    communicationChannel: 'whatsapp' | 'email' | 'sms';
    bestTimeToContact: string;
  };
}
```

### **Corretor (Agent)**
```typescript
interface AgentInfo {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  workingHours?: WorkingHours;
  preferences?: {
    autoAssign: boolean;
    notificationChannels: string[];
  };
}
```

### **Metadata do Webhook**
```typescript
interface WebhookMetadata {
  source: 'imobipro' | 'google_calendar' | 'whatsapp';
  webhookType: string;
  timestamp: string; // ISO 8601
  version: string;
  requestId?: string;
}
```

---

## 🔐 Segurança

### **1. Autenticação**
- **API Key**: Incluir `X-N8N-API-KEY` em todos os requests
- **Webhook Secret**: Validar HMAC-SHA256 nos webhooks recebidos

### **2. Validação de Webhook**
```typescript
function validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === `sha256=${expectedSignature}`;
}
```

### **3. Rate Limiting**
- **API Calls**: 100 requests/minuto
- **Webhooks**: 1000 requests/minuto
- **Retry Logic**: Exponential backoff (1s, 2s, 4s, 8s, 16s)

### **4. Logs de Auditoria**
Registrar todos os eventos:
```json
{
  "timestamp": "2024-01-10T10:00:00Z",
  "event": "webhook.received",
  "source": "n8n",
  "endpoint": "/api/webhooks/n8n/appointment/created",
  "payload_hash": "sha256_hash",
  "user_agent": "n8n-webhook/1.0",
  "ip_address": "192.168.1.100",
  "processing_time_ms": 150,
  "status": "success"
}
```

---

## 🧪 Testes

### **1. Teste de Conectividade**
```bash
curl -X GET "https://sua-instancia-n8n.com/api/v1/workflows" \
  -H "X-N8N-API-KEY: sua-api-key"
```

### **2. Teste de Webhook**
```bash
curl -X POST "https://seu-imobipro.com/api/webhooks/n8n/appointment/created" \
  -H "Content-Type: application/json" \
  -H "X-N8N-Signature: sha256=signature_here" \
  -d '{
    "appointmentId": "test-uuid",
    "agentId": "agent-uuid",
    "contactId": "contact-uuid",
    "scheduledFor": "2024-01-15T14:30:00Z",
    "type": "VISIT",
    "status": "CONFIRMED"
  }'
```

### **3. Teste de Workflow**
```bash
curl -X POST "https://sua-instancia-n8n.com/api/v1/workflows/workflow-id/execute" \
  -H "X-N8N-API-KEY: sua-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": {
      "phoneNumber": "+5511999999999",
      "message": "Gostaria de agendar uma visita"
    }
  }'
```

---

## 🔍 Monitoramento

### **1. Health Checks**
- **n8n API**: `GET /api/v1/workflows` (status 200)
- **Webhooks**: Endpoint de teste `POST /api/webhooks/health`
- **Database**: Verificar conexão com Supabase

### **2. Métricas**
- **Latência de webhooks**: < 2 segundos
- **Taxa de sucesso**: > 99%
- **Execuções por minuto**: Monitorar picos
- **Erros por workflow**: < 1% da taxa total

### **3. Alertas**
- **Webhook falhou**: > 5 falhas em 10 minutos
- **n8n indisponível**: > 3 tentativas falharam
- **Workflow inativo**: Workflow crítico desativado
- **Latência alta**: > 5 segundos de processamento

---

## 📚 Próximos Passos

1. ✅ **Configurar variáveis de ambiente**
2. ⚠️ **Implementar endpoints webhook no servidor**
3. ⚠️ **Criar workflows n8n usando templates**
4. ⚠️ **Configurar autenticação e segurança**
5. ⚠️ **Testar integração end-to-end**
6. ⚠️ **Configurar monitoramento e alertas**
7. ⚠️ **Deploy em produção**

---

## 🆘 Troubleshooting

### **Problemas Comuns:**

1. **"n8n API Error (401)"**
   - Verificar API Key
   - Confirmar permissões no n8n

2. **"Webhook signature invalid"**
   - Verificar VITE_N8N_WEBHOOK_SECRET
   - Confirmar algoritmo HMAC-SHA256

3. **"Workflow not found"**
   - Verificar IDs dos workflows
   - Confirmar workflows estão ativos

4. **"Connection timeout"**
   - Verificar conectividade de rede
   - Aumentar timeout se necessário

---

**Status:** 🔄 **Em implementação**  
**Última atualização:** ${new Date().toISOString()}  
**Responsável:** Equipe ImobiPRO  

Para dúvidas ou suporte, consulte a equipe de desenvolvimento.