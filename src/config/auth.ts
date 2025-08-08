// -----------------------------------------------------------
// Configuração de Autenticação
// -----------------------------------------------------------

/**
 * Configuração para controlar a migração do sistema de autenticação
 */
export const authConfig = {
  /**
   * Se true, usa autenticação real do Supabase
   * Se false, usa sistema mock para desenvolvimento
   * Em produção, SEMPRE usa auth real
   */
  useRealAuth: import.meta.env.PROD || // SEMPRE real em produção
               (import.meta.env.VITE_USE_REAL_AUTH === 'true' && 
                import.meta.env.VITE_SUPABASE_URL && 
                import.meta.env.VITE_SUPABASE_ANON_KEY),

  /**
   * Configurações do Supabase
   */
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    authRedirectUrl: import.meta.env.VITE_SUPABASE_AUTH_REDIRECT_URL,
  },

  /**
   * Configurações de sessão
   */
  session: {
    // Duração da sessão em segundos (24 horas)
    maxAge: 24 * 60 * 60,
    
    // Refresh automático quando restam menos que isso (1 hora)
    refreshThreshold: 60 * 60,
    
    // Persistir sessão no localStorage
    persistSession: true,
  },

  /**
   * Configurações de desenvolvimento
   */
  development: {
    // Usuário mock padrão para desenvolvimento
    defaultUser: {
      id: import.meta.env.VITE_DEV_USER_ID || crypto.randomUUID(),
      email: import.meta.env.VITE_DEV_USER_EMAIL || 'dev@imobipro.local',
      name: import.meta.env.VITE_DEV_USER_NAME || 'Desenvolvedor Local',
      role: 'AGENT' as const, // SEGURANÇA: Nunca DEV_MASTER por padrão
      is_active: true,
      company_id: import.meta.env.VITE_DEV_COMPANY_ID || crypto.randomUUID(),
      avatar_url: null,
      telefone: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    
    // Company ID padrão para desenvolvimento/fallback
    defaultCompanyId: import.meta.env.VITE_DEFAULT_COMPANY_ID || crypto.randomUUID(),
    
    // Se true, mostra logs detalhados de autenticação
    enableDebugLogs: import.meta.env.DEV,
    
    // Se true, permite bypass de autenticação com query param ?dev=true
    allowDevBypass: import.meta.env.DEV,
  },

  /**
   * Configurações de segurança
   */
  security: {
    // Tempo limite para operações de auth (30 segundos)
    operationTimeout: 30 * 1000,
    
    // Número máximo de tentativas de login
    maxLoginAttempts: 5,
    
    // Tempo de bloqueio após muitas tentativas (15 minutos)
    lockoutDuration: 15 * 60 * 1000,
    
    // Força logout se detectar múltiplas abas
    enforceSessionUniqueness: false,
  },

  /**
   * Configurações de UI
   */
  ui: {
    // Mostrar indicador de status de conexão
    showConnectionStatus: true,
    
    // Tempo de exibição de mensagens de sucesso (3 segundos)
    successMessageDuration: 3000,
    
    // Tempo de exibição de mensagens de erro (5 segundos)
    errorMessageDuration: 5000,
    
    // Tema padrão para páginas de auth
    defaultTheme: 'dark' as const,
  },

  /**
   * Features flags para rollout gradual
   */
  features: {
    // Habilitar recuperação de senha
    enablePasswordReset: true,
    
    // Habilitar registro de novos usuários
    enableSignup: true,
    
    // Habilitar login social (futuro)
    enableSocialLogin: false,
    
    // Habilitar 2FA (futuro)
    enableTwoFactor: false,
    
    // Habilitar notificações push de auth
    enableAuthNotifications: true,
  },

  /**
   * Configurações de cache e performance
   */
  performance: {
    // Cache de dados do usuário (5 minutos)
    userDataCacheTime: 5 * 60 * 1000,
    
    // Cache de permissões (10 minutos)
    permissionsCacheTime: 10 * 60 * 1000,
    
    // Preload de dados após login
    preloadUserData: true,
    
    // Lazy load de componentes de auth
    lazyLoadAuthComponents: true,
  }
};

