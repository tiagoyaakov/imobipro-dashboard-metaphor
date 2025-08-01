import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Validar variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Criar cliente Supabase com tipos
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'x-client-info': 'imobipro-dashboard@1.0.0',
    },
  },
  db: {
    schema: 'public',
  },
})

// Helper para verificar autenticação
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    console.error('Auth error:', error)
    return null
  }
  
  return user
}

// Helper para buscar dados do usuário completo
export async function getCurrentUserProfile() {
  const user = await getCurrentUser()
  if (!user) return null
  
  const { data, error } = await supabase
    .from('User')
    .select('*, Company(*)')
    .eq('id', user.id)
    .single()
  
  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
  
  return data
}

// Helper para verificar role do usuário
export async function getUserRole(): Promise<Database['public']['Enums']['UserRole'] | null> {
  const profile = await getCurrentUserProfile()
  return profile?.role || null
}

// Helper para verificar permissões
export async function checkPermission(requiredRole: Database['public']['Enums']['UserRole']): Promise<boolean> {
  const userRole = await getUserRole()
  if (!userRole) return false
  
  // Hierarquia de permissões
  const roleHierarchy = {
    CREATOR: 3,  // DEV_MASTER
    ADMIN: 2,
    AGENT: 1,
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

// Interceptor para logs (desenvolvimento)
if (import.meta.env.DEV) {
  const originalFrom = supabase.from.bind(supabase)
  
  // @ts-ignore - Override para desenvolvimento
  supabase.from = function(table: string) {
    const query = originalFrom(table)
    
    // Log todas as queries em desenvolvimento
    const methods = ['select', 'insert', 'update', 'delete', 'upsert']
    
    methods.forEach(method => {
      const original = query[method]?.bind(query)
      if (original) {
        // @ts-ignore
        query[method] = function(...args: any[]) {
          console.log(`🔍 Supabase ${method.toUpperCase()} on ${table}:`, ...args)
          return original(...args)
        }
      }
    })
    
    return query
  }
}

// Event emitter para mudanças globais
export const supabaseEvents = {
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  },
  
  onTableChange: (table: keyof Database['public']['Tables'], callback: (payload: any) => void) => {
    return supabase
      .channel(`table-${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe()
  },
}

// Tipos úteis exportados
export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums']
export type UserRole = Enums['UserRole']
export type PropertyStatus = Enums['PropertyStatus']
export type ContactCategory = Enums['ContactCategory']
export type AppointmentStatus = Enums['AppointmentStatus']
export type DealStage = Enums['DealStage']