/**
 * 🔲 ImobiPRO - Status dos Sistemas de Lead
 * 
 * Componente de diagnóstico que mostra o status de conectividade
 * dos sistemas de criação de lead (Supabase e n8n).
 * 
 * @author ImobiPRO Team
 * @version 1.0.0
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Database,
  Webhook
} from 'lucide-react';
import { 
  useLeadSystemDiagnostic, 
  useLeadSystemConfig,
  useTestLeadCreation 
} from '@/hooks/useLeadCreation';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function LeadSystemStatus() {
  const { data: diagnostic, isLoading, refetch } = useLeadSystemDiagnostic();
  const { data: config } = useLeadSystemConfig();
  const testLead = useTestLeadCreation();

  const handleRefresh = () => {
    refetch();
  };

  const handleTest = () => {
    testLead.mutate();
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Status dos Sistemas de Lead
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status do Supabase */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-gray-600" />
              <span className="font-medium">Supabase Database</span>
            </div>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : diagnostic?.supabase.available ? (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Conectado
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <XCircle className="h-4 w-4 text-red-600" />
                <Badge variant="destructive">
                  Erro
                </Badge>
              </div>
            )}
          </div>
          
          {diagnostic?.supabase.error && (
            <div className="ml-6 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <strong>Erro:</strong> {diagnostic.supabase.error}
            </div>
          )}
        </div>

        <Separator />

        {/* Status do n8n */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Webhook className="h-4 w-4 text-gray-600" />
              <span className="font-medium">n8n Webhook</span>
            </div>
            {!config?.hasN8nUrl ? (
              <Badge variant="outline" className="text-gray-600">
                Não configurado
              </Badge>
            ) : isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : diagnostic?.n8n.available ? (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Conectado
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <XCircle className="h-4 w-4 text-red-600" />
                <Badge variant="destructive">
                  Erro
                </Badge>
              </div>
            )}
          </div>
          
          {diagnostic?.n8n.error && (
            <div className="ml-6 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <strong>Erro:</strong> {diagnostic.n8n.error}
            </div>
          )}
        </div>

        <Separator />

        {/* Configuração Atual */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Configuração Atual</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Método primário:</span>
              <div className="font-medium">
                {config?.useN8nPrimary ? 'n8n Webhook' : 'Supabase Direto'}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Fallback:</span>
              <div className="font-medium">
                {config?.fallbackToSupabase ? 'Habilitado' : 'Desabilitado'}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Ações de Teste */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={testLead.isPending}
            className="flex-1"
          >
            {testLead.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Testar Criação
          </Button>
        </div>

        {/* Recomendações */}
        {diagnostic && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <h5 className="font-medium text-blue-900 mb-2">💡 Recomendações</h5>
            <div className="text-sm text-blue-800 space-y-1">
              {!diagnostic.supabase.available && (
                <div>• Verificar permissões RLS na tabela Contact do Supabase</div>
              )}
              {!diagnostic.n8n.available && config?.hasN8nUrl && (
                <div>• Verificar se o servidor n8n está executando</div>
              )}
              {diagnostic.supabase.available && diagnostic.n8n.available && (
                <div>• ✅ Todos os sistemas estão funcionais</div>
              )}
              {!config?.hasN8nUrl && (
                <div>• Configure NEXT_PUBLIC_N8N_WEBHOOK_URL para habilitar integração n8n</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPONENTE COMPACTO PARA HEADER
// ============================================================================

export function LeadSystemStatusCompact() {
  const { data: diagnostic, isLoading } = useLeadSystemDiagnostic();

  if (isLoading) {
    return (
      <div className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs text-gray-500">Verificando...</span>
      </div>
    );
  }

  const supabaseOk = diagnostic?.supabase.available;
  const n8nOk = diagnostic?.n8n.available;
  const hasIssues = !supabaseOk || !n8nOk;

  return (
    <div className="flex items-center gap-1">
      {hasIssues ? (
        <AlertCircle className="h-3 w-3 text-amber-600" />
      ) : (
        <CheckCircle className="h-3 w-3 text-green-600" />
      )}
      <span className="text-xs text-gray-600">
        {hasIssues ? 'Sistemas com problemas' : 'Sistemas OK'}
      </span>
    </div>
  );
}