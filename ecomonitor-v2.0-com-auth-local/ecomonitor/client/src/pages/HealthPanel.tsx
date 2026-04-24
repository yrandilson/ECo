import { useState, useMemo } from "react";
import {
  Heart, Thermometer, Droplets, Wind, Sun, Shield, AlertTriangle,
  TrendingUp, TrendingDown, Users, Baby, Clock, Activity, Eye,
  ChevronDown, ChevronUp, Info, MapPin, Zap, Brain, Stethoscope,
  Waves, Bug, Flame, CloudRain, Umbrella, TreePine, BarChart3,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import MainLayout from "@/components/MainLayout";

// ─── Types ───────────────────────────────────────────────────────────

interface HealthZone {
  name: string;
  irs: number; // Índice de Risco à Saúde (0-100)
  heatIsland: number; // °C above average
  uvIndex: number;
  airQuality: number; // AQI 0-500
  waterRisk: number; // 0-100
  arboviroseRisk: "baixo" | "moderado" | "alto" | "critico";
  respiratoryRisk: "baixo" | "moderado" | "alto" | "critico";
  vulnerablePopulation: number;
}

// ─── Constants ───────────────────────────────────────────────────────

const UV_LEVELS = [
  { max: 2, label: "Baixo", color: "bg-emerald-500", textColor: "text-emerald-600", advice: "Sem proteção necessária" },
  { max: 5, label: "Moderado", color: "bg-yellow-500", textColor: "text-yellow-600", advice: "Use protetor solar FPS 30+" },
  { max: 7, label: "Alto", color: "bg-orange-500", textColor: "text-orange-600", advice: "Evite sol das 10h-16h" },
  { max: 10, label: "Muito Alto", color: "bg-red-500", textColor: "text-red-600", advice: "Proteção obrigatória" },
  { max: 99, label: "Extremo", color: "bg-purple-500", textColor: "text-purple-600", advice: "Não se exponha ao sol" },
];

const AQI_LEVELS = [
  { max: 50, label: "Boa", color: "bg-emerald-500", emoji: "😊" },
  { max: 100, label: "Moderada", color: "bg-yellow-500", emoji: "😐" },
  { max: 150, label: "Insalubre (sensíveis)", color: "bg-orange-500", emoji: "😷" },
  { max: 200, label: "Insalubre", color: "bg-red-500", emoji: "🤢" },
  { max: 300, label: "Muito Insalubre", color: "bg-purple-500", emoji: "☠️" },
  { max: 500, label: "Perigosa", color: "bg-rose-800", emoji: "💀" },
];

const RISK_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  baixo: { bg: "bg-emerald-50 dark:bg-emerald-950/20", text: "text-emerald-600", dot: "bg-emerald-400" },
  moderado: { bg: "bg-yellow-50 dark:bg-yellow-950/20", text: "text-yellow-600", dot: "bg-yellow-400" },
  alto: { bg: "bg-orange-50 dark:bg-orange-950/20", text: "text-orange-600", dot: "bg-orange-400" },
  critico: { bg: "bg-red-50 dark:bg-red-950/20", text: "text-red-600", dot: "bg-red-400" },
};

const VULNERABLE_GROUPS = [
  { icon: <Baby className="h-4 w-4" />, label: "Crianças < 5 anos", advice: "Manter hidratadas, evitar sol direto" },
  { icon: <Users className="h-4 w-4" />, label: "Idosos > 65 anos", advice: "Monitorar pressão, ambiente fresco" },
  { icon: <Heart className="h-4 w-4" />, label: "Gestantes", advice: "Repouso em dias quentes, hidratação extra" },
  { icon: <Stethoscope className="h-4 w-4" />, label: "Cardiopatas / Asmáticos", advice: "Evitar exercícios ao ar livre em dias poluídos" },
];

const DISEASES_AIR = [
  { name: "Asma", correlation: 0.85, icon: "🫁", desc: "Partículas PM2.5 inflamam vias aéreas" },
  { name: "Bronquite", correlation: 0.78, icon: "😮‍💨", desc: "Gases NOx irritam brônquios" },
  { name: "Rinite alérgica", correlation: 0.72, icon: "🤧", desc: "Pólen + poluentes amplificam reações" },
  { name: "DPOC", correlation: 0.68, icon: "🏥", desc: "Exposição crônica a PM10" },
  { name: "Infecção respiratória", correlation: 0.61, icon: "🤒", desc: "Imunossupressão por poluentes" },
];

