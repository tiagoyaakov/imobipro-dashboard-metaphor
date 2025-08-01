import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGlobal, useGlobalFilters, useGlobalSelections } from '@/contexts/GlobalContext';
import { EventBus, SystemEvents, useEventBus } from '@/lib/event-bus';
import { useToast } from '@/components/ui/use-toast';

// -----------------------------------------------------------
// Hook para sincronização cross-module
// -----------------------------------------------------------

export const useCrossModuleSync = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { globalFilters, isSyncing, setSyncing } = useGlobal();
  const { property, contact, appointment } = useGlobalSelections();

  // Sincronizar quando propriedade for selecionada
  const syncWithProperty = useCallback(async (propertyId: string) => {
    setSyncing(true);
    try {
      // Invalidar queries relacionadas
      await queryClient.invalidateQueries({ 
        queryKey: ['appointments', { propertyId }] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['deals', { propertyId }] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['activities', { entityId: propertyId }] 
      });

      // Emitir evento para outros módulos
      EventBus.emit(SystemEvents.PROPERTY_VIEWED, { propertyId });
    } catch (error) {
      console.error('Erro ao sincronizar com propriedade:', error);
    } finally {
      setSyncing(false);
    }
  }, [queryClient, setSyncing]);

  // Sincronizar quando contato for selecionado
  const syncWithContact = useCallback(async (contactId: string) => {
    setSyncing(true);
    try {
      // Invalidar queries relacionadas
      await queryClient.invalidateQueries({ 
        queryKey: ['appointments', { contactId }] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['deals', { clientId: contactId }] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['chats', { contactId }] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['activities', { entityId: contactId }] 
      });

      // Emitir evento
      EventBus.emit('contact.viewed', { contactId });
    } catch (error) {
      console.error('Erro ao sincronizar com contato:', error);
    } finally {
      setSyncing(false);
    }
  }, [queryClient, setSyncing]);

  // Sincronizar quando agendamento for selecionado
  const syncWithAppointment = useCallback(async (appointmentId: string) => {
    setSyncing(true);
    try {
      // Invalidar queries relacionadas
      await queryClient.invalidateQueries({ 
        queryKey: ['appointment', appointmentId] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['activities', { entityId: appointmentId }] 
      });

      // Emitir evento
      EventBus.emit('appointment.viewed', { appointmentId });
    } catch (error) {
      console.error('Erro ao sincronizar com agendamento:', error);
    } finally {
      setSyncing(false);
    }
  }, [queryClient, setSyncing]);

  // Escutar mudanças de seleção
  useEffect(() => {
    if (property.id) {
      syncWithProperty(property.id);
    }
  }, [property.id, syncWithProperty]);

  useEffect(() => {
    if (contact.id) {
      syncWithContact(contact.id);
    }
  }, [contact.id, syncWithContact]);

  useEffect(() => {
    if (appointment.id) {
      syncWithAppointment(appointment.id);
    }
  }, [appointment.id, syncWithAppointment]);

  // Sincronizar filtros globais
  useEffect(() => {
    if (Object.keys(globalFilters).length > 0) {
      // Invalidar todas as queries principais quando filtros mudarem
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    }
  }, [globalFilters, queryClient]);

  return {
    isSyncing,
    syncWithProperty,
    syncWithContact,
    syncWithAppointment,
  };
};

// -----------------------------------------------------------
// Hook para navegação cross-module
// -----------------------------------------------------------

export const useCrossModuleNavigation = () => {
  const { property, contact, appointment } = useGlobalSelections();
  const { toast } = useToast();

  // Navegar para propriedade em outro módulo
  const navigateToProperty = useCallback((propertyId: string, module?: string) => {
    property.select(propertyId);
    
    // Se especificar módulo, emitir evento para navegação
    if (module) {
      EventBus.emit('navigate.to', { 
        module, 
        entityType: 'property', 
        entityId: propertyId 
      });
    }

    toast({
      title: 'Propriedade selecionada',
      description: 'Dados sincronizados entre módulos',
    });
  }, [property, toast]);

  // Navegar para contato em outro módulo
  const navigateToContact = useCallback((contactId: string, module?: string) => {
    contact.select(contactId);
    
    if (module) {
      EventBus.emit('navigate.to', { 
        module, 
        entityType: 'contact', 
        entityId: contactId 
      });
    }

    toast({
      title: 'Contato selecionado',
      description: 'Dados sincronizados entre módulos',
    });
  }, [contact, toast]);

  // Navegar para agendamento em outro módulo
  const navigateToAppointment = useCallback((appointmentId: string, module?: string) => {
    appointment.select(appointmentId);
    
    if (module) {
      EventBus.emit('navigate.to', { 
        module, 
        entityType: 'appointment', 
        entityId: appointmentId 
      });
    }

    toast({
      title: 'Agendamento selecionado',
      description: 'Dados sincronizados entre módulos',
    });
  }, [appointment, toast]);

  return {
    navigateToProperty,
    navigateToContact,
    navigateToAppointment,
    currentSelections: {
      propertyId: property.id,
      contactId: contact.id,
      appointmentId: appointment.id,
    },
  };
};

