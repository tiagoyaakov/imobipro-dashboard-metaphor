import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicLayout from "./components/layout/PublicLayout";
import PageLoadingFallback from "./components/common/PageLoadingFallback";

// Lazy loading das páginas legais
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));

const AppLegal = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        {/* Rotas Públicas - Páginas Legais */}
        <Route path="/" element={<PublicLayout />}>
          <Route 
            path="privacy-policy" 
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <PrivacyPolicy />
              </Suspense>
            } 
          />
          <Route 
            path="terms-of-service" 
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <TermsOfService />
              </Suspense>
            } 
          />
          <Route 
            index 
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <PrivacyPolicy />
              </Suspense>
            } 
          />
        </Route>
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default AppLegal; 