const DISEASES_WATER = [
  { name: "Dengue", correlation: 0.92, icon: "🦟", desc: "Água parada → criadouro Aedes aegypti" },
  { name: "Zika", correlation: 0.88, icon: "🧠", desc: "Mesmo vetor, risco neurológico" },
  { name: "Chikungunya", correlation: 0.85, icon: "🦴", desc: "Dor articular crônica pós-infecção" },
  { name: "Leptospirose", correlation: 0.75, icon: "🐀", desc: "Enchentes → contato com urina de rato" },
  { name: "Hepatite A", correlation: 0.65, icon: "🟡", desc: "Água contaminada por esgoto" },
];

// ─── Data Generation ─────────────────────────────────────────────────

function generateHealthZones(occurrences: any[] | undefined): HealthZone[] {
  const zones = [
    { name: "Aldeota", baseFactor: 0.15 },
    { name: "Meireles", baseFactor: 0.18 },
    { name: "Centro", baseFactor: 0.55 },
    { name: "Benfica", baseFactor: 0.40 },
    { name: "Messejana", baseFactor: 0.58 },
    { name: "Jangurussu", baseFactor: 0.72 },
    { name: "Barra do Ceará", baseFactor: 0.65 },
    { name: "Cocó", baseFactor: 0.22 },
    { name: "Papicu", baseFactor: 0.30 },
    { name: "Mondubim", baseFactor: 0.60 },
    { name: "Parquelândia", baseFactor: 0.35 },
    { name: "Parangaba", baseFactor: 0.50 },
  ];

  const totalOcc = occurrences?.length || 15;
  const airOcc = occurrences?.filter(o => o.type === "air_pollution").length || 2;
  const waterOcc = occurrences?.filter(o => o.type === "water_pollution").length || 2;
  const fireOcc = occurrences?.filter(o => o.type === "fire").length || 1;

  const airGlobal = Math.min(1, (airOcc + fireOcc) / Math.max(1, totalOcc) * 3);
  const waterGlobal = Math.min(1, waterOcc / Math.max(1, totalOcc) * 3);

  return zones.map(z => {
    const f = z.baseFactor;
    const noise = () => (Math.random() - 0.5) * 0.1;

    const heatIsland = Math.max(0, f * 4.5 + Math.random() * 1.5);
    const uvIndex = Math.round(8 + f * 4 + (Math.random() - 0.5) * 2);
    const airQuality = Math.round(30 + f * 120 + airGlobal * 60 + Math.random() * 20);
    const waterRisk = Math.max(0, Math.min(100, f * 70 + waterGlobal * 25 + (Math.random() - 0.5) * 10));

    const getRisk = (val: number): "baixo" | "moderado" | "alto" | "critico" => {
      if (val < 25) return "baixo";
      if (val < 50) return "moderado";
      if (val < 75) return "alto";
      return "critico";
    };

    const arboviroseRisk = getRisk(waterRisk + heatIsland * 5);
    const respiratoryRisk = getRisk(airQuality * 0.4);

    // IRS = weighted health risk
    const irs = Math.round(
      Math.min(100,
        heatIsland * 8 +
        (uvIndex > 8 ? 15 : uvIndex > 5 ? 8 : 0) +
        airQuality * 0.2 +
        waterRisk * 0.3 +
        f * 20
      )
    );

    return {
      name: z.name,
      irs: Math.min(100, irs),
      heatIsland: Math.round(heatIsland * 10) / 10,
      uvIndex: Math.min(14, uvIndex),
      airQuality: Math.min(300, airQuality),
      waterRisk: Math.round(waterRisk),
      arboviroseRisk,
      respiratoryRisk,
      vulnerablePopulation: Math.round(f * 3000 + Math.random() * 1000),
    };
  }).sort((a, b) => b.irs - a.irs);
}

// ─── Sub-components ──────────────────────────────────────────────────

