# 🔲 ImobiPRO Agenda Module - Modern UI/UX Components

Uma suite completa de componentes React para gestão de agenda imobiliária com design mobile-first, acessibilidade WCAG 2.1 AA e funcionalidades PWA.

## 📋 Componentes Disponíveis

### 🗓️ CalendarView
Componente principal de visualização do calendário com múltiplas views.

**Características:**
- ✅ Mobile-first design responsivo
- ✅ Visualizações: Mês, Semana, Dia
- ✅ Navegação intuitiva por teclado
- ✅ Indicadores visuais de compromissos
- ✅ Touch-friendly para dispositivos móveis
- ✅ Acessibilidade WCAG 2.1 AA compliant

**Uso:**
```tsx
import { CalendarView } from '@/components/agenda';

const MyComponent = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  return (
    <CalendarView
      appointments={appointments}
      selectedDate={new Date()}
      onDateSelect={(date) => console.log('Data selecionada:', date)}
      onAppointmentClick={(appointment) => console.log('Compromisso:', appointment)}
      onCreateAppointment={(date) => console.log('Criar agendamento para:', date)}
    />
  );
};
```

### 🧑‍💼 AgentAvailability
Interface para gerenciamento de disponibilidade de corretores.

**Características:**
- ✅ Configuração de horários por dia da semana
- ✅ Gestão de slots de tempo personalizados
- ✅ Integração com Google Calendar e Outlook
- ✅ Configurações de atribuição automática
- ✅ Interface intuitiva de arrastar e soltar

**Uso:**
```tsx
import { AgentAvailability } from '@/components/agenda';

const AgentSettings = () => {
  const [availability, setAvailability] = useState<AgentAvailabilityData>({
    // ... dados de disponibilidade
  });
  
  return (
    <AgentAvailability
      availability={availability}
      onUpdate={setAvailability}
      onSyncCalendar={(provider) => console.log('Sincronizar:', provider)}
    />
  );
};
```

### 🎯 BookingWizard
Fluxo completo de criação de agendamentos com validação e detecção de conflitos.

**Características:**
- ✅ Wizard multi-etapas guiado
- ✅ Detecção automática de conflitos
- ✅ Validação de dados em tempo real
- ✅ Seleção inteligente de horários
- ✅ Interface adaptável mobile/desktop

**Uso:**
```tsx
import { BookingWizard } from '@/components/agenda';

const BookingInterface = () => {
  const [showWizard, setShowWizard] = useState(false);
  
  return (
    <>
      <Button onClick={() => setShowWizard(true)}>
        Novo Agendamento
      </Button>
      
      <BookingWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={(booking) => {
          console.log('Agendamento criado:', booking);
          setShowWizard(false);
        }}
        availableAgents={agents}
        getAvailableSlots={(date, agentId) => getSlots(date, agentId)}
      />
    </>
  );
};
```

### 🔄 SyncStatus
Componente para monitoramento e status de sincronização em tempo real.

**Características:**
- ✅ Status em tempo real de sincronização
- ✅ Indicadores visuais de conectividade
- ✅ Histórico de eventos de sync
- ✅ Estatísticas de performance
- ✅ Ações de sincronização manual

**Uso:**
```tsx
import { SyncStatus, useSyncStatus } from '@/components/agenda';

const SyncInterface = () => {
  const { syncStatus, startSync, completeSync } = useSyncStatus();
  
  return (
    <SyncStatus
      syncStatus={syncStatus}
      onManualSync={() => startSync()}
      onResolveConflicts={() => console.log('Resolver conflitos')}
      onReconnectProvider={(provider) => console.log('Reconectar:', provider)}
    />
  );
};
```

### 🔔 NotificationSystem
Sistema completo de notificações com configurações personalizáveis.

**Características:**
- ✅ Múltiplos canais (Push, Email, SMS, WhatsApp)
- ✅ Priorização de notificações
- ✅ Horário silencioso configurável
- ✅ Ações contextuais por notificação
- ✅ Histórico e gerenciamento

**Uso:**
```tsx
import { NotificationSystem, useNotifications } from '@/components/agenda';

const NotificationInterface = () => {
  const {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();
  
  return (
    <NotificationSystem
      notifications={notifications}
      settings={notificationSettings}
      onNotificationAction={(id, action) => handleAction(id, action)}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={markAllAsRead}
      onDeleteNotification={deleteNotification}
      onUpdateSettings={(settings) => updateSettings(settings)}
    />
  );
};
```

### 📱 OfflineMode
Funcionalidades PWA com modo offline e sincronização.

