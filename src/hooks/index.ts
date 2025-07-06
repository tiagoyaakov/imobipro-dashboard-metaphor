// Hooks de autenticação e query
export { useAuthenticatedQuery } from './useAuthenticatedQuery'
export { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery'

// Hooks CRM autenticados (Supabase)
export { 
  useContactsAuthenticated, 
  useDealsAuthenticated, 
  useCRMDataAuthenticated 
} from './useCRMDataAuthenticated'

// Hooks existentes (dados mockados)
export { useCRMData, useContacts, useDeals, useLeadScoring, useActivities } from './useCRMData' 