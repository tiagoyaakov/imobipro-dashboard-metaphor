# ⚙️ MÓDULO 8: CONFIGURAÇÕES

## 📋 Status Atual

**Status:** Em planejamento  
**Prioridade:** Média  
**Dependências:** Todos os módulos principais  

## 🎯 Visão Geral

Sistema completo de configurações com controle granular de funcionalidades, sistema de features flags, gestão de planos e configurações personalizáveis por empresa e usuário.

## 🚀 Requisitos Específicos

### Core Features
- **Controle de funcionalidades por DEV MASTER**: Gestão global de recursos
- **Sistema de features flags**: Ativação/desativação de funcionalidades
- **Controle baseado em planos contratados**: Limites por tipo de plano
- **Configurações globais do sistema**: Parâmetros gerais da aplicação

### Features Avançadas
- **Interface de gerenciamento** visual de features
- **Controle granular de permissões** por usuário/empresa
- **Sistema de planos e limites** automático
- **Auditoria de mudanças** completa
- **Templates de configuração** por segmento

## 🏗️ Database Schema

Ver arquivo dedicado: `docs/database-schema.md` - Seção: Módulo 8 - Configurações

### Principais Modelos
```typescript
// Features flags
model FeatureFlag {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  isActive    Boolean  @default(false)
  
  // Controle por plano
  requiredPlan PlanType?
  
  // Controle por usuário/empresa
  enabledFor  Json?    // { users: [], companies: [], roles: [] }
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Configurações da empresa
model CompanySettings {
  id          String   @id @default(uuid())
  companyId   String   @unique
  company     Company  @relation(fields: [companyId], references: [id])
  
  // Configurações gerais
  timezone    String   @default("America/Sao_Paulo")
  currency    String   @default("BRL")
  language    String   @default("pt-BR")
  
  // Configurações de negócio
  workingHours Json?   // Horários padrão da empresa
  leadAutoAssignment Boolean @default(true)
  appointmentReminders Boolean @default(true)
  
  // Integrações
  whatsappEnabled Boolean @default(false)
  googleCalendarEnabled Boolean @default(false)
  vivaRealEnabled Boolean @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Configurações do usuário
model UserSettings {
  id          String   @id @default(uuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  
  // Preferências
  theme       String   @default("dark")
  notifications Json?  // Configurações de notificação
  dashboard   Json?    // Configurações do dashboard
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## 🎨 Interface Planejada

### Componentes Principais
- **SettingsLayout**: Layout principal com navegação por tabs
- **FeatureFlagsManager**: Gestão visual de features flags
- **CompanySettingsForm**: Configurações da empresa
- **UserPreferences**: Preferências pessoais
- **PlansManager**: Gestão de planos e limites
- **AuditLog**: Log de mudanças de configuração
- **PermissionsMatrix**: Matriz visual de permissões

### Design System
- **Tabs organization**: Organização por categorias
- **Toggle switches**: Controls visuais para features
- **Form sections**: Seções organizadas por funcionalidade
- **Permission grid**: Grid visual de permissões
- **Status indicators**: Indicadores de status das features

## 🔧 Arquitetura Técnica

### Feature Flags System
```typescript
interface FeatureFlagService {
  isFeatureEnabled(featureName: string, context?: {
    userId?: string;
    companyId?: string;
    planType?: PlanType;
  }): Promise<boolean>;
  
  enableFeature(featureName: string, target: {
    users?: string[];
    companies?: string[];
    roles?: UserRole[];
  }): Promise<void>;
  
  disableFeature(featureName: string, target?: any): Promise<void>;
}

// React hook for feature flags
const useFeatureFlag = (featureName: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['feature-flag', featureName, user?.id],
    queryFn: () => featureFlagService.isFeatureEnabled(featureName, {
      userId: user?.id,
      companyId: user?.companyId,
      planType: user?.company?.planType
    })
  });
};
```

### Settings Management
```typescript
interface SettingsManager {
  // Company settings
  getCompanySettings(companyId: string): Promise<CompanySettings>;
  updateCompanySettings(companyId: string, settings: Partial<CompanySettings>): Promise<void>;
  
  // User settings
  getUserSettings(userId: string): Promise<UserSettings>;
  updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void>;
  
