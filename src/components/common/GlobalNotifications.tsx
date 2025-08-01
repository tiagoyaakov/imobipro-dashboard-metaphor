import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useGlobalNotifications } from '@/contexts/GlobalContext';
import { cn } from '@/lib/utils';

// -----------------------------------------------------------
// Componente de Notificações Globais
// -----------------------------------------------------------

const notificationIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const notificationColors = {
  success: 'bg-green-500/10 border-green-500/20 text-green-500',
  error: 'bg-red-500/10 border-red-500/20 text-red-500',
  warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
};

export const GlobalNotifications: React.FC = () => {
  const { notifications, removeNotification } = useGlobalNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => {
          const Icon = notificationIcons[notification.type];
          const colorClass = notificationColors[notification.type];

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'pointer-events-auto',
                'relative flex items-start gap-3 rounded-lg border p-4',
                'bg-background/95 backdrop-blur-sm shadow-lg',
                'min-w-[300px] max-w-[500px]',
                colorClass
              )}
            >
              <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
              
              <div className="flex-1">
                <h4 className="font-medium text-foreground">
                  {notification.title}
                </h4>
                {notification.message && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                )}
              </div>

              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-4 rounded-md p-1 hover:bg-foreground/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Barra de progresso para auto-dismiss */}
              {notification.duration && notification.duration > 0 && (
                <motion.div
                  className="absolute bottom-0 left-0 h-1 bg-current opacity-20"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ 
                    duration: notification.duration / 1000, 
                    ease: 'linear' 
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// -----------------------------------------------------------
// Hook para notificações pré-configuradas
// -----------------------------------------------------------

export const useNotifications = () => {
  const { addNotification } = useGlobalNotifications();

  const notify = {
    success: (title: string, message?: string) => {
      addNotification({
        type: 'success',
        title,
        message,
        duration: 5000,
      });
    },
    error: (title: string, message?: string) => {
      addNotification({
        type: 'error',
        title,
        message,
        duration: 0, // Não auto-dismiss para erros
      });
    },
    warning: (title: string, message?: string) => {
      addNotification({
        type: 'warning',
        title,
        message,
        duration: 7000,
      });
    },
    info: (title: string, message?: string) => {
      addNotification({
        type: 'info',
        title,
        message,
        duration: 5000,
      });
    },
  };

  return notify;
};

// -----------------------------------------------------------
// Componente de Badge de Sincronização
// -----------------------------------------------------------

interface SyncBadgeProps {
  isSyncing: boolean;
  className?: string;
}

export const SyncBadge: React.FC<SyncBadgeProps> = ({ isSyncing, className }) => {
  if (!isSyncing) return null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping absolute" />
        <div className="h-2 w-2 rounded-full bg-blue-500" />
      </div>
      <span className="text-xs text-muted-foreground">Sincronizando...</span>
    </div>
  );
};

// -----------------------------------------------------------
// Componente de Indicador de Seleção Global
// -----------------------------------------------------------

interface GlobalSelectionIndicatorProps {
  type: 'property' | 'contact' | 'appointment';
  id: string | null;
  label?: string;
  onClear?: () => void;
  className?: string;
}

export const GlobalSelectionIndicator: React.FC<GlobalSelectionIndicatorProps> = ({
  type,
  id,
  label,
  onClear,
  className,
}) => {
  if (!id) return null;

  const typeLabels = {
    property: 'Propriedade',
    contact: 'Contato',
    appointment: 'Agendamento',
  };

  const typeIcons = {
    property: '🏠',
    contact: '👤',
    appointment: '📅',
  };

  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
      'bg-primary/10 text-primary text-sm',
      className
    )}>
      <span>{typeIcons[type]}</span>
      <span className="font-medium">
        {typeLabels[type]} {label || `#${id.slice(0, 8)}`}
      </span>
      {onClear && (
        <button
          onClick={onClear}
          className="ml-1 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

// -----------------------------------------------------------
// Provider de Notificações (para adicionar ao layout)
// -----------------------------------------------------------

export const GlobalNotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  return (
    <>
      {children}
      <GlobalNotifications />
    </>
  );
};