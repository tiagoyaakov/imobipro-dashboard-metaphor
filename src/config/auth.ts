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
      id: 'mock-user-id',
      email: 'dev@imobipro.com',
      name: 'Desenvolvedor',
      role: 'DEV_MASTER' as const,
      is_active: true,
      company_id: 'mock-company-id',
      avatar_url: null,
      telefone: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    
    // Se true, mostra logs detalhados de autenticação
    enableDebugLogs: process.env.NODE_ENV === 'development',
    
    // Se true, permite bypass de autenticação com query param ?dev=true
    allowDevBypass: process.env.NODE_ENV === 'development',
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
export const validateAuthConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (authConfig.useRealAuth) {
    if (!authConfig.supabase.url) {
      errors.push('VITE_SUPABASE_URL não está configurada');
    }
    
    if (!authConfig.supabase.anonKey) {
      errors.push('VITE_SUPABASE_ANON_KEY não está configurada');
    }
    
    if (authConfig.supabase.url && !authConfig.supabase.url.startsWith('https://')) {
      errors.push('VITE_SUPABASE_URL deve usar HTTPS');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
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
  return process.env.NODE_ENV === 'development' ? authConfig.development : null;
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
  CONTACTS: '/contatos',
  SCHEDULE: '/agenda',
  CLIENTS: '/clientes',
  PIPELINE: '/pipeline',
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
  AGENT: ['manage_properties', 'manage_contacts', 'view_pipeline', 'use_chat'],
} as const;

export default authConfig; 