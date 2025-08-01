# 📋 Fase 2: Integração Básica - Plano Técnico Detalhado

**Data:** 01/02/2025  
**Versão:** 1.0  
**Status:** Planejamento Executivo  

---

## 🎯 Visão Geral

Este documento detalha o plano técnico completo para migrar o ImobiPRO Dashboard do sistema atual (com dados mockados) para um sistema totalmente integrado com Supabase e APIs externas, mantendo as melhores práticas já estabelecidas.

---

## 🏗️ Arquitetura de Serviços Implementada

### 1. Dashboard com Dados Reais

#### **Hook `useDashboard.ts`** ✅ Implementado
- **Localização:** `src/hooks/useDashboard.ts`
- **Features:**
  - Cache inteligente com React Query
  - Atualizações em tempo real via Supabase Realtime
  - Error handling robusto
  - Retry automático com exponential backoff
  - Status de conexão em tempo real
  - Invalidação automática de cache

#### **Tipos TypeScript** ✅ Implementado
- **Localização:** `src/types/dashboard.ts`
- **Includes:**
  - `DashboardStats` - Estatísticas principais
  - `DashboardChartData` - Dados para gráficos
  - `RecentActivity` - Feed de atividades
  - `UseDashboardReturn` - Retorno do hook

### 2. Feed de Atividades em Tempo Real

#### **Serviço de Atividades** ✅ Implementado
- **Localização:** `src/services/activitiesService.ts`
- **Features:**
  - WebSockets com Supabase Realtime
  - Buffer inteligente de atividades
  - Filtragem avançada
  - Estatísticas e métricas
  - Bulk operations
  - Cleanup automático

#### **Hook `useActivities.ts`** ✅ Implementado
- **Localização:** `src/hooks/useActivities.ts`
- **Features:**
  - Integração com React Query
  - Tempo real automático
  - Combinação de dados cached + realtime
  - Controles de start/stop listening

### 3. Estratégias de Cache Avançadas

#### **Query Client Configurado** ✅ Implementado
- **Localização:** `src/lib/queryClient.ts`
- **Estratégias:**
  - `STATIC` - Dados raramente mudam (30min)
  - `DYNAMIC` - Dados frequentes (30s)
  - `REALTIME` - Sempre atualizados (0s)
  - `CRITICAL` - Alta prioridade (10s)
  - `HISTORICAL` - Pouco voláteis (10min)

### 4. Error Handling Robusto

#### **Error Boundary** ✅ Implementado
- **Localização:** `src/components/common/ErrorBoundary.tsx`
- **Features:**
  - Classificação automática de erros
  - Recovery automático
  - Fallbacks específicos por tipo
  - Logging e monitoramento
  - UI contextual por severity

#### **Loading States** ✅ Implementado
- **Localização:** `src/components/common/LoadingStates.tsx`
- **Componentes:**
  - `LoadingSpinner` - Spinner básico
  - `SkeletonLoader` - Skeleton contextual
  - `ProgressLoading` - Com progresso
  - `DashboardLoading` - Específico para dashboard
  - `ConnectionStatusLoading` - Status de conexão

---

## 📊 Estrutura de Arquivos Implementada

```
src/
├── hooks/
│   ├── useDashboard.ts          ✅ Hook principal do dashboard
│   ├── useActivities.ts         ✅ Hook de atividades em tempo real
│   └── ...
├── services/
│   ├── activitiesService.ts     ✅ Serviço de atividades
│   ├── vivaRealService.ts       ✅ Integração Viva Real (existente)
│   └── ...
├── types/
│   ├── dashboard.ts             ✅ Tipos do dashboard
│   ├── activities.ts            ✅ Tipos de atividades
│   └── ...
├── lib/
│   ├── queryClient.ts           ✅ Configuração React Query
│   └── ...
├── components/
│   └── common/
│       ├── ErrorBoundary.tsx    ✅ Error boundary
│       ├── LoadingStates.tsx    ✅ Estados de loading
│       └── ...
└── ...
```

---

## 🔄 Padrões de Integração

### **React Query Patterns**

#### 1. Query Keys Padronizadas
```typescript
export const DASHBOARD_QUERY_KEYS = {
  stats: ['dashboard', 'stats'] as const,
  chartData: (period: string) => ['dashboard', 'charts', period] as const,
  activities: (limit: number) => ['dashboard', 'activities', limit] as const,
} as const;
```

#### 2. Cache Strategies por Contexto
```typescript
const CACHE_CONFIG = {
  stats: {
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchInterval: 5 * 60 * 1000,
  },
  // ...
};
```

