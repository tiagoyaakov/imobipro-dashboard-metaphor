import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { SignIn, SignUp } from '@clerk/clerk-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import DashboardLayout from './components/layout/DashboardLayout'
import PageLoadingFallback from './components/common/PageLoadingFallback'

// Lazy loading das páginas para melhor performance
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Propriedades = lazy(() => import('./pages/Propriedades'))
const Contatos = lazy(() => import('./pages/Contatos'))
const Agenda = lazy(() => import('./pages/Agenda'))
const Clientes = lazy(() => import('./pages/Clientes'))
const Pipeline = lazy(() => import('./pages/Pipeline'))
const CRM = lazy(() => import('./pages/CRM'))
const Relatorios = lazy(() => import('./pages/Relatorios'))
const Conexoes = lazy(() => import('./pages/Conexoes'))
const Usuarios = lazy(() => import('./pages/Usuarios'))
const Chats = lazy(() => import('./pages/Chats'))
const LeiInquilino = lazy(() => import('./pages/LeiInquilino'))
const Configuracoes = lazy(() => import('./pages/Configuracoes'))
const NotFound = lazy(() => import('./pages/NotFound'))

export default function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          {/* Rotas públicas de autenticação */}
          <Route path="/login/*" element={<SignIn routing="path" path="/login" />} />
          <Route path="/register/*" element={<SignUp routing="path" path="/register" />} />
          
          {/* Rotas protegidas do dashboard */}
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
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
          </Route>
          
          {/* Página 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </TooltipProvider>
  )
}