// -----------------------------------------------------------
// Hook para eventos de módulo
// -----------------------------------------------------------

interface ModuleEventHandlers {
  onPropertyCreated?: (data: { property: any }) => void;
  onPropertyUpdated?: (data: { property: any }) => void;
  onPropertyDeleted?: (data: { propertyId: string }) => void;
  onContactCreated?: (data: { contact: any }) => void;
  onContactUpdated?: (data: { contact: any }) => void;
  onContactDeleted?: (data: { contactId: string }) => void;
  onAppointmentCreated?: (data: { appointment: any }) => void;
  onAppointmentUpdated?: (data: { appointment: any }) => void;
  onAppointmentCanceled?: (data: { appointmentId: string }) => void;
  onDealCreated?: (data: { deal: any }) => void;
  onDealUpdated?: (data: { deal: any }) => void;
  onDealStageChanged?: (data: { dealId: string; newStage: string }) => void;
}

export const useModuleEvents = (handlers: ModuleEventHandlers) => {
  // Propriedades
  useEventBus(SystemEvents.PROPERTY_CREATED, handlers.onPropertyCreated || (() => {}));
  useEventBus(SystemEvents.PROPERTY_UPDATED, handlers.onPropertyUpdated || (() => {}));
  useEventBus(SystemEvents.PROPERTY_DELETED, handlers.onPropertyDeleted || (() => {}));

  // Contatos
  useEventBus(SystemEvents.CONTACT_CREATED, handlers.onContactCreated || (() => {}));
  useEventBus(SystemEvents.CONTACT_UPDATED, handlers.onContactUpdated || (() => {}));
  useEventBus(SystemEvents.CONTACT_DELETED, handlers.onContactDeleted || (() => {}));

  // Agendamentos
  useEventBus(SystemEvents.APPOINTMENT_CREATED, handlers.onAppointmentCreated || (() => {}));
  useEventBus(SystemEvents.APPOINTMENT_UPDATED, handlers.onAppointmentUpdated || (() => {}));
  useEventBus(SystemEvents.APPOINTMENT_CANCELED, handlers.onAppointmentCanceled || (() => {}));

  // Negociações
  useEventBus(SystemEvents.DEAL_CREATED, handlers.onDealCreated || (() => {}));
  useEventBus(SystemEvents.DEAL_UPDATED, handlers.onDealUpdated || (() => {}));
  useEventBus(SystemEvents.DEAL_STAGE_CHANGED, handlers.onDealStageChanged || (() => {}));
};

// -----------------------------------------------------------
// Hook para sincronização de filtros
// -----------------------------------------------------------

export const useFilterSync = () => {
  const { filters, updateFilter, clearFilters } = useGlobalFilters();
  const queryClient = useQueryClient();

  // Aplicar filtros às queries
  const applyFiltersToQueries = useCallback(() => {
    // Propriedades
    if (filters.status) {
      queryClient.setQueryData(['properties', 'filters'], {
        status: filters.status,
      });
    }

    // Contatos
    if (filters.agentId) {
      queryClient.setQueryData(['contacts', 'filters'], {
        agentId: filters.agentId,
      });
    }

    // Agendamentos
    if (filters.dateRange) {
      queryClient.setQueryData(['appointments', 'filters'], {
        startDate: filters.dateRange.start,
        endDate: filters.dateRange.end,
      });
    }
  }, [filters, queryClient]);

  // Aplicar filtros quando mudarem
  useEffect(() => {
    applyFiltersToQueries();
  }, [applyFiltersToQueries]);

  // Sincronizar filtro de data
  const setDateRangeFilter = useCallback((start: Date, end: Date) => {
    updateFilter('dateRange', { start, end });
  }, [updateFilter]);

  // Sincronizar filtro de empresa
  const setCompanyFilter = useCallback((companyId: string) => {
    updateFilter('companyId', companyId);
  }, [updateFilter]);

  // Sincronizar filtro de agente
  const setAgentFilter = useCallback((agentId: string) => {
    updateFilter('agentId', agentId);
  }, [updateFilter]);

  // Sincronizar filtro de status
  const setStatusFilter = useCallback((status: string[]) => {
    updateFilter('status', status);
  }, [updateFilter]);

  return {
    filters,
    setDateRangeFilter,
    setCompanyFilter,
    setAgentFilter,
    setStatusFilter,
    clearAllFilters: clearFilters,
  };
};