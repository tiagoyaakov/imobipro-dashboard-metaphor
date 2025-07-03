import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Award, 
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  RefreshCw
} from 'lucide-react';
import { useContacts, useLeadScoring } from '../../../hooks/useCRMData';
import { Contact, LeadScore } from '../../../schemas/crm';

interface LeadScoreDashboardProps {
  className?: string;
}

export function LeadScoreDashboard({ className }: LeadScoreDashboardProps) {
  const { getContacts } = useContacts();
  const { getLeadScores } = useLeadScoring();
  
  const { data: contactsData, isLoading: contactsLoading } = getContacts();
  const { data: leadScores, isLoading: scoresLoading } = getLeadScores();
  
  // Processar dados para gráficos
  const dashboardData = useMemo(() => {
    if (!contactsData?.data || !leadScores) return null;
    
    const contacts = contactsData.data;
    const scoreMap = new Map(leadScores.map(score => [score.contactId, score]));
    
    // Distribuição por faixas de score
    const scoreDistribution = [
      { range: '0-20', count: 0, color: '#ef4444' },
      { range: '21-40', count: 0, color: '#f97316' },
      { range: '41-60', count: 0, color: '#eab308' },
      { range: '61-80', count: 0, color: '#22c55e' },
      { range: '81-100', count: 0, color: '#10b981' }
    ];
    
    // Métricas por categoria
    const categoryScores = new Map<string, { total: number; count: number; scores: number[] }>();
    
    // Top leads
    const topLeads: Array<{ contact: Contact; score: LeadScore }> = [];
    
    // Fatores médios
    const avgFactors = {
      engagement: 0,
      demographics: 0,
      behavior: 0,
      firmographics: 0
    };
    
    let totalFactors = 0;
    
    contacts.forEach(contact => {
      const score = scoreMap.get(contact.id);
      if (score) {
        // Distribuição por faixas
        if (score.score <= 20) scoreDistribution[0].count++;
        else if (score.score <= 40) scoreDistribution[1].count++;
        else if (score.score <= 60) scoreDistribution[2].count++;
        else if (score.score <= 80) scoreDistribution[3].count++;
        else scoreDistribution[4].count++;
        
        // Por categoria
        if (!categoryScores.has(contact.category)) {
          categoryScores.set(contact.category, { total: 0, count: 0, scores: [] });
        }
        const catData = categoryScores.get(contact.category)!;
        catData.total += score.score;
        catData.count++;
        catData.scores.push(score.score);
        
        // Top leads
        topLeads.push({ contact, score });
        
        // Fatores médios
        avgFactors.engagement += score.factors.engagement;
        avgFactors.demographics += score.factors.demographics;
        avgFactors.behavior += score.factors.behavior;
        avgFactors.firmographics += score.factors.firmographics;
        totalFactors++;
      }
    });
    
    // Finalizar cálculos
    if (totalFactors > 0) {
      avgFactors.engagement = Math.round(avgFactors.engagement / totalFactors);
      avgFactors.demographics = Math.round(avgFactors.demographics / totalFactors);
      avgFactors.behavior = Math.round(avgFactors.behavior / totalFactors);
      avgFactors.firmographics = Math.round(avgFactors.firmographics / totalFactors);
    }
    
    // Scores por categoria
    const categoryData = Array.from(categoryScores.entries()).map(([category, data]) => ({
      category: category === 'LEAD' ? 'Lead' : category === 'CLIENT' ? 'Cliente' : 'Parceiro',
      avgScore: Math.round(data.total / data.count),
      count: data.count,
      maxScore: Math.max(...data.scores),
      minScore: Math.min(...data.scores)
    }));
    
    // Top 10 leads
    topLeads.sort((a, b) => b.score.score - a.score.score);
    const top10Leads = topLeads.slice(0, 10);
    
    // Métricas gerais
    const totalContacts = contacts.length;
    const totalWithScores = leadScores.length;
    const avgScore = Math.round(leadScores.reduce((sum, score) => sum + score.score, 0) / leadScores.length);
    const hotLeads = leadScores.filter(score => score.score >= 80).length;
    
    return {
      scoreDistribution,
      categoryData,
      top10Leads,
      avgFactors,
      metrics: {
        totalContacts,
        totalWithScores,
        avgScore,
        hotLeads
      }
    };
  }, [contactsData, leadScores]);
  
  // Traduzir fatores para gráfico
  const factorsChartData = dashboardData ? [
    { name: 'Engajamento', value: dashboardData.avgFactors.engagement },
    { name: 'Demografia', value: dashboardData.avgFactors.demographics },
    { name: 'Comportamento', value: dashboardData.avgFactors.behavior },
    { name: 'Firmográficos', value: dashboardData.avgFactors.firmographics }
  ] : [];
  
  if (contactsLoading || scoresLoading) {
    return (
      <div className={className}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (!dashboardData) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              Não foi possível carregar os dados do dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Lead Scoring Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral das métricas de pontuação de leads
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>
      
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Contatos</p>
                <p className="text-2xl font-bold">{dashboardData.metrics.totalContacts}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Score Médio</p>
                <p className="text-2xl font-bold">{dashboardData.metrics.avgScore}</p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hot Leads</p>
                <p className="text-2xl font-bold">{dashboardData.metrics.hotLeads}</p>
              </div>
              <Award className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold">
                  {Math.round((dashboardData.metrics.hotLeads / dashboardData.metrics.totalContacts) * 100)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Gráficos */}
      <Tabs defaultValue="distribution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="factors">Fatores</TabsTrigger>
          <TabsTrigger value="topLeads">Top Leads</TabsTrigger>
        </TabsList>
        
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Distribuição por Faixas de Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  Distribuição Percentual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardData.scoreDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ range, count }) => `${range}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {dashboardData.scoreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scores por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dashboardData.categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgScore" fill="#10b981" name="Score Médio" />
                  <Bar dataKey="maxScore" fill="#3b82f6" name="Score Máximo" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="factors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fatores Médios de Pontuação</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={factorsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="topLeads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.top10Leads.map((item, index) => (
                  <div key={item.contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <img 
                          src={item.contact.avatar} 
                          alt={item.contact.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="font-medium">{item.contact.name}</p>
                          <p className="text-sm text-muted-foreground">{item.contact.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        item.score.score >= 80 ? 'bg-red-500' :
                        item.score.score >= 60 ? 'bg-orange-500' :
                        'bg-blue-500'
                      }>
                        {item.score.score}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}