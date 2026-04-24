import { useState, useMemo, useEffect } from "react";
import {
  Sprout, MapPin, TrendingUp, TrendingDown, Droplets, ThermometerSun,
  Activity, BarChart3, AlertTriangle, CheckCircle2, Clock, Target,
  ChevronDown, ChevronUp, Leaf, TreePine, Sun, Eye, Zap, Globe,
  Filter, ArrowUpRight, RefreshCw, Heart,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";

// ─── Types ───────────────────────────────────────────────────────────

interface Seedling {
  id: string;
  species: string;
  scientificName: string;
  plantedDate: string;
  zone: string;
  status: "germinating" | "growing" | "established" | "stressed" | "dead";
  survivalDays: number;
  heightCm: number;
  soilMoisture: number; // 0-100
  soilTemp: number; // °C
  stressLevel: number; // 0-100
  sensorActive: boolean;
}

interface RefZone {
  id: string;
  name: string;
  totalSeedlings: number;
  survived: number;
  survivalRate: number;
  avgHeight: number;
  avgMoisture: number;
  status: "excellent" | "good" | "moderate" | "critical";
  areaHa: number;
  biome: string;
}

// ─── Constants ───────────────────────────────────────────────────────

const ZONES: RefZone[] = [
  { id: "z1", name: "Parcela A — Cerrado Restauro", totalSeedlings: 12400, survived: 10540, survivalRate: 85.0, avgHeight: 42, avgMoisture: 38, status: "good", areaHa: 25, biome: "Cerrado" },
  { id: "z2", name: "Parcela B — Mata Ciliar Rio Verde", totalSeedlings: 8200, survived: 7544, survivalRate: 92.0, avgHeight: 68, avgMoisture: 62, status: "excellent", areaHa: 12, biome: "Mata Atlântica" },
  { id: "z3", name: "Parcela C — Caatinga Semiárida", totalSeedlings: 15600, survived: 9984, survivalRate: 64.0, avgHeight: 18, avgMoisture: 15, status: "critical", areaHa: 40, biome: "Caatinga" },
  { id: "z4", name: "Parcela D — APP Degradada", totalSeedlings: 5800, survived: 4524, survivalRate: 78.0, avgHeight: 35, avgMoisture: 45, status: "moderate", areaHa: 8, biome: "Mata Atlântica" },
  { id: "z5", name: "Parcela E — Manguezal", totalSeedlings: 3200, survived: 2912, survivalRate: 91.0, avgHeight: 55, avgMoisture: 78, status: "excellent", areaHa: 5, biome: "Manguezal" },
];

const SEEDLINGS: Seedling[] = [
  { id: "sd1", species: "Ipê-amarelo", scientificName: "Handroanthus albus", plantedDate: "2025-09-15", zone: "z1", status: "established", survivalDays: 170, heightCm: 52, soilMoisture: 35, soilTemp: 28, stressLevel: 12, sensorActive: true },
  { id: "sd2", species: "Jatobá", scientificName: "Hymenaea courbaril", plantedDate: "2025-10-01", zone: "z1", status: "growing", survivalDays: 154, heightCm: 38, soilMoisture: 40, soilTemp: 27, stressLevel: 20, sensorActive: true },
  { id: "sd3", species: "Pau-Brasil", scientificName: "Paubrasilia echinata", plantedDate: "2025-09-20", zone: "z2", status: "established", survivalDays: 165, heightCm: 72, soilMoisture: 58, soilTemp: 24, stressLevel: 8, sensorActive: true },
  { id: "sd4", species: "Juazeiro", scientificName: "Ziziphus joazeiro", plantedDate: "2025-08-10", zone: "z3", status: "stressed", survivalDays: 206, heightCm: 15, soilMoisture: 8, soilTemp: 38, stressLevel: 78, sensorActive: true },
  { id: "sd5", species: "Mandacaru", scientificName: "Cereus jamacaru", plantedDate: "2025-08-10", zone: "z3", status: "established", survivalDays: 206, heightCm: 22, soilMoisture: 10, soilTemp: 39, stressLevel: 25, sensorActive: true },
  { id: "sd6", species: "Cedro-rosa", scientificName: "Cedrela fissilis", plantedDate: "2025-11-01", zone: "z2", status: "growing", survivalDays: 123, heightCm: 45, soilMoisture: 65, soilTemp: 23, stressLevel: 5, sensorActive: true },
  { id: "sd7", species: "Embaúba", scientificName: "Cecropia pachystachya", plantedDate: "2025-10-15", zone: "z4", status: "growing", survivalDays: 140, heightCm: 60, soilMoisture: 42, soilTemp: 26, stressLevel: 18, sensorActive: true },
  { id: "sd8", species: "Mangue-vermelho", scientificName: "Rhizophora mangle", plantedDate: "2025-09-01", zone: "z5", status: "established", survivalDays: 184, heightCm: 58, soilMoisture: 82, soilTemp: 26, stressLevel: 6, sensorActive: true },
  { id: "sd9", species: "Catingueira", scientificName: "Poincianella pyramidalis", plantedDate: "2025-08-20", zone: "z3", status: "dead", survivalDays: 95, heightCm: 8, soilMoisture: 3, soilTemp: 42, stressLevel: 100, sensorActive: false },
  { id: "sd10", species: "Aroeira", scientificName: "Schinus terebinthifolia", plantedDate: "2025-10-20", zone: "z4", status: "growing", survivalDays: 135, heightCm: 32, soilMoisture: 48, soilTemp: 25, stressLevel: 15, sensorActive: true },
];

const STATUS_CONFIG = {
  germinating: { label: "Germinando", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20", emoji: "🌱" },
  growing: { label: "Crescendo", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20", emoji: "🌿" },
  established: { label: "Estabelecida", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20", emoji: "🌳" },
  stressed: { label: "Estressada", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/20", emoji: "⚠️" },
  dead: { label: "Morta", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/20", emoji: "💀" },
};

const ZONE_HEALTH = {
  excellent: { label: "Excelente", color: "bg-emerald-500" },
  good: { label: "Bom", color: "bg-blue-500" },
  moderate: { label: "Moderado", color: "bg-amber-500" },
  critical: { label: "Crítico", color: "bg-red-500" },
};

// ─── Kaplan-Meier ────────────────────────────────────────────────────

function generateKaplanMeier() {
  // Simulated survival curve data (days → survival probability)
  const curve = [
    { day: 0, survival: 1.0 },
    { day: 7, survival: 0.97 },
    { day: 14, survival: 0.94 },
    { day: 30, survival: 0.89 },
    { day: 60, survival: 0.84 },
    { day: 90, survival: 0.80 },
    { day: 120, survival: 0.78 },
    { day: 150, survival: 0.76 },
    { day: 180, survival: 0.75 },
    { day: 210, survival: 0.74 },
    { day: 240, survival: 0.74 },
    { day: 365, survival: 0.73 },
  ];
  return curve;
}

// ─── Main Component ────────────────────────────────────────────────

export default function InternetOfSeeds() {
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [liveCount, setLiveCount] = useState(0);

  const totalSeedlings = ZONES.reduce((s, z) => s + z.totalSeedlings, 0);
  const totalSurvived = ZONES.reduce((s, z) => s + z.survived, 0);
  const overallSurvival = (totalSurvived / totalSeedlings) * 100;
  const totalArea = ZONES.reduce((s, z) => s + z.areaHa, 0);
  const kmCurve = useMemo(() => generateKaplanMeier(), []);

  const filteredSeedlings = useMemo(() => {
    if (selectedZone === "all") return SEEDLINGS;
    return SEEDLINGS.filter(s => s.zone === selectedZone);
  }, [selectedZone]);

  // Simulated live sensor counter
  useEffect(() => {
    setLiveCount(SEEDLINGS.filter(s => s.sensorActive).length);
    const interval = setInterval(() => {
      setLiveCount(prev => prev + (Math.random() > 0.7 ? 1 : 0));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto pb-12 space-y-6">
        {/* Hero */}
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-lime-700 via-green-700 to-emerald-700 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <Sprout className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Internet of Seeds</h1>
              <p className="text-lime-100 text-sm">Rastreamento individualizado de mudas com nano-sensores biodegradáveis</p>
            </div>
          </div>
          <div className="relative grid grid-cols-4 gap-3 mt-5">
            {[
              { value: `${(totalSeedlings / 1000).toFixed(1)}k`, label: "Mudas plantadas", icon: "🌱" },
              { value: `${overallSurvival.toFixed(1)}%`, label: "Taxa de sobrevivência", icon: "📈" },
              { value: `${totalArea} ha`, label: "Área de plantio", icon: "🗺️" },
              { value: liveCount * 1000, label: "Sensores ativos (IoS)", icon: "📡" },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-lg font-black text-white">{s.icon} {typeof s.value === "number" ? s.value.toLocaleString("pt-BR") : s.value}</div>
                <div className="text-[10px] text-lime-100 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Kaplan-Meier Survival Curve */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-lime-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Curva de Sobrevivência (Kaplan-Meier)</span>
            </div>
            <div className="relative h-48 border-l-2 border-b-2 border-slate-200 dark:border-slate-700">
              {/* Y-axis */}
              <div className="absolute -left-8 top-0 bottom-0 flex flex-col justify-between text-[8px] text-slate-400 font-mono">
                <span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span>
              </div>
              {/* X-axis */}
              <div className="absolute bottom-[-18px] left-0 right-0 flex justify-between text-[8px] text-slate-400 font-mono px-2">
                <span>0d</span><span>60d</span><span>120d</span><span>180d</span><span>365d</span>
              </div>
              {/* Curve */}
              <svg viewBox="0 0 365 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="kmGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#84cc16" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#84cc16" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <path
                  d={kmCurve.map((p, i) => `${i === 0 ? "M" : "L"} ${p.day} ${(1 - p.survival) * 100}`).join(" ") + ` L 365 ${(1 - kmCurve[kmCurve.length - 1].survival) * 100} L 365 100 L 0 100 Z`}
                  fill="url(#kmGrad)"
                />
                <path
                  d={kmCurve.map((p, i) => `${i === 0 ? "M" : "L"} ${p.day} ${(1 - p.survival) * 100}`).join(" ")}
                  fill="none" stroke="#84cc16" strokeWidth="2"
                />
                {kmCurve.map((p, i) => (
                  <circle key={i} cx={p.day} cy={(1 - p.survival) * 100} r="3" fill="#84cc16" />
                ))}
              </svg>
              {/* Critical period highlight */}
              <div className="absolute top-0 left-0 w-[25%] h-full bg-red-500/5 border-r border-red-300/30 dark:border-red-700/30">
                <span className="absolute top-1 left-1 text-[7px] text-red-400 font-bold">Período Crítico</span>
              </div>
            </div>
            <div className="mt-6 text-[9px] text-slate-400">
              <strong>Kaplan-Meier estimator:</strong> S(t) = Π(t_i ≤ t) [(n_i - d_i) / n_i]. Maior mortalidade nos primeiros 90 dias. Taxa estabiliza após 150 dias.
            </div>
          </div>

          {/* Quick Stats */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Nano-Sensores IoS</div>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-lime-50 dark:bg-lime-950/20">
                <div className="text-[9px] font-bold text-lime-600">Tecnologia</div>
                <div className="text-xs text-lime-700 dark:text-lime-400 font-medium">RFID biodegradável + celulose</div>
                <div className="text-[8px] text-lime-500">Decompõe em 120 dias — 0 microplásticos</div>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20">
                <div className="text-[9px] font-bold text-blue-600">Dados captados</div>
                <div className="text-[10px] text-blue-700 dark:text-blue-300 space-y-0.5">
                  <div>💧 Umidade do solo (capacitivo)</div>
                  <div>🌡️ Temperatura (termistor NTC)</div>
                  <div>🧪 pH do solo (ISFET)</div>
                  <div>📡 Estresse hídrico (impedância)</div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20">
                <div className="text-[9px] font-bold text-amber-600">Edge AI</div>
                <div className="text-xs text-amber-700 dark:text-amber-400">Processamento local via ESP32</div>
                <div className="text-[8px] text-amber-500">Dados químicos → predição de estresse → alerta</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                <div className="text-[9px] font-bold text-slate-500">Transmissão</div>
                <div className="text-xs text-slate-600 dark:text-slate-300">LoRaWAN → Gateway → EcoMonitor</div>
                <div className="text-[8px] text-slate-400">Alcance: 15 km em área rural</div>
              </div>
            </div>
          </div>
        </div>

        {/* Zones */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4 text-lime-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Parcelas de Reflorestamento</h2>
            <div className="flex-1" />
            <span className="text-[9px] text-slate-400 font-bold">{ZONES.length} zonas • {totalArea} ha</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ZONES.map(z => {
              const health = ZONE_HEALTH[z.status];
              return (
                <button
                  key={z.id}
                  onClick={() => setSelectedZone(selectedZone === z.id ? "all" : z.id)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    selectedZone === z.id
                      ? "border-lime-300 dark:border-lime-700 ring-2 ring-lime-500/20 bg-lime-50/30 dark:bg-lime-950/10"
                      : "border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${health.color}`} />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{z.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-lg font-black text-slate-700 dark:text-slate-200">{z.survivalRate}%</div>
                      <div className="text-[8px] text-slate-400">sobrevivência</div>
                    </div>
                    <div>
                      <div className="text-lg font-black text-lime-600">{z.avgHeight}cm</div>
                      <div className="text-[8px] text-slate-400">altura média</div>
                    </div>
                  </div>
                  <div className="mt-2 text-[9px] text-slate-400">
                    {z.totalSeedlings.toLocaleString("pt-BR")} mudas • {z.areaHa} ha • {z.biome}
                  </div>
                  <div className="mt-1.5 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${health.color}`} style={{ width: `${z.survivalRate}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Individual Seedlings */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="h-4 w-4 text-green-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Mudas Rastreadas (amostra)</h2>
            <div className="flex-1" />
            <div className="flex gap-1">
              <button onClick={() => setSelectedZone("all")} className={`px-2 py-1 rounded-lg text-[10px] font-bold ${selectedZone === "all" ? "bg-lime-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>Todas</button>
              {ZONES.map(z => (
                <button key={z.id} onClick={() => setSelectedZone(z.id)} className={`px-2 py-1 rounded-lg text-[10px] font-bold ${selectedZone === z.id ? "bg-lime-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>{z.id.toUpperCase()}</button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {filteredSeedlings.map(s => {
              const st = STATUS_CONFIG[s.status];
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <span className="text-lg">{st.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{s.species}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${st.bg} ${st.color}`}>{st.label}</span>
                      {s.sensorActive && <span className="text-[7px] text-emerald-500 font-bold animate-pulse">● LIVE</span>}
                    </div>
                    <div className="text-[9px] text-slate-400 italic">{s.scientificName}</div>
                  </div>
                  <div className="flex gap-3 text-[10px]">
                    <div className="text-center">
                      <div className="font-bold text-slate-700 dark:text-slate-200">{s.heightCm}cm</div>
                      <div className="text-[8px] text-slate-400">Altura</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blue-600">{s.soilMoisture}%</div>
                      <div className="text-[8px] text-slate-400">Umidade</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-orange-600">{s.soilTemp}°C</div>
                      <div className="text-[8px] text-slate-400">Temp.</div>
                    </div>
                    <div className="text-center">
                      <div className={`font-bold ${s.stressLevel > 60 ? "text-red-600" : s.stressLevel > 30 ? "text-amber-600" : "text-emerald-600"}`}>{s.stressLevel}%</div>
                      <div className="text-[8px] text-slate-400">Estresse</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-slate-600 dark:text-slate-300">{s.survivalDays}d</div>
                      <div className="text-[8px] text-slate-400">Idade</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Methodology */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">Metodologia Científica</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold text-lime-600 mb-1">Kaplan-Meier Estimator</div>
              <div className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                Ŝ(t) = Π(t_i ≤ t) [(n_i - d_i) / n_i]
              </div>
              <div className="text-[9px] text-slate-400 mt-1">Kaplan & Meier (1958). Análise não-paramétrica de sobrevivência.</div>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold text-blue-600 mb-1">Nano-Sensores Biodegradáveis</div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                RFID + substrato de celulose-nanofibrila. Autodegradação em 60–120 dias.
              </div>
              <div className="text-[9px] text-slate-400 mt-1">Irimia-Vladu et al. (2012). Green Electronics.</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {["Kaplan & Meier (1958)", "LoRaWAN Alliance", "Irimia-Vladu (2012)", "INPE/PRODES", "SFB — Planaveg", "Lamb et al. (2005)"].map(ref => (
              <span key={ref} className="text-[8px] font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-500 border border-slate-200 dark:border-slate-700">{ref}</span>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
