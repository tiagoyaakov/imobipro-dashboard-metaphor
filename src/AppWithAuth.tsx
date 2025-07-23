import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Providers de Autenticação
import { UnifiedAuthProvider } from "@/contexts/AuthProvider";

// Debug para verificar configuração
import { getAuthMode, authConfig, validateAuthConfig } from "@/config/auth";

// Componentes de Proteção
import { 
  PrivateRoute, 
  PublicRoute, 
  AdminRoute, 
  CreatorRoute 
} from "@/components/auth";

// Layout
import DashboardLayout from "./components/layout/DashboardLayout";
import PageLoadingFallback from "./components/common/PageLoadingFallback";

// Lazy loading das páginas para melhor performance
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

// Páginas de Autenticação
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const SignupPage = lazy(() => import("./pages/auth/SignupPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const UnauthorizedPage = lazy(() => import("./pages/auth/UnauthorizedPage"));
const AuthCallbackPage = lazy(() => import("./pages/auth/AuthCallbackPage"));

// Páginas de Perfil e Configurações Avançadas
const ProfilePage = lazy(() => import("./pages/auth/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/auth/SettingsPage"));

// -----------------------------------------------------------
// DEBUG: Verificar configuração na inicialização
// -----------------------------------------------------------

console.log('[AUTH DEBUG] Configuração de autenticação:', {
  mode: getAuthMode(),
  useRealAuth: authConfig.useRealAuth,
  supabaseUrl: authConfig.supabase.url ? 'CONFIGURADA' : 'NÃO CONFIGURADA',
  supabaseKey: authConfig.supabase.anonKey ? 'CONFIGURADA' : 'NÃO CONFIGURADA',
  environment: import.meta.env.MODE,
  validation: validateAuthConfig(),
  // Informações sobre o ambiente
  currentURL: window.location.href,
  isProduction: import.meta.env.PROD,
  allEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
});

// Verificar se estamos em produção e se as variáveis estão corretas
if (import.meta.env.PROD && import.meta.env.VITE_DEBUG_AUTH === 'true') {
  console.log('[PROD DEBUG] Variáveis de ambiente em produção:', {
    VITE_USE_REAL_AUTH: import.meta.env.VITE_USE_REAL_AUTH,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'NOT_SET',
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET',
    VITE_SUPABASE_AUTH_REDIRECT_URL: import.meta.env.VITE_SUPABASE_AUTH_REDIRECT_URL,
    NODE_ENV: import.meta.env.NODE_ENV,
    MODE: import.meta.env.MODE
  });
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

// -----------------------------------------------------------
// Componente de Rota Protegida com Suspense
// -----------------------------------------------------------

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'CREATOR' | 'ADMIN' | 'AGENT'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => (
  <PrivateRoute allowedRoles={allowedRoles}>
    <Suspense fallback={<PageLoadingFallback />}>
      {children}
    </Suspense>
  </PrivateRoute>
);

// -----------------------------------------------------------
// Componente Principal da Aplicação
// -----------------------------------------------------------

const AppWithAuth = () => (
  <QueryClientProvider client={queryClient}>
    <UnifiedAuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Rotas Públicas (apenas para não autenticados) */}
            <Route 
              path="/auth/login" 
              element={
                <PublicRoute>
                  <Suspense fallback={<PageLoadingFallback />}>
                    <LoginPage />
                  </Suspense>
                </PublicRoute>
              } 
            />
            <Route 
              path="/auth/signup" 
              element={
                <PublicRoute>
                  <Suspense fallback={<PageLoadingFallback />}>
                    <SignupPage />
                  </Suspense>
                </PublicRoute>
              } 
            />
            <Route 
              path="/auth/forgot-password" 
              element={
                <PublicRoute>
                  <Suspense fallback={<PageLoadingFallback />}>
                    <ForgotPasswordPage />
                  </Suspense>
                </PublicRoute>
              } 
            />
            <Route 
              path="/auth/callback" 
              element={
                <PublicRoute>
                  <Suspense fallback={<PageLoadingFallback />}>
                    <AuthCallbackPage />
                  </Suspense>
                </PublicRoute>
              } 
            />

            {/* Página de Não Autorizado */}
            <Route 
              path="/unauthorized" 
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <UnauthorizedPage />
                </Suspense>
              } 
            />

            {/* Rotas Privadas (Dashboard Layout) */}
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <DashboardLayout />
                </PrivateRoute>
              }
            >
              {/* Dashboard - Acesso para todos usuários autenticados */}
              <Route 
                index 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Propriedades - Acesso para todos */}
              <Route 
                path="propriedades" 
                element={
                  <ProtectedRoute>
                    <Propriedades />
                  </ProtectedRoute>
                } 
              />

              {/* Contatos - Acesso para todos */}
              <Route 
                path="contatos" 
                element={
                  <ProtectedRoute>
                    <Contatos />
                  </ProtectedRoute>
                } 
              />

              {/* Agenda - Acesso para todos */}
              <Route 
                path="agenda" 
                element={
                  <ProtectedRoute>
                    <Agenda />
                  </ProtectedRoute>
                } 
              />

              {/* Clientes - Acesso para todos */}
              <Route 
                path="clientes" 
                element={
                  <ProtectedRoute>
                    <Clientes />
                  </ProtectedRoute>
                } 
              />

              {/* Pipeline - Acesso para todos */}
              <Route 
                path="pipeline" 
                element={
                  <ProtectedRoute>
                    <Pipeline />
                  </ProtectedRoute>
                } 
              />

              {/* CRM - Acesso para Admin e Proprietário */}
              <Route 
                path="crm" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'PROPRIETARIO']}>
                    <CRM />
                  </ProtectedRoute>
                } 
              />

              {/* Relatórios - Acesso para Admin e Proprietário */}
              <Route 
                path="relatorios" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'PROPRIETARIO']}>
                    <Relatorios />
                  </ProtectedRoute>
                } 
              />

              {/* Conexões - Acesso para todos */}
              <Route 
                path="conexoes" 
                element={
                  <ProtectedRoute>
                    <Conexoes />
                  </ProtectedRoute>
                } 
              />

              {/* Usuários - Apenas Admin */}
              <Route 
                path="usuarios" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Usuarios />
                  </ProtectedRoute>
                } 
              />

              {/* Chats - Acesso para todos */}
              <Route 
                path="chats" 
                element={
                  <ProtectedRoute>
                    <Chats />
                  </ProtectedRoute>
                } 
              />

              {/* Lei do Inquilino - Acesso para todos */}
              <Route 
                path="lei-inquilino" 
                element={
                  <ProtectedRoute>
                    <LeiInquilino />
                  </ProtectedRoute>
                } 
              />

              {/* Perfil do Usuário - Todos os usuários autenticados */}
              <Route 
                path="profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />

              {/* Configurações da Conta - Todos os usuários autenticados */}
              <Route 
                path="account/settings" 
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } 
              />

              {/* Configurações - Apenas Admin */}
              <Route 
                path="configuracoes" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Configuracoes />
                  </ProtectedRoute>
                } 
              />
            </Route>

            {/* Página 404 - Disponível para usuários autenticados */}
            <Route 
              path="*" 
              element={
                <PrivateRoute>
                  <Suspense fallback={<PageLoadingFallback />}>
                    <NotFound />
                  </Suspense>
                </PrivateRoute>
              } 
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </UnifiedAuthProvider>
  </QueryClientProvider>
);

export default AppWithAuth; 