// Hook para gerenciar autenticação OAuth 2.0 com Google Calendar
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { googleOAuthService, GoogleOAuthService } from "@/services/googleOAuthService";
import { GoogleTokens, SyncStatus } from "@/types/googleCalendar";

interface UseGoogleOAuthReturn {
  // Estados
  isConnected: boolean;
  isConnecting: boolean;
  connectionStatus: SyncStatus;
  tokens: GoogleTokens | null;
  lastConnectedAt: Date | null;
  error: string | null;

  // Ações
  connectToGoogle: () => Promise<void>;
  disconnectFromGoogle: () => Promise<void>;
  refreshConnection: () => Promise<void>;
  checkConnectionStatus: () => Promise<void>;
  clearError: () => void;

  // Utilitários
  isConfigured: boolean;
  debugInfo: Record<string, any>;
}

export function useGoogleOAuth(): UseGoogleOAuthReturn {
  const { toast } = useToast();

  // Estados
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<SyncStatus>(SyncStatus.IDLE);
  const [tokens, setTokens] = useState<GoogleTokens | null>(null);
  const [lastConnectedAt, setLastConnectedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Verificar se está configurado
  const isConfigured = googleOAuthService.isConfigured();

  /**
   * Conectar com Google Calendar
   */
  const connectToGoogle = useCallback(async () => {
    try {
      setIsConnecting(true);
      setConnectionStatus(SyncStatus.CONNECTING);
      setError(null);

      if (!isConfigured) {
        throw new Error("Google Calendar não está configurado. Verifique as variáveis de ambiente.");
      }

      // Gerar URL de autorização e redirecionar
      const authUrl = googleOAuthService.generateAuthUrl();
      
      // Abrir nova janela para autorização
      const popup = window.open(
        authUrl,
        "google-auth",
        "width=500,height=600,scrollbars=yes,resizable=yes"
      );

      if (!popup) {
        throw new Error("Não foi possível abrir a janela de autorização. Verifique se pop-ups estão habilitados.");
      }

      // Aguardar callback de autorização
      const authResult = await waitForAuthCallback(popup);
      
      if (authResult.error) {
        throw new Error(`Erro na autorização: ${authResult.error}`);
      }

      if (!authResult.code) {
        throw new Error("Código de autorização não recebido");
      }

      // Trocar código por tokens
      const newTokens = await googleOAuthService.exchangeCodeForTokens(authResult.code);
      
      setTokens(newTokens);
      setIsConnected(true);
      setLastConnectedAt(new Date());
      setConnectionStatus(SyncStatus.SYNCED);

      toast({
        title: "Google Calendar Conectado",
        description: "Sincronização configurada com sucesso!",
        variant: "default"
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao conectar com Google Calendar";
      setError(message);
      setConnectionStatus(SyncStatus.ERROR);
      
      toast({
        title: "Erro na Conexão",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  }, [isConfigured, toast]);

  /**
   * Desconectar do Google Calendar
   */
  const disconnectFromGoogle = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const currentTokens = googleOAuthService.getSavedTokens();
      
      if (currentTokens?.accessToken) {
        // Revogar acesso no Google
        await googleOAuthService.revokeAccess(currentTokens.accessToken);
      }

      // Limpar estado local
      googleOAuthService.clearTokens();
      setTokens(null);
      setIsConnected(false);
      setLastConnectedAt(null);
      setConnectionStatus(SyncStatus.IDLE);

      toast({
        title: "Google Calendar Desconectado",
        description: "Sincronização removida com sucesso",
        variant: "default"
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao desconectar";
      setError(message);
      
      // Mesmo com erro, limpar estado local
      googleOAuthService.clearTokens();
      setTokens(null);
      setIsConnected(false);
      setConnectionStatus(SyncStatus.IDLE);

      toast({
        title: "Desconectado com Avisos",
        description: "Conexão removida localmente, mas pode haver erro no Google",
        variant: "default"
      });
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  /**
   * Atualizar conexão (renovar tokens se necessário)
   */
  const refreshConnection = useCallback(async () => {
    try {
      setError(null);
      
      const accessToken = await googleOAuthService.getValidAccessToken();
      
      if (accessToken) {
        const updatedTokens = googleOAuthService.getSavedTokens();
        setTokens(updatedTokens);
        setIsConnected(true);
        setConnectionStatus(SyncStatus.SYNCED);
      } else {
        setTokens(null);
        setIsConnected(false);
        setConnectionStatus(SyncStatus.IDLE);
      }
      
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar conexão";
      setError(message);
      setConnectionStatus(SyncStatus.ERROR);
      
      // Se falhou ao renovar, desconectar
      setTokens(null);
      setIsConnected(false);
    }
  }, []);

  /**
   * Verificar status da conexão
   */
  const checkConnectionStatus = useCallback(async () => {
    try {
      if (!isConfigured) {
        setConnectionStatus(SyncStatus.IDLE);
        setIsConnected(false);
        return;
      }

      const currentTokens = googleOAuthService.getSavedTokens();
      
      if (!currentTokens) {
        setConnectionStatus(SyncStatus.IDLE);
        setIsConnected(false);
        setTokens(null);
        return;
      }

      const isValid = googleOAuthService.validateTokens(currentTokens);
      
      if (isValid) {
        setTokens(currentTokens);
        setIsConnected(true);
        setConnectionStatus(SyncStatus.SYNCED);
      } else {
        // Tentar renovar token
        await refreshConnection();
      }
      
    } catch (err) {
      console.error("Erro ao verificar status da conexão:", err);
      setConnectionStatus(SyncStatus.ERROR);
      setIsConnected(false);
    }
  }, [isConfigured, refreshConnection]);

  /**
   * Limpar erro
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Aguardar callback de autorização OAuth
   */
  const waitForAuthCallback = useCallback((popup: Window): Promise<{ code?: string; error?: string }> => {
    return new Promise((resolve, reject) => {
      const checkCallback = () => {
        try {
          // Verificar se popup ainda está aberto
          if (popup.closed) {
            reject(new Error("Autorização cancelada pelo usuário"));
            return;
          }

          // Tentar acessar URL do popup (mesmo domínio após redirect)
          let popupUrl: string;
          try {
            popupUrl = popup.location.href;
          } catch {
            // Cross-origin, ainda não redirecionou
            setTimeout(checkCallback, 1000);
            return;
          }

          // Verificar se está na URL de callback
          if (popupUrl.includes('/auth/google/callback') || popupUrl.includes('code=')) {
            const result = GoogleOAuthService.parseAuthCallback(popupUrl);
            popup.close();
            resolve(result);
          } else {
            setTimeout(checkCallback, 1000);
          }
          
        } catch (error) {
          popup.close();
          reject(error);
        }
      };

      // Iniciar verificação
      setTimeout(checkCallback, 1000);
      
      // Timeout após 5 minutos
      setTimeout(() => {
        if (!popup.closed) {
          popup.close();
          reject(new Error("Timeout na autorização"));
        }
      }, 5 * 60 * 1000);
    });
  }, []);

  /**
   * Obter informações de debug
   */
  const debugInfo = googleOAuthService.getDebugInfo();

  // Verificar status inicial
  useEffect(() => {
    checkConnectionStatus();
  }, [checkConnectionStatus]);

  // Escutar mudanças de focus para re-verificar conexão
  useEffect(() => {
    const handleFocus = () => {
      if (isConnected) {
        checkConnectionStatus();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isConnected, checkConnectionStatus]);

  return {
    // Estados
    isConnected,
    isConnecting,
    connectionStatus,
    tokens,
    lastConnectedAt,
    error,

    // Ações
    connectToGoogle,
    disconnectFromGoogle,
    refreshConnection,
    checkConnectionStatus,
    clearError,

    // Utilitários
    isConfigured,
    debugInfo
  };
}