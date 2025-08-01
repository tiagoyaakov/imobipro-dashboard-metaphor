import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { EventBus, SystemEvents } from '@/lib/event-bus';
import { Company } from '@/types/supabase';

// -----------------------------------------------------------
// Contexto Global para dados compartilhados entre módulos
// -----------------------------------------------------------

interface GlobalFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  companyId?: string;
  agentId?: string;
  status?: string[];
}

interface GlobalContextType {
  // Empresa atual
  currentCompany: Company | null;
  setCurrentCompany: (company: Company | null) => void;
  
  // Filtros globais
  globalFilters: GlobalFilters;
  setGlobalFilters: (filters: GlobalFilters) => void;
  updateFilter: <K extends keyof GlobalFilters>(key: K, value: GlobalFilters[K]) => void;
  clearFilters: () => void;
  
  // Estado compartilhado
  selectedPropertyId: string | null;
  setSelectedPropertyId: (id: string | null) => void;
  
  selectedContactId: string | null;
  setSelectedContactId: (id: string | null) => void;
  
  selectedAppointmentId: string | null;
  setSelectedAppointmentId: (id: string | null) => void;
  
  // Notificações globais
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  
  // Estado de sincronização
  isSyncing: boolean;
  setSyncing: (syncing: boolean) => void;
  
  // Modo de visualização
  viewMode: 'grid' | 'list' | 'kanban';
  setViewMode: (mode: 'grid' | 'list' | 'kanban') => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: Date;
  duration?: number;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  const { user } = useAuth();
  
  // Estado global
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [globalFilters, setGlobalFilters] = useState<GlobalFilters>({});
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSyncing, setSyncing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('grid');
  
  // Atualizar filtro específico
  const updateFilter = useCallback(<K extends keyof GlobalFilters>(
    key: K, 
    value: GlobalFilters[K]
  ) => {
    setGlobalFilters(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Emitir evento de mudança de filtros
    EventBus.emit(SystemEvents.FILTERS_CHANGED, {
      filters: { ...globalFilters, [key]: value }
    });
  }, [globalFilters]);
  
  // Limpar filtros
  const clearFilters = useCallback(() => {
    setGlobalFilters({});
    EventBus.emit(SystemEvents.FILTERS_CLEARED, {});
  }, []);
  
  // Adicionar notificação
  const addNotification = useCallback((
    notification: Omit<Notification, 'id' | 'timestamp'>
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remover após duração (padrão 5s)
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, notification.duration || 5000);
    }
    
    // Emitir evento
    EventBus.emit(SystemEvents.NOTIFICATION_ADDED, newNotification);
  }, []);
  
  // Remover notificação
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);
  
  // Escutar eventos do sistema
  React.useEffect(() => {
    // Quando propriedade for selecionada em outro módulo
    const handlePropertySelected = (data: { propertyId: string }) => {
      setSelectedPropertyId(data.propertyId);
    };
    
    // Quando contato for selecionado em outro módulo
    const handleContactSelected = (data: { contactId: string }) => {
      setSelectedContactId(data.contactId);
    };
    
    // Quando agendamento for selecionado em outro módulo
    const handleAppointmentSelected = (data: { appointmentId: string }) => {
      setSelectedAppointmentId(data.appointmentId);
    };
    
    // Registrar listeners
    EventBus.on(SystemEvents.PROPERTY_SELECTED, handlePropertySelected);
    EventBus.on(SystemEvents.CONTACT_SELECTED, handleContactSelected);
    EventBus.on(SystemEvents.APPOINTMENT_SELECTED, handleAppointmentSelected);
    
    return () => {
      EventBus.off(SystemEvents.PROPERTY_SELECTED, handlePropertySelected);
      EventBus.off(SystemEvents.CONTACT_SELECTED, handleContactSelected);
      EventBus.off(SystemEvents.APPOINTMENT_SELECTED, handleAppointmentSelected);
    };
  }, []);
  
  // Sincronizar empresa com usuário
  React.useEffect(() => {
    if (user?.company) {
      setCurrentCompany(user.company as Company);
    }
  }, [user]);
  
  const contextValue: GlobalContextType = {
    // Empresa
    currentCompany,
    setCurrentCompany,
    
    // Filtros
    globalFilters,
    setGlobalFilters,
    updateFilter,
    clearFilters,
    
    // Seleções
    selectedPropertyId,
    setSelectedPropertyId,
    selectedContactId,
    setSelectedContactId,
    selectedAppointmentId,
    setSelectedAppointmentId,
    
    // Notificações
    notifications,
    addNotification,
    removeNotification,
    
    // Estados
    isSyncing,
    setSyncing,
    viewMode,
    setViewMode
  };
  
  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
};

// Hook para usar o contexto global
export const useGlobal = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  
  if (!context) {
    throw new Error('useGlobal deve ser usado dentro de um GlobalProvider');
  }
  
  return context;
};

// Hooks auxiliares para funcionalidades específicas
export const useGlobalFilters = () => {
  const { globalFilters, updateFilter, clearFilters } = useGlobal();
  return { filters: globalFilters, updateFilter, clearFilters };
};

export const useGlobalNotifications = () => {
  const { notifications, addNotification, removeNotification } = useGlobal();
  return { notifications, addNotification, removeNotification };
};

export const useGlobalSelections = () => {
  const {
    selectedPropertyId,
    setSelectedPropertyId,
    selectedContactId,
    setSelectedContactId,
    selectedAppointmentId,
    setSelectedAppointmentId
  } = useGlobal();
  
  return {
    property: { id: selectedPropertyId, select: setSelectedPropertyId },
    contact: { id: selectedContactId, select: setSelectedContactId },
    appointment: { id: selectedAppointmentId, select: setSelectedAppointmentId }
  };
};