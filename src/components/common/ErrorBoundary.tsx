// ================================================================
// ERROR BOUNDARY - TRATAMENTO DE ERROS REACT
// ================================================================
// Data: 01/02/2025
// Descrição: Error Boundary com fallbacks inteligentes
// Features: Recovery automático, logging, UI específica por tipo
// ================================================================

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  RefreshCw, 
  Bug, 
  Wifi, 
  Database,
  Settings,
  Home,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

// ================================================================
// TIPOS
// ================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  isExpanded: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  showErrorDetails?: boolean;
  level?: 'page' | 'component' | 'critical';
}

// ================================================================
// TIPOS DE ERRO
// ================================================================

type ErrorType = 
  | 'network'
  | 'database' 
  | 'authentication'
  | 'permission'
  | 'validation'
  | 'chunk'
  | 'memory'
  | 'timeout'
  | 'unknown';

interface ErrorClassification {
  type: ErrorType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  userMessage: string;
  technicalMessage: string;
  suggestedActions: string[];
  icon: React.ElementType;
}

// ================================================================
// CLASSIFICAÇÃO DE ERROS
// ================================================================

const classifyError = (error: Error): ErrorClassification => {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';

  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return {
      type: 'network',
      severity: 'medium',
      recoverable: true,
      userMessage: 'Problema de conexão com a internet',
      technicalMessage: 'Falha na comunicação com o servidor',
      suggestedActions: [
        'Verificar conexão com a internet',
        'Tentar novamente em alguns segundos',
        'Recarregar a página se necessário'
      ],
      icon: Wifi,
    };
  }

  // Database errors
  if (message.includes('supabase') || message.includes('database') || message.includes('sql')) {
    return {
      type: 'database',
      severity: 'high',
      recoverable: true,
      userMessage: 'Erro no banco de dados',
      technicalMessage: 'Falha na comunicação com o banco de dados',
      suggestedActions: [
        'Aguardar alguns momentos',
        'Tentar a operação novamente',
        'Contatar suporte se persistir'
      ],
      icon: Database,
    };
  }

  // Authentication errors
  if (message.includes('auth') || message.includes('token') || message.includes('unauthorized')) {
    return {
      type: 'authentication',
      severity: 'medium',
      recoverable: true,
      userMessage: 'Problema de autenticação',
      technicalMessage: 'Token expirado ou inválido',
      suggestedActions: [
        'Fazer login novamente',
        'Verificar permissões',
        'Limpar cache do navegador'
      ],
      icon: Settings,
    };
  }

  // Chunk loading errors (lazy loading)
  if (message.includes('chunk') || message.includes('loading')) {
    return {
      type: 'chunk',
      severity: 'medium',
      recoverable: true,
      userMessage: 'Erro ao carregar página',
      technicalMessage: 'Falha no carregamento de recursos',
      suggestedActions: [
        'Recarregar a página',
        'Limpar cache do navegador',
        'Verificar conexão'
      ],
      icon: RefreshCw,
    };
  }

  // Memory errors
  if (message.includes('memory') || message.includes('heap')) {
    return {
      type: 'memory',
      severity: 'high',
      recoverable: false,
      userMessage: 'Problema de memória',
      technicalMessage: 'Aplicação consumindo muita memória',
      suggestedActions: [
        'Recarregar a página',
        'Fechar outras abas',
        'Contatar suporte técnico'
      ],
      icon: AlertTriangle,
    };
  }

  // Fallback
  return {
    type: 'unknown',
    severity: 'medium',
    recoverable: true,
    userMessage: 'Erro inesperado',
    technicalMessage: error.message || 'Erro desconhecido',
    suggestedActions: [
      'Tentar novamente',
      'Recarregar a página',
      'Contatar suporte se persistir'
    ],
    icon: Bug,
  };
};

