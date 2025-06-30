
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Home,
  Users,
  Calendar,
  UserCheck,
  GitBranch,
  HeadphonesIcon,
  FileText,
  Link,
  User,
  MessageSquare,
  Scale,
  Settings,
  ChevronDown,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const menuItems = [
  { title: "Métricas", url: "/", icon: BarChart3 },
  { title: "Propriedades", url: "/propriedades", icon: Home },
  { title: "Contatos", url: "/contatos", icon: Users },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Clientes", url: "/clientes", icon: UserCheck },
  { title: "Pipeline", url: "/pipeline", icon: GitBranch },
  { title: "CRM", url: "/crm", icon: HeadphonesIcon },
  { title: "Relatórios", url: "/relatorios", icon: FileText },
  { title: "Conexões", url: "/conexoes", icon: Link },
  { title: "Usuários", url: "/usuarios", icon: User },
  { title: "Chats", url: "/chats", icon: MessageSquare },
  { title: "Lei do Inquilino AI", url: "/lei-inquilino", icon: Scale },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const [isMainGroupOpen, setIsMainGroupOpen] = useState(true);
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-imobipro-blue text-white shadow-md"
        : "text-gray-300 hover:text-white hover:bg-gray-800/80"
    }`;

  return (
    <Sidebar className={`${isCollapsed ? "w-20" : "w-64"} border-r border-gray-800 bg-gray-900`}>
      <SidebarContent className="p-4">
        {/* Logo */}
        <div className="mb-8 px-2">
          {!isCollapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-imobipro-blue to-imobipro-blue-dark rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">ImobiPRO</h1>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-r from-imobipro-blue to-imobipro-blue-dark rounded-lg flex items-center justify-center mx-auto">
              <Home className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        <Collapsible
          open={isMainGroupOpen}
          onOpenChange={setIsMainGroupOpen}
          className="w-full"
        >
          <SidebarGroup>
            {!isCollapsed && (
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="group/label text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3 flex items-center justify-between hover:text-gray-300 cursor-pointer">
                  Menu Principal
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/label:rotate-180" />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
            )}

            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === "/"}
                          className={getNavCls}
                        >
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          {!isCollapsed && (
                            <span className="truncate">{item.title}</span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Quick Actions - apenas quando não colapsado */}
        {!isCollapsed && (
          <div className="mt-8 p-4 bg-gradient-to-r from-imobipro-blue/20 to-imobipro-blue-dark/20 rounded-xl border border-gray-800">
            <h3 className="text-sm font-semibold text-white mb-2">Ações Rápidas</h3>
            <p className="text-xs text-gray-400 mb-3">
              Acesse funcionalidades essenciais rapidamente
            </p>
            <button className="w-full bg-imobipro-blue text-white text-sm py-2 px-3 rounded-lg hover:bg-imobipro-blue-dark transition-colors">
              Nova Propriedade
            </button>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
