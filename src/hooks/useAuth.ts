// -----------------------------------------------------------
// Hook de Autenticação Unificado
// Re-exporta o hook correto baseado na configuração
// -----------------------------------------------------------

// Re-exportar diretamente o hook do AuthContext real
// O AuthContext real já tem fallback para desenvolvimento
export { useAuth, useLogin, useSignup, usePasswordReset } from '../contexts/AuthContext';

// Manter exports do mock para casos específicos de desenvolvimento
export { useAuthMock, hasRole, isAdmin, isCreator } from '../contexts/AuthContextMock';

// -----------------------------------------------------------
// Tipos re-exportados para conveniência
// -----------------------------------------------------------

export type { AuthContextType } from '../contexts/AuthContext'; 