// -----------------------------------------------------------
// Utilitários de Configuração
// -----------------------------------------------------------

/**
 * Verificar se todas as variáveis de ambiente necessárias estão configuradas
 */
export const validateAuthConfig = (): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validações críticas
  if (authConfig.useRealAuth) {
    if (!authConfig.supabase.url) {
      errors.push('VITE_SUPABASE_URL não está configurada');
    } else {
      // Validar formato da URL
      try {
        const url = new URL(authConfig.supabase.url);
        if (url.protocol !== 'https:') {
          errors.push('VITE_SUPABASE_URL deve usar HTTPS');
        }
        if (!url.hostname.includes('supabase.co')) {
          warnings.push('URL do Supabase pode não ser válida');
        }
      } catch {
        errors.push('VITE_SUPABASE_URL tem formato inválido');
      }
    }
    
    if (!authConfig.supabase.anonKey) {
      errors.push('VITE_SUPABASE_ANON_KEY não está configurada');
    } else {
      // Validar formato JWT básico
      const parts = authConfig.supabase.anonKey.split('.');
      if (parts.length !== 3) {
        errors.push('VITE_SUPABASE_ANON_KEY não parece ser um JWT válido');
      }
    }
    
    if (!authConfig.supabase.authRedirectUrl) {
      warnings.push('VITE_SUPABASE_AUTH_REDIRECT_URL não configurada');
    }
  }

  // Validações de segurança
  if (import.meta.env.PROD) {
    if (import.meta.env.VITE_DEBUG_AUTH === 'true') {
      warnings.push('Debug de autenticação ativo em produção');
    }
    
    if (!authConfig.useRealAuth) {
      errors.push('Autenticação mock não pode ser usada em produção');
    }
  }

  // Validar variáveis sensíveis não expostas no frontend
  if (typeof window !== 'undefined') {
    // Verificar se variáveis privadas não vazaram
    const sensitiveVars = ['SUPABASE_SERVICE_ROLE_KEY', 'DATABASE_URL'];
    sensitiveVars.forEach(varName => {
      if ((import.meta.env as any)[varName]) {
        errors.push(`Variável sensível ${varName} exposta no frontend`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Obter configuração baseada no ambiente
 */
export const getAuthMode = (): 'real' | 'mock' => {
  return authConfig.useRealAuth ? 'real' : 'mock';
};

/**
 * Verificar se feature está habilitada
 */
export const isFeatureEnabled = (feature: keyof typeof authConfig.features): boolean => {
  return authConfig.features[feature];
};

/**
 * Obter configurações de desenvolvimento
 */
export const getDevConfig = () => {
  return import.meta.env.DEV ? authConfig.development : null;
};

/**
 * Log de debug (apenas em desenvolvimento)
 */
export const debugLog = (message: string, ...args: unknown[]) => {
  if (authConfig.development.enableDebugLogs) {
    console.log(`[AUTH DEBUG] ${message}`, ...args);
  }
};

// -----------------------------------------------------------
// Constantes de Autenticação
// -----------------------------------------------------------

export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  UNAUTHORIZED: '/unauthorized',
} as const;

export const PROTECTED_ROUTES = {
  DASHBOARD: '/',
  PROPERTIES: '/propriedades',
  CLIENTS: '/clientes',
  CRM: '/crm',
  REPORTS: '/relatorios',
  CONNECTIONS: '/conexoes',
  USERS: '/usuarios',
  CHATS: '/chats',
  TENANT_LAW: '/lei-inquilino',
  SETTINGS: '/configuracoes',
} as const;

export const ROLE_PERMISSIONS = {
  DEV_MASTER: ['all'],
  ADMIN: ['manage_users', 'view_reports', 'manage_crm', 'manage_settings'],
  AGENT: ['manage_properties', 'use_chat'],
} as const;

export default authConfig; 