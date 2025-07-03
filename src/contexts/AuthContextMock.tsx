import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { User, UserRoleSchema } from '../schemas/crm';
import usersData from '../mocks/users.json';

// -----------------------------------------------------------
// Tipos do contexto de autenticação
// -----------------------------------------------------------

interface AuthContextType {
  /** Indica se o usuário está autenticado */
  isAuthenticated: boolean;
  /** Dados do usuário logado, null se não autenticado */
  user: User | null;
  /** Indica se a autenticação está carregando */
  isLoading: boolean;
  /** Realiza login simulado */
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  /** Realiza logout simulado */
  logout: () => void;
  /** Alterna entre usuários mockados para teste */
  switchUser: (userId: string) => void;
  /** Recuperar dados do usuário atual */
  refreshUser: () => Promise<void>;
}

// -----------------------------------------------------------
// Contexto de autenticação
// -----------------------------------------------------------

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// -----------------------------------------------------------
// Provider de autenticação mockado
// -----------------------------------------------------------

interface AuthProviderMockProps {
  children: ReactNode;
  /** ID do usuário padrão para login automático */
  defaultUserId?: string;
}

export const AuthProviderMock: React.FC<AuthProviderMockProps> = ({ 
  children, 
  defaultUserId = 'mock-agent-uuid-123' 
}) => {
  // Estado do usuário atual
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Buscar usuário padrão nos dados mockados
    const defaultUser = usersData.find(user => user.id === defaultUserId);
    return defaultUser as User || null;
  });

  // Estado de loading simulado
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Simula processo de login
   * @param email Email do usuário
   * @param password Senha do usuário (não validada no mock)
   */
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Buscar usuário por email nos dados mockados
      const user = usersData.find(u => u.email === email);
      
      if (!user) {
        return { 
          success: false, 
          error: 'Usuário não encontrado. Use um email dos dados mockados.' 
        };
      }

      // Validar se usuário está ativo
      if (!user.isActive) {
        return { 
          success: false, 
          error: 'Usuário inativo. Entre em contato com o administrador.' 
        };
      }

      // Simular login bem-sucedido
      setCurrentUser(user as User);
      
      // Log para desenvolvimento
      console.log('🔐 [AuthMock] Login simulado realizado:', user.name);

      return { success: true };
      
    } catch (error) {
      console.error('🔐 [AuthMock] Erro no login simulado:', error);
      return { 
        success: false, 
        error: 'Erro interno durante autenticação' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Simula processo de logout
   */
  const logout = useCallback((): void => {
    setCurrentUser(null);
    
    // Log para desenvolvimento
    console.log('🔐 [AuthMock] Logout simulado realizado');
  }, []);

  /**
   * Alterna entre usuários mockados para facilitar testes
   * @param userId ID do usuário para alternar
   */
  const switchUser = useCallback((userId: string): void => {
    const user = usersData.find(u => u.id === userId);
    
    if (user && user.isActive) {
      setCurrentUser(user as User);
      
      // Log para desenvolvimento
      console.log('🔐 [AuthMock] Usuário alterado:', user.name);
    } else {
      console.warn('🔐 [AuthMock] Usuário não encontrado ou inativo:', userId);
    }
  }, []);

  /**
   * Simula atualização dos dados do usuário
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    if (!currentUser) return;
    
    setIsLoading(true);
    
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Buscar dados atualizados do usuário
      const updatedUser = usersData.find(u => u.id === currentUser.id);
      
      if (updatedUser) {
        setCurrentUser(updatedUser as User);
        console.log('🔐 [AuthMock] Dados do usuário atualizados');
      }
      
    } catch (error) {
      console.error('🔐 [AuthMock] Erro ao atualizar usuário:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Valor do contexto
  const contextValue: AuthContextType = {
    isAuthenticated: currentUser !== null,
    user: currentUser,
    isLoading,
    login,
    logout,
    switchUser,
    refreshUser
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
 * Hook para acessar o contexto de autenticação mockado
 * @throws {Error} Se usado fora do AuthProviderMock
 */
export const useAuthMock = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error(
      'useAuthMock deve ser usado dentro de um AuthProviderMock. ' +
      'Certifique-se de envolver seu componente com <AuthProviderMock>.'
    );
  }
  
  return context;
};

// -----------------------------------------------------------
// Componente auxiliar para debugging
// -----------------------------------------------------------

/**
 * Componente para facilitar mudança de usuário durante desenvolvimento
 */
export const AuthDebugPanel: React.FC = () => {
  const { user, switchUser, logout, isAuthenticated } = useAuthMock();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50 max-w-xs">
      <div className="text-xs font-semibold mb-2">🔐 Auth Debug Panel</div>
      
      <div className="text-xs mb-3">
        <strong>Usuário:</strong> {user?.name}<br />
        <strong>Role:</strong> {user?.role}<br />
        <strong>Email:</strong> {user?.email}
      </div>
      
      <div className="space-y-2">
        <div className="text-xs font-semibold">Alternar Usuário:</div>
        
        {usersData.map((mockUser) => (
          <button
            key={mockUser.id}
            onClick={() => switchUser(mockUser.id)}
            disabled={mockUser.id === user?.id}
            className={`w-full text-xs px-2 py-1 rounded ${
              mockUser.id === user?.id
                ? 'bg-blue-600 cursor-not-allowed'
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
          >
            {mockUser.name} ({mockUser.role})
          </button>
        ))}
        
        <button
          onClick={logout}
          className="w-full text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded mt-2"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

// -----------------------------------------------------------
// Validação e utilitários
// -----------------------------------------------------------

/**
 * Valida se um usuário possui uma role específica
 * @param user Usuário a validar
 * @param requiredRole Role necessária
 */
export const hasRole = (user: User | null, requiredRole: string): boolean => {
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
export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, 'ADMIN') || hasRole(user, 'CREATOR');
};

/**
 * Verifica se o usuário é o criador do sistema
 * @param user Usuário a verificar
 */
export const isCreator = (user: User | null): boolean => {
  return hasRole(user, 'CREATOR');
};

// -----------------------------------------------------------
// Exportações para facilitar migração futura
// -----------------------------------------------------------

// Quando o AuthContext real for implementado, apenas altere as importações:
// export { AuthProvider as AuthProviderReal, useAuth as useAuthReal } from './AuthContext';
// 
// E troque AuthProviderMock por AuthProviderReal e useAuthMock por useAuthReal

export type { AuthContextType }; 