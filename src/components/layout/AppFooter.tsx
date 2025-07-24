import React from 'react';
import { Separator } from '@/components/ui/separator';

// -----------------------------------------------------------
// Componente Footer da Aplicação
// -----------------------------------------------------------

export const AppFooter: React.FC = () => {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
          {/* Logo e Copyright */}
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-imobipro-blue to-imobipro-blue-dark rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">I</span>
            </div>
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ImobiPRO Dashboard. Todos os direitos reservados.
            </span>
          </div>

          {/* Links Legais */}
          <div className="flex items-center space-x-6">
            <a
              href="/privacy-policy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Política de Privacidade
            </a>
            <Separator orientation="vertical" className="h-4" />
            <a
              href="/terms-of-service.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Termos de Serviço
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter; 