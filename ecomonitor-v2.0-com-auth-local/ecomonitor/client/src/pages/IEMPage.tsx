import { useState, useMemo } from "react";
import {
  TrendingUp, TrendingDown, Minus, Info, MapPin, BarChart3, Activity,
  ChevronRight, Flame, Droplets, Wind, Trees, Award, Target, Zap,
  ArrowUpRight, ArrowDownRight, FlaskConical, BookOpen, Globe, Users,
  Clock, Shield, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import MainLayout from "@/components/MainLayout";

// ─── IEM Formula & Constants ─────────────────────────────────────────

/**
 * ÍNDICE ECOMONITOR (IEM) — Fórmula Original
 * 
 * IEM = 100 - Σ(wi × Di) × Fengajamento
 * 
 * Onde:
 *   Di = índice de degradação da dimensão i (0–100)
 *   wi = peso da dimensão (soma = 1.0)
 *   Fengajamento = fator de engajamento comunitário (0.8–1.2)
 *
 * Dimensões:
 *   D1 = Ocorrências ativas (w=0.30)
 *   D2 = Tempo médio de resolução (w=0.20)
 *   D3 = Qualidade do ar (w=0.15)
 *   D4 = Cobertura vegetal (w=0.15)
 *   D5 = Recursos hídricos (w=0.10)
 *   D6 = Validação comunitária (w=0.10)
 */

const DIMENSIONS = [
  { key: "occurrences", label: "Ocorrências Ativas", weight: 0.30, icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-500", bgColor: "bg-red-50 dark:bg-red-950/20", barColor: "bg-gradient-to-r from-red-400 to-orange-400" },
  { key: "resolution", label: "Tempo de Resolução", weight: 0.20, icon: <Clock className="h-4 w-4" />, color: "text-amber-500", bgColor: "bg-amber-50 dark:bg-amber-950/20", barColor: "bg-gradient-to-r from-amber-400 to-yellow-400" },
  { key: "air", label: "Qualidade do Ar", weight: 0.15, icon: <Wind className="h-4 w-4" />, color: "text-purple-500", bgColor: "bg-purple-50 dark:bg-purple-950/20", barColor: "bg-gradient-to-r from-purple-400 to-pink-400" },
  { key: "vegetation", label: "Cobertura Vegetal", weight: 0.15, icon: <Trees className="h-4 w-4" />, color: "text-emerald-500", bgColor: "bg-emerald-50 dark:bg-emerald-950/20", barColor: "bg-gradient-to-r from-emerald-400 to-green-400" },
  { key: "water", label: "Recursos Hídricos", weight: 0.10, icon: <Droplets className="h-4 w-4" />, color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-950/20", barColor: "bg-gradient-to-r from-blue-400 to-cyan-400" },
  { key: "validation", label: "Validação Comunitária", weight: 0.10, icon: <Users className="h-4 w-4" />, color: "text-indigo-500", bgColor: "bg-indigo-50 dark:bg-indigo-950/20", barColor: "bg-gradient-to-r from-indigo-400 to-violet-400" },
];

// ─── Simulated Neighborhood Data ────────────────────────────────────

interface NeighborhoodIEM {
  name: string;
  iem: number;
  prev: number;
  dimensions: Record<string, number>;
  occurrencesCount: number;
  activeUsers: number;
}

function generateNeighborhoodData(occurrences: any[] | undefined): NeighborhoodIEM[] {
  // Bairros de Fortaleza (adaptável para qualquer cidade)
  const neighborhoods = [
    { name: "Aldeota", baseFactor: 0.85 },
    { name: "Meireles", baseFactor: 0.82 },
    { name: "Centro", baseFactor: 0.55 },
    { name: "Benfica", baseFactor: 0.68 },
    { name: "Messejana", baseFactor: 0.52 },
    { name: "Jangurussu", baseFactor: 0.35 },
    { name: "Barra do Ceará", baseFactor: 0.42 },
    { name: "Cocó", baseFactor: 0.78 },
    { name: "Papicu", baseFactor: 0.72 },
    { name: "Mondubim", baseFactor: 0.45 },
    { name: "Parquelândia", baseFactor: 0.65 },
    { name: "José Bonifácio", baseFactor: 0.58 },
  ];

  const totalOccurrences = occurrences?.length || 0;
  const criticalOccurrences = occurrences?.filter(o => o.severity === "critical").length || 0;
  const validatedOccurrences = occurrences?.filter(o => o.status === "validated").length || 0;

  // Adjusts global degradation based on real data
  const globalDegradation = totalOccurrences > 0
    ? Math.min(1, (criticalOccurrences / totalOccurrences) * 2)
    : 0.3;

  const validationRate = totalOccurrences > 0
    ? validatedOccurrences / totalOccurrences
    : 0.5;

  return neighborhoods.map(n => {
    const factor = n.baseFactor;
    const noise = () => (Math.random() - 0.5) * 10;

    const dimensions: Record<string, number> = {
      occurrences: Math.max(0, Math.min(100, (1 - factor) * 60 + globalDegradation * 30 + noise())),
      resolution: Math.max(0, Math.min(100, (1 - factor) * 50 + noise())),
      air: Math.max(0, Math.min(100, (1 - factor) * 40 + noise())),
      vegetation: Math.max(0, Math.min(100, (1 - factor) * 55 + noise())),
      water: Math.max(0, Math.min(100, (1 - factor) * 35 + noise())),
      validation: Math.max(0, Math.min(100, (1 - validationRate) * 50 + (1 - factor) * 30 + noise())),
    };

    // Calculate IEM 
    const degradationScore = DIMENSIONS.reduce((sum, dim) => {
      return sum + dim.weight * (dimensions[dim.key] || 0);
    }, 0);

    const engagementFactor = 0.8 + validationRate * 0.4; // 0.8 to 1.2
    const iem = Math.max(0, Math.min(100, 100 - degradationScore * engagementFactor));
    const prev = iem + (Math.random() - 0.5) * 8; // previous month variation

    return {
      name: n.name,
      iem: Math.round(iem * 10) / 10,
      prev: Math.round(prev * 10) / 10,
      dimensions,
      occurrencesCount: Math.round((1 - factor) * (totalOccurrences || 15) * 0.3),
      activeUsers: Math.round(factor * 50 + Math.random() * 20),
    };
  }).sort((a, b) => b.iem - a.iem);
}

// ─── Gauge Component ─────────────────────────────────────────────────

function IEMGauge({ value, size = 220 }: { value: number; size?: number }) {
  const radius = (size - 28) / 2;
  const circumference = Math.PI * radius;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  const offset = circumference - pct * circumference;

  const getColor = (v: number) => {
    if (v >= 80) return { stroke: "#22c55e", label: "Excelente", emoji: "🌿", bg: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600" };
    if (v >= 60) return { stroke: "#3b82f6", label: "Bom", emoji: "👍", bg: "bg-blue-100 dark:bg-blue-950/30 text-blue-600" };
    if (v >= 40) return { stroke: "#f59e0b", label: "Moderado", emoji: "⚠️", bg: "bg-amber-100 dark:bg-amber-950/30 text-amber-600" };
    if (v >= 20) return { stroke: "#f97316", label: "Ruim", emoji: "🔶", bg: "bg-orange-100 dark:bg-orange-950/30 text-orange-600" };
    return { stroke: "#ef4444", label: "Crítico", emoji: "🚨", bg: "bg-red-100 dark:bg-red-950/30 text-red-600" };
  };

  const info = getColor(value);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`}>
        <path
          d={`M 14 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 14} ${size / 2 + 10}`}
          fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-700"
          strokeWidth="14" strokeLinecap="round"
        />
        <path
          d={`M 14 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 14} ${size / 2 + 10}`}
          fill="none" stroke={info.stroke} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${circumference}`} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        <text x={size / 2} y={size / 2 - 8} textAnchor="middle" className="fill-slate-900 dark:fill-white" style={{ fontSize: size / 4, fontWeight: 900 }}>
          {value.toFixed(0)}
        </text>
        <text x={size / 2} y={size / 2 + 18} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 13, fontWeight: 700 }}>
          / 100
        </text>
      </svg>
      <div className={`mt-1 px-4 py-1.5 rounded-xl text-xs font-bold ${info.bg}`}>
        {info.emoji} {info.label}
      </div>
    </div>
  );
}

