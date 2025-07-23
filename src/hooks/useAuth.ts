import { getAuthMode } from '../config/auth';

// Importar hooks específicos de cada contexto
import { useAuth as useAuthReal } from '../contexts/AuthContext';
import { useAuthMock } from '../contexts/AuthContextMock';

// -----------------------------------------------------------
// Hook de Autenticação Unificado
// Automaticamente usa o hook correto baseado no modo
// -----------------------------------------------------------

export const useAuth = () => {
  const authMode = getAuthMode();
  
  // Usar o hook apropriado baseado na configuração
  if (authMode === 'real') {
    return useAuthReal();
  } else {
    return useAuthMock();
  }
};

// -----------------------------------------------------------
// Re-exportar hooks específicos do contexto real
// -----------------------------------------------------------

export { useLogin, useSignup, usePasswordReset } from '../contexts/AuthContext';

// -----------------------------------------------------------
// Re-exportar hooks específicos do contexto mock
// -----------------------------------------------------------

export { useAuthMock, hasRole, isAdmin, isDevMaster, isImobiliariaAdmin, isAgent } from '../contexts/AuthContextMock';

// -----------------------------------------------------------
// Tipos re-exportados para conveniência
// -----------------------------------------------------------

export type { AuthContextType } from '../contexts/AuthContext'; 