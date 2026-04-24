import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Droplet, AlertTriangle, Save } from "lucide-react";
import { toast } from "sonner";

interface WaterQualityParams {
  dbo: number; // mg/L (0-30)
  ph: number; // 0-14
  turbidity: number; // NTU (0-100)
  heavyMetals: number; // mg/L (0-10)
  temperature: number; // °C (15-35)
}

interface WaterQualityResults {
  iqa: number; // Índice de Qualidade da Água (0-100)
  humanConsumption: number; // adequação % (0-100)
  aquaticRisk: number; // risco (0-100)
  recoveryTime: number; // meses
  status: "excelente" | "bom" | "aceitavel" | "ruim" | "muito_ruim";
}

export default function WaterQualitySimulator() {
  const { user } = useAuth();
  const createSimulation = trpc.simulations.create.useMutation();
  const [params, setParams] = useState<WaterQualityParams>({
    dbo: 5,
    ph: 7,
    turbidity: 10,
    heavyMetals: 0.5,
    temperature: 25,
  });

  const calculateResults = (): WaterQualityResults => {
    const { dbo, ph, turbidity, heavyMetals, temperature } = params;

    // IQA Calculation (simplified)
    let iqa = 100;

    // DBO contribution (max 20 points loss)
    const dboScore = Math.max(0, 20 - dbo * 0.67);
    iqa -= 20 - dboScore;

    // pH contribution (optimal at 7)
    const phDeviation = Math.abs(ph - 7);
    const phScore = Math.max(0, 20 - phDeviation * 1.4);
    iqa -= 20 - phScore;

    // Turbidity contribution (max 20 points loss)
    const turbidityScore = Math.max(0, 20 - turbidity * 0.2);
    iqa -= 20 - turbidityScore;

    // Heavy metals contribution (max 20 points loss)
    const metalsScore = Math.max(0, 20 - heavyMetals * 2);
    iqa -= 20 - metalsScore;

    // Temperature contribution (max 20 points loss)
    const tempDeviation = Math.abs(temperature - 22);
    const tempScore = Math.max(0, 20 - tempDeviation * 0.4);
    iqa -= 20 - tempScore;

    iqa = Math.max(0, Math.min(100, iqa));

    // Human consumption adequacy (stricter standards)
    const humanConsumption = Math.max(0, iqa - (heavyMetals > 0.1 ? 30 : 0) - (dbo > 2 ? 20 : 0) - (phDeviation > 1.5 ? 15 : 0));

    // Aquatic risk (inverse of IQA, considering heavy metals)
    const aquaticRisk = (100 - iqa) * (1 + heavyMetals * 0.5);

    // Recovery time in months
    let recoveryTime = 0;
    if (iqa > 80) recoveryTime = 0;
    else if (iqa > 60) recoveryTime = 1;
    else if (iqa > 40) recoveryTime = 3;
    else if (iqa > 20) recoveryTime = 6;
    else recoveryTime = 12;

    // Status determination
    let status: WaterQualityResults["status"];
    if (iqa >= 80) status = "excelente";
    else if (iqa >= 60) status = "bom";
    else if (iqa >= 40) status = "aceitavel";
    else if (iqa >= 20) status = "ruim";
    else status = "muito_ruim";

    return {
      iqa: iqa,
      humanConsumption: Math.max(0, humanConsumption),
      aquaticRisk: Math.min(100, aquaticRisk),
      recoveryTime,
      status,
    };
  };

  const results = calculateResults();
  const statusEmojis = {
    excelente: "✅",
    bom: "🟢",
    aceitavel: "🟡",
    ruim: "🔴",
    muito_ruim: "💀",
  };
  const statusLabels = {
    excelente: "Excelente",
    bom: "Bom",
    aceitavel: "Aceitável",
    ruim: "Ruim",
    muito_ruim: "Muito Ruim",
  };

  const getIQAColor = (iqa: number) => {
    if (iqa >= 80) return "text-green-600";
    if (iqa >= 60) return "text-emerald-600";
    if (iqa >= 40) return "text-yellow-600";
    if (iqa >= 20) return "text-orange-600";
    return "text-red-600";
  };

  const getIQABackground = (iqa: number) => {
    if (iqa >= 80) return "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20";
    if (iqa >= 60) return "from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20";
    if (iqa >= 40) return "from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20";
    if (iqa >= 20) return "from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20";
    return "from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-900/20";
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Parameters Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Droplet className="w-5 h-5" />
              Simulador de Qualidade da Água
            </CardTitle>
            <CardDescription className="text-blue-100">
              Avalie a qualidade com base em parâmetros hídricos
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* DBO */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-semibold">DBO (Demanda Biológica de Oxigênio): {params.dbo} mg/L</label>
                <Badge variant="outline">
                  {params.dbo < 3 ? "✅ Ótimo" : params.dbo < 6 ? "🟢 Bom" : params.dbo < 10 ? "🟡 Médio" : "🔴 Ruim"}
                </Badge>
              </div>
              <Slider
                min={0}
                max={30}
                step={0.5}
                value={[params.dbo]}
                onValueChange={(val) => setParams({ ...params, dbo: val[0] })}
              />
              <p className="text-xs text-gray-500 mt-1">Intervalo: 0-30 mg/L (Ideal: &lt;3)</p>
            </div>

            {/* pH */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-semibold">pH: {params.ph.toFixed(1)}</label>
                <Badge variant="outline">
                  {Math.abs(params.ph - 7) < 0.5 ? "✅ Neutro" : Math.abs(params.ph - 7) < 1.5 ? "🟢 Aceitável" : "🟡 Alterado"}
                </Badge>
              </div>
              <Slider
                min={0}
                max={14}
                step={0.1}
                value={[params.ph]}
                onValueChange={(val) => setParams({ ...params, ph: val[0] })}
              />
              <p className="text-xs text-gray-500 mt-1">Intervalo: 0-14 (Ideal: 6.5-8.5)</p>
            </div>

            {/* Turbidity */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-semibold">Turbidez: {params.turbidity} NTU</label>
                <Badge variant="outline">
                  {params.turbidity < 5 ? "✅ Clara" : params.turbidity < 15 ? "🟢 Ligeiramente Turva" : "🔴 Muito Turva"}
                </Badge>
              </div>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[params.turbidity]}
                onValueChange={(val) => setParams({ ...params, turbidity: val[0] })}
              />
              <p className="text-xs text-gray-500 mt-1">Intervalo: 0-100 NTU (Ideal: &lt;5)</p>
            </div>

            {/* Heavy Metals */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-semibold">Metais Pesados: {params.heavyMetals.toFixed(2)} mg/L</label>
                <Badge variant="outline">
                  {params.heavyMetals < 0.05 ? "✅ Nenhum" : params.heavyMetals < 0.5 ? "🟡 Traços" : "🔴 Contaminado"}
                </Badge>
              </div>
              <Slider
                min={0}
                max={10}
                step={0.1}
                value={[params.heavyMetals]}
                onValueChange={(val) => setParams({ ...params, heavyMetals: val[0] })}
              />
              <p className="text-xs text-gray-500 mt-1">Intervalo: 0-10 mg/L (Ideal: &lt;0.05)</p>
            </div>

            {/* Temperature */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-semibold">Temperatura: {params.temperature}°C</label>
                <Badge variant="outline">
                  {Math.abs(params.temperature - 22) < 3 ? "✅ Ideal" : Math.abs(params.temperature - 22) < 8 ? "🟢 Adequado" : "🟡 Alterado"}
                </Badge>
              </div>
              <Slider
                min={15}
                max={35}
                step={0.5}
                value={[params.temperature]}
                onValueChange={(val) => setParams({ ...params, temperature: val[0] })}
              />
              <p className="text-xs text-gray-500 mt-1">Intervalo: 15-35°C (Ideal: 20-24°C)</p>
            </div>

            {user && (
              <Button
                onClick={async () => {
                  try {
                    const res = calculateResults();
                    await createSimulation.mutateAsync({
                      type: "water-quality",
                      parameters: { ...params },
                      results: { iqa: res.iqa, humanConsumption: res.humanConsumption, aquaticRisk: res.aquaticRisk, recoveryTime: res.recoveryTime, status: res.status },
                    });
                    toast.success("Simulação salva! +3 pontos");
                  } catch {
                    toast.error("Erro ao salvar simulação");
                  }
                }}
                disabled={createSimulation.isPending}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {createSimulation.isPending ? "Salvando..." : "Salvar Simulação (+3 pts)"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className={`bg-gradient-to-r ${getIQABackground(results.iqa)} text-gray-900 dark:text-gray-100 rounded-t-lg`}>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Avaliação de Qualidade
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            {/* IQA Score */}
            <div className={`bg-gradient-to-r ${getIQABackground(results.iqa)} p-4 rounded-lg`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Índice de Qualidade da Água (IQA)</span>
                <span className={`text-3xl font-bold ${getIQAColor(results.iqa)}`}>{results.iqa.toFixed(1)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all"
                  style={{ width: `${results.iqa}%` }}
                />
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-2xl">{statusEmojis[results.status]}</span>
                <span className="font-semibold">{statusLabels[results.status]}</span>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                <p className="text-gray-600 dark:text-gray-400">Consumo Humano</p>
                <p className="text-xl font-bold text-blue-600">{results.humanConsumption.toFixed(1)}%</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
                <p className="text-gray-600 dark:text-gray-400">Risco Aquático</p>
                <p className="text-xl font-bold text-red-600">{results.aquaticRisk.toFixed(1)}%</p>
              </div>
            </div>

            {/* Recovery Time */}
            <div className="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Tempo de Recuperação</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {results.recoveryTime === 0 ? "Nenhum" : `${results.recoveryTime} ${results.recoveryTime === 1 ? "mês" : "meses"}`}
              </p>
              <p className="text-xs text-gray-500 mt-1">Para retornar à qualidade aceitável</p>
            </div>

            {/* Interpretation */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">💡 Interpretação</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {results.status === "excelente"
                  ? "Água excelente para consumo humano, aquacultura e ecossistema aquático. Requer manutenção contínua."
                  : results.status === "bom"
                  ? "Água adequada para consumo humano com tratamento simples. Ecossistema em bom estado."
                  : results.status === "aceitavel"
                  ? "Água aceitável para agricultura. Consumo humano requer tratamento. Ecossistema sob estresse."
                  : results.status === "ruim"
                  ? "Água inadequada para consumo humano. Risco para aquacultura. Intervenção necessária."
                  : "Água muito contaminada. Risco severo. Ação imediata e restauração urgente necessária."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parameters Explanation */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-t-lg">
          <CardTitle>Guia de Parâmetros</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="dbo" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dbo" className="text-xs">DBO</TabsTrigger>
              <TabsTrigger value="ph" className="text-xs">pH</TabsTrigger>
              <TabsTrigger value="turbidity" className="text-xs">Turbidez</TabsTrigger>
              <TabsTrigger value="metals" className="text-xs">Metais</TabsTrigger>
              <TabsTrigger value="temp" className="text-xs">Temp.</TabsTrigger>
            </TabsList>

            <TabsContent value="dbo" className="space-y-2">
              <h4 className="font-semibold">Demanda Biológica de Oxigênio (DBO)</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Mede a quantidade de oxigênio necessária para decompor matéria orgânica. Altos valores indicam poluição por esgoto ou resíduos.
              </p>
              <div className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded text-sm font-mono">
                &lt;3 mg/L: Excelente | 3-6 mg/L: Bom | 6-10 mg/L: Aceitável | &gt;10 mg/L: Ruim
              </div>
            </TabsContent>

            <TabsContent value="ph" className="space-y-2">
              <h4 className="font-semibold">Potencial Hidrogeniônico (pH)</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Mede a acidez ou alcalinidade. Valores extremos prejudicam aquatic life e consumo humano.
              </p>
              <div className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded text-sm font-mono">
                pH 7: Neutro | pH &lt;7: Ácido | pH &gt;7: Alcalino | Ideal: 6.5-8.5
              </div>
            </TabsContent>

            <TabsContent value="turbidity" className="space-y-2">
              <h4 className="font-semibold">Turbidez (NTU)</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Mede a opacidade da água. Altos valores indicam presença de partículas suspensas (argila, algas, bactérias).
              </p>
              <div className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded text-sm font-mono">
                &lt;5 NTU: Clara | 5-15 NTU: Ligeiramente Turva | &gt;15 NTU: Muito Turva
              </div>
            </TabsContent>

            <TabsContent value="metals" className="space-y-2">
              <h4 className="font-semibold">Metais Pesados (mg/L)</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Cobre, chumbo, mercúrio, etc. Bioacumulam em organismos aquáticos e prejudicam saúde humana.
              </p>
              <div className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded text-sm font-mono">
                &lt;0.05 mg/L: Nenhum | 0.05-0.5 mg/L: Traços | &gt;0.5 mg/L: Contaminado
              </div>
            </TabsContent>

            <TabsContent value="temp" className="space-y-2">
              <h4 className="font-semibold">Temperatura (°C)</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Afeta solubilidade de oxigênio, metabolismo de organismos e desenvolvimento de algas.
              </p>
              <div className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded text-sm font-mono">
                Ideal: 20-24°C | Aceitável: 15-28°C | Alterado: &gt;28°C ou &lt;15°C
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
