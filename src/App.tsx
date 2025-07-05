import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import PageLoadingFallback from "./components/common/PageLoadingFallback";
import { PublicRoute } from "./components/auth";

// ================================================================
// LAZY LOADING DAS PÁGINAS PRINCIPAIS PARA MELHOR PERFORMANCE
// ================================================================
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
const Profile = lazy(() => import("./pages/Profile"));

// ================================================================
// LAZY LOADING DAS PÁGINAS DE AUTENTICAÇÃO
// ================================================================
const LoginPage = lazy(() => import("./pages/auth/Login"));
const RegisterPage = lazy(() => import("./pages/auth/Register"));

// ================================================================
// COMPONENTE PRINCIPAL DE ROTAS
// ================================================================
const App = () => (
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
    
    {/* Rotas de autenticação aprimoradas */}
    <Route 
      path="/sign-in" 
      element={
        <PublicRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <LoginPage />
          </Suspense>
        </PublicRoute>
      } 
    />
    <Route 
      path="/sign-up" 
      element={
        <PublicRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <RegisterPage />
          </Suspense>
        </PublicRoute>
      } 
    />
    
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
);

export default App;
