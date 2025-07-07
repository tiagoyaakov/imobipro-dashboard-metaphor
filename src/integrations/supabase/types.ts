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

export interface Database {
  public: {
    Tables: {
      // Tabelas serão adicionadas conforme o esquema for criado
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

// -----------------------------------------------------------
// Tipos customizados para as funções RPC do Dashboard
// -----------------------------------------------------------

export interface DashboardKpis {
  total_properties: number;
  active_clients: number;
  total_revenue: number;
  sales_this_month: number;
}

export interface SalesPerformanceData {
  month: string;
  total_sales: number;
}

export interface NewPropertiesPerformanceData {
  month: string;
  new_properties: number;
}

export interface RecentActivity {
  description: string;
  created_at: string;
  user_name: string;
}
