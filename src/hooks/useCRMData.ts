import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { 
  Contact, 
  Deal, 
  LeadScore, 
  Activity, 
  ContactCreateInput, 
  ContactUpdateInput,
  DealCreateInput, 
  DealUpdateInput,
  ActivityCreateInput,
  ContactStatus,
  ContactCategory,
  DealStage,
  ActivityType
} from '../schemas/crm';

// Importar dados mockados
import contactsData from '../mocks/contacts.json';
import dealsData from '../mocks/deals.json';
import leadScoresData from '../mocks/lead-scores.json';
import activitiesData from '../mocks/activities.json';

// Tipos para filtros
interface ContactFilters {
  category?: ContactCategory;
  status?: ContactStatus;
  search?: string;
  page?: number;
  limit?: number;
}

interface DealFilters {
  stage?: DealStage;
  minValue?: number;
  maxValue?: number;
  assignedTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface ActivityFilters {
  type?: ActivityType;
  contactId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

// Funções utilitárias
const simulateDelay = (min: number = 500, max: number = 1500): Promise<void> => {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

const simulateError = (errorRate: number = 0.05): void => {
  if (Math.random() < errorRate) {
    throw new Error('Erro simulado de rede');
  }
};

const getStorageKey = (key: string): string => `imobipro_crm_${key}`;

const getLocalData = <T>(key: string, defaultData: T[]): T[] => {
  try {
    const stored = localStorage.getItem(getStorageKey(key));
    return stored ? JSON.parse(stored) : defaultData;
  } catch {
    return defaultData;
  }
};

const setLocalData = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(getStorageKey(key), JSON.stringify(data));
  } catch (error) {
    console.error('Erro ao salvar dados no localStorage:', error);
  }
};

// Simuladores de API
const apiContacts = {
  getAll: async (filters: ContactFilters = {}): Promise<{ data: Contact[]; total: number }> => {
    await simulateDelay();
    simulateError();
    
    let contacts = getLocalData('contacts', contactsData as Contact[]);
    
    // Aplicar filtros
    if (filters.category) {
      contacts = contacts.filter(c => c.category === filters.category);
    }
    if (filters.status) {
      contacts = contacts.filter(c => c.status === filters.status);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      contacts = contacts.filter(c => 
        c.name.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.phone.includes(search)
      );
    }
    
    const total = contacts.length;
    
    // Paginação
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      data: contacts.slice(start, end),
      total
    };
  },

  getById: async (id: string): Promise<Contact> => {
    await simulateDelay();
    simulateError();
    
    const contacts = getLocalData('contacts', contactsData as Contact[]);
    const contact = contacts.find(c => c.id === id);
    
    if (!contact) {
      throw new Error('Contato não encontrado');
    }
    
    return contact;
  },

