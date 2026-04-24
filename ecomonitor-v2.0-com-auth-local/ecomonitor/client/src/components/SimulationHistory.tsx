import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar } from 'lucide-react';
import { trpc } from '@/lib/trpc';

const TYPE_COLORS: Record<string, string> = {
  fire: '#ef4444',
  water: '#3b82f6',
  pollution: '#f59e0b',
};

const TYPE_LABELS: Record<string, string> = {
  fire: '🔥 Incêndio',
  water: '💧 Hidrologia',
  pollution: '💨 Poluição',
};

export default function SimulationHistory() {
  const { data: simulations, isLoading } = trpc.simulations.getUserSimulations.useQuery({ 
    limit: 100 
  });

  // Transform data for charts
  const chartData = useMemo(() => {
    if (!simulations) return [];

    return simulations
      .slice()
      .reverse()
      .map((sim, index) => {
        try {
          const results = typeof sim.results === 'string' 
            ? JSON.parse(sim.results)
            : sim.results || {};
          return {
            id: sim.id,
            index: index + 1,
            type: sim.type,
            risk: (results as any)?.risk?.toFixed(1) || 0,
            timestamp: new Date(sim.createdAt).toLocaleDateString('pt-BR', { 
              month: 'short', 
              day: 'numeric' 
            }),
            fullDate: new Date(sim.createdAt),
          };
        } catch {
          return {
            id: sim.id,
            index: index + 1,
            type: sim.type,
            risk: 0,
            timestamp: new Date(sim.createdAt).toLocaleDateString('pt-BR', { 
              month: 'short', 
              day: 'numeric' 
            }),
            fullDate: new Date(sim.createdAt),
          };
        }
      });
  }, [simulations]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!chartData.length) return null;

    const avgRisk = (chartData.reduce((sum, d) => sum + Number(d.risk), 0) / chartData.length).toFixed(1);
    const maxRisk = Math.max(...chartData.map(d => Number(d.risk)));
    const minRisk = Math.min(...chartData.map(d => Number(d.risk)));
    const typeBreakdown = chartData.reduce((acc, d) => {
      acc[d.type] = (acc[d.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: chartData.length,
      avgRisk,
      maxRisk: maxRisk.toFixed(1),
      minRisk: minRisk.toFixed(1),
      typeBreakdown,
    };
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="pt-12 text-center">
          <div className="text-gray-400 mb-2">
            <Calendar className="w-12 h-12 mx-auto opacity-50" />
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Nenhuma simulação ainda. Comece criando uma!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-lg border-0">
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
            <p className="text-3xl font-bold text-emerald-600">{stats?.total}</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Risco Médio</p>
            <p className="text-3xl font-bold text-blue-600">{stats?.avgRisk}%</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Máximo</p>
            <p className="text-3xl font-bold text-red-600">{stats?.maxRisk}%</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Mínimo</p>
            <p className="text-3xl font-bold text-green-600">{stats?.minRisk}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Evolução do Risco
          </CardTitle>
          <CardDescription>
            Histórico de risco ao longo das simulações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  domain={[0, 100]}
                  label={{ value: 'Risco (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                  }}
                  formatter={(value) => `${value}%`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="risk"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Nível de Risco"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Distribution by Type */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>Distribuição por Tipo</CardTitle>
          <CardDescription>
            Quantidade de simulações por categoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={Object.entries(stats?.typeBreakdown || {}).map(([type, count]) => ({
                  type: TYPE_LABELS[type],
                  count,
                  fullType: type,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="type"
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  label={{ value: 'Quantidade', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                  }}
                />
                <Bar 
                  dataKey="count"
                  fill="#10b981"
                  radius={[8, 8, 0, 0]}
                  name="Simulações"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Risk by Type Over Time */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>Risco por Tipo (Histórico)</CardTitle>
          <CardDescription>
            Evolução do risco por tipo de simulação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="timestamp"
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                  }}
                  formatter={(value) => `${value}%`}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Legend />
                {Object.entries(TYPE_LABELS).map(([type, label]) => (
                  <Line
                    key={type}
                    type="monotone"
                    dataKey={(data) => data.type === type ? data.risk : null}
                    stroke={TYPE_COLORS[type]}
                    strokeWidth={2}
                    dot={false}
                    name={label}
                    isAnimationActive={true}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Badges for Type Specialists */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>Especialidades</CardTitle>
          <CardDescription>
            Você é especialista em:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {stats?.typeBreakdown && Object.entries(stats.typeBreakdown).map(([type, count]) => (
              <Badge 
                key={type}
                variant="outline"
                className="px-3 py-2 text-sm"
                style={{
                  borderColor: TYPE_COLORS[type],
                  color: TYPE_COLORS[type],
                }}
              >
                {TYPE_LABELS[type]} - {count} simulações
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
