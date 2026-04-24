import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Zap, TrendingUp, Droplets, BarChart3, Download, Shuffle, Trees, Box, Trophy,
  Flame, Wind, Thermometer, CloudRain, Info, HelpCircle, ArrowRight, ChevronRight,
  CheckCircle2, XCircle, Sparkles, Target, BookOpen, FlaskConical, Award,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { usePdfExport } from "@/hooks/usePdfExport";

import MainLayout from "@/components/MainLayout";
import SimulationHistory from "@/components/SimulationHistory";
import ScenarioComparator from "@/components/ScenarioComparator";
import DeforestationSimulator from "./DeforestationSimulator";
import WaterQualitySimulator from "./WaterQualitySimulator";
import AnimatedVisualization from "./AnimatedVisualization";
import BadgeSystem from "./BadgeSystem";

// ─── Presets ─────────────────────────────────────────────────────────

const FIRE_PRESETS = {
  otimista: { temperature: 18, humidity: 75, windSpeed: 5, label: "🌱 Otimista" },
  realista: { temperature: 28, humidity: 55, windSpeed: 15, label: "📊 Realista" },
  pessimista: { temperature: 38, humidity: 25, windSpeed: 45, label: "🔥 Pessimista" },
  pantanal2020: { temperature: 40, humidity: 15, windSpeed: 35, label: "🔥 Pantanal 2020" },
  amazonia2019: { temperature: 36, humidity: 20, windSpeed: 25, label: "🌳 Amazônia 2019" },
};

const WATER_PRESETS = {
  otimista: { rainfall: 80, evaporation: 10, infiltration: 25, label: "🌱 Otimista" },
  realista: { rainfall: 50, evaporation: 20, infiltration: 15, label: "📊 Realista" },
  pessimista: { rainfall: 20, evaporation: 35, infiltration: 5, label: "🏜️ Pessimista" },
  enchenteRS2024: { rainfall: 180, evaporation: 5, infiltration: 10, label: "🌊 Enchente RS 2024" },
  secaSP2021: { rainfall: 15, evaporation: 40, infiltration: 3, label: "☀️ Seca SP 2021" },
};

const POLLUTION_PRESETS = {
  otimista: { emission: 20, windSpeed: 40, stability: 80, label: "🌱 Otimista" },
  realista: { emission: 50, windSpeed: 10, stability: 50, label: "📊 Realista" },
  pessimista: { emission: 90, windSpeed: 5, stability: 20, label: "💨 Pessimista" },
  cubatao1980: { emission: 95, windSpeed: 3, stability: 15, label: "🏭 Cubatão 1980" },
};

// ─── Simulator Catalog ───────────────────────────────────────────────

type SimCategory = "simulators" | "tools" | "progress";

const SIM_CARDS: { key: string; icon: string; label: string; desc: string; gradient: string; category: SimCategory }[] = [
  { key: "fire", icon: "🔥", label: "Incêndio", desc: "Propagação de fogo — Arrhenius", gradient: "from-red-500 to-orange-500", category: "simulators" },
  { key: "water", icon: "💧", label: "Hidrologia", desc: "Balanço hídrico — Penman", gradient: "from-blue-500 to-cyan-500", category: "simulators" },
  { key: "pollution", icon: "💨", label: "Poluição", desc: "Dispersão — Pluma Gaussiana", gradient: "from-purple-500 to-pink-500", category: "simulators" },
  { key: "deforestation", icon: "🌳", label: "Desmatamento", desc: "Impacto da perda florestal", gradient: "from-emerald-500 to-green-600", category: "simulators" },
  { key: "water-quality", icon: "🧪", label: "Qualidade", desc: "Análise da água", gradient: "from-teal-500 to-cyan-600", category: "simulators" },
  { key: "3d", icon: "🎮", label: "Visualização 3D", desc: "Animações interativas", gradient: "from-indigo-500 to-violet-500", category: "tools" },
  { key: "badges", icon: "🏆", label: "Conquistas", desc: "Badges e recompensas", gradient: "from-amber-500 to-yellow-500", category: "progress" },
  { key: "history", icon: "📊", label: "Histórico", desc: "Simulações anteriores", gradient: "from-slate-500 to-gray-600", category: "progress" },
  { key: "comparator", icon: "⚖️", label: "Comparador", desc: "Compare cenários", gradient: "from-rose-500 to-pink-500", category: "tools" },
];

// ─── Scientific Formulas ─────────────────────────────────────────────

