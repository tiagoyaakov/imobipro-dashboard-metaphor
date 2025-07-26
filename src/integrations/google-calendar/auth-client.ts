// =====================================================
// AUTENTICAÇÃO GOOGLE CALENDAR - FRONTEND ONLY
// =====================================================

/**
 * Classe simplificada para autenticação Google Calendar no frontend
 * Não usa bibliotecas do servidor (googleapis)
 */
export class GoogleCalendarAuthClient {
  private clientId: string;
  private redirectUri: string;

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    
    // Detectar ambiente e usar URI apropriada
    const baseRedirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || '';
    
    // Se estamos em desenvolvimento local, usar localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      this.redirectUri = `${window.location.origin}/google-oauth-callback.html`;
    } else {
      // Em produção, usar a URI configurada
      this.redirectUri = baseRedirectUri;
    }

    console.log('🔐 [GoogleCalendarAuthClient] Configuração inicializada:', {
      environment: import.meta.env.MODE,
      hostname: window.location.hostname,
      origin: window.location.origin,
      configuredUri: baseRedirectUri,
      finalUri: this.redirectUri
    });
  }

  /**
   * Gerar URL de autorização OAuth2 manualmente
   * @param userId - ID do usuário
   * @returns URL de autorização
   */
  generateAuthUrl(userId: string): string {
    console.log('🔐 [GoogleCalendarAuthClient] Gerando URL de autorização:', {
      clientId: this.clientId,
      redirectUri: this.redirectUri,
      userId,
      environment: import.meta.env.MODE,
      currentHost: window.location.origin
    });

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ].join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state: userId
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log('🔐 [GoogleCalendarAuthClient] URL completa gerada:', authUrl);
    console.log('🔐 [GoogleCalendarAuthClient] Parâmetros enviados:', {
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'calendar + calendar.events',
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state: userId
    });
    
    return authUrl;
  }

  /**
   * Trocar código por tokens via backend seguro
   * @param code - Código de autorização
   * @returns Tokens
   */
  async exchangeCodeForTokens(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
  }> {
    console.log('🔐 [GoogleCalendarAuthClient] Enviando código para backend seguro');
    console.log('🔐 [GoogleCalendarAuthClient] Configuração:', {
      clientId: this.clientId,
      redirectUri: this.redirectUri,
      codeLength: code.length
    });

    // TODO: Implementar Edge Function no Supabase para trocar tokens
    // Por enquanto, simular resposta para não quebrar o fluxo
    console.warn('⚠️ [GoogleCalendarAuthClient] SIMULAÇÃO - Implementar Edge Function para troca segura de tokens');
    
    // Simular resposta de tokens
    const simulatedTokens = {
      access_token: `simulated_access_token_${Date.now()}`,
      refresh_token: `simulated_refresh_token_${Date.now()}`,
      expires_in: 3600,
      token_type: 'Bearer'
    };

    console.log('🔐 [GoogleCalendarAuthClient] Tokens simulados gerados:', {
      hasAccessToken: !!simulatedTokens.access_token,
      hasRefreshToken: !!simulatedTokens.refresh_token,
      tokenType: simulatedTokens.token_type
    });

    return simulatedTokens;
  }

  /**
   * Verificar se configuração é válida
   * @returns true se válida
   */
  isConfigValid(): boolean {
    return !!(this.clientId && this.redirectUri);
  }

  /**
   * Obter informações de configuração para debug
   */
  getConfigInfo() {
    return {
      hasClientId: !!this.clientId,
      hasRedirectUri: !!this.redirectUri,
      clientId: this.clientId ? `${this.clientId.substring(0, 12)}...` : 'Não configurado',
      redirectUri: this.redirectUri || 'Não configurado'
    };
  }
}

// Instância singleton
export const googleCalendarAuthClient = new GoogleCalendarAuthClient();

/**
 * Verificar se as variáveis de ambiente estão configuradas (versão client)
 */
export function validateGoogleCalendarConfigClient(): boolean {
  const requiredVars = {
    'VITE_GOOGLE_CLIENT_ID': import.meta.env.VITE_GOOGLE_CLIENT_ID,
    'VITE_GOOGLE_REDIRECT_URI': import.meta.env.VITE_GOOGLE_REDIRECT_URI
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key, _]) => key);

  if (missingVars.length > 0) {
    console.error('Variáveis de ambiente do Google Calendar não configuradas:', missingVars);
    console.log('Configuração atual:', googleCalendarAuthClient.getConfigInfo());
    return false;
  }

  console.log('✅ Configuração Google Calendar válida (frontend)');
  return true;
}

/**
 * Função utilitária para extrair informações de erro OAuth
 */
export function parseOAuthError(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.error_description) return error.error_description;
  if (error?.error) return error.error;
  if (error?.message) return error.message;
  return 'Erro desconhecido na autenticação OAuth';
}