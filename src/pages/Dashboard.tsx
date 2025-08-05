import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Target, 
  BarChart3, 
  Zap, 
  TrendingUp, 
  Activity, 
  Award,
  RefreshCw,
  Settings
} from 'lucide-react';
import { 
  LeadScoreCard, 
  LeadScoreDashboard, 
  SegmentationRules, 
  AutomationBuilder 
} from '@/components/crm';
import { useCRMData } from '@/hooks/useCRMData';
import { useAuth } from '@/hooks/useAuth';
import type { Contact, Deal, LeadScore } from '@/schemas/crm';

// Tipos para os dados retornados pelos hooks
interface ContactsResponse {
  data: Contact[];
  total: number;
}

interface DealsResponse {
  data: Deal[];
  total: number;
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Detector de callback OAuth redirecionado incorretamente
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasOAuthParams = urlParams.has('code') || urlParams.has('error');
    
    if (hasOAuthParams) {
      console.log('🔄 OAuth callback detectado na home, redirecionando para callback correto...');
      console.log('URL atual:', window.location.href);
      console.log('Search params:', window.location.search);
      console.log('Code presente:', urlParams.has('code'));
      console.log('Error presente:', urlParams.has('error'));
      
      // Redirecionar para o callback correto mantendo os parâmetros
      navigate(`/auth/google/callback${window.location.search}`, { replace: true });
    }
  }, [navigate]);
  
  // Hooks do CRM - usando a estrutura correta
  const { 
    contacts, 
    deals, 
    leadScoring, 
    activities 
  } = useCRMData();
  
  const { data: contactsData, isLoading: contactsLoading } = contacts.getContacts();
  const { data: dealsData, isLoading: dealsLoading } = deals.getDeals();
  const { data: leadScores, isLoading: scoresLoading } = leadScoring.getLeadScores();
  const { data: activitiesData, isLoading: activitiesLoading } = activities.getActivities();
  
  // Métricas resumidas
  const metrics = useMemo(() => {
    if (!(contactsData as ContactsResponse)?.data || !leadScores || !(dealsData as DealsResponse)?.data) {
      return {
        totalContacts: 0,
        hotLeads: 0,
        avgScore: 0,
        activeAutomations: 0,
        totalDeals: 0,
        recentActivities: 0
      };
    }
    
    const contactsArray = (contactsData as ContactsResponse).data;
    const dealsArray = (dealsData as DealsResponse).data;
    
    const hotLeads = (leadScores as LeadScore[]).filter(score => score.score >= 80).length;
    const avgScore = Math.round(
      (leadScores as LeadScore[]).reduce((sum: number, score: LeadScore) => sum + score.score, 0) / (leadScores as LeadScore[]).length
    );
    
    return {
      totalContacts: contactsArray.length,
      hotLeads,
      avgScore,
      activeAutomations: 2, // Simulado
      totalDeals: dealsArray.length,
      recentActivities: activitiesData?.length || 0
    };
  }, [contactsData, leadScores, dealsData, activitiesData]);
  
  const isLoading = contactsLoading || dealsLoading || scoresLoading || activitiesLoading;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Sistema completo de gestão de relacionamento com clientes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
        </div>
      </div>
      
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Contatos</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : metrics.totalContacts}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.hotLeads} hot leads
                </p>
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
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : metrics.avgScore}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.hotLeads > 0 ? '+' : ''}{metrics.hotLeads} desde ontem
                </p>
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
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : metrics.hotLeads}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((metrics.hotLeads / metrics.totalContacts) * 100 || 0)}% do total
                </p>
              </div>
              <Award className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Automações</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : metrics.activeAutomations}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.activeAutomations} ativas
                </p>
              </div>
              <Zap className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Separator />
      
      {/* Tabs Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="scoring" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Lead Scoring
          </TabsTrigger>
          <TabsTrigger value="segmentation" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Segmentação
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Automação
          </TabsTrigger>
        </TabsList>
        
        {/* Tab: Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Dashboard de Lead Scoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LeadScoreDashboard />
              </CardContent>
            </Card>
            
            {/* Atividades Recentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Atividades Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activitiesData?.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{activity.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.type} • {activity.entityType || 'Sistema'}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{activity.type}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(activity.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-muted-foreground text-center py-4">
                        Nenhuma atividade encontrada
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Tab: Lead Scoring */}
        <TabsContent value="scoring" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Lead Scoring</h2>
                <p className="text-muted-foreground">
                  Gerencie a pontuação dos seus leads
                </p>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {metrics.totalContacts} contatos
              </Badge>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-200 rounded w-full"></div>
                        <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {(contactsData as ContactsResponse)?.data?.map((contact) => (
                  <LeadScoreCard 
                    key={contact.id} 
                    contact={contact}
                    className="h-fit"
                  />
                )) || (
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground">
                      Nenhum contato encontrado
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Tab: Segmentação */}
        <TabsContent value="segmentation" className="space-y-6">
          <SegmentationRules />
        </TabsContent>
        
        {/* Tab: Automação */}
        <TabsContent value="automation" className="space-y-6">
          <AutomationBuilder />
        </TabsContent>
      </Tabs>
      
      {/* Status da Integração */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            MODO DESENVOLVIMENTO
          </Badge>
          <Badge variant="outline">
            Dados Mockados
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Esta página está usando dados mockados para desenvolvimento isolado. 
          Todos os componentes e funcionalidades estão integrados e funcionais.
          {user && ` Usuário atual: ${user.name} (${user.role})`}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
