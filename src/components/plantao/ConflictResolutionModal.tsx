// Modal para resolução de conflitos de sincronização
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  MapPin, 
  User,
  CheckCircle,
  XCircle,
  Merge,
  Loader2
} from "lucide-react";
import { SyncConflict, ConflictType } from "@/types/googleCalendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: SyncConflict[];
  onResolveConflict: (
    conflict: SyncConflict, 
    strategy: 'KEEP_LOCAL' | 'KEEP_GOOGLE'
  ) => Promise<boolean>;
  onClearConflicts: () => void;
  isResolving?: boolean;
}

export function ConflictResolutionModal({
  isOpen,
  onClose,
  conflicts,
  onResolveConflict,
  onClearConflicts,
  isResolving = false
}: ConflictResolutionModalProps) {
  
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set());

  // Handler para resolver conflito individual
  const handleResolveConflict = async (
    conflict: SyncConflict, 
    strategy: 'KEEP_LOCAL' | 'KEEP_GOOGLE'
  ) => {
    const conflictId = `${conflict.type}-${conflict.localEvent?.id || 'unknown'}-${conflict.googleEvent?.id || 'unknown'}`;
    
    setResolvingIds(prev => new Set(prev).add(conflictId));
    
    try {
      const success = await onResolveConflict(conflict, strategy);
      
      if (success) {
        // Conflito foi removido da lista automaticamente pelo hook
      }
      
    } catch (error) {
      console.error('Erro ao resolver conflito:', error);
    } finally {
      setResolvingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(conflictId);
        return newSet;
      });
    }
  };

  // Renderizar badge do tipo de conflito
  const renderConflictTypeBadge = (type: ConflictType) => {
    switch (type) {
      case ConflictType.TIME_OVERLAP:
        return (
          <Badge variant="destructive" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Sobreposição
          </Badge>
        );
      case ConflictType.ORPHANED_EVENT:
        return (
          <Badge variant="secondary" className="text-xs">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Órfão
          </Badge>
        );
      case ConflictType.EXTERNAL_CONFLICT:
        return (
          <Badge variant="outline" className="text-xs">
            <Calendar className="w-3 h-3 mr-1" />
            Externo
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Conflito
          </Badge>
        );
    }
  };

  // Renderizar detalhes do evento
  const renderEventDetails = (
    event: any, 
    title: string, 
    source: 'local' | 'google'
  ) => {
    if (!event) return null;

    const startDate = source === 'local' 
      ? event.startDate 
      : new Date(event.start?.dateTime || event.start?.date || '');
    
    const endDate = source === 'local'
      ? event.endDate
      : new Date(event.end?.dateTime || event.end?.date || '');

    return (
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {source === 'local' ? (
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
            ) : (
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            )}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className="text-sm">
            <p className="font-medium">{event.title || event.summary}</p>
            {(event.description || event.description) && (
              <p className="text-muted-foreground text-xs mt-1">
                {event.description || event.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(startDate, "dd/MM HH:mm", { locale: ptBR })} - {format(endDate, "HH:mm", { locale: ptBR })}
            </div>
            
            {(event.location || event.location) && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {event.location || event.location}
              </div>
            )}
            
            {source === 'local' && event.corretor && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {event.corretor.name}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Renderizar conflito individual
  const renderConflict = (conflict: SyncConflict, index: number) => {
    const conflictId = `${conflict.type}-${conflict.localEvent?.id || 'unknown'}-${conflict.googleEvent?.id || 'unknown'}`;
    const isResolving = resolvingIds.has(conflictId);

    return (
      <div key={index} className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        {/* Header do conflito */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {renderConflictTypeBadge(conflict.type)}
            <span className="text-sm font-medium">Conflito #{index + 1}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleResolveConflict(conflict, 'KEEP_LOCAL')}
              disabled={isResolving}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              {isResolving ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="w-3 h-3 mr-1" />
              )}
              Manter Local
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleResolveConflict(conflict, 'KEEP_GOOGLE')}
              disabled={isResolving}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              {isResolving ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="w-3 h-3 mr-1" />
              )}
              Manter Google
            </Button>
          </div>
        </div>

        {/* Descrição do conflito */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            {conflict.description}
          </p>
          {conflict.suggestedResolution && (
            <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
              <strong>Sugestão:</strong> {conflict.suggestedResolution}
            </p>
          )}
        </div>

        {/* Eventos em conflito */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {conflict.localEvent && renderEventDetails(
            conflict.localEvent, 
            "Evento Local (ImobiPRO)", 
            'local'
          )}
          
          {conflict.googleEvent && renderEventDetails(
            conflict.googleEvent, 
            "Evento Google Calendar", 
            'google'
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Resolver Conflitos de Sincronização
          </DialogTitle>
          <DialogDescription>
            {conflicts.length} conflito{conflicts.length > 1 ? 's' : ''} detectado{conflicts.length > 1 ? 's' : ''} durante a sincronização. 
            Escolha como resolver cada um:
          </DialogDescription>
        </DialogHeader>

        {conflicts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Nenhum conflito encontrado</p>
            <p className="text-muted-foreground">Todos os eventos foram sincronizados com sucesso!</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {conflicts.map((conflict, index) => renderConflict(conflict, index))}
            </div>
          </ScrollArea>
        )}

        <Separator />

        <div className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {conflicts.length > 0 && (
              <p>
                💡 <strong>Dica:</strong> "Manter Local" preserva os dados do ImobiPRO. 
                "Manter Google" usa os dados do Google Calendar.
              </p>
            )}
          </div>
          
          <div className="flex gap-3">
            {conflicts.length > 0 && (
              <Button
                variant="outline"
                onClick={onClearConflicts}
                disabled={isResolving}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Limpar Todos
              </Button>
            )}
            
            <Button onClick={onClose} disabled={isResolving}>
              {conflicts.length === 0 ? 'Fechar' : 'Cancelar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}