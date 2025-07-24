import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, ShieldCheck } from 'lucide-react';

// -----------------------------------------------------------
// Componente de Bypass de Login (Temporário)
// -----------------------------------------------------------

export const LoginBypass: React.FC = () => {
  const navigate = useNavigate();

  const handleBypass = () => {
    console.log('🔐 [LoginBypass] Fazendo bypass de login - redirecionando para dashboard');
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold">
            ImobiPRO Dashboard
          </CardTitle>
          <CardDescription>
            Sistema temporariamente em modo desenvolvimento
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>Usuário: Tiago França Lima</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Agente • ID: 8a8c11cd-9165-4f15-9174-6a22afcc1465
            </div>
          </div>

          <Button 
            onClick={handleBypass}
            className="w-full"
            size="lg"
          >
            Acessar Dashboard
          </Button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Sistema configurado em modo mock para desenvolvimento
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginBypass;