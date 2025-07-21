import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  routeConfigs, 
  getRouteConfig, 
  getRoutesForRole, 
  getSidebarRoutes,
  getRoutesByCategory,
  canAccessRoute,
  menuCategories,
  type UserRole,
  type RouteConfig 
} from '@/config/routes';
import { usePermissions } from '@/components/auth/PrivateRoute';

// -----------------------------------------------------------
// Hook para Gerenciamento de Rotas
// -----------------------------------------------------------

export const useRoutes = () => {
  const location = useLocation();
  const { user, isAuthenticated } = usePermissions();

  /**
   * Rota atual
   */
  const currentRoute = useMemo(() => {
    return getRouteConfig(location.pathname);
  }, [location.pathname]);

  /**
   * Role do usuário atual
   */
  const userRole = user?.role as UserRole;

  /**
   * Rotas disponíveis para o usuário atual
   */
  const availableRoutes = useMemo(() => {
    if (!isAuthenticated || !userRole) return [];
    return getRoutesForRole(userRole);
  }, [isAuthenticated, userRole]);

  /**
   * Rotas para o sidebar
   */
  const sidebarRoutes = useMemo(() => {
    if (!isAuthenticated || !userRole) return [];
    return getSidebarRoutes(userRole);
  }, [isAuthenticated, userRole]);

  /**
   * Rotas agrupadas por categoria
   */
  const routesByCategory = useMemo(() => {
    return getRoutesByCategory(sidebarRoutes);
  }, [sidebarRoutes]);

  /**
   * Verificar se usuário pode acessar uma rota
   */
  const canAccess = (route: RouteConfig | string): boolean => {
    if (!isAuthenticated || !userRole) return false;
    
    const routeConfig = typeof route === 'string' 
      ? getRouteConfig(route)
      : route;
      
    if (!routeConfig) return false;
    
    return canAccessRoute(routeConfig, userRole);
  };

  /**
   * Obter breadcrumbs da rota atual
   */
  const breadcrumbs = useMemo(() => {
    const crumbs = [];
    const pathParts = location.pathname.split('/').filter(Boolean);
    
    // Adicionar Dashboard como primeiro item se não estamos na raiz
    if (pathParts.length > 0) {
      crumbs.push({
        title: 'Dashboard',
        path: '/',
        isActive: false
      });
    }
    
    // Construir breadcrumbs baseado no caminho
    let currentPath = '';
    pathParts.forEach((part, index) => {
      currentPath += `/${part}`;
      const routeConfig = getRouteConfig(currentPath);
      
      if (routeConfig) {
        crumbs.push({
          title: routeConfig.title,
          path: currentPath,
          isActive: index === pathParts.length - 1
        });
      }
    });
    
    return crumbs;
  }, [location.pathname]);

  /**
   * Verificar se rota atual requer permissões especiais
   */
  const requiresSpecialPermission = useMemo(() => {
    return currentRoute?.allowedRoles && currentRoute.allowedRoles.length > 0;
  }, [currentRoute]);

  /**
   * Obter estatísticas de rotas
   */
  const routeStats = useMemo(() => {
    return {
      total: routeConfigs.length,
      available: availableRoutes.length,
      inSidebar: sidebarRoutes.length,
      categories: Object.keys(routesByCategory).length,
      restricted: routeConfigs.filter(r => r.allowedRoles && r.allowedRoles.length > 0).length
    };
  }, [availableRoutes, sidebarRoutes, routesByCategory]);

  return {
    // Dados da rota atual
    currentRoute,
    breadcrumbs,
    requiresSpecialPermission,
    
    // Rotas disponíveis
    availableRoutes,
    sidebarRoutes,
    routesByCategory,
    
    // Utilitários
    canAccess,
    
    // Metadados
    routeStats,
    menuCategories,
    
    // Estado do usuário
    userRole,
    isAuthenticated
  };
};

// -----------------------------------------------------------
// Hook para Navegação Segura
// -----------------------------------------------------------

export const useSafeNavigation = () => {
  const { canAccess } = useRoutes();

  /**
   * Navegar apenas se tiver permissão
   */
  const navigateIfAllowed = (route: string | RouteConfig): boolean => {
    if (canAccess(route)) {
      // Aqui você pode adicionar lógica de navegação
      return true;
    }
    return false;
  };

  /**
   * Obter URL segura (retorna rota alternativa se não tiver acesso)
   */
  const getSafeUrl = (route: string, fallback: string = '/'): string => {
    return canAccess(route) ? route : fallback;
  };

  return {
    navigateIfAllowed,
    getSafeUrl,
    canAccess
  };
};

// -----------------------------------------------------------
// Hook para Menu Dinâmico
// -----------------------------------------------------------

export const useMenuItems = () => {
  const { sidebarRoutes, routesByCategory, userRole } = useRoutes();

  /**
   * Itens de menu organizados por categoria
   */
  const menuItems = useMemo(() => {
    return Object.entries(routesByCategory)
      .map(([categoryKey, routes]) => ({
        category: categoryKey,
        title: menuCategories[categoryKey as keyof typeof menuCategories]?.title || categoryKey,
        order: menuCategories[categoryKey as keyof typeof menuCategories]?.order || 999,
        routes: routes.sort((a, b) => a.title.localeCompare(b.title))
      }))
      .sort((a, b) => a.order - b.order);
  }, [routesByCategory]);

  /**
   * Itens de menu como lista plana
   */
  const flatMenuItems = useMemo(() => {
    return sidebarRoutes.sort((a, b) => a.title.localeCompare(b.title));
  }, [sidebarRoutes]);

  /**
   * Contar itens por categoria
   */
  const categoryStats = useMemo(() => {
    return Object.entries(routesByCategory).reduce((acc, [category, routes]) => {
      acc[category] = routes.length;
      return acc;
    }, {} as Record<string, number>);
  }, [routesByCategory]);

  return {
    menuItems,
    flatMenuItems,
    categoryStats,
    userRole
  };
};

export default useRoutes; 