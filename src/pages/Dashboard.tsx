
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Users, Calendar, TrendingUp, DollarSign, Eye } from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Total de Propriedades",
      value: "847",
      change: "+12%",
      trend: "up",
      icon: Home,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Clientes Ativos",
      value: "1,234",
      change: "+8%",
      trend: "up",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Visitas Agendadas",
      value: "56",
      change: "+23%",
      trend: "up",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Receita Mensal",
      value: "R$ 487k",
      change: "+15%",
      trend: "up",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  const recentActivities = [
    { action: "Nova propriedade cadastrada", time: "2 min atrás", type: "property" },
    { action: "Cliente João Silva agendou visita", time: "15 min atrás", type: "meeting" },
    { action: "Contrato assinado - Apto 304", time: "1 hora atrás", type: "contract" },
    { action: "Novo lead via WhatsApp", time: "2 horas atrás", type: "lead" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral do seu negócio imobiliário</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600 border-green-200">
            Online
          </Badge>
          <Badge variant="secondary">Última atualização: agora</Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="imobipro-card hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                    <span className="text-sm text-gray-500 ml-1">vs mês anterior</span>
                  </div>
                </div>
                <div className={`${stat.bgColor} ${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
                <div className="h-64 bg-gradient-to-r from-imobipro-blue/10 to-imobipro-blue-dark/10 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Gráfico de receita será implementado aqui</p>
                </div>
              </TabsContent>
              <TabsContent value="properties" className="mt-6">
                <div className="h-64 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Gráfico de propriedades será implementado aqui</p>
                </div>
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
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-2 h-2 bg-imobipro-blue rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
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
              { name: "Nova Propriedade", icon: Home, color: "text-blue-600", bg: "bg-blue-50" },
              { name: "Adicionar Cliente", icon: Users, color: "text-green-600", bg: "bg-green-50" },
              { name: "Agendar Visita", icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
              { name: "Ver Relatórios", icon: Eye, color: "text-orange-600", bg: "bg-orange-50" },
            ].map((action, index) => (
              <button
                key={index}
                className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 text-center group"
              >
                <div className={`${action.bg} ${action.color} w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-900">{action.name}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
