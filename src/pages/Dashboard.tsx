import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Home, Users, Calendar, TrendingUp, TrendingDown, DollarSign, Eye, RefreshCw, Minus, AlertCircle } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { useGlobal, useGlobalSelections } from "@/contexts/GlobalContext";
import { GlobalSelectionIndicator, SyncBadge, useNotifications } from "@/components/common/GlobalNotifications";
import { useCrossModuleSync } from "@/hooks/useCrossModuleSync";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const Dashboard = () => {
  const [chartPeriod, setChartPeriod] = useState('6months');
  
  const {
    stats,
    chartData,
    activities,
    isLoading,
    isLoadingStats,
    isLoadingCharts,
    isLoadingActivities,
    hasError,
    statsError,
    chartsError,
    activitiesError,
    refetchAll,
    isOnline
  } = useDashboard({
    chartPeriod,
    activitiesLimit: 10,
    enableRealtime: true
  });

  // Sistema global
  const { isSyncing } = useGlobal();
  const { property, contact, appointment } = useGlobalSelections();
  const { syncWithProperty, syncWithContact } = useCrossModuleSync();
  const notify = useNotifications();

  const handleRefresh = useCallback(() => {
    refetchAll();
    notify.info('Atualizando dados', 'Sincronizando informações do dashboard...');
  }, [refetchAll, notify]);

  // Handlers de demonstração para ações rápidas
  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'Nova Propriedade':
        property.select('demo-property-123');
        notify.success('Propriedade selecionada', 'Navegue para o módulo de propriedades para continuar');
        break;
      case 'Adicionar Cliente':
        contact.select('demo-contact-456');
        notify.success('Contato selecionado', 'Navegue para o módulo de contatos para continuar');
        break;
      case 'Agendar Visita':
        appointment.select('demo-appointment-789');
        notify.success('Agendamento selecionado', 'Navegue para a agenda para continuar');
        break;
      case 'Ver Relatórios':
        notify.info('Relatórios', 'Navegue para o módulo de relatórios para visualizar');
        break;
      default:
        notify.warning('Ação não disponível', 'Esta funcionalidade está em desenvolvimento');
    }
  }, [property, contact, appointment, notify]);

  // Função para obter ícone de tendência
  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return TrendingUp;
      case 'down':
        return TrendingDown;
      default:
        return Minus;
    }
  };

  // Função para obter cor da tendência
  const getTrendColor = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-imobipro-success';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  // Mapear tipo de atividade para ícone
  const getActivityIcon = (type: string) => {
    const iconMap = {
      property: '🏠',
      contact: '👤',
      appointment: '📅',
      deal: '💰',
      other: '📌'
    };
    return iconMap[type as keyof typeof iconMap] || '📌';
  };

  const statsConfig = [
    {
      title: "Total de Propriedades",
      key: 'totalProperties' as const,
      icon: Home,
      color: "text-imobipro-blue",
      bgColor: "bg-imobipro-blue/10",
    },
    {
      title: "Clientes Ativos",
      key: 'activeClients' as const,
      icon: Users,
      color: "text-imobipro-success",
      bgColor: "bg-imobipro-success/10",
    },
    {
      title: "Visitas Agendadas",
      key: 'weeklyAppointments' as const,
      icon: Calendar,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
    {
      title: "Receita Mensal",
      key: 'monthlyRevenue' as const,
      icon: DollarSign,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral do seu negócio imobiliário</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={cn(
              "border",
              isOnline 
                ? "text-imobipro-success border-imobipro-success/30" 
                : "text-red-400 border-red-400/30"
            )}
          >
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
          {stats?.lastUpdated && (
            <Badge variant="secondary">
              Atualizado: {new Date(stats.lastUpdated).toLocaleTimeString('pt-BR')}
            </Badge>
          )}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            title="Atualizar dados"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Global Selection Indicators */}
      {(property.id || contact.id || appointment.id) && (
        <div className="flex items-center gap-3 flex-wrap">
          {property.id && (
            <GlobalSelectionIndicator
              type="property"
              id={property.id}
              onClear={() => property.select(null)}
            />
          )}
          {contact.id && (
            <GlobalSelectionIndicator
              type="contact"
              id={contact.id}
              onClear={() => contact.select(null)}
            />
          )}
          {appointment.id && (
            <GlobalSelectionIndicator
              type="appointment"
              id={appointment.id}
              onClear={() => appointment.select(null)}
            />
          )}
          <SyncBadge isSyncing={isSyncing} />
        </div>
      )}

      {/* Error Alert */}
      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar dados. Por favor, tente novamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((config) => {
          const statData = stats?.[config.key];
          const TrendIcon = statData ? getTrendIcon(statData.trend) : Minus;
          
          return (
            <Card key={config.key} className="imobipro-card hover:shadow-lg">
              <CardContent className="p-6">
                {isLoadingStats ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ) : statData ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{config.title}</p>
                      <p className="text-2xl font-bold text-foreground mt-2">
                        {config.key === 'monthlyRevenue' 
                          ? statData.formatted || `R$ ${statData.value.toLocaleString('pt-BR')}`
                          : statData.value.toLocaleString('pt-BR')
                        }
                      </p>
                      <div className="flex items-center mt-2">
                        <TrendIcon className={cn("h-4 w-4 mr-1", getTrendColor(statData.trend))} />
                        <span className={cn("text-sm font-medium", getTrendColor(statData.trend))}>
                          {statData.change}
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">vs mês anterior</span>
                      </div>
                    </div>
                    <div className={`${config.bgColor} ${config.color} p-3 rounded-xl`}>
                      <config.icon className="h-6 w-6" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Sem dados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <Card className="lg:col-span-2 imobipro-card">
          <CardHeader>
            <CardTitle>Performance de Vendas</CardTitle>
            <CardDescription>Receita dos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="revenue" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="revenue">Receita</TabsTrigger>
                <TabsTrigger value="properties">Propriedades</TabsTrigger>
              </TabsList>
              <TabsContent value="revenue" className="mt-6">
                {isLoadingCharts ? (
                  <Skeleton className="h-64 w-full" />
                ) : chartsError ? (
                  <div className="h-64 bg-red-500/10 rounded-lg flex items-center justify-center">
                    <p className="text-red-400">Erro ao carregar gráfico</p>
                  </div>
                ) : chartData?.salesData && chartData.salesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={256}>
                    <LineChart data={chartData.salesData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="month" 
                        className="text-xs"
                        tick={{ fill: 'currentColor' }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: 'currentColor' }}
                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--imobipro-blue))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--imobipro-blue))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 bg-gradient-to-r from-imobipro-blue/10 to-imobipro-blue-dark/10 rounded-lg flex items-center justify-center border border-border">
                    <p className="text-muted-foreground">Sem dados de receita disponíveis</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="properties" className="mt-6">
                {isLoadingCharts ? (
                  <Skeleton className="h-64 w-full" />
                ) : chartsError ? (
                  <div className="h-64 bg-red-500/10 rounded-lg flex items-center justify-center">
                    <p className="text-red-400">Erro ao carregar gráfico</p>
                  </div>
                ) : chartData?.propertyData && chartData.propertyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={256}>
                    <BarChart data={chartData.propertyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="month" 
                        className="text-xs"
                        tick={{ fill: 'currentColor' }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: 'currentColor' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar 
                        dataKey="sold" 
                        name="Vendidas"
                        fill="hsl(var(--imobipro-success))" 
                      />
                      <Bar 
                        dataKey="rented" 
                        name="Alugadas"
                        fill="hsl(var(--imobipro-blue))" 
                      />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 bg-gradient-to-r from-imobipro-success/10 to-emerald-400/10 rounded-lg flex items-center justify-center border border-border">
                    <p className="text-muted-foreground">Sem dados de propriedades disponíveis</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="imobipro-card">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>Últimas ações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingActivities ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-start gap-3 p-3">
                    <Skeleton className="w-2 h-2 rounded-full mt-2" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : activitiesError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Erro ao carregar atividades
                  </AlertDescription>
                </Alert>
              ) : activities && activities.length > 0 ? (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="text-xl flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma atividade recente
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="imobipro-card">
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Acesse as funcionalidades mais utilizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Nova Propriedade", icon: Home, color: "text-imobipro-blue", bg: "bg-imobipro-blue/10" },
              { name: "Adicionar Cliente", icon: Users, color: "text-imobipro-success", bg: "bg-imobipro-success/10" },
              { name: "Agendar Visita", icon: Calendar, color: "text-purple-400", bg: "bg-purple-400/10" },
              { name: "Ver Relatórios", icon: Eye, color: "text-orange-400", bg: "bg-orange-400/10" },
            ].map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.name)}
                className="p-4 rounded-xl border border-border hover:border-border/80 hover:shadow-md transition-all duration-200 text-center group hover:bg-muted/30"
              >
                <div className={`${action.bg} ${action.color} w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-foreground">{action.name}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
