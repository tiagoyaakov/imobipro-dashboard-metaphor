import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';
import {
  Bell,
  BellRing,
  Check,
  X,
  Clock,
  User,
  Calendar,
  MessageSquare,
  Mail,
  Smartphone,
  Settings,
  AlertCircle,
  CheckCircle2,
  Info,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NotificationData {
  id: string;
  type: 'appointment_reminder' | 'appointment_confirmation' | 'appointment_cancellation' | 'sync_update' | 'conflict_detected' | 'client_message';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  appointmentId?: string;
  clientId?: string;
  agentId?: string;
  actions?: NotificationAction[];
  autoExpire?: Date;
}

export interface NotificationAction {
  id: string;
  label: string;
  action: 'confirm' | 'reschedule' | 'cancel' | 'view' | 'resolve' | 'dismiss';
  variant?: 'default' | 'destructive' | 'outline';
}

export interface NotificationSettings {
  enabled: boolean;
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  timing: {
    appointmentReminders: number[]; // minutes before appointment
    confirmationDeadline: number; // hours
    syncUpdates: boolean;
    conflictAlerts: boolean;
  };
  quiet_hours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string;   // HH:MM
  };
  priority_filter: 'all' | 'medium_high' | 'high_urgent';
}

interface NotificationSystemProps {
  notifications: NotificationData[];
  settings: NotificationSettings;
  onNotificationAction: (notificationId: string, actionId: string) => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notificationId: string) => void;
  onUpdateSettings: (settings: NotificationSettings) => void;
  className?: string;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  settings,
  onNotificationAction,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onUpdateSettings,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const urgentCount = notifications.filter(n => n.priority === 'urgent' && !n.isRead).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-500 bg-red-50 dark:bg-red-950';
      case 'high':
        return 'text-orange-500 bg-orange-50 dark:bg-orange-950';
      case 'medium':
        return 'text-blue-500 bg-blue-50 dark:bg-blue-950';
      default:
        return 'text-gray-500 bg-gray-50 dark:bg-gray-950';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment_reminder':
        return <Clock className="w-4 h-4" />;
      case 'appointment_confirmation':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'appointment_cancellation':
        return <X className="w-4 h-4" />;
      case 'sync_update':
        return <Bell className="w-4 h-4" />;
      case 'conflict_detected':
        return <AlertCircle className="w-4 h-4" />;
      case 'client_message':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const handleNotificationClick = (notification: NotificationData) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };

  const renderNotificationHeader = () => (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-3">
        <div className="relative">
          {urgentCount > 0 ? (
            <BellRing className="w-5 h-5 text-imobipro-blue animate-pulse" />
          ) : (
            <Bell className="w-5 h-5 text-muted-foreground" />
          )}
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-red-500">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
        <div>
          <h3 className="font-semibold">Notificações</h3>
          <p className="text-xs text-muted-foreground">
            {unreadCount === 0 ? 'Todas lidas' : `${unreadCount} não lidas`}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllAsRead}
            className="text-xs"
          >
            Marcar todas como lidas
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );

  const renderNotificationItem = (notification: NotificationData) => (
    <div
      key={notification.id}
      className={cn(
        "p-3 border-b last:border-b-0 cursor-pointer transition-all hover:bg-muted/20",
        !notification.isRead && "bg-blue-50/50 dark:bg-blue-950/20 border-l-4 border-l-imobipro-blue"
      )}
      onClick={() => handleNotificationClick(notification)}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", getPriorityColor(notification.priority))}>
          {getTypeIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h4 className={cn(
              "text-sm font-medium truncate",
              !notification.isRead && "font-semibold"
            )}>
              {notification.title}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatTimeAgo(notification.timestamp)}
              </span>
              {!notification.isRead && (
                <div className="w-2 h-2 bg-imobipro-blue rounded-full" />
              )}
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {notification.message}
          </p>
          
          {notification.actions && notification.actions.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {notification.actions.map((action) => (
                <Button
                  key={action.id}
                  size="sm"
                  variant={action.variant || "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNotificationAction(notification.id, action.id);
                  }}
                  className="h-6 px-2 text-xs"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteNotification(notification.id);
          }}
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:text-red-500"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );

  const renderNotificationSettings = () => {
    if (!showSettings) return null;

    return (
      <div className="p-4 border-t space-y-4">
        <h4 className="font-semibold text-sm">Configurações de Notificação</h4>
        
        {/* Ativar/Desativar notificações */}
        <div className="flex items-center justify-between">
          <Label htmlFor="notifications-enabled">Ativar notificações</Label>
          <Switch
            id="notifications-enabled"
            checked={settings.enabled}
            onCheckedChange={(checked) =>
              onUpdateSettings({ ...settings, enabled: checked })
            }
          />
        </div>
        
        <Separator />
        
        {/* Canais de notificação */}
        <div>
          <Label className="text-sm font-semibold">Canais de Notificação</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="push-notifications"
                checked={settings.channels.push}
                onCheckedChange={(checked) =>
                  onUpdateSettings({
                    ...settings,
                    channels: { ...settings.channels, push: checked }
                  })
                }
              />
              <Label htmlFor="push-notifications" className="text-xs">
                Push
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="email-notifications"
                checked={settings.channels.email}
                onCheckedChange={(checked) =>
                  onUpdateSettings({
                    ...settings,
                    channels: { ...settings.channels, email: checked }
                  })
                }
              />
              <Label htmlFor="email-notifications" className="text-xs">
                E-mail
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="sms-notifications"
                checked={settings.channels.sms}
                onCheckedChange={(checked) =>
                  onUpdateSettings({
                    ...settings,
                    channels: { ...settings.channels, sms: checked }
                  })
                }
              />
              <Label htmlFor="sms-notifications" className="text-xs">
                SMS
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="whatsapp-notifications"
                checked={settings.channels.whatsapp}
                onCheckedChange={(checked) =>
                  onUpdateSettings({
                    ...settings,
                    channels: { ...settings.channels, whatsapp: checked }
                  })
                }
              />
              <Label htmlFor="whatsapp-notifications" className="text-xs">
                WhatsApp
              </Label>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Filtro de prioridade */}
        <div>
          <Label htmlFor="priority-filter" className="text-sm font-semibold">
            Mostrar apenas
          </Label>
          <Select
            value={settings.priority_filter}
            onValueChange={(value) =>
              onUpdateSettings({
                ...settings,
                priority_filter: value as NotificationSettings['priority_filter']
              })
            }
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as notificações</SelectItem>
              <SelectItem value="medium_high">Média e alta prioridade</SelectItem>
              <SelectItem value="high_urgent">Alta e urgente apenas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Separator />
        
        {/* Horário silencioso */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-semibold">Horário Silencioso</Label>
            <Switch
              checked={settings.quiet_hours.enabled}
              onCheckedChange={(checked) =>
                onUpdateSettings({
                  ...settings,
                  quiet_hours: { ...settings.quiet_hours, enabled: checked }
                })
              }
            />
          </div>
          
          {settings.quiet_hours.enabled && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Início</Label>
                <input
                  type="time"
                  value={settings.quiet_hours.start}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      quiet_hours: { ...settings.quiet_hours, start: e.target.value }
                    })
                  }
                  className="w-full mt-1 px-2 py-1 text-xs border rounded"
                />
              </div>
              <div>
                <Label className="text-xs">Fim</Label>
                <input
                  type="time"
                  value={settings.quiet_hours.end}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      quiet_hours: { ...settings.quiet_hours, end: e.target.value }
                    })
                  }
                  className="w-full mt-1 px-2 py-1 text-xs border rounded"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (settings.priority_filter) {
      case 'medium_high':
        return ['medium', 'high', 'urgent'].includes(notification.priority);
      case 'high_urgent':
        return ['high', 'urgent'].includes(notification.priority);
      default:
        return true;
    }
  });

  return (
    <Card className={cn("overflow-hidden", className)}>
      {renderNotificationHeader()}
      
      {isExpanded && (
        <div className="max-h-96">
          <ScrollArea className="h-full">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              filteredNotifications.map(renderNotificationItem)
            )}
          </ScrollArea>
        </div>
      )}
      
      {renderNotificationSettings()}
    </Card>
  );
};

// Hook para gerenciar notificações
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const { toast } = useToast();

  const addNotification = (notification: Omit<NotificationData, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: NotificationData = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      isRead: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Mostrar toast para notificações urgentes
    if (notification.priority === 'urgent') {
      toast({
        title: notification.title,
        description: notification.message,
        variant: "destructive"
      });
    }

    return newNotification.id;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  };
};

export default NotificationSystem;