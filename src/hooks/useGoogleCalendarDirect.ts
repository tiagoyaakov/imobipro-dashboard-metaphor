// =====================================================
// HOOK GOOGLE CALENDAR DIRETO - IMOBIPRO DASHBOARD
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { googleCalendarAuthClient, validateGoogleCalendarConfigClient } from '@/integrations/google-calendar/auth-client';

export const useGoogleCalendarDirect = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se usuário tem Google Calendar conectado
  useEffect(() => {
    if (user && 'googleRefreshToken' in user && user.googleRefreshToken) {
      setIsConnected(true);
    } else {
      setIsConnected(false);
    }
  }, [user]);

  /**
   * Conectar Google Calendar - Usando integração direta
   * @returns URL de autorização
   */
  const connectGoogleCalendar = useCallback(async (): Promise<string> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validar configuração
      if (!validateGoogleCalendarConfigClient()) {
        throw new Error('Configuração do Google Calendar incompleta. Verifique as variáveis de ambiente.');
      }

      // Gerar URL de autorização diretamente
      const authUrl = googleCalendarAuthClient.generateAuthUrl(user.id);
      
      if (!authUrl) {
        throw new Error('Falha ao gerar URL de autorização');
      }

      return authUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw new Error(`Falha ao gerar URL de autenticação: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  /**
   * Processar callback de autenticação
   * @param code - Código de autorização
   */
  const handleAuthCallback = useCallback(async (code: string): Promise<void> => {
    console.log('🔐 [useGoogleCalendarDirect] Iniciando handleAuthCallback com código:', code.substring(0, 20) + '...');
    console.log('🔐 [useGoogleCalendarDirect] Estado do usuário:', { userId: user?.id, user });

    if (!user?.id) {
      console.error('🔐 [useGoogleCalendarDirect] Usuário não autenticado');
      throw new Error('Usuário não autenticado');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 [useGoogleCalendarDirect] Trocando código por tokens...');
      // Trocar código por tokens
      const tokens = await googleCalendarAuthClient.exchangeCodeForTokens(code);
      
      console.log('🔐 [useGoogleCalendarDirect] Tokens obtidos com sucesso:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        tokenType: tokens.token_type,
        expiresIn: tokens.expires_in
      });
      
      // TODO: Salvar tokens no banco de dados ou localStorage
      // Por enquanto, simular salvamento
      console.log('🔐 [useGoogleCalendarDirect] Simulando salvamento de tokens...');
      
      // Simular usuário com Google Calendar conectado
      // Em uma implementação real, isso seria salvo no banco
      if (user && 'googleRefreshToken' in user) {
        (user as any).googleRefreshToken = tokens.refresh_token;
        console.log('🔐 [useGoogleCalendarDirect] Refresh token salvo no objeto do usuário');
      }
      
      setIsConnected(true);
      console.log('🔐 [useGoogleCalendarDirect] Google Calendar conectado com sucesso!');
    } catch (err) {
      console.error('🔐 [useGoogleCalendarDirect] Erro ao processar callback:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw new Error(`Falha na autenticação: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Desconectar Google Calendar
   */
  const disconnectGoogleCalendar = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Revogar tokens via API Google ou remover do banco
      // Por enquanto, simular remoção
      if (user && 'googleRefreshToken' in user) {
        (user as any).googleRefreshToken = null;
      }
      
      setIsConnected(false);
      console.log('Google Calendar desconectado com sucesso');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw new Error(`Falha ao desconectar: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Sincronizar agendamento com Google Calendar
   * @param appointmentId - ID do agendamento
   */
  const syncAppointment = useCallback(async (appointmentId: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    if (!isConnected) {
      throw new Error('Google Calendar não conectado');
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implementar sincronização via API do Google Calendar
      // Por enquanto, simular sincronização
      console.log('Simulando sincronização do agendamento:', appointmentId);
      
      // Aguardar 2 segundos para simular API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Agendamento sincronizado com sucesso (simulado)');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw new Error(`Falha na sincronização: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isConnected]);

  /**
   * Sincronização completa bidirecional
   * @param calendarId - ID do calendário
   * @returns Resumo da sincronização
   */
  const fullSync = useCallback(async (calendarId: string = 'primary') => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    if (!isConnected) {
      throw new Error('Google Calendar não conectado');
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implementar sincronização via API do Google Calendar
      // Por enquanto, simular sincronização completa
      console.log('Simulando sincronização completa para calendário:', calendarId);
      
      // Aguardar 3 segundos para simular API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const result = {
        synchronized: {
          created: 0,
          updated: 0,
          deleted: 0
        },
        errors: [],
        calendarId
      };
      
      console.log('Sincronização completa realizada (simulada):', result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw new Error(`Falha na sincronização completa: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isConnected]);

  /**
   * Limpar erro
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Verificar se as configurações estão válidas
   */
  const isConfigValid = useCallback(() => {
    return validateGoogleCalendarConfigClient();
  }, []);

  return {
    isConnected,
    isLoading,
    error,
    connectGoogleCalendar,
    handleAuthCallback,
    syncAppointment,
    disconnectGoogleCalendar,
    fullSync,
    clearError,
    isConfigValid
  };
};

// Hook para verificar status (versão simplificada)
export const useGoogleCalendarStatusDirect = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      if (!user?.id) {
        setIsConnected(false);
        setIsChecking(false);
        return;
      }

      try {
        // Verificar se usuário tem tokens do Google Calendar
        // Em uma implementação real, isso seria uma consulta ao banco
        const hasTokens = user && 'googleRefreshToken' in user && user.googleRefreshToken;
        setIsConnected(!!hasTokens);
      } catch (error) {
        console.error('Erro ao verificar status do Google Calendar:', error);
        setIsConnected(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkConnection();
  }, [user?.id, user && 'googleRefreshToken' in user ? user.googleRefreshToken : undefined]);

  return { isConnected, isChecking };
};