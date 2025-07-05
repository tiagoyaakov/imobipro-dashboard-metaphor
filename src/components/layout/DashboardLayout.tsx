import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { ProtectedRoute } from "@/components/auth";

export default function DashboardLayout() {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
