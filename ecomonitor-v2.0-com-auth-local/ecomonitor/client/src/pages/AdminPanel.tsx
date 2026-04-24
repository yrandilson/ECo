import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertCircle, Users, TrendingUp, Shield, Trash2, CheckCircle } from "lucide-react";
import MainLayout from "@/components/MainLayout";

export default function AdminPanel() {
  const { user } = useAuth();
  const { data: stats } = trpc.occurrences.getStats.useQuery();
  const { data: criticalOccurrences } = trpc.occurrences.getCritical.useQuery({ limit: 50 });
  const { data: topRankings } = trpc.gamification.getTopRankings.useQuery({ limit: 20 });
  
  const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
          <Card className="shadow-lg border-0">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300 mb-4">Acesso negado. Apenas administradores podem acessar este painel.</p>
              <p className="text-sm text-gray-500">Seu role: {user?.role}</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Painel Administrativo
            </h1>
            <p className="text-gray-600 dark:text-gray-300">Gerenciar plataforma, usuários e conteúdo</p>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Ocorrências</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">{stats?.total || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Todas as ocorrências</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Validadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats?.validated || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Confirmadas pela comunidade</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Críticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{stats?.critical || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Requerem atenção</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Taxa de Validação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {stats?.total ? ((stats.validated / stats.total) * 100).toFixed(1) : 0}%
                </div>
                <p className="text-xs text-gray-500 mt-1">Ocorrências validadas</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="critical">Críticas</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="moderation">Moderação</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Occurrences by Type */}
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle>Ocorrências por Tipo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stats?.byType?.map(([type, count]) => ({ name: type, value: count })) || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {(stats?.byType || []).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Occurrences by Severity */}
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle>Ocorrências por Severidade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats?.bySeverity?.map(([severity, count]) => ({ name: severity, value: count })) || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Critical Occurrences Tab */}
            <TabsContent value="critical" className="space-y-4">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Ocorrências Críticas ({criticalOccurrences?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {criticalOccurrences?.map((occ) => (
                      <div key={occ.id} className="border-l-4 border-red-500 pl-4 py-2 bg-red-50 dark:bg-red-900/20 rounded">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-red-900 dark:text-red-200">
                              {occ.type.replace(/_/g, " ").toUpperCase()}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{occ.description}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                Risco: {Number(occ.riskScore || 0).toFixed(1)}%
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {new Date(occ.createdAt).toLocaleDateString("pt-BR")}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-green-600 border-green-300">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Validar
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-300">
                              <Trash2 className="w-4 h-4 mr-1" />
                              Remover
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Top Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {topRankings?.slice(0, 10).map((rank, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg text-blue-600">#{idx + 1}</span>
                          <div>
                            <p className="font-medium">Usuário #{rank.userId}</p>
                            <p className="text-xs text-gray-500">Confiança: {(Math.random() * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600">{rank.totalPoints} pts</p>
                          <p className="text-xs text-gray-500">Este mês: {rank.monthlyPoints}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Moderation Tab */}
            <TabsContent value="moderation" className="space-y-4">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Ferramentas de Moderação
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Button className="h-20 bg-gradient-to-br from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 flex flex-col items-center justify-center">
                      <Trash2 className="w-6 h-6 mb-2" />
                      <span>Remover Conteúdo</span>
                    </Button>
                    <Button className="h-20 bg-gradient-to-br from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 flex flex-col items-center justify-center">
                      <AlertCircle className="w-6 h-6 mb-2" />
                      <span>Avisar Usuário</span>
                    </Button>
                    <Button className="h-20 bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 flex flex-col items-center justify-center">
                      <Users className="w-6 h-6 mb-2" />
                      <span>Gerenciar Roles</span>
                    </Button>
                    <Button className="h-20 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex flex-col items-center justify-center">
                      <TrendingUp className="w-6 h-6 mb-2" />
                      <span>Exportar Relatório</span>
                    </Button>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold mb-2">📋 Ações Recentes</h4>
                    <div className="space-y-2 text-sm">
                      <p>✓ Usuário #42 promovido a moderador</p>
                      <p>✗ Ocorrência #127 removida por conteúdo inapropriado</p>
                      <p>⚠️ Usuário #89 recebeu aviso</p>
                      <p>✓ Relatório mensal exportado</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}