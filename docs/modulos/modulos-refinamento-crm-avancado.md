# 🚀 PLANO DE REFINAMENTO - MÓDULO CRM AVANÇADO

**Data:** 03/02/2025  
**Status:** 🟢 REFINAMENTO PROGRAMADO  
**Módulo:** CRM Avançado (Sistema de Gestão de Relacionamento)  
**Pontuação Atual:** 9.2/10  
**Meta:** 9.8/10  

---

## 📊 **VISÃO GERAL**

O Módulo CRM Avançado representa uma **obra-prima de desenvolvimento frontend** com arquitetura excepcional, componentes especializados e funcionalidades avançadas. O refinamento foca na migração para APIs reais, implementação de testes e otimizações de performance.

### **Status Atual vs. Meta**
- **Componentes UI**: ✅ 100% completos (4 componentes especializados)
- **Funcionalidades**: ✅ 100% mockadas funcionais
- **Arquitetura**: ✅ Excepcional (9.8/10)
- **Migração para APIs Reais**: ❌ 0% → Meta: 100%
- **Cobertura de Testes**: ❌ 0% → Meta: 85%

---

## 🎯 **PROBLEMAS IDENTIFICADOS**

### **🔴 Críticos**
1. **Ausência Total de Testes**: 0% de cobertura em código crítico
2. **Dependência de Dados Mockados**: 100% simulado, necessita migração
3. **Segurança Limitada**: Sem RLS, rate limiting ou validação server-side

### **🟡 Moderados**
4. **Performance com Grandes Volumes**: Sem virtualização para +1000 itens
5. **Funcionalidades Real-time**: Preparado mas não implementado
6. **Integração com Outros Módulos**: Isolado do ecossistema

### **🟢 Melhorias**
7. **Bulk Operations**: Para ações em massa
8. **Advanced Analytics**: Machine learning integration
9. **Mobile Optimization**: Componentes específicos para mobile

---

## 📅 **CRONOGRAMA DE REFINAMENTO**

### **Fase 1: Fundação de Testes** (4 dias)
- Configuração completa de testing framework
- Testes críticos para hooks e algoritmos
- Pipeline CI/CD automatizado

### **Fase 2: Migração para APIs Reais** (6 dias)
- Criação de adapter layer
- Integração com Supabase
- RLS e validações server-side

### **Fase 3: Performance e Real-time** (5 dias)
- Virtualização e lazy loading
- WebSocket integration
- Cache optimization

### **Fase 4: Features Avançadas** (4 dias)
- Bulk operations
- Advanced analytics
- Mobile components

---

## 🔧 **DETALHAMENTO DAS ETAPAS**

### **Etapa 1: Configuração Completa de Testes**
**Duração:** 2 dias  
**Prioridade:** 🔴 Crítica

#### **Objetivos:**
- Framework de testes robusto (Vitest + Testing Library)
- Testes unitários para algoritmos críticos
- Testes de componentes principais
- Mock de APIs com MSW

#### **Implementação:**

