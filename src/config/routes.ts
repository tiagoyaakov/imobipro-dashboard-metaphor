// -----------------------------------------------------------
// Configuração de Rotas e Permissões
// -----------------------------------------------------------

export type UserRole = 'DEV_MASTER' | 'ADMIN' | 'AGENT';

export interface RouteConfig {
  /** Caminho da rota */
  path: string;
  /** Nome da rota para navegação */
  name: string;
  /** Título para exibição */
  title: string;
  /** Descrição da funcionalidade */
  description?: string;
  /** Roles permitidas (se não especificado, todos usuários autenticados podem acessar) */
  allowedRoles?: UserRole[];
  /** Se true, rota é visível no menu lateral */
  showInSidebar?: boolean;
  /** Ícone para o menu (nome do ícone do Lucide) */
  icon?: string;
  /** Categoria para agrupamento no menu */
  category?: string;
  /** Se true, rota requer configuração adicional */
  requiresSetup?: boolean;
  /** Feature flag necessária */
  requiredFeature?: string;
}

// -----------------------------------------------------------
// Configuração das Rotas da Aplicação
// -----------------------------------------------------------

export const routeConfigs: RouteConfig[] = [
  // Dashboard Principal (antigo CRM Avançado)
  {
    path: '/',
    name: 'dashboard',
    title: 'Dashboard',
    description: 'Sistema completo de gestão de relacionamento com clientes',
    allowedRoles: ['ADMIN', 'DEV_MASTER'],
    showInSidebar: true,
    icon: 'Brain',
    category: 'main',
    requiredFeature: 'crm-automation'
  },

  // Gestão de Propriedades
  {
    path: '/propriedades',
    name: 'properties',
    title: 'Propriedades',
    description: 'Gestão de imóveis',
    showInSidebar: true,
    icon: 'Building2',
    category: 'management'
  },

  // Gestão de Contatos
  {
    path: '/contatos',
    name: 'contacts',
    title: 'Contatos',
    description: 'Gestão de contatos e leads',
    showInSidebar: true,
    icon: 'Users',
    category: 'management'
  },


  // Clientes
  {
    path: '/clientes',
    name: 'clients',
    title: 'Clientes',
    description: 'Base de clientes',
    showInSidebar: true,
    icon: 'UserCheck',
    category: 'management'
  },

  // Pipeline de Vendas
  {
    path: '/pipeline',
    name: 'pipeline',
    title: 'Pipeline',
    description: 'Funil de vendas',
    showInSidebar: true,
    icon: 'TrendingUp',
    category: 'sales'
  },


  // Relatórios - Apenas Admin e DEV_MASTER
  {
    path: '/relatorios',
    name: 'reports',
    title: 'Relatórios',
    description: 'Análises e relatórios',
    allowedRoles: ['ADMIN', 'DEV_MASTER'],
    showInSidebar: true,
    icon: 'BarChart3',
    category: 'analytics',
    requiredFeature: 'reports-advanced'
  },

  // Conexões
  {
    path: '/conexoes',
    name: 'connections',
    title: 'Conexões',
    description: 'Integrações e conexões',
    showInSidebar: true,
    icon: 'Link',
    category: 'integrations'
  },

  // Gestão de Usuários - Apenas DEV_MASTER e Admin
  {
    path: '/usuarios',
    name: 'users',
    title: 'Usuários',
    description: 'Gestão de usuários do sistema',
    allowedRoles: ['DEV_MASTER', 'ADMIN'],
    showInSidebar: true,
    icon: 'Users2',
    category: 'admin',
    requiredFeature: 'user-management'
  },

  // Chat
  {
    path: '/chats',
    name: 'chats',
    title: 'Chats',
    description: 'Comunicação com clientes',
    showInSidebar: true,
    icon: 'MessageSquare',
    category: 'communication',
    requiredFeature: 'client-communication'
  },

  // Lei do Inquilino
  {
    path: '/lei-inquilino',
    name: 'tenant-law',
    title: 'Lei do Inquilino',
    description: 'Informações legais',
    showInSidebar: true,
    icon: 'Scale',
    category: 'legal'
  },

  // Configurações - Apenas DEV_MASTER e Admin
  {
    path: '/configuracoes',
    name: 'settings',
    title: 'Configurações',
    description: 'Configurações do sistema',
    allowedRoles: ['DEV_MASTER', 'ADMIN'],
    showInSidebar: true,
    icon: 'Settings',
    category: 'admin',
    requiredFeature: 'system-settings'
  },

  // Perfil do Usuário - Todos os usuários autenticados
  {
    path: '/profile',
    name: 'profile',
    title: 'Meu Perfil',
    description: 'Gerenciar informações pessoais',
    showInSidebar: false,
    icon: 'User',
    category: 'account'
  },

  // Configurações da Conta - Todos os usuários autenticados
  {
    path: '/account/settings',
    name: 'account-settings',
    title: 'Configurações da Conta',
    description: 'Preferências e configurações pessoais',
    showInSidebar: false,
    icon: 'Settings',
    category: 'account'
  }
];

