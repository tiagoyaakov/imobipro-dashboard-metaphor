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
  // SEGURANÇA: Bloquear mock em produção
  if (import.meta.env.PROD && (forceMock || getAuthMode() === 'mock')) {
    throw new Error(
      'ERRO DE SEGURANÇA: Tentativa de usar autenticação mock em produção. '
      + 'Verifique as variáveis VITE_USE_REAL_AUTH, VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
    );
  }

  // Validar configuração na inicialização
  React.useEffect(() => {
    const validation = validateAuthConfig();
    if (!validation.isValid) {
      console.error('[AUTH] Configuração inválida:', validation.errors);
      
      // Em produção, falhar completamente se configuração inválida
      if (import.meta.env.PROD) {
        throw new Error(`Configuração de autenticação inválida: ${validation.errors.join(', ')}`);
      }
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

  // SEGURANÇA: Em produção, sempre usar auth real
  if (import.meta.env.PROD || shouldUseReal) {
    return (
      <AuthProviderReal>
        {children}
      </AuthProviderReal>
    );
  }

  // DESENVOLVIMENTO: Permitir mock apenas em dev com aviso explícito
  if (import.meta.env.DEV) {
    console.warn(
      '⚠️ [SEGURANÇA] Usando autenticação MOCK em desenvolvimento. '
      + 'Nunca deve aparecer em produção!'
    );
    
    return (
      <AuthProviderMock>
        {children}
      </AuthProviderMock>
    );
  }

  // Fallback seguro: sempre auth real
  return (
    <AuthProviderReal>
      {children}
    </AuthProviderReal>
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