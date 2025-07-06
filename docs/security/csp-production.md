# 🔒 Content Security Policy (CSP) - Configuração de Produção

**Projeto:** ImobiPRO Dashboard  
**Data:** Dezembro 2024  
**Última Atualização:** Corrigido para suportar CAPTCHA do Clerk

## 📋 Configuração Atual

### **CSP para Clerk Authentication**

```nginx
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' 
    https://clerk.com 
    https://*.clerk.com 
    https://*.clerk.accounts.dev 
    https://challenges.cloudflare.com;
  style-src 'self' 'unsafe-inline' 
    https://fonts.googleapis.com;
  font-src 'self' 
    https://fonts.gstatic.com 
    data:;
  img-src 'self' 
    data: 
    https: 
    blob:;
  connect-src 'self' 
    https://api.clerk.com 
    https://*.clerk.com 
    https://*.clerk.accounts.dev 
    https://*.supabase.co 
    wss://*.supabase.co;
  frame-src 'self' 
    https://clerk.com 
    https://*.clerk.com 
    https://*.clerk.accounts.dev 
    https://challenges.cloudflare.com;
  worker-src 'self' blob:;
  child-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self' 
    https://clerk.com 
    https://*.clerk.com;
```

## ⚠️ Mudanças Críticas

### **Adicionado para CAPTCHA:**
- `worker-src 'self' blob:` - Permite workers para CAPTCHA
- `child-src 'self' blob:` - Permite child workers
- `https://challenges.cloudflare.com` em `script-src` e `frame-src`

### **Problemas Resolvidos:**
- ✅ CAPTCHA do Google/Social Login funcionando
- ✅ Workers do Clerk permitidos
- ✅ Iframe do Cloudflare CAPTCHA permitido

## 🚀 Configuração por Plataforma

### **Vercel (vercel.json)**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://api.clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://*.supabase.co wss://*.supabase.co; frame-src 'self' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com; worker-src 'self' blob:; child-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self' https://clerk.com https://*.clerk.com"
        }
      ]
    }
  ]
}
```

### **Netlify (_headers)**
```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://api.clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://*.supabase.co wss://*.supabase.co; frame-src 'self' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com; worker-src 'self' blob:; child-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self' https://clerk.com https://*.clerk.com
```

### **Apache (.htaccess)**
```apache
<IfModule mod_headers.c>
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://api.clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://*.supabase.co wss://*.supabase.co; frame-src 'self' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com; worker-src 'self' blob:; child-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self' https://clerk.com https://*.clerk.com"
</IfModule>
```

## 🔍 Teste e Validação

### **Verificar CAPTCHA:**
1. Tentar login com Google
2. Verificar se CAPTCHA aparece
3. Console não deve mostrar erros CSP

### **Verificar Workers:**
```javascript
// No console do navegador
console.log('Workers permitidos:', typeof Worker !== 'undefined')
```

### **URLs para Teste:**
- Login: `/login`
- Registro: `/register`
- Dashboard: `/` ou `/dashboard`

## 📝 Notas Importantes

### **Desenvolvimento vs Produção:**
- Em desenvolvimento: CSP configurado no `vite.config.ts`
- Em produção: CSP configurado no servidor/CDN

### **Domínios Específicos do Clerk:**
- `clerk.com` - API principal
- `*.clerk.com` - Subdomínios regionais
- `*.clerk.accounts.dev` - Instâncias de desenvolvimento
- `challenges.cloudflare.com` - CAPTCHA

### **Monitoramento:**
- Usar `report-uri` ou `report-to` para logs de violação
- Monitorar console errors relacionados a CSP
- Testar regularmente funcionalidade de autenticação

## 🚨 Troubleshooting

### **CAPTCHA não funciona:**
```
Erro: "Cannot create worker from blob"
Solução: Adicionar worker-src blob: ao CSP
```

### **Social Login falha:**
```
Erro: "Refused to frame"
Solução: Adicionar domínio ao frame-src
```

### **Estilização quebrada:**
```
Erro: "Refused to apply style"  
Solução: Verificar style-src 'unsafe-inline'
```

---

**Status:** ✅ Configurado e Testado  
**Próxima Revisão:** Janeiro 2025 