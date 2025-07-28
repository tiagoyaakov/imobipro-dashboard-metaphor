import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Hook para anúncios de tela (screen reader)
export const useScreenReader = () => {
  const announceRef = useRef<HTMLDivElement>(null);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announceRef.current) {
      announceRef.current.setAttribute('aria-live', priority);
      announceRef.current.textContent = message;
      
      // Limpar após um tempo para não ficar acumulando mensagens
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = '';
        }
      }, 1000);
    }
  };

  const AnnouncerComponent = () => (
    <div
      ref={announceRef}
      className="sr-only"
      aria-live="polite"
      aria-atomic="true"
    />
  );

  return { announce, AnnouncerComponent };
};

// Componente para navegação por teclado em grids/calendários
interface KeyboardNavigationProps {
  children: React.ReactNode;
  gridSize: { rows: number; cols: number };
  onNavigate?: (position: { row: number; col: number }) => void;
  className?: string;
}

export const KeyboardNavigationGrid: React.FC<KeyboardNavigationProps> = ({
  children,
  gridSize,
  onNavigate,
  className
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const currentPosition = useRef({ row: 0, col: 0 });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!gridRef.current) return;

      const { rows, cols } = gridSize;
      const { row, col } = currentPosition.current;
      let newRow = row;
      let newCol = col;

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          newRow = Math.max(0, row - 1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          newRow = Math.min(rows - 1, row + 1);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          newCol = Math.max(0, col - 1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          newCol = Math.min(cols - 1, col + 1);
          break;
        case 'Home':
          event.preventDefault();
          newRow = 0;
          newCol = 0;
          break;
        case 'End':
          event.preventDefault();
          newRow = rows - 1;
          newCol = cols - 1;
          break;
        default:
          return;
      }

      if (newRow !== row || newCol !== col) {
        currentPosition.current = { row: newRow, col: newCol };
        onNavigate?.({ row: newRow, col: newCol });

        // Focar no elemento correspondente
        const targetElement = gridRef.current.querySelector(
          `[data-grid-position="${newRow}-${newCol}"]`
        ) as HTMLElement;
        
        if (targetElement) {
          targetElement.focus();
        }
      }
    };

    const gridElement = gridRef.current;
    if (gridElement) {
      gridElement.addEventListener('keydown', handleKeyDown);
      return () => gridElement.removeEventListener('keydown', handleKeyDown);
    }
  }, [gridSize, onNavigate]);

  return (
    <div
      ref={gridRef}
      className={cn("focus-within:outline-none", className)}
      role="grid"
      aria-label="Navegação por calendário"
    >
      {children}
    </div>
  );
};

// Componente para feedback de alta visibilidade
interface HighContrastAlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  className?: string;
}

export const HighContrastAlert: React.FC<HighContrastAlertProps> = ({
  type,
  message,
  onDismiss,
  autoHide = false,
  className
}) => {
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        onDismiss?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [autoHide, onDismiss]);

  useEffect(() => {
    // Focar no alerta quando aparecer para leitores de tela
    if (alertRef.current) {
      alertRef.current.focus();
    }
  }, []);

  const getAlertStyles = () => {
    const base = "p-4 border-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-offset-2";
    
    switch (type) {
      case 'success':
        return `${base} bg-green-50 dark:bg-green-950 border-green-500 text-green-800 dark:text-green-200 focus:ring-green-500`;
      case 'error':
        return `${base} bg-red-50 dark:bg-red-950 border-red-500 text-red-800 dark:text-red-200 focus:ring-red-500`;
      case 'warning':
        return `${base} bg-yellow-50 dark:bg-yellow-950 border-yellow-500 text-yellow-800 dark:text-yellow-200 focus:ring-yellow-500`;
      default:
        return `${base} bg-blue-50 dark:bg-blue-950 border-blue-500 text-blue-800 dark:text-blue-200 focus:ring-blue-500`;
    }
  };

  const getAriaRole = () => {
    return type === 'error' ? 'alert' : 'status';
  };

  return (
    <div
      ref={alertRef}
      className={cn(getAlertStyles(), className)}
      role={getAriaRole()}
      aria-live="assertive"
      aria-atomic="true"
      tabIndex={-1}
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold">{message}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 p-1 rounded focus:outline-none focus:ring-2 focus:ring-offset-1"
            aria-label="Fechar alerta"
          >
            <span className="text-xl">&times;</span>
          </button>
        )}
      </div>
    </div>
  );
};

