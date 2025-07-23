// Tipos gerados para o projeto ImobPRO
// Project ID: eeceyvenrnyyqvilezgr  
// Project URL: https://eeceyvenrnyyqvilezgr.supabase.co
/* eslint-disable @typescript-eslint/no-explicit-any */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// =============================================================
// NOVA HIERARQUIA DE USUÁRIOS
// =============================================================
export type UserRole = 'DEV_MASTER' | 'ADMIN' | 'AGENT';

// Interface do usuário com nova hierarquia
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  company_id: string;
  avatar_url?: string;
  telefone?: string;
  created_at: string;
  updated_at: string;
}

// Interface para impersonation
export interface UserImpersonation {
  id: string;
  admin_user_id: string;
  impersonated_user_id: string;
  session_token: string;
  is_active: boolean;
  created_at: string;
  ended_at?: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
        Relationships: [];
      };
      user_impersonations: {
        Row: UserImpersonation;
        Insert: Omit<UserImpersonation, 'id' | 'created_at'>;
        Update: Partial<Omit<UserImpersonation, 'id' | 'created_at'>>;
        Relationships: [];
      };
      // Outras tabelas serão adicionadas conforme necessário
      [key: string]: {
        Row: { [key: string]: any }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: any[]
      }
    }
    Views: {
      [key: string]: {
        Row: { [key: string]: any }
        Relationships: any[]
      }
    }
    Functions: {
      [key: string]: {
        Args: { [key: string]: any }
        Returns: any
      }
    }
    Enums: {
      user_role: UserRole;
      [key: string]: string
    }
    CompositeTypes: {
      [key: string]: { [key: string]: any }
    }
  }
}

// Aliases para facilitar o uso
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// =============================================================
// HELPERS PARA NOVA HIERARQUIA
// =============================================================

/**
 * Verifica se o role é DEV_MASTER (administrador global oculto)
 */
export const isDevMaster = (role?: UserRole): boolean => role === 'DEV_MASTER';

/**
 * Verifica se o role é ADMIN (administrador de imobiliária)
 */
export const isImobiliariaAdmin = (role?: UserRole): boolean => role === 'ADMIN';

/**
 * Verifica se o role é AGENT (corretor)
 */
export const isAgent = (role?: UserRole): boolean => role === 'AGENT';

/**
 * Verifica se o role tem permissões administrativas (DEV_MASTER ou ADMIN)
 */
export const hasAdminPermissions = (role?: UserRole): boolean => 
  role === 'DEV_MASTER' || role === 'ADMIN';

/**
 * Verifica se um usuário pode gerenciar outro baseado na hierarquia
 */
export const canManageUser = (adminRole?: UserRole, targetRole?: UserRole): boolean => {
  if (!adminRole || !targetRole) return false;
  
  switch (adminRole) {
    case 'DEV_MASTER':
      // DEV_MASTER pode gerenciar ADMIN e AGENT (mas não outros DEV_MASTER)
      return targetRole !== 'DEV_MASTER';
    case 'ADMIN':
      // ADMIN pode gerenciar apenas AGENT
      return targetRole === 'AGENT';
    default:
      return false;
  }
};

/**
 * Verifica se um usuário pode impersonar outro baseado na hierarquia
 */
export const canImpersonateUser = (adminRole?: UserRole, targetRole?: UserRole): boolean => {
  if (!adminRole || !targetRole) return false;
  
  switch (adminRole) {
    case 'DEV_MASTER':
      // DEV_MASTER pode impersonar ADMIN e AGENT (mas não outros DEV_MASTER)
      return targetRole !== 'DEV_MASTER';
    case 'ADMIN':
      // ADMIN pode impersonar apenas AGENT
      return targetRole === 'AGENT';
    default:
      return false;
  }
};

/**
 * Traduz o role para português
 */
export const translateRole = (role: UserRole): string => {
  const roleMap: Record<UserRole, string> = {
    'DEV_MASTER': 'Dev Master',
    'ADMIN': 'Administrador',
    'AGENT': 'Corretor',
  };
  return roleMap[role] || role;
};