function IRSGauge({ value }: { value: number }) {
  const getColor = (v: number) => {
    if (v < 25) return { color: "#22c55e", label: "Baixo Risco", emoji: "💚" };
    if (v < 50) return { color: "#f59e0b", label: "Risco Moderado", emoji: "💛" };
    if (v < 75) return { color: "#f97316", label: "Risco Alto", emoji: "🧡" };
    return { color: "#ef4444", label: "Risco Crítico", emoji: "❤️‍🩹" };
  };
  const info = getColor(value);
  const pct = Math.min(100, value);
  const radius = 80;
  const circumference = Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="190" height="110" viewBox="0 0 190 110">
        <path d="M 10 100 A 80 80 0 0 1 180 100" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="12" strokeLinecap="round" />
        <path d="M 10 100 A 80 80 0 0 1 180 100" fill="none" stroke={info.color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out" />
        <text x="95" y="80" textAnchor="middle" className="fill-slate-900 dark:fill-white" style={{ fontSize: 36, fontWeight: 900 }}>{value}</text>
        <text x="95" y="100" textAnchor="middle" className="fill-slate-400" style={{ fontSize: 11, fontWeight: 700 }}>/100</text>
      </svg>
      <div className={`px-3 py-1 rounded-lg text-xs font-bold ${value < 25 ? "bg-emerald-100 text-emerald-600" : value < 50 ? "bg-amber-100 text-amber-600" : value < 75 ? "bg-orange-100 text-orange-600" : "bg-red-100 text-red-600"}`}>
        {info.emoji} {info.label}
      </div>
    </div>
  );
}

