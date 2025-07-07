import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useSalesPerformance, useNewPropertiesPerformance } from '@/hooks/useDashboardData';

interface DashboardPerformanceChartProps {
  companyId: string;
  type: 'revenue' | 'properties';
}

const DashboardPerformanceChart = ({ companyId, type }: DashboardPerformanceChartProps) => {
  const { data: salesData, isLoading: isLoadingSales } = useSalesPerformance(companyId, 6);
  const { data: propertiesData, isLoading: isLoadingProperties } = useNewPropertiesPerformance(companyId, 6);

  const isLoading = type === 'revenue' ? isLoadingSales : isLoadingProperties;
  const chartData = type === 'revenue' ? salesData : propertiesData;
  const dataKey = type === 'revenue' ? 'total_sales' : 'new_properties';
  const strokeColor = type === 'revenue' ? '#3b82f6' : '#10b981';

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
        <p className="text-muted-foreground">Não há dados suficientes para exibir o gráfico.</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5, right: 30, left: 20, bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
            }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={strokeColor}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DashboardPerformanceChart; 