// ================================================================
// ERROR BOUNDARY CLASS
// ================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      isExpanded: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log do erro
    console.error('🔴 Error Boundary caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
    });

    // Callback customizado
    this.props.onError?.(error, errorInfo);

    // Enviar para serviço de monitoramento (se configurado)
    this.reportError(error, errorInfo);

    // Toast de notificação
    toast.error('Algo deu errado. Tentando recuperar...', {
      id: this.state.errorId,
    });
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Aqui seria integrado com Sentry, LogRocket, etc.
    if (import.meta.env.PROD) {
      // Exemplo de payload para serviço de monitoramento
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        level: this.props.level || 'component',
      };
      
      console.log('📊 Error report:', errorReport);
      // fetch('/api/errors', { method: 'POST', body: JSON.stringify(errorReport) });
    }
  };

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      toast.error('Limite de tentativas atingido. Recarregue a página.');
      return;
    }

    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1,
    }));

    // Auto-retry com delay
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
      
      toast.success('Tentando recuperar...', {
        id: this.state.errorId,
      });
    }, 1000);
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private toggleExpanded = () => {
    this.setState(prevState => ({
      isExpanded: !prevState.isExpanded,
    }));
  };

  private copyErrorInfo = () => {
    const errorInfo = {
      id: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
    };

    navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2));
    toast.success('Informações do erro copiadas!');
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Usar fallback customizado se fornecido
    if (this.props.fallback) {
      return this.props.fallback(this.state.error!, this.handleRetry);
    }

    const errorClassification = classifyError(this.state.error!);
    const { maxRetries = 3 } = this.props;
    const canRetry = this.state.retryCount < maxRetries && errorClassification.recoverable;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                errorClassification.severity === 'critical' ? 'bg-red-100 text-red-600' :
                errorClassification.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                'bg-yellow-100 text-yellow-600'
              }`}>
                <errorClassification.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  {errorClassification.userMessage}
                  <Badge variant="outline" className="text-xs">
                    {errorClassification.type}
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-1">
                  {errorClassification.technicalMessage}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Ações sugeridas */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>O que fazer:</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {errorClassification.suggestedActions.map((action, index) => (
                    <li key={index} className="text-sm">{action}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            {/* Ações */}
            <div className="flex flex-wrap gap-2">
              {canRetry && (
                <Button onClick={this.handleRetry} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Tentar Novamente ({maxRetries - this.state.retryCount} restantes)
                </Button>
              )}
              
              <Button variant="outline" onClick={this.handleReload} className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Recarregar Página
              </Button>
              
              {this.props.level === 'page' && (
                <Button variant="outline" onClick={this.handleGoHome} className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Ir para Dashboard
                </Button>
              )}
            </div>

            {/* Detalhes técnicos (expansível) */}
            {this.props.showErrorDetails !== false && (
              <div className="border-t pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={this.toggleExpanded}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  {this.state.isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  Detalhes técnicos
                </Button>

                {this.state.isExpanded && (
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">ID do Erro:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{this.state.errorId}</code>
                    </div>

                    <div>
                      <span className="text-sm font-medium">Mensagem:</span>
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                        {this.state.error?.message}
                      </pre>
                    </div>

                    {this.state.error?.stack && (
                      <div>
                        <span className="text-sm font-medium">Stack Trace:</span>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto max-h-40">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={this.copyErrorInfo}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar Informações
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
}

// ================================================================
// HOOKS E UTILITÁRIOS
// ================================================================

/**
 * Hook para capturar erros assíncronos
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const captureError = React.useCallback((error: Error) => {
    console.error('Async error captured:', error);
    setError(error);
    
    // Toast de notificação
    toast.error(error.message);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  // Throw para Error Boundary
  if (error) {
    throw error;
  }

  return { captureError, clearError };
};

/**
 * Componente para capturar erros de Promise rejeitadas
 */
export const AsyncErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { captureError } = useErrorHandler();

  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      captureError(new Error(event.reason?.message || 'Promise rejeitada'));
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [captureError]);

  return <>{children}</>;
};

// ================================================================
// EXPORT DEFAULT
// ================================================================

export default ErrorBoundary;