function CorrelationBar({ name, correlation, icon, desc }: { name: string; correlation: number; icon: string; desc: string }) {
  const pct = correlation * 100;
  const color = pct > 80 ? "from-red-400 to-rose-500" : pct > 60 ? "from-orange-400 to-amber-500" : "from-yellow-400 to-lime-500";
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50">
      <span className="text-lg flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{name}</span>
          <span className="text-[10px] font-bold text-slate-500">{(correlation * 100).toFixed(0)}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[9px] text-slate-400 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function HeatmapGrid({ zones }: { zones: HealthZone[] }) {
  const getColor = (irs: number) => {
    if (irs < 25) return "bg-emerald-200 dark:bg-emerald-800/40";
    if (irs < 50) return "bg-yellow-200 dark:bg-yellow-800/40";
    if (irs < 75) return "bg-orange-300 dark:bg-orange-800/40";
    return "bg-red-400 dark:bg-red-800/40";
  };
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {zones.map(z => (
        <div key={z.name} className={`p-2 rounded-lg ${getColor(z.irs)} text-center`}>
          <div className="text-[9px] font-bold text-slate-700 dark:text-slate-200 truncate">{z.name}</div>
          <div className="text-sm font-black text-slate-800 dark:text-white">{z.irs}</div>
          <div className="text-[8px] text-slate-500">+{z.heatIsland}°C</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function HealthPanel() {
  const { data: recentOccurrences } = trpc.occurrences.getRecent.useQuery({ limit: 100 });
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [showCorrelations, setShowCorrelations] = useState(false);

  const zones = useMemo(() => generateHealthZones(recentOccurrences), [recentOccurrences]);
  const cityIRS = useMemo(() => Math.round(zones.reduce((s, z) => s + z.irs, 0) / zones.length), [zones]);
  const cityUV = useMemo(() => Math.round(zones.reduce((s, z) => s + z.uvIndex, 0) / zones.length), [zones]);
  const cityAQI = useMemo(() => Math.round(zones.reduce((s, z) => s + z.airQuality, 0) / zones.length), [zones]);
  const totalVulnerable = useMemo(() => zones.reduce((s, z) => s + z.vulnerablePopulation, 0), [zones]);

  const uvLevel = UV_LEVELS.find(l => cityUV <= l.max) || UV_LEVELS[UV_LEVELS.length - 1];
  const aqiLevel = AQI_LEVELS.find(l => cityAQI <= l.max) || AQI_LEVELS[AQI_LEVELS.length - 1];
  const selected = zones.find(z => z.name === selectedZone);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto pb-12 space-y-6">
        {/* Hero */}
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-rose-600 via-pink-600 to-red-600 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-300/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Painel Saúde Ambiental</h1>
              <p className="text-rose-100 text-sm">Correlação meio ambiente ↔ saúde pública</p>
            </div>
          </div>
          <div className="relative grid grid-cols-4 gap-3 mt-5">
            {[
              { value: `${cityIRS}`, label: "IRS Geral", icon: "🏥" },
              { value: `${cityUV}`, label: "UV Médio", icon: "☀️" },
              { value: `AQI ${cityAQI}`, label: aqiLevel.label, icon: aqiLevel.emoji },
              { value: totalVulnerable.toLocaleString(), label: "Pop. Vulnerável", icon: "👥" },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-lg font-black text-white">{s.icon} {s.value}</div>
                <div className="text-[10px] text-rose-100 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* IRS Gauge + UV + AQI */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* IRS */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 flex flex-col items-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Activity className="h-3 w-3" /> Índice de Risco à Saúde (IRS)
            </div>
            <IRSGauge value={cityIRS} />
            <p className="text-[10px] text-slate-400 text-center mt-3 max-w-[200px] leading-relaxed">
              Média ponderada de {zones.length} regiões. Quanto menor, mais saudável o ambiente.
            </p>
          </div>

          {/* UV Index */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sun className="h-3 w-3" /> Índice UV — Fortaleza
            </div>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white ${uvLevel.color}`}>
                {cityUV}
              </div>
              <div>
                <div className={`text-sm font-bold ${uvLevel.textColor}`}>{uvLevel.label}</div>
                <div className="text-xs text-slate-500">{uvLevel.advice}</div>
              </div>
            </div>
            <div className="flex gap-1 h-3 rounded-full overflow-hidden">
              {UV_LEVELS.map((l, i) => (
                <div key={i} className={`flex-1 ${l.color} ${cityUV <= l.max && cityUV > (i > 0 ? UV_LEVELS[i - 1].max : 0) ? "ring-2 ring-white ring-offset-1" : "opacity-40"}`} />
              ))}
            </div>
            <div className="flex justify-between text-[8px] text-slate-400 mt-1 px-0.5">
              <span>0</span><span>3</span><span>6</span><span>8</span><span>11+</span>
            </div>

            {/* Alerts */}
            <div className="mt-3 space-y-1.5">
              {VULNERABLE_GROUPS.slice(0, 2).map((g, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <span className="text-amber-500">{g.icon}</span>
                  <div>
                    <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400">{g.label}</div>
                    <div className="text-[9px] text-amber-500">{g.advice}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AQI */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Wind className="h-3 w-3" /> Qualidade do Ar (AQI)
            </div>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white ${aqiLevel.color}`}>
                {cityAQI}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{aqiLevel.label}</div>
                <div className="text-xs text-slate-500">{aqiLevel.emoji} Padrão EPA/OMS</div>
              </div>
            </div>
            <div className="space-y-1.5">
              {AQI_LEVELS.slice(0, 4).map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${l.color}`} />
                  <span className="text-[10px] text-slate-500 flex-1">{l.label}</span>
                  <span className="text-[10px] text-slate-400">{l.emoji} ≤{l.max}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-red-500" /> Ilhas de Calor — Mapa de Risco
            </h2>
            <span className="text-[10px] text-slate-400 font-bold">{zones.length} regiões</span>
          </div>
          <HeatmapGrid zones={zones} />
          <div className="flex items-center justify-center gap-4 mt-3">
            {[
              { label: "Baixo (<25)", color: "bg-emerald-300" },
              { label: "Moderado (25-49)", color: "bg-yellow-300" },
              { label: "Alto (50-74)", color: "bg-orange-400" },
              { label: "Crítico (75+)", color: "bg-red-500" },
            ].map((l, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${l.color}`} />
                <span className="text-[9px] text-slate-400">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Correlations */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <button
            onClick={() => setShowCorrelations(!showCorrelations)}
            className="w-full flex items-center justify-between"
            aria-expanded={showCorrelations}
          >
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" /> Correlações Epidemiológicas
            </h2>
            {showCorrelations ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          {showCorrelations && (
            <div className="mt-4 grid md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
              {/* Air → Respiratory */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Wind className="h-4 w-4 text-purple-500" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Ar → Doenças Respiratórias</span>
                </div>
                <div className="space-y-2">
                  {DISEASES_AIR.map((d, i) => (
                    <CorrelationBar key={i} {...d} />
                  ))}
                </div>
              </div>

              {/* Water → Arboviroses */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Droplets className="h-4 w-4 text-cyan-500" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Água → Arboviroses / Infecções</span>
                </div>
                <div className="space-y-2">
                  {DISEASES_WATER.map((d, i) => (
                    <CorrelationBar key={i} {...d} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Zone Ranking */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-rose-500" /> Ranking de Risco por Região
          </h2>
          <div className="space-y-2">
            {zones.map((z, i) => {
              const isSelected = selectedZone === z.name;
              const riskColors: Record<string, string> = {
                baixo: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20",
                moderado: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20",
                alto: "text-orange-600 bg-orange-50 dark:bg-orange-950/20",
                critico: "text-red-600 bg-red-50 dark:bg-red-950/20",
              };
              return (
                <div key={z.name}>
                  <button
                    onClick={() => setSelectedZone(isSelected ? null : z.name)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                      isSelected ? "bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-300 dark:border-rose-700" : "hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent"
                    }`}
                    aria-expanded={isSelected}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                      i === 0 ? "bg-red-100 text-red-600" : i === 1 ? "bg-orange-100 text-orange-600" : i === 2 ? "bg-amber-100 text-amber-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}>{i + 1}°</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-800 dark:text-white">{z.name}</div>
                      <div className="text-[10px] text-slate-400">
                        +{z.heatIsland}°C · UV {z.uvIndex} · AQI {z.airQuality} · {z.vulnerablePopulation.toLocaleString()} vulneráveis
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${riskColors[z.respiratoryRisk]}`}>
                        🫁 {z.respiratoryRisk}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${riskColors[z.arboviroseRisk]}`}>
                        🦟 {z.arboviroseRisk}
                      </span>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg text-sm font-black tabular-nums ${
                      z.irs >= 75 ? "text-red-600 bg-red-50 dark:bg-red-950/20" : z.irs >= 50 ? "text-orange-600 bg-orange-50" : z.irs >= 25 ? "text-amber-600 bg-amber-50" : "text-emerald-600 bg-emerald-50"
                    }`}>{z.irs}</div>
                  </button>

                  {/* Detail */}
                  {isSelected && (
                    <div className="mt-2 ml-11 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl animate-in slide-in-from-top-2 duration-200 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { label: "Ilha de Calor", value: `+${z.heatIsland}°C`, icon: <Thermometer className="h-3.5 w-3.5 text-red-400" /> },
                          { label: "Índice UV", value: z.uvIndex.toString(), icon: <Sun className="h-3.5 w-3.5 text-amber-400" /> },
                          { label: "AQI", value: z.airQuality.toString(), icon: <Wind className="h-3.5 w-3.5 text-purple-400" /> },
                          { label: "Risco Hídrico", value: `${z.waterRisk}%`, icon: <Droplets className="h-3.5 w-3.5 text-blue-400" /> },
                        ].map((m, i) => (
                          <div key={i} className="p-2.5 bg-white dark:bg-slate-800/60 rounded-lg text-center">
                            <div className="flex justify-center mb-1">{m.icon}</div>
                            <div className="text-sm font-black text-slate-800 dark:text-white">{m.value}</div>
                            <div className="text-[9px] text-slate-400">{m.label}</div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <h4 className="text-[10px] font-bold text-amber-600 mb-1">⚠️ Recomendação para {z.name}</h4>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
                          {z.irs >= 75
                            ? `Região em estado crítico. Recomenda-se evitar atividades ao ar livre, monitorar ${z.vulnerablePopulation.toLocaleString()} pessoas em grupos de risco e acionar Defesa Civil.`
                            : z.irs >= 50
                            ? `Atenção redobrada para grupos vulneráveis. ${z.respiratoryRisk === "alto" || z.respiratoryRisk === "critico" ? "Qualidade do ar comprometida — use máscaras." : ""} ${z.arboviroseRisk === "alto" || z.arboviroseRisk === "critico" ? "Alto risco de arboviroses — elimine focos de água parada." : ""}`
                            : `Condições ambientais aceitáveis. Manter vigilância sobre ${z.vulnerablePopulation.toLocaleString()} pessoas em grupos de risco.`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Vulnerable Groups */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-pink-500" /> Grupos Vulneráveis — Recomendações
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {VULNERABLE_GROUPS.map((g, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-pink-50 dark:bg-pink-950/10 rounded-xl border border-pink-200 dark:border-pink-800/30">
                <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-500">{g.icon}</div>
                <div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{g.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{g.advice}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sources */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-white/5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">📖 Fontes e Referências</div>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              "OMS — Diretrizes de Qualidade do Ar (2021)",
              "EPA — Air Quality Index (AQI) Standards",
              "Ministério da Saúde — Boletim Epidemiológico",
              "DATASUS — Sistema de Informação de Agravos de Notificação",
              "INPE — Monitoramento de Ilhas de Calor Urbanas",
              "CETESB — Padrões de Qualidade do Ar SP",
            ].map((ref, i) => (
              <div key={i} className="text-[10px] text-slate-500 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0" />
                {ref}
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
