/**
 * 🔄 Google Calendar OAuth Callback Page - ImobiPRO
 * 
 * Página responsável por processar o retorno do OAuth do Google Calendar
 * Funcionalidades:
 * - Processar código de autorização
 * - Salvar credenciais do usuário
 * - Redirecionar para agenda
 * - Mostrar status do processo
 * - Tratar erros de autenticação
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowLeft,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { useGoogleCalendarCallback } from '@/hooks/useGoogleCalendar';
import { useAuth } from '@/hooks/useAuth';

/**
 * Estados do processo de callback
 */
type CallbackState = 
  | 'processing'
  | 'success' 
  | 'error'
  | 'cancelled'
  | 'invalid_state';

interface CallbackStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  description?: string;
}

/**
 * Página de callback OAuth do Google Calendar
 */
export function GoogleCalendarCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [callbackState, setCallbackState] = useState<CallbackState>('processing');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [steps, setSteps] = useState<CallbackStep[]>([
    {
      id: 'validate',
      label: 'Validando parâmetros',
      status: 'processing',
      description: 'Verificando código de autorização...',
    },
    {
      id: 'exchange',
      label: 'Trocando tokens',
      status: 'pending',
      description: 'Obtendo credenciais do Google...',
    },
    {
      id: 'save',
      label: 'Salvando credenciais',
      status: 'pending',
      description: 'Armazenando informações com segurança...',
    },
    {
      id: 'complete',
      label: 'Finalizando',
      status: 'pending',
      description: 'Configurando integração...',
    },
  ]);

  const googleCalendarCallback = useGoogleCalendarCallback();

  // Extrair parâmetros da URL
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  /**
   * Atualiza o status de um step específico
   */
  const updateStep = (stepId: string, status: CallbackStep['status'], description?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, ...(description && { description }) }
        : step
    ));
  };

  /**
   * Processa o callback OAuth
   */
  const processCallback = async () => {
    try {
      if (!user?.id) {
        throw new Error('Usuário não encontrado');
      }

      // Step 1: Validar parâmetros
      setProgress(25);
      updateStep('validate', 'processing');
      
      if (error) {
        throw new Error(errorDescription || `Erro de autorização: ${error}`);
      }

      if (!code || !state) {
        throw new Error('Parâmetros de autorização inválidos');
      }

      updateStep('validate', 'completed', 'Parâmetros validados');

      // Step 2: Trocar código por tokens
      setProgress(50);
      updateStep('exchange', 'processing', 'Obtendo tokens do Google...');
      
      const credentials = await googleCalendarCallback.mutateAsync({ code, state });
      
      updateStep('exchange', 'completed', 'Tokens obtidos com sucesso');

      // Step 3: Salvar credenciais (já foi feito no mutate)
      setProgress(75);
      updateStep('save', 'processing', 'Salvando credenciais...');
      
      // Simular pequeno delay para UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      updateStep('save', 'completed', 'Credenciais salvas com segurança');

      // Step 4: Finalizar
      setProgress(100);
      updateStep('complete', 'processing', 'Configurando integração...');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      updateStep('complete', 'completed', 'Integração configurada!');

      setCallbackState('success');

      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/agenda', { 
          replace: true,
          state: { 
            message: 'Google Calendar conectado com sucesso!',
            type: 'success' 
          }
        });
      }, 2000);

    } catch (error) {
      console.error('❌ Erro no callback OAuth:', error);
      
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      setErrorMessage(errorMsg);
      setCallbackState('error');
      
      // Marcar step atual como erro
      const currentStep = steps.find(step => step.status === 'processing');
      if (currentStep) {
        updateStep(currentStep.id, 'error', errorMsg);
      }
    }
  };

  /**
   * Efeito para processar callback quando componente monta
   */
  useEffect(() => {
    if (error === 'access_denied') {
      setCallbackState('cancelled');
      setErrorMessage('Autorização cancelada pelo usuário');
      return;
    }

    if (!code || !state) {
      setCallbackState('invalid_state');
      setErrorMessage('Parâmetros de callback inválidos');
      return;
    }

    processCallback();
  }, [code, state, error, user?.id]);

  /**
   * Handlers para ações do usuário
   */
  const handleRetry = () => {
    window.location.reload();
  };

  const handleBackToAgenda = () => {
    navigate('/agenda');
  };

  const handleTryAgain = () => {
    navigate('/agenda', { 
      state: { 
        message: 'Tente conectar o Google Calendar novamente',
        type: 'info' 
      }
    });
  };

  // ========== COMPONENTES DE RENDER ==========

  const ProcessingView = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Conectando Google Calendar</h2>
        <p className="text-muted-foreground">
          Processando sua autorização e configurando a integração...
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progresso geral</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex-shrink-0">
                {step.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : step.status === 'processing' ? (
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                ) : step.status === 'error' ? (
                  <XCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <div className="w-5 h-5 border border-gray-300 rounded-full" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="font-medium text-sm">{step.label}</div>
                <div className="text-xs text-muted-foreground">
                  {step.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const SuccessView = () => (
    <div className="text-center space-y-6">
      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2 text-green-800">
          Google Calendar Conectado!
        </h2>
        <p className="text-muted-foreground">
          Sua conta foi conectada com sucesso. Agora você pode sincronizar 
          seus agendamentos automaticamente.
        </p>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Suas credenciais foram criptografadas e armazenadas com segurança. 
          Você será redirecionado para a agenda em alguns segundos.
        </AlertDescription>
      </Alert>

      <div className="flex gap-3 justify-center">
        <Button onClick={handleBackToAgenda}>
          <Calendar className="w-4 h-4 mr-2" />
          Ir para Agenda
        </Button>
      </div>
    </div>
  );

  const ErrorView = () => (
    <div className="text-center space-y-6">
      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
        <XCircle className="w-8 h-8 text-red-600" />
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2 text-red-800">
          Erro na Conexão
        </h2>
        <p className="text-muted-foreground mb-4">
          Não foi possível conectar sua conta do Google Calendar.
        </p>
        
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Erro:</strong> {errorMessage}
          </AlertDescription>
        </Alert>
      </div>

      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={handleBackToAgenda}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar à Agenda
        </Button>
        <Button onClick={handleTryAgain}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    </div>
  );

  const CancelledView = () => (
    <div className="text-center space-y-6">
      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full">
        <XCircle className="w-8 h-8 text-yellow-600" />
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2 text-yellow-800">
          Autorização Cancelada
        </h2>
        <p className="text-muted-foreground">
          Você cancelou a autorização do Google Calendar. Sem problemas, 
          você pode tentar conectar novamente a qualquer momento.
        </p>
      </div>

      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={handleBackToAgenda}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar à Agenda
        </Button>
        <Button onClick={handleTryAgain}>
          <Calendar className="w-4 h-4 mr-2" />
          Tentar Conectar Novamente
        </Button>
      </div>
    </div>
  );

  const InvalidStateView = () => (
    <div className="text-center space-y-6">
      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
        <XCircle className="w-8 h-8 text-red-600" />
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2 text-red-800">
          Link Inválido
        </h2>
        <p className="text-muted-foreground">
          Este link de callback não é válido ou já foi usado. 
          Por favor, inicie o processo de conexão novamente.
        </p>
      </div>

      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Problema:</strong> {errorMessage}
        </AlertDescription>
      </Alert>

      <div className="flex gap-3 justify-center">
        <Button onClick={handleBackToAgenda}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar à Agenda
        </Button>
      </div>
    </div>
  );

  // ========== RENDER PRINCIPAL ==========

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            Google Calendar
          </CardTitle>
          <CardDescription>
            Conectando sua conta para sincronização automática
          </CardDescription>
        </CardHeader>

        <CardContent>
          {callbackState === 'processing' && <ProcessingView />}
          {callbackState === 'success' && <SuccessView />}
          {callbackState === 'error' && <ErrorView />}
          {callbackState === 'cancelled' && <CancelledView />}
          {callbackState === 'invalid_state' && <InvalidStateView />}
          
          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Problemas? {' '}
              <a 
                href="https://support.imobipro.com/google-calendar" 
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Consulte nossa documentação
                <ExternalLink className="w-3 h-3 ml-1 inline" />
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GoogleCalendarCallback;

/**
 * ============= RESUMO DA PÁGINA =============
 * 
 * ✅ Página completa de callback OAuth Google Calendar
 * ✅ Estados visuais para todas as etapas do processo
 * ✅ Progress tracking com steps detalhados
 * ✅ Tratamento de todos os cenários (sucesso, erro, cancelamento)
 * ✅ Validação de parâmetros URL
 * ✅ Loading states e transições suaves
 * ✅ Redirecionamento automático após sucesso
 * ✅ Error handling com mensagens claras
 * ✅ Design responsivo e acessível
 * ✅ Links para documentação de suporte
 * 
 * ============= CENÁRIOS TRATADOS =============
 * 
 * 🔄 **Processing**: Executando etapas do OAuth
 * ✅ **Success**: Conexão realizada com sucesso
 * ❌ **Error**: Falha durante o processo
 * ⚠️ **Cancelled**: Usuário cancelou autorização
 * 🔍 **Invalid State**: Link inválido ou expirado
 * 
 * ============= INTEGRAÇÃO =============
 * 
 * - useGoogleCalendarCallback hook
 * - useAuth para identificação do usuário
 * - useNavigate para redirecionamentos
 * - Toast notifications automáticas
 * - Cache invalidation após sucesso
 */