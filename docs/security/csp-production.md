# Content Security Policy para Produção

## 📋 Configuração CSP - ImobiPRO Dashboard

Este documento descreve as configurações de **Content Security Policy (CSP)** necessárias para o funcionamento correto do **Clerk** e **Supabase** em produção.

## 🔒 Headers de Segurança

### Content-Security-Policy

```
default-src 'self';
script-src 'self' 'unsafe-eval' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: https: blob:;
connect-src 'self' https://api.clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://*.supabase.co wss://*.supabase.co;
frame-src 'self' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev;
object-src 'none';
base-uri 'self';
form-action 'self' https://clerk.com https://*.clerk.com
```

### Headers Adicionais

```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

## 🚀 Configuração por Plataforma

### Vercel (vercel.json)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-eval' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://api.clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://*.supabase.co wss://*.supabase.co; frame-src 'self' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev; object-src 'none'; base-uri 'self'; form-action 'self' https://clerk.com https://*.clerk.com"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### Netlify (_headers)

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://api.clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://*.supabase.co wss://*.supabase.co; frame-src 'self' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev; object-src 'none'; base-uri 'self'; form-action 'self' https://clerk.com https://*.clerk.com
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

## ⚠️ Domínios Importantes

### Clerk
- `https://clerk.com`
- `https://*.clerk.com`
- `https://*.clerk.accounts.dev`
- `https://api.clerk.com`

### Supabase
- `https://*.supabase.co`
- `wss://*.supabase.co`

### Fonts & Recursos
- `https://fonts.googleapis.com`
- `https://fonts.gstatic.com`

## 🔧 Configuração em Desenvolvimento

✅ **Configurado automaticamente** no `vite.config.ts`
- Headers CSP para desenvolvimento
- Headers CSP para preview
- Headers de segurança adicionais

## 📝 Notas Importantes

1. **'unsafe-eval'** necessário para Clerk
2. **'unsafe-inline'** necessário para estilos inline
3. **blob:** e **data:** necessários para imagens
4. **wss:** necessário para Supabase Realtime
5. **Wildcards** seguros para subdomínios Clerk

## 🧪 Teste de CSP

Para testar se CSP está funcionando:

1. Abra DevTools → Console
2. Procure por erros CSP
3. Verifique se Clerk carrega sem erros
4. Teste autenticação completa

---

**Configurado em:** `vite.config.ts` (dev/preview)  
**Para produção:** Configurar no provedor de hosting  
**Status:** ✅ Implementado 