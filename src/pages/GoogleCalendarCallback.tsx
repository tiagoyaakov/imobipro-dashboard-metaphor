import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { useGoogleCalendarDirect } from '@/hooks/useGoogleCalendarDirect';
import { useAuth } from '@/hooks/useAuth';

const GoogleCalendarCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { handleAuthCallback } = useGoogleCalendarDirect();
  
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processando autorização...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log('🔐 [GoogleCalendarCallback] Iniciando processamento do callback');
        console.log('🔐 [GoogleCalendarCallback] Estado da autenticação:', {
          authLoading,
          isAuthenticated,
          userId: user?.id,
          locationSearch: location.search
        });

        // Aguardar carregamento da autenticação
        if (authLoading) {
          setMessage('Verificando autenticação...');
          console.log('🔐 [GoogleCalendarCallback] Aguardando carregamento da autenticação...');
          return;
        }

        // Verificar se usuário está autenticado
        if (!isAuthenticated || !user) {
          console.error('🔐 [GoogleCalendarCallback] Usuário não autenticado:', { isAuthenticated, user });
          setStatus('error');
          setMessage('Usuário não autenticado. Faça login e tente novamente.');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Extrair parâmetros da URL
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const state = urlParams.get('state');

        console.log('🔐 [GoogleCalendarCallback] Parâmetros da URL:', {
          code: code ? `${code.substring(0, 20)}...` : null,
          error,
          state,
          fullUrl: window.location.href
        });

        // Verificar se houve erro na autorização
        if (error) {
          console.error('🔐 [GoogleCalendarCallback] Erro na autorização:', error);
          setStatus('error');
          setMessage(`Autorização negada: ${error}`);
          return;
        }

        // Verificar se o código foi recebido
        if (!code) {
          console.error('🔐 [GoogleCalendarCallback] Código de autorização não encontrado');
          setStatus('error');
          setMessage('Código de autorização não encontrado.');
          return;
        }

        console.log('🔐 [GoogleCalendarCallback] Processando código de autorização...');
        setMessage('Configurando conexão com Google Calendar...');
        
        // Processar callback
        await handleAuthCallback(code);
        
        setStatus('success');
        setMessage('Google Calendar conectado com sucesso!');
        
        // Se estamos em popup, fechar e notificar pai
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_CALENDAR_AUTH_SUCCESS',
            code
          }, window.location.origin);
          window.close();
          return;
        }
        
        // Redirecionar após 3 segundos
        setTimeout(() => {
          navigate('/agenda');
        }, 3000);
        
      } catch (error) {
        console.error('🔐 [GoogleCalendarCallback] Erro no callback do Google Calendar:', error);
        console.error('🔐 [GoogleCalendarCallback] Stack trace:', error instanceof Error ? error.stack : 'N/A');
        
        setStatus('error');
        const errorMessage = error instanceof Error 
          ? `Erro: ${error.message}`
          : 'Erro desconhecido ao processar autorização';
        
        console.error('🔐 [GoogleCalendarCallback] Mensagem de erro para usuário:', errorMessage);
        setMessage(errorMessage);
        
        // Se estamos em popup, notificar erro e fechar
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_CALENDAR_AUTH_ERROR',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          }, window.location.origin);
          
          setTimeout(() => {
            window.close();
          }, 3000);
        }
      }
    };

    processCallback();
  }, [location.search, handleAuthCallback, navigate, authLoading, isAuthenticated, user]);

  const handleReturnToAgenda = () => {
    navigate('/agenda');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            {/* Status Icon */}
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center">
              {status === 'processing' && (
                <div className="bg-blue-100 dark:bg-blue-900/20 w-full h-full rounded-full flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
              )}
              
              {status === 'success' && (
                <div className="bg-green-100 dark:bg-green-900/20 w-full h-full rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              )}
              
              {status === 'error' && (
                <div className="bg-red-100 dark:bg-red-900/20 w-full h-full rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <h1 className="text-xl font-semibold mb-2">
                {status === 'processing' && 'Conectando Google Calendar'}
                {status === 'success' && 'Conexão Bem-sucedida!'}
                {status === 'error' && 'Erro na Conexão'}
              </h1>
              
              <p className="text-sm text-muted-foreground">
                {message}
              </p>
            </div>

            {/* Additional Info */}
            {status === 'success' && (
              <Alert className="text-left">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Agora seus agendamentos serão sincronizados automaticamente 
                  entre o ImobiPRO e seu Google Calendar.
                </AlertDescription>
              </Alert>
            )}

            {status === 'error' && (
              <Alert variant="destructive" className="text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Tente novamente ou verifique suas configurações de privacidade 
                  do navegador. Certifique-se de que pop-ups estão habilitados.
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="pt-4">
              {status === 'processing' && (
                <div className="text-xs text-muted-foreground">
                  Por favor, aguarde...
                </div>
              )}
              
              {status === 'success' && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Redirecionando para a agenda em alguns segundos...
                  </div>
                  <Button 
                    onClick={handleReturnToAgenda}
                    className="w-full"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar para Agenda
                  </Button>
                </div>
              )}
              
              {status === 'error' && (
                <Button 
                  onClick={handleReturnToAgenda}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para Agenda
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleCalendarCallback;