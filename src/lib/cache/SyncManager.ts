import { ISyncManager } from './types';

/**
 * Gerenciador de sincronização entre tabs/janelas
 * Usa BroadcastChannel API para comunicação
 */
export class SyncManager implements ISyncManager {
  private channel: BroadcastChannel | null = null;
  private localStorage: Storage | null = null;
  private updateCallbacks: Set<(key: string, value: any) => void> = new Set();
  private channelName: string;
  private storagePrefix: string;
  private isLeader: boolean = false;
  private leaderElectionKey: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(channelName = 'imobipro-cache-sync', storagePrefix = 'imobipro_cache_') {
    this.channelName = channelName;
    this.storagePrefix = storagePrefix;
    this.leaderElectionKey = `${storagePrefix}leader`;

    // Inicializar canal se disponível
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(channelName);
        this.setupChannelListeners();
      } catch (error) {
        console.warn('BroadcastChannel not supported:', error);
      }
    }

    // Fallback para localStorage events
    if (typeof window !== 'undefined' && window.localStorage) {
      this.localStorage = window.localStorage;
      this.setupStorageListeners();
    }

    // Iniciar eleição de líder
    this.electLeader();
  }

  /**
   * Sincroniza uma atualização de cache
   */
  async sync(key: string, value?: any): Promise<void> {
    const message = {
      type: 'cache-update',
      key,
      value,
      timestamp: Date.now(),
      tabId: this.getTabId()
    };

    // Broadcast via BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (error) {
        console.error('BroadcastChannel sync failed:', error);
      }
    }

    // Fallback via localStorage
    if (this.localStorage) {
      try {
        const syncKey = `${this.storagePrefix}sync_${Date.now()}_${Math.random()}`;
        this.localStorage.setItem(syncKey, JSON.stringify(message));
        
        // Limpar após um curto período
        setTimeout(() => {
          this.localStorage?.removeItem(syncKey);
        }, 100);
      } catch (error) {
        console.error('LocalStorage sync failed:', error);
      }
    }
  }

  /**
   * Sincroniza todas as entradas
   */
  async syncAll(): Promise<void> {
    const message = {
      type: 'cache-sync-all',
      timestamp: Date.now(),
      tabId: this.getTabId()
    };

    if (this.channel) {
      this.channel.postMessage(message);
    }
  }

  /**
   * Adiciona callback para atualizações
   */
  onUpdate(callback: (key: string, value: any) => void): () => void {
    this.updateCallbacks.add(callback);
    
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  /**
   * Broadcast manual de atualização
   */
  broadcastUpdate(key: string, value: any): void {
    this.sync(key, value).catch(console.error);
  }

  /**
   * Configurações privadas
   */
  private setupChannelListeners(): void {
    if (!this.channel) return;

    this.channel.onmessage = (event) => {
      const message = event.data;
      
      // Ignorar mensagens próprias
      if (message.tabId === this.getTabId()) return;

      switch (message.type) {
        case 'cache-update':
          this.handleCacheUpdate(message.key, message.value);
          break;
          
        case 'cache-sync-all':
          this.handleSyncAllRequest();
          break;
          
        case 'leader-election':
          this.handleLeaderElection(message);
          break;
          
        case 'leader-heartbeat':
          this.handleLeaderHeartbeat(message);
          break;
      }
    };
  }

  private setupStorageListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('storage', (event) => {
      if (!event.key?.startsWith(this.storagePrefix)) return;
      
      // Processar eventos de sincronização
      if (event.key.startsWith(`${this.storagePrefix}sync_`)) {
        try {
          const message = JSON.parse(event.newValue || '{}');
          
          if (message.tabId !== this.getTabId() && message.type === 'cache-update') {
            this.handleCacheUpdate(message.key, message.value);
          }
        } catch (error) {
          console.error('Storage sync parse error:', error);
        }
      }
    });
  }

  private handleCacheUpdate(key: string, value: any): void {
    // Notificar todos os callbacks
    for (const callback of this.updateCallbacks) {
      try {
        callback(key, value);
      } catch (error) {
        console.error('Update callback error:', error);
      }
    }
  }

  private handleSyncAllRequest(): void {
    // Se for o líder, deve responder com todos os dados
    if (this.isLeader) {
      // O CacheManager deve implementar isso
      console.log('Sync all requested - leader should respond');
    }
  }

  /**
   * Sistema de eleição de líder
   */
  private electLeader(): void {
    const now = Date.now();
    const leaderData = this.getLeaderData();

    // Se não há líder ou o líder está inativo
    if (!leaderData || now - leaderData.timestamp > 5000) {
      this.becomeLeader();
    } else {
      // Iniciar monitoramento do líder
      this.monitorLeader();
    }
  }

  private becomeLeader(): void {
    this.isLeader = true;
    
    const leaderData = {
      tabId: this.getTabId(),
      timestamp: Date.now()
    };

    if (this.localStorage) {
      this.localStorage.setItem(this.leaderElectionKey, JSON.stringify(leaderData));
    }

    // Broadcast eleição
    if (this.channel) {
      this.channel.postMessage({
        type: 'leader-election',
        ...leaderData
      });
    }

    // Iniciar heartbeat
    this.startHeartbeat();
  }

  private getLeaderData(): { tabId: string; timestamp: number } | null {
    if (!this.localStorage) return null;

    try {
      const data = this.localStorage.getItem(this.leaderElectionKey);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (!this.isLeader) {
        this.stopHeartbeat();
        return;
      }

      const heartbeat = {
        type: 'leader-heartbeat',
        tabId: this.getTabId(),
        timestamp: Date.now()
      };

      // Atualizar localStorage
      if (this.localStorage) {
        this.localStorage.setItem(this.leaderElectionKey, JSON.stringify({
          tabId: heartbeat.tabId,
          timestamp: heartbeat.timestamp
        }));
      }

      // Broadcast heartbeat
      if (this.channel) {
        this.channel.postMessage(heartbeat);
      }
    }, 2000); // A cada 2 segundos
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private monitorLeader(): void {
    // Verificar periodicamente se o líder ainda está ativo
    setTimeout(() => {
      const leaderData = this.getLeaderData();
      const now = Date.now();

      if (!leaderData || now - leaderData.timestamp > 5000) {
        this.electLeader();
      } else if (!this.isLeader) {
        this.monitorLeader();
      }
    }, 3000);
  }

  private handleLeaderElection(message: any): void {
    if (message.tabId !== this.getTabId()) {
      // Outro tab se tornou líder
      this.isLeader = false;
      this.stopHeartbeat();
    }
  }

  private handleLeaderHeartbeat(message: any): void {
    if (message.tabId !== this.getTabId() && this.localStorage) {
      // Atualizar timestamp do líder
      this.localStorage.setItem(this.leaderElectionKey, JSON.stringify({
        tabId: message.tabId,
        timestamp: message.timestamp
      }));
    }
  }

  /**
   * Utilitários
   */
  private getTabId(): string {
    // Usar um ID único para esta tab/janela
    if (!this.tabId) {
      this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.tabId;
  }

  private tabId?: string;

  /**
   * Métodos públicos adicionais
   */
  
  /**
   * Verifica se esta instância é o líder
   */
  isLeaderInstance(): boolean {
    return this.isLeader;
  }

  /**
   * Força uma eleição de líder
   */
  forceLeaderElection(): void {
    if (this.localStorage) {
      this.localStorage.removeItem(this.leaderElectionKey);
    }
    this.electLeader();
  }

  /**
   * Obtém estatísticas de sincronização
   */
  getSyncStats(): {
    isLeader: boolean;
    tabId: string;
    connectedTabs: number;
    syncMethod: 'BroadcastChannel' | 'LocalStorage' | 'None';
  } {
    return {
      isLeader: this.isLeader,
      tabId: this.getTabId(),
      connectedTabs: this.updateCallbacks.size,
      syncMethod: this.channel ? 'BroadcastChannel' : 
                  this.localStorage ? 'LocalStorage' : 'None'
    };
  }

  /**
   * Destrutor
   */
  destroy(): void {
    this.stopHeartbeat();

    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }

    // Se era líder, remover do localStorage
    if (this.isLeader && this.localStorage) {
      this.localStorage.removeItem(this.leaderElectionKey);
    }

    this.updateCallbacks.clear();
  }
}