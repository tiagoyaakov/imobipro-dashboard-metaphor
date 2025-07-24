// =====================================================
// AUTENTICAÇÃO GOOGLE CALENDAR - FRONTEND ONLY
// =====================================================

/**
 * Classe simplificada para autenticação Google Calendar no frontend
 * Não usa bibliotecas do servidor (googleapis)
 */
export class GoogleCalendarAuthClient {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    this.clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '';
    this.redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || '';
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
      userId
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
    console.log('🔐 [GoogleCalendarAuthClient] URL gerada:', authUrl);
    
    return authUrl;
  }

  /**
   * Trocar código por tokens usando fetch
   * @param code - Código de autorização
   * @returns Tokens
   */
  async exchangeCodeForTokens(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
  }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Falha ao trocar código por tokens: ${error}`);
    }

    return response.json();
  }

  /**
   * Verificar se configuração é válida
   * @returns true se válida
   */
  isConfigValid(): boolean {
    return !!(this.clientId && this.clientSecret && this.redirectUri);
  }

  /**
   * Obter informações de configuração para debug
   */
  getConfigInfo() {
    return {
      hasClientId: !!this.clientId,
      hasClientSecret: !!this.clientSecret,
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
    'VITE_GOOGLE_CLIENT_SECRET': import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
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