// -----------------------------------------------------------
// Rotas de Autenticação
// -----------------------------------------------------------

export const authRoutes: RouteConfig[] = [
  {
    path: '/auth/login',
    name: 'login',
    title: 'Login',
    description: 'Página de login'
  },
  {
    path: '/auth/signup',
    name: 'signup',
    title: 'Criar Conta',
    description: 'Página de registro'
  },
  {
    path: '/auth/forgot-password',
    name: 'forgot-password',
    title: 'Recuperar Senha',
    description: 'Página de recuperação de senha'
  },
  {
    path: '/unauthorized',
    name: 'unauthorized',
    title: 'Não Autorizado',
    description: 'Página de acesso negado'
  }
];

// -----------------------------------------------------------
// Utilitários para Rotas
// -----------------------------------------------------------

/**
 * Obter configuração de rota pelo caminho
 */
export const getRouteConfig = (path: string): RouteConfig | undefined => {
  return [...routeConfigs, ...authRoutes].find(route => route.path === path);
};

/**
 * Obter configuração de rota pelo nome
 */
export const getRouteConfigByName = (name: string): RouteConfig | undefined => {
  return [...routeConfigs, ...authRoutes].find(route => route.name === name);
};

/**
 * Filtrar rotas por role
 */
export const getRoutesForRole = (role: UserRole): RouteConfig[] => {
  return routeConfigs.filter(route => {
    if (!route.allowedRoles || route.allowedRoles.length === 0) {
      return true; // Rota pública para usuários autenticados
    }
    return route.allowedRoles.includes(role);
  });
};

/**
 * Obter rotas para o sidebar
 */
export const getSidebarRoutes = (role: UserRole): RouteConfig[] => {
  return getRoutesForRole(role).filter(route => route.showInSidebar);
};

/**
 * Agrupar rotas por categoria
 */
export const getRoutesByCategory = (routes: RouteConfig[]): Record<string, RouteConfig[]> => {
  return routes.reduce((acc, route) => {
    const category = route.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(route);
    return acc;
  }, {} as Record<string, RouteConfig[]>);
};

/**
 * Verificar se usuário pode acessar rota
 */
export const canAccessRoute = (route: RouteConfig, userRole: UserRole): boolean => {
  if (!route.allowedRoles || route.allowedRoles.length === 0) {
    return true; // Rota pública para usuários autenticados
  }
  return route.allowedRoles.includes(userRole);
};

// -----------------------------------------------------------
// Categorias de Menu
// -----------------------------------------------------------

export const menuCategories = {
  main: {
    title: 'Principal',
    order: 1
  },
  management: {
    title: 'Gestão',
    order: 2
  },
  sales: {
    title: 'Vendas',
    order: 3
  },
  communication: {
    title: 'Comunicação',
    order: 4
  },
  advanced: {
    title: 'Avançado',
    order: 5
  },
  analytics: {
    title: 'Análises',
    order: 6
  },
  integrations: {
    title: 'Integrações',
    order: 7
  },
  legal: {
    title: 'Legal',
    order: 8
  },
  admin: {
    title: 'Administração',
    order: 9
  }
};

export default routeConfigs; 