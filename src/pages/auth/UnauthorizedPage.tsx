import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Home, LogOut } from 'lucide-react';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Hooks
import { useAuth } from '@/hooks/useAuth';

// -----------------------------------------------------------
// Página de Acesso Não Autorizado
// -----------------------------------------------------------

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Dados passados via state da navegação
  const { from, requiredRoles, userRole } = location.state || {};

  /**
   * Voltar para a página anterior
   */
  const handleGoBack = () => {
    navigate(-1);
  };

  /**
   * Ir para dashboard
   */
  const handleGoHome = () => {
    navigate('/');
  };

  /**
   * Fazer logout
   */
  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  /**
   * Traduzir roles para português
   */
  const translateRole = (role: string) => {
    const roleMap: Record<string, string> = {
      'DEV_MASTER': 'Dev Master',
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
      'DEV_MASTER': 'default',
      'ADMIN': 'secondary',
      'AGENT': 'outline',
    };
    return variantMap[role] || 'outline';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            ImobiPRO
          </h1>
          <p className="text-muted-foreground">
            Sistema de Gestão Imobiliária
          </p>
        </div>

        {/* Card de Erro */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            
            <CardTitle className="text-xl text-yellow-700 dark:text-yellow-400">
              Acesso Restrito
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-4">
                Você não tem permissão para acessar esta funcionalidade.
              </p>

              {/* Informações do usuário atual */}
              {user && (
                <div className="bg-muted/50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Usuário atual:</p>
                  <div className="flex flex-col items-center space-y-2">
                    <p className="font-medium">{user.name}</p>
                    <Badge variant={getRoleVariant(user.role)}>
                      {translateRole(user.role)}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Permissões necessárias */}
              {requiredRoles && requiredRoles.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    Permissões necessárias:
                  </p>
                  <div className="flex flex-wrap justify-center gap-1">
                    {requiredRoles.map((role: string) => (
                      <Badge key={role} variant="secondary" className="text-xs">
                        {translateRole(role)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Rota tentada */}
              {from && (
                <div className="text-xs text-muted-foreground">
                  <p>Tentativa de acesso: <code className="bg-muted px-1 rounded">{from}</code></p>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-2">
            {/* Botão principal - Voltar */}
            <Button onClick={handleGoBack} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>

            {/* Botões secundários */}
            <div className="flex w-full space-x-2">
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="flex-1"
              >
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>

              <Button
                onClick={handleLogout}
                variant="ghost"
                className="flex-1"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>

            {/* Informação de contato */}
            <div className="text-center text-xs text-muted-foreground mt-4">
              <p>
                Precisa de mais permissões? Entre em contato com o administrador do sistema.
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default UnauthorizedPage; 