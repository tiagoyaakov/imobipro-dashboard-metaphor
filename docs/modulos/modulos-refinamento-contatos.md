# 👥 PLANO DE REFINAMENTO - MÓDULO CONTATOS

**Data:** 03/02/2025  
**Status:** 🔴 REFINAMENTO URGENTE  
**Módulo:** Sistema de Gestão de Contatos  
**Pontuação Atual:** 4.5/10  
**Meta:** 8.5/10  

---

## 📊 **VISÃO GERAL**

O Módulo de Contatos possui **excelente design visual** e UX bem pensada, mas está **100% mockado** sem integração real. É o módulo com maior gap de implementação do sistema, necessitando desenvolvimento completo de funcionalidades básicas e integração com o ecossistema ImobiPRO.

### **Status Atual vs. Meta**
- **Interface Visual**: ✅ 85% completa (design excepcional)
- **Funcionalidades Reais**: ❌ 0% → Meta: 100%
- **Integração Backend**: ❌ 0% → Meta: 100%
- **CRUD Operations**: ❌ 0% → Meta: 100%
- **Testes**: ❌ 0% → Meta: 75%

---

## 🎯 **PROBLEMAS IDENTIFICADOS**

### **🔴 Críticos de Funcionalidade**
1. **100% Mockado**: Todos os dados são hardcoded, zero integração real
2. **Sem CRUD**: Não existe criação, edição ou exclusão de contatos
3. **Ações Não Funcionais**: Todos os botões são apenas visuais
4. **Isolamento Total**: Desconectado de outros módulos (agenda, deals)

### **🔴 Críticos de Integração**
5. **Sem Hooks Personalizados**: Ausência de useContacts, useCreateContact
6. **Schema Supabase Não Utilizado**: Modelo Contact existe mas não é usado
7. **Sem RLS**: Row Level Security não implementado
8. **Sem Validação**: Ausência de schemas Zod

### **🟡 Moderados de UX**
9. **Busca Limitada**: Apenas por nome, case sensitive
10. **Sem Filtros Avançados**: Falta categorização e ordenação
11. **Sem Estados de Loading**: Interface não mostra carregamento
12. **Ações Contextuais**: Menu não funcional

---

## 📅 **CRONOGRAMA DE REFINAMENTO**

### **Fase 1: Integração Backend Básica** (5 dias)
- Hooks React Query completos
- CRUD operations fundamentais
- Validação com Zod
- RLS policies básicas

### **Fase 2: Funcionalidades Avançadas** (4 dias)
- Filtros e busca avançada
- Sistema de tags e categorização
- Importação/exportação
- Estados de loading/erro

### **Fase 3: Integração Ecossistema** (4 dias)
- Conexão com agenda e deals
- Timeline de atividades
- Sistema de notas
- Notificações

### **Fase 4: UX e Otimização** (3 dias)
- Testes automatizados
- Performance optimization
- Mobile enhancement
- Documentação

---

## 🔧 **DETALHAMENTO DAS ETAPAS**

### **Etapa 1: Hooks React Query Fundamentais**
**Duração:** 2 dias  
**Prioridade:** 🔴 Crítica

#### **Objetivos:**
- Criar hooks personalizados para todas operações
- Implementar cache inteligente
- Tratamento robusto de erros
- Loading states adequados

#### **Implementação:**

**Hook Principal useContacts:**
```typescript
// src/hooks/useContacts.ts
export interface ContactFilters {
  search?: string;
  category?: ContactCategory;
  status?: ContactStatus;
  assignedTo?: string;
  page?: number;
  limit?: number;
}

export const useContacts = (filters?: ContactFilters) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['contacts', 'list', filters],
    queryFn: async (): Promise<ApiResponse<Contact[]>> => {
      let query = supabase
        .from('Contact')
        .select(`
          id, name, email, phone, category, status,
          lastContactAt, avatarUrl, leadStage, leadScore,
          agentId, companyId,
          agent:User!agentId(id, name, email),
          createdAt, updatedAt
        `);
      
      // Aplicar filtros
      if (filters?.search) {
        query = query.or(`
          name.ilike.%${filters.search}%,
          email.ilike.%${filters.search}%,
          phone.ilike.%${filters.search}%
        `);
      }
      
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      // Filtro por agente para AGENT role
      if (user?.role === 'AGENT') {
        query = query.eq('agentId', user.id);
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
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    retryDelay: 1000
  });
};
```

