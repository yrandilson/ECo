import { useState, useMemo } from "react";
import {
  Wheat, Cloud, CloudRain, Sun, Thermometer, Droplets, Wind, AlertTriangle,
  TrendingUp, TrendingDown, BarChart3, Leaf, Calendar, MapPin, ChevronDown,
  ChevronUp, ArrowUpRight, ArrowDownRight, Scale, Timer, Sprout, Bug,
  CircleDot, Activity, Zap, Target,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import MainLayout from "@/components/MainLayout";

// ─── Types ───────────────────────────────────────────────────────────

interface Crop {
  id: string;
  name: string;
  icon: string;
  currentPhase: string;
  healthScore: number;
  yieldForecast: number;
  yieldUnit: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  riskFactors: string[];
  plantDate: string;
  harvestDate: string;
  idealTemp: [number, number];
  idealRain: [number, number];
}

interface WeatherForecast {
  day: string;
  temp: number;
  rain: number;
  humidity: number;
  wind: number;
  condition: "sunny" | "cloudy" | "rainy" | "storm";
}

interface RiskAlert {
  type: "drought" | "flood" | "pest" | "frost" | "heatwave" | "storm";
  severity: "warning" | "danger";
  crop: string;
  message: string;
  probability: number;
}

// ─── Constants ───────────────────────────────────────────────────────

const CROPS: Crop[] = [
  {
    id: "soy", name: "Soja", icon: "🫘", currentPhase: "Enchimento de grãos",
    healthScore: 78, yieldForecast: 3420, yieldUnit: "kg/ha",
    riskLevel: "medium", riskFactors: ["Chuva abaixo da média", "Risco de pragas"],
    plantDate: "Out/2024", harvestDate: "Mar/2025",
    idealTemp: [20, 30], idealRain: [450, 800],
  },
  {
    id: "corn", name: "Milho", icon: "🌽", currentPhase: "Florescimento",
    healthScore: 85, yieldForecast: 5800, yieldUnit: "kg/ha",
    riskLevel: "low", riskFactors: ["Condições favoráveis"],
    plantDate: "Set/2024", harvestDate: "Fev/2025",
    idealTemp: [18, 30], idealRain: [500, 800],
  },
  {
    id: "coffee", name: "Café", icon: "☕", currentPhase: "Maturação",
    healthScore: 62, yieldForecast: 1850, yieldUnit: "kg/ha",
    riskLevel: "high", riskFactors: ["Estiagem prolongada", "Ferrugem detectada", "Temp. acima ideal"],
    plantDate: "Perene", harvestDate: "Mai-Set/2025",
    idealTemp: [18, 23], idealRain: [1200, 1800],
  },
  {
    id: "sugarcane", name: "Cana-de-açúcar", icon: "🎋", currentPhase: "Crescimento vegetativo",
    healthScore: 91, yieldForecast: 82000, yieldUnit: "kg/ha",
    riskLevel: "low", riskFactors: ["Ventos fortes ocasionais"],
    plantDate: "Fev/2024", harvestDate: "Abr-Nov/2025",
    idealTemp: [22, 33], idealRain: [1100, 1500],
  },
  {
    id: "beans", name: "Feijão", icon: "🫘", currentPhase: "Floração",
    healthScore: 55, yieldForecast: 1100, yieldUnit: "kg/ha",
    riskLevel: "critical", riskFactors: ["Déficit hídrico severo", "Solo compactado", "Alta incidência de mosca-branca"],
    plantDate: "Jan/2025", harvestDate: "Abr/2025",
    idealTemp: [15, 29], idealRain: [300, 600],
  },
  {
    id: "cotton", name: "Algodão", icon: "🏵️", currentPhase: "Formação de maçãs",
    healthScore: 72, yieldForecast: 4200, yieldUnit: "kg/ha",
    riskLevel: "medium", riskFactors: ["Bicudo monitorado", "Chuvas irregulares"],
    plantDate: "Dez/2024", harvestDate: "Jul/2025",
    idealTemp: [20, 30], idealRain: [700, 1300],
  },
];

function generateWeatherForecast(): WeatherForecast[] {
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  return days.map(day => {
    const rain = Math.round(Math.random() * 25);
    return {
      day,
      temp: Math.round(22 + Math.random() * 12),
      rain,
      humidity: Math.round(50 + Math.random() * 40),
      wind: Math.round(5 + Math.random() * 20),
      condition: rain > 15 ? "storm" : rain > 8 ? "rainy" : rain > 3 ? "cloudy" : "sunny",
    };
  });
}

function generateRiskAlerts(occurrences: any[] | undefined): RiskAlert[] {
  const drought = occurrences?.filter(o => o.type === "drought").length || 0;
  const flood = occurrences?.filter(o => o.type === "flooding").length || 0;

  const alerts: RiskAlert[] = [];

  if (drought > 0) {
    alerts.push({
      type: "drought", severity: "danger", crop: "Café / Feijão",
      message: `Estiagem detectada na região — ${drought} ocorrências registradas. Risco crítico para culturas sensíveis.`,
      probability: Math.min(95, 50 + drought * 10),
    });
  }
  if (flood > 0) {
    alerts.push({
      type: "flood", severity: "warning", crop: "Soja / Milho",
      message: `Alagamento registrado próximo a áreas agrícolas — ${flood} ocorrências. Risco de perdas.`,
      probability: Math.min(90, 40 + flood * 10),
    });
  }
  alerts.push({
    type: "pest", severity: "warning", crop: "Algodão",
    message: "Aumento populacional de bicudo-do-algodoeiro registrado em armadilhas de monitoramento.",
    probability: 35,
  });
  alerts.push({
    type: "heatwave", severity: "warning", crop: "Café",
    message: "Previsão de ondas de calor nos próximos 10 dias. Temperaturas acima de 35°C podem comprometer floração.",
    probability: 55,
  });

  return alerts;
}

// ─── Components ──────────────────────────────────────────────────────

function CropCard({ crop, isExpanded, onToggle }: { crop: Crop; isExpanded: boolean; onToggle: () => void }) {
  const riskColors = {
    low: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800",
    medium: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800",
    high: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-800",
    critical: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800",
  };
  const riskLabels = { low: "Baixo", medium: "Médio", high: "Alto", critical: "Crítico" };
  const healthColor = crop.healthScore >= 80 ? "text-emerald-600" : crop.healthScore >= 60 ? "text-amber-600" : "text-red-600";

  return (
    <div className={`rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 overflow-hidden transition-all ${
      isExpanded ? "ring-2 ring-emerald-300/50" : ""
    }`}>
      <button onClick={onToggle} className="w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <span className="text-2xl">{crop.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{crop.name}</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${riskColors[crop.riskLevel]}`}>
              Risco {riskLabels[crop.riskLevel]}
            </span>
          </div>
          <div className="text-[10px] text-slate-400">{crop.currentPhase}</div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-black ${healthColor}`}>{crop.healthScore}%</div>
          <div className="text-[9px] text-slate-400">Saúde</div>
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-1 duration-200 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-3 pt-3">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
              <div className="text-[9px] text-emerald-500 font-bold">Previsão de Rendimento</div>
              <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                {crop.yieldForecast.toLocaleString("pt-BR")}
                <span className="text-xs font-medium ml-1">{crop.yieldUnit}</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20">
              <div className="text-[9px] text-blue-500 font-bold">Período</div>
              <div className="flex items-center gap-1 mt-1">
                <Sprout className="h-3 w-3 text-blue-400" />
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400">{crop.plantDate}</span>
                <span className="text-xs text-blue-400">→</span>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400">{crop.harvestDate}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20">
              <div className="text-[9px] text-amber-500 font-bold">Temp. Ideal</div>
              <div className="flex items-center gap-1 mt-1">
                <Thermometer className="h-3 w-3 text-amber-400" />
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{crop.idealTemp[0]}–{crop.idealTemp[1]}°C</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/20">
              <div className="text-[9px] text-sky-500 font-bold">Chuva Ideal</div>
              <div className="flex items-center gap-1 mt-1">
                <CloudRain className="h-3 w-3 text-sky-400" />
                <span className="text-xs font-bold text-sky-700 dark:text-sky-400">{crop.idealRain[0]}–{crop.idealRain[1]}mm</span>
              </div>
            </div>
          </div>
          {crop.riskFactors.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30">
              <div className="text-[9px] text-slate-500 font-bold mb-1.5">Fatores de Risco</div>
              <div className="flex flex-wrap gap-1.5">
                {crop.riskFactors.map((f, i) => (
                  <span key={i} className="text-[9px] font-medium bg-white dark:bg-slate-700 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Health bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-slate-400 font-bold">Índice de Saúde da Cultura</span>
              <span className={`text-[10px] font-bold ${healthColor}`}>{crop.healthScore}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${
                crop.healthScore >= 80 ? "bg-emerald-400" : crop.healthScore >= 60 ? "bg-amber-400" : "bg-red-400"
              }`} style={{ width: `${crop.healthScore}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WeatherBar({ forecast }: { forecast: WeatherForecast[] }) {
  const condIcons: Record<string, React.ReactNode> = {
    sunny: <Sun className="h-4 w-4 text-amber-400" />,
    cloudy: <Cloud className="h-4 w-4 text-slate-400" />,
    rainy: <CloudRain className="h-4 w-4 text-blue-400" />,
    storm: <Zap className="h-4 w-4 text-purple-400" />,
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {forecast.map((f, i) => (
        <div key={i} className="flex-shrink-0 w-20 p-2.5 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 text-center">
          <div className="text-[10px] font-bold text-slate-500">{f.day}</div>
          <div className="my-1.5 flex justify-center">{condIcons[f.condition]}</div>
          <div className="text-sm font-black text-slate-700 dark:text-white">{f.temp}°C</div>
          <div className="text-[9px] text-blue-400 font-bold">{f.rain}mm</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function CropForecast() {
  const { data: recentOccurrences } = trpc.occurrences.getRecent.useQuery({ limit: 100 });
  const [expandedCrop, setExpandedCrop] = useState<string | null>("coffee");

  const weather = useMemo(() => generateWeatherForecast(), []);
  const alerts = useMemo(() => generateRiskAlerts(recentOccurrences), [recentOccurrences]);

  const avgHealth = Math.round(CROPS.reduce((s, c) => s + c.healthScore, 0) / CROPS.length);
  const criticalCrops = CROPS.filter(c => c.riskLevel === "critical" || c.riskLevel === "high").length;
  const avgTemp = Math.round(weather.reduce((s, w) => s + w.temp, 0) / weather.length);
  const totalRain = weather.reduce((s, w) => s + w.rain, 0);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto pb-12 space-y-6">
        {/* Hero */}
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-lime-600 via-green-600 to-emerald-600 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <Wheat className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Previsão de Safra e Risco Agrícola</h1>
              <p className="text-lime-100 text-sm">Análise preditiva para pequenos produtores — baseada em dados ambientais</p>
            </div>
          </div>
          <div className="relative grid grid-cols-4 gap-3 mt-5">
            {[
              { value: `${avgHealth}%`, label: "Saúde Média", icon: "🌱" },
              { value: `${CROPS.length}`, label: "Culturas", icon: "🌾" },
              { value: `${criticalCrops}`, label: "Em Risco", icon: "⚠️" },
              { value: `${avgTemp}°C`, label: "Temp. Média", icon: "🌡️" },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-lg font-black text-white">{s.icon} {s.value}</div>
                <div className="text-[10px] text-lime-100 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Weather Forecast */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Cloud className="h-4 w-4 text-blue-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Previsão Climática — Próximos 7 Dias</h2>
            <div className="flex-1" />
            <span className="text-[9px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded-full">
              Acumulado: {totalRain}mm
            </span>
          </div>
          <WeatherBar forecast={weather} />
        </div>

        {/* Risk Alerts */}
        {alerts.length > 0 && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Alertas de Risco Agrícola</h2>
              <span className="text-[9px] font-bold bg-red-50 text-red-600 dark:bg-red-950/20 px-2 py-0.5 rounded-full">{alerts.length} alertas</span>
            </div>
            <div className="space-y-2">
              {alerts.map((a, i) => {
                const typeLabels: Record<string, string> = { drought: "Estiagem", flood: "Alagamento", pest: "Praga", frost: "Geada", heatwave: "Calor Extremo", storm: "Tempestade" };
                const typeIcons: Record<string, string> = { drought: "🏜️", flood: "🌊", pest: "🐛", frost: "❄️", heatwave: "🔥", storm: "⛈️" };
                const isDanger = a.severity === "danger";
                return (
                  <div key={i} className={`p-3 rounded-xl border ${
                    isDanger ? "bg-red-50 dark:bg-red-950/15 border-red-200 dark:border-red-800" : "bg-amber-50 dark:bg-amber-950/15 border-amber-200 dark:border-amber-800"
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{typeIcons[a.type]}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${isDanger ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}`}>
                            {typeLabels[a.type]}
                          </span>
                          <span className="text-[9px] bg-white/60 dark:bg-slate-800/60 px-1.5 py-0.5 rounded font-medium text-slate-500">{a.crop}</span>
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5">{a.message}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-black ${isDanger ? "text-red-600" : "text-amber-600"}`}>{a.probability}%</div>
                        <div className="text-[8px] text-slate-400">probabilidade</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Crop Cards */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Sprout className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Culturas Monitoradas</h2>
            <div className="flex-1" />
            <span className="text-[9px] font-bold text-slate-400">{CROPS.length} culturas</span>
          </div>
          <div className="space-y-3">
            {CROPS.map(crop => (
              <CropCard
                key={crop.id}
                crop={crop}
                isExpanded={expandedCrop === crop.id}
                onToggle={() => setExpandedCrop(expandedCrop === crop.id ? null : crop.id)}
              />
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-violet-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Recomendações para o Período</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { icon: <Droplets className="h-4 w-4 text-blue-500" />, title: "Irrigação Inteligente", desc: "Com chuvas abaixo da média, priorize irrigação por gotejamento no café e feijão. Economia de até 40% de água.", tag: "Hídrico" },
              { icon: <Bug className="h-4 w-4 text-orange-500" />, title: "Manejo Integrado de Pragas", desc: "Monitore armadilhas de bicudo semanalmente. Aplique controle biológico na soja (Trichogramma).", tag: "MIP" },
              { icon: <Leaf className="h-4 w-4 text-emerald-500" />, title: "Cobertura Verde", desc: "Implante plantas de cobertura nas entrelinhas para proteger o solo e reter umidade durante estiagem.", tag: "Solo" },
              { icon: <Activity className="h-4 w-4 text-purple-500" />, title: "Monitoramento de Estresse", desc: "Utilize NDVI semanal para detectar estresse hídrico precoce nas lavouras de milho e café.", tag: "Remoto" },
            ].map((rec, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-2 mb-1.5">
                  {rec.icon}
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{rec.title}</span>
                  <span className="text-[8px] font-bold bg-violet-100 dark:bg-violet-950/30 text-violet-600 px-1.5 py-0.5 rounded-full">{rec.tag}</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{rec.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Methodology */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Metodologia e Referências</h3>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Previsões baseadas em modelos agrometeorológicos que correlacionam ocorrências ambientais (EcoMonitor) com
            indicadores de risco agrícola. Utiliza conceitos de balanço hídrico climatológico (Thornthwaite-Mather),
            zoneamento agroclimático (EMBRAPA), índices de vegetação NDVI (INPE), e curvas de resposta das culturas
            ao estresse hídrico e térmico (FAO AquaCrop). Dados climáticos simulados para fins acadêmicos.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {["EMBRAPA", "FAO AquaCrop", "INPE/CPTEC", "CONAB", "IBGE/PAM", "Thornthwaite-Mather"].map(ref => (
              <span key={ref} className="text-[8px] font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-500 border border-slate-200 dark:border-slate-700">{ref}</span>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