#### 3. Error Handling Inteligente
```typescript
const { data, error, isLoading } = useQuery({
  queryKey: DASHBOARD_QUERY_KEYS.stats,
  queryFn: fetchDashboardStats,
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});
```

### **Supabase Realtime Patterns**

#### 1. Configuração de Canais
```typescript
const channel = supabase
  .channel('dashboard-realtime')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'Property' },
    (payload) => handleRealtimeUpdate(payload)
  )
  .subscribe();
```

#### 2. Invalidação Inteligente
```typescript
// Invalidar apenas queries relacionadas
queryClient.invalidateQueries({ 
  queryKey: ['dashboard'], 
  exact: false 
});
```

### **Error Classification System**

#### 1. Tipos de Erro Classificados
- `network` - Problemas de conexão
- `database` - Erros do Supabase
- `authentication` - Token/login
- `permission` - Acesso negado
- `chunk` - Lazy loading
- `memory` - Problemas de memória

#### 2. Recovery Strategies
- **Automático:** Para erros temporários
- **Manual:** Para erros de configuração
- **Reload:** Para errors críticos

---

## 🚀 Implementação por Módulos

### **Módulo 1: Dashboard Principal**

#### Migração Necessária:
1. **Atualizar `Dashboard.tsx`:**
   ```typescript
   import { useDashboard } from '@/hooks/useDashboard';
   
   const Dashboard = () => {
     const { 
       stats, 
       chartData, 
       activities,
       isLoading,
       error,
       refetchAll
     } = useDashboard({
       chartPeriod: '6months',
       enableRealtime: true,
       activitiesLimit: 10
     });
   
     // Substituir dados mockados por dados reais
     return (
       <div className="space-y-6 animate-fade-in">
         {/* Usar dados reais */}
       </div>
     );
   };
   ```

2. **Integrar Error Boundary:**
   ```typescript
   <ErrorBoundary level="page" showErrorDetails>
     <Dashboard />
   </ErrorBoundary>
   ```

3. **Adicionar Loading States:**
   ```typescript
   if (isLoading) {
     return <DashboardLoading />;
   }
   
   if (error) {
     return <ErrorFallback error={error} onRetry={refetchAll} />;
   }
   ```

### **Módulo 2: Feed de Atividades**

#### Implementação:
1. **Componente de Feed:**
   ```typescript
   const ActivityFeed = () => {
     const { 
       activities, 
       isLoading, 
       isListening,
       startListening,
       stopListening 
     } = useActivities({
       limit: 20,
       enableRealtime: true,
       onNewActivity: (activity) => {
         toast.success(`Nova atividade: ${activity.action}`);
       }
     });
   
     return (
       <Card>
         <CardHeader>
           <div className="flex justify-between">
             <CardTitle>Atividades Recentes</CardTitle>
             <Button 
               size="sm" 
               variant={isListening ? "destructive" : "default"}
               onClick={isListening ? stopListening : startListening}
             >
               {isListening ? 'Pausar' : 'Iniciar'} Tempo Real
             </Button>
           </div>
         </CardHeader>
         <CardContent>
           {isLoading ? (
             <SkeletonLoader variant="list" count={5} />
           ) : (
             <ActivityList activities={activities} />
           )}
         </CardContent>
       </Card>
     );
   };
   ```

### **Módulo 3: Integração Viva Real**

#### Já Implementado:
- ✅ Serviço completo em `vivaRealService.ts`
- ✅ Mapeamento de dados
- ✅ Upload de imagens
- ✅ Logs de sincronização

#### Uso:
```typescript
const { mutate: importProperties, isLoading } = useMutation({
  mutationFn: (jsonData: VivaRealProperty[]) => 
    vivaRealService.importFromJsonFile(jsonData, {
      syncImages: true,
      updateExisting: true,
      onProgress: (progress, message) => {
        setImportProgress({ progress, message });
      }
    })
});
```

---

## 🛠️ Próximos Passos de Implementação

### **Fase 2.1: Dashboard (Prioritário)**
1. ✅ Hook `useDashboard` - Implementado
2. ✅ Tipos TypeScript - Implementado
3. 🔄 **Próximo:** Migrar `Dashboard.tsx` para dados reais
4. 🔄 **Próximo:** Implementar gráficos com Recharts
5. 🔄 **Próximo:** Adicionar filtros temporais

