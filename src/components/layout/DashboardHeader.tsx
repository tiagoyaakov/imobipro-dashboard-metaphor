import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserButton, useUser } from "@clerk/clerk-react";

export const DashboardHeader = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  console.log('Clerk user:', user, 'isLoaded:', isLoaded, 'isSignedIn:', isSignedIn);

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center px-6 gap-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <div className="hidden md:flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar propriedades, clientes..."
              className="pl-10 w-80 bg-muted/50 border-border focus:border-imobipro-blue focus:ring-imobipro-blue/20"
            />
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-imobipro-danger rounded-full text-xs"></span>
        </Button>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-medium text-foreground">
              {user?.fullName || user?.firstName || 'Usuário'}
            </span>
            <span className="text-xs text-muted-foreground">
              {user?.primaryEmailAddress?.emailAddress || ''}
            </span>
          </div>
          <div className="relative">
            {isLoaded && isSignedIn ? (
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 border-2 border-imobipro-blue bg-muted hover:ring-2 hover:ring-imobipro-blue transition-all duration-150",
                    userButtonPopoverCard: "bg-background border-border",
                    userButtonPopoverActions: "bg-background",
                    userButtonPopoverActionButton: "text-foreground hover:bg-muted",
                    userButtonPopoverActionButtonText: "text-foreground",
                    userButtonPopoverFooter: "bg-background",
                  },
                  variables: {
                    colorPrimary: "#2563eb",
                    colorText: "#fff",
                    colorTextSecondary: "#a3a3a3",
                    colorBackground: "#18181b",
                    colorInputBackground: "#18181b",
                    colorInputText: "#fff",
                  }
                }}
                afterSignOutUrl="/login"
              />
            ) : (
              <div className="w-9 h-9 flex items-center justify-center border-2 border-imobipro-blue bg-muted text-muted-foreground rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M6 20c0-2.21 3.58-4 6-4s6 1.79 6 4"/></svg>
                <span className="absolute left-full ml-2 text-xs text-imobipro-danger">Erro: usuário não autenticado</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
