// -----------------------------------------------------------
// Validador de Segurança para Build e Runtime
// -----------------------------------------------------------

import React from 'react';

/**
 * Validações críticas de segurança que devem ser executadas
 * antes do build e durante a inicialização da aplicação
 */

export interface SecurityValidationResult {
  isValid: boolean;
  criticalErrors: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Executa todas as validações de segurança
 */
export const validateSecurity = (): SecurityValidationResult => {
  const result: SecurityValidationResult = {
    isValid: true,
    criticalErrors: [],
    warnings: [],
    recommendations: []
  };

  // 1. Validar configuração de autenticação
  validateAuthSecurity(result);

  // 2. Validar variáveis de ambiente
  validateEnvironmentSecurity(result);

  // 3. Validar exposição de dados sensíveis
  validateDataExposure(result);

  // 4. Validar configuração de produção
  validateProductionSecurity(result);

  // 5. Validar roles e permissões
  validateRolesSecurity(result);

  // Determinar se é válido (sem erros críticos)
  result.isValid = result.criticalErrors.length === 0;

  return result;
};

/**
 * Validar segurança da autenticação
 */
function validateAuthSecurity(result: SecurityValidationResult): void {
  const isProd = import.meta.env.PROD;
  const useRealAuth = import.meta.env.VITE_USE_REAL_AUTH === 'true';
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // CRÍTICO: Não permitir mock em produção
  if (isProd && !useRealAuth) {
    result.criticalErrors.push(
      'CRÍTICO: Autenticação mock está ativa em produção. ' +
      'Configure VITE_USE_REAL_AUTH=true'
    );
  }

  // CRÍTICO: Credenciais obrigatórias em produção
  if (isProd && useRealAuth) {
    if (!supabaseUrl) {
      result.criticalErrors.push('CRÍTICO: VITE_SUPABASE_URL não configurada em produção');
    }
    if (!supabaseKey) {
      result.criticalErrors.push('CRÍTICO: VITE_SUPABASE_ANON_KEY não configurada em produção');
    }
  }

  // Validar formato das credenciais
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    result.criticalErrors.push('CRÍTICO: VITE_SUPABASE_URL deve usar HTTPS');
  }

  if (supabaseKey && supabaseKey.split('.').length !== 3) {
    result.criticalErrors.push('CRÍTICO: VITE_SUPABASE_ANON_KEY não é um JWT válido');
  }

  // Debug em produção
  if (isProd && import.meta.env.VITE_DEBUG_AUTH === 'true') {
    result.warnings.push('⚠️  Debug de autenticação ativo em produção');
  }
}

/**
 * Validar segurança das variáveis de ambiente
 */
function validateEnvironmentSecurity(result: SecurityValidationResult): void {
  const isProd = import.meta.env.PROD;

  // Verificar se variáveis sensíveis não estão expostas no frontend
  const sensitiveVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'VITE_GOOGLE_CLIENT_SECRET'
  ];

  sensitiveVars.forEach(varName => {
    if ((import.meta.env as any)[varName]) {
      result.criticalErrors.push(
        `CRÍTICO: Variável sensível ${varName} exposta no frontend`
      );
    }
  });

  // Verificar URLs com credenciais hardcoded
  const databaseUrl = import.meta.env.DATABASE_URL;
  if (databaseUrl && databaseUrl.includes('password') && isProd) {
    result.warnings.push('⚠️  DATABASE_URL contém credenciais em texto plano');
  }

  // Verificar IDs hardcoded
  const hardcodedIds = [
    'mock-user-id',
    'mock-company-id',
    'eeceyvenrnyyqvilezgr' // ID específico do projeto
  ];

  const envString = JSON.stringify(import.meta.env);
  hardcodedIds.forEach(id => {
    if (envString.includes(id) && isProd) {
      result.warnings.push(`⚠️  ID hardcoded encontrado: ${id}`);
    }
  });
}

/**
 * Validar exposição de dados sensíveis
 */
