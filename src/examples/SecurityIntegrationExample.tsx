import { usePermissions } from '@/hooks/security/usePermissions';
import { ProtectedRoute, ProtectedAction } from '@/components/security/ProtectedRoute';
import { securityService } from '@/services/security/SecurityService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Building, FileText, Settings } from 'lucide-react';

/**
 * Exemplo de integração dos componentes de segurança
 * Este arquivo demonstra como usar os hooks, componentes e serviços de segurança
 */
export function SecurityIntegrationExample() {
  const { 
    user, 
    role, 
    isAdmin, 
    validateAction, 
    canEdit,
    canDelete 
  } = usePermissions();

  // Exemplo 1: Ação protegida com validação
  const handleCreateCompany = async () => {
    const canCreate = validateAction('companies.create', {
      errorMessage: 'Apenas DEV_MASTER pode criar empresas'
    });

    if (canCreate) {
      // Validação adicional no backend
      const validation = await securityService.validateAction({
        type: 'CREATE',
        resource: 'company',
        data: { name: 'Nova Empresa' }
      });

      if (validation.allowed) {
        console.log('Criar empresa...');
      } else {
        console.error('Bloqueado pelo backend:', validation.reason);
      }
    }
  };

  // Exemplo 2: Ação condicional baseada em propriedade
  const handleEditProperty = async (propertyId: string, ownerId: string) => {
    if (canEdit('property', ownerId)) {
      console.log('Editar propriedade:', propertyId);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Exemplos de Segurança</h1>
      
      {/* Informações do usuário atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Usuário Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Nome:</strong> {user?.name || 'Não autenticado'}</p>
            <p><strong>Email:</strong> {user?.email || '-'}</p>
            <p><strong>Role:</strong> {role || '-'}</p>
            <p><strong>Empresa:</strong> {user?.company_id || '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Exemplo 1: Rotas Protegidas */}
      <Card>
        <CardHeader>
          <CardTitle>1. Rotas Protegidas</CardTitle>
          <CardDescription>
            Use ProtectedRoute para proteger páginas inteiras
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Rota apenas para DEV_MASTER */}
          <ProtectedRoute 
            requiredRole="DEV_MASTER"
            fallback={<p className="text-muted-foreground">⚠️ Acesso restrito a DEV_MASTER</p>}
          >
            <div className="p-4 bg-destructive/10 rounded-lg">
              <p className="text-destructive">🔴 Área DEV_MASTER - Gerenciar Sistema</p>
            </div>
          </ProtectedRoute>

          {/* Rota para ADMIN ou DEV_MASTER */}
          <ProtectedRoute 
            requiredRole={['DEV_MASTER', 'ADMIN']}
            fallback={<p className="text-muted-foreground">⚠️ Acesso restrito a administradores</p>}
          >
            <div className="p-4 bg-blue-500/10 rounded-lg">
              <p className="text-blue-600">🔵 Área Administrativa - Gerenciar Empresa</p>
            </div>
          </ProtectedRoute>

          {/* Rota com permissão específica */}
          <ProtectedRoute 
            requiredPermission="reports.create"
            fallback={<p className="text-muted-foreground">⚠️ Sem permissão para criar relatórios</p>}
          >
            <div className="p-4 bg-green-500/10 rounded-lg">
              <p className="text-green-600">🟢 Criar Novo Relatório</p>
            </div>
          </ProtectedRoute>
        </CardContent>
      </Card>

      {/* Exemplo 2: Ações Protegidas */}
      <Card>
        <CardHeader>
          <CardTitle>2. Ações Protegidas</CardTitle>
          <CardDescription>
            Use ProtectedAction para ocultar/desabilitar elementos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Botão visível apenas para ADMIN */}
          <div className="flex gap-4">
            <ProtectedAction requiredRole="ADMIN">
              <Button variant="default">
                <Users className="mr-2 h-4 w-4" />
                Gerenciar Usuários (ADMIN)
              </Button>
            </ProtectedAction>

            <ProtectedAction 
              requiredRole="DEV_MASTER"
              fallback={
                <Button variant="outline" disabled>
                  <Building className="mr-2 h-4 w-4" />
                  Criar Empresa (Bloqueado)
                </Button>
              }
            >
              <Button variant="destructive" onClick={handleCreateCompany}>
                <Building className="mr-2 h-4 w-4" />
                Criar Empresa (DEV_MASTER)
              </Button>
            </ProtectedAction>
          </div>

          {/* Ação com validação customizada */}
          <ProtectedAction 
            customCheck={() => isAdmin()}
            showError={true}
          >
            <Button variant="secondary">
              <Settings className="mr-2 h-4 w-4" />
              Configurações Avançadas
            </Button>
          </ProtectedAction>
        </CardContent>
      </Card>

      {/* Exemplo 3: Validações Programáticas */}
      <Card>
        <CardHeader>
          <CardTitle>3. Validações Programáticas</CardTitle>
          <CardDescription>
            Use hooks para validar ações no código
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button 
              onClick={() => {
                const hasAccess = validateAction(() => canEdit('property', user?.id), {
                  errorMessage: 'Você não pode editar esta propriedade'
                });
                
                if (hasAccess) {
                  console.log('Editando propriedade...');
                }
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              Tentar Editar Propriedade
            </Button>

            <Button 
              variant="outline"
              onClick={() => {
                validateAction('users.impersonate', {
                  errorMessage: 'Apenas ADMIN e DEV_MASTER podem usar impersonation',
                  successCallback: () => console.log('Abrindo modal de impersonation...')
                });
              }}
            >
              Tentar Impersonation
            </Button>

            <Button 
              variant="destructive"
              onClick={() => {
                if (canDelete('contact', user?.id)) {
                  console.log('Deletando contato...');
                } else {
                  console.log('Sem permissão para deletar');
                }
              }}
            >
              Verificar Delete de Contato
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exemplo 4: Validação Backend */}
      <Card>
        <CardHeader>
          <CardTitle>4. Validação com SecurityService</CardTitle>
          <CardDescription>
            Validações adicionais antes de chamar o Supabase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={async () => {
              // Validar no frontend primeiro
              if (!validateAction('users.create')) return;

              // Validar no serviço de segurança
              const validation = await securityService.validateAction({
                type: 'CREATE',
                resource: 'user',
                data: { role: 'AGENT' }
              });

              if (validation.allowed) {
                console.log('Prosseguir com criação do usuário...');
                // Chamar Supabase aqui
              } else {
                console.error('Bloqueado:', validation.reason);
              }
            }}
          >
            Criar Novo Usuário (Com Validação Dupla)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Exemplo de uso em uma página real
 */
export function RealWorldExample() {
  return (
    <ProtectedRoute 
      requiredRole={['ADMIN', 'DEV_MASTER']}
      redirectTo="/dashboard"
    >
      <div className="p-6">
        <h1>Página de Administração</h1>
        
        <ProtectedAction 
          requiredPermission="users.create"
          fallback={<p>Você não tem permissão para criar usuários</p>}
        >
          <Button>Criar Usuário</Button>
        </ProtectedAction>
        
        <ProtectedAction requiredRole="DEV_MASTER">
          <Button variant="destructive">Ação Perigosa (DEV_MASTER apenas)</Button>
        </ProtectedAction>
      </div>
    </ProtectedRoute>
  );
}