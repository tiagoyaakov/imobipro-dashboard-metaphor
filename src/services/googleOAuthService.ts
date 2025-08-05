// Serviço para autenticação OAuth 2.0 com Google Calendar
import { 
  GoogleOAuthConfig, 
  GoogleTokens, 
  GoogleAuthResponse,
  GoogleApiError,
  DEFAULT_GOOGLE_OAUTH_CONFIG,
  GOOGLE_CALENDAR_SCOPES 
} from "@/types/googleCalendar";

export class GoogleOAuthService {
  private config: GoogleOAuthConfig;
  private readonly STORAGE_KEY = "google_calendar_tokens";
  private readonly AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
  private readonly TOKEN_URL = "https://oauth2.googleapis.com/token";
  private readonly REVOKE_URL = "https://oauth2.googleapis.com/revoke";

  constructor() {
    this.config = {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
      redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`,
      scope: DEFAULT_GOOGLE_OAUTH_CONFIG.scope
    };

    this.validateConfig();
  }

  /**
   * Validar configuração OAuth
   */
  private validateConfig(): void {
    if (!this.config.clientId) {
      console.warn("Google Calendar: VITE_GOOGLE_CLIENT_ID não configurado");
    }
    if (!this.config.redirectUri) {
      console.warn("Google Calendar: VITE_GOOGLE_REDIRECT_URI não configurado");
    }
  }

  /**
   * Verificar se as configurações estão válidas
   */
  public isConfigured(): boolean {
    return !!(this.config.clientId && this.config.redirectUri);
  }

  /**
   * Gerar URL de autorização OAuth 2.0
   */
  public generateAuthUrl(state?: string): string {
    if (!this.isConfigured()) {
      throw new Error("Google OAuth não configurado. Verifique as variáveis de ambiente.");
    }

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope.join(" "),
      response_type: "code",
      access_type: "offline",
      prompt: "consent", // Força sempre solicitar refresh token
      include_granted_scopes: "true",
      state: state || this.generateState()
    });

    return `${this.AUTH_URL}?${params.toString()}`;
  }

  /**
   * Trocar código de autorização por tokens (usando proxy serverless seguro)
   */
  public async exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
    if (!this.isConfigured()) {
      throw new Error("Google OAuth não configurado");
    }

    try {
      // Usar proxy serverless para manter client_secret seguro
      const response = await fetch('/api/google-oauth', {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "exchange_code",
          code: code
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new GoogleApiError(errorData.error || "Erro na troca de tokens");
      }

      const authResponse: GoogleAuthResponse = await response.json();
      
      const tokens: GoogleTokens = {
        accessToken: authResponse.access_token,
        refreshToken: authResponse.refresh_token,
        expiryDate: Date.now() + (authResponse.expires_in * 1000),
        scope: authResponse.scope,
        tokenType: authResponse.token_type || "Bearer"
      };

      // Salvar tokens localmente
      this.saveTokens(tokens);
      
      return tokens;
    } catch (error) {
      console.error("Erro ao trocar código por tokens:", error);
      throw error;
    }
  }

  /**
   * Renovar access token usando refresh token (usando proxy serverless seguro)
   */
  public async refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
    if (!this.isConfigured()) {
      throw new Error("Google OAuth não configurado");
    }

    try {
      // Usar proxy serverless para manter client_secret seguro
      const response = await fetch('/api/google-oauth', {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "refresh_token",
          refresh_token: refreshToken
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new GoogleApiError(errorData.error || "Erro ao renovar token");
      }

      const authResponse: GoogleAuthResponse = await response.json();
      
      const tokens: GoogleTokens = {
        accessToken: authResponse.access_token,
        refreshToken: refreshToken, // Refresh token geralmente não muda
        expiryDate: Date.now() + (authResponse.expires_in * 1000),
        scope: authResponse.scope,
        tokenType: authResponse.token_type || "Bearer"
      };

      // Atualizar tokens salvos
      this.saveTokens(tokens);
      
      return tokens;
    } catch (error) {
      console.error("Erro ao renovar access token:", error);
      throw error;
    }
  }

  /**
   * Revogar tokens de acesso
   */
  public async revokeAccess(token: string): Promise<void> {
    try {
      const response = await fetch(`${this.REVOKE_URL}?token=${token}`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Erro ao revogar acesso");
      }

      // Limpar tokens salvos
      this.clearTokens();
    } catch (error) {
      console.error("Erro ao revogar acesso:", error);
      throw error;
    }
  }

  /**
   * Validar se tokens estão válidos
   */
  public validateTokens(tokens: GoogleTokens): boolean {
    if (!tokens || !tokens.accessToken) {
      return false;
    }

    // Verificar se token não expirou (com margem de 5 minutos)
    const fiveMinutes = 5 * 60 * 1000;
    const isExpired = Date.now() >= (tokens.expiryDate - fiveMinutes);
    
    return !isExpired;
  }

  /**
   * Obter tokens salvos do localStorage
   */
  public getSavedTokens(): GoogleTokens | null {
    try {
      const savedTokens = localStorage.getItem(this.STORAGE_KEY);
      if (!savedTokens) return null;

      const tokens: GoogleTokens = JSON.parse(savedTokens);
      
      // Validar estrutura básica
      if (!tokens.accessToken || !tokens.expiryDate) {
        this.clearTokens();
        return null;
      }

      return tokens;
    } catch (error) {
      console.error("Erro ao recuperar tokens salvos:", error);
      this.clearTokens();
      return null;
    }
  }

  /**
   * Salvar tokens no localStorage
   */
  public saveTokens(tokens: GoogleTokens): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tokens));
    } catch (error) {
      console.error("Erro ao salvar tokens:", error);
    }
  }

  /**
   * Limpar tokens salvos
   */
  public clearTokens(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error("Erro ao limpar tokens:", error);
    }
  }

  /**
   * Verificar se usuário está autenticado
   */
  public isAuthenticated(): boolean {
    const tokens = this.getSavedTokens();
    return tokens ? this.validateTokens(tokens) : false;
  }

  /**
   * Obter token de acesso válido (renovando se necessário)
   */
  public async getValidAccessToken(): Promise<string | null> {
    const tokens = this.getSavedTokens();
    
    if (!tokens) {
      return null;
    }

    // Se token ainda está válido, retornar
    if (this.validateTokens(tokens)) {
      return tokens.accessToken;
    }

    // Se tem refresh token, tentar renovar
    if (tokens.refreshToken) {
      try {
        const newTokens = await this.refreshAccessToken(tokens.refreshToken);
        return newTokens.accessToken;
      } catch (error) {
        console.error("Erro ao renovar token:", error);
        this.clearTokens();
        return null;
      }
    }

    // Sem refresh token ou renovação falhou
    this.clearTokens();
    return null;
  }

  /**
   * Gerar state aleatório para segurança OAuth
   */
  private generateState(): string {
    const array = new Uint32Array(4);
    crypto.getRandomValues(array);
    return Array.from(array, num => num.toString(16).padStart(8, '0')).join('');
  }

  /**
   * Processar callback de OAuth (extrair parâmetros da URL)
   */
  public static parseAuthCallback(url: string): { code?: string; error?: string; state?: string } {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    return {
      code: params.get('code') || undefined,
      error: params.get('error') || undefined,
      state: params.get('state') || undefined
    };
  }

  /**
   * Obter informações de debug
   */
  public getDebugInfo(): Record<string, any> {
    const tokens = this.getSavedTokens();
    
    return {
      isConfigured: this.isConfigured(),
      isAuthenticated: this.isAuthenticated(),
      hasTokens: !!tokens,
      tokenExpiry: tokens ? new Date(tokens.expiryDate).toISOString() : null,
      scopes: this.config.scope,
      clientId: this.config.clientId ? `${this.config.clientId.substring(0, 10)}...` : null,
      redirectUri: this.config.redirectUri
    };
  }
}

// Instância singleton
export const googleOAuthService = new GoogleOAuthService();

// Export para uso direto
export default googleOAuthService;