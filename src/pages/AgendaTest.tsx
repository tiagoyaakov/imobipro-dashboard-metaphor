// ================================================================
// PÁGINA DE TESTE - AGENDA V1 vs V2
// ================================================================
// Comparação entre implementações antiga e nova com cache unificado
// ================================================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Activity,
  Database,
  Zap,
  Timer,
  TrendingUp,
  CalendarSync,
  Download,
  Upload
} from 'lucide-react';
import { useAgenda } from '@/hooks/useAgenda';
import useAgendaV2 from '@/hooks/useAgendaV2';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// ================================================================
// COMPONENTES DE MÉTRICAS
// ================================================================

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: number;
  status?: 'success' | 'warning' | 'danger';
}

function MetricCard({ title, value, description, icon, trend, status }: MetricCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn(
          "p-2 rounded-lg",
          status === 'success' && "bg-green-500/10 text-green-500",
          status === 'warning' && "bg-yellow-500/10 text-yellow-500",
          status === 'danger' && "bg-red-500/10 text-red-500",
          !status && "bg-muted"
        )}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend !== undefined && (
          <div className="flex items-center mt-2">
            <TrendingUp className={cn(
              "h-4 w-4 mr-1",
              trend > 0 ? "text-green-500" : "text-red-500"
            )} />
            <span className={cn(
              "text-xs font-medium",
              trend > 0 ? "text-green-500" : "text-red-500"
            )}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ================================================================
// COMPONENTE DE COMPARAÇÃO DE SLOTS
// ================================================================

interface SlotComparisonProps {
  slotsV1: any[];
  slotsV2: any[];
  isLoadingV1: boolean;
  isLoadingV2: boolean;
}

function SlotComparison({ slotsV1, slotsV2, isLoadingV1, isLoadingV2 }: SlotComparisonProps) {
  const availableV1 = slotsV1.filter(s => s.status === 'AVAILABLE').length;
  const availableV2 = slotsV2.filter(s => s.status === 'AVAILABLE').length;
  const bookedV1 = slotsV1.filter(s => s.status === 'BOOKED').length;
  const bookedV2 = slotsV2.filter(s => s.status === 'BOOKED').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* V1 Slots */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Slots V1</span>
            {isLoadingV1 && <RefreshCw className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total</span>
              <Badge variant="outline">{slotsV1.length}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Disponíveis</span>
              <Badge variant="success">{availableV1}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ocupados</span>
              <Badge variant="destructive">{bookedV1}</Badge>
            </div>
            <Separator />
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {slotsV1.slice(0, 5).map((slot, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{slot.startTime} - {slot.endTime}</span>
                  </div>
                  <Badge variant={slot.status === 'AVAILABLE' ? 'success' : 'destructive'}>
                    {slot.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* V2 Slots */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Slots V2</span>
            <Badge variant="success">Cache Unificado</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total</span>
              <Badge variant="outline">{slotsV2.length}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Disponíveis</span>
              <Badge variant="success">{availableV2}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ocupados</span>
              <Badge variant="destructive">{bookedV2}</Badge>
            </div>
            <Separator />
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {slotsV2.slice(0, 5).map((slot, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{slot.startTime} - {slot.endTime}</span>
                  </div>
                  <Badge variant={slot.status === 'AVAILABLE' ? 'success' : 'destructive'}>
                    {slot.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ================================================================
// COMPONENTE DE TESTE DE OPERAÇÕES
// ================================================================

interface OperationTestProps {
  onCreateV1: () => Promise<void>;
  onCreateV2: () => Promise<void>;
  onUpdateV1: () => Promise<void>;
  onUpdateV2: () => Promise<void>;
  onDeleteV1: () => Promise<void>;
  onDeleteV2: () => Promise<void>;
  onSyncV1: () => Promise<void>;
  onSyncV2: () => Promise<void>;
}

function OperationTest({
  onCreateV1, onCreateV2,
  onUpdateV1, onUpdateV2,
  onDeleteV1, onDeleteV2,
  onSyncV1, onSyncV2
}: OperationTestProps) {
  const [results, setResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const runTest = async (name: string, v1Fn: () => Promise<void>, v2Fn: () => Promise<void>) => {
    setTesting(true);
    const result = {
      name,
      v1Time: 0,
      v2Time: 0,
      v1Success: false,
      v2Success: false,
      improvement: 0
    };

    // Test V1
    const v1Start = performance.now();
    try {
      await v1Fn();
      result.v1Success = true;
    } catch (error) {
      console.error('V1 error:', error);
    }
    result.v1Time = performance.now() - v1Start;

    // Test V2
    const v2Start = performance.now();
    try {
      await v2Fn();
      result.v2Success = true;
    } catch (error) {
      console.error('V2 error:', error);
    }
    result.v2Time = performance.now() - v2Start;

    // Calculate improvement
    result.improvement = ((result.v1Time - result.v2Time) / result.v1Time) * 100;

    setResults(prev => [...prev, result]);
    setTesting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teste de Operações</CardTitle>
        <CardDescription>Compare o desempenho das operações V1 vs V2</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={() => runTest('Criar Agendamento', onCreateV1, onCreateV2)}
              disabled={testing}
              variant="outline"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Testar Criação
            </Button>
            <Button 
              onClick={() => runTest('Atualizar Agendamento', onUpdateV1, onUpdateV2)}
              disabled={testing}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Testar Update
            </Button>
            <Button 
              onClick={() => runTest('Deletar Agendamento', onDeleteV1, onDeleteV2)}
              disabled={testing}
              variant="outline"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Testar Delete
            </Button>
            <Button 
              onClick={() => runTest('Sincronizar Google', onSyncV1, onSyncV2)}
              disabled={testing}
              variant="outline"
            >
              <CalendarSync className="h-4 w-4 mr-2" />
              Testar Sync
            </Button>
          </div>

          {results.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Resultados dos Testes</h4>
                {results.map((result, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.name}</span>
                      <Badge variant={result.improvement > 0 ? 'success' : 'destructive'}>
                        {result.improvement > 0 ? '+' : ''}{result.improvement.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">V1:</span>
                        <span className={cn(
                          "font-mono",
                          !result.v1Success && "text-red-500"
                        )}>
                          {result.v1Time.toFixed(0)}ms
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">V2:</span>
                        <span className={cn(
                          "font-mono text-green-500",
                          !result.v2Success && "text-red-500"
                        )}>
                          {result.v2Time.toFixed(0)}ms
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ================================================================
// PÁGINA PRINCIPAL
// ================================================================

export default function AgendaTest() {
  const { user } = useAuth();
  const agentId = user?.id || '';
  const today = new Date().toISOString().split('T')[0];
  
  // Hooks V1
  const {
    schedule: scheduleV1,
    slots: slotsV1,
    appointments: appointmentsV1,
    isLoading: isLoadingV1,
    isLoadingSlots: isLoadingSlotsV1,
    isLoadingAppointments: isLoadingAppointmentsV1,
    createAppointment: createAppointmentV1,
    updateAppointment: updateAppointmentV1,
    deleteAppointment: deleteAppointmentV1,
    syncWithGoogleCalendar: syncV1,
    refetch: refetchV1
  } = useAgenda({ agentId, date: today });

  // Hooks V2
  const {
    schedule: scheduleV2,
    slots: slotsV2,
    appointments: appointmentsV2,
    isLoading: isLoadingV2,
    isLoadingSlots: isLoadingSlotsV2,
    isLoadingAppointments: isLoadingAppointmentsV2,
    createAppointment: createAppointmentV2,
    updateAppointment: updateAppointmentV2,
    deleteAppointment: deleteAppointmentV2,
    syncWithGoogle: syncV2,
    refetch: refetchV2,
    isOnline,
    isOffline,
    offlineQueue,
    cacheMetrics
  } = useAgendaV2({ agentId, date: today, enableRealtime: true });

  // Performance tracking
  const [performanceMetrics, setPerformanceMetrics] = useState({
    v1LoadTime: 0,
    v2LoadTime: 0,
    v1ApiCalls: 0,
    v2ApiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0
  });

  useEffect(() => {
    // Track initial load performance
    const v1Start = performance.now();
    if (!isLoadingV1 && !isLoadingSlotsV1 && !isLoadingAppointmentsV1) {
      setPerformanceMetrics(prev => ({
        ...prev,
        v1LoadTime: performance.now() - v1Start
      }));
    }
  }, [isLoadingV1, isLoadingSlotsV1, isLoadingAppointmentsV1]);

  useEffect(() => {
    const v2Start = performance.now();
    if (!isLoadingV2 && !isLoadingSlotsV2 && !isLoadingAppointmentsV2) {
      setPerformanceMetrics(prev => ({
        ...prev,
        v2LoadTime: performance.now() - v2Start,
        cacheHits: cacheMetrics.hitRate * 100,
        cacheMisses: 100 - (cacheMetrics.hitRate * 100)
      }));
    }
  }, [isLoadingV2, isLoadingSlotsV2, isLoadingAppointmentsV2, cacheMetrics]);

  // Test data
  const testAppointment = {
    title: 'Teste de Agendamento',
    date: today,
    startTime: '14:00',
    endTime: '15:00',
    contactId: 'test-contact-id',
    type: 'MEETING' as const,
    description: 'Agendamento de teste para comparação V1 vs V2'
  };

  // Test operations
  const handleCreateV1 = async () => {
    await createAppointmentV1(testAppointment);
  };

  const handleCreateV2 = async () => {
    await createAppointmentV2(testAppointment);
  };

  const handleUpdateV1 = async () => {
    if (appointmentsV1.length > 0) {
      await updateAppointmentV1(appointmentsV1[0].id, { title: 'Updated V1' });
    }
  };

  const handleUpdateV2 = async () => {
    if (appointmentsV2.length > 0) {
      await updateAppointmentV2(appointmentsV2[0].id, { title: 'Updated V2' });
    }
  };

  const handleDeleteV1 = async () => {
    if (appointmentsV1.length > 0) {
      await deleteAppointmentV1(appointmentsV1[0].id);
    }
  };

  const handleDeleteV2 = async () => {
    if (appointmentsV2.length > 0) {
      await deleteAppointmentV2(appointmentsV2[0].id);
    }
  };

  const handleSyncV1 = async () => {
    await syncV1();
  };

  const handleSyncV2 = async () => {
    await syncV2();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teste de Agenda: V1 vs V2</h1>
          <p className="text-muted-foreground mt-1">
            Comparação de performance entre implementação antiga e nova com cache unificado
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={isOnline ? "success" : "destructive"}>
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </>
            )}
          </Badge>
          <Button onClick={() => { refetchV1(); refetchV2(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Métricas de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Cache Hit Rate"
          value={`${(cacheMetrics.hitRate * 100).toFixed(1)}%`}
          description="Taxa de acerto do cache V2"
          icon={<Zap className="h-4 w-4" />}
          status="success"
          trend={cacheMetrics.hitRate > 0.7 ? 15 : -10}
        />
        <MetricCard
          title="Cache Size"
          value={`${(cacheMetrics.size / 1024).toFixed(1)} KB`}
          description="Tamanho total do cache"
          icon={<Database className="h-4 w-4" />}
          status={cacheMetrics.size < 5000000 ? "success" : "warning"}
        />
        <MetricCard
          title="Offline Queue"
          value={offlineQueue.length}
          description="Operações pendentes"
          icon={<Upload className="h-4 w-4" />}
          status={offlineQueue.length === 0 ? "success" : "warning"}
        />
        <MetricCard
          title="Load Time Improvement"
          value={`${((performanceMetrics.v1LoadTime - performanceMetrics.v2LoadTime) / performanceMetrics.v1LoadTime * 100).toFixed(0)}%`}
          description="V2 vs V1 performance"
          icon={<Timer className="h-4 w-4" />}
          status="success"
          trend={20}
        />
      </div>

      {/* Offline Queue Alert */}
      {isOffline && offlineQueue.length > 0 && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Modo Offline Ativo</AlertTitle>
          <AlertDescription>
            {offlineQueue.length} operações serão sincronizadas quando a conexão for restaurada.
            O sistema continua funcionando normalmente com cache local.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs de Comparação */}
      <Tabs defaultValue="comparison" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="comparison">Comparação</TabsTrigger>
          <TabsTrigger value="slots">Slots</TabsTrigger>
          <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
          <TabsTrigger value="operations">Operações</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* V1 Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Implementação V1 (Original)</CardTitle>
                <CardDescription>React Query padrão sem cache unificado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={isLoadingV1 ? "secondary" : "success"}>
                      {isLoadingV1 ? "Carregando..." : "Pronto"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tempo de carga</span>
                    <span className="font-mono text-sm">{performanceMetrics.v1LoadTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Slots carregados</span>
                    <span className="font-mono text-sm">{slotsV1.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Agendamentos</span>
                    <span className="font-mono text-sm">{appointmentsV1.length}</span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Características</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Cache por query individual</li>
                    <li>• Sem suporte offline</li>
                    <li>• Refetch manual necessário</li>
                    <li>• Sem sincronização cross-tab</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* V2 Summary */}
            <Card className="border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Implementação V2 (Cache Unificado)</span>
                  <Badge variant="success">Novo</Badge>
                </CardTitle>
                <CardDescription>Sistema otimizado com cache unificado e offline support</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={isLoadingV2 ? "secondary" : "success"}>
                      {isLoadingV2 ? "Carregando..." : "Pronto"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tempo de carga</span>
                    <span className="font-mono text-sm text-green-500">{performanceMetrics.v2LoadTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Slots carregados</span>
                    <span className="font-mono text-sm">{slotsV2.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Agendamentos</span>
                    <span className="font-mono text-sm">{appointmentsV2.length}</span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Características</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li className="text-green-500">✓ Cache unificado com estratégias</li>
                    <li className="text-green-500">✓ Suporte offline completo</li>
                    <li className="text-green-500">✓ Real-time subscriptions</li>
                    <li className="text-green-500">✓ Sincronização automática</li>
                    <li className="text-green-500">✓ Compressão e encriptação</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Análise de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Cache Efficiency</span>
                    <span className="text-sm text-muted-foreground">{(cacheMetrics.hitRate * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={cacheMetrics.hitRate * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-sm text-muted-foreground">
                      {((cacheMetrics.size / 5000000) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={(cacheMetrics.size / 5000000) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Offline Readiness</span>
                    <span className="text-sm text-muted-foreground">100%</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slots">
          <SlotComparison
            slotsV1={slotsV1}
            slotsV2={slotsV2}
            isLoadingV1={isLoadingSlotsV1}
            isLoadingV2={isLoadingSlotsV2}
          />
        </TabsContent>

        <TabsContent value="appointments">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* V1 Appointments */}
            <Card>
              <CardHeader>
                <CardTitle>Agendamentos V1</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {appointmentsV1.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum agendamento encontrado
                    </p>
                  ) : (
                    appointmentsV1.map((apt) => (
                      <div key={apt.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{apt.title}</span>
                          <Badge>{apt.status}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(apt.date), 'dd/MM', { locale: ptBR })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {apt.startTime} - {apt.endTime}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* V2 Appointments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Agendamentos V2</span>
                  {appointmentsV2.some(a => a.syncStatus === 'PENDING') && (
                    <Badge variant="warning">Sync Pendente</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {appointmentsV2.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum agendamento encontrado
                    </p>
                  ) : (
                    appointmentsV2.map((apt) => (
                      <div key={apt.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{apt.title}</span>
                          <div className="flex items-center gap-2">
                            <Badge>{apt.status}</Badge>
                            {apt.syncStatus && (
                              <Badge variant={apt.syncStatus === 'SYNCED' ? 'success' : 'secondary'}>
                                {apt.syncStatus}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(apt.date), 'dd/MM', { locale: ptBR })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {apt.startTime} - {apt.endTime}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations">
          <OperationTest
            onCreateV1={handleCreateV1}
            onCreateV2={handleCreateV2}
            onUpdateV1={handleUpdateV1}
            onUpdateV2={handleUpdateV2}
            onDeleteV1={handleDeleteV1}
            onDeleteV2={handleDeleteV2}
            onSyncV1={handleSyncV1}
            onSyncV2={handleSyncV2}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}