import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import { User, UserRoleSchema } from '../schemas/crm';

// Tipo estendido do usuário com campos adicionais do banco
interface ExtendedUser extends User {
  avatar?: string | null;
  phone?: string | null;  
  lastLogin?: Date | null;
}

// -----------------------------------------------------------
// Tipos do contexto de autenticação real
// -----------------------------------------------------------

interface AuthContextType {
  /** Indica se o usuário está autenticado */
  isAuthenticated: boolean;
  /** Dados do usuário logado, null se não autenticado */
  user: ExtendedUser | null;
  /** Sessão do Supabase Auth */
  session: Session | null;
  /** Dados brutos do Supabase User */
  supabaseUser: SupabaseUser | null;
  /** Indica se a autenticação está carregando */
  isLoading: boolean;
  /** Indica se está inicializando a sessão */
  isInitialized: boolean;
  /** Realiza login com email e senha */
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  /** Realiza cadastro com email e senha */
  signup: (email: string, password: string, userData?: Partial<ExtendedUser>) => Promise<{ success: boolean; error?: string }>;
  /** Realiza logout */
  logout: () => Promise<void>;
  /** Envia email de recuperação de senha */
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  /** Atualiza dados do usuário */
  updateUser: (userData: Partial<ExtendedUser>) => Promise<{ success: boolean; error?: string }>;
  /** Recuperar dados do usuário atual */
  refreshUser: () => Promise<void>;
  /** Compatibilidade com mock - função vazia */
  switchUser?: (userId: string) => void;
}

// -----------------------------------------------------------
// Contexto de autenticação real
// -----------------------------------------------------------

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// -----------------------------------------------------------
// Provider de autenticação real com Supabase
// -----------------------------------------------------------

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Estados principais
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  /**
   * Busca dados completos do usuário na tabela users
   */
  const fetchUserProfile = useCallback(async (supabaseUser: SupabaseUser): Promise<ExtendedUser | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('🔐 [Auth] Erro ao buscar perfil do usuário:', error);
        
        // Se usuário não existe na tabela, criar um perfil básico com dados do Auth
        if (error.code === 'PGRST116') {
          console.log('🔐 [Auth] Criando perfil básico com dados do Auth');
          return {
            id: supabaseUser.id,
            name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Usuário',
            email: supabaseUser.email || '',
            role: 'AGENT',
            avatar: null,
            phone: null,
            isActive: true,
            lastLogin: null,
            companyId: 'c1036c09-e971-419b-9244-e9f6792954e2',
            createdAt: supabaseUser.created_at,
            updatedAt: supabaseUser.updated_at || supabaseUser.created_at
          };
        }
        
        return null;
      }

      // Validar e transformar dados para o schema User estendido
      const userData: ExtendedUser = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        avatar: data.avatar || null,
        phone: data.phone || null,
        isActive: data.is_active,
        lastLogin: data.last_login ? new Date(data.last_login) : null,
        companyId: data.company_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      return userData;
    } catch (error) {
      console.error('🔐 [Auth] Erro inesperado ao buscar perfil:', error);
      
      // Em caso de erro inesperado, criar um perfil básico para manter o usuário autenticado
      return {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Usuário',
        email: supabaseUser.email || '',
        role: 'AGENT',
        avatar: null,
        phone: null,
        isActive: true,
        lastLogin: null,
        companyId: 'c1036c09-e971-419b-9244-e9f6792954e2',
        createdAt: supabaseUser.created_at,
        updatedAt: supabaseUser.updated_at || supabaseUser.created_at
      };
    }
  }, []);

  /**
   * Atualiza dados da sessão e usuário
   */
  const updateSession = useCallback(async (session: Session | null) => {
    setSession(session);
    setSupabaseUser(session?.user || null);

    if (session?.user) {
      setIsLoading(true);
      try {
        const userProfile = await fetchUserProfile(session.user);
        setUser(userProfile);
      } catch (error) {
        console.error('🔐 [Auth] Erro ao atualizar sessão:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    } else {
      setUser(null);
    }
  }, [fetchUserProfile]);

  /**
   * Inicialização do contexto de autenticação
   */
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Buscar sessão atual
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔐 [Auth] Erro ao buscar sessão:', error);
        }

        if (mounted) {
          await updateSession(session);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('🔐 [Auth] Erro na inicialização:', error);
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 [Auth] Estado alterado:', event);
        
        if (mounted) {
          await updateSession(session);
          
          // Atualizar último login no banco
          if (event === 'SIGNED_IN' && session?.user) {
            try {
              await supabase
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', session.user.id);
            } catch (error) {
              console.error('🔐 [Auth] Erro ao atualizar último login:', error);
            }
          }
        }
      }
    );

    initializeAuth();

    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [updateSession]);

  /**
   * Realiza login com email e senha
   */
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('🔐 [Auth] Erro no login:', error);
        return { 
          success: false, 
          error: error.message === 'Invalid login credentials' 
            ? 'Email ou senha incorretos'
            : error.message 
        };
      }

      console.log('🔐 [Auth] Login realizado com sucesso');
      return { success: true };
      
    } catch (error) {
      console.error('🔐 [Auth] Erro inesperado no login:', error);
      return { 
        success: false, 
        error: 'Erro interno durante autenticação' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Realiza cadastro com email e senha (sem confirmação por email)
   */
  const signup = useCallback(async (
    email: string, 
    password: string, 
    userData?: Partial<ExtendedUser>
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      console.log('🔐 [Auth] Tentando cadastro para:', email);
      
      // Primeiro, tentar cadastro simples sem metadados extras
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('🔐 [Auth] Erro no cadastro:', error);
        
        // Traduzir mensagens de erro comuns
        let errorMessage = error.message;
        if (error.message.includes('Password should be')) {
          errorMessage = 'A senha deve ter pelo menos 6 caracteres';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Email inválido';
        } else if (error.message.includes('User already registered')) {
          errorMessage = 'Este email já está cadastrado';
        }
        
        return { 
          success: false, 
          error: errorMessage 
        };
      }

      console.log('🔐 [Auth] Resposta do cadastro:', {
        user: !!data.user,
        session: !!data.session,
        user_id: data.user?.id
      });

      // Se usuário foi criado mas não há sessão, fazer login automático
      if (data.user && !data.session) {
        console.log('🔐 [Auth] Usuário criado, tentando login automático...');
        const loginResult = await login(email, password);
        
        if (loginResult.success) {
          // Após login bem-sucedido, criar perfil na tabela users
          await createUserProfile(data.user.id, userData);
        }
        
        return loginResult;
      }

      // Se há sessão imediata, criar perfil do usuário
      if (data.user && data.session) {
        console.log('🔐 [Auth] Cadastro realizado com sucesso - Acesso imediato');
        await createUserProfile(data.user.id, userData);
        return { success: true };
      }

      console.log('🔐 [Auth] Cadastro realizado com sucesso');
      return { success: true };
      
    } catch (error) {
      console.error('🔐 [Auth] Erro inesperado no cadastro:', error);
      return { 
        success: false, 
        error: 'Erro interno durante cadastro. Tente novamente.' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  /**
   * Cria perfil do usuário na tabela users após cadastro
   */
  const createUserProfile = async (userId: string, userData?: Partial<ExtendedUser>) => {
    try {
      console.log('🔐 [Auth] Criando perfil do usuário no banco...');
      
      const { error } = await supabase
        .from('users')
        .upsert({
          id: userId,
          name: userData?.name || 'Usuário',
          email: userData?.email || '',
          role: userData?.role || 'AGENT',
          phone: userData?.phone || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('🔐 [Auth] Erro ao criar perfil:', error);
      } else {
        console.log('🔐 [Auth] Perfil criado com sucesso');
      }
    } catch (error) {
      console.error('🔐 [Auth] Erro inesperado ao criar perfil:', error);
    }
  };

  /**
   * Realiza logout
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('🔐 [Auth] Erro no logout:', error);
      } else {
        console.log('🔐 [Auth] Logout realizado com sucesso');
      }
    } catch (error) {
      console.error('🔐 [Auth] Erro inesperado no logout:', error);
    }
  }, []);



  /**
   * Envia email de recuperação de senha
   */
  const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        console.error('🔐 [Auth] Erro ao enviar email de recuperação:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }

      return { 
        success: true 
      };
      
    } catch (error) {
      console.error('🔐 [Auth] Erro inesperado na recuperação:', error);
      return { 
        success: false, 
        error: 'Erro interno na recuperação de senha' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Atualiza dados do usuário
   */
  const updateUser = useCallback(async (userData: Partial<ExtendedUser>): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseUser) {
      return { 
        success: false, 
        error: 'Usuário não autenticado' 
      };
    }

    setIsLoading(true);
    
    try {
      // Atualizar na tabela users
      const { error } = await supabase
        .from('users')
        .update({
          name: userData.name,
          phone: userData.phone,
          avatar: userData.avatar,
          updated_at: new Date().toISOString()
        })
        .eq('id', supabaseUser.id);

      if (error) {
        console.error('🔐 [Auth] Erro ao atualizar usuário:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }

      // Buscar dados atualizados do usuário
      const userProfile = await fetchUserProfile(supabaseUser);
      setUser(userProfile);
      
      console.log('🔐 [Auth] Usuário atualizado com sucesso');
      return { success: true };
      
    } catch (error) {
      console.error('🔐 [Auth] Erro inesperado ao atualizar usuário:', error);
      return { 
        success: false, 
        error: 'Erro interno ao atualizar usuário' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [supabaseUser, fetchUserProfile]);

  /**
   * Atualiza dados do usuário atual
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    if (!supabaseUser) return;
    
    setIsLoading(true);
    
    try {
      const userProfile = await fetchUserProfile(supabaseUser);
      setUser(userProfile);
      console.log('🔐 [Auth] Dados do usuário atualizados');
    } catch (error) {
      console.error('🔐 [Auth] Erro ao atualizar usuário:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabaseUser, fetchUserProfile]);

  /**
   * Função de compatibilidade com mock (não implementada)
   */
  const switchUser = useCallback((userId: string): void => {
    console.warn('🔐 [Auth] switchUser não implementado no contexto real');
  }, []);

  // Valor do contexto
  const contextValue: AuthContextType = {
    isAuthenticated: !!session && !!user,
    user,
    session,
    supabaseUser,
    isLoading,
    isInitialized,
    login,
    signup,
    logout,
    resetPassword,
    updateUser,
    refreshUser,
    switchUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// -----------------------------------------------------------
// Hook para usar o contexto de autenticação real
// -----------------------------------------------------------

/**
 * Hook para acessar o contexto de autenticação real
 * @throws {Error} Se usado fora do AuthProvider
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
// Validação e utilitários (mantidos iguais ao mock)
// -----------------------------------------------------------

/**
 * Valida se um usuário possui uma role específica
 * @param user Usuário a validar
 * @param requiredRole Role necessária
 */
export const hasRole = (user: ExtendedUser | null, requiredRole: string): boolean => {
  if (!user) return false;
  
  try {
    const validRole = UserRoleSchema.parse(requiredRole);
    return user.role === validRole;
  } catch {
    return false;
  }
};

/**
 * Verifica se o usuário tem permissão de administrador
 * @param user Usuário a verificar
 */
export const isAdmin = (user: ExtendedUser | null): boolean => {
  return hasRole(user, 'ADMIN') || hasRole(user, 'CREATOR');
};

/**
 * Verifica se o usuário é o criador do sistema
 * @param user Usuário a verificar
 */
export const isCreator = (user: ExtendedUser | null): boolean => {
  return hasRole(user, 'CREATOR');
};

// -----------------------------------------------------------
// Exportações
// -----------------------------------------------------------

export type { AuthContextType };

// Compatibilidade com nomenclatura do mock
export { AuthProvider as AuthProviderReal, useAuth as useAuthReal };
