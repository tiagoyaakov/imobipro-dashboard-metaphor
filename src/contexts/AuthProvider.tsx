import React, { ReactNode } from 'react';
import { AuthProvider as AuthProviderReal } from './AuthContext';
import { AuthProviderMock } from './AuthContextMock';

// -----------------------------------------------------------
// Provider Unificado de Autenticação
// Alterna entre AuthContext real e AuthContextMock
// -----------------------------------------------------------

interface UnifiedAuthProviderProps {
  children: ReactNode;
  /** Forçar uso do mock (útil para desenvolvimento/testes) */
  forceMock?: boolean;
}

/**
 * Provider unificado que alterna entre auth real e mock
 * baseado na configuração do ambiente
 */
export const UnifiedAuthProvider: React.FC<UnifiedAuthProviderProps> = ({ 
  children, 
  forceMock = false 
}) => {
  // Configuração para usar auth real ou mock
  const useRealAuth = import.meta.env.VITE_USE_REAL_AUTH === 'true';
  const isDevelopment = import.meta.env.DEV;
  
  // Em desenvolvimento, usar mock por padrão a menos que explicitamente configurado
  // Em produção, sempre usar auth real
  const shouldUseReal = !forceMock && (useRealAuth || !isDevelopment);

  if (shouldUseReal) {
    return (
      <AuthProviderReal>
        {children}
      </AuthProviderReal>
    );
  }

  return (
    <AuthProviderMock>
      {children}
    </AuthProviderMock>
  );
};

// -----------------------------------------------------------
// Exports para facilitar migração
// -----------------------------------------------------------

// Export padrão: Provider unificado
export default UnifiedAuthProvider;

// Exports específicos para casos que precisam de um ou outro
export { AuthProvider as AuthProviderReal } from './AuthContext';
export { AuthProviderMock } from './AuthContextMock'; 