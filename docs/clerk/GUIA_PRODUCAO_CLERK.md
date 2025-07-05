# 🚀 **Guia Completo - Clerk em Produção**

> **Como resolver o erro 401 Unauthorized e configurar adequadamente o Clerk para produção**

---

## 🚨 **PROBLEMA ATUAL**

- **Erro**: 401 Unauthorized ao registrar usuários
- **Console**: "development keys" detectadas em produção
- **Causa**: Chaves `pk_test_` sendo usadas no domínio de produção

---

## 🛠️ **SOLUÇÃO RÁPIDA (Para Testes)**

### **1. Configurar Paths no Clerk Dashboard:**

1. **Acessar Clerk Dashboard:** https://dashboard.clerk.com/
2. **Selecionar o projeto:** useful-mudfish-1 (ou seu projeto)
3. **Navegar para:** Configure → Paths
4. **Configurar campos:**

```
✅ Fallback development host: https://imobpro-brown.vercel.app
✅ Sign-in URL: /login
✅ Sign-up URL: /register
✅ User profile URL: /profile
✅ After sign-in URL: /dashboard
✅ After sign-up URL: /dashboard
```

### **2. Verificar Domains:**
- **Ir para:** Configure → Domains
- **Verificar se existe:** https://imobpro-brown.vercel.app
- **Se não existir:** Adicionar como domínio permitido

### **3. Verificar Variáveis de Ambiente na Vercel:**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_dXNlZnVsLW11ZGZpc2gtMS5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_UtCaJ7mDwyQhppEZd6srt4kdjBQ0JcgplFkXQtP0T8
VITE_CLERK_SIGN_IN_URL=/login
VITE_CLERK_SIGN_UP_URL=/register
VITE_CLERK_AFTER_SIGN_IN_URL=/dashboard
VITE_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### **4. Redeploy:**
```bash
# Forçar novo deploy na Vercel
vercel --prod
```

---

## 🏢 **SOLUÇÃO PARA PRODUÇÃO REAL**

### **Fase 1: Criar Instância de Produção**

1. **Dashboard Clerk**: https://dashboard.clerk.com/
2. **Clique** no dropdown "Development" (topo da página)
3. **Selecione**: "Create production instance"
4. **Configure**:
   - Nome: `ImobiPRO Production`
   - Domínio: Seu domínio customizado (ex: `imobipro.com`)
5. **Clone** as configurações da instância de desenvolvimento

### **Fase 2: Obter Chaves de Produção**

1. **Na instância de produção**, vá para `Configure > API Keys`
2. **Copie** as chaves que começam com:
   - `pk_live_...` (Publishable Key)
   - `sk_live_...` (Secret Key)

### **Fase 3: Configurar DNS (Necessário para domínio próprio)**

1. **No Clerk Dashboard**, vá para `Domains`
2. **Copie** os registros DNS necessários
3. **Configure** no seu provedor de DNS:
   ```
   Tipo: CNAME
   Nome: accounts
   Valor: accounts.clerk.services
   
   Tipo: CNAME  
   Nome: clerk
   Valor: clerk.{sua-instancia}.clerk.accounts.liveblocks.io
   ```

### **Fase 4: Configurar OAuth para Produção**

1. **Google Console**: https://console.cloud.google.com/
2. **Crie** credenciais OAuth 2.0
3. **Configure**:
   - JavaScript origins: `https://seudominio.com`
   - Redirect URIs: (obter do Clerk Dashboard)
4. **Atualize** no Clerk: `Configure > SSO Connections > Google`

### **Fase 5: Atualizar Produção**

1. **Vercel Environment Variables**:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_sua_chave_aqui
   CLERK_SECRET_KEY=sk_live_sua_chave_secreta
   ```
2. **Redeploy** a aplicação

---

## 🔧 **CONFIGURAÇÃO VERCEL ESPECÍFICA**

### **Para Domínio .vercel.app (Limitações)**

⚠️ **Importante**: Domínios `.vercel.app` têm limitações em produção:
- Não suportam chaves `pk_live_` diretamente
- Requerem configuração especial
- **Recomendação**: Use domínio próprio para produção real

### **Configuração Environment Variables**

```bash
# Development/Preview
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Production (apenas para domínio próprio)
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