**Características:**
- ✅ Detecção de conectividade
- ✅ Fila de sincronização offline
- ✅ Cache inteligente de dados
- ✅ Instalação PWA
- ✅ Gestão de storage local

**Uso:**
```tsx
import { OfflineMode, useOfflineMode } from '@/components/agenda';

const OfflineInterface = () => {
  const {
    isOnline,
    queueItems,
    syncProgress,
    syncQueue,
    clearQueue
  } = useOfflineMode();
  
  return (
    <OfflineMode
      isOnline={isOnline}
      queueItems={queueItems}
      syncProgress={syncProgress}
      cacheStats={cacheStats}
      onSyncQueue={syncQueue}
      onClearQueue={clearQueue}
      onRefreshCache={() => refreshCache()}
    />
  );
};
```

## 🎨 Padrões de Design

### Tema e Cores
Todos os componentes seguem o sistema de design ImobiPRO:

```css
/* Cores principais */
--imobipro-blue: hsl(220, 91%, 51%)      /* #0EA5E9 */
--imobipro-blue-dark: hsl(220, 91%, 41%) /* #0284C7 */
--imobipro-gray: hsl(210, 11%, 15%)      /* #1F2937 */

/* Estados */
--imobipro-success: hsl(142, 76%, 36%)   /* #16A34A */
--imobipro-warning: hsl(38, 92%, 50%)    /* #F59E0B */
--imobipro-danger: hsl(0, 84%, 60%)      /* #EF4444 */
```

### Responsividade
- **Mobile First**: Design otimizado para dispositivos móveis
- **Breakpoints**: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`
- **Touch Targets**: Mínimo 44px para elementos interativos
- **Gestos**: Suporte a swipe, pinch, e touch gestures

### Animações
- **Duração**: 200-300ms para micro-interações
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` para transições suaves
- **Performance**: Uso de `transform` e `opacity` para animações GPU-accelerated

## ♿ Acessibilidade WCAG 2.1 AA

### Contraste de Cores
- ✅ Texto normal: Mínimo 4.5:1
- ✅ Texto grande: Mínimo 3:1
- ✅ Elementos UI: Mínimo 3:1
- ✅ Elementos gráficos: Mínimo 3:1

### Navegação por Teclado
- ✅ Todos os elementos interativos são focáveis
- ✅ Ordem lógica de foco (tab order)
- ✅ Indicadores visuais de foco claros
- ✅ Atalhos de teclado para ações comuns

### Screen Readers
- ✅ Roles ARIA apropriados
- ✅ Labels descritivos
- ✅ Estados anunciados (aria-expanded, aria-selected)
- ✅ Landmarks para navegação estrutural

### Recursos de Acessibilidade
```tsx
import { 
  useScreenReader,
  AccessibleButton,
  HighContrastAlert,
  ARIA_LABELS 
} from '@/components/agenda/AccessibilityEnhancements';

// Exemplo de uso
const { announce, AnnouncerComponent } = useScreenReader();

// Anunciar ações para screen readers
const handleSave = () => {
  announce('Agendamento salvo com sucesso');
};
```

## 📱 Funcionalidades PWA

### Service Worker
- Cache de recursos estáticos
- Cache de dados da API
- Sincronização em background
- Notificações push

### Instalação
```tsx
// Verificar se PWA é instalável
if ('serviceWorker' in navigator) {
  // Registrar service worker
}

// Prompt de instalação
window.addEventListener('beforeinstallprompt', (e) => {
  // Mostrar botão de instalação customizado
});
```

### Modo Offline
- Detecção automática de conectividade
- Queue de ações offline
- Sincronização automática quando volta online
- Cache inteligente com expiração

## 🔧 State Management

### Hooks Personalizados
```tsx
// Gerenciamento de sincronização
const { syncStatus, startSync, completeSync } = useSyncStatus();

// Gerenciamento de notificações
const { notifications, addNotification } = useNotifications();

// Gerenciamento offline
const { isOnline, queueItems, syncQueue } = useOfflineMode();

// Navegação por teclado
const gridRef = useFocusTrap(isModalOpen);

// Screen reader
const { announce, AnnouncerComponent } = useScreenReader();
```

### Padrões de Estado
- **React Query** para cache de dados server-side
- **Zustand** para estado global leve
- **React Hook Form** para gerenciamento de formulários
- **Zod** para validação de dados

## 🚀 Performance

### Otimizações
- **Code Splitting**: Lazy loading de componentes
- **Memoização**: React.memo para componentes pesados
- **Virtualização**: Para listas longas de compromissos
- **Debouncing**: Para inputs de busca e filtros

