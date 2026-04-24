import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, MessageSquare, Award, Zap, Calendar } from "lucide-react";

import MainLayout from "@/components/MainLayout";
export default function ActivityHistory() {
  const { user } = useAuth();

  // Mock data de atividades
  const mockActivities = [
    {
      id: 1,
      type: "occurrence",
      action: "Registrou ocorrência",
      description: "Incêndio em São Paulo",
      points: 10,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      icon: "🔥",
    },
    {
      id: 2,
      type: "validation",
      action: "Validou ocorrência",
      description: "Validou ocorrência #42",
      points: 5,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      icon: "✓",
    },
    {
      id: 3,
      type: "simulation",
      action: "Completou simulação",
      description: "Simulador de Incêndio",
      points: 3,
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      icon: "🎮",
    },
    {
      id: 4,
      type: "badge",
      action: "Desbloqueou badge",
      description: "Vigia do Fogo",
      points: 0,
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      icon: "🏆",
    },
    {
      id: 5,
      type: "comment",
      action: "Adicionou comentário",
      description: "Em ocorrência #35",
      points: 1,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      icon: "💬",
    },
    {
      id: 6,
      type: "occurrence",
      action: "Registrou ocorrência",
      description: "Poluição de água",
      points: 10,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      icon: "💧",
    },
  ];

  const getActivityColor = (type: string) => {
    switch (type) {
      case "occurrence":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "validation":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "simulation":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "badge":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "comment":
        return "bg-pink-100 text-pink-800 border-pink-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "occurrence":
        return <AlertCircle className="w-5 h-5" />;
      case "validation":
        return <CheckCircle className="w-5 h-5" />;
      case "simulation":
        return <Zap className="w-5 h-5" />;
      case "badge":
        return <Award className="w-5 h-5" />;
      case "comment":
        return <MessageSquare className="w-5 h-5" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return "Agora";
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString("pt-BR");
  };

  const totalPoints = mockActivities.reduce((sum, a) => sum + a.points, 0);
  const thisMonth = mockActivities.filter(
    (a) => new Date().getTime() - a.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000
  );

  return (
    <MainLayout>
<div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              Histórico de Atividades
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Acompanhe todas as suas ações na plataforma
            </p>
          </div>
  
          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total de Pontos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">{totalPoints}</div>
                <p className="text-xs text-gray-500 mt-1">De todas as atividades</p>
              </CardContent>
            </Card>
  
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Este Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {thisMonth.reduce((sum, a) => sum + a.points, 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Últimos 30 dias</p>
              </CardContent>
            </Card>
  
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Atividades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{mockActivities.length}</div>
                <p className="text-xs text-gray-500 mt-1">Total registrado</p>
              </CardContent>
            </Card>
          </div>
  
          {/* Activity Timeline */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>Timeline de Atividades</CardTitle>
              <CardDescription>Suas ações recentes na plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockActivities.map((activity, idx) => (
                  <div key={activity.id} className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                    {/* Timeline Dot */}
                    <div className="flex flex-col items-center">
                      <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      {idx < mockActivities.length - 1 && (
                        <div className="w-0.5 h-12 bg-gray-300 dark:bg-gray-600 mt-2" />
                      )}
                    </div>
  
                    {/* Activity Content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold">{activity.action}</h4>
                        <Badge variant="outline" className={getActivityColor(activity.type)}>
                          {activity.points > 0 ? `+${activity.points} pts` : ""}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
  
          {/* Activity Breakdown */}
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Atividades por Tipo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { type: "occurrence", label: "Ocorrências", count: 2 },
                  { type: "validation", label: "Validações", count: 1 },
                  { type: "simulation", label: "Simulações", count: 1 },
                  { type: "badge", label: "Badges", count: 1 },
                  { type: "comment", label: "Comentários", count: 1 },
                ].map((item) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <span className="text-sm">{item.label}</span>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
  
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pontos Médios por Atividade</span>
                  <span className="font-bold">{(totalPoints / mockActivities.length).toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Atividades Este Mês</span>
                  <span className="font-bold">{thisMonth.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Média Diária</span>
                  <span className="font-bold">
                    {(mockActivities.length / 3).toFixed(1)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
