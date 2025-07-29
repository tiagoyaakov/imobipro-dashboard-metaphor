# 🔲 ImobiPRO - Integração n8n para Módulo de Leads

## 📋 Visão Geral

Este documento descreve a integração completa entre o módulo de leads do ImobiPRO e o n8n para automação de processos de captação e gestão de leads.

## 🚀 Funcionalidades Implementadas

### ✅ Criação Automática de Leads
- **Webhook Endpoint**: Recebe leads de múltiplas fontes via n8n
- **Validação Completa**: Schemas Zod para validação robusta
- **Atribuição Automática**: Sistema inteligente de distribuição de leads
- **Dados Reais**: Integração direta com Supabase
- **Scoring Automático**: Cálculo de score baseado em múltiplos fatores

### ✅ Estrutura de Dados Compatível
- **Schemas n8n**: Validação TypeScript completa
- **Conversão de Formatos**: Compatibilidade entre dashboard e n8n
- **Metadados de Rastreamento**: Correlação entre workflows
- **Campos Customizados**: Suporte a dados adicionais

### ✅ Automações Disponíveis
- **Triggers de Eventos**: Lead criado, atualizado, qualificado, convertido
- **Webhooks Bidirecionais**: Entrada e saída de dados
- **Bulk Operations**: Processamento em lote de leads
- **Atividades Automáticas**: Registro de interações

## 🛠️ Arquivos Principais

### Schemas e Validação
```
src/schemas/n8n-leads-schemas.ts
├── N8nLeadWebhookSchema       # Validação de entrada
├── LeadResponseSchema         # Formato de resposta
├── LeadTriggerSchemas        # Eventos para n8n
└── Utility Functions         # Conversores e validadores
```

### Serviços de Integração
```
src/services/n8nLeadsService.ts
├── processLeadWebhook()      # Processa webhooks de entrada
├── processActivityWebhook()  # Processa atividades
├── triggerN8nWorkflows()     # Dispara workflows
└── Auto-assignment Logic     # Atribuição inteligente
```

### Hooks React Query
```
src/hooks/useN8nLeads.ts
├── useCreateLeadViaWebhook() # Criação via webhook
├── useCreateLeadCompatible() # Compatibilidade
├── useN8nLeadsManagement()   # Gestão completa
└── useTestN8nWebhook()       # Testes de integração
```

## 📡 Endpoints de Webhook

### POST /api/webhooks/leads/create
Cria novo lead via n8n

**Payload Exemplo:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "(11) 99999-9999",
  "leadSource": "WhatsApp",
  "leadSourceDetails": "Bot automático",
  "budget": 500000,
  "timeline": "3-6 meses",
  "preferences": {
    "propertyType": "APARTMENT",
    "location": "Centro",
    "bedrooms": 3
  },
  "tags": ["VIP", "Bot"],
  "priority": "HIGH",
  "autoAssign": true,
  "n8nWorkflowId": "workflow_123",
  "n8nExecutionId": "exec_456",
  "correlationId": "lead_789"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "lead_uuid",
    "name": "João Silva",
    "leadStage": "NEW",
    "leadScore": 75,
    "agentId": "agent_uuid",
    "agent": {
      "id": "agent_uuid",
      "name": "Ana Corretora",
      "email": "ana@imobiliaria.com"
    },
    "autoAssigned": true,
    "assignmentScore": 0.85,
    "assignmentReason": "Especialização em apartamentos na região",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "processingTime": 245,
  "webhookId": "webhook_123456"
}
```

### POST /api/webhooks/leads/activity
Registra atividade de lead

**Payload Exemplo:**
```json
{
  "contactId": "lead_uuid",
  "type": "WHATSAPP",
  "title": "Mensagem automática enviada",
  "description": "Mensagem de boas-vindas via bot",
  "direction": "OUTBOUND",
  "channel": "WhatsApp Bot",
  "metadata": {
    "messageId": "msg_123",
    "campaignId": "camp_456"
  },
  "n8nWorkflowId": "workflow_123"
}
```

## 📊 Eventos Disparados para n8n

### lead.created
Disparado quando um novo lead é criado

```json
{
  "event": "lead.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": { /* LeadResponse */ },
  "metadata": {
    "triggeredBy": "imobipro_system",
    "source": "leads_module",
    "correlationId": "lead_789"
  }
}
```

### lead.stage_changed
Disparado quando lead muda de estágio

```json
{
  "event": "lead.stage_changed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": { /* LeadResponse */ },
  "changes": {
    "previous": { "leadStage": "NEW" },
    "current": { "leadStage": "CONTACTED" }
  }
}
```

### lead.qualified
Disparado quando lead é qualificado

```json
{
  "event": "lead.qualified",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": { /* LeadResponse */ },
  "qualification": {
    "score": 85,
    "qualifiedBy": "agent_uuid",
    "meetsCriteria": ["budget_aligned", "timeline_urgent"],
    "nextActions": ["schedule_visit", "send_proposal"]
  }
}
```

## 🔧 Configuração no n8n

### 1. Webhook de Entrada (Captura de Leads)
```javascript
// Node: Webhook
// Method: POST
// Path: /webhook/imobipro/lead/create