**Hook de Criação:**
```typescript
// src/hooks/useCreateContact.ts
export const useCreateContact = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: CreateContactData) => {
      // Validar dados com Zod
      const validatedData = CreateContactSchema.parse({
        ...data,
        agentId: user?.id,
        companyId: user?.companyId
      });
      
      const { data: contact, error } = await supabase
        .from('Contact')
        .insert(validatedData)
        .select(`
          id, name, email, phone, category, status,
          lastContactAt, avatarUrl, leadStage, leadScore,
          createdAt, updatedAt
        `)
        .single();
      
      if (error) throw error;
      
      // Auto-criar lead score inicial
      await supabase.from('LeadScore').insert({
        contactId: contact.id,
        score: 50,
        factors: {
          engagement: 50,
          demographics: 50,
          behavior: 50,
          firmographics: 50
        }
      });
      
      return contact;
    },
    onSuccess: (newContact) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      
      // Update optimista do cache
      queryClient.setQueryData<ApiResponse<Contact[]>>(
        ['contacts', 'list'],
        (old) => old ? {
          ...old,
          data: [newContact, ...old.data],
          total: old.total + 1
        } : undefined
      );
      
      toast.success('Contato criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar contato:', error);
      toast.error('Erro ao criar contato. Tente novamente.');
    }
  });
};
```

**Hook de Atualização:**
```typescript
export const useUpdateContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Contact> }) => {
      const { data: contact, error } = await supabase
        .from('Contact')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return contact;
    },
    onMutate: async ({ id, data }) => {
      // Otimistic update
      await queryClient.cancelQueries({ queryKey: ['contacts'] });
      
      const previousContacts = queryClient.getQueryData(['contacts', 'list']);
      
      queryClient.setQueryData<ApiResponse<Contact[]>>(
        ['contacts', 'list'],
        (old) => old ? {
          ...old,
          data: old.data.map(contact => 
            contact.id === id ? { ...contact, ...data } : contact
          )
        } : undefined
      );
      
      return { previousContacts };
    },
    onError: (err, variables, context) => {
      // Rollback em caso de erro
      if (context?.previousContacts) {
        queryClient.setQueryData(['contacts', 'list'], context.previousContacts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    }
  });
};
```

**Hook de Exclusão:**
```typescript
export const useDeleteContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('Contact')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, deletedId) => {
      // Update do cache
      queryClient.setQueryData<ApiResponse<Contact[]>>(
        ['contacts', 'list'],
        (old) => old ? {
          ...old,
          data: old.data.filter(contact => contact.id !== deletedId),
          total: old.total - 1
        } : undefined
      );
      
      toast.success('Contato excluído com sucesso!');
    }
  });
};
```

#### **Critérios de Aceite:**
- ✅ 4 hooks funcionais (list, create, update, delete)
- ✅ Cache inteligente implementado
- ✅ Optimistic updates funcionando
- ✅ Error handling robusto
- ✅ Loading states adequados

---

### **Etapa 2: Schemas de Validação Zod**
**Duração:** 1 dia  
**Prioridade:** 🔴 Crítica

#### **Objetivos:**
- Schemas Zod completos para validação
- Integração com React Hook Form
- Mensagens de erro em português
- Validação client/server side

#### **Implementação:**

