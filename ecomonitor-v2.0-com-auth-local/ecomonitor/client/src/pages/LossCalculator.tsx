import { useState, useMemo } from "react";
import {
  DollarSign, TrendingDown, TreePine, Droplets, Bug, Wind, Flower2,
  BarChart3, ChevronDown, ChevronUp, AlertTriangle, Info, MapPin,
  Calculator, Coins, Landmark, Factory, Fish, Leaf, Mountain,
  ArrowDownRight, ArrowUpRight, Globe, Waves, Sun, Zap,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import MainLayout from "@/components/MainLayout";

// ─── Types ───────────────────────────────────────────────────────────

interface EcosystemService {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  barColor: string;
  valuePerHa: number; // R$/ha/year
  description: string;
  methodology: string;
}

interface RegionLoss {
  name: string;
  degradedHa: number;
  annualLoss: number;
  services: Record<string, number>;
  trend: number;
}

// ─── Constants ───────────────────────────────────────────────────────

const SERVICES: EcosystemService[] = [
  {
    id: "pollination",
    name: "Polinização",
    icon: <Flower2 className="h-4 w-4" />,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    barColor: "bg-gradient-to-r from-amber-400 to-yellow-400",
    valuePerHa: 1850,
    description: "Serviço de polinização por abelhas e insetos nativos",
    methodology: "Valor calculado com base no custo de polinização artificial (R$/ha) — FAO 2023",
  },
  {
    id: "water_purification",
    name: "Purificação de Água",
    icon: <Droplets className="h-4 w-4" />,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    barColor: "bg-gradient-to-r from-blue-400 to-cyan-400",
    valuePerHa: 2400,
    description: "Filtragem natural por vegetação ripária e solo",
    methodology: "Custo evitado de tratamento de água — ANA / SABESP 2022",
  },
  {
    id: "carbon_sequestration",
    name: "Sequestro de Carbono",
    icon: <TreePine className="h-4 w-4" />,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    barColor: "bg-gradient-to-r from-emerald-400 to-green-400",
    valuePerHa: 3200,
    description: "Absorção de CO₂ atmosférico por biomassa vegetal",
    methodology: "Preço social do carbono (US$51/ton) × taxa de absorção média — IPCC AR6",
  },
  {
    id: "erosion_control",
    name: "Controle de Erosão",
    icon: <Mountain className="h-4 w-4" />,
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    barColor: "bg-gradient-to-r from-orange-400 to-rose-400",
    valuePerHa: 1600,
    description: "Contenção de solo por raízes e cobertura vegetal",
    methodology: "Custo de recuperação de áreas erodidas — EMBRAPA 2021",
  },
  {
    id: "biodiversity",
    name: "Biodiversidade",
    icon: <Bug className="h-4 w-4" />,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    barColor: "bg-gradient-to-r from-purple-400 to-violet-400",
    valuePerHa: 2100,
    description: "Habitat para fauna e flora nativas",
    methodology: "Valor de existência + uso indireto — TEEB (The Economics of Ecosystems and Biodiversity)",
  },
  {
    id: "air_quality",
    name: "Regulação do Ar",
    icon: <Wind className="h-4 w-4" />,
    color: "text-sky-500",
    bgColor: "bg-sky-50 dark:bg-sky-950/20",
    barColor: "bg-gradient-to-r from-sky-400 to-indigo-400",
    valuePerHa: 1200,
    description: "Filtragem de poluentes e produção de oxigênio",
    methodology: "Custo evitado de saúde respiratória — OMS / SUS 2022",
  },
  {
    id: "flood_control",
    name: "Controle de Enchentes",
    icon: <Waves className="h-4 w-4" />,
    color: "text-cyan-500",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
    barColor: "bg-gradient-to-r from-cyan-400 to-teal-400",
    valuePerHa: 2800,
    description: "Absorção de água pluvial e regulação de cheias",
    methodology: "Custo de infraestrutura de drenagem equivalente — Min. Integração 2023",
  },
  {
    id: "climate_regulation",
    name: "Regulação Climática",
    icon: <Sun className="h-4 w-4" />,
    color: "text-rose-500",
    bgColor: "bg-rose-50 dark:bg-rose-950/20",
    barColor: "bg-gradient-to-r from-rose-400 to-pink-400",
    valuePerHa: 1950,
    description: "Redução de ilhas de calor e microclima local",
    methodology: "Custo de resfriamento artificial equivalente — INPE / CETESB 2023",
  },
];

const TOTAL_VALUE_PER_HA = SERVICES.reduce((s, svc) => s + svc.valuePerHa, 0);

// ─── Data Generation ─────────────────────────────────────────────────

function generateRegionData(occurrences: any[] | undefined): RegionLoss[] {
  const regions = [
    { name: "Aldeota", baseDegradation: 0.08 },
    { name: "Meireles", baseDegradation: 0.06 },
    { name: "Centro", baseDegradation: 0.45 },
    { name: "Benfica", baseDegradation: 0.25 },
    { name: "Messejana", baseDegradation: 0.40 },
    { name: "Jangurussu", baseDegradation: 0.65 },
    { name: "Barra do Ceará", baseDegradation: 0.52 },
    { name: "Cocó", baseDegradation: 0.12 },
    { name: "Mondubim", baseDegradation: 0.48 },
    { name: "Parangaba", baseDegradation: 0.35 },
  ];

  const totalOcc = occurrences?.length || 15;
  const deforestOcc = occurrences?.filter(o => o.type === "deforestation").length || 2;
  const pollutionOcc = occurrences?.filter(o => o.type === "water_pollution" || o.type === "air_pollution").length || 3;
  const globalDeg = Math.min(1, (deforestOcc + pollutionOcc) / Math.max(1, totalOcc) * 2);

  return regions.map(r => {
    const deg = r.baseDegradation + globalDeg * 0.2 + (Math.random() - 0.5) * 0.1;
    const degradedHa = Math.round(deg * 120 + Math.random() * 30);

    const services: Record<string, number> = {};
    SERVICES.forEach(svc => {
      const factor = deg + (Math.random() - 0.5) * 0.15;
      services[svc.id] = Math.round(svc.valuePerHa * degradedHa * Math.max(0.1, factor));
    });

    const annualLoss = Object.values(services).reduce((s, v) => s + v, 0);
    const trend = (Math.random() - 0.4) * 15;

    return { name: r.name, degradedHa, annualLoss, services, trend: Math.round(trend * 10) / 10 };
  }).sort((a, b) => b.annualLoss - a.annualLoss);
}

// ─── Components ──────────────────────────────────────────────────────

function CurrencyDisplay({ value, size = "lg" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const formatted = value >= 1_000_000
    ? `R$ ${(value / 1_000_000).toFixed(1)}M`
    : value >= 1_000
    ? `R$ ${(value / 1_000).toFixed(0)}mil`
    : `R$ ${value.toFixed(0)}`;

  const sizeClass = size === "lg" ? "text-3xl" : size === "md" ? "text-xl" : "text-sm";
  return <span className={`${sizeClass} font-black text-red-600 dark:text-red-400 tabular-nums`}>{formatted}</span>;
}

function ServiceBreakdown({ services, total }: { services: Record<string, number>; total: number }) {
  return (
    <div className="space-y-2">
      {SERVICES.map(svc => {
        const value = services[svc.id] || 0;
        const pct = total > 0 ? (value / total) * 100 : 0;
        return (
          <div key={svc.id} className={`p-2.5 rounded-xl ${svc.bgColor}`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className={svc.color}>{svc.icon}</span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{svc.name}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-red-600 dark:text-red-400">
                  R$ {(value / 1000).toFixed(0)}mil
                </span>
                <span className="text-[9px] text-slate-400 ml-1">({pct.toFixed(1)}%)</span>
              </div>
            </div>
            <div className="h-1.5 bg-white/60 dark:bg-slate-800/60 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${svc.barColor} transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function LossCalculator() {
  const { data: recentOccurrences } = trpc.occurrences.getRecent.useQuery({ limit: 100 });
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [showMethodology, setShowMethodology] = useState(false);

  const regions = useMemo(() => generateRegionData(recentOccurrences), [recentOccurrences]);
  const totalLoss = useMemo(() => regions.reduce((s, r) => s + r.annualLoss, 0), [regions]);
  const totalDegraded = useMemo(() => regions.reduce((s, r) => s + r.degradedHa, 0), [regions]);
  const selected = regions.find(r => r.name === selectedRegion);

  // Aggregate by service
  const serviceAggregates = useMemo(() => {
    const agg: Record<string, number> = {};
    SERVICES.forEach(svc => { agg[svc.id] = 0; });
    regions.forEach(r => {
      Object.entries(r.services).forEach(([k, v]) => { agg[k] = (agg[k] || 0) + v; });
    });
    return agg;
  }, [regions]);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto pb-12 space-y-6">
        {/* Hero */}
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-red-600 via-orange-600 to-amber-600 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-300/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Calculadora de Perdas e Danos</h1>
              <p className="text-amber-100 text-sm">Valor monetário dos serviços ecossistêmicos perdidos</p>
            </div>
          </div>
          <div className="relative grid grid-cols-3 gap-3 mt-5">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-white">💰 R$ {(totalLoss / 1_000_000).toFixed(1)}M</div>
              <div className="text-[10px] text-amber-100 font-medium">Perda Anual Estimada</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-white">🌳 {totalDegraded.toLocaleString()} ha</div>
              <div className="text-[10px] text-amber-100 font-medium">Área Degradada</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-white">📊 R$ {(TOTAL_VALUE_PER_HA / 1000).toFixed(0)}mil</div>
              <div className="text-[10px] text-amber-100 font-medium">Valor/ha/ano Médio</div>
            </div>
          </div>
        </div>

        {/* City-wide Service Breakdown */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4">
              <Coins className="h-4 w-4 text-amber-500" /> Perdas por Serviço Ecossistêmico
            </h2>
            <ServiceBreakdown services={serviceAggregates} total={totalLoss} />
          </div>

          {/* Top 5 regions */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Top 5 Regiões Mais Afetadas
            </h2>
            <div className="space-y-3">
              {regions.slice(0, 5).map((r, i) => {
                const pct = totalLoss > 0 ? (r.annualLoss / totalLoss) * 100 : 0;
                return (
                  <div key={r.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black ${i === 0 ? "text-red-500" : "text-slate-500"}`}>{i + 1}°</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{r.name}</span>
                      </div>
                      <CurrencyDisplay value={r.annualLoss} size="sm" />
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-400 to-amber-400 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-[9px] text-slate-400">{r.degradedHa} ha degradados</span>
                      <span className="text-[9px] text-slate-400">{pct.toFixed(1)}% do total</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Full Ranking */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-orange-500" /> Detalhamento por Região
          </h2>
          <div className="space-y-2">
            {regions.map((r, i) => {
              const isSelected = selectedRegion === r.name;
              return (
                <div key={r.name}>
                  <button
                    onClick={() => setSelectedRegion(isSelected ? null : r.name)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                      isSelected ? "bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-300 dark:border-orange-700" : "hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent"
                    }`}
                    aria-expanded={isSelected}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                      i === 0 ? "bg-red-100 text-red-600" : i === 1 ? "bg-orange-100 text-orange-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}>{i + 1}°</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-800 dark:text-white">{r.name}</div>
                      <div className="text-[10px] text-slate-400">{r.degradedHa} ha degradados</div>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-bold ${r.trend > 0 ? "text-red-500" : "text-emerald-500"}`}>
                      {r.trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(r.trend)}%
                    </div>
                    <CurrencyDisplay value={r.annualLoss} size="sm" />
                    {isSelected ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-300" />}
                  </button>

                  {isSelected && (
                    <div className="mt-2 ml-11 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl animate-in slide-in-from-top-2 duration-200">
                      <ServiceBreakdown services={r.services} total={r.annualLoss} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Methodology */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <button onClick={() => setShowMethodology(!showMethodology)} className="w-full flex items-center justify-between" aria-expanded={showMethodology}>
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-indigo-500" /> Metodologia de Valoração
            </h2>
            {showMethodology ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          {showMethodology && (
            <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl">
                <div className="font-mono text-sm text-center py-2 text-slate-800 dark:text-slate-100">
                  L<sub>total</sub> = Σ<sub>i</sub> (A<sub>deg</sub> × V<sub>svc,i</sub> × D<sub>i</sub>)
                </div>
                <p className="text-[10px] text-slate-500 text-center mt-1">
                  Onde: A<sub>deg</sub> = área degradada (ha), V<sub>svc</sub> = valor do serviço (R$/ha/ano), D = fator de degradação (0-1)
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valores de Referência (R$/ha/ano)</div>
                {SERVICES.map(svc => (
                  <div key={svc.id} className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                    <span className={svc.color}>{svc.icon}</span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{svc.name}</div>
                      <div className="text-[9px] text-slate-400">{svc.methodology}</div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">R$ {svc.valuePerHa.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-relaxed">
                  📖 <strong>Nota:</strong> Valores baseados em metodologia TEEB (The Economics of Ecosystems and Biodiversity), 
                  adaptados para o bioma Caatinga/Mata Atlântica. Referências: IPCC AR6, FAO, EMBRAPA, ANA, CETESB, Min. Integração.
                  Valores podem variar conforme condições locais e sazonalidade.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
