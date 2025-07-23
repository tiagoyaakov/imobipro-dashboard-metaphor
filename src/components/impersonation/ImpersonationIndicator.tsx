import React from 'react';
import { Eye, AlertTriangle, X } from 'lucide-react';
import { useImpersonation } from '@/hooks/useImpersonation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// -----------------------------------------------------------
// Indicador Visual de Impersonation Ativa
// -----------------------------------------------------------

export const ImpersonationIndicator: React.FC = () => {
  const { 
    isImpersonating, 
    impersonatedUser, 
    canImpersonate,
    endImpersonation,
    isEnding
  } = useImpersonation();

  // Não mostrar se não for admin ou não estiver impersonando
  if (!canImpersonate || !isImpersonating || !impersonatedUser) {
    return null;
  }

  const handleEndImpersonation = async () => {
    try {
      await endImpersonation();
    } catch (error) {
      console.error('Erro ao finalizar impersonation:', error);
    }
  };

  return (
    <Card className="bg-gradient-to-r from-orange-100 to-yellow-100 border-orange-300 shadow-sm">
      <CardContent className="px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <Eye className="h-4 w-4 text-orange-600" />
            </div>
            
            <div>
              <p className="text-sm font-medium text-orange-900">
                Testando como: <span className="font-semibold">{impersonatedUser.name}</span>
              </p>
              <p className="text-xs text-orange-700">
                Você está vendo o sistema na visão deste usuário
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-orange-200 text-orange-800 text-xs">
              Modo Teste
            </Badge>
            
            <Button
              onClick={handleEndImpersonation}
              disabled={isEnding}
              size="sm"
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-200"
            >
              {isEnding ? (
                'Saindo...'
              ) : (
                <>
                  <X className="h-3 w-3 mr-1" />
                  Sair
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImpersonationIndicator; 