  // Audit
  logSettingChange(change: SettingChange): Promise<void>;
}
```

## 📱 Funcionalidades Específicas

### DEV MASTER Controls
- **Global feature management**: Controle total sobre todas as features
- **Plan restrictions**: Definição de limites por plano
- **Company overrides**: Exceções específicas por empresa
- **System health**: Monitoramento global do sistema
- **Emergency controls**: Desativação rápida de features problemáticas

### ADMIN Controls
- **Company settings**: Configurações específicas da imobiliária
- **User permissions**: Gestão de permissões da equipe
- **Integration toggles**: Ativação/desativação de integrações
- **Business rules**: Configuração de regras de negócio
- **Notifications**: Configuração de alertas e notificações

### AGENT Controls
- **Personal preferences**: Tema, idioma, notificações
- **Dashboard customization**: Layout personalizado
- **Notification settings**: Preferências de comunicação
- **Working hours**: Horários pessoais de trabalho
- **Privacy settings**: Configurações de privacidade

### System-wide Features
- **Multi-tenancy**: Isolamento por empresa
- **A/B testing**: Testes de features para grupos
- **Gradual rollout**: Liberação gradual de features
- **Kill switches**: Desativação rápida em emergências
- **Feature dependencies**: Gestão de dependências entre features

## 🔌 Integrações Necessárias

### 1. Feature Flag Service
- **LaunchDarkly** ou similar (opcional)
- **Custom implementation** no Supabase
- **Real-time updates** via WebSockets
- **Caching strategy** para performance

### 2. Audit System
- **Change tracking** completo
- **User attribution** para todas as mudanças
- **Rollback capabilities** para configurações
- **Compliance reporting** automático

### 3. Plan Management
- **Stripe integration** para billing
- **Usage metering** automático
- **Limit enforcement** em tempo real
- **Upgrade/downgrade** flows

## 🧪 Plano de Implementação

### Fase 1: Estrutura Base (2 semanas)
1. **Database models** implementados
2. **Basic settings CRUD** funcionando
3. **Feature flags** sistema básico

### Fase 2: Interface Admin (2 semanas)
1. **Admin settings** interface completa
2. **Feature flags** management UI
3. **Company settings** form funcionando

### Fase 3: Permissions System (2 semanas)
1. **Permissions matrix** implementada
2. **Role-based access** funcionando
3. **Plan restrictions** aplicadas

### Fase 4: Advanced Features (2 semanas)
1. **Audit system** completo
2. **A/B testing** básico
3. **Emergency controls** implementados

### Fase 5: Polish & Testing (1 semana)
1. **UI/UX** refinements
2. **Performance** optimization
3. **Security** audit

## 📊 Métricas de Sucesso

### Técnicas
- Settings load < 500ms
- Feature flag check < 50ms
- 99.9% uptime para feature flags
- Zero downtime para config changes

### Funcionais
- Redução 80% no tempo de configuração
- Aumento 50% na adoção de novas features
- Melhoria 40% na satisfação do admin
- Automação 90% da gestão de permissões

## ⚠️ Considerações Importantes

### Security
- **Privilege escalation** prevention
- **Audit trails** completos
- **Sensitive data** encryption
- **Access control** granular

### Performance
- **Feature flag caching** otimizado
- **Settings lazy loading** implementado
- **Database indexes** otimizados
- **Background processing** para audits

### Scalability
- **Multi-tenant** architecture
- **Horizontal scaling** preparado
- **Cache invalidation** inteligente
- **Database partitioning** considerado

## 🔗 Integrações Futuras

### Advanced Analytics
- **Usage analytics** por feature
- **A/B testing** results tracking
- **Performance impact** analysis
- **User behavior** insights

### External Systems
- **Single Sign-On** (SSO) integration
- **Enterprise directory** sync
- **Compliance frameworks** integration
- **Third-party** billing systems

### Automation
- **Auto-scaling** based on usage
- **Smart recommendations** for settings
- **Predictive** feature adoption
- **Automated** rollbacks

---

**Próximo passo recomendado**: Iniciar Fase 1 com implementação dos database models e sistema básico de feature flags, seguido da interface de administração para gestão de configurações.