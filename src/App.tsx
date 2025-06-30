
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Propriedades from "./pages/Propriedades";
import Contatos from "./pages/Contatos";
import Agenda from "./pages/Agenda";
import Clientes from "./pages/Clientes";
import Pipeline from "./pages/Pipeline";
import CRM from "./pages/CRM";
import Relatorios from "./pages/Relatorios";
import Conexoes from "./pages/Conexoes";
import Usuarios from "./pages/Usuarios";
import Chats from "./pages/Chats";
import LeiInquilino from "./pages/LeiInquilino";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
