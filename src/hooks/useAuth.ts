import { getAuthMode } from '../config/auth';

// Importar hooks específicos de cada contexto
import { useAuth as useAuthReal } from '../contexts/AuthContext';
import { useAuthMock } from '../contexts/AuthContextMock';

// -----------------------------------------------------------
// Hook de Autenticação Unificado
// Automaticamente usa o hook correto baseado no modo
// -----------------------------------------------------------

export const useAuth = () => {
  // FORÇAR USO DE MOCK TEMPORARIAMENTE
  console.log('🔐 [useAuth] Forçando uso de authMode = mock (temporário)');
  return useAuthMock();
  
  // const authMode = getAuthMode();
  // 
  // // Usar o hook apropriado baseado na configuração
  // if (authMode === 'real') {
  //   return useAuthReal();
  // } else {
  //   return useAuthMock();
  // }
};

// -----------------------------------------------------------
// Re-exportar hooks específicos do contexto (agora mockados)
// -----------------------------------------------------------

// TEMPORÁRIO: Implementar hooks mock para login
import { useState, useCallback } from 'react';
import { useAuthMock } from '../contexts/AuthContextMock';

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login: mockLogin } = useAuthMock();

  const login = useCallback(async (data: { email: string; password: string }) => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Usar o login mock
      const result = await mockLogin(data.email, data.password);
      
      setIsLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  }, [mockLogin]);

  return {
    login,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};

export const useSignup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signup = useCallback(async (email: string, password: string, metadata?: Record<string, any>) => {
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('[MOCK] Signup simulado:', { email, metadata });
      return { success: true };
    } catch (err) {
      const errorMessage = 'Erro simulado no registro';
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

export const usePasswordReset = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('[MOCK] Reset de senha simulado para:', email);
      return { success: true };
    } catch (err) {
      const errorMessage = 'Erro simulado no reset de senha';
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

// export { useLogin, useSignup, usePasswordReset } from '../contexts/AuthContext';

// -----------------------------------------------------------
// Re-exportar hooks específicos do contexto mock
// -----------------------------------------------------------

export { useAuthMock, hasRole, isAdmin, isDevMaster, isImobiliariaAdmin, isAgent } from '../contexts/AuthContextMock';

// -----------------------------------------------------------
// Tipos re-exportados para conveniência
// -----------------------------------------------------------

export type { AuthContextType } from '../contexts/AuthContext'; 