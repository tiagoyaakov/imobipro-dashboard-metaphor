import { Search, Bell, Settings, LogOut, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser, useClerk } from "@clerk/react-router";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function DashboardHeader() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  // Sistema inteligente de fallbacks para o nome do usuário
  const getUserDisplayName = (): string => {
    if (!user) return "Usuário";

    // 1. Nome dos metadados personalizados (nome completo salvo)
    const customName = user.unsafeMetadata?.nome as string;
    if (customName?.trim()) {
      return customName;
    }

    // 2. Nome completo do Clerk
    if (user.fullName?.trim()) {
      return user.fullName;
    }

    // 3. Combinação firstName + lastName
    const firstName = user.firstName?.trim();
    const lastName = user.lastName?.trim();
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }

    // 4. Apenas firstName
    if (firstName) {
      return firstName;
    }

    // 5. Apenas lastName
    if (lastName) {
      return lastName;
    }

    // 6. Nome extraído do email
    if (user.primaryEmailAddress?.emailAddress) {
      const emailName = user.primaryEmailAddress.emailAddress.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }

    // 7. Fallback final
    return "Usuário";
  };

  // Obter telefone dos metadados
  const getUserPhone = (): string | null => {
    return user?.unsafeMetadata?.telefone as string || null;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Logout realizado com sucesso')
      navigate('/sign-in');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout. Tente novamente.')
    }
  };

  const displayName = getUserDisplayName();
  const userPhone = getUserPhone();

  // Componente de loading para avatar e dropdown enquanto carrega os dados
  const UserSection = () => {
    if (!isLoaded) {
      return (
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      )
    }

    return (
                  <UserSection />
    )
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              ImobiPRO
            </span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar propriedades, clientes..."
                className="w-full rounded-lg bg-background pl-8 md:w-[300px] lg:w-[400px]"
              />
            </div>
          </div>
          <nav className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notificações</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={user?.imageUrl} 
                      alt={displayName}
                    />
                    <AvatarFallback className="bg-sky-500 text-white">
                      {displayName
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {displayName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                    {userPhone && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {userPhone}
                      </div>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/configuracoes" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  );
}