  create: async (data: ContactCreateInput): Promise<Contact> => {
    await simulateDelay();
    simulateError();
    
    const contacts = getLocalData('contacts', contactsData as Contact[]);
    
    const newContact: Contact = {
      id: `contact_${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      category: data.category,
      status: data.status || 'ACTIVE',
      avatar: data.avatar || `https://api.dicebear.com/7.x/personas/svg?seed=${data.name}`,
      company: data.company,
      position: data.position,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedContacts = [...contacts, newContact];
    setLocalData('contacts', updatedContacts);
    
    return newContact;
  },

  update: async (id: string, data: ContactUpdateInput): Promise<Contact> => {
    await simulateDelay();
    simulateError();
    
    const contacts = getLocalData('contacts', contactsData as Contact[]);
    const contactIndex = contacts.findIndex(c => c.id === id);
    
    if (contactIndex === -1) {
      throw new Error('Contato não encontrado');
    }
    
    const updatedContact = {
      ...contacts[contactIndex],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    const updatedContacts = [...contacts];
    updatedContacts[contactIndex] = updatedContact;
    setLocalData('contacts', updatedContacts);
    
    return updatedContact;
  },

  delete: async (id: string): Promise<void> => {
    await simulateDelay();
    simulateError();
    
    const contacts = getLocalData('contacts', contactsData as Contact[]);
    const filteredContacts = contacts.filter(c => c.id !== id);
    
    if (filteredContacts.length === contacts.length) {
      throw new Error('Contato não encontrado');
    }
    
    setLocalData('contacts', filteredContacts);
  }
};

const apiDeals = {
  getAll: async (filters: DealFilters = {}): Promise<{ data: Deal[]; total: number }> => {
    await simulateDelay();
    simulateError();
    
    let deals = getLocalData('deals', dealsData as Deal[]);
    
    // Aplicar filtros
    if (filters.stage) {
      deals = deals.filter(d => d.stage === filters.stage);
    }
    if (filters.minValue) {
      deals = deals.filter(d => d.value >= filters.minValue!);
    }
    if (filters.maxValue) {
      deals = deals.filter(d => d.value <= filters.maxValue!);
    }
    if (filters.assignedTo) {
      deals = deals.filter(d => d.assignedTo === filters.assignedTo);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      deals = deals.filter(d => 
        d.title.toLowerCase().includes(search) ||
        d.description?.toLowerCase().includes(search)
      );
    }
    
    const total = deals.length;
    
    // Paginação
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      data: deals.slice(start, end),
      total
    };
  },

  getById: async (id: string): Promise<Deal> => {
    await simulateDelay();
    simulateError();
    
    const deals = getLocalData('deals', dealsData as Deal[]);
    const deal = deals.find(d => d.id === id);
    
    if (!deal) {
      throw new Error('Deal não encontrado');
    }
    
    return deal;
  },

  create: async (data: DealCreateInput): Promise<Deal> => {
    await simulateDelay();
    simulateError();
    
    const deals = getLocalData('deals', dealsData as Deal[]);
    
    const newDeal: Deal = {
      id: `deal_${Date.now()}`,
      title: data.title,
      description: data.description,
      value: data.value,
      stage: data.stage || 'QUALIFICATION',
      contactId: data.contactId,
      assignedTo: data.assignedTo,
      expectedCloseDate: data.expectedCloseDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedDeals = [...deals, newDeal];
    setLocalData('deals', updatedDeals);
    
    return newDeal;
  },

  update: async (id: string, data: DealUpdateInput): Promise<Deal> => {
    await simulateDelay();
    simulateError();
    
    const deals = getLocalData('deals', dealsData as Deal[]);
    const dealIndex = deals.findIndex(d => d.id === id);
    
    if (dealIndex === -1) {
      throw new Error('Deal não encontrado');
    }
    
    const updatedDeal = {
      ...deals[dealIndex],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    const updatedDeals = [...deals];
    updatedDeals[dealIndex] = updatedDeal;
    setLocalData('deals', updatedDeals);
    
    return updatedDeal;
  },

  delete: async (id: string): Promise<void> => {
    await simulateDelay();
    simulateError();
    
    const deals = getLocalData('deals', dealsData as Deal[]);
    const filteredDeals = deals.filter(d => d.id !== id);
    
    if (filteredDeals.length === deals.length) {
      throw new Error('Deal não encontrado');
    }
    
    setLocalData('deals', filteredDeals);
  }
};

const apiLeadScoring = {
  getAll: async (contactIds?: string[]): Promise<LeadScore[]> => {
    await simulateDelay();
    simulateError();
    
    let scores = getLocalData('lead-scores', leadScoresData as LeadScore[]);
    
    if (contactIds) {
      scores = scores.filter(s => contactIds.includes(s.contactId));
    }
    
    return scores;
  },

  getByContactId: async (contactId: string): Promise<LeadScore> => {
    await simulateDelay();
    simulateError();
    
    const scores = getLocalData('lead-scores', leadScoresData as LeadScore[]);
    const score = scores.find(s => s.contactId === contactId);
    
    if (!score) {
      // Criar score padrão se não existir
      const newScore: LeadScore = {
        id: `score_${Date.now()}`,
        contactId,
        score: 50,
        factors: {
          engagement: 30,
          demographics: 20,
          behavior: 25,
          firmographics: 15
        },
        lastCalculated: new Date().toISOString()
      };
      
      const updatedScores = [...scores, newScore];
      setLocalData('lead-scores', updatedScores);
      
      return newScore;
    }
    
    return score;
  },

  update: async (contactId: string, score: number): Promise<LeadScore> => {
    await simulateDelay();
    simulateError();
    
    const scores = getLocalData('lead-scores', leadScoresData as LeadScore[]);
    const scoreIndex = scores.findIndex(s => s.contactId === contactId);
    
    if (scoreIndex === -1) {
      // Criar novo score
      const newScore: LeadScore = {
        id: `score_${Date.now()}`,
        contactId,
        score,
        factors: {
          engagement: Math.round(score * 0.4),
          demographics: Math.round(score * 0.2),
          behavior: Math.round(score * 0.3),
          firmographics: Math.round(score * 0.1)
        },
        lastCalculated: new Date().toISOString()
      };
      
      const updatedScores = [...scores, newScore];
      setLocalData('lead-scores', updatedScores);
      
      return newScore;
    }
    
    const updatedScore = {
      ...scores[scoreIndex],
      score,
      factors: {
        engagement: Math.round(score * 0.4),
        demographics: Math.round(score * 0.2),
        behavior: Math.round(score * 0.3),
        firmographics: Math.round(score * 0.1)
      },
      lastCalculated: new Date().toISOString()
    };
    
    const updatedScores = [...scores];
    updatedScores[scoreIndex] = updatedScore;
    setLocalData('lead-scores', updatedScores);
    
    return updatedScore;
  }
};

const apiActivities = {
  getAll: async (filters: ActivityFilters = {}): Promise<Activity[]> => {
    await simulateDelay();
    simulateError();
    
    let activities = getLocalData('activities', activitiesData as Activity[]);
    
    // Aplicar filtros
    if (filters.type) {
      activities = activities.filter(a => a.type === filters.type);
    }
    if (filters.contactId) {
      activities = activities.filter(a => a.contactId === filters.contactId);
    }
    if (filters.startDate) {
      activities = activities.filter(a => a.createdAt >= filters.startDate!);
    }
    if (filters.endDate) {
      activities = activities.filter(a => a.createdAt <= filters.endDate!);
    }
    
    // Ordenar por data (mais recente primeiro)
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Limitar resultados
    if (filters.limit) {
      activities = activities.slice(0, filters.limit);
    }
    
    return activities;
  },

  create: async (data: ActivityCreateInput): Promise<Activity> => {
    await simulateDelay();
    simulateError();
    
    const activities = getLocalData('activities', activitiesData as Activity[]);
    
    const newActivity: Activity = {
      id: `activity_${Date.now()}`,
      type: data.type,
      title: data.title,
      description: data.description,
      contactId: data.contactId,
      dealId: data.dealId,
      userId: data.userId,
      metadata: data.metadata,
      createdAt: new Date().toISOString()
    };
    
    const updatedActivities = [...activities, newActivity];
    setLocalData('activities', updatedActivities);
    
    return newActivity;
  }
};

// Hooks personalizados
export const useContacts = () => {
  const queryClient = useQueryClient();
  
  const getContacts = (filters: ContactFilters = {}) => {
    return useQuery({
      queryKey: ['contacts', filters],
      queryFn: () => apiContacts.getAll(filters),
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
    });
  };
  
  const getContact = (id: string) => {
    return useQuery({
      queryKey: ['contacts', id],
      queryFn: () => apiContacts.getById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };
  
  const createContact = useMutation({
    mutationFn: apiContacts.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['contacts']);
    },
  });
  
  const updateContact = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContactUpdateInput }) => 
      apiContacts.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['contacts']);
    },
  });
  
  const deleteContact = useMutation({
    mutationFn: apiContacts.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['contacts']);
    },
  });
  
  return {
    getContacts,
    getContact,
    createContact,
    updateContact,
    deleteContact
  };
};

