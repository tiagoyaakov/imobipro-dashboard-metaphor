import React from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { AuthInitializingSpinner } from "@/components/auth/AuthLoadingSpinner";
import { ImpersonationIndicator } from "@/components/impersonation";

const DashboardLayout = () => {
  return (
    <React.Suspense fallback={<AuthInitializingSpinner />}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardHeader />
            
            {/* Indicador de Impersonation Ativa */}
            <div className="px-6 pt-2">
              <ImpersonationIndicator />
            </div>
            
            <main className="flex-1 overflow-auto p-6">
              <div className="max-w-7xl mx-auto">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </React.Suspense>
  );
};

export default DashboardLayout;
