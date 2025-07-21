import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

// Componentes UI
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// -----------------------------------------------------------
// Componente de Exibição de Erros de Autenticação
// -----------------------------------------------------------

interface AuthErrorDisplayProps {
  /** Título do erro */
  title?: string;
  /** Mensagem de erro */
  message: string;
  /** Código do erro (opcional) */
  code?: string;
  /** Callback para tentar novamente */
  onRetry?: () => void;
  /** Se true, mostra o erro em tela cheia */
  fullScreen?: boolean;
  /** Se true, mostra botão para voltar ao dashboard */
  showBackToDashboard?: boolean;
}

export const AuthErrorDisplay: React.FC<AuthErrorDisplayProps> = ({
  title = 'Erro de Autenticação',
  message,
  code,
  onRetry,
  fullScreen = false,
  showBackToDashboard = false,
}) => {
  const errorContent = (
    <div className="text-center space-y-4">
      <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-destructive" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-destructive mb-2">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {message}
        </p>
        {code && (
          <p className="text-xs text-muted-foreground mt-2 font-mono">
            Código: {code}
          </p>
        )}
      </div>
      
      <div className="flex flex-col space-y-2">
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
        )}
        
        {showBackToDashboard && (
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Link>
          </Button>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">
              ImobiPRO
            </h1>
            <p className="text-muted-foreground">
              Sistema de Gestão Imobiliária
            </p>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              {errorContent}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex flex-col space-y-2">
        <span>{message}</span>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm" className="w-fit">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

// -----------------------------------------------------------
// Variantes de Erro Específicas
// -----------------------------------------------------------

interface AuthSessionExpiredProps {
  onLoginClick?: () => void;
}

export const AuthSessionExpired: React.FC<AuthSessionExpiredProps> = ({
  onLoginClick,
}) => (
  <AuthErrorDisplay
    title="Sessão Expirada"
    message="Sua sessão expirou por segurança. Faça login novamente para continuar."
    onRetry={onLoginClick}
    fullScreen={true}
    showBackToDashboard={true}
  />
);

interface AuthNetworkErrorProps {
  onRetry?: () => void;
}

export const AuthNetworkError: React.FC<AuthNetworkErrorProps> = ({
  onRetry,
}) => (
  <AuthErrorDisplay
    title="Erro de Conexão"
    message="Não foi possível conectar ao servidor. Verifique sua conexão com a internet."
    onRetry={onRetry}
    fullScreen={true}
  />
);

interface AuthPermissionDeniedProps {
  onBackClick?: () => void;
}

export const AuthPermissionDenied: React.FC<AuthPermissionDeniedProps> = ({
  onBackClick,
}) => (
  <AuthErrorDisplay
    title="Acesso Negado"
    message="Você não tem permissão para acessar esta funcionalidade."
    onRetry={onBackClick}
    fullScreen={true}
    showBackToDashboard={true}
  />
);

export default AuthErrorDisplay; 