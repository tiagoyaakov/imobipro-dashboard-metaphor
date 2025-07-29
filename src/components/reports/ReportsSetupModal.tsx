import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Calendar, 
  MessageSquare, 
  Mail, 
  FileDown,
  Users,
  DollarSign,
  TrendingUp,
  PhoneCall,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { QUICK_SETUP_CONFIGS, applyQuickSetup, SeedResult } from '@/utils/seedReports';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// ===================================================================
// TIPOS E INTERFACES
// ===================================================================

interface ReportsSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface SetupStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

// ===================================================================
// COMPONENTE PRINCIPAL
// ===================================================================

export function ReportsSetupModal({ open, onOpenChange, onComplete }: ReportsSetupModalProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<string>('');
  const [recipients, setRecipients] = useState<string[]>(['']);
  const [setupResult, setSetupResult] = useState<SeedResult | null>(null);

  const steps: SetupStep[] = [
    {
      id: 1,
      title: 'Bem-vindo aos Relatórios',
      description: 'Configure relatórios automáticos para sua empresa',
      completed: currentStep > 1
    },
    {
      id: 2,
      title: 'Escolher Configuração',
      description: 'Selecione o tipo de relatórios que deseja',
      completed: currentStep > 2
    },
    {
      id: 3,
      title: 'Configurar Destinatários',
      description: 'Defina quem receberá os relatórios',
      completed: currentStep > 3
    },
    {
      id: 4,
      title: 'Finalizar',
      description: 'Configuração concluída com sucesso',
      completed: setupResult?.success || false
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfigSelect = (configName: string) => {
    setSelectedConfig(configName);
    handleNext();
  };

  const addRecipient = () => {
    setRecipients([...recipients, '']);
  };

  const updateRecipient = (index: number, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handleFinishSetup = async () => {
    if (!user?.companyId || !user?.id || !selectedConfig) {
      toast.error('Dados de usuário não encontrados');
      return;
    }

    setIsLoading(true);
    try {
      const validRecipients = recipients.filter(r => r.trim().length > 0);
      
      const result = await applyQuickSetup(
        selectedConfig,
        user.companyId,
        user.id,
        validRecipients
      );

      setSetupResult(result);

      if (result.success) {
        toast.success(`✅ Configuração concluída! ${result.templatesCreated} templates criados`);
        handleNext();
        
        // Aguardar um pouco e fechar modal
        setTimeout(() => {
          onComplete();
          onOpenChange(false);
        }, 2000);
      } else {
        toast.error('Erro na configuração. Verifique os detalhes.');
      }

    } catch (error) {
      toast.error(`Erro ao configurar relatórios: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep onNext={handleNext} />;
      case 2:
        return <ConfigSelectionStep onSelect={handleConfigSelect} />;
      case 3:
        return (
          <RecipientsStep 
            recipients={recipients}
            onAdd={addRecipient}
            onUpdate={updateRecipient}
            onRemove={removeRecipient}
            onNext={handleFinishSetup}
            onBack={handleBack}
            isLoading={isLoading}
          />
        );
      case 4:
        return <CompletionStep result={setupResult} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <span>Configurar Módulo de Relatórios</span>
          </DialogTitle>
          <DialogDescription>
            Configure relatórios automáticos para sua empresa em poucos passos
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${step.completed 
                  ? 'bg-green-600 text-white' 
                  : currentStep === step.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }
              `}>
                {step.completed ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  step.id
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  h-1 w-16 mx-2
                  ${step.completed ? 'bg-green-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-4">
          {renderStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===================================================================
// STEP COMPONENTS
// ===================================================================

const WelcomeStep = ({ onNext }: { onNext: () => void }) => (
  <div className="text-center space-y-6">
    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
      <FileText className="h-8 w-8 text-blue-600" />
    </div>
    
    <div>
      <h3 className="text-xl font-semibold mb-2">
        Bem-vindo ao Módulo de Relatórios! 📊
      </h3>
      <p className="text-muted-foreground">
        Configure relatórios automáticos para acompanhar as métricas mais importantes 
        do seu negócio imobiliário.
      </p>
    </div>

    <div className="grid grid-cols-2 gap-4 text-sm">
      <div className="flex items-center space-x-2">
        <DollarSign className="h-4 w-4 text-green-600" />
        <span>Relatórios de Vendas</span>
      </div>
      <div className="flex items-center space-x-2">
        <Users className="h-4 w-4 text-blue-600" />
        <span>Conversão de Leads</span>
      </div>
      <div className="flex items-center space-x-2">
        <PhoneCall className="h-4 w-4 text-purple-600" />
        <span>Agendamentos</span>
      </div>
      <div className="flex items-center space-x-2">
        <MessageSquare className="h-4 w-4 text-green-600" />
        <span>Envio via WhatsApp</span>
      </div>
    </div>

    <Button onClick={onNext} className="w-full">
      Começar Configuração
    </Button>
  </div>
);

const ConfigSelectionStep = ({ onSelect }: { onSelect: (config: string) => void }) => (
  <div className="space-y-4">
    <div className="text-center mb-6">
      <h3 className="text-lg font-semibold mb-2">Escolha sua Configuração</h3>
      <p className="text-muted-foreground">
        Selecione o conjunto de relatórios que melhor atende suas necessidades
      </p>
    </div>

    <div className="grid gap-4">
      {QUICK_SETUP_CONFIGS.map((config) => (
        <Card 
          key={config.name} 
          className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-200"
          onClick={() => onSelect(config.name)}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{config.name}</CardTitle>
              <Badge variant="outline">
                {config.templates.length} relatórios
              </Badge>
            </div>
            <CardDescription>{config.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium">Inclui:</p>
              <div className="flex flex-wrap gap-2">
                {config.templates.map((template) => (
                  <Badge key={template} variant="secondary" className="text-xs">
                    {getTemplateLabel(template)}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const RecipientsStep = ({ 
  recipients, 
  onAdd, 
  onUpdate, 
  onRemove, 
  onNext, 
  onBack, 
  isLoading 
}: {
  recipients: string[];
  onAdd: () => void;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}) => (
  <div className="space-y-4">
    <div className="text-center mb-6">
      <h3 className="text-lg font-semibold mb-2">Configure os Destinatários</h3>
      <p className="text-muted-foreground">
        Adicione os números WhatsApp ou emails que receberão os relatórios
      </p>
    </div>

    <div className="space-y-3">
      <Label>Destinatários dos Relatórios</Label>
      {recipients.map((recipient, index) => (
        <div key={index} className="flex space-x-2">
          <Input
            placeholder="Ex: +5511999999999 ou email@empresa.com"
            value={recipient}
            onChange={(e) => onUpdate(index, e.target.value)}
            className="flex-1"
          />
          {recipients.length > 1 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onRemove(index)}
            >
              Remover
            </Button>
          )}
        </div>
      ))}
      
      <Button variant="outline" onClick={onAdd} className="w-full">
        + Adicionar Destinatário
      </Button>
    </div>

    <div className="bg-blue-50 p-4 rounded-lg">
      <div className="flex items-start space-x-2">
        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-blue-900">Dica:</p>
          <p className="text-blue-700">
            Você pode pular esta etapa e configurar os destinatários depois.
            Os relatórios serão criados mas não serão enviados automaticamente.
          </p>
        </div>
      </div>
    </div>

    <div className="flex space-x-2 pt-4">
      <Button variant="outline" onClick={onBack} className="flex-1">
        Voltar
      </Button>
      <Button onClick={onNext} disabled={isLoading} className="flex-1">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Configurando...
          </>
        ) : (
          'Finalizar Configuração'
        )}
      </Button>
    </div>
  </div>
);

const CompletionStep = ({ result }: { result: SeedResult | null }) => (
  <div className="text-center space-y-6">
    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
      <CheckCircle className="h-8 w-8 text-green-600" />
    </div>

    <div>
      <h3 className="text-xl font-semibold mb-2 text-green-700">
        Configuração Concluída! 🎉
      </h3>
      <p className="text-muted-foreground">
        Seus relatórios automáticos foram configurados com sucesso
      </p>
    </div>

    {result && (
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span>Templates criados:</span>
            <span className="font-medium">{result.templatesCreated}</span>
          </div>
          <div className="flex justify-between">
            <span>Agendamentos criados:</span>
            <span className="font-medium">{result.scheduledReportsCreated}</span>
          </div>
        </div>
      </div>
    )}

    <div className="text-sm text-muted-foreground">
      <p>Os relatórios já estão disponíveis no painel principal.</p>
      <p>Você pode personalizar templates e agendamentos a qualquer momento.</p>
    </div>
  </div>
);

// ===================================================================
// UTILITÁRIOS
// ===================================================================

function getTemplateLabel(templateType: string): string {
  const labels: Record<string, string> = {
    WEEKLY_SALES: 'Vendas Semanais',
    LEAD_CONVERSION: 'Conversão de Leads',
    APPOINTMENT_SUMMARY: 'Agendamentos',
    AGENT_PERFORMANCE: 'Performance'
  };
  return labels[templateType] || templateType;
}