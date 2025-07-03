# 👁️ Guia Visual - O que Você Deve Ver no CRM

## 🏠 **1. Dashboard Principal**

### **Layout Esperado:**
```
┌─────────────────────────────────────────────────────────┐
│ [☰] ImobiPRO    [🔍 Buscar...]           [🔔] [👤 Admin] │
├─────────────────────────────────────────────────────────┤
│ ┌─ MENU ─┐                                              │
│ │ Dashboard│ ← Você está aqui                           │
│ │ CRM      │                                            │
│ │ Contatos │                                            │
│ │ Agenda   │                                            │
│ └─────────┘                                             │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 **2. Página CRM - Visão Geral**

### **4 Cartões de Métricas (Topo):**
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 👥 Contatos │ │ 🎯 Score    │ │ 🏆 Hot      │ │ ⚡ Auto.    │
│             │ │ Médio       │ │ Leads       │ │             │
│    15       │ │    78       │ │     3       │ │     2       │
│ 3 hot leads │ │ +2 ontem    │ │ 20% total   │ │ 2 ativas    │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

### **Abas Principais:**
```
┌─────────────────────────────────────────────────────────┐
│ [📈 Dashboard] [🎯 Lead Scoring] [👥 Segmentação] [⚡ Automação] │
└─────────────────────────────────────────────────────────┘
```

---

## 📈 **3. Aba Dashboard - Gráficos**

### **Subabas dos Gráficos:**
```
┌─────────────────────────────────────────────────────────┐
│ [Distribuição] [Categorias] [Fatores] [Top Leads]       │
└─────────────────────────────────────────────────────────┘
```

### **Aba "Fatores" (IMPORTANTE!):**
```
┌─ Fatores Médios de Pontuação ────────────────────────────┐
│                                                         │
│      ████                                               │
│    ██████                                               │
│  ████████     ████                                      │
│ ██████████   ██████     ████     ██                     │
│ ────────────────────────────────────                   │
│ Engajamento Demografia Comportam. Firmográf.            │
│      80         70         75        65                 │
└─────────────────────────────────────────────────────────┘
```

**❌ NÃO deve mostrar:** `NaN`, `undefined`, valores vazios

---

## 🎯 **4. Aba Lead Scoring**

### **Cards de Contatos:**
```
┌─────────────────────────────────────────────────────────┐
│ ┌─ Ana Silva ──────────────────────────────────────── [75] │
│ │ 📧 ana@email.com  📞 (11) 99999-9999               │
│ │ 🏷️ Lead          🕒 Última atividade: 3 dias       │
│ │ ████████████████████████████████████████▓▓▓▓▓▓▓▓▓▓ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─ Bruno Lima ─────────────────────────────────────── [92] │
│ │ 📧 bruno@email.com  📞 (11) 88888-8888             │
│ │ 🏷️ Cliente       🕒 Última atividade: 1 dia        │
│ │ ████████████████████████████████████████████████▓▓ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 👥 **5. Aba Segmentação**

### **Regras de Segmentação:**
```
┌─ Criar Nova Regra ───────────────────────────────────────┐
│ Nome: [________________]                                 │
│ Critérios:                                              │
│ ☐ Score mínimo: [__] máximo: [__]                       │
│ ☐ Categoria: [Dropdown ▼]                               │
│ ☐ Última atividade: [__] dias                           │
│ [💾 Salvar]                                              │
└─────────────────────────────────────────────────────────┘
```

---

## ⚡ **6. Aba Automação**

### **Builder de Automação:**
```
┌─ Criar Automação ────────────────────────────────────────┐
│ Nome: [________________]                                 │
│                                                         │
│ 🎯 GATILHO                                               │
│ [Quando score > 80 ▼]                                   │
│           ↓                                             │
│ ⚡ AÇÃO                                                   │
│ [Enviar email ▼]                                        │
│                                                         │
│ [+ Adicionar Ação]    [💾 Salvar]                        │
└─────────────────────────────────────────────────────────┘
```

---

## 📱 **7. Versão Mobile**

### **Layout Responsivo:**
```
┌─────────────────┐
│ [☰] ImobiPRO [👤]│
├─────────────────┤
│  📊 CRM         │
│ ┌─────────────┐ │
│ │👥 Contatos  │ │
│ │    15       │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │🎯 Score     │ │
│ │    78       │ │
│ └─────────────┘ │
│                 │
│ [Dashboard]     │
│ [Scoring]       │
│ [Segmentação]   │
│ [Automação]     │
└─────────────────┘
```

---

## ✅ **8. Indicadores Visuais de Sucesso**

### **🟢 Funcionando Bem:**
- Números aparecem nos cartões
- Gráficos têm cores e formas
- Botões respondem ao clique
- Loading aparece e desaparece
- Cores: azul, verde, vermelho, laranja

### **🔴 Problemas Visuais:**
- Texto "NaN" em qualquer lugar
- Cartões vazios ou sem números
- Gráficos em branco
- Mensagens de erro em inglês
- Layout quebrado (textos sobrepostos)

---

## 🎨 **9. Cores do Sistema**

### **Paleta Principal:**
- **Azul:** `#3b82f6` (Contatos, primário)
- **Verde:** `#22c55e` (Score médio, sucesso)  
- **Vermelho:** `#ef4444` (Hot leads, urgente)
- **Laranja:** `#f97316` (Automações, ativo)
- **Cinza:** `#6b7280` (Texto secundário)

---

## 🔍 **10. Checklist Visual Rápido**

**Ao abrir o CRM, em 10 segundos você deve ver:**
- [ ] 4 cartões coloridos com números
- [ ] 4 abas clicáveis
- [ ] Menu lateral funcionando
- [ ] Avatar no canto superior direito

**Ao clicar em "Lead Scoring":**
- [ ] Cards de contatos com fotos/avatares
- [ ] Pontuações coloridas (0-100)
- [ ] Emails e telefones

**Ao ir em Dashboard > Fatores:**
- [ ] Gráfico de área com 4 categorias
- [ ] Valores numéricos (não "NaN")
- [ ] Cores diferentes para cada fator

---

**💡 Dica:** Se algo não parece como descrito aqui, pode ser um problema! 