// Node: Function - Transformar Dados
const leadData = {
  name: $json.nome || $json.name,
  email: $json.email,
  phone: $json.telefone || $json.phone,
  leadSource: $json.origem || 'N8N_AUTOMATION',
  budget: parseInt($json.orcamento || 0),
  timeline: $json.prazo || 'Indeterminado',
  preferences: {
    propertyType: $json.tipo_imovel,
    location: $json.localizacao
  },
  autoAssign: true,
  n8nWorkflowId: $workflow.id,
  n8nExecutionId: $execution.id
};

return { leadData };
```

### 2. HTTP Request para ImobiPRO
```javascript
// Node: HTTP Request
// Method: POST
// URL: https://sua-api.imobipro.com/api/webhooks/leads/create
// Headers: 
//   Content-Type: application/json
//   Authorization: Bearer YOUR_API_TOKEN

// Body: {{ $json.leadData }}
```

### 3. Processar Resposta
```javascript
// Node: Function - Processar Resposta
const response = $json;

if (response.success) {
  return {
    leadId: response.data.id,
    agentName: response.data.agent?.name,
    leadScore: response.data.leadScore,
    processingTime: response.processingTime
  };
} else {
  throw new Error(`Erro ao criar lead: ${response.error}`);
}
```

## 🎯 Casos de Uso Automação

### 1. Captura de Lead via WhatsApp Bot
```
WhatsApp Bot → n8n Webhook → ImobiPRO API
└── Cria lead automaticamente
└── Atribui ao melhor corretor
└── Envia mensagem de boas-vindas
└── Agenda follow-up automático
```

### 2. Lead Scoring Automático
```
Novo Lead → Calcula Score → Se Score > 80
└── Marca como VIP
└── Notifica corretor via WhatsApp
└── Agenda ligação urgente
```

### 3. Nurturing Automático
```
Lead Inativo por 7 dias → n8n Schedule
└── Envia email personalizado
└── Registra atividade no CRM
└── Se não responder em 3 dias → Envia WhatsApp
```

### 4. Conversão de Lead
```
Lead Status = "CONVERTED" → Trigger n8n
└── Remove de campanhas ativas
└── Adiciona à lista de clientes
└── Inicia processo pós-venda
└── Notifica equipe comercial
```

## ⚡ Performance e Monitoramento

### Métricas Rastreadas
- **Processing Time**: Tempo de processamento do webhook
- **Success Rate**: Taxa de sucesso das integrações
- **Assignment Score**: Qualidade da atribuição automática
- **Conversion Tracking**: Rastreamento de conversões

### Logs e Debug
```javascript
// Exemplo de log estruturado
console.log('n8n Lead Processing:', {
  webhookId: 'webhook_123456',
  leadId: 'lead_uuid',
  processingTime: 245,
  agentAssigned: 'Ana Corretora',
  score: 75,
  source: 'WhatsApp Bot'
});
```

## 🚨 Tratamento de Erros

### Erros Comuns e Soluções

**400 - Dados Inválidos**
- Verificar schema de validação
- Conferir campos obrigatórios
- Validar tipos de dados

**404 - Agente Não Encontrado**
- Verificar se agentId existe
- Habilitar autoAssign como fallback

**500 - Erro Interno**
- Verificar logs do Supabase
- Verificar conectividade
- Verificar permissões de API

### Retry Logic
```javascript
// Node: n8n - Error Trigger
if ($json.error && $json.retryCount < 3) {
  return {
    retry: true,
    retryCount: ($json.retryCount || 0) + 1,
    delay: Math.pow(2, $json.retryCount || 0) * 1000 // Exponential backoff
  };
}
```

## 🔐 Segurança

### Autenticação
- API Keys para webhooks
- Rate limiting
- IP whitelist para n8n

### Validação
- Schemas Zod obrigatórios
- Sanitização de dados
- Verificação de duplicatas

### Auditoria
- Logs de todas as operações
- Correlation IDs para rastreamento
- Metadados de origem

## 📚 Exemplos Práticos

Ver pasta `examples/n8n-workflows/` para workflows prontos:
- `lead-capture-whatsapp.json`
- `lead-scoring-automation.json`
- `nurturing-sequence.json`
- `conversion-tracking.json`

## 🤝 Contribuição

Para adicionar novas automações:
1. Criar schema de validação
2. Implementar endpoint de webhook
3. Adicionar hook React Query
4. Documentar caso de uso
5. Criar workflow exemplo

---

**Versão**: 1.0.0  
**Última Atualização**: Janeiro 2024  
**Autor**: ImobiPRO Team