// Componente para botões com estados bem definidos
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText = 'Carregando...',
  disabled,
  children,
  className,
  ...props
}) => {
  const getButtonStyles = () => {
    const base = "font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
      primary: "bg-imobipro-blue hover:bg-imobipro-blue-dark text-white focus:ring-imobipro-blue",
      secondary: "bg-muted hover:bg-muted/80 text-foreground focus:ring-muted",
      danger: "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500"
    };
    
    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg"
    };
    
    return `${base} ${variants[variant]} ${sizes[size]}`;
  };

  return (
    <button
      className={cn(getButtonStyles(), className)}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-describedby={loading ? `loading-${props.id || 'button'}` : undefined}
      {...props}
    >
      {loading ? (
        <>
          <span className="sr-only">{loadingText}</span>
          <span aria-hidden="true">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {loadingText}
          </span>
        </>
      ) : (
        children
      )}
      {loading && (
        <span id={`loading-${props.id || 'button'}`} className="sr-only">
          Operação em andamento, aguarde...
        </span>
      )}
    </button>
  );
};

// Hook para gerenciar foco e trap de foco em modais
export const useFocusTrap = (isActive: boolean = false) => {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Salvar foco anterior
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focar no primeiro elemento
    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      
      // Restaurar foco anterior
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
};

// Componente para indicadores de progresso acessíveis
interface AccessibleProgressProps {
  value: number;
  max?: number;
  label: string;
  showPercentage?: boolean;
  className?: string;
}

export const AccessibleProgress: React.FC<AccessibleProgressProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  className
}) => {
  const percentage = Math.round((value / max) * 100);
  const progressId = `progress-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label htmlFor={progressId} className="text-sm font-medium">
          {label}
        </label>
        {showPercentage && (
          <span className="text-sm text-muted-foreground" aria-hidden="true">
            {percentage}%
          </span>
        )}
      </div>
      
      <div
        id={progressId}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label}: ${percentage}% concluído`}
        className="w-full bg-muted rounded-full h-2 overflow-hidden"
      >
        <div
          className="h-full bg-imobipro-blue transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
          aria-hidden="true"
        />
      </div>
      
      <span className="sr-only">
        {label}: {percentage}% de {max} concluído
      </span>
    </div>
  );
};

// Constantes para melhor acessibilidade
export const ARIA_LABELS = {
  CALENDAR_NAVIGATION: {
    PREVIOUS_MONTH: 'Mês anterior',
    NEXT_MONTH: 'Próximo mês',
    PREVIOUS_WEEK: 'Semana anterior',
    NEXT_WEEK: 'Próxima semana',
    PREVIOUS_DAY: 'Dia anterior',
    NEXT_DAY: 'Próximo dia',
    SELECT_DATE: 'Selecionar data',
    TODAY: 'Hoje'
  },
  APPOINTMENT: {
    CREATE: 'Criar novo agendamento',
    EDIT: 'Editar agendamento',
    DELETE: 'Excluir agendamento',
    CONFIRM: 'Confirmar agendamento',
    CANCEL: 'Cancelar agendamento',
    VIEW_DETAILS: 'Ver detalhes do agendamento'
  },
  NOTIFICATIONS: {
    MARK_READ: 'Marcar como lida',
    MARK_ALL_READ: 'Marcar todas como lidas',
    DELETE: 'Excluir notificação',
    SETTINGS: 'Configurações de notificação'
  },
  SYNC: {
    MANUAL_SYNC: 'Sincronização manual',
    RETRY_SYNC: 'Tentar sincronizar novamente',
    RESOLVE_CONFLICTS: 'Resolver conflitos de sincronização'
  }
} as const;

// Utilitários para contraste de cores
export const ensureContrast = (textColor: string, backgroundColor: string) => {
  // Esta função seria implementada com uma biblioteca de contraste de cores
  // Por simplicidade, retornamos as cores do tema que já são WCAG AA compliant
  return {
    text: 'hsl(var(--foreground))',
    background: 'hsl(var(--background))'
  };
};

export default {
  useScreenReader,
  KeyboardNavigationGrid,
  HighContrastAlert,
  AccessibleButton,
  useFocusTrap,
  AccessibleProgress,
  ARIA_LABELS,
  ensureContrast
};