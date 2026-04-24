import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trees, TrendingDown, Save } from "lucide-react";
import { toast } from "sonner";

interface DeforestationParams {
  deforestationRate: number; // ha/ano (0-500)
  vegetationType: "floresta" | "cerrado" | "caatinga";
  anthropogenicPressure: "baixa" | "media" | "alta";
  protectedAreaConnectivity: number; // % (0-100)
}

interface DeforestationResults {
  forestFragmentation: number; // % de fragmentação
  biodiversityLoss: number; // % de perda
  waterCycleImpact: number; // escala 0-100
  carbonEquivalent: number; // toneladas CO2eq
  recoveryTime: number; // anos
  riskLevel: number; // 0-100
}

export default function DeforestationSimulator() {
  const { user } = useAuth();
  const createSimulation = trpc.simulations.create.useMutation();
  const [params, setParams] = useState<DeforestationParams>({
    deforestationRate: 100,
    vegetationType: "floresta",
    anthropogenicPressure: "media",
    protectedAreaConnectivity: 50,
  });

  const calculateResults = (): DeforestationResults => {
    const { deforestationRate, vegetationType, anthropogenicPressure, protectedAreaConnectivity } = params;

    // Base fragmentation (increases with deforestation rate and decreases with connectivity)
    const baseFrag = (deforestationRate / 500) * 100;
    const connectivityFactor = 1 - (protectedAreaConnectivity / 100) * 0.3;
    const forestFragmentation = Math.min(100, baseFrag * connectivityFactor);

    // Biodiversity loss depends on vegetation type
    const vegFactors = {
      floresta: 1.2,
      cerrado: 0.9,
      caatinga: 0.7,
    };
    const anthropogenicFactors = {
      baixa: 0.8,
      media: 1.0,
      alta: 1.3,
    };
    const biodiversityLoss = Math.min(
      100,
      (deforestationRate / 500) * 100 * vegFactors[vegetationType] * anthropogenicFactors[anthropogenicPressure]
    );

    // Water cycle impact (higher with higher deforestation and lower connectivity)
    const waterCycleImpact = Math.min(100, (deforestationRate / 500) * 100 * (1 - protectedAreaConnectivity / 100 * 0.5));

    // Carbon emissions (depends on vegetation type)
    const carbonFactors = {
      floresta: 200, // tons CO2eq per ha
      cerrado: 120,
      caatinga: 80,
    };
    const carbonEquivalent = (deforestationRate * carbonFactors[vegetationType]) / 1000; // convert to thousands

    // Recovery time in years (based on biodiversity loss and anthropogenic pressure)
    const baseRecovery = {
      floresta: 50,
      cerrado: 30,
      caatinga: 20,
    };
    const recoveryTime = Math.ceil(baseRecovery[vegetationType] * (1 + biodiversityLoss / 100) * anthropogenicFactors[anthropogenicPressure]);

    // Overall risk level
    const riskLevel = (forestFragmentation + biodiversityLoss + waterCycleImpact) / 3;

    return {
      forestFragmentation,
      biodiversityLoss,
      waterCycleImpact,
      carbonEquivalent,
      recoveryTime,
      riskLevel,
    };
  };

  const results = calculateResults();
  const vegIcons = {
    floresta: "🌲",
    cerrado: "🌾",
    caatinga: "🌵",
  };
  const vegLabels = {
    floresta: "Floresta Tropical",
    cerrado: "Cerrado",
    caatinga: "Caatinga",
  };
  const pressureLabels = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
  };

  const getRiskColor = (risk: number) => {
    if (risk < 30) return "text-green-600";
    if (risk < 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getRiskBackground = (risk: number) => {
    if (risk < 30) return "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20";
    if (risk < 60) return "from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20";
    return "from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20";
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Parameters Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Trees className="w-5 h-5" />
              Simulador de Desflorestamento
            </CardTitle>
            <CardDescription className="text-emerald-100">
              Analise o impacto do desmatamento no ecossistema
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Deforestation Rate */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-semibold">Taxa de Desmatamento: {params.deforestationRate} ha/ano</label>
                <Badge variant="outline">
                  {params.deforestationRate < 100 ? "🟢 Baixa" : params.deforestationRate < 300 ? "🟡 Média" : "🔴 Alta"}
                </Badge>
              </div>
              <Slider
                min={0}
                max={500}
                step={10}
                value={[params.deforestationRate]}
                onValueChange={(val) => setParams({ ...params, deforestationRate: val[0] })}
              />
              <p className="text-xs text-gray-500 mt-1">Intervalo: 0-500 ha/ano</p>
            </div>

            {/* Vegetation Type */}
            <div>
              <label className="font-semibold mb-3 block">Tipo de Vegetação</label>
              <div className="grid grid-cols-3 gap-2">
                {(["floresta", "cerrado", "caatinga"] as const).map((type) => (
                  <Button
                    key={type}
                    variant={params.vegetationType === type ? "default" : "outline"}
                    className="w-full flex flex-col items-center gap-1 py-4"
                    onClick={() => setParams({ ...params, vegetationType: type })}
                  >
                    <span className="text-2xl">{vegIcons[type]}</span>
                    <span className="text-xs">{vegLabels[type]}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Anthropogenic Pressure */}
            <div>
              <label className="font-semibold mb-3 block">Pressão Antropogênica</label>
              <div className="grid grid-cols-3 gap-2">
                {(["baixa", "media", "alta"] as const).map((pressure) => (
                  <Button
                    key={pressure}
                    variant={params.anthropogenicPressure === pressure ? "default" : "outline"}
                    className={`w-full ${
                      pressure === "alta"
                        ? "hover:bg-red-100 dark:hover:bg-red-900/30"
                        : pressure === "media"
                        ? "hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                        : "hover:bg-green-100 dark:hover:bg-green-900/30"
                    }`}
                    onClick={() => setParams({ ...params, anthropogenicPressure: pressure })}
                  >
                    {pressure === "alta" ? "🔴" : pressure === "media" ? "🟡" : "🟢"} {pressureLabels[pressure]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Protected Area Connectivity */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-semibold">Conectividade com Áreas Protegidas: {params.protectedAreaConnectivity}%</label>
                <Badge variant="outline">
                  {params.protectedAreaConnectivity > 60 ? "✅ Boa" : params.protectedAreaConnectivity > 30 ? "⚠️ Média" : "❌ Baixa"}
                </Badge>
              </div>
              <Slider
                min={0}
                max={100}
                step={5}
                value={[params.protectedAreaConnectivity]}
                onValueChange={(val) => setParams({ ...params, protectedAreaConnectivity: val[0] })}
              />
              <p className="text-xs text-gray-500 mt-1">Intervalo: 0-100%</p>
            </div>

            <Button
              onClick={() => toast.success("Simulação realizada! (Salvar implementado em breve)")}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600"
            >
              Executar Simulação
            </Button>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className={`bg-gradient-to-r ${getRiskBackground(results.riskLevel)} text-gray-900 dark:text-gray-100 rounded-t-lg`}>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Análise de Impacto
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            {/* Risk Level */}
            <div className={`bg-gradient-to-r ${getRiskBackground(results.riskLevel)} p-4 rounded-lg`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Nível de Risco Geral</span>
                <span className={`text-2xl font-bold ${getRiskColor(results.riskLevel)}`}>{results.riskLevel.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
                  style={{ width: `${results.riskLevel}%` }}
                />
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                <p className="text-gray-600 dark:text-gray-400">Fragmentação</p>
                <p className="text-xl font-bold text-blue-600">{results.forestFragmentation.toFixed(1)}%</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
                <p className="text-gray-600 dark:text-gray-400">Biodiversidade</p>
                <p className="text-xl font-bold text-purple-600">{results.biodiversityLoss.toFixed(1)}%</p>
              </div>
              <div className="bg-cyan-50 dark:bg-cyan-900/20 p-3 rounded">
                <p className="text-gray-600 dark:text-gray-400">Ciclo Hídrico</p>
                <p className="text-xl font-bold text-cyan-600">{results.waterCycleImpact.toFixed(1)}%</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded">
                <p className="text-gray-600 dark:text-gray-400">Carbono (x1000)</p>
                <p className="text-xl font-bold text-amber-600">{results.carbonEquivalent.toFixed(1)} tCO₂e</p>
              </div>
            </div>

            {/* Recovery Time */}
            <div className="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Tempo de Recuperação Estimado</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{results.recoveryTime} anos</p>
              <p className="text-xs text-gray-500 mt-1">Para retornar ao estado original</p>
            </div>

            {user && (
              <Button
                onClick={async () => {
                  try {
                    await createSimulation.mutateAsync({
                      type: "deforestation",
                      parameters: { ...params },
                      results: { ...results },
                    });
                    toast.success("Simulação salva! +3 pontos");
                  } catch {
                    toast.error("Erro ao salvar simulação");
                  }
                }}
                disabled={createSimulation.isPending}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {createSimulation.isPending ? "Salvando..." : "Salvar Simulação (+3 pts)"}
              </Button>
            )}

            {/* Interpretation */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">💡 Interpretação</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {results.riskLevel < 30
                  ? "Desmatamento controlado. O ecossistema consegue regenerar-se naturalmente."
                  : results.riskLevel < 60
                  ? "Desmatamento moderado. Intervenção necessária para restauração."
                  : "Desmatamento crítico. Risco severo de colapso ecológico. Ação urgente recomendada."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-t-lg">
          <CardTitle>Análise Detalhada</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="impact" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="impact">Impactos</TabsTrigger>
              <TabsTrigger value="scenario">Cenários</TabsTrigger>
            </TabsList>

            <TabsContent value="impact" className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Fragmentação Florestal</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Ocorre quando a floresta é dividida em pequenos fragmentos isolados, reduzindo a capacidade de movimento de fauna e dispersão de sementes.
                </p>
                <div className="bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-800/10 p-3 rounded">
                  <p className="text-sm font-mono">{results.forestFragmentation.toFixed(1)}% de fragmentação</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Perda de Biodiversidade</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Extinção de espécies nativas e redução de diversidade genética. Cada ha desmatado causa perda de centenas de espécies.
                </p>
                <div className="bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/20 dark:to-purple-800/10 p-3 rounded">
                  <p className="text-sm font-mono">{results.biodiversityLoss.toFixed(1)}% de perda estimada</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Impacto no Ciclo Hídrico</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Redução de evapotranspiração, alteração de padrões de chuva e diminuição de recarga de aquíferos.
                </p>
                <div className="bg-gradient-to-r from-cyan-100 to-cyan-50 dark:from-cyan-900/20 dark:to-cyan-800/10 p-3 rounded">
                  <p className="text-sm font-mono">Impacto: {results.waterCycleImpact.toFixed(1)}%</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Emissões de Carbono</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Liberação de CO₂ armazenado nas árvores, contribuindo para mudanças climáticas globais.
                </p>
                <div className="bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/20 dark:to-amber-800/10 p-3 rounded">
                  <p className="text-sm font-mono">{results.carbonEquivalent.toFixed(2)} mil toneladas de CO₂ equivalente</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="scenario" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-500">
                  <p className="font-semibold text-green-700">Cenário Otimista</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Taxa: 50 ha/ano | Pressão: Baixa</p>
                  <p className="text-sm font-bold text-green-600 mt-2">Risco: 15%</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border-l-4 border-yellow-500">
                  <p className="font-semibold text-yellow-700">Cenário Realista</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Taxa: 150 ha/ano | Pressão: Média</p>
                  <p className="text-sm font-bold text-yellow-600 mt-2">Risco: 45%</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border-l-4 border-orange-500">
                  <p className="font-semibold text-orange-700">Cenário Pessimista</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Taxa: 350 ha/ano | Pressão: Alta</p>
                  <p className="text-sm font-bold text-orange-600 mt-2">Risco: 85%</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-l-4 border-red-500">
                  <p className="font-semibold text-red-700">Cenário Crítico</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Taxa: 500 ha/ano | Pressão: Alta</p>
                  <p className="text-sm font-bold text-red-600 mt-2">Risco: 95%</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
