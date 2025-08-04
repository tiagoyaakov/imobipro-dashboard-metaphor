import React from 'react';
import { Users, UserCheck, UserX, Home, Shield, User, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// -----------------------------------------------------------
// Interface para as estatísticas
// -----------------------------------------------------------

interface UserStatsData {
  total: number;
  active: number;
  inactive: number;
  byRole: {
    DEV_MASTER: number;
    ADMIN: number;
    AGENT: number;
  };
  recentSignups: number;
}

interface UserStatsProps {
  stats: UserStatsData;
  isLoading?: boolean;
}

// -----------------------------------------------------------
// Componente de Estatísticas de Usuários
// -----------------------------------------------------------

export const UserStats: React.FC<UserStatsProps> = ({ stats, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total de Usuários',
      value: stats.total,
      description: `${stats.recentSignups} novos nos últimos 7 dias`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Usuários Ativos',
      value: stats.active,
      description: `${((stats.active / stats.total) * 100).toFixed(1)}% do total`,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Usuários Inativos',
      value: stats.inactive,
      description: `${((stats.inactive / stats.total) * 100).toFixed(1)}% do total`,
      icon: UserX,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Por Função',
      value: null,
      description: 'Distribuição de funções',
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      customContent: (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-3 w-3 text-red-600" />
              <span className="text-xs font-medium">Dev Master</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {stats.byRole.DEV_MASTER}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="h-3 w-3 text-blue-600" />
              <span className="text-xs font-medium">Admin</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {stats.byRole.ADMIN}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-gray-600" />
              <span className="text-xs font-medium">Corretor</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {stats.byRole.AGENT}
            </Badge>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <Card key={index} className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {stat.customContent ? (
                stat.customContent
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default UserStats; 