import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute, PublicRoute } from "./components/auth";
import DashboardLayout from "./components/layout/DashboardLayout";
import PageLoadingFallback from "./components/common/PageLoadingFallback";

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
  <Suspense fallback={<PageLoadingFallback />}>
    <Routes>
      {/* Rotas Públicas */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Rotas Protegidas */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="propriedades" element={<Propriedades />} />
        <Route path="contatos" element={<Contatos />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="crm" element={<CRM />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="conexoes" element={<Conexoes />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="chats" element={<Chats />} />
        <Route path="lei-inquilino" element={<LeiInquilino />} />
        <Route path="configuracoes" element={<Configuracoes />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  </Suspense>
);

export default App;
