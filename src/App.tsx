import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider, SignIn, SignUp } from "@clerk/clerk-react";
import DashboardLayout from "./components/layout/DashboardLayout";
import PageLoadingFallback from "./components/common/PageLoadingFallback";

// Lazy loading das páginas principais para melhor performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Propriedades = lazy(() => import("./pages/Propriedades"));
const Contatos = lazy(() => import("./pages/Contatos"));
const Agenda = lazy(() => import("./pages/Agenda"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Pipeline = lazy(() => import("./pages/Pipeline"));
const CRM = lazy(() => import("./pages/CRM"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Conexoes = lazy(() => import("./pages/Conexoes"));
const Usuarios = lazy(() => import("./pages/Usuarios"));
const Chats = lazy(() => import("./pages/Chats"));
const LeiInquilino = lazy(() => import("./pages/LeiInquilino"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Página de perfil
const Profile = lazy(() => import("./pages/Profile"));

// Configurações do Clerk
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Adicione sua Clerk Publishable Key no arquivo .env com a variável VITE_CLERK_PUBLISHABLE_KEY');
}

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
  <ClerkProvider
    publishableKey={PUBLISHABLE_KEY}
    appearance={{
      variables: {
        colorPrimary: '#0EA5E9',
        colorBackground: '#0F172A',
        colorInputBackground: '#1E293B',
        colorInputText: '#F1F5F9',
        colorText: '#F1F5F9',
      },
    }}
    signInUrl="/sign-in"
    signUpUrl="/sign-up"
    signInFallbackRedirectUrl="/"
    signUpFallbackRedirectUrl="/"
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Rotas principais protegidas */}
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
                path="dashboard" 
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
                path="agenda" 
                element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Agenda />
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
                path="crm" 
                element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <CRM />
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
                path="profile" 
                element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Profile />
                  </Suspense>
                } 
              />
            </Route>
            
            {/* Rotas de autenticação do Clerk */}
            <Route path="/sign-in" element={
              <div className="flex items-center justify-center min-h-screen bg-background">
                <SignIn />
              </div>
            } />
            <Route path="/sign-up" element={
              <div className="flex items-center justify-center min-h-screen bg-background">
                <SignUp />
              </div>
            } />
            
            {/* Página 404 */}
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
    </QueryClientProvider>
  </ClerkProvider>
);

export default App;
