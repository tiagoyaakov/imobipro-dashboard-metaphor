import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { User } from '../schemas/crm';
import { authKeys, AUTH_ERROR_MESSAGES, LoginFormData } from '../schemas/auth';

// -----------------------------------------------------------
// Tipos do contexto de autenticação
// Mantendo interface idêntica ao AuthContextMock
// -----------------------------------------------------------

interface AuthContextType {
  /** Indica se o usuário está autenticado */
  isAuthenticated: boolean;
  /** Dados do usuário logado, null se não autenticado */
  user: User | null;
  /** Indica se a autenticação está carregando */
  isLoading: boolean;
  /** Realiza login com Supabase */
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  /** Realiza logout com Supabase */
  logout: () => void;
  /** Alterna entre usuários (mantido para compatibilidade - não funcional no auth real) */
  switchUser: (userId: string) => void;
  /** Recuperar dados do usuário atual */
  refreshUser: () => Promise<void>;
  /** Atualizar perfil do usuário */
  updateProfile: (data: { name: string; email: string }) => Promise<{ success: boolean; error?: string }>;
}

// -----------------------------------------------------------
// Contexto de autenticação
// -----------------------------------------------------------

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// -----------------------------------------------------------
// Provider de autenticação real (Supabase)
// -----------------------------------------------------------

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Estados locais
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Query client para gerenciar cache
  const queryClient = useQueryClient();

  // Query para buscar dados do usuário customizado
  const { data: customUser, isLoading: isLoadingUser } = useQuery({
    queryKey: authKeys.user(),
    queryFn: async (): Promise<User | null> => {
      if (!supabaseUser) return null;
      
      // Buscar dados customizados do usuário na tabela User
      const { data, error } = await supabase
        .from('User')
        .select(`
          id,
          email,
          name,
          role,
          isActive,
          companyId,
          company:Company(id, name),
          createdAt,
          updatedAt
        `)
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('🔐 [Auth] Erro ao buscar dados do usuário:', error);
        return null;
      }

      return data as User;
    },
    enabled: !!supabaseUser,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });

  /**
   * Mapeia erros do Supabase para mensagens em português
   */
  const mapSupabaseError = (error: any): string => {
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('invalid login credentials') || message.includes('invalid_credentials')) {
      return AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS;
    }
    
    if (message.includes('email not confirmed') || message.includes('email_not_confirmed')) {
      return AUTH_ERROR_MESSAGES.EMAIL_NOT_CONFIRMED;
    }
    
    if (message.includes('signup_disabled')) {
      return AUTH_ERROR_MESSAGES.SIGNUP_DISABLED;
    }
    
    if (message.includes('too_many_requests') || message.includes('rate limit')) {
      return AUTH_ERROR_MESSAGES.TOO_MANY_REQUESTS;
    }
    
    if (message.includes('weak_password')) {
      return AUTH_ERROR_MESSAGES.WEAK_PASSWORD;
    }
    
    if (message.includes('user_already_exists') || message.includes('email_address_not_authorized')) {
      return AUTH_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
    }
    
    return AUTH_ERROR_MESSAGES.UNKNOWN_ERROR;
  };

  /**
   * Realiza login com Supabase Auth
   */
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        console.error('🔐 [Auth] Erro no login:', error);
        return { 
          success: false, 
          error: mapSupabaseError(error)
        };
      }

      if (!data.user || !data.session) {
        return { 
          success: false, 
          error: AUTH_ERROR_MESSAGES.UNKNOWN_ERROR
        };
      }

      // Estados serão atualizados automaticamente pelo listener onAuthStateChange
      console.log('🔐 [Auth] Login realizado com sucesso:', data.user.email);
      
      return { success: true };
      
    } catch (error) {
      console.error('🔐 [Auth] Erro inesperado no login:', error);
      return { 
        success: false, 
        error: AUTH_ERROR_MESSAGES.NETWORK_ERROR
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Realiza logout com Supabase Auth
   */
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('🔐 [Auth] Erro no logout:', error);
      }

      // Limpar cache do React Query
      queryClient.clear();
      
      console.log('🔐 [Auth] Logout realizado com sucesso');
      
    } catch (error) {
      console.error('🔐 [Auth] Erro inesperado no logout:', error);
    } finally {
      setIsLoading(false);
    }
  }, [queryClient]);

  /**
   * Função mantida para compatibilidade com AuthContextMock
   * Não funcional no auth real - apenas log de aviso
   */
  const switchUser = useCallback((userId: string): void => {
    console.warn('🔐 [Auth] switchUser não é suportado no AuthContext real. Use login/logout.');
  }, []);

  /**
   * Atualiza dados do usuário atual
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    if (!supabaseUser) return;
    
    try {
      // Invalidar cache e recarregar dados do usuário
      await queryClient.invalidateQueries({ queryKey: authKeys.user() });
      
      // Recarregar sessão do Supabase
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('🔐 [Auth] Erro ao atualizar sessão:', error);
        return;
      }
      
      console.log('🔐 [Auth] Dados do usuário atualizados');
      
    } catch (error) {
      console.error('🔐 [Auth] Erro ao atualizar usuário:', error);
    }
  }, [supabaseUser, queryClient]);

  /**
   * Atualizar perfil do usuário
   */
  const updateProfile = useCallback(async (data: { name: string; email: string }): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseUser) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      // Atualizar dados no Supabase Auth se email mudou
      if (data.email !== supabaseUser.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: data.email
        });
        
        if (emailError) {
          throw emailError;
        }
      }

      // Atualizar dados customizados na tabela User
      const { error: updateError } = await supabase
        .from('User')
        .update({
          name: data.name,
          email: data.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', supabaseUser.id);

      if (updateError) {
        throw updateError;
      }

      // Recarregar dados do usuário
      await queryClient.invalidateQueries({ queryKey: authKeys.user() });

      return { success: true };
    } catch (error: unknown) {
      console.error('Erro ao atualizar perfil:', error);
      return { 
        success: false, 
        error: mapSupabaseError(error)
      };
    }
  }, [supabaseUser, queryClient]);

  // Configurar listener de mudanças de autenticação
  useEffect(() => {
    let mounted = true;

    // Obter sessão inicial
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('🔐 [Auth] Erro ao obter sessão inicial:', error);
      }
      
      if (mounted) {
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Configurar listener para mudanças de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 [Auth] Estado de autenticação alterado:', event);
        
        if (mounted) {
          setSession(session);
          setSupabaseUser(session?.user ?? null);
          
          if (event === 'SIGNED_IN') {
            // Invalidar cache para recarregar dados do usuário
            queryClient.invalidateQueries({ queryKey: authKeys.user() });
          }
          
          if (event === 'SIGNED_OUT') {
            // Limpar cache
            queryClient.clear();
          }
          
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Valor do contexto
  const contextValue: AuthContextType = {
    isAuthenticated: !!supabaseUser && !!customUser,
    user: customUser || null,
    isLoading: isLoading || isLoadingUser,
    login,
    logout,
    switchUser, // Mantido para compatibilidade
    refreshUser,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// -----------------------------------------------------------
// Hook para usar o contexto de autenticação
// -----------------------------------------------------------

/**
 * Hook para acessar o contexto de autenticação real
 * Interface idêntica ao useAuthMock para compatibilidade
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error(
      'useAuth deve ser usado dentro de um AuthProvider. ' +
      'Certifique-se de envolver seu componente com <AuthProvider>.'
    );
  }
  
  return context;
};

// -----------------------------------------------------------
// Hooks auxiliares para funcionalidades específicas
// -----------------------------------------------------------

/**
 * Hook para gerenciar estado de login
 */
export const useLogin = () => {
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = useCallback(async (data: LoginFormData) => {
    setError(null);
    
    const result = await login(data.email, data.password);
    
    if (!result.success && result.error) {
      setError(result.error);
    }
    
    return result;
  }, [login]);

  return {
    login: handleLogin,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};

/**
 * Hook para gerenciar registro de usuário
 */
export const useSignup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signup = useCallback(async (email: string, password: string, metadata?: Record<string, any>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: metadata || {},
        },
      });

      if (error) {
        const errorMessage = mapSupabaseError(error);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      return { success: true, data };

    } catch (error) {
      const errorMessage = AUTH_ERROR_MESSAGES.NETWORK_ERROR;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    signup,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};

/**
 * Hook para recuperação de senha
 */
export const usePasswordReset = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        const errorMessage = mapSupabaseError(error);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      return { success: true };

    } catch (error) {
      const errorMessage = AUTH_ERROR_MESSAGES.NETWORK_ERROR;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    resetPassword,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};

// -----------------------------------------------------------
// Utilitários de validação (mantidos do AuthContextMock)
// -----------------------------------------------------------

/**
 * Valida se um usuário possui uma role específica
 */
export const hasRole = (user: User | null, requiredRole: string): boolean => {
  if (!user) return false;
  return user.role === requiredRole;
};

/**
 * Verifica se o usuário tem permissão de administrador
 */
export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, 'ADMIN') || hasRole(user, 'CREATOR');
};

/**
 * Verifica se o usuário é o criador do sistema
 */
export const isCreator = (user: User | null): boolean => {
  return hasRole(user, 'CREATOR');
};

// -----------------------------------------------------------
// Função auxiliar para mapear erros (reutilizada pelos hooks)
// -----------------------------------------------------------
const mapSupabaseError = (error: any): string => {
  const message = error?.message?.toLowerCase() || '';
  
  if (message.includes('invalid login credentials') || message.includes('invalid_credentials')) {
    return AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS;
  }
  
  if (message.includes('email not confirmed') || message.includes('email_not_confirmed')) {
    return AUTH_ERROR_MESSAGES.EMAIL_NOT_CONFIRMED;
  }
  
  if (message.includes('signup_disabled')) {
    return AUTH_ERROR_MESSAGES.SIGNUP_DISABLED;
  }
  
  if (message.includes('too_many_requests') || message.includes('rate limit')) {
    return AUTH_ERROR_MESSAGES.TOO_MANY_REQUESTS;
  }
  
  if (message.includes('weak_password')) {
    return AUTH_ERROR_MESSAGES.WEAK_PASSWORD;
  }
  
  if (message.includes('user_already_exists') || message.includes('email_address_not_authorized')) {
    return AUTH_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
  }
  
  return AUTH_ERROR_MESSAGES.UNKNOWN_ERROR;
};

// -----------------------------------------------------------
// Exportações
// -----------------------------------------------------------

export type { AuthContextType };
export { AuthContext }; 