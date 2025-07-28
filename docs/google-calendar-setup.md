# 🗓️ Configuração Google Calendar - ImobiPRO

Este documento detalha como configurar a integração completa com Google Calendar, incluindo OAuth 2.0, API, e webhooks.

## 📋 Índice

1. [Configuração Google Console](#configuração-google-console)
2. [Variáveis de Ambiente](#variáveis-de-ambiente)
3. [Configuração OAuth](#configuração-oauth)
4. [Testes de Integração](#testes-de-integração)
5. [Troubleshooting](#troubleshooting)

---

## 🔧 Configuração Google Console

### 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em "Selecionar projeto" → "Novo projeto"
3. Nome: `ImobiPRO Calendar Integration`
4. Clique em "Criar"

### 2. Habilitar APIs Necessárias

```bash
# APIs que devem ser habilitadas:
- Google Calendar API
- Google+ API (para informações do usuário)
- People API (opcional, para contatos)
```

**Passo a passo:**
1. No menu lateral: "APIs e serviços" → "Biblioteca"
2. Buscar por "Google Calendar API" → "Ativar"
3. Buscar por "Google+ API" → "Ativar"

### 3. Configurar Tela de Consentimento OAuth

1. "APIs e serviços" → "Tela de consentimento OAuth"
2. Tipo de usuário: **Externo** (para produção) ou **Interno** (para desenvolvimento)
3. Preencher informações obrigatórias:
   - **Nome do app**: `ImobiPRO`
   - **Email de suporte**: `suporte@imobipro.com`
   - **Domínio autorizado**: `imobipro.com`
   - **Email do desenvolvedor**: `dev@imobipro.com`

4. **Escopos necessários**:
   ```
   https://www.googleapis.com/auth/calendar
   https://www.googleapis.com/auth/calendar.events
   openid
   email
   profile
   ```

5. **Usuários de teste** (apenas para desenvolvimento):
   - Adicionar emails dos usuários que irão testar

### 4. Criar Credenciais OAuth 2.0

1. "APIs e serviços" → "Credenciais"
2. "Criar credenciais" → "ID do cliente OAuth 2.0"
3. Tipo de aplicativo: **Aplicativo da Web**
4. Nome: `ImobiPRO Web Client`

5. **URIs de redirecionamento autorizados**:
   ```bash
   # Desenvolvimento
   http://localhost:8080/auth/google/callback
   
   # Produção
   https://imobipro.com/auth/google/callback
   https://app.imobipro.com/auth/google/callback
   
   # Staging (se houver)
   https://staging.imobipro.com/auth/google/callback
   ```

6. **Origens JavaScript autorizadas**:
   ```bash
   # Desenvolvimento
   http://localhost:8080
   
   # Produção
   https://imobipro.com
   https://app.imobipro.com
   
   # Staging
   https://staging.imobipro.com
   ```

7. Clique em "Criar" e **salve as credenciais**:
   - `Client ID`: `123456789-abcdef.apps.googleusercontent.com`
   - `Client Secret`: `GOCSPX-abcdef123456...`

---

## 🌐 Variáveis de Ambiente

### Arquivo `.env` (Desenvolvimento)

```bash
# ===== GOOGLE CALENDAR INTEGRATION =====
VITE_GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-abcdef123456789...

# ===== OPCIONAL - CUSTOMIZAÇÕES =====
VITE_GOOGLE_CALENDAR_SCOPES="https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events openid email profile"
VITE_GOOGLE_CALENDAR_TIMEOUT=30000
VITE_GOOGLE_CALENDAR_RETRY_ATTEMPTS=3

# ===== WEBHOOK CONFIGURATION =====
VITE_WEBHOOK_BASE_URL=https://imobipro.com/api/webhooks
VITE_GOOGLE_WEBHOOK_SECRET=seu-secret-super-seguro-aqui-123456

# ===== DEBUG (apenas desenvolvimento) =====
VITE_GOOGLE_CALENDAR_DEBUG=true
```

### Arquivo `.env.production` (Produção)

```bash
# ===== GOOGLE CALENDAR INTEGRATION - PRODUCTION =====
VITE_GOOGLE_CLIENT_ID=987654321-production.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-production123456789...

# ===== PRODUCTION SETTINGS =====
VITE_GOOGLE_CALENDAR_DEBUG=false
VITE_WEBHOOK_BASE_URL=https://app.imobipro.com/api/webhooks
VITE_GOOGLE_WEBHOOK_SECRET=production-secret-ultra-secure-2024

# ===== PERFORMANCE OPTIMIZATIONS =====
VITE_GOOGLE_CALENDAR_TIMEOUT=15000
VITE_GOOGLE_CALENDAR_RETRY_ATTEMPTS=2
```

### Configuração Vercel (Produção)

```bash
# No dashboard da Vercel, adicionar as variáveis:
VITE_GOOGLE_CLIENT_ID=valor-aqui
VITE_GOOGLE_CLIENT_SECRET=valor-aqui
VITE_WEBHOOK_BASE_URL=https://imobipro.vercel.app/api/webhooks
VITE_GOOGLE_WEBHOOK_SECRET=vercel-secret-2024
```

---

## 🔐 Configuração OAuth

### 1. Fluxo OAuth Implementado

```typescript
// Fluxo OAuth 2.0 Authorization Code
1. Frontend → Google Auth URL (com scopes)
2. User autoriza → Google redirect callback
3. Callback page → troca code por tokens
4. Salvar tokens → banco de dados (criptografado)
5. Usar tokens → chamadas API Calendar
```

### 2. URLs Importantes

```bash
# Endpoint de autorização
https://accounts.google.com/o/oauth2/v2/auth

# Endpoint de token
https://oauth2.googleapis.com/token

# Endpoint de revogação
https://oauth2.googleapis.com/revoke

# API Calendar
https://www.googleapis.com/calendar/v3/

# Callback configurado
https://imobipro.com/auth/google/callback
```

### 3. Scopes Utilizados

```bash
# Escopo mínimo necessário
https://www.googleapis.com/auth/calendar        # Acesso completo ao calendário
https://www.googleapis.com/auth/calendar.events # Apenas eventos (alternativa)

# Informações do usuário
openid           # ID do usuário Google
email            # Email do usuário
profile          # Nome e foto do usuário
```

---

## 🧪 Testes de Integração

### 1. Teste Manual de OAuth

```bash
# 1. Abrir aplicação em desenvolvimento
http://localhost:8080/agenda

# 2. Clicar em "Conectar Google Calendar"
# 3. Autorizar na tela do Google
# 4. Verificar redirecionamento para callback
# 5. Confirmar conexão bem-sucedida

# URLs de teste:
http://localhost:8080/auth/google/callback?code=4/test&state=eyJ0ZXN0IjoidHJ1ZSJ9
```

### 2. Teste de API com cURL

```bash
# Testar obtenção de token
curl -X POST https://oauth2.googleapis.com/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=SEU_CLIENT_ID" \
  -d "client_secret=SEU_CLIENT_SECRET" \
  -d "code=CODIGO_OBTIDO" \
  -d "grant_type=authorization_code" \
  -d "redirect_uri=http://localhost:8080/auth/google/callback"

# Testar listagem de calendários
curl -X GET "https://www.googleapis.com/calendar/v3/users/me/calendarList" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"

# Testar listagem de eventos
curl -X GET "https://www.googleapis.com/calendar/v3/calendars/primary/events" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

### 3. Testes Automatizados

```typescript
// src/tests/googleCalendar.test.ts
describe('Google Calendar Integration', () => {
  test('should initiate OAuth flow', () => {
    // Testar início do OAuth
  });
  
  test('should handle callback successfully', () => {
    // Testar processamento do callback
  });
  
  test('should refresh expired tokens', () => {
    // Testar renovação de tokens
  });
  
  test('should sync events bidirectionally', () => {
    // Testar sincronização
  });
});
```

---

## 🔍 Monitoramento e Logs

### 1. Logs Importantes

```typescript
// Logs que devem ser monitorados:
- OAuth successful authentications
- OAuth failed attempts
- Token refresh operations
- API calls rate limiting
- Sync operations results
- Webhook received events
```

### 2. Métricas de Sucesso

```bash
# KPIs importantes:
- Taxa de sucesso OAuth: > 95%
- Latência de sincronização: < 5s
- Uptime da integração: > 99.5%
- Eventos sincronizados/dia: monitorar
```

---

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. "OAuth Error (401): Invalid client"
```bash
# Solução:
- Verificar VITE_GOOGLE_CLIENT_ID
- Confirmar que o projeto está ativo no Google Console
- Verificar se as APIs estão habilitadas
```

#### 2. "Redirect URI mismatch"
```bash
# Solução:
- Verificar URIs de redirecionamento no Google Console
- Deve incluir exatamente: http://localhost:8080/auth/google/callback
- Para produção: https://imobipro.com/auth/google/callback
```

#### 3. "Scope not granted"
```bash
# Solução:
- Verificar scopes na tela de consentimento
- Re-aprovar app se mudou scopes
- Revogar e reconectar se necessário
```

#### 4. "Token expired" constante
```bash
# Solução:
- Verificar se refresh_token está sendo salvo
- Confirmar lógica de renovação automática
- Verificar se access_type=offline no OAuth
```

#### 5. "Calendar events not syncing"
```bash
# Solução:
- Verificar permissões do calendário
- Confirmar se usuário tem acesso de escrita
- Testar com calendar ID correto
```

### Comandos de Diagnóstico

```bash
# Verificar configuração atual
echo $VITE_GOOGLE_CLIENT_ID

# Testar conectividade Google APIs
curl -s https://www.googleapis.com/calendar/v3/colors

# Verificar status do OAuth
curl -s "https://oauth2.googleapis.com/tokeninfo?access_token=SEU_TOKEN"

# Validar redirect URI
curl -s "https://accounts.google.com/o/oauth2/v2/auth?client_id=SEU_CLIENT_ID&redirect_uri=http://localhost:8080/auth/google/callback&response_type=code&scope=openid"
```

---

## 📚 Recursos Adicionais

### Documentação Oficial
- [Google Calendar API](https://developers.google.com/calendar/api)
- [OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Calendar API Reference](https://developers.google.com/calendar/api/v3/reference)

### Ferramentas Úteis
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
- [JWT Debugger](https://jwt.io/)
- [Google API Explorer](https://developers.google.com/apis-explorer/)

---

## ✅ Checklist de Implementação

### Configuração Inicial
- [ ] Projeto criado no Google Cloud Console
- [ ] APIs habilitadas (Calendar API, Google+ API)
- [ ] Tela de consentimento configurada
- [ ] Credenciais OAuth criadas
- [ ] URIs de redirecionamento configurados

### Código
- [ ] Variáveis de ambiente configuradas
- [ ] Serviço Google Calendar implementado
- [ ] Hooks React Query criados
- [ ] Componentes UI implementados
- [ ] Página de callback criada
- [ ] Rota de callback adicionada

### Testes
- [ ] Fluxo OAuth testado manualmente
- [ ] Sync de eventos testado
- [ ] Tratamento de erros verificado
- [ ] Performance validada
- [ ] Testes automatizados criados

### Produção
- [ ] Variáveis de ambiente production configuradas
- [ ] URLs de produção adicionadas ao Google Console
- [ ] Monitoramento implementado
- [ ] Documentação atualizada
- [ ] Usuários finais treinados

---

**Status:** 🔄 **Implementação concluída - Aguardando configuração das credenciais**  
**Última atualização:** ${new Date().toISOString()}  
**Responsável:** Equipe ImobiPRO  

Para dúvidas ou problemas na configuração, consulte a equipe de desenvolvimento ou abra um issue no repositório.