import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Dados do estado da navegação
  const from = location.state?.from;
  const requiredRoles = location.state?.requiredRoles || [];

  const handleGoBack = () => {
    if (from) {
      navigate(from.pathname, { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleGoHome = () => {
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Acesso Negado</CardTitle>
          <CardDescription>
            Você não tem permissão para acessar esta página.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações do usuário */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Usuário:</span>
              <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Role atual:</span>
              <Badge variant="outline">{user?.role}</Badge>
            </div>
          </div>

          {/* Roles necessárias */}
          {requiredRoles.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Roles necessárias:</span>
              <div className="flex flex-wrap gap-2">
                {requiredRoles.map((role: string) => (
                  <Badge key={role} variant="destructive" className="text-xs">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Página tentativa de acesso */}
          {from && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Página solicitada:</span>
              <p className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                {from.pathname}
              </p>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-col gap-2">
            <Button onClick={handleGoHome} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Ir para Dashboard
            </Button>
            
            {from && (
              <Button variant="outline" onClick={handleGoBack} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            )}
            
            <Button variant="ghost" onClick={handleLogout} className="w-full">
              Sair da conta
            </Button>
          </div>

          {/* Mensagem de ajuda */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Entre em contato com o administrador se você acredita que deveria ter acesso a esta página.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Unauthorized; 