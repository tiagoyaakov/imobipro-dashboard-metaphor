import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import type { User } from '../hooks/useUsers';
import { authKeys, AUTH_ERROR_MESSAGES, LoginFormData } from '../schemas/auth';
import { authConfig } from '../config/auth';
import '../utils/authDebug'; // Importar debug helper

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
  updateProfile: (data: { name: string; email: string; avatarUrl?: string }) => Promise<{ success: boolean; error?: string }>;
  /** Atualizar avatar do usuário */
  updateAvatar: (avatarUrl: string) => Promise<{ success: boolean; error?: string }>;
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
      if (!supabaseUser || !session) {
        console.log('🔐 [Auth] Aguardando usuário ou sessão...', { user: !!supabaseUser, session: !!session });
        return null;
      }
      
      // Buscar dados customizados do usuário na tabela users (sem JOIN por enquanto)
      console.log('🔐 [Auth] Buscando dados do usuário:', supabaseUser.id);
      console.log('🔐 [Auth] Session ativa:', session?.access_token ? 'SIM' : 'NÃO');
      
      const { data, error } = await supabase
        .from('User')
        .select(`
          id,
          email,
          name,
          role,
          companyId,
          isActive,
          avatarUrl,
          telefone,
          createdAt,
          updatedAt
        `)
        .eq('id', supabaseUser.id)
        .single();

      console.log('🔐 [Auth] Resultado da query:', { data, error });
      console.log('🔐 [Auth] Erro detalhado:', error?.code, error?.message, error?.details);

      if (error) {
        console.error('🔐 [Auth] Erro ao buscar dados do usuário:', error);
        console.error('🔐 [Auth] Detalhes do erro:', error.message, error.code);
        
        // Fallback: usar dados básicos do Supabase Auth
        console.log('🔐 [Auth] Usando fallback com dados do Supabase Auth');
        console.log('🔐 [Auth] Metadata do Supabase:', supabaseUser.user_metadata);
        
        // Usar o company ID padrão da configuração
        const defaultCompanyId = authConfig.development.defaultCompanyId;
        console.warn('⚠️ [Auth] Usando company ID padrão. Configure VITE_DEFAULT_COMPANY_ID em produção');
        
        // Verificar metadata role primeiro
        const metadataRole = supabaseUser.user_metadata?.role;
        console.log('🔐 [Auth] Role no metadata:', metadataRole);
        
        // Mapear role do metadata se existir (com segurança)
        let fallbackRole: 'DEV_MASTER' | 'ADMIN' | 'AGENT' = 'AGENT';
        if (metadataRole === 'CREATOR' || metadataRole === 'DEV_MASTER') {
          // Verificar se o email é um email autorizado para DEV_MASTER
          const authorizedEmails = ['1992tiagofranca@gmail.com']; // Lista de emails autorizados
          if (authorizedEmails.includes(supabaseUser.email || '')) {
            fallbackRole = 'DEV_MASTER';
          }
        } else if (metadataRole === 'ADMIN') {
          fallbackRole = 'ADMIN';
        }
        
        const fallbackUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.name || supabaseUser.email || 'Usuário',
          role: fallbackRole,
          isActive: true,
          companyId: defaultCompanyId,
          avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
          telefone: supabaseUser.user_metadata?.telefone || null,
          createdAt: supabaseUser.created_at || new Date().toISOString(),
          updatedAt: supabaseUser.updated_at || new Date().toISOString(),
        };
        
        console.log('🔐 [Auth] Fallback user criado:', fallbackUser);
        
        return fallbackUser;
      }

      // Map database role to app role (handle role differences)
      let mappedRole: 'DEV_MASTER' | 'ADMIN' | 'AGENT' = 'AGENT'; // Default to AGENT
      if (data.role === 'CREATOR') mappedRole = 'DEV_MASTER'; // Map CREATOR to DEV_MASTER
      else if (data.role === 'DEV_MASTER') mappedRole = 'DEV_MASTER';
      else if (data.role === 'ADMIN') mappedRole = 'ADMIN';
      else if (data.role === 'MANAGER') mappedRole = 'ADMIN'; // Map MANAGER to ADMIN
      else if (data.role === 'VIEWER') mappedRole = 'AGENT'; // Map VIEWER to AGENT
      else mappedRole = 'AGENT'; // FORÇAR AGENT para qualquer role desconhecida

      // Use company ID from config or database
      const companyId = data.companyId || authConfig.development.defaultCompanyId;
      
      if (!data.companyId && !import.meta.env.PROD) {
        console.warn('⚠️ [Auth] Usuário sem company_id. Usando padrão:', companyId);
      }
      
      // Create user object using real database fields
      const user: User = {
        id: data.id,
        email: data.email,
        name: data.name,
        role: mappedRole,
        isActive: data.isActive ?? true, // Use DB value or default to true
        companyId: data.companyId || companyId,
        avatarUrl: data.avatarUrl || null, // Use DB value or null
        telefone: data.telefone || null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      return user;
    },
    enabled: !!supabaseUser && !!session,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });

  // -----------------------------------------------------------
  // Provisionamento pós-login: garantir registro em public."User"
  // -----------------------------------------------------------
  const ensurePublicUserRecord = useCallback(async (current: SupabaseUser | null) => {
    try {
      if (!current) return;

      // Verificar se já existe registro em public."User"
      const { data: existing, error: fetchError } = await supabase
        .from('User')
        .select('id')
        .eq('id', current.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = row not found (ok para prosseguir com insert)
        console.warn('🔐 [Auth] Não foi possível verificar usuário em public."User" (seguindo):', fetchError);
      }

      if (existing?.id) {
        // Já provisionado
        return;
      }

      // Determinar companyId
      let companyId: string | null = authConfig.development.defaultCompanyId || null;
      if (!companyId) {
        const { data: companies } = await supabase
          .from('Company')
          .select('id')
          .limit(1);
        companyId = companies?.[0]?.id ?? null;
      }

      // Determinar role básica (padrão AGENT)
      const metadataRole = (current.user_metadata?.role as string | undefined) || 'AGENT';
      const normalizedRole = ['DEV_MASTER', 'ADMIN', 'MANAGER', 'VIEWER', 'CREATOR', 'AGENT'].includes(metadataRole)
        ? metadataRole
        : 'AGENT';

      const insertData = {
        id: current.id,
        email: (current.email || '').trim().toLowerCase(),
        password: '[HANDLED_BY_SUPABASE_AUTH]',
        name: (current.user_metadata?.name as string) || current.email || 'Usuário',
        role: normalizedRole,
        companyId: companyId,
        isActive: true,
        avatarUrl: (current.user_metadata?.avatar_url as string) || null,
      } as const;

      const { error: insertError } = await supabase
        .from('User')
        .insert([insertData]);

      if (insertError) {
        // Se falhar, apenas logar. A tela utilizará fallback já existente.
        console.error('🔐 [Auth] Falha ao provisionar usuário em public."User":', insertError);
      } else {
        console.log('🔐 [Auth] Usuário provisionado em public."User":', { id: insertData.id, companyId: insertData.companyId, role: insertData.role });
      }
    } catch (err) {
      console.warn('🔐 [Auth] Erro inesperado no provisionamento de public."User" (ignorado):', err);
    }
  }, []);

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
  const updateProfile = useCallback(async (data: { name: string; email: string; avatarUrl?: string }): Promise<{ success: boolean; error?: string }> => {
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

      // Atualizar dados customizados na tabela users
      const updateData: { name: string; email: string; updatedAt: string; avatarUrl?: string } = {
        name: data.name,
        email: data.email,
        updatedAt: new Date().toISOString(),
      };

      if (data.avatarUrl !== undefined) {
        updateData.avatarUrl = data.avatarUrl;
      }

      const { error: updateError } = await supabase
        .from('User')
        .update(updateData)
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

  /**
   * Atualizar apenas o avatar do usuário
   */
  const updateAvatar = useCallback(async (avatarUrl: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseUser) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      // Atualizar dados customizados na tabela users
      const { error: updateError } = await supabase
        .from('User')
        .update({
          avatarUrl: avatarUrl,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', supabaseUser.id);

      if (updateError) {
        throw updateError;
      }

      // Recarregar dados do usuário de forma forçada
      await queryClient.invalidateQueries({ queryKey: authKeys.user() });
      await queryClient.refetchQueries({ queryKey: authKeys.user() });

      return { success: true };
    } catch (error: unknown) {
      console.error('Erro ao atualizar avatar:', error);
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
      
      // Garantir provisionamento caso já exista sessão válida (não bloquear UI)
      if (session?.user) {
        // Fire-and-forget para não travar isLoading
        ensurePublicUserRecord(session.user);
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
            // Provisionar public."User" sem bloquear UI
            ensurePublicUserRecord(session?.user ?? null);
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
    updateAvatar,
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
    // Em produção e se estivermos em uma rota que deveria ter contexto, lançar erro
    if (import.meta.env.PROD && window.location.pathname.startsWith('/auth/login')) {
      console.warn('[AuthContext] Contexto não disponível na página de login, retornando estado padrão');
      
      // Retornar estado padrão para páginas de auth
      return {
        isAuthenticated: false,
        user: null,
        isLoading: false,
        login: async () => ({ success: false, error: 'Contexto não inicializado' }),
        logout: () => {},
        switchUser: () => {},
        refreshUser: async () => {},
        updateProfile: async () => ({ success: false, error: 'Contexto não inicializado' }),
        updateAvatar: async () => ({ success: false, error: 'Contexto não inicializado' }),
      };
    }
    
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
 * Hook para gerenciar login de usuário
 * Independente do contexto de autenticação para funcionar em rotas públicas
 */
export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleLogin = useCallback(async (data: LoginFormData) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        const errorMessage = mapSupabaseError(authError);
        setError(errorMessage);
        setIsLoading(false);
        return { success: false, error: errorMessage };
      }

      if (authData?.user) {
        // Invalidar queries para recarregar dados do usuário
        await queryClient.invalidateQueries({ queryKey: authKeys.user() });
        setIsLoading(false);
        return { success: true };
      }

      setError(AUTH_ERROR_MESSAGES.UNKNOWN_ERROR);
      setIsLoading(false);
      return { success: false, error: AUTH_ERROR_MESSAGES.UNKNOWN_ERROR };
    } catch (error) {
      const errorMessage = AUTH_ERROR_MESSAGES.UNKNOWN_ERROR;
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  }, [queryClient]);

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
      console.log('[DEBUG] Iniciando signup completo:', { 
        email: email.trim().toLowerCase(), 
        metadata: metadata 
      });

      // 1. Primeiro, fazer o signup no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            name: metadata?.name || '',
            role: 'AGENT', // FORÇAR SEMPRE AGENT NO SIGNUP
          }
        },
      });

      if (authError) {
        console.error('[DEBUG] Erro no signup do Supabase Auth:', authError);
        
        // Tratamento específico para email duplicado
        if (authError.message?.includes('already registered') || 
            authError.message?.includes('user_already_exists') ||
            authError.status === 422) {
          const errorMessage = 'Este email já está cadastrado. Tente fazer login ou use outro email.';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }
        
        const errorMessage = mapSupabaseError(authError);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      console.log('[DEBUG] ✅ Signup no Auth bem-sucedido:', authData);

      // 2. Se o signup foi bem-sucedido E há um usuário, inserir na tabela users
      if (authData?.user) {
        console.log('[DEBUG] Inserindo usuário na tabela users...');
        
        // Buscar uma empresa padrão ou criar uma se necessário
        const { data: companies, error: companiesError } = await supabase
          .from('Company')
          .select('id')
          .limit(1);

        if (companiesError) {
          console.error('[DEBUG] Erro ao buscar companies:', companiesError);
        }

        let companyId = companies?.[0]?.id;
        
        // Se não há empresas, criar uma padrão (apenas para desenvolvimento/teste)
        if (!companyId) {
          console.log('[DEBUG] Criando empresa padrão...');
          const { data: newCompany, error: createCompanyError } = await supabase
            .from('Company')
            .insert([
              { name: 'Empresa Padrão' }
            ])
            .select('id')
            .single();

          if (createCompanyError) {
            console.error('[DEBUG] Erro ao criar empresa:', createCompanyError);
          } else {
            companyId = newCompany?.id;
          }
        }

        // Inserir o usuário na tabela custom users
        const insertData = {
          id: authData.user.id, // Usar o ID do Supabase Auth
          email: email.trim().toLowerCase(),
          password: '[HANDLED_BY_SUPABASE_AUTH]', // Placeholder, auth é gerenciado pelo Supabase
          name: metadata?.name || '',
          role: 'AGENT', // FORÇAR SEMPRE AGENT NO SIGNUP
          companyId: companyId,
          isActive: true,
        };
        
        console.log('[DEBUG] Dados que serão inseridos na tabela User:', insertData);
        
        const { data: userData, error: userError } = await supabase
          .from('User')
          .insert([insertData])
          .select()
          .single();

        if (userError) {
          console.error('[DEBUG] Erro ao inserir usuário na tabela users:', userError);
          
          // Se falhou a inserção na tabela users mas o auth foi criado, 
          // usuário pode fazer login mas dados podem estar incompletos
          console.log('[DEBUG] Auth criado mas falha na tabela users. Usuário pode fazer login mas dados podem estar incompletos.');
        } else {
          console.log('[DEBUG] ✅ Usuário inserido na tabela users com sucesso:', userData);
        }
      }

      console.log('[DEBUG] ✅ Signup completo finalizado com sucesso');
      return { success: true, data: authData };

    } catch (error: unknown) {
      console.error('[DEBUG] ❌ Erro geral no signup:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado durante o registro';
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
  return hasRole(user, 'ADMIN') || hasRole(user, 'DEV_MASTER');
};

/**
 * Verifica se o usuário é o criador do sistema
 */
export const isDevMaster = (user: User | null): boolean => {
  return hasRole(user, 'DEV_MASTER');
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