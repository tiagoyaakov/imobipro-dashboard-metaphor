import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery'
import { useAuth } from '@clerk/clerk-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'
import { 
  Contact, 
  Deal, 
  ContactCreateInput, 
  ContactUpdateInput,
  DealCreateInput, 
  DealUpdateInput,
  ContactStatus,
  ContactCategory,
  DealStage
} from '../schemas/crm'

// Tipos para filtros
interface ContactFilters {
  category?: ContactCategory
  status?: ContactStatus
  search?: string
  page?: number
  limit?: number
}

interface DealFilters {
  stage?: DealStage
  minValue?: number
  maxValue?: number
  assignedTo?: string
  search?: string
  page?: number
  limit?: number
}

// Hook para Contatos autenticados
export const useContactsAuthenticated = () => {
  const queryClient = useQueryClient()
  const { userId } = useAuth()

  // Query para buscar contatos
  const getContacts = (filters: ContactFilters = {}) => {
    return useSupabaseQuery(
      ['contacts', filters],
      async (supabase: SupabaseClient<Database>) => {
        let query = supabase
          .from('contacts')
          .select('*')
          .eq('user_id', userId) // Filtrar por usuário logado

        // Aplicar filtros
        if (filters.category) {
          query = query.eq('category', filters.category)
        }
        if (filters.status) {
          query = query.eq('status', filters.status)
        }
        if (filters.search) {
          query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
        }

        // Paginação
        const page = filters.page || 1
        const limit = filters.limit || 20
        const start = (page - 1) * limit
        const end = start + limit - 1

        query = query.range(start, end)

        const { data, error, count } = await query

        if (error) throw error

        return {
          data: data as Contact[],
          total: count || 0
        }
      },
      {
        staleTime: 5 * 60 * 1000, // 5 minutos
      }
    )
  }

  // Query para buscar contato por ID
  const getContact = (id: string) => {
    return useSupabaseQuery(
      ['contact', id],
      async (supabase: SupabaseClient<Database>) => {
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId)
          .single()

        if (error) throw error
        return data as Contact
      },
      {
        enabled: !!id,
      }
    )
  }

  // Mutation para criar contato
  const createContact = useSupabaseMutation(
    async (supabase: SupabaseClient<Database>, data: ContactCreateInput) => {
      const { data: newContact, error } = await supabase
        .from('contacts')
        .insert({
          ...data,
          user_id: userId,
          avatar: data.avatar || `https://api.dicebear.com/7.x/personas/svg?seed=${data.name}`,
          status: data.status || 'ACTIVE',
        })
        .select()
        .single()

      if (error) throw error
      return newContact as Contact
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['contacts'] })
      },
    }
  )

  // Mutation para atualizar contato
  const updateContact = useSupabaseMutation(
    async (supabase: SupabaseClient<Database>, { id, data }: { id: string; data: ContactUpdateInput }) => {
      const { data: updatedContact, error } = await supabase
        .from('contacts')
        .update(data)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return updatedContact as Contact
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['contacts'] })
      },
    }
  )

  // Mutation para deletar contato
  const deleteContact = useSupabaseMutation(
    async (supabase: SupabaseClient<Database>, id: string) => {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['contacts'] })
      },
    }
  )

  return {
    getContacts,
    getContact,
    createContact: createContact.mutate,
    updateContact: updateContact.mutate,
    deleteContact: deleteContact.mutate,
    isCreating: createContact.isPending,
    isUpdating: updateContact.isPending,
    isDeleting: deleteContact.isPending,
  }
}

// Hook para Deals autenticados
export const useDealsAuthenticated = () => {
  const queryClient = useQueryClient()
  const { userId } = useAuth()

  const getDeals = (filters: DealFilters = {}) => {
    return useSupabaseQuery(
      ['deals', filters],
      async (supabase: SupabaseClient<Database>) => {
        let query = supabase
          .from('deals')
          .select('*, contact:contacts(*)')
          .eq('user_id', userId)

        // Aplicar filtros
        if (filters.stage) {
          query = query.eq('stage', filters.stage)
        }
        if (filters.minValue) {
          query = query.gte('value', filters.minValue)
        }
        if (filters.maxValue) {
          query = query.lte('value', filters.maxValue)
        }
        if (filters.search) {
          query = query.ilike('title', `%${filters.search}%`)
        }

        // Paginação
        const page = filters.page || 1
        const limit = filters.limit || 20
        const start = (page - 1) * limit
        const end = start + limit - 1

        query = query.range(start, end)

        const { data, error, count } = await query

        if (error) throw error

        return {
          data: data as Deal[],
          total: count || 0
        }
      }
    )
  }

  const createDeal = useSupabaseMutation(
    async (supabase: SupabaseClient<Database>, data: DealCreateInput) => {
      const { data: newDeal, error } = await supabase
        .from('deals')
        .insert({
          ...data,
          user_id: userId,
        })
        .select()
        .single()

      if (error) throw error
      return newDeal as Deal
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['deals'] })
      },
    }
  )

  return {
    getDeals,
    createDeal: createDeal.mutate,
    isCreating: createDeal.isPending,
  }
}

// Hook principal que combina todos os recursos CRM autenticados
export const useCRMDataAuthenticated = () => {
  const contacts = useContactsAuthenticated()
  const deals = useDealsAuthenticated()

  return {
    // Contatos
    ...contacts,
    
    // Deals
    getDeals: deals.getDeals,
    createDeal: deals.createDeal,
    isCreatingDeal: deals.isCreating,
  }
} 