# 🔒 Configuração Manual de RLS Policies - Supabase Storage

## ⚠️ AÇÃO NECESSÁRIA: Configurar RLS Policies Manualmente

Como as RLS policies do Storage precisam ser configuradas manualmente no Supabase Dashboard, siga os passos abaixo:

---

## 📍 **Onde Configurar:**

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto: **ImobiPRO** (`eeceyvenrnyyqvilezgr`)
3. Navegue para: **Storage** → **Policies**
4. Clique em **New Policy**

---

## 🛡️ **Policies Necessárias:**

### **1. Policy: "Users can upload own avatar"**
- **Operation:** `INSERT`
- **Policy name:** `Users can upload own avatar`
- **Target roles:** `authenticated`

**SQL Policy:**
```sql
bucket_id = 'avatars' AND 
auth.uid()::text = (storage.foldername(name))[2]
```

---

### **2. Policy: "Users can update own avatar"**
- **Operation:** `UPDATE`
- **Policy name:** `Users can update own avatar` 
- **Target roles:** `authenticated`

**SQL Policy:**
```sql
bucket_id = 'avatars' AND 
auth.uid()::text = (storage.foldername(name))[2]
```

---

### **3. Policy: "Users can delete own avatar"**
- **Operation:** `DELETE`
- **Policy name:** `Users can delete own avatar`
- **Target roles:** `authenticated`

**SQL Policy:**
```sql
bucket_id = 'avatars' AND 
auth.uid()::text = (storage.foldername(name))[2]
```

---

### **4. Policy: "Public avatar access"**
- **Operation:** `SELECT`
- **Policy name:** `Public avatar access`
- **Target roles:** `public`

**SQL Policy:**
```sql
bucket_id = 'avatars'
```

---

## ✅ **Verificação:**

Após configurar as policies, teste:

1. **Upload:** Usuário consegue fazer upload de avatar
2. **Visualização:** Avatar aparece na interface
3. **Atualização:** Usuário consegue trocar avatar
4. **Segurança:** Usuário NÃO consegue acessar avatars de outros

---

## 🔧 **Configurações Automáticas Já Aplicadas:**

✅ Campo `avatar_url` adicionado à tabela `users`  
✅ Bucket `avatars` criado com limite de 5MB  
✅ Tipos MIME permitidos: jpeg, jpg, png, webp, gif  
✅ Bucket configurado como público  
✅ Contexto de autenticação atualizado  
✅ Interface de upload funcional  

---

## 🎯 **Status Final:**

- ⚠️ **PENDENTE:** Configurar RLS policies manualmente no Dashboard
- ✅ **COMPLETO:** Todas as outras integrações funcionais

**Após configurar as policies, o sistema de avatar estará 100% funcional!** 