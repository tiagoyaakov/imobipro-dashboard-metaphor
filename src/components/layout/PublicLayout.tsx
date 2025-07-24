import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppFooter } from './AppFooter';

// -----------------------------------------------------------
// Layout Público para Páginas Legais
// -----------------------------------------------------------

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header simples */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-imobipro-blue to-imobipro-blue-dark rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">I</span>
              </div>
              <span className="text-xl font-bold text-primary">ImobiPRO</span>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <AppFooter />
    </div>
  );
};

export default PublicLayout; 