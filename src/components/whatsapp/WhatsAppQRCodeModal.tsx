/**
 * 🔗 ImobiPRO - Modal de QR Code WhatsApp
 * 
 * Modal para exibir QR code e gerenciar conexão WhatsApp.
 * Inclui renovação de QR code e simulação de conexão.
 * 
 * @author ImobiPRO Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  QrCode,
  RefreshCw,
  Smartphone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { WhatsAppInstance } from '@/services/whatsappService';

interface WhatsAppQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  instance: WhatsAppInstance | null;
  onRefreshQR: () => void;
  onSimulateConnection: (phoneNumber: string) => void;
  isRefreshing: boolean;
  isSimulating: boolean;
}

export const WhatsAppQRCodeModal: React.FC<WhatsAppQRCodeModalProps> = ({
  isOpen,
  onClose,
  instance,
  onRefreshQR,
  onSimulateConnection,
  isRefreshing,
  isSimulating
}) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [showQRCode, setShowQRCode] = useState(true);
  const [simulatePhone, setSimulatePhone] = useState('');
  const [showSimulation, setShowSimulation] = useState(false);

  // Atualizar contador de tempo
  useEffect(() => {
    if (!instance?.qrCodeExpiry) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(instance.qrCodeExpiry!).getTime();
      const remaining = Math.max(0, expiry - now);
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [instance?.qrCodeExpiry]);

  const formatTimeLeft = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const copyQRCode = () => {
    if (instance?.qrCode) {
      navigator.clipboard.writeText(instance.qrCode);
      toast({
        title: "📋 QR Code copiado",
        description: "Código QR copiado para a área de transferência",
      });
    }
  };

  const handleSimulateConnection = () => {
    if (!simulatePhone.trim()) {
      toast({
        variant: "destructive",
        title: "❌ Número necessário",
        description: "Digite um número de telefone para simular a conexão",
      });
      return;
    }

    onSimulateConnection(simulatePhone);
  };

  const isExpired = timeLeft <= 0;
  const progressValue = instance?.qrCodeExpiry 
    ? Math.max(0, (timeLeft / (5 * 60 * 1000)) * 100)
    : 0;

  if (!instance) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Code WhatsApp
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR code com seu WhatsApp para conectar a instância
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status da conexão */}
          <Card className="imobipro-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  {instance.displayName || 'Instância WhatsApp'}
                </CardTitle>
                <Badge 
                  variant={instance.status === 'QR_CODE_PENDING' ? 'warning' : 'secondary'}
                  className="text-xs"
                >
                  {instance.status === 'QR_CODE_PENDING' ? 'Aguardando' : instance.status}
                </Badge>
              </div>
            </CardHeader>
            
            {instance.status === 'QR_CODE_PENDING' && (
              <CardContent className="pt-0">
                {/* Timer de expiração */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Tempo restante</span>
                    <span className={`font-medium ${isExpired ? 'text-red-500' : 'text-yellow-600'}`}>
                      {isExpired ? 'Expirado' : formatTimeLeft(timeLeft)}
                    </span>
                  </div>
                  <Progress value={progressValue} className="h-2" />
                  {isExpired && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      QR Code expirado. Clique em "Renovar" para gerar um novo.
                    </p>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* QR Code */}
          {instance.qrCode && (
            <Card className="imobipro-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">QR Code</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQRCode(!showQRCode)}
                  >
                    {showQRCode ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showQRCode ? (
                  <div className="space-y-3">
                    {/* Simulação visual do QR Code */}
                    <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                        <div className="grid grid-cols-8 gap-1 p-4">
                          {Array.from({ length: 64 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-sm ${
                                Math.random() > 0.5 ? 'bg-white' : 'bg-gray-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-2">
                        Abra o WhatsApp no seu celular e escaneie este código
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyQRCode}
                        className="text-xs"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copiar código
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">QR Code oculto</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Simulação de conexão (desenvolvimento) */}
          {process.env.NODE_ENV === 'development' && (
            <Card className="imobipro-card border-dashed border-orange-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-500" />
                    Simulação (Dev)
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSimulation(!showSimulation)}
                  >
                    {showSimulation ? 'Ocultar' : 'Mostrar'}
                  </Button>
                </div>
              </CardHeader>
              
              {showSimulation && (
                <CardContent className="space-y-3">
                  <CardDescription className="text-xs">
                    Para fins de desenvolvimento, você pode simular uma conexão bem-sucedida
                  </CardDescription>
                  
                  <div className="space-y-2">
                    <Label htmlFor="simulatePhone" className="text-xs">
                      Número de telefone
                    </Label>
                    <Input
                      id="simulatePhone"
                      placeholder="Ex: +55 11 99999-9999"
                      value={simulatePhone}
                      onChange={(e) => setSimulatePhone(e.target.value)}
                      size="sm"
                    />
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={handleSimulateConnection}
                    disabled={isSimulating}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    {isSimulating ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                        Simulando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3 mr-2" />
                        Simular Conexão
                      </>
                    )}
                  </Button>
                </CardContent>
              )}
            </Card>
          )}

          {/* Instruções */}
          <Card className="imobipro-card bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="space-y-2 text-xs">
                <h4 className="font-medium text-blue-900">Como conectar:</h4>
                <ol className="space-y-1 text-blue-800 list-decimal list-inside">
                  <li>Abra o WhatsApp no seu celular</li>
                  <li>Vá em Configurações → Aparelhos conectados</li>
                  <li>Toque em "Conectar um aparelho"</li>
                  <li>Escaneie o QR code acima</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              variant="outline"
              onClick={onClose}
              className="sm:w-auto w-full"
            >
              Fechar
            </Button>
            
            <Button
              onClick={onRefreshQR}
              disabled={isRefreshing}
              className="sm:w-auto w-full bg-imobipro-blue hover:bg-imobipro-blue/90"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Renovando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Renovar QR Code
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppQRCodeModal;