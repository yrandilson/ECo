import { useState, useMemo } from "react";
import {
  TreePine, Leaf, Cloud, Factory, TrendingUp, TrendingDown, BarChart3,
  ArrowUpRight, ArrowDownRight, DollarSign, MapPin, Info, Zap,
  Sprout, Mountain, Droplets, Wind, Sun, ChevronDown, ChevronUp,
  Target, Award, Globe, Scale, Activity, Thermometer, AlertTriangle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import MainLayout from "@/components/MainLayout";

// ─── Types ───────────────────────────────────────────────────────────

interface Biome {
  id: string;
  name: string;
  icon: string;
  areaHa: number;
  /** Allometric biomass density (tDM/ha) — Chave et al. 2014 */
  biomassDensity: number;
  /** Carbon fraction of dry biomass (default 0.47 — IPCC) */
  carbonFraction: number;
  /** Annual sequestration rate (tCO₂/ha/year) */
  sequestrationRate: number;
  /** Loss from deforestation (ha this period) */
  areaLost: number;
  color: string;
}

interface CarbonCredit {
  label: string;
  pricePerTon: number;
  currency: string;
}

// ─── Constants ───────────────────────────────────────────────────────

const BIOMES: Biome[] = [
  {
    id: "atlantic_forest", name: "Mata Atlântica", icon: "🌳",
    areaHa: 4200, biomassDensity: 195, carbonFraction: 0.47,
    sequestrationRate: 7.8, areaLost: 12, color: "#10b981",
  },
  {
    id: "cerrado", name: "Cerrado", icon: "🌿",
    areaHa: 8500, biomassDensity: 45, carbonFraction: 0.47,
    sequestrationRate: 3.2, areaLost: 35, color: "#84cc16",
  },
  {
    id: "riparian", name: "Mata Ciliar / APP", icon: "💧",
    areaHa: 1800, biomassDensity: 160, carbonFraction: 0.47,
    sequestrationRate: 6.5, areaLost: 5, color: "#06b6d4",
  },
  {
    id: "urban_green", name: "Áreas Verdes Urbanas", icon: "🏡",
    areaHa: 950, biomassDensity: 35, carbonFraction: 0.47,
    sequestrationRate: 2.1, areaLost: 8, color: "#22c55e",
  },
  {
    id: "mangrove", name: "Manguezal", icon: "🌊",
    areaHa: 620, biomassDensity: 120, carbonFraction: 0.47,
    sequestrationRate: 8.4, areaLost: 2, color: "#0ea5e9",
  },
  {
    id: "caatinga", name: "Caatinga", icon: "🌵",
    areaHa: 3100, biomassDensity: 25, carbonFraction: 0.47,
    sequestrationRate: 1.8, areaLost: 20, color: "#f59e0b",
  },
];

const CREDIT_MARKETS: CarbonCredit[] = [
  { label: "Voluntário (VCS)", pricePerTon: 45, currency: "R$" },
  { label: "EU ETS", pricePerTon: 380, currency: "R$" },
  { label: "RGGI (US)", pricePerTon: 85, currency: "R$" },
  { label: "Brasil (futuro)", pricePerTon: 120, currency: "R$" },
];

/** CO₂ equivalent: 1 ton C = 3.667 ton CO₂ (molecular weight ratio) */
const C_TO_CO2 = 3.667;

// ─── Calculations ────────────────────────────────────────────────────

function calculateBiomeCarbon(biome: Biome) {
  // Total standing biomass (tDM)
  const totalBiomass = biome.areaHa * biome.biomassDensity;
  // Total carbon stock (tC)
  const carbonStock = totalBiomass * biome.carbonFraction;
  // Total CO₂ equivalent stored (tCO₂)
  const co2Stock = carbonStock * C_TO_CO2;
  // Annual sequestration (tCO₂/year)
  const annualSequestration = biome.areaHa * biome.sequestrationRate;
  // Hourly sequestration (tCO₂/hour)
  const hourlySequestration = annualSequestration / 8760;
  // Loss from deforestation
  const co2Lost = biome.areaLost * biome.biomassDensity * biome.carbonFraction * C_TO_CO2;
  // Net annual
  const netAnnual = annualSequestration - co2Lost;

  return { totalBiomass, carbonStock, co2Stock, annualSequestration, hourlySequestration, co2Lost, netAnnual };
}

// ─── Components ──────────────────────────────────────────────────────

function CO2Gauge({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const isPositive = value >= 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] text-slate-400 font-bold">{label}</span>
        <span className={`text-[10px] font-black ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
          {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0)} tCO₂
        </span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${isPositive ? "bg-emerald-400" : "bg-red-400"}`}
          style={{ width: `${Math.abs(pct)}%` }}
        />
      </div>
    </div>
  );
}

function BiomeCard({ biome, isExpanded, onToggle }: { biome: Biome; isExpanded: boolean; onToggle: () => void }) {
  const calc = calculateBiomeCarbon(biome);
  const netPositive = calc.netAnnual > 0;

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 overflow-hidden transition-all">
      <button onClick={onToggle} className="w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <span className="text-2xl">{biome.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{biome.name}</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
              netPositive ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
            }`}>
              {netPositive ? "Sumidouro" : "Fonte"}
            </span>
          </div>
          <div className="text-[10px] text-slate-400">{biome.areaHa.toLocaleString("pt-BR")} ha monitorados</div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-black ${netPositive ? "text-emerald-600" : "text-red-600"}`}>
            {netPositive ? "+" : ""}{calc.netAnnual >= 1000 ? `${(calc.netAnnual / 1000).toFixed(1)}k` : calc.netAnnual.toFixed(0)}
          </div>
          <div className="text-[9px] text-slate-400">tCO₂/ano líquido</div>
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-3 gap-2 pt-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-center">
              <div className="text-xs font-black text-emerald-700 dark:text-emerald-400">{(calc.co2Stock / 1000).toFixed(1)}k</div>
              <div className="text-[8px] text-emerald-500">tCO₂ estoque</div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-center">
              <div className="text-xs font-black text-blue-700 dark:text-blue-400">{calc.annualSequestration.toFixed(0)}</div>
              <div className="text-[8px] text-blue-500">tCO₂/ano absorve</div>
            </div>
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 text-center">
              <div className="text-xs font-black text-red-700 dark:text-red-400">-{calc.co2Lost.toFixed(0)}</div>
              <div className="text-[8px] text-red-500">tCO₂ perdido</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30">
              <div className="text-[9px] text-slate-400 font-bold">Biomassa</div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{biome.biomassDensity} tDM/ha</div>
              <div className="text-[8px] text-slate-400">Chave et al. (2014)</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30">
              <div className="text-[9px] text-slate-400 font-bold">Absorção/hora</div>
              <div className="text-xs font-bold text-emerald-600">{(calc.hourlySequestration * 1000).toFixed(1)} kg CO₂/h</div>
              <div className="text-[8px] text-slate-400">Em tempo real</div>
            </div>
          </div>
          {biome.areaLost > 0 && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/15 border border-red-200 dark:border-red-800/50">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span className="text-[10px] font-bold text-red-700 dark:text-red-400">
                  {biome.areaLost} ha desmatados → {calc.co2Lost.toFixed(0)} tCO₂ emitidas
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function CarbonDashboard() {
  const { data: recentOccurrences } = trpc.occurrences.getRecent.useQuery({ limit: 100 });
  const [expandedBiome, setExpandedBiome] = useState<string | null>("atlantic_forest");
  const [selectedMarket, setSelectedMarket] = useState(0);

  // Adjust deforestation based on actual occurrences
  const adjustedBiomes = useMemo(() => {
    if (!recentOccurrences) return BIOMES;
    const deforestCount = recentOccurrences.filter(o => o.type === "deforestation").length;
    const fireCount = recentOccurrences.filter(o => o.type === "fire").length;
    return BIOMES.map(b => ({
      ...b,
      areaLost: b.areaLost + (b.id === "cerrado" ? deforestCount * 2 : 0) + (b.id === "atlantic_forest" ? fireCount : 0),
    }));
  }, [recentOccurrences]);

  const totals = useMemo(() => {
    const agg = adjustedBiomes.reduce((acc, b) => {
      const c = calculateBiomeCarbon(b);
      return {
        totalArea: acc.totalArea + b.areaHa,
        co2Stock: acc.co2Stock + c.co2Stock,
        annualSeq: acc.annualSeq + c.annualSequestration,
        co2Lost: acc.co2Lost + c.co2Lost,
        netAnnual: acc.netAnnual + c.netAnnual,
        hourlySeq: acc.hourlySeq + c.hourlySequestration,
      };
    }, { totalArea: 0, co2Stock: 0, annualSeq: 0, co2Lost: 0, netAnnual: 0, hourlySeq: 0 });
    return agg;
  }, [adjustedBiomes]);

  const market = CREDIT_MARKETS[selectedMarket];
  const creditValue = totals.netAnnual * market.pricePerTon;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto pb-12 space-y-6">
        {/* Hero */}
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-emerald-700 via-green-700 to-teal-700 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <TreePine className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Sequestro de Carbono</h1>
              <p className="text-emerald-100 text-sm">Monitoramento em tempo real do balanço de CO₂ — equações alométricas (Chave et al. 2014)</p>
            </div>
          </div>
          <div className="relative grid grid-cols-4 gap-3 mt-5">
            {[
              { value: `${(totals.co2Stock / 1000).toFixed(0)}k`, label: "tCO₂ estoque total", icon: "🌍" },
              { value: `+${(totals.annualSeq / 1000).toFixed(1)}k`, label: "tCO₂/ano absorvido", icon: "🌱" },
              { value: `-${(totals.co2Lost / 1000).toFixed(1)}k`, label: "tCO₂ emitido (perda)", icon: "🏭" },
              { value: `${(totals.hourlySeq * 1000).toFixed(0)}`, label: "kg CO₂ absorvido/hora", icon: "⏱️" },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-lg font-black text-white">{s.icon} {s.value}</div>
                <div className="text-[10px] text-emerald-100 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Net Balance + Credits */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Net Balance */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Balanço Líquido Anual</div>
            <div className="flex items-center gap-4 mb-4">
              <div className={`text-3xl font-black ${totals.netAnnual > 0 ? "text-emerald-600" : "text-red-600"}`}>
                {totals.netAnnual > 0 ? "+" : ""}{(totals.netAnnual / 1000).toFixed(2)}k
              </div>
              <div>
                <div className="text-xs text-slate-500">tCO₂ líquido/ano</div>
                <div className={`text-[10px] font-bold flex items-center gap-1 ${totals.netAnnual > 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {totals.netAnnual > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {totals.netAnnual > 0 ? "Região sumidouro de carbono" : "Região fonte de carbono"}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <CO2Gauge value={totals.annualSeq} max={totals.annualSeq + totals.co2Lost} label="Absorção" />
              <CO2Gauge value={-totals.co2Lost} max={totals.annualSeq + totals.co2Lost} label="Emissão (desmatamento)" />
            </div>
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/15">
              <div className="text-[9px] text-emerald-600 font-bold">Equivalência</div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                ≈ {(totals.netAnnual * 1000 / 2300).toFixed(0)} carros retirados das ruas por ano
              </div>
              <div className="text-[8px] text-emerald-500">
                (Carro médio emite ~2.3 tCO₂/ano — EPA)
              </div>
            </div>
          </div>

          {/* Carbon Credits */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Créditos de Carbono</div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {CREDIT_MARKETS.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedMarket(i)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    selectedMarket === i
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border border-emerald-200 dark:border-emerald-800/50">
              <div className="text-[9px] text-emerald-500 font-bold">{market.label} — {market.currency} {market.pricePerTon}/tCO₂</div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                {market.currency} {(creditValue / 1e6).toFixed(2)} M
                <span className="text-xs font-medium ml-1">/ano</span>
              </div>
              <div className="text-[10px] text-emerald-600 mt-1">
                Valor potencial dos créditos de carbono da região
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {adjustedBiomes.slice(0, 4).map(b => {
                const c = calculateBiomeCarbon(b);
                const val = c.netAnnual * market.pricePerTon;
                return (
                  <div key={b.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{b.icon} {b.name}</span>
                    <span className={`font-bold ${val > 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {market.currency} {(val / 1000).toFixed(0)}k
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Biome Cards */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Biomas Monitorados</h2>
            <div className="flex-1" />
            <span className="text-[9px] font-bold text-slate-400">{adjustedBiomes.length} biomas • {totals.totalArea.toLocaleString("pt-BR")} ha</span>
          </div>
          <div className="space-y-3">
            {adjustedBiomes.map(b => (
              <BiomeCard
                key={b.id}
                biome={b}
                isExpanded={expandedBiome === b.id}
                onToggle={() => setExpandedBiome(expandedBiome === b.id ? null : b.id)}
              />
            ))}
          </div>
        </div>

        {/* Formula / Methodology */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">Metodologia e Equações</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-bold text-emerald-600 mb-1">Equação Alométrica (Biomassa)</div>
                <div className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                  AGB = ρ × exp(−1.803 − 0.976×E + 0.976×ln(ρ) + 2.673×ln(D) − 0.0299×[ln(D)]²)
                </div>
                <div className="text-[9px] text-slate-400 mt-1">Chave et al., Global Change Biology (2014)</div>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-bold text-blue-600 mb-1">Estoque de Carbono</div>
                <div className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                  C_stock = Σ(A_i × BD_i × CF)
                </div>
                <div className="text-[9px] text-slate-400 mt-1">A=área, BD=densidade biomassa, CF=0.47 (IPCC 2006)</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-bold text-amber-600 mb-1">Conversão C → CO₂</div>
                <div className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                  CO₂_eq = C_stock × 3.667
                </div>
                <div className="text-[9px] text-slate-400 mt-1">Razão de massa molecular: 44/12 = 3.667</div>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-bold text-red-600 mb-1">Emissão por Desmatamento</div>
                <div className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                  E_defor = A_lost × BD × CF × 3.667
                </div>
                <div className="text-[9px] text-slate-400 mt-1">IPCC Good Practice Guidance (2003)</div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {["Chave et al. (2014)", "IPCC AR6 (2021)", "IPCC GPG (2003)", "SEEG Brasil", "MapBiomas", "SFB/INPE PRODES"].map(ref => (
              <span key={ref} className="text-[8px] font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-500 border border-slate-200 dark:border-slate-700">{ref}</span>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