**Configuração Base:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom msw
```

**Testes do Lead Scoring Algorithm (Crítico):**
```typescript
// src/algorithms/__tests__/leadScoring.test.ts
describe('Lead Scoring Algorithm', () => {
  test('should calculate score correctly with all factors', () => {
    const factors = {
      engagement: 80,
      demographics: 60,
      behavior: 90,
      firmographics: 70
    };
    
    const expectedScore = Math.round(
      factors.engagement * 0.4 +
      factors.demographics * 0.2 +
      factors.behavior * 0.3 +
      factors.firmographics * 0.1
    );
    
    expect(calculateLeadScore(factors)).toBe(expectedScore);
  });
  
  test('should handle edge cases', () => {
    expect(calculateLeadScore({ engagement: 0, demographics: 0, behavior: 0, firmographics: 0 })).toBe(0);
    expect(calculateLeadScore({ engagement: 100, demographics: 100, behavior: 100, firmographics: 100 })).toBe(100);
  });
  
  test('should classify leads correctly', () => {
    expect(classifyLead(85)).toBe('Hot');
    expect(classifyLead(70)).toBe('Warm');
    expect(classifyLead(50)).toBe('Cold');
    expect(classifyLead(30)).toBe('Frozen');
  });
});
```

**Testes de Hooks (React Query):**
```typescript
// src/hooks/__tests__/useCRMData.test.ts
describe('useCRMData Hooks', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  test('useContacts should fetch and cache data', async () => {
    const { result } = renderHook(() => useContacts(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    });
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(result.current.data).toBeDefined();
    expect(result.current.data.data).toHaveLength(15);
  });
  
  test('useUpdateLeadScore should update and invalidate cache', async () => {
    // Test implementation
  });
});
```

**Testes de Componentes:**
```typescript
// src/components/crm/__tests__/LeadScoreCard.test.tsx
describe('LeadScoreCard Component', () => {
  const mockContact = {
    id: '1',
    name: 'João Silva',
    email: 'joao@example.com',
    score: 85
  };
  
  test('should render contact information correctly', () => {
    render(<LeadScoreCard contact={mockContact} />);
    
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('joao@example.com')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
  });
  
  test('should show correct classification', () => {
    render(<LeadScoreCard contact={mockContact} />);
    expect(screen.getByText('Hot')).toBeInTheDocument();
  });
  
  test('should handle score adjustment', async () => {
    const user = userEvent.setup();
    render(<LeadScoreCard contact={mockContact} />);
    
    await user.click(screen.getByRole('button', { name: /ajustar/i }));
    // Test modal opening and interaction
  });
});
```

#### **Critérios de Aceite:**
- ✅ Framework configurado e executando
- ✅ Testes algoritmos: 100% cobertura
- ✅ Testes hooks: 90% cobertura
- ✅ Testes componentes: 70% cobertura
- ✅ Pipeline CI/CD executando testes

---

### **Etapa 2: Testes de Segmentação e Automação**
**Duração:** 2 dias  
**Prioridade:** 🔴 Crítica

#### **Objetivos:**
- Testes para engine de segmentação
- Testes para workflow de automação
- Validação de regras de negócio
- Edge cases coverage

#### **Implementação:**

**Testes da Engine de Segmentação:**
```typescript
// src/engines/__tests__/segmentation.test.ts
describe('Segmentation Engine', () => {
  const mockContacts = [
    { id: '1', score: 85, category: 'CLIENT', lastActivity: '2024-01-15' },
    { id: '2', score: 45, category: 'LEAD', lastActivity: '2024-01-10' }
  ];
  
  test('should evaluate simple rules correctly', () => {
    const rule = {
      field: 'score',
      operator: 'gte',
      value: 80
    };
    
    const result = evaluateSegmentationRule(mockContacts[0], rule);
    expect(result).toBe(true);
    
    const result2 = evaluateSegmentationRule(mockContacts[1], rule);
    expect(result2).toBe(false);
  });
  
  test('should evaluate complex rules with AND/OR', () => {
    const complexRule = {
      operator: 'AND',
      conditions: [
        { field: 'score', operator: 'gte', value: 80 },
        { field: 'category', operator: 'equals', value: 'CLIENT' }
      ]
    };
    
    const result = evaluateComplexRule(mockContacts[0], complexRule);
    expect(result).toBe(true);
  });
  
  test('should handle date-based rules', () => {
    const dateRule = {
      field: 'lastActivity',
      operator: 'within_days',
      value: 7
    };
    
    const result = evaluateDateRule(mockContacts[0], dateRule);
    expect(result).toBe(false); // Mais de 7 dias
  });
});
```

**Testes do Workflow Engine:**
```typescript
// src/engines/__tests__/automation.test.ts
describe('Automation Workflow Engine', () => {
  test('should execute simple workflow', async () => {
    const workflow = {
      trigger: { type: 'score_change', threshold: 80 },
      actions: [
        { type: 'send_email', template: 'hot_lead_alert' },
        { type: 'update_stage', value: 'QUALIFIED' }
      ]
    };
    
    const contact = { id: '1', score: 85 };
    const result = await executeWorkflow(workflow, contact);
    
    expect(result.success).toBe(true);
    expect(result.executedActions).toHaveLength(2);
  });
  
  test('should handle workflow failures gracefully', async () => {
    const faultyWorkflow = {
      trigger: { type: 'score_change', threshold: 80 },
      actions: [
        { type: 'invalid_action', value: 'test' }
      ]
    };
    
    const contact = { id: '1', score: 85 };
    const result = await executeWorkflow(faultyWorkflow, contact);
    
    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
  });
});
```

#### **Critérios de Aceite:**
- ✅ Segmentation engine: 95% cobertura
- ✅ Automation engine: 90% cobertura
- ✅ Edge cases cobertas
- ✅ Performance tests implementados

---

### **Etapa 3: Adapter Layer para APIs Reais**
**Duração:** 3 dias  
**Prioridade:** 🔴 Crítica

#### **Objetivos:**
- Criar camada de abstração para APIs
- Facilitar migração gradual mock → real
- Manter compatibilidade com código existente
- Implementar fallbacks inteligentes

#### **Implementação:**

**Interface Abstrata:**
```typescript
// src/adapters/CRMApiAdapter.ts
export interface CRMApiAdapter {
  contacts: ContactsAPI;
  deals: DealsAPI;
  leadScoring: LeadScoringAPI;
  activities: ActivitiesAPI;
  segmentation: SegmentationAPI;
  automation: AutomationAPI;
}