**Schemas Fundamentais:**
```typescript
// src/schemas/contact.ts
export const ContactCategorySchema = z.enum(['CLIENT', 'LEAD', 'PARTNER']);
export const ContactStatusSchema = z.enum(['ACTIVE', 'NEW', 'INACTIVE']);
export const LeadStageSchema = z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'INTERESTED', 'NEGOTIATING', 'CONVERTED', 'LOST']);

export const CreateContactSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  
  email: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  
  phone: z.string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (11) 99999-9999')
    .optional()
    .or(z.literal('')),
  
  category: ContactCategorySchema.default('LEAD'),
  status: ContactStatusSchema.default('NEW'),
  leadStage: LeadStageSchema.default('NEW'),
  
  // Campos opcionais
  company: z.string().max(100).optional(),
  position: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  
  // Campos de sistema (preenchidos automaticamente)
  agentId: z.string().uuid(),
  companyId: z.string().uuid()
});

export const UpdateContactSchema = CreateContactSchema.partial().omit({
  agentId: true,
  companyId: true
});

export type CreateContactData = z.infer<typeof CreateContactSchema>;
export type UpdateContactData = z.infer<typeof UpdateContactSchema>;
```

**Schemas para Filtros:**
```typescript
export const ContactFiltersSchema = z.object({
  search: z.string().optional(),
  category: ContactCategorySchema.optional(),
  status: ContactStatusSchema.optional(),
  leadStage: LeadStageSchema.optional(),
  assignedTo: z.string().uuid().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50)
});

export type ContactFilters = z.infer<typeof ContactFiltersSchema>;
```

**Utilitários de Validação:**
```typescript
// src/utils/contactValidation.ts
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
  return phoneRegex.test(phone);
};

export const formatPhone = (phone: string): string => {
  const numbers = phone.replace(/\D/g, '');
  
  if (numbers.length === 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  } else if (numbers.length === 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  
  return phone;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

#### **Critérios de Aceite:**
- ✅ Schemas Zod completos
- ✅ Validação client-side
- ✅ Mensagens em português
- ✅ Utilitários de formatação
- ✅ Integração com React Hook Form

---

### **Etapa 3: RLS Policies e Segurança**
**Duração:** 1 dia  
**Prioridade:** 🔴 Crítica

#### **Objetivos:**
- Row Level Security completo
- Isolamento por empresa/agente
- Políticas granulares
- Auditoria de acesso

#### **Implementação:**

**RLS Policies:**
```sql
-- Política geral de acesso por empresa
CREATE POLICY "contacts_company_access" ON Contact
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM User 
    WHERE User.id = auth.uid() 
    AND User.companyId = Contact.companyId
  )
);

-- Política específica para AGENT - apenas contatos próprios
CREATE POLICY "contacts_agent_restriction" ON Contact
FOR ALL USING (
  CASE 
    -- DEV_MASTER pode ver todos
    WHEN EXISTS (SELECT 1 FROM User WHERE id = auth.uid() AND role = 'DEV_MASTER') 
      THEN true
    -- ADMIN pode ver todos da empresa
    WHEN EXISTS (SELECT 1 FROM User WHERE id = auth.uid() AND role = 'ADMIN') 
      THEN companyId = (SELECT companyId FROM User WHERE id = auth.uid())
    -- AGENT só pode ver próprios contatos
    WHEN EXISTS (SELECT 1 FROM User WHERE id = auth.uid() AND role = 'AGENT')
      THEN agentId = auth.uid()
    ELSE false
  END
);

-- Política para inserção - agent só pode criar para si mesmo
CREATE POLICY "contacts_insert_restriction" ON Contact
FOR INSERT WITH CHECK (
  agentId = auth.uid() AND 
  companyId = (SELECT companyId FROM User WHERE id = auth.uid())
);