function validateDataExposure(result: SecurityValidationResult): void {
  // Verificar se dados mock podem vazar
  if (typeof window !== 'undefined') {
    // Verificar localStorage com dados sensíveis
    try {
      const localStorage = window.localStorage;
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.includes('mock') || key.includes('test') || key.includes('dev')) {
          if (import.meta.env.PROD) {
            result.warnings.push(`⚠️  Dados de desenvolvimento em localStorage: ${key}`);
          }
        }
      });
    } catch (e) {
      // Ignorar erros de acesso ao localStorage
    }

    // Verificar se AuthContextMock está disponível globalmente
    if ((window as any).AuthContextMock || (window as any).__AUTH_MOCK__) {
      result.criticalErrors.push('CRÍTICO: AuthContextMock exposto globalmente');
    }
  }
}

/**
 * Validar configuração específica de produção
 */
function validateProductionSecurity(result: SecurityValidationResult): void {
  const isProd = import.meta.env.PROD;

  if (isProd) {
    // Verificar se todas as configurações necessárias estão definidas
    const requiredProdVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];

    requiredProdVars.forEach(varName => {
      if (!import.meta.env[varName]) {
        result.criticalErrors.push(`CRÍTICO: ${varName} obrigatória em produção`);
      }
    });

    // Verificar configurações inseguras
    if (import.meta.env.MODE === 'development') {
      result.criticalErrors.push('CRÍTICO: Modo development ativo em build de produção');
    }

    // Verificar HTTPS
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      result.warnings.push('⚠️  Aplicação não está sendo servida via HTTPS');
    }
  }

  // Recomendações gerais
  result.recommendations.push('✅ Configure Content Security Policy headers');
  result.recommendations.push('✅ Implemente rate limiting nas APIs');
  result.recommendations.push('✅ Configure monitoramento de segurança');
}

/**
 * Validar roles e hierarquia de permissões
 */
function validateRolesSecurity(result: SecurityValidationResult): void {
  // Verificar se roles deprecados não estão sendo usados
  const deprecatedRoles = ['PROPRIETARIO', 'CREATOR'];
  
  // Esta verificação seria feita em runtime com dados reais
  // Por enquanto, apenas avisar sobre a existência de roles deprecados
  result.recommendations.push('✅ Remover todas as referências aos roles: ' + deprecatedRoles.join(', '));
  
  // Verificar configurações padrão perigosas
  const defaultUserRole = import.meta.env.VITE_DEFAULT_USER_ROLE;
  if (defaultUserRole === 'DEV_MASTER' || defaultUserRole === 'ADMIN') {
    result.criticalErrors.push(
      `CRÍTICO: Role padrão perigoso configurado: ${defaultUserRole}`
    );
  }
}

/**
 * Executar validações apenas críticas (para build)
 */
export const validateCriticalSecurity = (): boolean => {
  const result = validateSecurity();
  
  if (!result.isValid) {
    console.error('🔒 FALHAS CRÍTICAS DE SEGURANÇA DETECTADAS:');
    result.criticalErrors.forEach(error => console.error(`❌ ${error}`));
    
    if (import.meta.env.PROD) {
      throw new Error(
        'Build cancelado devido a falhas críticas de segurança. ' +
        'Corrija os problemas listados acima antes de continuar.'
      );
    }
  }

  if (result.warnings.length > 0) {
    console.warn('🔒 AVISOS DE SEGURANÇA:');
    result.warnings.forEach(warning => console.warn(warning));
  }

  if (result.recommendations.length > 0) {
    console.info('🔒 RECOMENDAÇÕES DE SEGURANÇA:');
    result.recommendations.forEach(rec => console.info(rec));
  }

  return result.isValid;
};

/**
 * Hook para validação contínua durante desenvolvimento
 */
export const useSecurityValidator = () => {
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      const result = validateSecurity();
      
      if (!result.isValid || result.warnings.length > 0) {
        console.group('🔒 RELATÓRIO DE SEGURANÇA');
        
        if (result.criticalErrors.length > 0) {
          console.error('Erros críticos:');
          result.criticalErrors.forEach(error => console.error(`❌ ${error}`));
        }
        
        if (result.warnings.length > 0) {
          console.warn('Avisos:');
          result.warnings.forEach(warning => console.warn(warning));
        }
        
        if (result.recommendations.length > 0) {
          console.info('Recomendações:');
          result.recommendations.forEach(rec => console.info(rec));
        }
        
        console.groupEnd();
      }
    }
  }, []);

  return validateCriticalSecurity();
};

// Executar validação na inicialização (apenas em produção)
if (import.meta.env.PROD) {
  validateCriticalSecurity();
}

export default {
  validateSecurity,
  validateCriticalSecurity,
  useSecurityValidator
};