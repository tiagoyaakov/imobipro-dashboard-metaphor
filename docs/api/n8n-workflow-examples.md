# ImobiPRO + n8n: Exemplos de Workflows e Integrações

Este documento fornece exemplos práticos de como implementar workflows n8n com a API do módulo de agenda do ImobiPRO.

## 📋 Índice

- [Configuração Inicial](#configuração-inicial)
- [Workflows Básicos](#workflows-básicos)
- [Workflows Avançados](#workflows-avançados)  
- [Tratamento de Erros](#tratamento-de-erros)
- [Monitoramento e Logs](#monitoramento-e-logs)
- [Exemplos de Payload](#exemplos-de-payload)

## 🔧 Configuração Inicial

### 1. Configuração de Credenciais no n8n

```json
{
  "name": "ImobiPRO API",
  "type": "httpHeaderAuth",
  "data": {
    "name": "X-API-Key",
    "value": "sua_api_key_aqui"
  }
}
```

### 2. Configuração de Webhook Seguro

```javascript
// Função para calcular assinatura HMAC
function calculateWebhookSignature(payload, secret) {
  const crypto = require('crypto');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return `sha256=${signature}`;
}

// Headers para requisições seguras
const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': '{{$env.IMOBIPRO_API_KEY}}',
  'X-Webhook-Signature': calculateWebhookSignature($json, '{{$env.WEBHOOK_SECRET}}')
};
```

## 🔄 Workflows Básicos

### 1. Workflow: Agendamento via WhatsApp

**Descrição**: Automatiza agendamentos quando cliente envia mensagem no WhatsApp.

**Trigger**: WhatsApp Business API

**Fluxo**:
1. Recebe mensagem WhatsApp
2. Processa linguagem natural para extrair dados
3. Verifica disponibilidade
4. Cria agendamento
5. Confirma por WhatsApp

```json
{
  "nodes": [
    {
      "name": "WhatsApp Trigger",
      "type": "n8n-nodes-base.whatsApp",
      "parameters": {
        "events": ["message.received"]
      }
    },
    {
      "name": "Extract Appointment Data",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": `
          // Processa mensagem com NLP simples
          const message = $json.message.body;
          const phone = $json.from;
          
          // Regex patterns para extrair informações
          const datePattern = /(\\d{1,2})\\/(\\d{1,2})(?:\\/(\\d{4}))?/;
          const timePattern = /(\\d{1,2}):(\\d{2})|às (\\d{1,2})h/;
          
          let appointmentData = {
            source: "whatsapp",
            sourceId: phone,
            appointmentData: {
              title: "Visita agendada via WhatsApp",
              type: "VISIT",
              duration: 60,
              contact: {
                phone: phone.replace("@c.us", ""),
                name: $json.pushname || "Cliente WhatsApp"
              },
              notes: \`Mensagem original: \${message}\`,
              tags: ["whatsapp", "auto_booking"]
            }
          };
          
          // Extrai data se encontrada
          const dateMatch = message.match(datePattern);
          if (dateMatch) {
            const day = dateMatch[1];
            const month = dateMatch[2];
            const year = dateMatch[3] || new Date().getFullYear();
            
            // Extrai horário
            const timeMatch = message.match(timePattern);
            let hour = 14, minute = 0; // Default 14:00
            
            if (timeMatch) {
              hour = parseInt(timeMatch[1] || timeMatch[3]);
              minute = parseInt(timeMatch[2] || 0);
            }
            
            const appointmentDate = new Date(year, month-1, day, hour, minute);
            appointmentData.appointmentData.preferredDateTime = appointmentDate.toISOString();
          } else {
            // Se não há data específica, agenda para próximo dia útil às 14:00
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(14, 0, 0, 0);
            appointmentData.appointmentData.preferredDateTime = tomorrow.toISOString();
          }
          
          return appointmentData;
        `
      }
    },
    {
      "name": "Check Availability",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://api.imobipro.com/v1/webhooks/n8n/appointments/availability",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "X-Webhook-Signature",
              "value": "={{$evaluateExpression(calculateWebhookSignature($json, $env.WEBHOOK_SECRET))}}"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "agentIds",
              "value": "=['agent_auto']"
            },
            {
              "name": "dateFrom", 
              "value": "={{$json.appointmentData.preferredDateTime}}"
            },
            {
              "name": "duration",
              "value": "={{$json.appointmentData.duration}}"
            }
          ]
        }
      }
    },
    {
      "name": "Create Appointment",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://api.imobipro.com/v1/webhooks/n8n/appointments",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "httpHeaderAuth"
      }
    },
    {
      "name": "Send Confirmation",
      "type": "n8n-nodes-base.whatsApp",
      "parameters": {
        "operation": "sendMessage",
        "to": "={{$('WhatsApp Trigger').item.json.from}}",
        "message": "🏠 *Agendamento Confirmado!* \\n\\n📅 Data: {{$json.date}}\\n🕐 Horário: {{$json.time}}\\n👤 Corretor: {{$json.agent.name}}\\n\\n✅ Você receberá um lembrete 1 hora antes!\\n\\nPara reagendar, responda: *REAGENDAR*"
      }
    }
  ]
}
```

### 2. Workflow: Lembretes Automáticos

**Descrição**: Envia lembretes automáticos 24h e 1h antes dos agendamentos.

**Trigger**: Cron Schedule

```json
{
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "cronExpression": "0 */15 * * * *"
      }
    },
    {
      "name": "Get Upcoming Appointments", 
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "GET",
        "url": "https://api.imobipro.com/v1/appointments",
        "qs": {
          "status": "CONFIRMED",
          "dateFrom": "{{DateTime.now().toISO()}}",
          "dateTo": "{{DateTime.now().plus({hours: 25}).toISO()}}"
        }
      }
    },
    {
      "name": "Filter Reminder Candidates",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": `
          const appointments = $json.appointments;
          const now = new Date();
          const reminderCandidates = [];
          
          appointments.forEach(apt => {
            const aptDate = new Date(apt.date);
            const hoursUntil = (aptDate - now) / (1000 * 60 * 60);
            
            // 24h reminder
            if (hoursUntil <= 24 && hoursUntil > 23.5) {
              reminderCandidates.push({
                ...apt,
                reminderType: '24h',
                message: \`🏠 *Lembrete: Visita Agendada*\\n\\n📅 Amanhã às \${aptDate.toLocaleTimeString()}\\n🏡 Imóvel: \${apt.property?.title}\\n📍 Local: \${apt.property?.address}\\n\\nVocê confirma presença? Responda SIM ou NÃO\`
              });
            }
            
            // 1h reminder  
            if (hoursUntil <= 1 && hoursUntil > 0.5) {
              reminderCandidates.push({
                ...apt,
                reminderType: '1h',
                message: \`⏰ *Sua visita é em 1 hora!*\\n\\n🏡 \${apt.property?.title}\\n📍 \${apt.property?.address}\\n👤 Corretor: \${apt.agent.name}\\n📱 Tel: \${apt.agent.phone}\\n\\nNos vemos lá! 😊\`
              });
            }
          });
          
          return reminderCandidates;
        `
      }
    },
    {
      "name": "Send WhatsApp Reminders",
      "type": "n8n-nodes-base.whatsApp",
      "parameters": {
        "operation": "sendMessage",
        "to": "={{$json.contact.phone}}",
        "message": "={{$json.message}}"
      }
    }
  ]
}
```

## 🚀 Workflows Avançados

### 3. Workflow: Resolução Inteligente de Conflitos

**Descrição**: Automatiza resolução de conflitos de agenda usando IA.

**Trigger**: Webhook do ImobiPRO (conflict.detected)

```json
{
  "nodes": [
    {
      "name": "Conflict Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "imobipro-conflict-resolver",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Analyze Conflict",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": `
          const conflictData = $json.data;
          const severity = conflictData.severity;
          const appointments = conflictData.conflictingAppointments;
          
          // Estratégias baseadas na severidade
          let strategy = {};
          
          switch(severity) {
            case 'low':
              strategy = {
                action: 'auto_reschedule',
                priority: 'least_important',
                notifyAgent: false
              };
              break;
              
            case 'medium':
              strategy = {
                action: 'suggest_alternatives',
                contactClient: true,
                offerIncentive: false
              };
              break;
              
            case 'high':
              strategy = {
                action: 'manual_review',
                notifyAgent: true,
                urgentFlag: true,
                escalate: true
              };
              break;
              
            case 'critical':
              strategy = {
                action: 'immediate_intervention',
                notifyManager: true,
                callClient: true,
                compensationOffer: true
              };
              break;
          }
          
          return {
            conflict: conflictData,
            strategy: strategy,
            timestamp: new Date().toISOString()
          };
        `
      }
    },
    {
      "name": "Execute Resolution Strategy",
      "type": "n8n-nodes-base.switch",
      "parameters": {
        "values": [
          {
            "conditions": {
              "string": [
                {
                  "value1": "={{$json.strategy.action}}",
                  "value2": "auto_reschedule"
                }
              ]
            }
          },
          {
            "conditions": {
              "string": [
                {
                  "value1": "={{$json.strategy.action}}",
                  "value2": "suggest_alternatives"
                }
              ]
            }
          },
          {
            "conditions": {
              "string": [
                {
                  "value1": "={{$json.strategy.action}}",
                  "value2": "manual_review"
                }
              ]
            }
          }
        ]
      }
    },
    {
      "name": "Auto Reschedule",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "PUT",
        "url": "https://api.imobipro.com/v1/webhooks/n8n/appointments/{{$json.conflict.conflictingAppointments[0]}}/reschedule",
        "body": {
          "newDateTime": "{{DateTime.fromISO($json.conflict.suggestedAlternatives[0].startTime).toISO()}}",
          "reason": "Reagendamento automático por conflito de agenda",
          "source": "n8n_auto_resolver"
        }
      }
    },
    {
      "name": "Suggest Alternatives to Client",
      "type": "n8n-nodes-base.whatsApp",
      "parameters": {
        "operation": "sendMessage",
        "message": "⚠️ *Precisamos reagendar sua visita*\\n\\nDetectamos um conflito em sua agenda. Veja as alternativas:\\n\\n⏰ Opção 1: {{$json.alternatives[0]}}\\n⏰ Opção 2: {{$json.alternatives[1]}}\\n⏰ Opção 3: {{$json.alternatives[2]}}\\n\\nResponda com o número da opção preferida!"
      }
    }
  ]
}
```

### 4. Workflow: Sincronização Google Calendar

**Descrição**: Mantém sincronização bidirecional com Google Calendar.

**Trigger**: Schedule + Webhook

```json
{
  "nodes": [
    {
      "name": "Sync Trigger",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "cronExpression": "0 */5 * * * *"
      }
    },
    {
      "name": "Get Active Agents",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "GET",
        "url": "https://api.imobipro.com/v1/agents",
        "qs": {
          "status": "active",
          "hasGoogleCalendar": "true"
        }
      }
    },
    {
      "name": "Process Each Agent",
      "type": "n8n-nodes-base.splitInBatches",
      "parameters": {
        "batchSize": 1
      }
    },
    {
      "name": "Get Google Calendar Events",
      "type": "n8n-nodes-base.googleCalendar",
      "parameters": {
        "operation": "getAll",
        "calendar": "={{$json.googleCalendarId}}",
        "start": "={{DateTime.now().toISO()}}",
        "end": "={{DateTime.now().plus({days: 7}).toISO()}}",
        "singleEvents": true
      }
    },
    {
      "name": "Compare with ImobiPRO",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": `
          const googleEvents = $('Get Google Calendar Events').all();
          const agentData = $json;
          
          // Busca agendamentos ImobiPRO para comparação
          const imobiproAppointments = []; // Seria obtido via API
          
          const syncActions = [];
          
          // Verifica eventos do Google que não existem no ImobiPRO
          googleEvents.forEach(event => {
            const existsInImobiPRO = imobiproAppointments.find(apt => 
              apt.googleCalendarEventId === event.id
            );
            
            if (!existsInImobiPRO && event.summary.includes('[ImobiPRO]')) {
              syncActions.push({
                action: 'create_in_imobipro',
                event: event,
                agentId: agentData.id
              });
            }
          });
          
          // Verifica agendamentos ImobiPRO que não existem no Google
          imobiproAppointments.forEach(apt => {
            const existsInGoogle = googleEvents.find(event => 
              event.id === apt.googleCalendarEventId
            );
            
            if (!existsInGoogle) {
              syncActions.push({
                action: 'create_in_google',
                appointment: apt,
                agentId: agentData.id
              });
            }
          });
          
          return { syncActions, agentId: agentData.id };
        `
      }
    },
    {
      "name": "Execute Sync Actions",
      "type": "n8n-nodes-base.switch",
      "parameters": {
        "values": [
          {
            "conditions": {
              "string": [
                {
                  "value1": "={{$json.action}}",
                  "value2": "create_in_imobipro"
                }
              ]
            }
          },
          {
            "conditions": {
              "string": [
                {
                  "value1": "={{$json.action}}",
                  "value2": "create_in_google"
                }
              ]
            }
          }
        ]
      }
    },
    {
      "name": "Create in ImobiPRO",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://api.imobipro.com/v1/appointments",
        "body": {
          "title": "={{$json.event.summary}}",
          "date": "={{$json.event.start.dateTime}}",
          "duration": "={{DateTime.fromISO($json.event.end.dateTime).diff(DateTime.fromISO($json.event.start.dateTime), 'minutes').minutes}}",
          "agentId": "={{$json.agentId}}",
          "type": "MEETING",
          "source": "google_calendar",
          "googleCalendarEventId": "={{$json.event.id}}"
        }
      }
    },
    {
      "name": "Create in Google Calendar",
      "type": "n8n-nodes-base.googleCalendar",
      "parameters": {
        "operation": "create",
        "calendar": "primary",
        "summary": "[ImobiPRO] {{$json.appointment.title}}",
        "start": "={{$json.appointment.date}}",
        "end": "={{DateTime.fromISO($json.appointment.date).plus({minutes: $json.appointment.duration}).toISO()}}",
        "description": "Agendamento ImobiPRO - {{$json.appointment.notes}}"
      }
    }
  ]
}
```

## ⚠️ Tratamento de Erros

### Estratégias de Retry e Fallback

```json
{
  "name": "Error Handler",
  "type": "n8n-nodes-base.code",
  "parameters": {
    "jsCode": `
      const error = $json.error;
      const retryCount = $json.retryCount || 0;
      const maxRetries = 3;
      
      // Estratégias baseadas no tipo de erro
      const errorStrategies = {
        'RATE_LIMIT': {
          retry: true,
          delay: Math.pow(2, retryCount) * 1000, // Exponential backoff
          maxRetries: 5
        },
        
        'SCHEDULE_CONFLICT': {
          retry: false,
          fallback: 'suggest_alternatives',
          notifyAgent: true
        },
        
        'VALIDATION_ERROR': {
          retry: false,
          fallback: 'manual_review',
          notifyDev: true
        },
        
        'NETWORK_ERROR': {
          retry: true,
          delay: 5000,
          maxRetries: 3
        },
        
        'AUTH_ERROR': {
          retry: false,
          fallback: 'refresh_token',
          urgent: true
        }
      };
      
      const strategy = errorStrategies[error.code] || {
        retry: false,
        fallback: 'manual_review'
      };
      
      return {
        shouldRetry: strategy.retry && retryCount < (strategy.maxRetries || maxRetries),
        delay: strategy.delay || 1000,
        fallbackAction: strategy.fallback,
        notifyAgent: strategy.notifyAgent || false,
        notifyDev: strategy.notifyDev || false,
        urgent: strategy.urgent || false,
        retryCount: retryCount + 1
      };
    `
  }
}
```

### Dead Letter Queue Handler

```json
{
  "name": "Dead Letter Handler",
  "type": "n8n-nodes-base.code", 
  "parameters": {
    "jsCode": `
      const failedWebhook = $json;
      const timestamp = new Date().toISOString();
      
      // Log para análise posterior
      const deadLetterEntry = {
        id: \`dl_\${Date.now()}\`,
        originalWebhook: failedWebhook,
        failureReason: failedWebhook.lastError,
        retryAttempts: failedWebhook.retryCount,
        timestamp: timestamp,
        priority: failedWebhook.urgent ? 'high' : 'medium'
      };
      
      // Notifica equipe técnica
      const notification = {
        type: 'dead_letter_webhook',
        message: \`⚠️ Webhook falhou após \${failedWebhook.retryCount} tentativas\\n\\nTipo: \${failedWebhook.type}\\nErro: \${failedWebhook.lastError}\\nID: \${deadLetterEntry.id}\`,
        priority: deadLetterEntry.priority,
        channel: '#dev-alerts'
      };
      
      return {
        deadLetterEntry: deadLetterEntry,
        notification: notification,
        requiresManualIntervention: true
      };
    `
  }
}
```

## 📊 Monitoramento e Logs

### Workflow de Métricas

```json
{
  "name": "Metrics Collector",
  "type": "n8n-nodes-base.cron",
  "parameters": {
    "cronExpression": "0 */10 * * * *"
  },
  "connections": [
    {
      "name": "Collect API Metrics",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "GET",
        "url": "https://api.imobipro.com/v1/metrics"
      }
    },
    {
      "name": "Process Metrics",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": `
          const metrics = $json;
          const timestamp = new Date().toISOString();
          
          // Calcula KPIs importantes
          const kpis = {
            appointmentSuccessRate: (metrics.appointments.completed / metrics.appointments.total) * 100,
            webhookDeliveryRate: (metrics.webhooks.delivered / (metrics.webhooks.delivered + metrics.webhooks.failed)) * 100,
            averageResponseTime: metrics.api.averageResponseTime,
            errorRate: metrics.api.errorsByType.total / metrics.api.totalRequests * 100,
            calendarSyncHealth: metrics.calendar.syncErrors === 0 ? 100 : 80
          };
          
          // Alertas automáticos
          const alerts = [];
          
          if (kpis.appointmentSuccessRate < 85) {
            alerts.push({
              type: 'low_success_rate',
              message: \`Taxa de sucesso de agendamentos baixa: \${kpis.appointmentSuccessRate.toFixed(2)}%\`,
              severity: 'medium'
            });
          }
          
          if (kpis.errorRate > 5) {
            alerts.push({
              type: 'high_error_rate',
              message: \`Taxa de erro alta: \${kpis.errorRate.toFixed(2)}%\`,
              severity: 'high'
            });
          }
          
          if (kpis.averageResponseTime > 2000) {
            alerts.push({
              type: 'slow_response',
              message: \`Tempo de resposta alto: \${kpis.averageResponseTime}ms\`,
              severity: 'medium'
            });
          }
          
          return {
            timestamp: timestamp,
            kpis: kpis,
            alerts: alerts,
            rawMetrics: metrics
          };
        `
      }
    },
    {
      "name": "Send to Analytics",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://analytics.imobipro.com/api/metrics",
        "body": "={{$json}}"
      }
    },
    {
      "name": "Alert on Issues",
      "type": "n8n-nodes-base.slack",
      "parameters": {
        "operation": "postMessage",
        "channel": "#alerts",
        "text": "={{$json.alerts.length > 0 ? '🚨 Alertas ImobiPRO API:\\n' + $json.alerts.map(a => `• ${a.message}`).join('\\n') : '✅ Todos os sistemas funcionando normalmente'}}"
      }
    }
  ]
}
```

## 📦 Exemplos de Payload

### Webhook de Agendamento Completo

```json
{
  "source": "whatsapp",
  "sourceId": "5511999998888@c.us",
  "webhookId": "wh_12345_abcdef",
  "retryCount": 0,
  "appointmentData": {
    "title": "Visita - Apartamento Vila Madalena",
    "description": "Cliente interessado em apartamento de 2 quartos com sacada",
    "type": "VISIT",
    "preferredDateTime": "2024-03-15T14:30:00Z",
    "alternativeDateTime": "2024-03-16T10:00:00Z",
    "duration": 60,
    "priority": "medium",
    "autoConfirm": false,
    "conflictResolution": "manual_review",
    "contact": {
      "name": "Carlos Eduardo Silva",
      "phone": "11999998888",
      "email": "carlos@email.com",
      "document": "123.456.789-00",
      "notes": "Cliente indicado pela Maria Santos"
    },
    "property": {
      "id": "prop_vila_madalena_456",
      "externalId": "VM-2024-001"
    },
    "agent": {
      "autoAssign": true,
      "assignmentCriteria": {
        "propertyType": "APARTMENT",
        "location": "Vila Madalena",
        "priority": "medium",
        "workload": "balanced"
      }
    },
    "notes": "Cliente já visitou 3 imóveis similares. Demonstrou interesse real. Orçamento até R$ 650.000. Financiamento já pré-aprovado no Banco do Brasil.",
    "tags": [
      "whatsapp",
      "lead_qualificado", 
      "pre_aprovado",
      "vila_madalena",
      "apartamento_2q"
    ],
    "customFields": {
      "leadScore": 85,
      "budgetMax": 650000,
      "financingPreApproved": true,
      "bankName": "Banco do Brasil",
      "timelineToDecision": "30_days",
      "referralSource": "maria_santos",
      "viewedProperties": 3,
      "urgencyLevel": "medium"
    }
  },
  "metadata": {
    "chatId": "5511999998888@c.us",
    "workflowExecutionId": "exec_n8n_789012",
    "messageId": "msg_whatsapp_345",
    "conversationHistory": 5,
    "userAgent": "WhatsApp/2.23.20",
    "receivedAt": "2024-03-12T10:15:30Z",
    "processedAt": "2024-03-12T10:15:32Z",
    "environment": "production"
  }
}
```

### Resposta de Conflito Detalhada

```json
{
  "error": "SCHEDULE_CONFLICT",
  "message": "Conflito de horário detectado",
  "code": "409",
  "timestamp": "2024-03-12T10:15:35Z",
  "path": "/api/v1/webhooks/n8n/appointments",
  "requestId": "req_12345_abcdef",
  "conflictDetails": {
    "conflictingAppointments": [
      {
        "id": "apt_existing_789",
        "title": "Reunião - Apresentação de Portfólio",
        "date": "2024-03-15T14:30:00Z",
        "duration": 90,
        "type": "MEETING",
        "status": "CONFIRMED",
        "agentName": "Ana Carolina",
        "contactName": "Roberto Silva",
        "priority": "high",
        "canBeRescheduled": false,
        "reason": "Cliente VIP - reunião com CEO"
      }
    ],
    "suggestedAlternatives": [
      {
        "startTime": "2024-03-15T16:00:00Z",
        "endTime": "2024-03-15T17:00:00Z",
        "agentId": "agent_ana_carolina",
        "confidence": 0.95,
        "reason": "Slot livre após reunião atual"
      },
      {
        "startTime": "2024-03-16T10:00:00Z", 
        "endTime": "2024-03-16T11:00:00Z",
        "agentId": "agent_ana_carolina",
        "confidence": 0.90,
        "reason": "Horário alternativo sugerido pelo cliente"
      },
      {
        "startTime": "2024-03-15T14:30:00Z",
        "endTime": "2024-03-15T15:30:00Z", 
        "agentId": "agent_marcos_santos",
        "confidence": 0.80,
        "reason": "Agente alternativo especializado em Vila Madalena"
      }
    ],
    "resolutionOptions": [
      "suggest_alternatives",
      "assign_different_agent",
      "manual_review"
    ],
    "impactAnalysis": {
      "affectedParties": ["new_client", "existing_client"],
      "businessImpact": "medium",
      "urgencyLevel": "high",
      "estimatedResolutionTime": "15_minutes"
    }
  },
  "retryAfter": 300,
  "details": {
    "conflictType": "agent_double_booking",
    "detectionMethod": "automatic",
    "detectedAt": "2024-03-12T10:15:34Z",
    "possibleCauses": [
      "manual_booking_parallel_to_webhook",
      "calendar_sync_delay",
      "race_condition"
    ]
  }
}
```

### Trigger de Sincronização de Calendário

```json
{
  "event": "calendar.sync.completed",
  "timestamp": "2024-03-12T10:20:00Z",
  "data": {
    "syncId": "sync_cal_67890",
    "calendarProvider": "google",
    "agentId": "agent_ana_carolina",
    "eventsProcessed": 15,
    "eventsCreated": 3,
    "eventsUpdated": 2,
    "eventsDeleted": 1,
    "syncDuration": 2.5,
    "errors": [
      {
        "eventId": "gcal_event_123",
        "error": "Event title too long for ImobiPRO format",
        "severity": "warning",
        "resolution": "Title truncated to 200 characters"
      }
    ],
    "statistics": {
      "successRate": 93.3,
      "totalDuration": "2.5s",
      "averageEventProcessingTime": "166ms",
      "apiCallsUsed": 23,
      "quotaRemaining": 9977
    }
  },
  "metadata": {
    "triggeredBy": "scheduled_sync",
    "source": "calendar_sync_service",
    "workflowId": "sync_calendar_workflow",
    "retryCount": 0,
    "correlationId": "corr_sync_12345",
    "environment": "production",
    "version": "1.2.0"
  }
}
```

## 🔧 Configurações Avançadas

### Rate Limiting Inteligente

```javascript
// Implementar backoff adaptativo baseado na resposta da API
function calculateBackoffDelay(retryCount, lastError, baseDelay = 1000) {
  const maxDelay = 60000; // 1 minuto máximo
  
  if (lastError?.code === 'RATE_LIMIT') {
    // Para rate limiting, usa header Retry-After se disponível
    const retryAfter = lastError.headers?.['retry-after'];
    if (retryAfter) {
      return parseInt(retryAfter) * 1000;
    }
  }
  
  // Backoff exponencial com jitter
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  const jitter = Math.random() * 0.1 * exponentialDelay;
  
  return exponentialDelay + jitter;
}
```

### Validação de Webhook Signature

```javascript
// Validar assinatura HMAC para segurança
function validateWebhookSignature(payload, signature, secret) {
  const crypto = require('crypto');
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  const providedSignature = signature.replace('sha256=', '');
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(providedSignature, 'hex')
  );
}
```

Este documento fornece uma base sólida para implementar integrações robustas entre n8n e o ImobiPRO, cobrindo desde workflows básicos até cenários complexos de automação imobiliária.