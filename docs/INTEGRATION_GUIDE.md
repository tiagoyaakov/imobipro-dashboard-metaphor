# 🔌 Guia de Integração - ImobiPRO Dashboard

## 📋 Índice

1. [Configuração Inicial](#configuração-inicial)
2. [Integração com Supabase](#integração-com-supabase)
3. [Teste de Integração](#teste-de-integração)
4. [Arquitetura de Serviços](#arquitetura-de-serviços)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 Configuração Inicial

### 1. Variáveis de Ambiente

1. **Copie o arquivo de exemplo:**
   ```bash
   cp .env.example .env
   ```

2. **Configure as variáveis obrigatórias:**
   ```env
   # Autenticação (OBRIGATÓRIO)
   VITE_USE_REAL_AUTH=true
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anonima
   
   # Company ID (OBRIGATÓRIO em produção)
   VITE_DEFAULT_COMPANY_ID=id-da-sua-empresa
   ```

3. **Variáveis de segurança (recomendadas):**
   ```env
   VITE_DEFAULT_USER_ROLE=AGENT  # NUNCA use ADMIN ou DEV_MASTER
   VITE_ENABLE_SECURITY_VALIDATOR=true
   VITE_BLOCK_MOCK_IN_PRODUCTION=true
   ```

### 2. Instalação de Dependências

```bash
# Usando pnpm (recomendado)
pnpm install

# Ou npm
npm install
```

---

## 🗄️ Integração com Supabase

### 1. Configuração do Projeto Supabase

1. **Crie um projeto no [Supabase](https://supabase.com)**

2. **Execute as migrations do banco:**
   ```bash
   # Instalar Supabase CLI
   npm install -g supabase
   
   # Conectar ao projeto
   supabase link --project-ref seu-projeto-id
   
   # Executar migrations
   supabase db push
   ```

3. **Configure as políticas RLS:**
   - Todas as tabelas devem ter RLS habilitado
   - Políticas básicas estão em `supabase/migrations/`

### 2. Estrutura do Banco de Dados

#### Tabelas Principais:
- `companies` - Empresas/Imobiliárias
- `users` - Usuários do sistema
- `properties` - Propriedades/Imóveis
- `contacts` - Contatos/Leads
- `appointments` - Agendamentos
- `deals` - Negociações
- `activities` - Log de atividades
- `chats` - Conversas
- `messages` - Mensagens

#### Hierarquia de Usuários:
- `DEV_MASTER` - Desenvolvedor (invisível)
- `ADMIN` - Administrador da imobiliária
- `AGENT` - Corretor

---

## 🧪 Teste de Integração

### 1. Script de Teste Automático

Execute o script de teste para validar a integração:

```bash
# Executar teste de integração
node scripts/test-supabase-integration.js
```

O script valida:
- ✅ Conexão com Supabase
- ✅ Sistema de autenticação
- ✅ Queries básicas
- ✅ Row Level Security (RLS)
- ✅ Conexões real-time

### 2. Teste Manual via Interface

1. **Inicie o servidor de desenvolvimento:**
   ```bash
   pnpm dev
   ```

2. **Acesse http://localhost:5173**

3. **Teste o login:**
   - Use credenciais de um usuário existente
   - Ou crie um novo usuário

4. **Verifique o Dashboard:**
   - Métricas devem carregar dados reais
   - Gráficos devem exibir informações
   - Atividades devem ser listadas

---

## 🏗️ Arquitetura de Serviços

### 1. Serviços Implementados

#### PropertyService
```typescript
import { propertyService } from '@/services';

// Listar propriedades
const properties = await propertyService.findAll({ 
  status: 'AVAILABLE' 
});

// Criar propriedade
const newProperty = await propertyService.create({
  title: 'Casa em Copacabana',
  price: 1500000,
  // ... outros campos
});
```

#### ContactService
```typescript
import { contactService } from '@/services';

// Listar contatos com score
const contacts = await contactService.findAll({
  minScore: 70
});

// Calcular lead score
const score = await contactService.calculateLeadScore(contactId);
```

#### AppointmentService
```typescript
import { appointmentService } from '@/services';

// Verificar disponibilidade
const slots = await appointmentService.getAvailableSlots(
  agentId, 
  date
);

// Criar agendamento
const appointment = await appointmentService.create({
  date: '2025-08-10',
  time: '14:00',
  // ... outros campos
});
```

### 2. Hooks React Query

#### useDashboard
```typescript
import { useDashboard } from '@/hooks/useDashboard';

const { 
  stats, 
  chartData, 
  activities,
  isLoading,
  error 
} = useDashboard({
  enableRealtime: true
});
```

#### useProperties
```typescript
import { useProperties } from '@/hooks/useProperties';

const {
  properties,
  isLoading,
  createProperty,
  updateProperty,
  deleteProperty
} = useProperties({
  filters: { status: 'AVAILABLE' }
});
```

### 3. Sistema de Eventos

```typescript
import { EventBus, SystemEvents } from '@/lib/event-bus';

// Escutar eventos
EventBus.on(SystemEvents.PROPERTY_CREATED, (data) => {
  console.log('Nova propriedade:', data.property);
});

// Emitir eventos
EventBus.emit(SystemEvents.USER_LOGIN, { 
  userId: user.id 
});
```

---

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. "Invalid API key"
- Verifique se `VITE_SUPABASE_ANON_KEY` está correta
- Confirme que a chave é do tipo `anon` (não `service_role`)

#### 2. "relation does not exist"
- Execute as migrations: `supabase db push`
- Verifique se está conectado ao projeto correto

#### 3. "RLS policy violation"
- Verifique se o usuário está autenticado
- Confirme que as políticas RLS estão configuradas
- Use o Supabase Dashboard para debug

#### 4. Dados não aparecem no Dashboard
- Verifique `VITE_USE_REAL_AUTH=true`
- Confirme que há dados no banco
- Abra o DevTools e verifique erros de rede

#### 5. "Company ID not found"
- Configure `VITE_DEFAULT_COMPANY_ID`
- Ou crie uma empresa no banco primeiro

### Logs de Debug

Habilite logs detalhados:

```env
VITE_DEBUG_AUTH=true
```

No console do navegador:
```javascript
// Ver estado da autenticação
window.__AUTH_DEBUG__ = true;

// Ver queries do Supabase
localStorage.setItem('debug', 'supabase:*');
```

### Contatos para Suporte

- **Documentação:** Este arquivo
- **Issues:** GitHub do projeto
- **Supabase:** [docs.supabase.com](https://docs.supabase.com)

---

## 📝 Checklist de Integração

- [ ] Variáveis de ambiente configuradas
- [ ] Supabase project criado
- [ ] Migrations executadas
- [ ] RLS policies ativas
- [ ] Teste de integração passou
- [ ] Login funcionando
- [ ] Dashboard carregando dados
- [ ] Sem erros no console

---

**Última atualização:** 01/08/2025