type EventCallback = (data: any) => void

interface EventSubscription {
  unsubscribe: () => void
}

class EventBusClass {
  private events: Map<string, Set<EventCallback>> = new Map()
  private eventHistory: Array<{ event: string; data: any; timestamp: Date }> = []
  private maxHistorySize = 100

  // Emitir evento
  emit(event: string, data?: any) {
    // Salvar no histórico
    this.eventHistory.push({ event, data, timestamp: new Date() })
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift()
    }

    // Log em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`📢 Event: ${event}`, data)
    }

    // Notificar subscribers
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error)
        }
      })
    }

    // Emitir evento wildcard para listeners globais
    const wildcardCallbacks = this.events.get('*')
    if (wildcardCallbacks) {
      wildcardCallbacks.forEach(callback => {
        try {
          callback({ event, data })
        } catch (error) {
          console.error(`Error in wildcard handler:`, error)
        }
      })
    }
  }

  // Inscrever-se em evento
  on(event: string, callback: EventCallback): EventSubscription {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }

    const callbacks = this.events.get(event)!
    callbacks.add(callback)

    // Retornar função para desinscrever
    return {
      unsubscribe: () => {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.events.delete(event)
        }
      }
    }
  }

  // Inscrever-se em evento uma única vez
  once(event: string, callback: EventCallback): EventSubscription {
    const subscription = this.on(event, (data) => {
      callback(data)
      subscription.unsubscribe()
    })
    return subscription
  }

  // Remover todos os listeners de um evento
  off(event: string) {
    this.events.delete(event)
  }

  // Remover todos os listeners
  offAll() {
    this.events.clear()
  }

  // Obter histórico de eventos
  getHistory(event?: string): typeof this.eventHistory {
    if (event) {
      return this.eventHistory.filter(item => item.event === event)
    }
    return [...this.eventHistory]
  }

  // Limpar histórico
  clearHistory() {
    this.eventHistory = []
  }

  // Obter estatísticas
  getStats() {
    const stats: Record<string, number> = {}
    this.eventHistory.forEach(item => {
      stats[item.event] = (stats[item.event] || 0) + 1
    })
    return stats
  }
}

// Singleton
export const EventBus = new EventBusClass()

// Eventos padrão do sistema
export const SystemEvents = {
  // Autenticação
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_ERROR: 'auth.error',
  
  // Propriedades
  PROPERTY_CREATED: 'property.created',
  PROPERTY_UPDATED: 'property.updated',
  PROPERTY_DELETED: 'property.deleted',
  PROPERTY_VIEWED: 'property.viewed',
  
  // Contatos
  CONTACT_CREATED: 'contact.created',
  CONTACT_UPDATED: 'contact.updated',
  CONTACT_DELETED: 'contact.deleted',
  CONTACT_STAGE_CHANGED: 'contact.stage.changed',
  
  // Agendamentos
  APPOINTMENT_CREATED: 'appointment.created',
  APPOINTMENT_UPDATED: 'appointment.updated',
  APPOINTMENT_CANCELED: 'appointment.canceled',
  APPOINTMENT_COMPLETED: 'appointment.completed',
  
  // Negociações
  DEAL_CREATED: 'deal.created',
  DEAL_UPDATED: 'deal.updated',
  DEAL_STAGE_CHANGED: 'deal.stage.changed',
  DEAL_WON: 'deal.won',
  DEAL_LOST: 'deal.lost',
  
  // Sistema
  SYNC_STARTED: 'sync.started',
  SYNC_COMPLETED: 'sync.completed',
  SYNC_ERROR: 'sync.error',
  
  // Notificações
  NOTIFICATION_RECEIVED: 'notification.received',
  NOTIFICATION_READ: 'notification.read',
  
  // Erros
  ERROR_OCCURRED: 'error.occurred',
  ERROR_RESOLVED: 'error.resolved',
} as const

// Hook React para usar EventBus
import { useEffect } from 'react'

export function useEventBus(
  event: string,
  handler: EventCallback,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const subscription = EventBus.on(event, handler)
    return () => subscription.unsubscribe()
  }, [event, ...deps])
}

// Hook para emitir eventos
export function useEventEmitter() {
  return {
    emit: (event: string, data?: any) => EventBus.emit(event, data),
    emitError: (message: string, error?: any) => {
      EventBus.emit(SystemEvents.ERROR_OCCURRED, { message, error })
    },
    emitSuccess: (message: string, data?: any) => {
      EventBus.emit('success', { message, data })
    }
  }
}