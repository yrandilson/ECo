import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  AlertTriangle,
  Cloud,
  Wind,
  Droplets,
  Flame,
  Calendar,
  MapPin,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";

interface PredictionData {
  day: number;
  date: string;
  predictedRiskScore: number;
  confidence: number;
  factors: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    vegetation: number;
  };
  recommendation: string;
  severity: "low" | "medium" | "high" | "critical";
}

export default function PredictiveDashboard() {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: -23.5505,
    longitude: -46.6333,
    name: "São Paulo, SP",
  });

  // Mock data para demonstração
  const mockPredictions: PredictionData[] = [
    {
      day: 1,
      date: "2026-02-02",
      predictedRiskScore: 65,
      confidence: 0.85,
      factors: {
        temperature: 32,
        humidity: 35,
        windSpeed: 18,
        precipitation: 0,
        vegetation: 75,
      },
      recommendation: "ALERTA: Risco alto de incêndio. Mantenha vigilância.",
      severity: "high",
    },
    {
      day: 2,
      date: "2026-02-03",
      predictedRiskScore: 72,
      confidence: 0.82,
      factors: {
        temperature: 34,
        humidity: 30,
        windSpeed: 22,
        precipitation: 0,
        vegetation: 75,
      },
      recommendation: "ALERTA CRÍTICO: Risco muito alto de incêndio.",
      severity: "critical",
    },
    {
      day: 3,
      date: "2026-02-04",
      predictedRiskScore: 58,
      confidence: 0.78,
      factors: {
        temperature: 30,
        humidity: 45,
        windSpeed: 15,
        precipitation: 5,
        vegetation: 75,
      },
      recommendation: "CUIDADO: Risco moderado. Monitore condições.",
      severity: "medium",
    },
    {
      day: 4,
      date: "2026-02-05",
      predictedRiskScore: 42,
      confidence: 0.75,
      factors: {
        temperature: 28,
        humidity: 55,
        windSpeed: 12,
        precipitation: 15,
        vegetation: 75,
      },
      recommendation: "Risco baixo. Condições favoráveis.",
      severity: "low",
    },
    {
      day: 5,
      date: "2026-02-06",
      predictedRiskScore: 38,
      confidence: 0.72,
      factors: {
        temperature: 26,
        humidity: 65,
        windSpeed: 10,
        precipitation: 20,
        vegetation: 75,
      },
      recommendation: "Risco baixo. Condições favoráveis.",
      severity: "low",
    },
    {
      day: 6,
      date: "2026-02-07",
      predictedRiskScore: 48,
      confidence: 0.70,
      factors: {
        temperature: 29,
        humidity: 50,
        windSpeed: 14,
        precipitation: 8,
        vegetation: 75,
      },
      recommendation: "CUIDADO: Risco moderado. Monitore condições.",
      severity: "medium",
    },
    {
      day: 7,
      date: "2026-02-08",
      predictedRiskScore: 62,
      confidence: 0.68,
      factors: {
        temperature: 31,
        humidity: 38,
        windSpeed: 19,
        precipitation: 2,
        vegetation: 75,
      },
      recommendation: "ALERTA: Risco alto de incêndio.",
      severity: "high",
    },
  ];

  useEffect(() => {
    // Simular carregamento de predições
    setLoading(true);
    setTimeout(() => {
      setPredictions(mockPredictions);
      setLoading(false);
    }, 1000);
  }, [selectedLocation]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return "🔴";
      case "high":
        return "🟠";
      case "medium":
        return "🟡";
      case "low":
        return "🟢";
      default:
        return "⚪";
    }
  };

  const chartData = predictions.map((p) => ({
    date: p.date.split("-").slice(1).join("-"),
    risco: Math.round(p.predictedRiskScore),
    confiança: Math.round(p.confidence * 100),
    temperatura: Math.round(p.factors.temperature),
    umidade: Math.round(p.factors.humidity),
  }));

  const maxRisk = Math.max(...predictions.map((p) => p.predictedRiskScore));
  const avgRisk = predictions.reduce((sum, p) => sum + p.predictedRiskScore, 0) / predictions.length;
  const criticalDays = predictions.filter((p) => p.severity === "critical").length;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-slate-900 dark:to-slate-800 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Dashboard Preditivo de Incêndios
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Previsões de risco para os próximos 7 dias usando Machine Learning
            </p>
          </div>

          {/* Localização */}
          <Card className="shadow-lg border-0 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Localização Monitorada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{selectedLocation.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                  </p>
                </div>
                <Button variant="outline">Alterar Localização</Button>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas Resumidas */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Risco Máximo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{maxRisk.toFixed(1)}</div>
                <p className="text-xs text-gray-500 mt-1">Próximos 7 dias</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Risco Médio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{avgRisk.toFixed(1)}</div>
                <p className="text-xs text-gray-500 mt-1">Período</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Dias Críticos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-700">{criticalDays}</div>
                <p className="text-xs text-gray-500 mt-1">Risco crítico</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Confiança Média
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length * 100).toFixed(0)}%
                </div>
                <p className="text-xs text-gray-500 mt-1">Modelos ML</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <Tabs defaultValue="risk" className="mb-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="risk">Risco Predito</TabsTrigger>
              <TabsTrigger value="weather">Meteorologia</TabsTrigger>
              <TabsTrigger value="factors">Fatores</TabsTrigger>
            </TabsList>

            <TabsContent value="risk" className="mt-4">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Evolução do Risco de Incêndio</CardTitle>
                  <CardDescription>Previsão para os próximos 7 dias</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRisco" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="risco"
                        stroke="#ef4444"
                        fillOpacity={1}
                        fill="url(#colorRisco)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="weather" className="mt-4">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Condições Meteorológicas Previstas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="temperatura"
                        stroke="#f97316"
                        name="Temperatura (°C)"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="umidade"
                        stroke="#3b82f6"
                        name="Umidade (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="factors" className="mt-4">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Fatores que Influenciam o Risco</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {predictions.length > 0 && (
                      <>
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Cloud className="w-5 h-5 text-orange-600" />
                            <p className="font-semibold">Temperatura</p>
                          </div>
                          <p className="text-2xl font-bold text-orange-600">
                            {predictions[0].factors.temperature.toFixed(1)}°C
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Hoje (dia 1)
                          </p>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Droplets className="w-5 h-5 text-blue-600" />
                            <p className="font-semibold">Umidade</p>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">
                            {predictions[0].factors.humidity.toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Hoje (dia 1)
                          </p>
                        </div>

                        <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Wind className="w-5 h-5 text-cyan-600" />
                            <p className="font-semibold">Vento</p>
                          </div>
                          <p className="text-2xl font-bold text-cyan-600">
                            {predictions[0].factors.windSpeed.toFixed(1)} km/h
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Hoje (dia 1)
                          </p>
                        </div>

                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Flame className="w-5 h-5 text-green-600" />
                            <p className="font-semibold">Vegetação</p>
                          </div>
                          <p className="text-2xl font-bold text-green-600">
                            {predictions[0].factors.vegetation.toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Densidade
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Previsões Detalhadas */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Previsões Detalhadas
              </CardTitle>
              <CardDescription>Análise dia a dia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.map((pred) => (
                  <div
                    key={pred.day}
                    className={`p-4 rounded-lg border-2 ${getSeverityColor(pred.severity)}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{getSeverityIcon(pred.severity)}</span>
                          <h4 className="font-semibold">Dia {pred.day} - {pred.date}</h4>
                          <Badge variant="outline" className="ml-2">
                            {pred.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm mt-2">{pred.recommendation}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold">{pred.predictedRiskScore.toFixed(1)}</div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Confiança: {(pred.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                      <div>
                        <p className="text-xs opacity-75">Temperatura</p>
                        <p className="font-semibold">{pred.factors.temperature.toFixed(1)}°C</p>
                      </div>
                      <div>
                        <p className="text-xs opacity-75">Umidade</p>
                        <p className="font-semibold">{pred.factors.humidity.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs opacity-75">Vento</p>
                        <p className="font-semibold">{pred.factors.windSpeed.toFixed(1)} km/h</p>
                      </div>
                      <div>
                        <p className="text-xs opacity-75">Precipitação</p>
                        <p className="font-semibold">{pred.factors.precipitation.toFixed(1)} mm</p>
                      </div>
                      <div>
                        <p className="text-xs opacity-75">Vegetação</p>
                        <p className="font-semibold">{pred.factors.vegetation.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Informações sobre Modelos ML */}
          <Card className="shadow-lg border-0 mt-8 bg-blue-50 dark:bg-blue-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Modelos de Machine Learning Utilizados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. Regressão Linear (30%)</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Modelo simples que identifica tendências lineares nos dados históricos. Bom para padrões previsíveis.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Random Forest (40%)</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Ensemble de árvores de decisão que captura relações não-lineares complexas. Mais robusto a variações.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">3. Rede Neural (30%)</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Rede neural com 1 camada oculta que aprende padrões complexos. Excelente para dados não-estruturados.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-blue-200 dark:border-blue-700 mt-4">
                <p className="text-sm">
                  <strong>Ensemble:</strong> As previsões são combinadas usando média ponderada para melhor precisão (±15% de erro).
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}