---

## 🚀 **AÇÃO IMEDIATA RECOMENDADA**

### **Para Resolver Agora:**

1. **Configurar domínio Vercel no Clerk Development**:
   - Dashboard Clerk > Domains
   - Adicionar: `https://imobpro-brown.vercel.app`

2. **Verificar configuração atual**:
   ```bash
   # Verificar se as chaves estão corretas na Vercel
   # Settings > Environment Variables
   ```

3. **Redeploy**:
   - Forçar novo deploy na Vercel
   - Aguardar 2-3 minutos para propagação

### **Para Produção Futura:**

1. **Adquirir domínio próprio** (ex: `imobipro.com`)
2. **Configurar instância de produção** no Clerk
3. **Configurar DNS adequadamente**
4. **Obter OAuth credentials próprias**

---

## 📞 **CHECKLIST DE VERIFICAÇÃO**

- [ ] Domínio configurado no Clerk Dashboard
- [ ] Chaves corretas na Vercel Environment Variables
- [ ] Environment marcado como "Production"
- [ ] Deploy realizado após mudanças
- [ ] Teste de registro funcionando

---

## 🆘 **TROUBLESHOOTING**

### **Erro 401 Persiste:**
```bash
1. Verificar console do browser para erros específicos
2. Confirmar que domínio está exatamente igual no Clerk
3. Aguardar propagação (até 5 minutos)
4. Testar em aba anônima
```

### **"Development keys" ainda aparece:**
```bash
1. Verificar se as variáveis de ambiente foram salvas
2. Confirmar ambiente "Production" selecionado
3. Forçar redeploy completo
```

### **Registro não funciona:**
```bash
1. Verificar configuração de email no Clerk
2. Confirmar configurações de sign-up habilitadas
3. Testar com email diferente
```

---

**📝 Após resolver, documentar as configurações finais para referência futura.** 

# 🚨 **GUIA DE PRODUÇÃO - Clerk Authentication**

> **Solução definitiva para erro 401 Unauthorized em produção**

---

## 🔍 **PROBLEMA IDENTIFICADO**

### **Sintomas:**
- ✅ Login funciona perfeitamente
- ❌ Registro falha com erro 401 Unauthorized
- ❌ Nenhum email de confirmação enviado
- ❌ Usuário não é criado na base de dados

### **Erro no Console:**
```
GET https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/pat/[...] 401 (Unauthorized)
```

### **Causa Raiz:**
O problema está na configuração do **Clerk Dashboard** para o domínio de produção. Chaves de desenvolvimento (`pk_test_`) não funcionam corretamente em domínios de produção não configurados.

---

## 🛠️ **SOLUÇÃO RÁPIDA (Para Testes)**

### **1. Configurar Paths no Clerk Dashboard:**

1. **Acessar Clerk Dashboard:** https://dashboard.clerk.com/
2. **Selecionar o projeto:** useful-mudfish-1 (ou seu projeto)
3. **Navegar para:** Configure → Paths
4. **Configurar campos:**

```
✅ Fallback development host: https://imobpro-brown.vercel.app
✅ Sign-in URL: /login
✅ Sign-up URL: /register
✅ User profile URL: /profile
✅ After sign-in URL: /dashboard
✅ After sign-up URL: /dashboard
```

### **2. Verificar Domains:**
- **Ir para:** Configure → Domains
- **Verificar se existe:** https://imobpro-brown.vercel.app
- **Se não existir:** Adicionar como domínio permitido

### **3. Verificar Variáveis de Ambiente na Vercel:**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_dXNlZnVsLW11ZGZpc2gtMS5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_UtCaJ7mDwyQhppEZd6srt4kdjBQ0JcgplFkXQtP0T8
VITE_CLERK_SIGN_IN_URL=/login
VITE_CLERK_SIGN_UP_URL=/register
VITE_CLERK_AFTER_SIGN_IN_URL=/dashboard
VITE_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### **4. Redeploy:**
```bash
# Forçar novo deploy na Vercel
vercel --prod
```

---

## 🏗️ **SOLUÇÃO COMPLETA (Para Produção Real)**

