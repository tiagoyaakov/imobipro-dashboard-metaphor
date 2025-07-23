# 🎭 **Sistema de Impersonation de Usuários - Guia Completo**

## 🎯 **Visão Geral**

O Sistema de Impersonation permite que **administradores** testem o sistema assumindo temporariamente a identidade de outros usuários (proprietários ou corretores) para verificar permissões, acessos e funcionalidades em tempo real.

---

## 🚀 **Como Usar**

### **1️⃣ Acesso ao Sistema**
- **Apenas Administradores** podem ver e usar a funcionalidade
- Botão **👁️** visível no header ao lado das notificações
- Se estiver ativo, o botão fica **laranja** com badge "Testando"

### **2️⃣ Iniciando Impersonation**
1. Clique no botão **👁️** no header
2. Selecione um usuário da lista (separada por função):
   - 🏠 **Proprietários**: Donos de imóveis
   - 👤 **Corretores**: Funcionários/agentes
3. Visualize o preview do usuário selecionado
4. Clique em **"Iniciar Teste"**

### **3️⃣ Durante o Teste**
- **Indicador Visual**: Banner laranja no topo mostra usuário ativo
- **Header**: Mostra nome e função do usuário impersonado
- **Permissões**: Sistema funciona exatamente como o usuário veria
- **Dados**: Apenas os dados que o usuário tem acesso

### **4️⃣ Finalizando Teste**
- Clique no botão **"Sair"** no indicador laranja
- Ou clique no botão **👁️** e depois **"Voltar ao Normal"**
- Sistema retorna ao perfil de administrador

---

## 🔒 **Regras de Segurança**

### **✅ Permitido**
- Administradores podem impersonar **proprietários**
- Administradores podem impersonar **corretores**
- Ver dados exatamente como o usuário veria
- Realizar ações permitidas ao usuário
- Múltiplas sessões (uma por vez)

### **❌ Bloqueado**
- Impersonar outros **administradores**
- Impersonar a **si mesmo**
- Usuários não-admin usar a funcionalidade
- Múltiplas impersonations simultâneas

### **📋 Auditoria**
- Todas as ações são **registradas** no log
- Início e fim de cada sessão
- Identificação do admin responsável
- Rastreabilidade completa

---

## 🎨 **Interface Visual**

### **Estados do Botão**
| Estado | Aparência | Descrição |
|--------|-----------|-----------|
| **Normal** | 👁️ cinza | Sem impersonation ativa |
| **Ativo** | 👁️ laranja + "Testando" | Impersonation em andamento |
| **Loading** | Spinner | Processando ação |

### **Indicador de Status**
```
🚨 Testando como: João Silva (Proprietário)
   Você está vendo o sistema na visão deste usuário    [Sair]
```

### **Modal de Seleção**
- **Lista Organizada**: Proprietários e corretores separados
- **Preview**: Informações do usuário selecionado
- **Validação**: Botão habilitado apenas com seleção válida

---

## 🛠️ **Aspectos Técnicos**

### **Backend (Supabase)**
```sql
-- Tabela de controle
user_impersonations (
  admin_user_id,      -- Admin que iniciou
  impersonated_user_id, -- Usuário sendo impersonado
  session_token,      -- Token único da sessão
  is_active,         -- Status ativo/inativo
  created_at,        -- Início da sessão
  ended_at          -- Fim da sessão
)

-- Funções principais
start_user_impersonation()  -- Iniciar sessão
end_user_impersonation()    -- Finalizar sessão
get_active_impersonation()  -- Verificar status
```

### **Frontend (React)**
```typescript
// Hooks principais
useImpersonation()      // Controle geral
useImpersonationTargets() // Lista de usuários
useEffectiveUser()      // Usuário efetivo atual

// Componentes
ImpersonationButton     // Botão e modal
ImpersonationIndicator  // Banner de status
```

### **Fluxo de Dados**
1. **Admin clica** → Modal carrega usuários disponíveis
2. **Seleciona usuário** → Valida permissões e inicia sessão
3. **Sistema atualiza** → Todas queries usam usuário efetivo
4. **Indicador mostra** → Feedback visual contínuo
5. **Admin finaliza** → Session encerrada, volta ao normal

---

## 🧪 **Cenários de Teste**

### **👨‍💼 Testando como Proprietário**
- ✅ Ver apenas suas propriedades
- ✅ Acessar chats dos corretores de seus imóveis
- ✅ Visualizar métricas de suas propriedades
- ❌ Não ver gestão de usuários
- ❌ Não acessar configurações gerais

### **👨‍💻 Testando como Corretor**
- ✅ Ver apenas propriedades atribuídas
- ✅ Acessar apenas próprios contatos
- ✅ Visualizar apenas próprias métricas
- ❌ Não ver CRM avançado
- ❌ Não acessar relatórios gerais

### **🔄 Testando Transições**
- Alternar entre diferentes usuários
- Verificar mudança imediata de dados
- Confirmar reset ao voltar ao normal
- Testar indicadores visuais

---

## 🚨 **Solução de Problemas**

### **Problema: Botão não aparece**
- **Causa**: Usuário não é administrador
- **Solução**: Verificar role no banco de dados

### **Problema: Lista vazia no modal**
- **Causa**: Sem usuários ativos no sistema
- **Solução**: Criar usuários de teste

### **Problema: Permissões incorretas**
- **Causa**: RLS policies não aplicadas
- **Solução**: Verificar migrações do banco

### **Problema: Sessão não finaliza**
- **Causa**: Erro na função SQL
- **Solução**: Verificar logs do Supabase

---

## 📊 **Métricas e Monitoramento**

### **Logs a Acompanhar**
- Frequência de uso por admin
- Duração média das sessões
- Usuários mais impersonados
- Erros ou falhas no sistema

### **Auditoria Regular**
- Revisar logs de impersonation mensalmente
- Verificar uso adequado da funcionalidade
- Confirmar que apenas admins têm acesso
- Validar integridade das permissões

---

## 🔮 **Futuras Melhorias**

### **Versão 2.0**
- [ ] **Histórico detalhado** de impersonations por admin
- [ ] **Limite de tempo** automático para sessões
- [ ] **Notificações** para usuários sendo impersonados
- [ ] **Relatório** de ações realizadas durante teste

### **Versão 3.0**
- [ ] **Impersonation em lote** para testes automatizados
- [ ] **Gravação de sessão** para replay de testes
- [ ] **API externa** para automação de testes
- [ ] **Dashboard** de métricas de impersonation

---

**🎉 O Sistema de Impersonation está 100% funcional e pronto para facilitar todos os seus testes administrativos!** 