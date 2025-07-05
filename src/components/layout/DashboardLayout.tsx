import { Outlet } from "react-router-dom";
import { useUser } from "@clerk/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function DashboardLayout() {
  const { isLoaded, isSignedIn } = useUser();

  // Mostra loading enquanto carrega os dados do usuário
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Redireciona para login se não estiver autenticado
  if (!isSignedIn) {
    window.location.href = '/sign-in';
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