-- Política para atualização - regras similares
CREATE POLICY "contacts_update_restriction" ON Contact
FOR UPDATE USING (
  CASE 
    WHEN EXISTS (SELECT 1 FROM User WHERE id = auth.uid() AND role IN ('DEV_MASTER', 'ADMIN')) 
      THEN true
    WHEN EXISTS (SELECT 1 FROM User WHERE id = auth.uid() AND role = 'AGENT')
      THEN agentId = auth.uid()
    ELSE false
  END
);
```

**Funções de Segurança:**
```sql
-- Função para verificar permissões de contato
CREATE OR REPLACE FUNCTION can_access_contact(contact_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_company_id UUID;
  contact_company_id UUID;
  contact_agent_id UUID;
BEGIN
  -- Buscar dados do usuário atual
  SELECT role, companyId INTO user_role, user_company_id
  FROM User WHERE id = auth.uid();
  
  -- Buscar dados do contato
  SELECT companyId, agentId INTO contact_company_id, contact_agent_id
  FROM Contact WHERE id = contact_id;
  
  -- Verificar permissões
  CASE user_role
    WHEN 'DEV_MASTER' THEN
      RETURN true;
    WHEN 'ADMIN' THEN
      RETURN user_company_id = contact_company_id;
    WHEN 'AGENT' THEN
      RETURN contact_agent_id = auth.uid();
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Auditoria de Acesso:**
```sql
-- Tabela de log de acesso a contatos
CREATE TABLE contact_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES Contact(id),
  user_id UUID REFERENCES User(id),
  action TEXT NOT NULL, -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE'
  accessed_at TIMESTAMP DEFAULT NOW()
);

-- Trigger para log automático
CREATE OR REPLACE FUNCTION log_contact_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO contact_access_logs (contact_id, user_id, action)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    TG_OP
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contact_access_log_trigger
  AFTER INSERT OR UPDATE OR DELETE ON Contact
  FOR EACH ROW EXECUTE FUNCTION log_contact_access();
```

#### **Critérios de Aceite:**
- ✅ RLS policies ativas
- ✅ Isolamento por role funcional
- ✅ Auditoria automática
- ✅ Funções de segurança
- ✅ Testes de permissão

---

### **Etapa 4: Formulários Funcionais**
**Duração:** 2 dias  
**Prioridade:** 🔴 Crítica

#### **Objetivos:**
- Modal de criação funcional
- Modal de edição completo
- Validação em tempo real
- UX otimizada

#### **Implementação:**

**Modal de Criação:**
```typescript
// src/components/contatos/CreateContactModal.tsx
export const CreateContactModal = ({ isOpen, onClose }) => {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<CreateContactData>({
    resolver: zodResolver(CreateContactSchema),
    defaultValues: {
      category: 'LEAD',
      status: 'NEW',
      leadStage: 'NEW'
    }
  });
  
  const createContact = useCreateContact();
  const [phoneValue, setPhoneValue] = useState('');
  
  const onSubmit = async (data: CreateContactData) => {
    try {
      await createContact.mutateAsync(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Erro ao criar contato:', error);
    }
  };
  
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setPhoneValue(formatted);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Contato</DialogTitle>
          <DialogDescription>
            Adicione um novo contato ao seu pipeline
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                {...register('name')}
                error={errors.name?.message}
                placeholder="Digite o nome completo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="email@exemplo.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                {...register('phone')}
                value={phoneValue}
                onChange={(e) => handlePhoneChange(e.target.value)}
                error={errors.phone?.message}
                placeholder="(11) 99999-9999"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select {...register('category')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LEAD">Lead</SelectItem>
                    <SelectItem value="CLIENT">Cliente</SelectItem>
                    <SelectItem value="PARTNER">Parceiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select {...register('status')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">Novo</SelectItem>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="INACTIVE">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                {...register('company')}
                placeholder="Nome da empresa (opcional)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Adicione observações sobre o contato..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createContact.isLoading}
            >
              {createContact.isLoading ? 'Salvando...' : 'Salvar Contato'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
```

**Modal de Edição:**
```typescript
// src/components/contatos/EditContactModal.tsx
export const EditContactModal = ({ contact, isOpen, onClose }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<UpdateContactData>({
    resolver: zodResolver(UpdateContactSchema),
    defaultValues: contact
  });
  
  const updateContact = useUpdateContact();
  
  useEffect(() => {
    if (contact) {
      reset(contact);
    }
  }, [contact, reset]);
  
  const onSubmit = async (data: UpdateContactData) => {
    try {
      await updateContact.mutateAsync({ id: contact.id, data });
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Contato</DialogTitle>
          <DialogDescription>
            Atualize as informações do contato
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Campos similares ao CreateContactModal */}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateContact.isLoading}>
              {updateContact.isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
```

#### **Critérios de Aceite:**
- ✅ Modais funcionais
- ✅ Validação em tempo real
- ✅ Formatação automática
- ✅ Loading states
- ✅ Error handling

---

### **Etapa 5: Refatoração da Página Principal**
**Duração:** 1 dia  
**Prioridade:** 🔴 Crítica

#### **Objetivos:**
- Integrar hooks reais
- Estados de loading/erro
- Filtros funcionais
- Ações contextuais funcionais

#### **Implementação:**

**Página Contatos Refatorada:**
```typescript
// src/pages/Contatos.tsx - REFATORADA
export const Contatos = () => {
  const [filters, setFilters] = useState<ContactFilters>({
    search: '',
    category: undefined,
    status: undefined,
    page: 1,
    limit: 50
  });
  
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // ✅ HOOKS REAIS
  const { data: contactsResponse, isLoading, error } = useContacts(filters);
  const deleteContact = useDeleteContact();
  
  const contacts = contactsResponse?.data || [];
  const totalContacts = contactsResponse?.total || 0;
  
  // ✅ FILTROS FUNCIONAIS
  const handleSearchChange = useDebouncedCallback((search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  }, 300);
  
  const handleFilterChange = (key: keyof ContactFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };
  
  const clearFilters = () => {
    setFilters({
      search: '',
      category: undefined,
      status: undefined,
      page: 1,
      limit: 50
    });
  };
  
  // ✅ AÇÕES FUNCIONAIS
  const handleContactAction = async (action: string, contact: Contact) => {
    switch (action) {
      case 'edit':
        setSelectedContact(contact);
        setShowEditModal(true);
        break;
      case 'delete':
        if (confirm('Tem certeza que deseja excluir este contato?')) {
          await deleteContact.mutateAsync(contact.id);
        }
        break;
      case 'call':
        window.open(`tel:${contact.phone}`);
        break;
      case 'email':
        window.open(`mailto:${contact.email}`);
        break;
      case 'whatsapp':
        const whatsappNumber = contact.phone?.replace(/\D/g, '');
        window.open(`https://wa.me/55${whatsappNumber}`);
        break;
    }
  };
  
  // ✅ LOADING STATE
  if (isLoading) {
    return (
      <div className="space-y-6">
        <ContactsHeader 
          totalContacts={0}
          isLoading={true}
          onCreateClick={() => setShowCreateModal(true)}
        />
        <ContactsSkeleton />
      </div>
    );
  }
  
  // ✅ ERROR STATE
  if (error) {
    return (
      <div className="space-y-6">
        <ContactsHeader 
          totalContacts={0}
          isLoading={false}
          onCreateClick={() => setShowCreateModal(true)}
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar contatos</AlertTitle>
          <AlertDescription>
            {error.message || 'Erro desconhecido. Tente recarregar a página.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <ContactsHeader 
        totalContacts={totalContacts}
        isLoading={false}
        onCreateClick={() => setShowCreateModal(true)}
      />
      
      <ContactsFilters 
        filters={filters}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        resultsCount={contacts.length}
        totalCount={totalContacts}
      />
      
      {contacts.length === 0 ? (
        <ContactsEmptyState 
          hasFilters={!!(filters.search || filters.category || filters.status)}
          onCreateClick={() => setShowCreateModal(true)}
          onClearFilters={clearFilters}
        />
      ) : (
        <>
          <ContactsGrid 
            contacts={contacts}
            onContactAction={handleContactAction}
          />
          
          {totalContacts > filters.limit && (
            <ContactsPagination 
              currentPage={filters.page}
              totalPages={Math.ceil(totalContacts / filters.limit)}
              onPageChange={(page) => handleFilterChange('page', page)}
            />
          )}
        </>
      )}
      
      {/* ✅ MODAIS FUNCIONAIS */}
      <CreateContactModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      
      <EditContactModal 
        contact={selectedContact}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedContact(null);
        }}
      />
    </div>
  );
};
```

#### **Critérios de Aceite:**
- ✅ Hooks integrados funcionando
- ✅ Estados de loading/erro
- ✅ Filtros funcionais
- ✅ Ações contextuais funcionais
- ✅ Paginação implementada

---

### **Etapa 6: Componentes de Suporte**
**Duração:** 2 dias  
**Prioridade:** 🟡 Moderada

#### **Objetivos:**
- Filtros avançados funcionais
- Empty states contextuais
- Loading skeletons
- Paginação completa

#### **Implementação:**

**Filtros Avançados:**
```typescript
// src/components/contatos/ContactsFilters.tsx
export const ContactsFilters = ({ 
  filters, 
  onSearchChange, 
  onFilterChange, 
  onClearFilters,
  resultsCount,
  totalCount 
}) => {
  const hasActiveFilters = !!(filters.search || filters.category || filters.status);
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={filters.search || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select 
            value={filters.category || 'all'} 
            onValueChange={(value) => onFilterChange('category', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="LEAD">Lead</SelectItem>
              <SelectItem value="CLIENT">Cliente</SelectItem>
              <SelectItem value="PARTNER">Parceiro</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={filters.status || 'all'} 
            onValueChange={(value) => onFilterChange('status', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="NEW">Novo</SelectItem>
              <SelectItem value="ACTIVE">Ativo</SelectItem>
              <SelectItem value="INACTIVE">Inativo</SelectItem>
            </SelectContent>
          </Select>
          
          {hasActiveFilters && (
            <Button variant="ghost" onClick={onClearFilters}>
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {resultsCount} de {totalCount} contatos
          {hasActiveFilters && ' (filtrados)'}
        </span>
        
        <div className="flex items-center gap-2">
          <span>Ordenar por:</span>
          <Select 
            value={filters.sortBy || 'createdAt'} 
            onValueChange={(value) => onFilterChange('sortBy', value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Data de criação</SelectItem>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="lastContactAt">Último contato</SelectItem>
              <SelectItem value="leadScore">Pontuação</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
```

**Empty State Contextual:**
```typescript
// src/components/contatos/ContactsEmptyState.tsx
export const ContactsEmptyState = ({ 
  hasFilters, 
  onCreateClick, 
  onClearFilters 
}) => {
  if (hasFilters) {
    return (
      <Card className="p-12">
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
            <SearchX className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Nenhum contato encontrado</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Não encontramos contatos que correspondam aos filtros aplicados. 
            Tente ajustar os critérios de busca.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={onClearFilters}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
            <Button onClick={onCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Contato
            </Button>
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="p-12">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">Comece adicionando contatos</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Você ainda não tem contatos cadastrados. Adicione seu primeiro contato 
          para começar a gerenciar seus leads e clientes.
        </p>
        <Button onClick={onCreateClick} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Primeiro Contato
        </Button>
      </div>
    </Card>
  );
};
```

**Loading Skeleton:**
```typescript
// src/components/contatos/ContactsSkeleton.tsx
export const ContactsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="flex items-start space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-8 w-8" />
          </div>
        </Card>
      ))}
    </div>
  );
};
```

#### **Critérios de Aceite:**
- ✅ Filtros avançados funcionais
- ✅ Empty states contextuais
- ✅ Loading skeletons adequados
- ✅ Ordenação implementada
- ✅ Paginação completa

---

### **Etapa 7: Integração com Ecossistema**
**Duração:** 2 dias  
**Prioridade:** 🟡 Moderada

#### **Objetivos:**
- Conexão com módulo Agenda
- Integração com Deals
- Timeline de atividades
- Notificações cross-module

#### **Implementação:**

**Integração com Agenda:**
```typescript
// src/components/contatos/ContactAppointments.tsx
export const ContactAppointments = ({ contactId }) => {
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', 'by-contact', contactId],
    queryFn: () => supabase
      .from('Appointment')
      .select(`
        id, title, date, type, status,
        property:Property(id, title, address)
      `)
      .eq('contactId', contactId)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
    enabled: !!contactId
  });
  
  if (isLoading) return <div>Carregando agendamentos...</div>;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Agendamentos</h4>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>
      
      {appointments?.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nenhum agendamento encontrado
        </p>
      ) : (
        <div className="space-y-2">
          {appointments?.map(appointment => (
            <Card key={appointment.id} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{appointment.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(appointment.date), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <Badge variant={appointment.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                  {appointment.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
```

**Timeline de Atividades:**
```typescript
// src/components/contatos/ContactTimeline.tsx
export const ContactTimeline = ({ contactId }) => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities', 'by-contact', contactId],
    queryFn: () => supabase
      .from('Activity')
      .select(`
        id, type, description, createdAt,
        user:User(id, name)
      `)
      .eq('entityId', contactId)
      .eq('entityType', 'contact')
      .order('createdAt', { ascending: false })
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
    enabled: !!contactId
  });
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CONTACT_CREATED': return <UserPlus className="h-4 w-4" />;
      case 'CONTACT_UPDATED': return <Edit className="h-4 w-4" />;
      case 'EMAIL_SENT': return <Mail className="h-4 w-4" />;
      case 'CALL_MADE': return <Phone className="h-4 w-4" />;
      case 'MEETING_SCHEDULED': return <Calendar className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="space-y-4">
      <h4 className="font-semibold">Timeline de Atividades</h4>
      
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {activities?.map((activity, index) => (
            <div key={activity.id} className="flex space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                  {getActivityIcon(activity.type)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  por {activity.user?.name} • {formatDistanceToNow(new Date(activity.createdAt), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </p>
              </div>
              
              {index < activities.length - 1 && (
                <div className="absolute left-4 top-8 -ml-px h-full w-0.5 bg-border" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

#### **Critérios de Aceite:**
- ✅ Integração com agenda funcionando
- ✅ Timeline de atividades
- ✅ Conexão com deals
- ✅ Notificações cross-module
- ✅ Actions funcionais

---

### **Etapa 8: Testes Automatizados**
**Duração:** 2 dias  
**Prioridade:** 🟡 Moderada

#### **Objetivos:**
- Testes unitários para hooks
- Testes de componentes principais
- Testes de integração
- Pipeline automatizado

#### **Implementação:**

**Testes de Hooks:**
```typescript
// src/hooks/__tests__/useContacts.test.ts
describe('useContacts Hook', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  beforeEach(() => {
    queryClient.clear();
  });
  
  test('should fetch contacts successfully', async () => {
    // Mock Supabase response
    const mockContacts = [
      { id: '1', name: 'João Silva', email: 'joao@test.com' }
    ];
    
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          range: () => ({
            order: () => Promise.resolve({ 
              data: mockContacts, 
              error: null, 
              count: 1 
            })
          })
        })
      })
    });
    
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
    
    expect(result.current.data?.data).toEqual(mockContacts);
  });
  
  test('should handle filters correctly', async () => {
    const filters = { search: 'João', category: 'LEAD' };
    
    const { result } = renderHook(() => useContacts(filters), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    });
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    // Verificar se os filtros foram aplicados na query
    expect(mockSupabase.from().select().or).toHaveBeenCalledWith(
      expect.stringContaining('João')
    );
  });
});
```

**Testes de Componentes:**
```typescript
// src/components/__tests__/CreateContactModal.test.tsx
describe('CreateContactModal', () => {
  test('should render form fields correctly', () => {
    render(
      <CreateContactModal isOpen={true} onClose={() => {}} />
    );
    
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument();
  });
  
  test('should validate required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <CreateContactModal isOpen={true} onClose={() => {}} />
    );
    
    await user.click(screen.getByRole('button', { name: /salvar/i }));
    
    expect(await screen.findByText(/nome deve ter pelo menos/i)).toBeInTheDocument();
  });
  
  test('should format phone numbers correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <CreateContactModal isOpen={true} onClose={() => {}} />
    );
    
    const phoneInput = screen.getByLabelText(/telefone/i);
    await user.type(phoneInput, '11999999999');
    
    expect(phoneInput).toHaveValue('(11) 99999-9999');
  });
});
```

#### **Critérios de Aceite:**
- ✅ Testes de hooks: 90% cobertura
- ✅ Testes de componentes: 75% cobertura
- ✅ Testes de integração funcionais
- ✅ Pipeline CI/CD executando testes
- ✅ Relatórios de cobertura

---

## 📊 **MÉTRICAS DE SUCESSO**

### **Funcionalidades**
- **CRUD Operations**: 0% → 100%
- **Integração Backend**: 0% → 100%
- **Filtros Avançados**: 20% → 100%
- **Ações Contextuais**: 0% → 100%

### **Qualidade de Código**
- **Cobertura de Testes**: 0% → 75%
- **Performance**: < 100ms render time
- **TypeScript**: 100% strict mode
- **Acessibilidade**: WCAG AA compliance

### **Integração**
- **Supabase**: 100% integrado
- **RLS Policies**: Implementadas
- **Cross-module**: Agenda + Deals
- **Real-time**: Updates automáticos

---

## 🛠️ **RECURSOS NECESSÁRIOS**

### **Técnicos**
- 1 Developer React Senior (lead)
- 1 Developer Full-stack (backend/RLS)
- 1 QA Engineer (testes)

### **Design**
- 1 UI/UX Designer (refinamentos)
- Design system atualizado
- Mobile components

### **Infraestrutura**
- Supabase RLS setup
- Real-time subscriptions
- Performance monitoring
- Backup/recovery

### **Ferramentas**
- React Query v5
- React Hook Form + Zod
- Testing Library + Vitest
- MSW para mocks

---

## 🚀 **PRÓXIMOS PASSOS**

### **Imediato (Esta Semana)**
1. ✅ Aprovação do plano urgente
2. ✅ Setup de hooks React Query
3. ✅ Schemas Zod implementados
4. ✅ RLS policies básicas

### **Curto Prazo (2 semanas)**
1. 🔄 CRUD completo funcionando
2. 🔄 Formulários validados
3. 🔄 Filtros avançados
4. 🔄 Estados de loading/erro

### **Médio Prazo (3 semanas)**
1. 📋 Integração cross-module
2. 📋 Timeline de atividades
3. 📋 Testes automatizados
4. 📋 Performance otimizada

---

## 📋 **OBSERVAÇÕES FINAIS**

### **Pontos de Atenção**
- **Zero Breaking Changes**: Manter compatibilidade visual
- **Performance First**: Otimizar para grandes volumes
- **Mobile Priority**: Experiência mobile-first
- **Security**: RLS policies rigorosas

### **Riscos Identificados**
- **Complexity Jump**: Salto grande de 0% para 100%
- **Integration Dependencies**: Dependência de outros módulos
- **Data Migration**: Migração de dados mockados
- **Performance**: Impacto com dados reais

### **Critérios de Entrega**
- ✅ CRUD 100% funcional
- ✅ Testes passando (75% cobertura)
- ✅ RLS policies validadas
- ✅ Performance otimizada
- ✅ Integração cross-module
- ✅ Documentação técnica completa

---

**Preparado por:** Claude AI Assistant  
**Aprovado por:** [Pending]  
**Data de Início:** [TBD - ALTA PRIORIDADE]  
**Data de Conclusão Estimada:** [TBD + 16 dias]

**🚨 NOTA URGENTE:** Este é o módulo com maior gap de implementação. Recomenda-se priorização máxima para equalizar com outros módulos do sistema.