export abstract class BaseCRMAdapter implements CRMApiAdapter {
  abstract contacts: ContactsAPI;
  abstract deals: DealsAPI;
  abstract leadScoring: LeadScoringAPI;
  abstract activities: ActivitiesAPI;
  abstract segmentation: SegmentationAPI;
  abstract automation: AutomationAPI;
}
```

**Implementação Mock (Atual):**
```typescript
// src/adapters/MockCRMAdapter.ts
export class MockCRMAdapter extends BaseCRMAdapter {
  contacts = new MockContactsAPI();
  deals = new MockDealsAPI();
  leadScoring = new MockLeadScoringAPI();
  activities = new MockActivitiesAPI();
  segmentation = new MockSegmentationAPI();
  automation = new MockAutomationAPI();
}
```

**Implementação Supabase (Nova):**
```typescript
// src/adapters/SupabaseCRMAdapter.ts
export class SupabaseCRMAdapter extends BaseCRMAdapter {
  private supabase = createClient();
  
  contacts = new SupabaseContactsAPI(this.supabase);
  deals = new SupabaseDealsAPI(this.supabase);
  leadScoring = new SupabaseLeadScoringAPI(this.supabase);
  activities = new SupabaseActivitiesAPI(this.supabase);
  segmentation = new SupabaseSegmentationAPI(this.supabase);
  automation = new SupabaseAutomationAPI(this.supabase);
}
```

**Factory Pattern:**
```typescript
// src/adapters/CRMAdapterFactory.ts
export class CRMAdapterFactory {
  static create(): CRMApiAdapter {
    const isProduction = import.meta.env.PROD;
    const forceReal = import.meta.env.VITE_FORCE_REAL_API === 'true';
    
    if (isProduction || forceReal) {
      return new SupabaseCRMAdapter();
    }
    
    return new MockCRMAdapter();
  }
}
```

**Atualização dos Hooks:**
```typescript
// src/hooks/useCRMData.ts - Refatorado
const crmAdapter = CRMAdapterFactory.create();

