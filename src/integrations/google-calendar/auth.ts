// =====================================================
// AUTENTICAÇÃO GOOGLE CALENDAR - IMOBIPRO DASHBOARD
// =====================================================

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import type { GoogleAuthTokens, GoogleAuthUrlResponse } from '@/types/agenda';

export class GoogleCalendarAuth {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      import.meta.env.VITE_GOOGLE_CLIENT_ID,
      import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
      import.meta.env.VITE_GOOGLE_REDIRECT_URI
    );

    // Configurar refresh token automaticamente
    this.oauth2Client.on('tokens', (tokens) => {
      if (tokens.refresh_token) {
        // Salvar refresh_token no banco de dados
        this.saveRefreshToken(tokens.refresh_token);
      }
    });
  }

  /**
   * Gerar URL de autorização OAuth2
   * @param userId - ID do usuário para identificar após callback
   * @returns URL de autorização
   */
  generateAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId, // Para identificar o usuário após callback
      prompt: 'consent' // Força obtenção do refresh_token
    });
  }

  /**
   * Trocar código de autorização por tokens
   * @param code - Código de autorização recebido do Google
   * @returns Tokens de acesso
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleAuthTokens> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      
      return {
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope!,
        token_type: tokens.token_type!,
        expiry_date: tokens.expiry_date
      };
    } catch (error) {
      console.error('Erro ao trocar código por tokens:', error);
      throw new Error('Falha na autenticação com Google Calendar');
    }
  }

  /**
   * Configurar credenciais com refresh token
   * @param refreshToken - Refresh token salvo no banco
   */
  async setCredentialsFromRefreshToken(refreshToken: string): Promise<void> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      // Verificar se o token ainda é válido
      await this.oauth2Client.getAccessToken();
    } catch (error) {
      console.error('Erro ao configurar credenciais com refresh token:', error);
      throw new Error('Refresh token inválido ou expirado');
    }
  }

  /**
   * Renovar access token usando refresh token
   * @returns Novo access token
   */
  async refreshAccessToken(): Promise<string> {
    try {
      const { token } = await this.oauth2Client.getAccessToken();
      return token!;
    } catch (error) {
      console.error('Erro ao renovar access token:', error);
      throw new Error('Falha ao renovar token de acesso');
    }
  }

  /**
   * Verificar se as credenciais são válidas
   * @returns true se válidas, false caso contrário
   */
  async validateCredentials(): Promise<boolean> {
    try {
      await this.oauth2Client.getAccessToken();
      return true;
    } catch (error) {
      console.error('Credenciais inválidas:', error);
      return false;
    }
  }

  /**
   * Revogar tokens de acesso
   */
  async revokeTokens(): Promise<void> {
    try {
      await this.oauth2Client.revokeCredentials();
    } catch (error) {
      console.error('Erro ao revogar tokens:', error);
      throw new Error('Falha ao revogar tokens de acesso');
    }
  }

  /**
   * Obter informações do usuário autenticado
   * @returns Informações do usuário
   */
  async getUserInfo(): Promise<any> {
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const response = await oauth2.userinfo.get();
      return response.data;
    } catch (error) {
      console.error('Erro ao obter informações do usuário:', error);
      throw new Error('Falha ao obter informações do usuário');
    }
  }

  /**
   * Salvar refresh token no banco de dados
   * @param refreshToken - Refresh token a ser salvo
   */
  private async saveRefreshToken(refreshToken: string): Promise<void> {
    try {
      // TODO: Implementar salvamento no banco de dados
      // await prisma.user.update({
      //   where: { id: userId },
      //   data: { googleRefreshToken: refreshToken }
      // });
      
      console.log('Refresh token salvo:', refreshToken.substring(0, 10) + '...');
    } catch (error) {
      console.error('Erro ao salvar refresh token:', error);
    }
  }

  /**
   * Obter cliente OAuth2 para uso em outros serviços
   * @returns Cliente OAuth2
   */
  getOAuth2Client(): OAuth2Client {
    return this.oauth2Client;
  }

  /**
   * Obter configurações OAuth2
   * @returns Configurações do cliente OAuth2
   */
  getOAuth2Config() {
    return {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
      redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI
    };
  }
}

// Instância singleton para uso global
export const googleCalendarAuth = new GoogleCalendarAuth();

// =====================================================
// UTILITÁRIOS DE AUTENTICAÇÃO
// =====================================================

/**
 * Verificar se as variáveis de ambiente estão configuradas
 * @returns true se configuradas, false caso contrário
 */
export function validateGoogleCalendarConfig(): boolean {
  const requiredEnvVars = [
    'VITE_GOOGLE_CLIENT_ID',
    'VITE_GOOGLE_CLIENT_SECRET',
    'VITE_GOOGLE_REDIRECT_URI'
  ];

  const missingVars = requiredEnvVars.filter(
    varName => !import.meta.env[varName]
  );

  if (missingVars.length > 0) {
    console.error('Variáveis de ambiente do Google Calendar não configuradas:', missingVars);
    return false;
  }

  return true;
}

/**
 * Gerar URL de autorização com validação
 * @param userId - ID do usuário
 * @returns URL de autorização ou erro
 */
export async function generateAuthUrlWithValidation(userId: string): Promise<GoogleAuthUrlResponse> {
  if (!validateGoogleCalendarConfig()) {
    throw new Error('Configuração do Google Calendar incompleta');
  }

  const authUrl = googleCalendarAuth.generateAuthUrl(userId);
  
  return {
    authUrl,
    state: userId
  };
}

/**
 * Processar callback de autenticação com validação
 * @param code - Código de autorização
 * @param userId - ID do usuário
 * @returns Tokens de acesso
 */
export async function processAuthCallback(code: string, userId: string): Promise<GoogleAuthTokens> {
  if (!validateGoogleCalendarConfig()) {
    throw new Error('Configuração do Google Calendar incompleta');
  }

  return await googleCalendarAuth.exchangeCodeForTokens(code);
}

// =====================================================
// TIPOS DE ERRO
// =====================================================

export class GoogleCalendarAuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GoogleCalendarAuthError';
  }
}

export class InvalidCredentialsError extends GoogleCalendarAuthError {
  constructor(details?: any) {
    super('Credenciais inválidas ou expiradas', 'INVALID_CREDENTIALS', details);
    this.name = 'InvalidCredentialsError';
  }
}

export class TokenRefreshError extends GoogleCalendarAuthError {
  constructor(details?: any) {
    super('Falha ao renovar token de acesso', 'TOKEN_REFRESH_FAILED', details);
    this.name = 'TokenRefreshError';
  }
}

export class ConfigurationError extends GoogleCalendarAuthError {
  constructor(details?: any) {
    super('Configuração do Google Calendar incompleta', 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
  }
} 