export const useDeals = () => {
  const queryClient = useQueryClient();
  
  const getDeals = (filters: DealFilters = {}) => {
    return useQuery({
      queryKey: ['deals', filters],
      queryFn: () => apiDeals.getAll(filters),
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    });
  };
  
  const getDeal = (id: string) => {
    return useQuery({
      queryKey: ['deals', id],
      queryFn: () => apiDeals.getById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };
  
  const createDeal = useMutation({
    mutationFn: apiDeals.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
    },
  });
  
  const updateDeal = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DealUpdateInput }) => 
      apiDeals.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
    },
  });
  
  const deleteDeal = useMutation({
    mutationFn: apiDeals.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
    },
  });
  
  return {
    getDeals,
    getDeal,
    createDeal,
    updateDeal,
    deleteDeal
  };
};

export const useLeadScoring = () => {
  const queryClient = useQueryClient();
  
  const getLeadScores = (contactIds?: string[]) => {
    return useQuery({
      queryKey: ['lead-scores', contactIds],
      queryFn: () => apiLeadScoring.getAll(contactIds),
      staleTime: 10 * 60 * 1000, // 10 minutos
    });
  };
  
  const getLeadScore = (contactId: string) => {
    return useQuery({
      queryKey: ['lead-scores', contactId],
      queryFn: () => apiLeadScoring.getByContactId(contactId),
      enabled: !!contactId,
      staleTime: 10 * 60 * 1000,
    });
  };
  
  const updateLeadScore = useMutation({
    mutationFn: ({ contactId, score }: { contactId: string; score: number }) => 
      apiLeadScoring.update(contactId, score),
    onSuccess: () => {
      queryClient.invalidateQueries(['lead-scores']);
    },
  });
  
  return {
    getLeadScores,
    getLeadScore,
    updateLeadScore
  };
};

export const useActivities = () => {
  const queryClient = useQueryClient();
  
  const getActivities = (filters: ActivityFilters = {}) => {
    return useQuery({
      queryKey: ['activities', filters],
      queryFn: () => apiActivities.getAll(filters),
      staleTime: 2 * 60 * 1000, // 2 minutos
    });
  };
  
  const createActivity = useMutation({
    mutationFn: apiActivities.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['activities']);
    },
  });
  
  return {
    getActivities,
    createActivity
  };
};

// Hook principal que exporta todos os hooks
export const useCRMData = () => {
  const contacts = useContacts();
  const deals = useDeals();
  const leadScoring = useLeadScoring();
  const activities = useActivities();
  
  return {
    contacts,
    deals,
    leadScoring,
    activities
  };
};

// Exportar tipos para uso em componentes
export type {
  ContactFilters,
  DealFilters,
  ActivityFilters
};