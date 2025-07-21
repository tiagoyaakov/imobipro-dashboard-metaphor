import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// -----------------------------------------------------------
// Componente de Loading para Autenticação
// -----------------------------------------------------------

interface AuthLoadingSpinnerProps {
  /** Mensagem a ser exibida */
  message?: string;
  /** Se true, mostra o spinner em tela cheia */
  fullScreen?: boolean;
}

export const AuthLoadingSpinner: React.FC<AuthLoadingSpinnerProps> = ({
  message = 'Carregando...',
  fullScreen = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
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
              {content}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return content;
};

// -----------------------------------------------------------
// Variantes de Loading Específicas
// -----------------------------------------------------------

export const AuthInitializingSpinner: React.FC = () => (
  <AuthLoadingSpinner
    message="Inicializando sistema de autenticação..."
    fullScreen={true}
  />
);

export const AuthVerifyingSpinner: React.FC = () => (
  <AuthLoadingSpinner
    message="Verificando suas credenciais..."
    fullScreen={true}
  />
);

export const AuthRedirectingSpinner: React.FC = () => (
  <AuthLoadingSpinner
    message="Redirecionando..."
    fullScreen={true}
  />
);

export default AuthLoadingSpinner; 