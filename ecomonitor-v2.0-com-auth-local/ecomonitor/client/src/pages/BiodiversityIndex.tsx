import { useState, useMemo } from "react";
import {
  Leaf, Bird, Bug, TreePine, Droplets, AudioLines, Satellite, Eye,
  BarChart3, TrendingUp, TrendingDown, Award, Shield, Target,
  AlertTriangle, CheckCircle2, Globe, Activity, Zap, MapPin,
  ChevronDown, ChevronUp, Dna, Microscope, Camera, Radio,
  Star, Lock,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import MainLayout from "@/components/MainLayout";

// ─── Types ───────────────────────────────────────────────────────────

interface BVIComponent {
  id: string;
  name: string;
  weight: number;
  score: number; // 0-100
  source: string;
  icon: any;
  color: string;
  description: string;
}

interface MonitoredArea {
  id: string;
  name: string;
  biome: string;
  areaHa: number;
  bviScore: number;
  certification: "Platinum" | "Gold" | "Silver" | "Bronze" | "Uncertified";
  trend: "up" | "stable" | "down";
  speciesCount: number;
  ndvi: number;
  acousticComplexity: number;
}

// ─── Constants ───────────────────────────────────────────────────────

const BVI_COMPONENTS: BVIComponent[] = [
  { id: "acoustic", name: "Bioacústica (ACI)", weight: 0.25, score: 74, source: "Sensores AudioMoth + BirdNET CNN", icon: AudioLines, color: "text-purple-600", description: "Complexidade acústica — riqueza de sons biológicos indicando diversidade de espécies" },
  { id: "satellite", name: "Cobertura Vegetal (NDVI)", weight: 0.20, score: 68, source: "Sentinel-2 / Landsat-9 / INPE", icon: Satellite, color: "text-blue-600", description: "Índice de vegetação normalizado — densidade e saúde da cobertura florestal" },
  { id: "species", name: "Riqueza de Espécies", weight: 0.20, score: 71, source: "Bioacústica + Câmeras trap + Registros", icon: Bird, color: "text-amber-600", description: "Contagem e diversidade de espécies confirmadas via múltiplas fontes" },
  { id: "genetic", name: "Diversidade Genética", weight: 0.15, score: 62, source: "eDNA + Modelos de isolamento", icon: Dna, color: "text-rose-600", description: "Variabilidade genética inferida por padrões de canto e isolamento geográfico" },
  { id: "ecosystem", name: "Serviços Ecossistêmicos", weight: 0.10, score: 78, source: "TEEB + Modelos InVEST", icon: TreePine, color: "text-emerald-600", description: "Valoração dos serviços prestados: polinização, regulação hídrica, carbono" },
  { id: "threat", name: "Pressão Antrópica (inverso)", weight: 0.10, score: 55, source: "IRAC + DETER/INPE + Ocorrências", icon: Shield, color: "text-red-600", description: "Nível de ameaça humana — desmatamento, poluição, urbanização (invertido)" },
];

const MONITORED_AREAS: MonitoredArea[] = [
  { id: "ma1", name: "Reserva Biológica Serra da Canastra", biome: "Cerrado", areaHa: 12500, bviScore: 78, certification: "Gold", trend: "up", speciesCount: 247, ndvi: 0.72, acousticComplexity: 0.81 },
  { id: "ma2", name: "Mata Ciliar — Rio Verde", biome: "Mata Atlântica", areaHa: 3200, bviScore: 85, certification: "Platinum", trend: "stable", speciesCount: 312, ndvi: 0.84, acousticComplexity: 0.87 },
  { id: "ma3", name: "Caatinga Semiárida — Sertão CE", biome: "Caatinga", areaHa: 8700, bviScore: 42, certification: "Bronze", trend: "down", speciesCount: 89, ndvi: 0.31, acousticComplexity: 0.45 },
  { id: "ma4", name: "Manguezal Litoral Sul", biome: "Mangue", areaHa: 1800, bviScore: 81, certification: "Platinum", trend: "up", speciesCount: 198, ndvi: 0.78, acousticComplexity: 0.83 },
  { id: "ma5", name: "Fragmento Urbano — Parque Central", biome: "Mata Atlântica", areaHa: 450, bviScore: 35, certification: "Uncertified", trend: "down", speciesCount: 43, ndvi: 0.42, acousticComplexity: 0.28 },
  { id: "ma6", name: "APP Restaurada — Vale do Jequitinhonha", biome: "Cerrado/Caatinga", areaHa: 2100, bviScore: 58, certification: "Silver", trend: "up", speciesCount: 134, ndvi: 0.56, acousticComplexity: 0.62 },
];

const CERT_CONFIG = {
  Platinum: { label: "Platinum", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/20", minScore: 80 },
  Gold: { label: "Gold", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20", minScore: 65 },
  Silver: { label: "Silver", color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800", minScore: 50 },
  Bronze: { label: "Bronze", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/20", minScore: 35 },
  Uncertified: { label: "Não certificado", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/20", minScore: 0 },
};

const CREDIT_COMPARISON = [
  { type: "Crédito de Carbono", market: "Commodity", barrier: "Baixa", competition: "Alta (saturado)", value: "R$ 45/tCO₂", color: "text-slate-500" },
  { type: "Crédito de Biodiversidade (BVI)", market: "Complexidade", barrier: "Altíssima", competition: "Quase inexistente", value: "R$ 120-500/unidade", color: "text-emerald-600" },
];

// ─── Main Component ──────────────────────────────────────────────────

export default function BiodiversityIndex() {
  const { data: occurrences } = trpc.occurrences.getRecent.useQuery({ limit: 50 });
  const [expandedComponent, setExpandedComponent] = useState<string | null>("acoustic");
  const [selectedArea, setSelectedArea] = useState<string>("ma1");

  // Calculate global BVI
  const globalBVI = useMemo(() => {
    return BVI_COMPONENTS.reduce((sum, c) => sum + c.score * c.weight, 0);
  }, []);

  // Adjust threat component based on real occurrences
  const adjustedBVI = useMemo(() => {
    if (!occurrences) return globalBVI;
    const threatCount = occurrences.filter(o => o.type === "deforestation" || o.type === "fire").length;
    const threatPenalty = Math.min(15, threatCount * 1.5);
    return Math.max(0, globalBVI - threatPenalty);
  }, [occurrences, globalBVI]);

  const selectedAreaData = MONITORED_AREAS.find(a => a.id === selectedArea)!;
  const cert = CERT_CONFIG[selectedAreaData.certification];

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto pb-12 space-y-6">
        {/* Hero */}
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-700 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <Microscope className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Biodiversity Verified Index</h1>
              <p className="text-emerald-100 text-sm">BVI — Score proprietário de biodiversidade verificado por IA multisensorial</p>
            </div>
          </div>
          <div className="relative grid grid-cols-4 gap-3 mt-5">
            {[
              { value: adjustedBVI.toFixed(1), label: "BVI Global Score", icon: "🏆" },
              { value: MONITORED_AREAS.reduce((s, a) => s + a.speciesCount, 0), label: "Espécies monitoradas", icon: "🦜" },
              { value: `${MONITORED_AREAS.reduce((s, a) => s + a.areaHa, 0).toLocaleString("pt-BR")} ha`, label: "Área certificada", icon: "🗺️" },
              { value: MONITORED_AREAS.filter(a => a.certification !== "Uncertified").length, label: "Áreas certificadas", icon: "✅" },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-lg font-black text-white">{s.icon} {s.value}</div>
                <div className="text-[10px] text-emerald-100 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* BVI Gauge + Components */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Global Score */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">BVI Score Global</div>
            <div className="text-center mb-4">
              <div className="text-5xl font-black text-emerald-600 dark:text-emerald-400">
                {adjustedBVI.toFixed(1)}
              </div>
              <div className="text-xs text-slate-400 font-medium">de 100 pontos</div>
            </div>
            <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-400 via-amber-400 via-emerald-400 to-emerald-600 transition-all duration-700"
                style={{ width: `${adjustedBVI}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-slate-400 mb-4">
              <span>0 — Degradado</span>
              <span>50 — Moderado</span>
              <span>100 — Pristino</span>
            </div>
            {/* Certification levels */}
            <div className="space-y-1">
              {Object.entries(CERT_CONFIG).filter(([k]) => k !== "Uncertified").map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-2 text-[10px]">
                  <div className={`w-2 h-2 rounded-full ${cfg.bg.includes("purple") ? "bg-purple-500" : cfg.bg.includes("amber") ? "bg-amber-500" : cfg.bg.includes("slate") ? "bg-slate-400" : "bg-orange-500"}`} />
                  <span className={`font-bold ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-slate-400 flex-1">≥ {cfg.minScore}</span>
                  <Star className={`h-3 w-3 ${adjustedBVI >= cfg.minScore ? cfg.color : "text-slate-300"}`} />
                </div>
              ))}
            </div>
            <div className="mt-3 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/15 text-[9px] text-emerald-600 dark:text-emerald-400">
              <strong>BVI</strong> é o primeiro índice brasileiro que combina bioacústica, satélite, eDNA e IA para certificação de biodiversidade auditável.
            </div>
          </div>

          {/* Components Breakdown */}
          <div className="md:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Componentes do BVI</div>
            <div className="space-y-2">
              {BVI_COMPONENTS.map(comp => {
                const Icon = comp.icon;
                const isExpanded = expandedComponent === comp.id;
                return (
                  <div key={comp.id} className="rounded-xl border border-slate-200/60 dark:border-white/5 overflow-hidden">
                    <button onClick={() => setExpandedComponent(isExpanded ? null : comp.id)} className="w-full text-left p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <Icon className={`h-4 w-4 ${comp.color} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{comp.name}</span>
                          <span className="text-[8px] text-slate-400">Peso: {(comp.weight * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                          <div className={`h-full rounded-full transition-all duration-500 ${
                            comp.score >= 70 ? "bg-emerald-400" : comp.score >= 50 ? "bg-amber-400" : "bg-red-400"
                          }`} style={{ width: `${comp.score}%` }} />
                        </div>
                      </div>
                      <div className="text-right min-w-[50px]">
                        <div className={`text-lg font-black ${comp.score >= 70 ? "text-emerald-600" : comp.score >= 50 ? "text-amber-600" : "text-red-600"}`}>{comp.score}</div>
                      </div>
                      {isExpanded ? <ChevronUp className="h-3 w-3 text-slate-400" /> : <ChevronDown className="h-3 w-3 text-slate-400" />}
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 animate-in slide-in-from-top-1 duration-200">
                        <p className="text-[10px] text-slate-500 mb-2">{comp.description}</p>
                        <div className="text-[9px] text-slate-400">
                          <strong>Fonte:</strong> {comp.source}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-1">
                          <strong>Contribuição ao BVI:</strong> {(comp.score * comp.weight).toFixed(1)} pontos ({((comp.score * comp.weight / adjustedBVI) * 100).toFixed(1)}% do total)
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Why BVI > Carbon */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/40">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Por que Biodiversidade &gt; Carbono?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {CREDIT_COMPARISON.map(c => (
              <div key={c.type} className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                <div className={`text-sm font-bold ${c.color} mb-2`}>{c.type}</div>
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between"><span className="text-slate-400">Mercado:</span><span className="font-bold text-slate-600 dark:text-slate-300">{c.market}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Barreira de entrada:</span><span className="font-bold text-slate-600 dark:text-slate-300">{c.barrier}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Concorrência:</span><span className="font-bold text-slate-600 dark:text-slate-300">{c.competition}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Valor:</span><span className={`font-bold ${c.color}`}>{c.value}</span></div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-3 font-medium">
            "Carbono é commodity. Biodiversidade é complexidade. Complexidade gera barreira de entrada." — O EcoMonitor como Standard & Poor's da Biodiversidade.
          </div>
        </div>

        {/* Monitored Areas */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Áreas Certificadas BVI</h2>
          </div>
          <div className="space-y-3">
            {MONITORED_AREAS.map(area => {
              const aCert = CERT_CONFIG[area.certification];
              return (
                <button
                  key={area.id}
                  onClick={() => setSelectedArea(area.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedArea === area.id
                      ? "border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/20"
                      : "border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`text-2xl font-black ${
                      area.bviScore >= 80 ? "text-emerald-600" : area.bviScore >= 50 ? "text-amber-600" : "text-red-600"
                    }`}>{area.bviScore}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{area.name}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${aCert.bg} ${aCert.color}`}>{aCert.label}</span>
                        {area.trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                        {area.trend === "down" && <TrendingDown className="h-3 w-3 text-red-500" />}
                      </div>
                      <div className="text-[10px] text-slate-400">{area.biome} • {area.areaHa.toLocaleString("pt-BR")} ha • {area.speciesCount} espécies</div>
                    </div>
                    <div className="flex gap-3 text-[10px]">
                      <div className="text-center">
                        <div className="font-bold text-blue-600">{area.ndvi.toFixed(2)}</div>
                        <div className="text-[8px] text-slate-400">NDVI</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-purple-600">{(area.acousticComplexity * 100).toFixed(0)}%</div>
                        <div className="text-[8px] text-slate-400">ACI</div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Methodology */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">Fórmula BVI — Biodiversity Verified Index</h3>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 mb-3">
            <div className="text-xs text-slate-600 dark:text-slate-300 font-mono text-center">
              BVI = 0.25×ACI + 0.20×NDVI_norm + 0.20×S_richness + 0.15×G_diversity + 0.10×ES_value + 0.10×(1 - T_pressure)
            </div>
            <div className="text-[9px] text-slate-400 text-center mt-2">
              Pesos calibrados por análise de componentes principais (PCA) em 200+ áreas de referência
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["Pieretti et al. (2011)", "Rouse et al. (1974) — NDVI", "Shannon-Wiener Index", "TEEB (2010)", "InVEST Model", "ICMBio/MMA", "TNFD Framework (2023)", "Kunming-Montreal GBF"].map(ref => (
              <span key={ref} className="text-[8px] font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-500 border border-slate-200 dark:border-slate-700">{ref}</span>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
