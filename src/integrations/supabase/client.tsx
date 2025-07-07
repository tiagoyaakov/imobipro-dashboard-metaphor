import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';

let supabaseClient: SupabaseClient<Database> | null = null;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

type GetClerkToken = (options?: { template?: string }) => Promise<string | null>;

/**
 * Retorna uma instância singleton do cliente Supabase.
 * A função `getToken` do Clerk é usada para obter dinamicamente o token de autenticação
 * a cada requisição, garantindo que a sessão esteja sempre válida.
 *
 * @param getToken - A função `getToken` do hook `useAuth` do Clerk.
 * @returns Uma instância do SupabaseClient.
 */
export const getSupabaseClient = (getToken: GetClerkToken) => {
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: async (input, init) => {
          const token = await getToken();

          const headers = new Headers(init?.headers);
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
          }

          return fetch(input, { ...init, headers });
        },
      },
    });
  }
  return supabaseClient;
}; 