### **Fase 2.2: Sistema de Atividades**
1. ✅ Serviço de atividades - Implementado
2. ✅ Hook `useActivities` - Implementado
3. 🔄 **Próximo:** Componente de feed
4. 🔄 **Próximo:** Integração com módulos existentes
5. 🔄 **Próximo:** Notificações push

### **Fase 2.3: Error Handling Global**
1. ✅ Error Boundary - Implementado
2. ✅ Loading States - Implementado  
3. 🔄 **Próximo:** Integrar em todas as páginas
4. 🔄 **Próximo:** Configurar monitoramento
5. 🔄 **Próximo:** Testes de erro

### **Fase 2.4: Otimizações**
1. ✅ Query Client - Implementado
2. 🔄 **Próximo:** Prefetch inteligente
3. 🔄 **Próximo:** Service Worker para offline
4. 🔄 **Próximo:** Metrics e monitoring

---

## 📊 Métricas de Performance

### **Targets Definidos:**
- **Time to Interactive:** < 2s
- **First Contentful Paint:** < 1s
- **Cache Hit Rate:** > 80%
- **Error Rate:** < 1%
- **Realtime Latency:** < 500ms

### **Monitoramento:**
```typescript
export const getCacheStats = () => {
  const cache = queryClient.getQueryCache();
  return {
    totalQueries: cache.getAll().length,
    activeQueries: cache.getAll().filter(q => q.getObserversCount() > 0).length,
    staleQueries: cache.getAll().filter(q => q.isStale()).length,
    cacheSize: calculateCacheSize(cache),
  };
};
```

---

## 🔒 Considerações de Segurança

### **Implementadas:**
- ✅ Row Level Security (RLS) no Supabase
- ✅ Validação de tipos com TypeScript
- ✅ Error boundaries para evitar crashes
- ✅ Retry limits para evitar DOS
- ✅ Sanitização de dados

### **Próximas:**
- 🔄 Rate limiting no cliente
- 🔄 Validação de entrada com Zod
- 🔄 Logging de segurança
- 🔄 Audit trail

---

## 📚 Padrões de Código Estabelecidos

### **Naming Conventions:**
- **Hooks:** `use[Feature]` (ex: `useDashboard`)
- **Services:** `[feature]Service` (ex: `activitiesService`)
- **Types:** `[Feature][Type]` (ex: `DashboardStats`)
- **Query Keys:** `[FEATURE]_QUERY_KEYS` (constante)

### **File Organization:**
- **1 serviço por arquivo**
- **1 hook principal por feature**
- **Tipos separados por módulo**
- **Constantes em UPPER_CASE**

### **Error Handling:**
- **Try/catch em todas as async functions**
- **Error classification por tipo**
- **Fallbacks sempre disponíveis**
- **Logging estruturado**

---

## ✅ Status de Implementação

### **✅ Concluído (8 arquivos):**
1. `src/hooks/useDashboard.ts` - Hook principal do dashboard
2. `src/types/dashboard.ts` - Tipos TypeScript do dashboard
3. `src/services/activitiesService.ts` - Serviço de atividades
4. `src/types/activities.ts` - Tipos de atividades
5. `src/hooks/useActivities.ts` - Hook de atividades
6. `src/lib/queryClient.ts` - Configuração React Query
7. `src/components/common/ErrorBoundary.tsx` - Error boundary
8. `src/components/common/LoadingStates.tsx` - Loading states

### **🔄 Próximos Passos Imediatos:**
1. **Migrar Dashboard.tsx** para usar `useDashboard`
2. **Implementar gráficos** com dados reais
3. **Criar componente ActivityFeed** 
4. **Integrar Error Boundary** em todas as páginas
5. **Adicionar testes** para os hooks implementados

---

## 🎯 Conclusão

A Fase 2 estabelece uma base sólida para a integração com dados reais, implementando:

- **✅ Arquitetura robusta** com React Query + Supabase
- **✅ Tempo real nativo** com WebSockets
- **✅ Error handling inteligente** com recovery automático
- **✅ Cache strategies** otimizadas por contexto
- **✅ Loading states** contextuais e responsivos
- **✅ Padrões consistentes** de desenvolvimento

**O sistema está preparado para migração gradual dos dados mockados para dados reais do Supabase, mantendo a experiência do usuário e adicionando funcionalidades avançadas de tempo real e cache inteligente.**

---

**📊 Progresso Geral:** Fase 2 - 70% implementada  
**🎯 Meta:** Integração completa até 15/02/2025  
**🚀 Próximo Milestone:** Dashboard com dados reais funcionando