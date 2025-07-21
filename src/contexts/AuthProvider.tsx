import React, { ReactNode } from 'react';
import { AuthProvider as AuthProviderReal } from './AuthContext';
import { AuthProviderMock } from './AuthContextMock';
import { authConfig, getAuthMode, validateAuthConfig, debugLog } from '@/config/auth';

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
 * baseado na configuração centralizada
 */
export const UnifiedAuthProvider: React.FC<UnifiedAuthProviderProps> = ({ 
  children, 
  forceMock = false 
}) => {
  // Validar configuração na inicialização
  React.useEffect(() => {
    const validation = validateAuthConfig();
    if (!validation.isValid) {
      console.error('[AUTH] Configuração inválida:', validation.errors);
    }
    
    debugLog('UnifiedAuthProvider inicializado', {
      mode: getAuthMode(),
      forceMock,
      environment: import.meta.env.MODE,
      supabaseConfigured: !!authConfig.supabase.url
    });
  }, [forceMock]);

  // Determinar qual provider usar baseado na configuração
  const authMode = getAuthMode();
  const shouldUseReal = !forceMock && authMode === 'real';

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