const SCIENCE_INFO: Record<string, { title: string; formula: string; explanation: string; source: string }> = {
  fire: {
    title: "Equação de Arrhenius",
    formula: "k = A · e^(-Ea / RT)",
    explanation: "A taxa de reação (k) depende da energia de ativação (Ea), temperatura absoluta (T) e constante dos gases (R). Em incêndios, temperaturas mais altas reduzem a barreira energética, acelerando a combustão da biomassa.",
    source: "Arrhenius, S. (1889). Zeitschrift für Physikalische Chemie",
  },
  water: {
    title: "Equação de Penman",
    formula: "ET₀ = (Δ·Rn + γ·(900/(T+273))·u₂·(eₛ-eₐ)) / (Δ + γ·(1+0.34·u₂))",
    explanation: "Calcula a evapotranspiração potencial considerando radiação solar (Rn), temperatura (T), velocidade do vento (u₂) e déficit de pressão de vapor (eₛ-eₐ). É a base do balanço hídrico.",
    source: "Penman, H.L. (1948). Proc. Royal Society London",
  },
  pollution: {
    title: "Modelo de Pluma Gaussiana",
    formula: "C(x,y,z) = (Q / 2π·u·σy·σz) · exp(-y²/2σy²) · exp(-(z-H)²/2σz²)",
    explanation: "A concentração (C) de poluentes diminui com a distância conforme uma distribuição gaussiana. Depende da taxa de emissão (Q), vento (u), altura da chaminé (H) e coeficientes de dispersão (σ).",
    source: "Turner, D.B. (1970). Workbook of Atmospheric Dispersion Estimates",
  },
};

// ─── Quiz Questions ──────────────────────────────────────────────────

const QUIZZES: Record<string, { question: string; options: string[]; correct: number; explanation: string }[]> = {
  fire: [
    {
      question: "Qual fator tem MAIOR impacto na propagação de incêndios florestais?",
      options: ["Temperatura", "Umidade do ar", "Velocidade do vento", "Todos são iguais"],
      correct: 1,
      explanation: "A umidade baixa é o fator mais crítico. Abaixo de 30%, a vegetação seca muito rápido e se torna combustível.",
    },
    {
      question: "O que a equação de Arrhenius modela?",
      options: ["Dispersão de poluentes", "Taxa de reação química pela temperatura", "Balanço hídrico", "Pressão atmosférica"],
      correct: 1,
      explanation: "Arrhenius mostra como a taxa de reação química (neste caso, combustão) aumenta exponencialmente com a temperatura.",
    },
  ],
  water: [
    {
      question: "O que acontece quando a precipitação é menor que a evaporação?",
      options: ["Enchente", "Déficit hídrico", "Equilíbrio", "Aumento de aquíferos"],
      correct: 1,
      explanation: "Quando a evaporação supera a precipitação, ocorre déficit hídrico — a base das secas prolongadas.",
    },
  ],
  pollution: [
    {
      question: "Ventos fortes melhoram ou pioram a qualidade do ar em áreas urbanas?",
      options: ["Pioram", "Melhoram", "Não afetam", "Depende da direção"],
      correct: 1,
      explanation: "Ventos fortes dispersam os poluentes em um volume maior de ar, reduzindo a concentração local.",
    },
  ],
};

// ─── Components ──────────────────────────────────────────────────────

/** Circular Gauge Meter */
function GaugeMeter({ value, max = 100, label, unit, size = 180 }: {
  value: number; max?: number; label: string; unit: string; size?: number;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - 24) / 2;
  const circumference = Math.PI * radius; // semi-circle
  const offset = circumference - (pct / 100) * circumference;
  
  const color = pct >= 80 ? "#ef4444" : pct >= 60 ? "#f97316" : pct >= 40 ? "#eab308" : "#22c55e";
  
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        {/* Background arc */}
        <path
          d={`M 12 ${size / 2 + 8} A ${radius} ${radius} 0 0 1 ${size - 12} ${size / 2 + 8}`}
          fill="none"
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-700"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Colored arc */}
        <path
          d={`M 12 ${size / 2 + 8} A ${radius} ${radius} 0 0 1 ${size - 12} ${size / 2 + 8}`}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        {/* Value text */}
        <text x={size / 2} y={size / 2 - 5} textAnchor="middle" className="fill-slate-900 dark:fill-white" style={{ fontSize: size / 5, fontWeight: 800 }}>
          {value.toFixed(1)}
        </text>
        <text x={size / 2} y={size / 2 + 18} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 12, fontWeight: 600 }}>
          {unit}
        </text>
      </svg>
      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">{label}</span>
    </div>
  );
}