### Bundle Size
- Componentes tree-shakeable
- Importações nomeadas para melhor tree-shaking
- Dependências externas otimizadas

### Métricas
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **TTI (Time to Interactive)**: < 3.5s

## 🧪 Testes

### Tipos de Teste
```bash
# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Testes e2e
npm run test:e2e

# Testes de acessibilidade
npm run test:a11y

# Testes de performance
npm run test:performance
```

### Ferramentas
- **Vitest** para testes unitários
- **Testing Library** para testes de componentes
- **Playwright** para testes e2e
- **axe-core** para testes de acessibilidade

## 📖 Exemplos de Uso

### Implementação Completa
```tsx
import React from 'react';
import {
  CalendarView,
  BookingWizard,
  NotificationSystem,
  SyncStatus,
  useNotifications,
  useSyncStatus
} from '@/components/agenda';

const AgendaPage = () => {
  const [showBooking, setShowBooking] = useState(false);
  const { notifications, addNotification } = useNotifications();
  const { syncStatus } = useSyncStatus();
  
  const handleBookingComplete = (booking) => {
    addNotification({
      type: 'appointment_confirmation',
      title: 'Agendamento Criado',
      message: `Compromisso agendado para ${booking.selectedDate}`,
      priority: 'medium'
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Header com status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NotificationSystem
          notifications={notifications}
          // ... outras props
        />
        <SyncStatus
          syncStatus={syncStatus}
          // ... outras props
        />
      </div>
      
      {/* Calendário principal */}
      <CalendarView
        appointments={appointments}
        onCreateAppointment={() => setShowBooking(true)}
        // ... outras props
      />
      
      {/* Wizard de agendamento */}
      <BookingWizard
        isOpen={showBooking}
        onClose={() => setShowBooking(false)}
        onComplete={handleBookingComplete}
        // ... outras props
      />
    </div>
  );
};
```

## 🔄 Integração com Backend

### APIs Necessárias
```typescript
// Endpoints para agenda
interface AgendaAPI {
  // Compromissos
  getAppointments(params: GetAppointmentsParams): Promise<Appointment[]>;
  createAppointment(data: CreateAppointmentData): Promise<Appointment>;
  updateAppointment(id: string, data: UpdateAppointmentData): Promise<Appointment>;
  deleteAppointment(id: string): Promise<void>;
  
  // Disponibilidade
  getAgentAvailability(agentId: string): Promise<AgentAvailabilityData>;
  updateAgentAvailability(data: AgentAvailabilityData): Promise<void>;
  
  // Sincronização
  syncGoogleCalendar(): Promise<SyncResult>;
  syncOutlookCalendar(): Promise<SyncResult>;
  
  // Notificações
  getNotifications(): Promise<NotificationData[]>;
  markNotificationAsRead(id: string): Promise<void>;
  updateNotificationSettings(settings: NotificationSettings): Promise<void>;
}
```

### WebSocket para Tempo Real
```typescript
// Conexão WebSocket para updates em tempo real
const useRealtimeSync = () => {
  useEffect(() => {
    const ws = new WebSocket('wss://api.imobipro.com/agenda/ws');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'appointment_updated':
          // Atualizar lista de compromissos
          break;
        case 'sync_status_changed':
          // Atualizar status de sincronização
          break;
        case 'notification_received':
          // Adicionar nova notificação
          break;
      }
    };
    
    return () => ws.close();
  }, []);
};
```

## 🛡️ Segurança

### Validação de Dados
- Validação client-side com Zod
- Sanitização de inputs
- Validação server-side obrigatória

### Autenticação
- Tokens JWT para autenticação
- Refresh tokens para sessões longas
- Role-based access control (RBAC)

### Privacidade
- Conformidade com LGPD/GDPR
- Criptografia de dados sensíveis
- Auditoria de ações

## 🚢 Deploy e Monitoramento

### Build e Deploy
```bash
# Build de produção
npm run build

# Deploy para staging
npm run deploy:staging

# Deploy para produção
npm run deploy:production
```

### Monitoramento
- **Sentry** para error tracking
- **LogRocket** para session replay
- **Google Analytics** para métricas de uso
- **Web Vitals** para performance

---

🔲 **Desenvolvido seguindo os padrões ImobiPRO AI-First Development Rules 2025**

**Versão**: 1.0.0  
**Última atualização**: Dezembro 2024  
**Compatibilidade**: React 18+, TypeScript 5+, shadcn/ui