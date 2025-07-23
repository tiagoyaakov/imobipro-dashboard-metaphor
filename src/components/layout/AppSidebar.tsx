import { NavLink, useLocation } from "react-router-dom";
import * as Icons from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

// Hooks
import { useMenuItems } from "@/hooks/useRoutes";
import { useEffectiveUser } from "@/hooks/useImpersonation";

function AppSidebarContent() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  // Hooks para dados dinâmicos
  const { flatMenuItems, userRole } = useMenuItems();
  const { effectiveUser, originalUser, isImpersonating } = useEffectiveUser();

  /**
   * Obter ícone do Lucide React
   */
  const getIcon = (iconName: string) => {
    const IconsTyped = Icons as unknown as Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>;
    const Icon = IconsTyped[iconName] || Icons.LayoutDashboard;
    return Icon;
  };

  /**
   * Definir ordem personalizada dos módulos
   */
  const getModuleOrder = (path: string): number => {
    const orderMap: Record<string, number> = {
      '/': 1,           // Dashboard
      '/agenda': 2,     // Agenda
      '/clientes': 3,   // Clientes
      '/conexoes': 4,   // Conexões
      '/contatos': 5,   // Contatos
      '/lei-inquilino': 6, // Lei do Inquilino
      '/pipeline': 7,   // Pipeline
      '/propriedades': 8, // Propriedades
      '/chats': 9,      // Chats
      '/crm': 10,       // CRM Avançado
      '/relatorios': 11, // Relatórios
      '/usuarios': 12,  // Usuários
      '/configuracoes': 13, // Configurações
    };
    return orderMap[path] || 999;
  };

  /**
   * Verificar se o módulo tem acesso especial (ícone dourado)
   */
  const hasSpecialAccess = (path: string): boolean => {
    const specialPaths = ['/crm', '/relatorios', '/usuarios', '/configuracoes'];
    return specialPaths.includes(path);
  };

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-imobipro-blue text-white shadow-md"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
    }`;

  // Ordenar itens do menu conforme especificação
  const orderedMenuItems = [...flatMenuItems].sort((a, b) => {
    return getModuleOrder(a.path) - getModuleOrder(b.path);
  });

  return (
    <Sidebar className={`${isCollapsed ? "w-20" : "w-64"} border-r border-border bg-sidebar`}>
      <SidebarContent className="p-4">
        {/* Logo */}
        <div className="mb-8 px-2">
          {!isCollapsed ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-imobipro-blue to-imobipro-blue-dark rounded-lg flex items-center justify-center">
                  <Icons.Building2 className="w-5 h-5 text-white" />
                </div>
                <NavLink 
                  to="/" 
                  className="text-xl font-bold text-sidebar-foreground hover:text-imobipro-blue transition-colors cursor-pointer"
                  title="Ir para Dashboard"
                >
                  ImobiPRO
                </NavLink>
              </div>
              {effectiveUser && (
                <div className="ml-10">
                  <Badge variant="outline" className="text-xs">
                    {effectiveUser.role === 'DEV_MASTER' ? 'Dev Master' : 
                     effectiveUser.role === 'ADMIN' ? 'Admin' : 'Corretor'}
                  </Badge>
                  {isImpersonating && (
                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 ml-1">
                      Impersonando
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ) : (
            <NavLink 
              to="/" 
              className="w-8 h-8 bg-gradient-to-r from-imobipro-blue to-imobipro-blue-dark rounded-lg flex items-center justify-center mx-auto hover:from-imobipro-blue-dark hover:to-imobipro-blue transition-all cursor-pointer"
              title="Ir para Dashboard"
            >
              <Icons.Building2 className="w-5 h-5 text-white" />
            </NavLink>
          )}
        </div>

        {/* Menu direto sem categorias */}
        <div className="space-y-1">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {orderedMenuItems.map((route) => {
                  const Icon = getIcon(route.icon || 'Home');
                  const isSpecialAccess = hasSpecialAccess(route.path);
                  
                  return (
                    <SidebarMenuItem key={route.path}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={route.path}
                          end={route.path === "/"}
                          className={getNavCls}
                          title={route.description}
                        >
                          <Icon 
                            className={`h-5 w-5 flex-shrink-0 ${
                              isSpecialAccess ? 'text-yellow-500' : ''
                            }`} 
                          />
                          {!isCollapsed && (
                            <span className="truncate">{route.title}</span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* Quick Actions - apenas quando não colapsado */}
        {!isCollapsed && (
          <div className="mt-8 p-4 bg-gradient-to-r from-imobipro-blue/20 to-imobipro-blue-dark/20 rounded-xl border border-sidebar-border">
            <h3 className="text-sm font-semibold text-sidebar-foreground mb-2">Ações Rápidas</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Acesse funcionalidades essenciais rapidamente
            </p>
            <button className="w-full bg-imobipro-blue text-white text-sm py-2 px-3 rounded-lg hover:bg-imobipro-blue-dark transition-colors">
              Nova Propriedade
            </button>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

// Componente wrapper que trata o caso de AuthProvider não estar disponível
export function AppSidebar() {
  try {
    return <AppSidebarContent />;
  } catch (error) {
    console.warn('AuthProvider não disponível, renderizando sidebar simplificado:', error);
    
    // Sidebar simplificado quando AuthProvider não está disponível
    return (
      <div className="w-64 border-r border-border bg-sidebar">
        <div className="p-4">
          <div className="flex flex-col gap-1 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-imobipro-blue to-imobipro-blue-dark rounded-lg flex items-center justify-center">
                <Icons.Building2 className="w-5 h-5 text-white" />
              </div>
              <NavLink 
                to="/" 
                className="text-xl font-bold text-sidebar-foreground hover:text-imobipro-blue transition-colors cursor-pointer"
                title="Ir para Dashboard"
              >
                ImobiPRO
              </NavLink>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Carregando menu...
          </div>
        </div>
      </div>
    );
  }
}