/** Contribution Radar (simplified bar chart) */
function ContributionBars({ contributions }: { contributions: { label: string; value: number; color: string }[] }) {
  const maxVal = Math.max(...contributions.map(c => c.value), 1);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
        <Target className="h-3 w-3" />
        Contribuição de cada fator
      </div>
      {contributions.map((c, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-24 text-right">{c.label}</span>
          <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${c.color}`}
              style={{ width: `${(c.value / maxVal) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 w-10">{c.value.toFixed(0)}%</span>
        </div>
      ))}
    </div>
  );
}

/** Heatmap Grid */
function HeatmapGrid({ risk }: { risk: number }) {
  const gridSize = 8;
  const cells = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < gridSize * gridSize; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const center = gridSize / 2;
      const dist = Math.sqrt((row - center) ** 2 + (col - center) ** 2);
      const maxDist = Math.sqrt(2) * center;
      const base = Math.max(0, 1 - dist / maxDist);
      const cellRisk = Math.min(100, base * risk * (0.7 + Math.random() * 0.6));
      arr.push(cellRisk);
    }
    return arr;
  }, [risk]);

  const getCellColor = (v: number) => {
    if (v >= 70) return "bg-red-500";
    if (v >= 50) return "bg-orange-400";
    if (v >= 30) return "bg-amber-300";
    if (v >= 15) return "bg-yellow-200 dark:bg-yellow-400/30";
    return "bg-emerald-100 dark:bg-emerald-900/20";
  };

  return (
    <div className="p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
        <Flame className="h-3 w-3" />
        Mapa de calor — Propagação simulada
      </div>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
        {cells.map((v, i) => (
          <div
            key={i}
            className={`aspect-square rounded-sm ${getCellColor(v)} transition-colors duration-500`}
            title={`Risco: ${v.toFixed(0)}%`}
          />
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 mt-2">
        {[
          { color: "bg-emerald-100", label: "Baixo" },
          { color: "bg-yellow-200", label: "" },
          { color: "bg-amber-300", label: "Médio" },
          { color: "bg-orange-400", label: "" },
          { color: "bg-red-500", label: "Alto" },
        ].map((l, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-sm ${l.color}`} />
            {l.label && <span className="text-[9px] text-slate-400">{l.label}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Science Info Modal/Tooltip */
function SciencePanel({ simType }: { simType: string }) {
  const [open, setOpen] = useState(false);
  const info = SCIENCE_INFO[simType];
  if (!info) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/40 transition-all"
      >
        <BookOpen className="h-3.5 w-3.5" />
        Como funciona?
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 z-20 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl animate-in slide-in-from-top-2 duration-200 min-w-[300px]">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="h-4 w-4 text-indigo-500" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{info.title}</h4>
          </div>
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl mb-3 font-mono text-xs text-slate-700 dark:text-slate-300 overflow-x-auto">
            {info.formula}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
            {info.explanation}
          </p>
          <p className="text-[10px] text-slate-400 italic">
            📖 {info.source}
          </p>
          <button onClick={() => setOpen(false)} className="absolute top-2 right-3 text-slate-400 hover:text-slate-600 text-lg">×</button>
        </div>
      )}
    </div>
  );
}

/** Mini Quiz */
function QuizWidget({ simType }: { simType: string }) {
  const [show, setShow] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const questions = QUIZZES[simType] || [];
  
  if (questions.length === 0) return null;
  const q = questions[qIndex];

  const handleAnswer = (idx: number) => {
    setAnswered(idx);
    if (idx === q.correct) {
      toast.success("🎉 Correto! +2 pontos");
    } else {
      toast.error("❌ Incorreto, mas agora você sabe!");
    }
  };

  return (
    <div>
      {!show ? (
        <button
          onClick={() => setShow(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold shadow-lg shadow-amber-500/20 hover:shadow-xl transition-all active:scale-[0.98]"
        >
          <Award className="h-4 w-4" />
          Quiz: Teste seus conhecimentos!
        </button>
      ) : (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            <Award className="h-3.5 w-3.5" />
            Quiz — Pergunta {qIndex + 1}/{questions.length}
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{q.question}</p>
          <div className="space-y-2">
            {q.options.map((opt, i) => {
              let btnClass = "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-amber-400";
              if (answered !== null) {
                if (i === q.correct) btnClass = "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-300";
                else if (i === answered) btnClass = "bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300";
              }
              return (
                <button
                  key={i}
                  onClick={() => answered === null && handleAnswer(i)}
                  disabled={answered !== null}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${btnClass}`}
                >
                  <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                  {answered !== null && i === q.correct && <CheckCircle2 className="inline h-3.5 w-3.5 ml-2 text-emerald-500" />}
                  {answered !== null && i === answered && i !== q.correct && <XCircle className="inline h-3.5 w-3.5 ml-2 text-red-500" />}
                </button>
              );
            })}
          </div>
          {answered !== null && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold text-blue-600 dark:text-blue-400">💡 Explicação:</span> {q.explanation}
            </div>
          )}
          {answered !== null && qIndex < questions.length - 1 && (
            <button
              onClick={() => { setQIndex(qIndex + 1); setAnswered(null); }}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              Próxima pergunta <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Animated slider with dynamic color */
function SimSlider({ value, onChange, min, max, step, label, icon, unit, lowLabel, highLabel, tooltip }: {
  value: number; onChange: (v: number) => void; min: number; max: number; step: number;
  label: string; icon: string; unit: string; lowLabel?: string; highLabel?: string; tooltip?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const color = pct >= 70 ? "text-red-500" : pct >= 40 ? "text-amber-500" : "text-emerald-500";
  const bgColor = pct >= 70 ? "bg-red-50 dark:bg-red-950/10" : pct >= 40 ? "bg-amber-50 dark:bg-amber-950/10" : "bg-emerald-50 dark:bg-emerald-950/10";

  return (
    <div className={`p-3 rounded-xl transition-colors duration-300 ${bgColor}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
          {tooltip && (
            <span title={tooltip} className="cursor-help">
              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
            </span>
          )}
        </div>
        <span className={`text-lg font-black ${color} tabular-nums`}>
          {value}{unit}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(val) => onChange(val[0])}
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-slate-400">{lowLabel || min + unit}</span>
        <span className="text-[10px] text-slate-400">{highLabel || max + unit}</span>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export default function Simulators() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // Fire Simulator
  const [fireParams, setFireParams] = useState({
    temperature: 25,
    humidity: 60,
    windSpeed: 15,
  });

  // Water Simulator
  const [waterParams, setWaterParams] = useState({
    rainfall: 50,
    evaporation: 20,
    infiltration: 15,
  });

  // Pollution Simulator
  const [pollutionParams, setPollutionParams] = useState({
    emission: 50,
    windSpeed: 10,
    stability: 50,
  });

  const createSimulation = trpc.simulations.create.useMutation();
  const { exportSimulationPDF } = usePdfExport();

  const fireResultsRef = useRef<HTMLDivElement>(null);
  const waterResultsRef = useRef<HTMLDivElement>(null);
  const pollutionResultsRef = useRef<HTMLDivElement>(null);

  // ── Preset helpers ──
  const applyFirePreset = (preset: { temperature: number; humidity: number; windSpeed: number; label: string }) => {
    const { label, ...params } = preset;
    setFireParams(params);
    toast.success(`🎯 Preset "${label}" aplicado!`);
  };
  const applyWaterPreset = (preset: { rainfall: number; evaporation: number; infiltration: number; label: string }) => {
    const { label, ...params } = preset;
    setWaterParams(params);
    toast.success(`🎯 Preset "${label}" aplicado!`);
  };
  const applyPollutionPreset = (preset: { emission: number; windSpeed: number; stability: number; label: string }) => {
    const { label, ...params } = preset;
    setPollutionParams(params);
    toast.success(`🎯 Preset "${label}" aplicado!`);
  };

  // ── Calculations ──
  const fireRisk = useMemo(() => {
    const tempNorm = (fireParams.temperature - 15) / 30;
    const humidityNorm = (90 - fireParams.humidity) / 80;
    const windNorm = fireParams.windSpeed / 60;
    return Math.min(100, (tempNorm * 0.3 + humidityNorm * 0.3 + windNorm * 0.2) * 100);
  }, [fireParams]);

  const fireContributions = useMemo(() => {
    const tempC = ((fireParams.temperature - 15) / 30) * 30;
    const humC = ((90 - fireParams.humidity) / 80) * 30;
    const windC = (fireParams.windSpeed / 60) * 20;
    const total = tempC + humC + windC || 1;
    return [
      { label: "Temperatura", value: (tempC / total) * 100, color: "bg-gradient-to-r from-red-400 to-orange-400" },
      { label: "Umidade", value: (humC / total) * 100, color: "bg-gradient-to-r from-blue-400 to-cyan-400" },
      { label: "Vento", value: (windC / total) * 100, color: "bg-gradient-to-r from-slate-400 to-gray-400" },
    ];
  }, [fireParams]);

  const waterBalance = useMemo(() => {
    return Math.max(0, waterParams.rainfall - waterParams.evaporation - waterParams.infiltration);
  }, [waterParams]);

  const waterRiskPct = useMemo(() => {
    const deficit = waterParams.evaporation + waterParams.infiltration - waterParams.rainfall;
    return Math.max(0, Math.min(100, (deficit / 100) * 100));
  }, [waterParams]);

  const pollutionConcentration = useMemo(() => {
    return Math.min(100, pollutionParams.emission * (1 - pollutionParams.windSpeed / 100) * (pollutionParams.stability / 100));
  }, [pollutionParams]);

  // ── Save / Export ──
  const handleSaveSimulation = async () => {
    if (!user) { toast.error("Você precisa estar autenticado"); return; }
    try {
      const simType = activeTab === "fire" ? "fire" : activeTab === "water" ? "water" : "pollution";
      const params = activeTab === "fire" ? fireParams : activeTab === "water" ? waterParams : pollutionParams;
      const results = {
        risk: activeTab === "fire" ? fireRisk : activeTab === "water" ? waterRiskPct : pollutionConcentration,
        timestamp: new Date().toISOString(),
      };
      await createSimulation.mutateAsync({ type: simType as any, parameters: params, results });
      toast.success("✅ Simulação salva! +3 pontos");
    } catch (error) {
      toast.error("Erro ao salvar simulação");
    }
  };

  const handleExportPDF = async () => {
    const ref = activeTab === "fire" ? fireResultsRef : activeTab === "water" ? waterResultsRef : pollutionResultsRef;
    const params = activeTab === "fire" ? fireParams : activeTab === "water" ? waterParams : pollutionParams;
    const result = activeTab === "fire" ? fireRisk : activeTab === "water" ? waterRiskPct : pollutionConcentration;
    const simType: "fire" | "water" | "pollution" = (activeTab === "water") ? "water" : (activeTab === "pollution") ? "pollution" : "fire";
    await exportSimulationPDF(
      { type: simType, params, result },
      ref.current || undefined
    );
  };

  // ─── Render ────────────────────────────────────────────────────────

  // Grid selector (no active tab)
  if (!activeTab) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto pb-8">
          {/* Hero */}
          <div className="relative mb-8 p-6 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            <div className="relative flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                <FlaskConical className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">Simuladores Educativos</h1>
                <p className="text-purple-100 text-sm">Explore fenômenos ambientais com modelos científicos reais</p>
              </div>
            </div>
            <div className="relative grid grid-cols-3 gap-3 mt-5">
              {[
                { value: "5", label: "Simuladores", icon: "🔬" },
                { value: "3", label: "Modelos Físicos", icon: "📐" },
                { value: "∞", label: "Cenários", icon: "🎮" },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                  <div className="text-xl font-black text-white">{s.icon} {s.value}</div>
                  <div className="text-[10px] text-purple-100 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Category: Simulators */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              Simuladores Científicos
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SIM_CARDS.filter(c => c.category === "simulators").map(card => (
                <button
                  key={card.key}
                  onClick={() => setActiveTab(card.key)}
                  className="group relative p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 hover:border-transparent hover:shadow-xl transition-all duration-300 text-left overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative">
                    <span className="text-3xl block mb-2">{card.icon}</span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-white transition-colors">{card.label}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-white/80 transition-colors mt-0.5">{card.desc}</p>
                  </div>
                  <ArrowRight className="absolute bottom-3 right-3 h-4 w-4 text-slate-300 group-hover:text-white/70 transition-all group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </div>

          {/* Category: Tools */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Ferramentas
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {SIM_CARDS.filter(c => c.category === "tools").map(card => (
                <button
                  key={card.key}
                  onClick={() => setActiveTab(card.key)}
                  className="group relative p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 hover:border-transparent hover:shadow-xl transition-all duration-300 text-left overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative flex items-center gap-3">
                    <span className="text-2xl">{card.icon}</span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-white transition-colors">{card.label}</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-white/80 transition-colors">{card.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Category: Progress */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Meu Progresso
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {SIM_CARDS.filter(c => c.category === "progress").map(card => (
                <button
                  key={card.key}
                  onClick={() => setActiveTab(card.key)}
                  className="group relative p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 hover:border-transparent hover:shadow-xl transition-all duration-300 text-left overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative flex items-center gap-3">
                    <span className="text-2xl">{card.icon}</span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-white transition-colors">{card.label}</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-white/80 transition-colors">{card.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ── Active simulator view ──
  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto pb-8">
        {/* Back button + breadcrumb */}
        <div className="mb-5 flex items-center gap-3">
          <button
            onClick={() => setActiveTab(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            ← Simuladores
          </button>
          <span className="text-xs text-slate-400">
            {SIM_CARDS.find(c => c.key === activeTab)?.icon} {SIM_CARDS.find(c => c.key === activeTab)?.label}
          </span>
        </div>

        {/* ═══ FIRE SIMULATOR ═══ */}
        {activeTab === "fire" && (
          <div className="space-y-6">
            {/* Header card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black flex items-center gap-2">🔥 Simulador de Incêndio</h2>
                  <p className="text-red-100 text-xs mt-1">Modelo de Arrhenius — Propagação de fogo florestal</p>
                </div>
                <SciencePanel simType="fire" />
              </div>
            </div>

            {/* Presets */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-white/5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                <Zap className="h-3 w-3 text-amber-500" />
                Cenários Rápidos
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.values(FIRE_PRESETS).map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => applyFirePreset(preset)}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-red-100 dark:hover:bg-red-950/20 hover:text-red-600 transition-all"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Controls */}
              <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 space-y-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-red-500" />
                  Parâmetros Ambientais
                </h3>

                <SimSlider
                  value={fireParams.temperature} onChange={(v) => setFireParams({ ...fireParams, temperature: v })}
                  min={15} max={45} step={1} label="Temperatura" icon="🌡️" unit="°C"
                  lowLabel="15°C Fresco" highLabel="45°C Extremo"
                  tooltip="Temperaturas acima de 30°C aceleram a combustão (Arrhenius)"
                />
                <SimSlider
                  value={fireParams.humidity} onChange={(v) => setFireParams({ ...fireParams, humidity: v })}
                  min={10} max={90} step={1} label="Umidade" icon="💧" unit="%"
                  lowLabel="10% Seca crítica" highLabel="90% Muito úmido"
                  tooltip="Umidade abaixo de 30% torna a vegetação altamente inflamável"
                />
                <SimSlider
                  value={fireParams.windSpeed} onChange={(v) => setFireParams({ ...fireParams, windSpeed: v })}
                  min={0} max={60} step={1} label="Vento" icon="💨" unit=" km/h"
                  lowLabel="0 Calmo" highLabel="60 Vendaval"
                  tooltip="Ventos fortes carregam brasas e aceleram a propagação"
                />

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button onClick={handleSaveSimulation} className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl shadow-lg shadow-red-500/20 h-10 text-xs font-bold">
                    💾 Salvar
                  </Button>
                  <Button onClick={handleExportPDF} variant="outline" className="rounded-xl h-10 text-xs font-bold border-red-300 text-red-600 hover:bg-red-50">
                    <Download className="w-3.5 h-3.5 mr-1.5" /> PDF
                  </Button>
                </div>
              </div>

              {/* Results */}
              <div ref={fireResultsRef} className="space-y-4">
                {/* Gauge */}
                <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 flex flex-col items-center">
                  <GaugeMeter value={fireRisk} label="Risco de Propagação" unit="%" size={200} />

                  <div className={`mt-3 px-4 py-2 rounded-xl text-xs font-bold text-center ${
                    fireRisk >= 80 ? "bg-red-100 dark:bg-red-950/30 text-red-600" :
                    fireRisk >= 60 ? "bg-orange-100 dark:bg-orange-950/30 text-orange-600" :
                    fireRisk >= 40 ? "bg-amber-100 dark:bg-amber-950/30 text-amber-600" :
                    "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600"
                  }`}>
                    {fireRisk >= 80 ? "🚨 PERIGO EXTREMO — Evacuação recomendada" :
                     fireRisk >= 60 ? "⚠️ RISCO ALTO — Alerta de incêndio" :
                     fireRisk >= 40 ? "📊 RISCO MODERADO — Vigilância ativa" :
                     "✅ RISCO BAIXO — Condições seguras"}
                  </div>
                </div>

                {/* Heatmap */}
                <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-white/5">
                  <HeatmapGrid risk={fireRisk} />
                </div>

                {/* Contribution */}
                <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-white/5">
                  <ContributionBars contributions={fireContributions} />
                </div>

                {/* Interpretation */}
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30">
                  <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mb-2">
                    <Info className="h-3.5 w-3.5" /> Interpretação Científica
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {fireRisk < 30
                      ? "Condições desfavoráveis para propagação. Alta umidade e ventos fracos mantêm o risco controlado. A taxa de reação (Arrhenius) é baixa nessas condições."
                      : fireRisk < 60
                      ? "Risco moderado. A combinação de temperatura e umidade cria condições que exigem vigilância. Aceiros e brigadas devem estar em alerta."
                      : "Condições extremas para propagação de incêndio. A energia de ativação (Ea) é facilmente superada. Fogo pode se espalhar de 5-10 km/h nessas condições."}
                  </p>
                </div>
              </div>
            </div>

            {/* Quiz */}
            <QuizWidget simType="fire" />
          </div>
        )}

        {/* ═══ WATER SIMULATOR ═══ */}
        {activeTab === "water" && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black flex items-center gap-2">💧 Simulador Hidrológico</h2>
                  <p className="text-blue-100 text-xs mt-1">Equação de Penman — Balanço hídrico</p>
                </div>
                <SciencePanel simType="water" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-white/5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                <Zap className="h-3 w-3 text-blue-500" /> Cenários Rápidos
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.values(WATER_PRESETS).map((p, i) => (
                  <button key={i} onClick={() => applyWaterPreset(p)} className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-950/20 hover:text-blue-600 transition-all">
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 space-y-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <CloudRain className="h-4 w-4 text-blue-500" /> Parâmetros Hídricos
                </h3>
                <SimSlider value={waterParams.rainfall} onChange={(v) => setWaterParams({ ...waterParams, rainfall: v })}
                  min={0} max={200} step={5} label="Precipitação" icon="🌧️" unit=" mm" tooltip="Volume de chuva por período" />
                <SimSlider value={waterParams.evaporation} onChange={(v) => setWaterParams({ ...waterParams, evaporation: v })}
                  min={0} max={100} step={5} label="Evaporação" icon="☀️" unit=" mm" tooltip="Água perdida por evapotranspiração (Penman)" />
                <SimSlider value={waterParams.infiltration} onChange={(v) => setWaterParams({ ...waterParams, infiltration: v })}
                  min={0} max={100} step={5} label="Infiltração" icon="⬇️" unit=" mm" tooltip="Água absorvida pelo solo rumo ao lençol freático" />

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button onClick={handleSaveSimulation} className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl shadow-lg shadow-blue-500/20 h-10 text-xs font-bold">💾 Salvar</Button>
                  <Button onClick={handleExportPDF} variant="outline" className="rounded-xl h-10 text-xs font-bold border-blue-300 text-blue-600 hover:bg-blue-50">
                    <Download className="w-3.5 h-3.5 mr-1.5" /> PDF
                  </Button>
                </div>
              </div>

              <div ref={waterResultsRef} className="space-y-4">
                <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 flex flex-col items-center">
                  <GaugeMeter value={waterBalance} max={200} label="Escoamento Superficial" unit="mm" size={200} />
                </div>

                <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5" /> Balanço Hídrico
                  </h4>
                  {[
                    { label: "Precipitação", value: `+${waterParams.rainfall} mm`, color: "text-blue-500", icon: "🌧️" },
                    { label: "Evaporação", value: `-${waterParams.evaporation} mm`, color: "text-orange-500", icon: "☀️" },
                    { label: "Infiltração", value: `-${waterParams.infiltration} mm`, color: "text-emerald-500", icon: "⬇️" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-xs flex items-center gap-2"><span>{item.icon}</span> {item.label}</span>
                      <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-3 py-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/20 border-2 border-cyan-200 dark:border-cyan-800">
                    <span className="text-xs font-bold flex items-center gap-2">🌊 Escoamento</span>
                    <span className="text-lg font-black text-cyan-600">{waterBalance} mm</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30">
                  <h4 className="text-xs font-bold text-blue-600 flex items-center gap-1.5 mb-2"><Info className="h-3.5 w-3.5" /> Interpretação</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {waterBalance > 50
                      ? "Escoamento alto — risco de enchentes e erosão. A infiltração não absorve toda a chuva."
                      : waterBalance > 10
                      ? "Balanço hídrico positivo — água suficiente para rios e aquíferos. Condições adequadas."
                      : "Déficit hídrico — evaporação e infiltração superam a chuva. Risco de seca prolongada."}
                  </p>
                </div>
              </div>
            </div>
            <QuizWidget simType="water" />
          </div>
        )}

        {/* ═══ POLLUTION SIMULATOR ═══ */}
        {activeTab === "pollution" && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black flex items-center gap-2">💨 Dispersão de Poluentes</h2>
                  <p className="text-purple-100 text-xs mt-1">Modelo de Pluma Gaussiana</p>
                </div>
                <SciencePanel simType="pollution" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-white/5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                <Zap className="h-3 w-3 text-purple-500" /> Cenários Rápidos
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.values(POLLUTION_PRESETS).map((p, i) => (
                  <button key={i} onClick={() => applyPollutionPreset(p)} className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-purple-100 dark:hover:bg-purple-950/20 hover:text-purple-600 transition-all">
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 space-y-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Wind className="h-4 w-4 text-purple-500" /> Parâmetros Atmosféricos
                </h3>
                <SimSlider value={pollutionParams.emission} onChange={(v) => setPollutionParams({ ...pollutionParams, emission: v })}
                  min={0} max={100} step={5} label="Emissão" icon="🏭" unit="%" tooltip="Taxa de emissão de poluentes (Q na equação)" />
                <SimSlider value={pollutionParams.windSpeed} onChange={(v) => setPollutionParams({ ...pollutionParams, windSpeed: v })}
                  min={0} max={50} step={5} label="Vento" icon="💨" unit=" km/h" tooltip="Vento mais forte = maior dispersão = menor concentração" />
                <SimSlider value={pollutionParams.stability} onChange={(v) => setPollutionParams({ ...pollutionParams, stability: v })}
                  min={0} max={100} step={5} label="Estabilidade" icon="🌡️" unit="%" tooltip="Atmosfera estável confina poluentes perto do solo" />

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button onClick={handleSaveSimulation} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-lg shadow-purple-500/20 h-10 text-xs font-bold">💾 Salvar</Button>
                  <Button onClick={handleExportPDF} variant="outline" className="rounded-xl h-10 text-xs font-bold border-purple-300 text-purple-600 hover:bg-purple-50">
                    <Download className="w-3.5 h-3.5 mr-1.5" /> PDF
                  </Button>
                </div>
              </div>

              <div ref={pollutionResultsRef} className="space-y-4">
                <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 flex flex-col items-center">
                  <GaugeMeter value={pollutionConcentration} label="Concentração Máxima" unit="µg/m³" size={200} />
                  <div className={`mt-3 px-4 py-2 rounded-xl text-xs font-bold text-center ${
                    pollutionConcentration >= 70 ? "bg-red-100 dark:bg-red-950/30 text-red-600" :
                    pollutionConcentration >= 35 ? "bg-amber-100 dark:bg-amber-950/30 text-amber-600" :
                    "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600"
                  }`}>
                    {pollutionConcentration >= 70 ? "🚨 QUALIDADE RUIM — Risco à saúde" :
                     pollutionConcentration >= 35 ? "⚠️ MODERADA — Sensíveis devem evitar exposição" :
                     "✅ BOA — Poluentes bem dispersos"}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-white/5">
                  <ContributionBars contributions={[
                    { label: "Emissão", value: pollutionParams.emission, color: "bg-gradient-to-r from-purple-400 to-pink-400" },
                    { label: "Vento (inv.)", value: 100 - pollutionParams.windSpeed * 2, color: "bg-gradient-to-r from-blue-400 to-cyan-400" },
                    { label: "Estabilidade", value: pollutionParams.stability, color: "bg-gradient-to-r from-amber-400 to-orange-400" },
                  ]} />
                </div>

                <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/30">
                  <h4 className="text-xs font-bold text-purple-600 flex items-center gap-1.5 mb-2"><Info className="h-3.5 w-3.5" /> Interpretação</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {pollutionConcentration < 35
                      ? "Boa dispersão. Ventos fortes diluem os poluentes num volume grande de ar. A pluma gaussiana se espalha horizontalmente."
                      : pollutionConcentration < 70
                      ? "Dispersão moderada. A concentração pode afetar pessoas sensíveis (asmáticos, idosos). Monitoramento recomendado."
                      : "Concentração perigosa. Atmosfera estável e ventos fracos geram inversão térmica — poluentes ficam presos próximo ao solo."}
                  </p>
                </div>
              </div>
            </div>
            <QuizWidget simType="pollution" />
          </div>
        )}

        {/* ═══ Sub-component tabs ═══ */}
        {activeTab === "deforestation" && <DeforestationSimulator />}
        {activeTab === "water-quality" && <WaterQualitySimulator />}
        {activeTab === "3d" && <AnimatedVisualization />}
        {activeTab === "badges" && <BadgeSystem />}
        {activeTab === "history" && <SimulationHistory />}
        {activeTab === "comparator" && <ScenarioComparator />}
      </div>
    </MainLayout>
  );
}