export const useContacts = (filters?: ContactFilters) => {
  return useQuery({
    queryKey: ['contacts', filters],
    queryFn: () => crmAdapter.contacts.getAll(filters),
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};
```

#### **Critérios de Aceite:**
- ✅ Adapter layer implementado
- ✅ Zero breaking changes no código existente
- ✅ Migração gradual funcionando
- ✅ Fallbacks implementados
- ✅ Feature flags funcionais

---

### **Etapa 4: Implementação das APIs Supabase**
**Duração:** 3 dias  
**Prioridade:** 🔴 Crítica

#### **Objetivos:**
- Implementar todas as APIs reais no Supabase
- RLS policies para segurança
- Validação server-side
- Rate limiting

#### **Implementação:**

**Contacts API Real:**
```typescript
// src/adapters/supabase/SupabaseContactsAPI.ts
export class SupabaseContactsAPI implements ContactsAPI {
  constructor(private supabase: SupabaseClient) {}
  
  async getAll(filters?: ContactFilters): Promise<ApiResponse<Contact[]>> {
    let query = this.supabase
      .from('Contact')
      .select(`
        id, name, email, phone, category, status,
        lastContactAt, avatarUrl, leadScore, leadStage
      `);
    
    // Aplicar filtros
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters?.search) {
      query = query.or(`
        name.ilike.%${filters.search}%,
        email.ilike.%${filters.search}%
      `);
    }
    
    // Paginação
    const from = ((filters?.page || 1) - 1) * (filters?.limit || 50);
    const to = from + (filters?.limit || 50) - 1;
    
    const { data, error, count } = await query
      .range(from, to)
      .order('createdAt', { ascending: false });
    
    if (error) throw error;
    
    return {
      data: data || [],
      total: count || 0,
      page: filters?.page || 1,
      limit: filters?.limit || 50
    };
  }
  
  async create(contact: CreateContactData): Promise<Contact> {
    // Validação com Zod
    const validatedData = ContactCreateSchema.parse(contact);
    
    const { data, error } = await this.supabase
      .from('Contact')
      .insert(validatedData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Auto-criar lead score inicial
    await this.createInitialLeadScore(data.id);
    
    return data;
  }
  
  private async createInitialLeadScore(contactId: string) {
    const initialScore = {
      contactId,
      score: 50,
      factors: {
        engagement: 50,
        demographics: 50,
        behavior: 50,
        firmographics: 50
      }
    };
    
    await this.supabase
      .from('LeadScore')
      .insert(initialScore);
  }
}
```

**RLS Policies:**
```sql
-- Política para contatos - usuários só veem da própria empresa
CREATE POLICY "contacts_company_isolation" ON Contact
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM User 
    WHERE User.id = auth.uid() 
    AND User.companyId = Contact.companyId
  )
);

-- Política para lead scores
CREATE POLICY "lead_scores_company_isolation" ON LeadScore
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM Contact 
    JOIN User ON User.companyId = Contact.companyId
    WHERE Contact.id = LeadScore.contactId 
    AND User.id = auth.uid()
  )
);
```

**Rate Limiting:**
```typescript
// src/middleware/rateLimiting.ts
export class RateLimiter {
  private static requests = new Map<string, number[]>();
  
  static async checkLimit(userId: string, action: string, limit: number = 100) {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minuto
    
    const requests = this.requests.get(key) || [];
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= limit) {
      throw new Error('Rate limit exceeded');
    }
    
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
  }
}
```

#### **Critérios de Aceite:**
- ✅ Todas as APIs implementadas
- ✅ RLS policies ativas
- ✅ Rate limiting funcionando
- ✅ Validação server-side
- ✅ Logs de auditoria

---

### **Etapa 5: Performance Optimization**
**Duração:** 3 dias  
**Prioridade:** 🟡 Moderada

#### **Objetivos:**
- Virtualização para listas grandes
- Lazy loading de componentes
- Memoização inteligente
- Bundle optimization

#### **Implementação:**

**Virtualização de Listas:**
```typescript
// src/components/crm/VirtualizedContactList.tsx
import { FixedSizeList as List } from 'react-window';

export const VirtualizedContactList = ({ contacts, onContactClick }) => {
  const ContactItem = ({ index, style }) => {
    const contact = contacts[index];
    return (
      <div style={style}>
        <LeadScoreCard 
          contact={contact} 
          onClick={() => onContactClick(contact)}
        />
      </div>
    );
  };
  
  return (
    <List
      height={600}
      itemCount={contacts.length}
      itemSize={150}
      className="scrollbar-thin"
    >
      {ContactItem}
    </List>
  );
};
```

**Lazy Loading de Componentes:**
```typescript
// src/pages/CRM.tsx - Refatorado
const LeadScoreDashboard = lazy(() => import('../components/crm/lead-scoring/LeadScoreDashboard'));
const SegmentationRules = lazy(() => import('../components/crm/segmentation/SegmentationRules'));
const AutomationBuilder = lazy(() => import('../components/crm/automation/AutomationBuilder'));

