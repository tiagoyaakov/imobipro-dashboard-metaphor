import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Trash2, Shield, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const AuthDebugPanel: React.FC = () => {
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const clearCache = async () => {
    try {
      // Limpar todo o cache do React Query
      await queryClient.clear();
      
      // Invalidar queries específicas
      await queryClient.invalidateQueries({ queryKey: ['auth'] });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      
      toast({
        title: 'Cache Limpo',
        description: 'O cache foi limpo. Recarregando dados...',
      });
      
      // Recarregar a página após 1 segundo
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      toast({
        title: 'Erro ao limpar cache',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const refreshUserData = async () => {
    try {
      // Invalidar cache do usuário
      await queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      
      // Buscar sessão novamente
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData.session) {
        // Buscar dados do usuário novamente
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', sessionData.session.user.id)
          .single();
          
        console.log('🔄 Dados atualizados:', userData);
        
        toast({
          title: 'Dados Atualizados',
          description: 'Os dados do usuário foram recarregados.',
        });
      }
      
    } catch (error) {
      toast({
        title: 'Erro ao atualizar dados',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const debugAuth = async () => {
    // Executar função de debug do authDebug.ts
    if (typeof (window as any).debugAuth === 'function') {
      await (window as any).debugAuth();
      toast({
        title: 'Debug Executado',
        description: 'Verifique o console para detalhes.',
      });
    }
  };

  if (import.meta.env.PROD) {
    return null; // Não mostrar em produção
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 z-50 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Debug de Autenticação
        </CardTitle>
        <CardDescription>
          Ferramenta temporária para resolver problemas de role
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Atual */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Status Atual:</h4>
          <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
            <p><strong>Email:</strong> {user?.email || 'Não logado'}</p>
            <p><strong>Role:</strong> <span className={user?.role === 'DEV_MASTER' ? 'text-green-500' : 'text-red-500'}>{user?.role || 'N/A'}</span></p>
            <p><strong>ID:</strong> {user?.id || 'N/A'}</p>
            <p><strong>Loading:</strong> {isLoading ? 'Sim' : 'Não'}</p>
          </div>
        </div>

        {/* Alerta */}
        {user?.role !== 'DEV_MASTER' && user?.email === '1992tiagofranca@gmail.com' && (
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-md">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-500">Problema Detectado!</p>
              <p className="text-muted-foreground">Seu role está incorreto. Use os botões abaixo para corrigir.</p>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="space-y-2">
          <Button
            onClick={clearCache}
            variant="destructive"
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar Cache Completo
          </Button>
          
          <Button
            onClick={refreshUserData}
            variant="secondary"
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Recarregar Dados do Usuário
          </Button>
          
          <Button
            onClick={debugAuth}
            variant="outline"
            className="w-full"
          >
            <Shield className="w-4 h-4 mr-2" />
            Executar Debug Completo
          </Button>
        </div>

        {/* Instruções */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>1. Clique em "Limpar Cache Completo"</p>
          <p>2. Aguarde a página recarregar</p>
          <p>3. Faça login novamente se necessário</p>
          <p>4. Seu role deve aparecer como DEV_MASTER</p>
        </div>
      </CardContent>
    </Card>
  );
};