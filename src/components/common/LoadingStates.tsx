// ================================================================
// LOADING STATES - COMPONENTES DE CARREGAMENTO
// ================================================================
// Data: 01/02/2025
// Descrição: Componentes de loading inteligentes e contextuais
// Features: Skeleton loading, progress indicators, error recovery
// ================================================================

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  RefreshCw, 
  Wifi, 
  Database,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react';

// ================================================================
// TIPOS
// ================================================================

export interface LoadingStateProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'pulse' | 'skeleton' | 'progress';
  message?: string;
  progress?: number;
  showProgress?: boolean;
}

export interface SkeletonLoaderProps {
  className?: string;
  count?: number;
  height?: number | string;
  width?: number | string;
  variant?: 'text' | 'card' | 'avatar' | 'table' | 'dashboard' | 'list';
  animate?: boolean;
}

export interface ProgressLoadingProps {
  progress: number;
  message?: string;
  status?: 'loading' | 'error' | 'success';
  onRetry?: () => void;
  onCancel?: () => void;
  showDetails?: boolean;
  estimatedTime?: number;
}

// ================================================================
// LOADING SPINNER BÁSICO
// ================================================================

export const LoadingSpinner: React.FC<LoadingStateProps> = ({
  className,
  size = 'md',
  variant = 'spinner',
  message,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const spinnerClasses = {
    spinner: 'animate-spin',
    pulse: 'animate-pulse',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 className={cn(
        sizeClasses[size],
        spinnerClasses[variant as keyof typeof spinnerClasses] || 'animate-spin',
        'text-imobipro-blue'
      )} />
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

// ================================================================
// SKELETON LOADERS CONTEXTUAIS
// ================================================================

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className,
  count = 1,
  height = 20,
  width = '100%',
  variant = 'text',
  animate = true,
}) => {
  const skeletonClass = cn(
    'rounded-md',
    animate && 'animate-pulse',
    className
  );

  const renderSkeleton = () => {
    switch (variant) {
      case 'text':
        return (
          <Skeleton 
            className={skeletonClass} 
            style={{ height, width }} 
          />
        );
      
      case 'avatar':
        return (
          <Skeleton 
            className={cn('rounded-full', skeletonClass)} 
            style={{ height, width: height }} 
          />
        );
      
      case 'card':
        return (
          <Card className={skeletonClass}>
            <CardHeader>
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-4/5 mb-2" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        );
      
      case 'table':
        return (
          <div className={cn('space-y-2', skeletonClass)}>
            {/* Header */}
            <div className="flex gap-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            {/* Rows */}
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            ))}
          </div>
        );
      
      case 'dashboard':
        return (
          <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', skeletonClass)}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-xl" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      
      case 'list':
        return (
          <div className={cn('space-y-4', skeletonClass)}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        );
      
      default:
        return <Skeleton className={skeletonClass} style={{ height, width }} />;
    }
  };

  return (
    <div className={className}>
      {variant === 'text' && count > 1 ? (
        <div className="space-y-2">
          {Array.from({ length: count }).map((_, i) => (
            <Skeleton 
              key={i}
              className={skeletonClass} 
              style={{ height, width: i === count - 1 ? '60%' : width }} 
            />
          ))}
        </div>
      ) : (
        renderSkeleton()
      )}
    </div>
  );
};

// ================================================================
// LOADING COM PROGRESSO
// ================================================================

export const ProgressLoading: React.FC<ProgressLoadingProps> = ({
  progress,
  message = 'Carregando...',
  status = 'loading',
  onRetry,
  onCancel,
  showDetails = false,
  estimatedTime,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-5 w-5 animate-spin text-imobipro-blue" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-imobipro-blue" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'bg-imobipro-blue';
      case 'error':
        return 'bg-red-500';
      case 'success':
        return 'bg-green-500';
      default:
        return 'bg-imobipro-blue';
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 space-y-4">
        {/* Status e mensagem */}
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div className="flex-1">
            <p className="text-sm font-medium">{message}</p>
            {showDetails && estimatedTime && status === 'loading' && (
              <p className="text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3 inline mr-1" />
                Tempo estimado: {formatTime(estimatedTime)}
              </p>
            )}
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="space-y-2">
          <Progress 
            value={progress} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(progress)}%</span>
            <span>{progress < 100 ? 'Processando...' : 'Concluído'}</span>
          </div>
        </div>

        {/* Ações */}
        {(status === 'error' || (status === 'loading' && onCancel)) && (
          <div className="flex gap-2 pt-2">
            {status === 'error' && onRetry && (
              <Button 
                size="sm" 
                onClick={onRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar Novamente
              </Button>
            )}
            {status === 'loading' && onCancel && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onCancel}
              >
                Cancelar
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ================================================================
// LOADING STATES ESPECÍFICOS POR CONTEXTO
// ================================================================

export const DashboardLoading: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-6', className)}>
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-32" />
      </div>
    </div>
    <SkeletonLoader variant="dashboard" />
  </div>
);

export const TableLoading: React.FC<{ rows?: number; className?: string }> = ({ 
  rows = 5, 
  className 
}) => (
  <div className={className}>
    <SkeletonLoader variant="table" count={rows} />
  </div>
);

export const FormLoading: React.FC<{ fields?: number; className?: string }> = ({ 
  fields = 4, 
  className 
}) => (
  <div className={cn('space-y-4', className)}>
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <div className="flex gap-2 pt-4">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-20" />
    </div>
  </div>
);

// ================================================================
// LOADING COM STATUS DE CONEXÃO
// ================================================================

export const ConnectionStatusLoading: React.FC<{
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  message?: string;
  onRetry?: () => void;
}> = ({ status, message, onRetry }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connecting':
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />,
          color: 'border-yellow-500 bg-yellow-50',
          text: message || 'Conectando...',
          showRetry: false,
        };
      case 'connected':
        return {
          icon: <Wifi className="h-5 w-5 text-green-500" />,
          color: 'border-green-500 bg-green-50',
          text: message || 'Conectado',
          showRetry: false,
        };
      case 'disconnected':
        return {
          icon: <Wifi className="h-5 w-5 text-gray-500" />,
          color: 'border-gray-500 bg-gray-50',
          text: message || 'Desconectado',
          showRetry: true,
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          color: 'border-red-500 bg-red-50',
          text: message || 'Erro de conexão',
          showRetry: true,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={cn('flex items-center gap-3 p-3 border rounded-lg', config.color)}>
      {config.icon}
      <span className="text-sm font-medium flex-1">{config.text}</span>
      {config.showRetry && onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

// ================================================================
// LOADING INLINE PARA BOTÕES
// ================================================================

export const ButtonLoading: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
}> = ({ loading, children, loadingText }) => {
  if (loading) {
    return (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {loadingText || 'Carregando...'}
      </>
    );
  }

  return <>{children}</>;
};

// ================================================================
// LOADING COM PERFORMANCE METRICS
// ================================================================

export const PerformanceLoading: React.FC<{
  startTime: number;
  message?: string;
  showMetrics?: boolean;
}> = ({ startTime, message = 'Carregando...', showMetrics = false }) => {
  const [elapsedTime, setElapsedTime] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="flex flex-col items-center gap-2">
      <LoadingSpinner message={message} />
      {showMetrics && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Zap className="h-3 w-3" />
          <span>{(elapsedTime / 1000).toFixed(1)}s</span>
        </div>
      )}
    </div>
  );
};

// ================================================================
// EXPORTS
// ================================================================

export default LoadingSpinner;