export const CRM = () => {
  return (
    <div className="space-y-6">
      <CRMHeader />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="dashboard">
          <Suspense fallback={<DashboardSkeleton />}>
            <LeadScoreDashboard />
          </Suspense>
        </TabsContent>
        <TabsContent value="scoring">
          <Suspense fallback={<ScoringListSkeleton />}>
            <LeadScoringList />
          </Suspense>
        </TabsContent>
        {/* ... outros tabs */}
      </Tabs>
    </div>
  );
};
```

**Memoização Avançada:**
```typescript
// src/hooks/useCRMData.ts - Optimized
export const useContactsOptimized = (filters?: ContactFilters) => {
  // Memoizar filtros para evitar re-fetches desnecessários
  const stableFilters = useMemo(() => filters, [
    filters?.search,
    filters?.category,
    filters?.status,
    filters?.page
  ]);
  
  return useQuery({
    queryKey: ['contacts', stableFilters],
    queryFn: () => crmAdapter.contacts.getAll(stableFilters),
    staleTime: 5 * 60 * 1000,
    select: useCallback((data) => {
      // Memoizar transformações custosas
      return {
        ...data,
        data: data.data.map(contact => ({
          ...contact,
          displayName: `${contact.name} (${contact.email})`,
          scoreLevel: classifyLead(contact.leadScore || 50)
        }))
      };
    }, [])
  });
};
```

**Bundle Optimization:**
```typescript
// vite.config.ts - Code splitting
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'crm-core': [
            './src/components/crm/lead-scoring/LeadScoreCard.tsx',
            './src/components/crm/lead-scoring/LeadScoreDashboard.tsx'
          ],
          'crm-automation': [
            './src/components/crm/automation/AutomationBuilder.tsx'
          ],
          'crm-segmentation': [
            './src/components/crm/segmentation/SegmentationRules.tsx'
          ]
        }
      }
    }
  }
});
```

#### **Critérios de Aceite:**
- ✅ Virtualização funcionando para +1000 itens
- ✅ Lazy loading reduzindo bundle inicial
- ✅ Performance mantida < 100ms render
- ✅ Bundle size otimizado (-30%)

---

### **Etapa 6: Real-time Updates**
**Duração:** 2 dias  
**Prioridade:** 🟡 Moderada

#### **Objetivos:**
- WebSocket integration para updates em tempo real
- Optimistic updates para melhor UX
- Conflict resolution
- Real-time notifications

#### **Implementação:**

**WebSocket Hook:**
```typescript
// src/hooks/useRealTimeUpdates.ts
export const useRealTimeUpdates = (entityType: string) => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel(`${entityType}_changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: entityType 
        },
        (payload) => {
          // Invalidar queries relacionadas
          queryClient.invalidateQueries([entityType.toLowerCase()]);
          
          // Mostrar toast notification
          if (payload.eventType === 'INSERT') {
            toast.success(`Novo ${entityType} adicionado`);
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [entityType, queryClient]);
};
```

**Optimistic Updates:**
```typescript
// src/hooks/useCRMData.ts - Com optimistic updates
export const useUpdateContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: UpdateContactParams) => 
      crmAdapter.contacts.update(id, data),
    
    onMutate: async ({ id, data }) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries(['contacts']);
      
      // Snapshot do estado atual
      const previousContacts = queryClient.getQueryData(['contacts']);
      
      // Update otimista
      queryClient.setQueryData(['contacts'], (old: any) => ({
        ...old,
        data: old.data.map((contact: Contact) => 
          contact.id === id ? { ...contact, ...data } : contact
        )
      }));
      
      return { previousContacts };
    },
    
    onError: (err, variables, context) => {
      // Rollback em caso de erro
      if (context?.previousContacts) {
        queryClient.setQueryData(['contacts'], context.previousContacts);
      }
    },
    
    onSettled: () => {
      // Re-fetch para garantir consistência
      queryClient.invalidateQueries(['contacts']);
    }
  });
};
```

#### **Critérios de Aceite:**
- ✅ Real-time updates funcionando
- ✅ Optimistic updates implementadas
- ✅ Conflict resolution robusta
- ✅ Notifications em tempo real

---

### **Etapa 7: Bulk Operations**
**Duração:** 2 dias  
**Prioridade:** 🟢 Melhoria

#### **Objetivos:**
- Seleção múltipla de contatos
- Ações em massa (update score, stage, etc.)
- Progress indicators
- Undo functionality

#### **Implementação:**

**Bulk Selection Component:**
```typescript
// src/components/crm/BulkSelection.tsx
export const BulkSelection = ({ 
  items, 
  selectedItems, 
  onSelectionChange,
  children 
}) => {
  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(items.map(item => item.id));
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox 
            checked={selectedItems.length === items.length}
            indeterminate={selectedItems.length > 0 && selectedItems.length < items.length}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            {selectedItems.length} de {items.length} selecionados
          </span>
        </div>
        
        {selectedItems.length > 0 && (
          <BulkActions 
            selectedItems={selectedItems}
            onAction={onBulkAction}
          />
        )}
      </div>
      
      {children}
    </div>
  );
};
```

**Bulk Actions:**
```typescript
// src/components/crm/BulkActions.tsx
export const BulkActions = ({ selectedItems, onAction }) => {
  const bulkUpdateScore = useBulkUpdateLeadScore();
  const bulkUpdateStage = useBulkUpdateLeadStage();
  
  const handleBulkScoreUpdate = async (adjustment: number) => {
    const progressToast = toast.loading(
      `Atualizando score de ${selectedItems.length} contatos...`
    );
    
    try {
      await bulkUpdateScore.mutateAsync({
        contactIds: selectedItems,
        adjustment
      });
      
      toast.success(
        `Score atualizado para ${selectedItems.length} contatos`,
        { id: progressToast }
      );
    } catch (error) {
      toast.error('Erro ao atualizar scores', { id: progressToast });
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Ações em Massa
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleBulkScoreUpdate(10)}>
          <TrendingUp className="mr-2 h-4 w-4" />
          Aumentar Score (+10)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleBulkScoreUpdate(-10)}>
          <TrendingDown className="mr-2 h-4 w-4" />
          Diminuir Score (-10)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAction('export')}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Selecionados
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

#### **Critérios de Aceite:**
- ✅ Seleção múltipla funcionando
- ✅ Ações em massa implementadas
- ✅ Progress indicators visuais
- ✅ Undo functionality

---

### **Etapa 8: Advanced Analytics**
**Duração:** 2 dias  
**Prioridade:** 🟢 Melhoria

#### **Objetivos:**
- Métricas avançadas de CRM
- Predictive analytics básico
- Custom dashboards
- Export de relatórios

#### **Implementação:**

**Advanced Analytics Hook:**
```typescript
// src/hooks/useCRMAnalytics.ts
export const useCRMAnalytics = (period: string = '30d') => {
  return useQuery({
    queryKey: ['crm-analytics', period],
    queryFn: async () => {
      const analytics = await crmAdapter.analytics.getAdvanced(period);
      
      return {
        ...analytics,
        predictions: await calculatePredictions(analytics),
        trends: await calculateTrends(analytics),
        recommendations: await generateRecommendations(analytics)
      };
    },
    staleTime: 10 * 60 * 1000 // 10 minutos
  });
};

const calculatePredictions = async (data: AnalyticsData) => {
  // Implementar machine learning básico
  const conversionTrend = calculateLinearRegression(data.conversions);
  const scoreTrend = calculateLinearRegression(data.scores);
  
  return {
    nextMonthConversions: extrapolate(conversionTrend, 30),
    averageScoreDirection: scoreTrend.slope > 0 ? 'up' : 'down',
    hotLeadsPrediction: predictHotLeads(data)
  };
};
```

**Advanced Charts:**
```typescript
// src/components/crm/analytics/AdvancedCharts.tsx
export const AdvancedCharts = ({ data }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <FunnelChart data={data.funnelData}>
              <Tooltip />
              <Funnel dataKey="value" />
            </FunnelChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Score Distribution Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <ScoreHeatmap data={data.scoreDistribution} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Predictive Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <PredictionChart predictions={data.predictions} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <RecommendationsList recommendations={data.recommendations} />
        </CardContent>
      </Card>
    </div>
  );
};
```

#### **Critérios de Aceite:**
- ✅ Analytics avançadas implementadas
- ✅ Predictive analytics funcionando
- ✅ Custom dashboards
- ✅ Export de relatórios

---

## 📊 **MÉTRICAS DE SUCESSO**

### **Qualidade de Código**
- **Cobertura de Testes:** 0% → 85%
- **Performance:** Manter < 100ms render time
- **Bundle Size:** Otimizar para < 200KB gzipped
- **TypeScript:** 100% tipado mantido

### **Funcionalidades**
- **APIs Reais:** 0% → 100%
- **Real-time Updates:** 0% → 100%
- **Advanced Features:** 70% → 95%
- **Security:** 60% → 95%

### **Performance e UX**
- **Large Lists:** Suporte para 10k+ itens
- **Real-time:** < 500ms latency
- **Bulk Operations:** Suporte para 1000+ itens
- **Mobile:** 100% responsive

---

## 🛠️ **RECURSOS NECESSÁRIOS**

### **Técnicos**
- 1 Developer React Senior (lead)
- 1 Developer Full-stack (APIs/Backend)
- 1 QA Engineer (testes automatizados)

### **Design**
- 1 UI/UX Designer (analytics dashboard)
- Componentes de visualização avançada
- Mobile-first design system

### **Infraestrutura**
- WebSocket infrastructure
- Real-time database setup
- Performance monitoring
- Advanced analytics tools

### **Ferramentas**
- Vitest + Testing Library + MSW
- React Window para virtualização
- Recharts + D3.js para analytics
- Supabase Real-time

---

## 🚀 **PRÓXIMOS PASSOS**

### **Imediato (Esta Semana)**
1. ✅ Aprovação do plano de refinamento
2. ✅ Setup completo do testing framework
3. ✅ Início dos testes críticos
4. ✅ Preparação do adapter layer

### **Curto Prazo (2 semanas)**
1. 🔄 Suite de testes completa (85% cobertura)
2. 🔄 APIs reais implementadas e funcionais
3. 🔄 Performance optimization completa
4. 🔄 Real-time updates funcionando

### **Médio Prazo (1 mês)**
1. 📋 Bulk operations implementadas
2. 📋 Advanced analytics funcionais
3. 📋 Mobile optimization completa
4. 📋 Documentação técnica finalizada

---

## 📋 **OBSERVAÇÕES FINAIS**

### **Pontos de Atenção**
- **Backwards Compatibility**: Manter compatibilidade durante migração
- **Data Migration**: Planejar migração de dados mockados para reais
- **Performance**: Monitorar impacto das features real-time
- **Security**: Validar todas as políticas de segurança

### **Riscos Identificados**
- **Migração APIs**: Complexidade pode ser maior que estimada
- **Performance**: Real-time features podem impactar performance
- **Testing**: Cobertura de 85% pode ser ambiciosa
- **Integration**: Integração com outros módulos pode requerer ajustes

### **Critérios de Entrega**
- ✅ Todos os testes passando (85% cobertura)
- ✅ APIs reais funcionando em produção
- ✅ Performance mantida/melhorada
- ✅ Real-time updates operacionais
- ✅ Documentação técnica completa
- ✅ Code review e QA aprovados

---

**Preparado por:** Claude AI Assistant  
**Aprovado por:** [Pending]  
**Data de Início:** [TBD]  
**Data de Conclusão Estimada:** [TBD + 19 dias]