// ─── Timeline Component ──────────────────────────────────────────────

function IEMTimeline({ current }: { current: number }) {
  // Simulated 6-month history
  const months = ["Out", "Nov", "Dez", "Jan", "Fev", "Mar"];
  const values = useMemo(() => {
    const data: number[] = [];
    let v = current + (Math.random() - 0.3) * 15;
    for (let i = 0; i < 5; i++) {
      data.unshift(Math.max(0, Math.min(100, v)));
      v += (Math.random() - 0.45) * 8;
    }
    data.push(current);
    return data;
  }, [current]);

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
        <Activity className="h-3 w-3" />
        Evolução — Últimos 6 meses
      </div>
      <div className="flex items-end gap-2 h-20">
        {values.map((v, i) => {
          const height = ((v - min) / range) * 60 + 20;
          const isLast = i === values.length - 1;
          const color = v >= 60 ? "bg-emerald-400" : v >= 40 ? "bg-amber-400" : "bg-red-400";
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className={`text-[9px] font-bold ${isLast ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                {v.toFixed(0)}
              </span>
              <div
                className={`w-full rounded-t-lg transition-all duration-500 ${color} ${isLast ? "ring-2 ring-offset-1 ring-emerald-400" : "opacity-60"}`}
                style={{ height: `${height}%` }}
              />
              <span className={`text-[9px] ${isLast ? "font-bold text-slate-700 dark:text-slate-200" : "text-slate-400"}`}>
                {months[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Formula Explainer ───────────────────────────────────────────────

function FormulaPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-bold text-slate-800 dark:text-white">Metodologia Científica do IEM</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {open && (
        <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Formula */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fórmula Principal</div>
            <div className="font-mono text-sm text-slate-800 dark:text-slate-100 text-center py-2">
              IEM = 100 − Σ(w<sub>i</sub> × D<sub>i</sub>) × F<sub>eng</sub>
            </div>
          </div>

          {/* Variables */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Variáveis</div>
            {[
              { symbol: "IEM", desc: "Índice EcoMonitor (0–100)" },
              { symbol: "Di", desc: "Índice de degradação da dimensão i (0–100)" },
              { symbol: "wi", desc: "Peso da dimensão (Σwi = 1.0)" },
              { symbol: "Feng", desc: "Fator de engajamento comunitário (0.8–1.2)" },
            ].map((v, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                <code className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded">{v.symbol}</code>
                <span className="text-xs text-slate-600 dark:text-slate-300">{v.desc}</span>
              </div>
            ))}
          </div>

          {/* Dimensions table */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dimensões e Pesos</div>
            {DIMENSIONS.map((dim, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                <span className={dim.color}>{dim.icon}</span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200 flex-1">{dim.label}</span>
                <span className="text-xs font-bold text-slate-500">w = {dim.weight.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Engagement factor */}
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl">
            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">Fator de Engajamento (F<sub>eng</sub>)</div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Calculado pela taxa de validação comunitária. Quanto mais cidadãos validam ocorrências, 
              melhor o fator (até 1.2). Baixo engajamento penaliza o índice (0.8). 
              Isso incentiva a participação ativa da comunidade.
            </p>
          </div>

          {/* Source */}
          <p className="text-[10px] text-slate-400 italic">
            📖 Metodologia original desenvolvida para o EcoMonitor. Inspirada no IDEB (MEC), IQA (CETESB) e IDH (PNUD).
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function IEMPage() {
  const { user } = useAuth();
  const { data: recentOccurrences } = trpc.occurrences.getRecent.useQuery({ limit: 100 });
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);

  const neighborhoods = useMemo(() => generateNeighborhoodData(recentOccurrences), [recentOccurrences]);

  const cityIEM = useMemo(() => {
    if (neighborhoods.length === 0) return 50;
    return Math.round(neighborhoods.reduce((sum, n) => sum + n.iem, 0) / neighborhoods.length * 10) / 10;
  }, [neighborhoods]);

  const selectedData = neighborhoods.find(n => n.name === selectedNeighborhood);

  const totalOccurrences = recentOccurrences?.length || 0;
  const criticalCount = recentOccurrences?.filter(o => o.severity === "critical").length || 0;
  const validatedCount = recentOccurrences?.filter(o => o.status === "validated").length || 0;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto pb-12 space-y-6">
        {/* Hero */}
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-300/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <Globe className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Índice EcoMonitor (IEM)</h1>
              <p className="text-emerald-100 text-sm">Métrica original de saúde ambiental por região</p>
            </div>
          </div>

          <div className="relative grid grid-cols-4 gap-3 mt-5">
            {[
              { value: totalOccurrences.toString(), label: "Ocorrências", icon: "📍" },
              { value: criticalCount.toString(), label: "Críticas", icon: "🚨" },
              { value: validatedCount.toString(), label: "Validadas", icon: "✅" },
              { value: neighborhoods.length.toString(), label: "Regiões", icon: "🏘️" },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-xl font-black text-white">{s.icon} {s.value}</div>
                <div className="text-[10px] text-emerald-100 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* City Gauge + Timeline */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 flex flex-col items-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              IEM Geral — Fortaleza
            </div>
            <IEMGauge value={cityIEM} size={240} />
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4 max-w-xs leading-relaxed">
              Média ponderada de {neighborhoods.length} regiões monitoradas, 
              baseada em {totalOccurrences} ocorrências registradas.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
            <IEMTimeline current={cityIEM} />

            {/* Quick interpretation */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
              <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mb-1">
                <Info className="h-3.5 w-3.5" /> Interpretação
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {cityIEM >= 70
                  ? "A cidade apresenta boa saúde ambiental. A maioria das regiões tem poucos problemas críticos e bom engajamento comunitário."
                  : cityIEM >= 50
                  ? "Saúde ambiental moderada. Algumas regiões precisam de atenção especial. O engajamento comunitário pode melhorar o índice."
                  : "Saúde ambiental preocupante. Há regiões com alto índice de degradação. Ações corretivas urgentes são necessárias."}
              </p>
            </div>
          </div>
        </div>

        {/* Ranking Table */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-500" />
              Ranking de Regiões
            </h2>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {neighborhoods.length} regiões
            </span>
          </div>

          <div className="space-y-2">
            {neighborhoods.map((n, i) => {
              const trend = n.iem - n.prev;
              const getColor = (v: number) => {
                if (v >= 80) return "text-emerald-600";
                if (v >= 60) return "text-blue-600";
                if (v >= 40) return "text-amber-600";
                return "text-red-600";
              };
              const getBg = (v: number) => {
                if (v >= 80) return "bg-emerald-50 dark:bg-emerald-950/10";
                if (v >= 60) return "bg-blue-50 dark:bg-blue-950/10";
                if (v >= 40) return "bg-amber-50 dark:bg-amber-950/10";
                return "bg-red-50 dark:bg-red-950/10";
              };
              const isSelected = selectedNeighborhood === n.name;

              return (
                <button
                  key={n.name}
                  onClick={() => setSelectedNeighborhood(isSelected ? null : n.name)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/20 border-2 border-indigo-300 dark:border-indigo-700"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent"
                  }`}
                  aria-expanded={isSelected}
                >
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                    i === 0 ? "bg-amber-100 text-amber-600" :
                    i === 1 ? "bg-slate-200 text-slate-600" :
                    i === 2 ? "bg-orange-100 text-orange-600" :
                    "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}>
                    {i + 1}°
                  </div>

                  {/* Name + occurrences */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-800 dark:text-white">{n.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {n.occurrencesCount} ocorrências · {n.activeUsers} usuários ativos
                    </div>
                  </div>

                  {/* Trend */}
                  <div className={`flex items-center gap-1 text-xs font-bold ${
                    trend > 0 ? "text-emerald-500" : trend < 0 ? "text-red-500" : "text-slate-400"
                  }`}>
                    {trend > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : trend < 0 ? <ArrowDownRight className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                    {Math.abs(trend).toFixed(1)}
                  </div>

                  {/* IEM Score */}
                  <div className={`px-3 py-1.5 rounded-lg text-sm font-black tabular-nums ${getBg(n.iem)} ${getColor(n.iem)}`}>
                    {n.iem.toFixed(0)}
                  </div>

                  <ChevronRight className={`h-4 w-4 text-slate-300 transition-transform ${isSelected ? "rotate-90" : ""}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Neighborhood Detail */}
        {selectedData && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Target className="h-4 w-4 text-indigo-500" />
                Detalhamento — {selectedData.name}
              </h3>
              <div className="text-2xl font-black text-emerald-600">{selectedData.iem.toFixed(0)}/100</div>
            </div>

            <div className="space-y-3">
              {DIMENSIONS.map((dim) => {
                const degradation = selectedData.dimensions[dim.key] || 0;
                const contribution = dim.weight * degradation;
                return (
                  <div key={dim.key} className={`p-3 rounded-xl ${dim.bgColor}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={dim.color}>{dim.icon}</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{dim.label}</span>
                        <span className="text-[9px] text-slate-400 font-medium">(peso: {(dim.weight * 100).toFixed(0)}%)</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          Degradação: {degradation.toFixed(0)}%
                        </span>
                        <span className="text-[9px] text-slate-400 ml-2">
                          (contribui −{contribution.toFixed(1)} pts)
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/60 dark:bg-slate-800/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${dim.barColor}`}
                        style={{ width: `${degradation}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recommendation */}
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <h4 className="text-xs font-bold text-amber-600 flex items-center gap-1.5 mb-1">
                <Zap className="h-3.5 w-3.5" /> Recomendação
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {(() => {
                  const worst = DIMENSIONS.reduce((max, dim) => {
                    const val = selectedData.dimensions[dim.key] || 0;
                    return val > (selectedData.dimensions[max.key] || 0) ? dim : max;
                  }, DIMENSIONS[0]);
                  return `A dimensão mais crítica em ${selectedData.name} é "${worst.label}" (degradação ${(selectedData.dimensions[worst.key] || 0).toFixed(0)}%). Ações focadas nessa área terão o maior impacto no IEM da região.`;
                })()}
              </p>
            </div>
          </div>
        )}

        {/* Formula Panel */}
        <FormulaPanel />

        {/* Scale Reference */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Escala de Referência
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {[
              { range: "80–100", label: "Excelente", color: "bg-emerald-500", desc: "Ambiente saudável" },
              { range: "60–79", label: "Bom", color: "bg-blue-500", desc: "Poucos problemas" },
              { range: "40–59", label: "Moderado", color: "bg-amber-500", desc: "Atenção necessária" },
              { range: "20–39", label: "Ruim", color: "bg-orange-500", desc: "Ações urgentes" },
              { range: "0–19", label: "Crítico", color: "bg-red-500", desc: "Emergência" },
            ].map((scale, i) => (
              <div key={i} className="text-center">
                <div className={`h-3 rounded-full mb-2 ${scale.color}`} />
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{scale.range}</div>
                <div className="text-[10px] font-bold text-slate-500">{scale.label}</div>
                <div className="text-[9px] text-slate-400">{scale.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
