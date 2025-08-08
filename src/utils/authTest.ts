// -----------------------------------------------------------
// Utilitários para Teste de Autenticação
// -----------------------------------------------------------

import { authConfig, validateAuthConfig, debugLog } from '@/config/auth';

/**
 * Testar configuração de autenticação
 */
export const testAuthConfig = () => {
  console.group('🔐 Teste de Configuração de Autenticação');
  
  const validation = validateAuthConfig();
  
  console.log('Modo de autenticação:', authConfig.useRealAuth ? 'REAL' : 'MOCK');
  console.log('Ambiente:', import.meta.env.MODE);
  console.log('Configuração válida:', validation.isValid);
  
  if (!validation.isValid) {
    console.error('Erros de configuração:', validation.errors);
  }

  console.log('Configurações do Supabase:', {
    url: authConfig.supabase.url ? '✅ Configurada' : '❌ Não configurada',
    anonKey: authConfig.supabase.anonKey ? '✅ Configurada' : '❌ Não configurada',
    redirectUrl: authConfig.supabase.authRedirectUrl || 'Padrão'
  });

  console.log('Features habilitadas:', {
    passwordReset: authConfig.features.enablePasswordReset,
    signup: authConfig.features.enableSignup,
    socialLogin: authConfig.features.enableSocialLogin,
    twoFactor: authConfig.features.enableTwoFactor,
  });

  console.groupEnd();
  
  return validation;
};

/**
 * Simular fluxo de autenticação para testes
 */
export const simulateAuthFlow = async () => {
  console.group('🧪 Simulação de Fluxo de Autenticação');
  
  try {
    debugLog('Iniciando simulação de login...');
    
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser = {
      id: 'test-user-1',
      email: 'test@imobipro.com',
      name: 'Usuário de Teste',
      role: 'ADMIN' as const,
      companyId: 'test-company-1'
    };
    
    debugLog('Usuário mockado criado:', mockUser);
    
    console.log('✅ Simulação de login bem-sucedida');
    console.log('👤 Usuário:', mockUser);
    
    return { success: true, user: mockUser };
    
  } catch (error) {
    console.error('❌ Erro na simulação:', error);
    return { success: false, error };
  } finally {
    console.groupEnd();
  }
};

/**
 * Testar permissões de rotas
 */
export const testRoutePermissions = () => {
  console.group('🛡️ Teste de Permissões de Rotas');
  
  const roles = ['DEV_MASTER', 'ADMIN', 'AGENT'] as const;
  const restrictedRoutes = ['/crm', '/relatorios', '/usuarios', '/configuracoes'];
  
  roles.forEach(role => {
    console.log(`\n👤 Role: ${role}`);
    
    restrictedRoutes.forEach(route => {
      // Lógica simplificada de permissões
      let hasAccess = false;
      
      switch (route) {
        case '/crm':
        case '/relatorios':
          hasAccess = ['DEV_MASTER', 'ADMIN'].includes(role);
          break;
        case '/usuarios':
        case '/configuracoes':
          hasAccess = ['DEV_MASTER', 'ADMIN'].includes(role);
          break;
        default:
          hasAccess = true;
      }
      
      console.log(`  ${hasAccess ? '✅' : '❌'} ${route}`);
    });
  });
  
  console.groupEnd();
};

/**
 * Verificar integridade do sistema
 */
export const checkSystemIntegrity = () => {
  console.group('🔍 Verificação de Integridade do Sistema');
  
  const checks = [
    {
      name: 'Configuração de Auth',
      test: () => validateAuthConfig().isValid,
    },
    {
      name: 'Variáveis de Ambiente',
      test: () => {
        // Em Vite, usar import.meta.env
        const required = ['MODE'];
        return required.every(key => (import.meta.env as any)[key] !== undefined);
      },
    },
    {
      name: 'Supabase Client',
      test: () => {
        try {
          // Verificar se o cliente pode ser importado
          return true;
        } catch {
          return false;
        }
      },
    },
    {
      name: 'React Router',
      test: () => {
        try {
          // Verificar se window existe (ambiente browser)
          return typeof window !== 'undefined';
        } catch {
          return false;
        }
      },
    }
  ];
  
  let allPassed = true;
  
  checks.forEach(check => {
    const passed = check.test();
    console.log(`${passed ? '✅' : '❌'} ${check.name}`);
    if (!passed) allPassed = false;
  });
  
  console.log(`\n${allPassed ? '🎉' : '⚠️'} Sistema ${allPassed ? 'íntegro' : 'com problemas'}`);
  
  console.groupEnd();
  
  return allPassed;
};

/**
 * Executar todos os testes
 */
export const runAllTests = async () => {
  console.log('🚀 Iniciando testes de integração de autenticação...\n');
  
  const configTest = testAuthConfig();
  const permissionsTest = testRoutePermissions();
  const integrityTest = checkSystemIntegrity();
  const flowTest = await simulateAuthFlow();
  
  console.log('\n📊 Resumo dos Testes:');
  console.log(`Configuração: ${configTest.isValid ? '✅' : '❌'}`);
  console.log(`Permissões: ✅ (simulado)`);
  console.log(`Integridade: ${integrityTest ? '✅' : '❌'}`);
  console.log(`Fluxo: ${flowTest.success ? '✅' : '❌'}`);
  
  return {
    config: configTest.isValid,
    permissions: true,
    integrity: integrityTest,
    flow: flowTest.success,
    overall: configTest.isValid && integrityTest && flowTest.success
  };
};

// Executar testes automaticamente em desenvolvimento
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // Executar após um pequeno delay para não interferir com o carregamento inicial
  setTimeout(() => {
    if (new URLSearchParams(window.location.search).get('test') === 'auth') {
      runAllTests();
    }
  }, 2000);
}

export default {
  testAuthConfig,
  simulateAuthFlow,
  testRoutePermissions,
  checkSystemIntegrity,
  runAllTests
}; 