### **1. Criar Instância de Produção:**

1. **No Clerk Dashboard:**
   - Create Application → Production
   - Nome: `ImobiPRO Dashboard - Production`
   - Tipo: `React`

2. **Configurar Domínio:**
   - Add Domain: `imobpro-brown.vercel.app`
   - Verificar SSL: ✅ Automático

### **2. Obter Chaves de Produção:**
```env
# Chaves LIVE (não test)
VITE_CLERK_PUBLISHABLE_KEY=pk_live_[...]
CLERK_SECRET_KEY=sk_live_[...]
```

### **3. Configurar DNS (Opcional):**
```
# Para domínio customizado
CNAME imobpro → imobpro-brown.vercel.app
```

### **4. Configurar Webhooks:**
```javascript
// src/api/clerk-webhook.ts
import { Webhook } from 'svix';

export const POST = async (req: Request) => {
  const payload = await req.text();
  const headers = Object.fromEntries(req.headers.entries());
  
  const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  
  try {
    const event = webhook.verify(payload, headers);
    // Processar evento
    console.log('Clerk event:', event);
  } catch (err) {
    console.error('Webhook error:', err);
  }
};
```

---

## 🔧 **TROUBLESHOOTING**

### **Erro: "Development keys in production"**
```bash
# Verificar se as chaves estão corretas
echo $VITE_CLERK_PUBLISHABLE_KEY
echo $CLERK_SECRET_KEY
```

**Solução:** Usar chaves `pk_live_` e `sk_live_` para produção.

### **Erro: "Domain not allowed"**
```bash
# Verificar domínio no Clerk Dashboard
Domain → Add Domain → imobpro-brown.vercel.app
```

### **Erro: "Fallback host not configured"**
```bash
# Configurar no Clerk Dashboard
Paths → Fallback development host → https://imobpro-brown.vercel.app
```

### **Erro: "CORS blocked"**
```javascript
// vite.config.ts
server: {
  cors: {
    origin: [
      'https://imobpro-brown.vercel.app',
      'https://accounts.clerk.dev',
      'https://clerk.dev'
    ]
  }
}
```

---

## 📋 **CHECKLIST DE VERIFICAÇÃO**

### **Antes do Deploy:**
- [ ] Chaves corretas no `.env`
- [ ] Domínio configurado no Clerk
- [ ] Paths configurados corretamente
- [ ] Variáveis de ambiente na Vercel
- [ ] Build local funciona: `pnpm build`

### **Após o Deploy:**
- [ ] Login funciona
- [ ] Registro funciona
- [ ] Email de confirmação enviado
- [ ] Redirecionamento correto
- [ ] Logout funciona

### **Monitoramento:**
- [ ] Logs da Vercel limpos
- [ ] Clerk Dashboard sem erros
- [ ] Analytics funcionando
- [ ] Webhooks configurados

---

## 🚀 **COMANDOS ÚTEIS**

```bash
# Verificar build local
pnpm build && pnpm preview

# Deploy na Vercel
vercel --prod

# Verificar variáveis de ambiente
vercel env ls

# Adicionar variável de ambiente
vercel env add VITE_CLERK_PUBLISHABLE_KEY production

# Ver logs em tempo real
vercel logs --follow
```

---

## 📊 **MONITORAMENTO**

### **Métricas Importantes:**
- **Taxa de sucesso de login:** > 95%
- **Taxa de sucesso de registro:** > 90%
- **Tempo de resposta:** < 2s
- **Erros 401:** = 0

### **Alertas:**
```javascript
// Configurar alertas no Vercel
{
  "alerts": [
    {
      "name": "Clerk Auth Errors",
      "condition": "error_rate > 5%",
      "action": "slack_notification"
    }
  ]
}
```

---

## 🎯 **PRÓXIMOS PASSOS**

1. **Implementar a solução rápida** para resolver o problema imediato
2. **Testar registro completo** em produção
3. **Configurar monitoramento** de erros
4. **Planejar migração** para chaves de produção
5. **Implementar webhooks** para sincronização de dados

---

**🔥 URGENTE:** Siga a **Solução Rápida** primeiro para resolver o problema imediato! 