// Página de callback para OAuth Google Calendar
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { googleOAuthService, GoogleOAuthService } from "@/services/googleOAuthService";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function GoogleCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Log imediato da renderização
  console.log('🚀 GoogleCallback component rendering...');

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        // Debug: Log da URL atual
        console.log('🔥 GoogleCallback Component Loaded!');
        console.log('Callback URL:', window.location.href);
        console.log('URL Search Params:', window.location.search);
        console.log('Session Storage auth_started:', sessionStorage.getItem('google_auth_started'));
        console.log('Pathname:', window.location.pathname);
        console.log('React Router working:', true);

        // Verificar se realmente foi um callback OAuth
        const authStarted = sessionStorage.getItem('google_auth_started');
        if (!authStarted) {
          console.warn("Callback OAuth inválido - não foi iniciado via módulo Plantão");
          // Não bloquear o processamento se há parâmetros OAuth na URL
          const urlParams = new URLSearchParams(window.location.search);
          if (!urlParams.has('code') && !urlParams.has('error')) {
            throw new Error("Callback OAuth inválido");
          }
        }

        // Limpar flag do sessionStorage
        sessionStorage.removeItem('google_auth_started');

        // Extrair parâmetros da URL
        const urlParams = GoogleOAuthService.parseAuthCallback(window.location.href);

        if (urlParams.error) {
          throw new Error(`Erro na autorização: ${urlParams.error}`);
        }

        if (!urlParams.code) {
          throw new Error("Código de autorização não recebido");
        }

        // Trocar código por tokens
        const tokens = await googleOAuthService.exchangeCodeForTokens(urlParams.code);

        toast({
          title: "Google Calendar Conectado",
          description: "Sincronização configurada com sucesso!",
          variant: "default"
        });

        // Redirecionar de volta para o módulo Plantão
        navigate("/plantao");

      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao processar callback OAuth";
        
        toast({
          title: "Erro na Conexão",
          description: message,
          variant: "destructive"
        });

        console.error("Erro no callback OAuth:", error);

        // Redirecionar de volta para o módulo Plantão mesmo com erro
        navigate("/plantao");
      }
    };

    processOAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
        <h2 className="text-xl font-semibold">Processando autenticação...</h2>
        <p className="text-muted-foreground">
          Aguarde enquanto configuramos sua conexão com o Google Calendar
        </p>
      </div>
    </div>
  );
}