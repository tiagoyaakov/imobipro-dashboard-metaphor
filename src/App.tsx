import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthDebugPanel } from "@/components/debug/AuthDebugPanel";
import DashboardLayout from "./components/layout/DashboardLayout";
import PageLoadingFallback from "./components/common/PageLoadingFallback";

// Lazy loading das páginas para melhor performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Propriedades = lazy(() => import("./pages/Propriedades"));
const Contatos = lazy(() => import("./pages/Contatos"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Pipeline = lazy(() => import("./pages/Pipeline"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Conexoes = lazy(() => import("./pages/Conexoes"));
const Usuarios = lazy(() => import("./pages/Usuarios"));
const Chats = lazy(() => import("./pages/Chats"));
const LeiInquilino = lazy(() => import("./pages/LeiInquilino"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const WhatsAppTest = lazy(() => import("./pages/WhatsAppTest"));
const GoogleCalendarCallback = lazy(() => import("./pages/GoogleCalendarCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Configuração do QueryClient com otimizações
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (antes cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthDebugPanel />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DashboardLayout />}>
              <Route 
                index 
                element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Dashboard />
                  </Suspense>
                } 
              />
              <Route 
                path="propriedades" 
                element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Propriedades />
                  </Suspense>
                } 
              />
              <Route 
                path="contatos" 
                element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Contatos />
                  </Suspense>
                } 
              />
              <Route 
                path="clientes" 
                element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Clientes />
                  </Suspense>
                } 
              />
              <Route 
                path="pipeline" 
                element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Pipeline />
                  </Suspense>
                } 
              />
              <Route 
                path="relatorios" 
                element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Relatorios />
                  </Suspense>
                } 
              />
              <Route 
                path="conexoes" 
                element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Conexoes />
                  </Suspense>
                } 
              />
              <Route 
                path="usuarios" 
                element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Usuarios />
                  </Suspense>
                } 
              />
              <Route 
                path="chats" 
                element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Chats />
                  </Suspense>
                } 
              />
              <Route 
                path="lei-inquilino" 
                element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <LeiInquilino />
                  </Suspense>
                } 
              />
              <Route 
                path="configuracoes" 
                element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Configuracoes />
                  </Suspense>
                } 
              />
              <Route 
                path="whatsapp-test" 
                element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <WhatsAppTest />
                  </Suspense>
                } 
              />
            </Route>
            {/* Rota especial para callback OAuth Google Calendar (fora do DashboardLayout) */}
            <Route 
              path="auth/google/callback" 
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <GoogleCalendarCallback />
                </Suspense>
              } 
            />
            {/* Rota para redefinição de senha (fora do DashboardLayout) */}
            <Route 
              path="reset-password" 
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <ResetPassword />
                </Suspense>
              } 
            />
            <Route 
              path="*" 
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <NotFound />
                </Suspense>
              } 
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
