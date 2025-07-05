import { UserProfile } from "@clerk/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/react-router";
import { User, Settings, Shield } from "lucide-react";
import { PageTemplate } from "@/components/common/PageTemplate";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function Profile() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <LoadingSpinner 
          size="lg" 
          text="Carregando perfil..." 
          className="py-12"
        />
      </div>
    );
  }

  return (
    <PageTemplate
      title="Perfil do Usuário"
      description="Gerencie suas informações pessoais e configurações de conta"
      className="container mx-auto p-6 space-y-6"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header do perfil */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">
              {user?.fullName || user?.firstName || "Usuário"}
            </h1>
            <p className="text-muted-foreground">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Verificado
              </Badge>
              <Badge variant="outline" className="text-xs">
                Usuário Ativo
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Informações gerais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
              <CardDescription>
                Suas informações pessoais básicas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
                <p className="text-foreground">{user?.fullName || "Não informado"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Membro desde</p>
                <p className="text-foreground">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : "Não informado"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações
              </CardTitle>
              <CardDescription>
                Preferências e configurações da conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tema</p>
                <p className="text-foreground">Dark Mode</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Idioma</p>
                <p className="text-foreground">Português (Brasil)</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Timezone</p>
                <p className="text-foreground">America/Sao_Paulo</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Segurança
              </CardTitle>
              <CardDescription>
                Status de segurança da conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verificação de Email</p>
                <Badge variant="secondary" className="text-xs">
                  Verificado
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Autenticação 2FA</p>
                <Badge variant="outline" className="text-xs">
                  Configurar
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Último Login</p>
                <p className="text-foreground">
                  {user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString('pt-BR') : "Não informado"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Componente UserProfile do Clerk */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Gerenciar Perfil</CardTitle>
            <CardDescription>
              Use o painel abaixo para editar suas informações pessoais, alterar senha e gerenciar configurações de segurança
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserProfile 
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-none bg-transparent",
                  headerTitle: "text-2xl font-bold text-foreground",
                  headerSubtitle: "text-muted-foreground",
                  formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
                  formFieldInput: "bg-background border-input text-foreground",
                  navbarButton: "text-foreground hover:bg-accent hover:text-accent-foreground",
                  navbarButtonIcon: "text-muted-foreground",
                  profileSectionTitle: "text-lg font-semibold text-foreground",
                  profileSectionContent: "text-muted-foreground",
                  accordionTriggerButton: "text-foreground hover:bg-accent",
                  formFieldLabel: "text-foreground font-medium",
                  identityPreviewText: "text-foreground",
                  identityPreviewEditButton: "text-primary hover:text-primary/90"
                },
                variables: {
                  colorPrimary: "hsl(var(--primary))",
                  colorBackground: "hsl(var(--background))",
                  colorText: "hsl(var(--foreground))",
                  colorTextSecondary: "hsl(var(--muted-foreground))",
                  colorDanger: "hsl(var(--destructive))",
                  colorSuccess: "hsl(var(--primary))",
                  colorWarning: "hsl(var(--warning))",
                  colorNeutral: "hsl(var(--muted))",
                  colorInputBackground: "hsl(var(--background))",
                  colorInputText: "hsl(var(--foreground))",
                  spacingUnit: "1rem",
                  borderRadius: "0.5rem"
                }
              }}
            />
          </CardContent>
        </Card>
      </div>
    </PageTemplate>
  );
} 