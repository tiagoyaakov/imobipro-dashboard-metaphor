# 📋 Tutorial: Como Testar o Sistema CRM ImobiPRO

## 🎯 **Objetivo**
Este tutorial vai te ensinar a testar todas as funcionalidades do sistema CRM (Customer Relationship Management) do ImobiPRO Dashboard de forma simples e prática.

---

## 🌐 **1. Acessando o Sistema**

### **Opção 1: Acesso Online (Recomendado)**
1. Abra seu navegador (Chrome, Firefox, Safari, Edge)
2. Digite na barra de endereço: `https://imobpro-brown.vercel.app`
3. Aguarde a página carregar completamente

---

## 🏠 **2. Navegação Inicial**

### **Dashboard Principal**
Quando a página carregar, você verá:
- **Barra lateral esquerda**: Menu com todas as opções
- **Header superior**: Busca e perfil do usuário
- **Área central**: Conteúdo principal da página

### **Acessando o CRM**
1. Na barra lateral esquerda, procure por **"CRM"**
2. Clique em **"CRM"**
3. A página do CRM irá abrir

---

## 📊 **3. Explorando o CRM - Visão Geral**

### **Métricas Principais (Cartões no Topo)**
Você verá 4 cartões coloridos mostrando:

1. **📋 Total de Contatos** (Azul)
   - Mostra quantos contatos estão cadastrados
   - Indica quantos são "hot leads" (leads quentes)

2. **🎯 Score Médio** (Verde)
   - Pontuação média dos leads (0 a 100)
   - Quanto maior, melhor a qualidade dos leads

3. **🏆 Hot Leads** (Vermelho)
   - Leads com pontuação alta (acima de 80)
   - Percentual em relação ao total

4. **⚡ Automações** (Laranja)
   - Quantas automações estão ativas
   - Ferramentas que trabalham automaticamente

---

## 🧪 **4. Testando as Abas do CRM**

### **Aba 1: Dashboard** 📈
**O que você vai ver:**
- Gráficos de desempenho dos leads
- Lista das atividades mais recentes
- Visão geral dos resultados

**Como testar:**
1. Observe os gráficos carregando
2. Veja se os números fazem sentido
3. Confira se as atividades aparecem com datas

---

### **Aba 2: Lead Scoring** 🎯
**O que faz:**
- Mostra a pontuação de cada lead
- Ajuda a identificar quais clientes têm maior potencial

**Como testar:**
1. Clique na aba **"Lead Scoring"**
2. Você verá cartões com informações de cada contato
3. Observe as pontuações (0-100)
4. Procure por leads com pontuação alta (verde) e baixa (vermelho)

**O que observar:**
- Nome do contato
- Email e telefone
- Pontuação colorida
- Categoria (Lead, Cliente, Parceiro)

---

### **Aba 3: Segmentação** 👥
**O que faz:**
- Agrupa contatos por características similares
- Permite criar grupos específicos para campanhas

**Como testar:**
1. Clique na aba **"Segmentação"**
2. Veja os grupos já criados
3. Observe os critérios de cada segmento

---

### **Aba 4: Automação** ⚡
**O que faz:**
- Configura ações automáticas
- Ex: enviar email quando lead atinge certa pontuação

**Como testar:**
1. Clique na aba **"Automação"**
2. Veja as automações configuradas
3. Observe os gatilhos e ações

---

## 📊 **5. Testando os Gráficos Detalhados**

### **Na aba Dashboard, clique em "Fatores"**
Você verá um gráfico com 4 fatores de pontuação:

1. **Engajamento**: Quanto o lead interage
2. **Demografia**: Perfil do cliente (idade, região, etc.)
3. **Comportamento**: Como navega no site
4. **Firmográficos**: Dados da empresa (se for B2B)

**Teste importante:**
- ✅ O gráfico deve carregar sem mostrar "NaN"
- ✅ Deve mostrar valores numéricos normais

---

## 🔍 **6. Checklist de Testes**

### **✅ Testes Básicos**
- [ ] Página carrega sem erros
- [ ] Métricas aparecem com números
- [ ] Todas as 4 abas funcionam
- [ ] Gráficos carregam corretamente
- [ ] Avatar do usuário aparece no canto superior direito

### **✅ Testes de Dados**
- [ ] Lead Scoring mostra cartões de contatos
- [ ] Pontuações estão entre 0-100
- [ ] Atividades mostram datas recentes
- [ ] Gráfico de fatores não mostra "NaN"

### **✅ Testes de Navegação**
- [ ] Consegue voltar para dashboard principal
- [ ] Consegue navegar entre as abas
- [ ] Consegue acessar CRM direto pelo link

---

## 🐛 **7. Problemas Comuns e Soluções**

### **Página não carrega**
- Verifique sua conexão com internet
- Atualize a página (F5 ou Ctrl+R)
- Tente em outro navegador

### **Gráficos não aparecem**
- Aguarde alguns segundos (dados podem estar carregando)
- Recarregue a página
- Verifique se JavaScript está habilitado

### **Números estranhos (NaN, undefined)**
- Isso indica um problema técnico
- Anote onde viu e reporte

---

## 📝 **8. O que Reportar nos Testes**

### **✅ Funcionando Bem**
- "Todas as métricas carregaram corretamente"
- "Consegui navegar por todas as abas"
- "Gráficos estão normais"

### **❌ Problemas Encontrados**
- "Página X não carrega"
- "Gráfico Y mostra 'NaN'"
- "Botão Z não funciona"
- "Erro no console (F12)"

---

## 🎓 **9. Conceitos Importantes**

### **Lead Scoring**
Sistema que dá notas (0-100) para leads baseado em:
- Quantas vezes interagiu com a empresa
- Perfil do cliente
- Comportamento no site
- Dados da empresa

### **Hot Leads**
Leads com pontuação alta (80+) que têm maior chance de virar clientes.

### **Segmentação**
Agrupar contatos por características para campanhas direcionadas.

### **Automação**
Ações que o sistema faz sozinho, como enviar emails ou atualizar dados.

---

## 🚀 **10. Próximos Passos**

Após testar tudo:
1. Anote o que funcionou bem
2. Liste os problemas encontrados
3. Sugira melhorias
4. Teste em diferentes dispositivos (celular, tablet)

---

## 📞 **Suporte**

Se encontrar qualquer problema ou tiver dúvidas:
- Anote exatamente o que aconteceu
- Informe qual navegador está usando
- Mencione se foi no computador ou celular

**Bom teste! 🎉** 