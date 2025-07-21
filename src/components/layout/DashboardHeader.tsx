import { Bell, Search, User, LogOut, Settings, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/components/auth/PrivateRoute";
import { useRoutes } from "@/hooks/useRoutes";

const DashboardHeaderContent = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { canManageSettings } = usePermissions();
  const { breadcrumbs } = useRoutes();

  /**
   * Fazer logout
   */
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  /**
   * Ir para perfil
   */
  const handleProfile = () => {
    navigate('/profile');
  };

  /**
   * Ir para configurações (se tiver permissão)
   */
  const handleSettings = () => {
    if (canManageSettings) {
      navigate('/configuracoes');
    }
  };

  /**
   * Traduzir role para português
   */
  const translateRole = (role: string) => {
    const roleMap: Record<string, string> = {
      'CREATOR': 'Proprietário',
      'ADMIN': 'Administrador',
      'AGENT': 'Corretor',
    };
    return roleMap[role] || role;
  };

  /**
   * Obter cor do badge baseado no role
   */
  const getRoleVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'CREATOR': 'default',
      'ADMIN': 'secondary',
      'AGENT': 'outline',
    };
    return variantMap[role] || 'outline';
  };

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center px-6 gap-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="hidden sm:flex items-center space-x-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className="flex items-center">
                {index > 0 && <span className="mx-2 text-muted-foreground">/</span>}
                <span 
                  className={crumb.isActive 
                    ? "text-foreground font-medium" 
                    : "text-muted-foreground hover:text-foreground cursor-pointer"
                  }
                  onClick={() => !crumb.isActive && navigate(crumb.path)}
                >
                  {crumb.title}
                </span>
              </div>
            ))}
          </nav>
        )}

        <div className="hidden lg:flex items-center gap-2 ml-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar propriedades, clientes..."
              className="pl-10 w-80 bg-muted/50 border-border focus:border-imobipro-blue focus:ring-imobipro-blue/20"
            />
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-imobipro-danger rounded-full text-xs"></span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatar-placeholder.svg" />
                <AvatarFallback className="bg-imobipro-blue text-white text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium text-foreground">
                  {user?.name || 'Usuário'}
                </span>
                {user?.role && (
                  <Badge variant={getRoleVariant(user.role)} className="text-xs h-4">
                    {translateRole(user.role)}
                  </Badge>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                {user?.role && (
                  <Badge variant={getRoleVariant(user.role)} className="w-fit text-xs mt-1">
                    {translateRole(user.role)}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfile}>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Meu Perfil</span>
            </DropdownMenuItem>
            {canManageSettings && (
              <DropdownMenuItem onClick={handleSettings}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

// Componente wrapper que trata o caso de AuthProvider não estar disponível
export const DashboardHeader = () => {
  try {
    return <DashboardHeaderContent />;
  } catch (error) {
    console.warn('AuthProvider não disponível, renderizando header simplificado:', error);
    
    // Header simplificado quando AuthProvider não está disponível
    return (
      <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center px-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-gradient-to-r from-imobipro-blue to-imobipro-blue-dark rounded-lg flex items-center justify-center">
            <Icons.Building2 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-foreground">ImobiPRO</h1>
        </div>
        
        <div className="ml-auto flex items-center">
          <div className="text-sm text-muted-foreground">Carregando...</div>
        </div>
      </header>
    );
  }
};
