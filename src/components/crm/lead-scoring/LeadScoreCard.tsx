import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Progress } from '../../ui/progress';
import { Separator } from '../../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { useToast } from '../../ui/use-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  Activity, 
  Building, 
  Edit3, 
  BarChart3,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { Contact, LeadScore } from '../../../schemas/crm';
import { useLeadScoring } from '../../../hooks/useCRMData';

interface LeadScoreCardProps {
  contact: Contact;
  className?: string;
}

export function LeadScoreCard({ contact, className }: LeadScoreCardProps) {
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [newScore, setNewScore] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const { toast } = useToast();
  
  const { getLeadScore, updateLeadScore } = useLeadScoring();
  const { data: leadScore, isLoading } = getLeadScore(contact.id);
  
  // Definir nível do score
  const getScoreLevel = (score: number) => {
    if (score >= 80) return { level: 'hot', color: 'bg-red-500', text: 'Hot Lead' };
    if (score >= 60) return { level: 'warm', color: 'bg-orange-500', text: 'Warm Lead' };
    if (score >= 40) return { level: 'cold', color: 'bg-blue-500', text: 'Cold Lead' };
    return { level: 'frozen', color: 'bg-gray-500', text: 'Frozen Lead' };
  };
  
  // Ícones para fatores
  const getFactorIcon = (factor: string) => {
    switch (factor) {
      case 'engagement': return <Activity className="w-4 h-4" />;
      case 'demographics': return <Users className="w-4 h-4" />;
      case 'behavior': return <Target className="w-4 h-4" />;
      case 'firmographics': return <Building className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };
  
  // Traduzir fatores
  const translateFactor = (factor: string) => {
    const translations = {
      engagement: 'Engajamento',
      demographics: 'Demografia',
      behavior: 'Comportamento',
      firmographics: 'Firmográficos'
    };
    return translations[factor as keyof typeof translations] || factor;
  };
  
  // Lidar com ajuste de score
  const handleScoreAdjustment = async () => {
    if (!leadScore || newScore < 0 || newScore > 100) {
      toast({
        title: "Erro de Validação",
        description: "O score deve estar entre 0 e 100",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await updateLeadScore.mutateAsync({
        contactId: contact.id,
        score: newScore
      });
      
      toast({
        title: "Score Atualizado",
        description: `Score do lead ${contact.name} atualizado para ${newScore}`,
      });
      
      setIsAdjustmentOpen(false);
      setNewScore(0);
      setAdjustmentReason('');
    } catch (error) {
      toast({
        title: "Erro ao Atualizar",
        description: "Erro ao atualizar o score. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Lead Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
            <div className="h-2 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!leadScore) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Score Não Disponível
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar o score para este contato.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const scoreLevel = getScoreLevel(leadScore.score);
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Lead Score
          </div>
          <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setNewScore(leadScore.score)}
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Ajustar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajustar Score do Lead</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="score">Novo Score (0-100)</Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max="100"
                    value={newScore}
                    onChange={(e) => setNewScore(parseInt(e.target.value))}
                    placeholder="Digite o novo score"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo do Ajuste</Label>
                  <Textarea
                    id="reason"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="Descreva o motivo do ajuste do score"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAdjustmentOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleScoreAdjustment}
                    disabled={updateLeadScore.isPending}
                  >
                    {updateLeadScore.isPending ? 'Atualizando...' : 'Atualizar Score'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Principal */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-bold">{leadScore.score}</span>
            <Badge className={`${scoreLevel.color} text-white`}>
              {scoreLevel.text}
            </Badge>
          </div>
          <Progress value={leadScore.score} className="w-full" />
          <p className="text-sm text-muted-foreground">
            Última atualização: {new Date(leadScore.lastCalculated).toLocaleDateString('pt-BR')}
          </p>
        </div>
        
        <Separator />
        
        {/* Fatores do Score */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Fatores de Influência</h4>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(leadScore.factors).map(([factor, value]) => (
              <div key={factor} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getFactorIcon(factor)}
                    <span className="text-sm">{translateFactor(factor)}</span>
                  </div>
                  <span className="text-sm font-medium">{value}</span>
                </div>
                <Progress value={value} className="h-2" />
              </div>
            ))}
          </div>
        </div>
        
        <Separator />
        
        {/* Tendência e Ações */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {leadScore.score >= 60 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm">
              {leadScore.score >= 60 ? 'Tendência Positiva' : 'Necessita Atenção'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {leadScore.score >= 80 && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
            {leadScore.score >= 40 && leadScore.score < 80 && (
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            )}
            {leadScore.score < 40 && (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
        </div>
        
        {/* Recomendações */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <h5 className="font-medium text-sm">Recomendações</h5>
          <div className="text-sm text-muted-foreground space-y-1">
            {leadScore.score >= 80 && (
              <p>• Este lead está pronto para conversão! Priorize o contato.</p>
            )}
            {leadScore.score >= 60 && leadScore.score < 80 && (
              <p>• Lead promissor. Continue o processo de nutrição.</p>
            )}
            {leadScore.score >= 40 && leadScore.score < 60 && (
              <p>• Aumente o engajamento com conteúdo relevante.</p>
            )}
            {leadScore.score < 40 && (
              <p>• Revisite a estratégia de abordagem deste lead.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}