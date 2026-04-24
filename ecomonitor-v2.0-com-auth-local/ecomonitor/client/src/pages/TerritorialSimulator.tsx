import { useState, useMemo } from "react";
import {
  Globe, ThermometerSun, Droplets, Wheat, TreePine, TrendingDown,
  Activity, AlertTriangle, Zap, MapPin, Target, BarChart3,
  ArrowUpRight, ArrowDownRight, Layers, Mountain, Wind, Flame,
  CloudRain, Eye, Play, Pause, RotateCcw, Info,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";

// ─── Types ───────────────────────────────────────────────────────────

interface Scenario {
  id: string;
  name: string;
  tempDelta: number; // °C
  seaLevel: number; // cm
  rainfallDelta: number; // %
  reforestation: boolean;
  description: string;
  rcp: string;
}

interface ImpactProjection {
  category: string;
  icon: React.ReactNode;
  current: string;
  projected: string;
  delta: number; // %
  unit: string;
}

interface TerritoryZone {
  id: string;
  name: string;
  type: string;
  area: number; // ha
  currentBiome: string;
  projectedBiome: string;
  productivityLoss: number; // %
  waterStress: number; // 0-100
  migrationPressure: number; // 0-100
  adaptationCost: number; // R$ milhões
}

// ─── Constants ───────────────────────────────────────────────────────

const SCENARIOS: Scenario[] = [
  { id: "s1", name: "Otimista — Paris +1.5°C", tempDelta: 1.5, seaLevel: 30, rainfallDelta: -8, reforestation: true, description: "Metas do Acordo de Paris cumpridas. Reflorestamento ativo de 12M ha no Brasil.", rcp: "RCP 2.6 / SSP1-2.6" },
  { id: "s2", name: "Moderado — +2.0°C", tempDelta: 2.0, seaLevel: 50, rainfallDelta: -15, reforestation: true, description: "Metas parcialmente cumpridas. Desmatamento reduzido em 60%. Transição energética em curso.", rcp: "RCP 4.5 / SSP2-4.5" },
  { id: "s3", name: "Pessimista — +3.0°C", tempDelta: 3.0, seaLevel: 80, rainfallDelta: -28, reforestation: false, description: "Sem ação climática significativa. Desmatamento contínuo. Colapso de biomas.", rcp: "RCP 7.0 / SSP3-7.0" },
  { id: "s4", name: "Catastrófico — +4.5°C", tempDelta: 4.5, seaLevel: 120, rainfallDelta: -42, reforestation: false, description: "Business-as-usual extremo. Feedback loops ativados. Ponto de não-retorno para Amazônia.", rcp: "RCP 8.5 / SSP5-8.5" },
];

const BASE_ZONES: TerritoryZone[] = [
  { id: "z1", name: "Caatinga — Sertão Central", type: "Semiárido", area: 450000, currentBiome: "Caatinga arbustiva", projectedBiome: "Deserto arenoso", productivityLoss: 0, waterStress: 65, migrationPressure: 45, adaptationCost: 2.8 },
  { id: "z2", name: "Cerrado — Matopiba", type: "Savana tropical", area: 890000, currentBiome: "Cerrado sensu stricto", projectedBiome: "Cerrado degradado", productivityLoss: 0, waterStress: 40, migrationPressure: 20, adaptationCost: 5.2 },
  { id: "z3", name: "Amazônia Oriental", type: "Floresta tropical", area: 1200000, currentBiome: "Floresta ombrófila", projectedBiome: "Savana tropical", productivityLoss: 0, waterStress: 25, migrationPressure: 15, adaptationCost: 12.5 },
  { id: "z4", name: "Mata Atlântica — NE", type: "Floresta tropical", area: 120000, currentBiome: "Mata atlântica restinga", projectedBiome: "Mata degradada", productivityLoss: 0, waterStress: 35, migrationPressure: 30, adaptationCost: 3.1 },
  { id: "z5", name: "Pantanal Norte", type: "Zona úmida", area: 350000, currentBiome: "Pantanal savânico", projectedBiome: "Pantanal seco sazonal", productivityLoss: 0, waterStress: 30, migrationPressure: 25, adaptationCost: 4.7 },
];

function projectZones(scenario: Scenario): TerritoryZone[] {
  const factor = scenario.tempDelta / 1.5;
  const reforestBonus = scenario.reforestation ? 0.7 : 1.0;
  return BASE_ZONES.map(z => ({
    ...z,
    productivityLoss: Math.round(Math.min(95, (15 * factor * reforestBonus) + (z.waterStress * 0.3 * factor))),
    waterStress: Math.round(Math.min(100, z.waterStress + (15 * factor * reforestBonus))),
    migrationPressure: Math.round(Math.min(100, z.migrationPressure + (12 * factor * reforestBonus))),
    adaptationCost: Math.round(z.adaptationCost * (1 + factor * 0.8) * 10) / 10,
    projectedBiome: scenario.tempDelta <= 2.0 && scenario.reforestation
      ? z.currentBiome + " (preservado)"
      : z.projectedBiome,
  }));
}

// ─── Main Component ──────────────────────────────────────────────────

export default function TerritorialSimulator() {
  const [selectedScenario, setSelectedScenario] = useState("s2");
  const scenario = SCENARIOS.find(s => s.id === selectedScenario)!;
  const zones = useMemo(() => projectZones(scenario), [selectedScenario]);

  const impacts: ImpactProjection[] = useMemo(() => [
    { category: "Produção Agrícola", icon: <Wheat className="h-3.5 w-3.5 text-amber-500" />, current: "233 Mt", projected: `${Math.round(233 * (1 - scenario.tempDelta * 0.08))} Mt`, delta: -Math.round(scenario.tempDelta * 8), unit: "Mt/ano" },
    { category: "Disponibilidade Hídrica", icon: <Droplets className="h-3.5 w-3.5 text-blue-500" />, current: "12.000 m³/cap", projected: `${Math.round(12000 * (1 + scenario.rainfallDelta / 100)).toLocaleString("pt-BR")} m³/cap`, delta: scenario.rainfallDelta, unit: "m³/capita/ano" },
    { category: "Área de Floresta", icon: <TreePine className="h-3.5 w-3.5 text-emerald-500" />, current: "496 Mha", projected: `${Math.round(496 * (scenario.reforestation ? (1 - scenario.tempDelta * 0.03) : (1 - scenario.tempDelta * 0.07)))} Mha`, delta: scenario.reforestation ? -Math.round(scenario.tempDelta * 3) : -Math.round(scenario.tempDelta * 7), unit: "Mha" },
    { category: "Migrantes Climáticos", icon: <Activity className="h-3.5 w-3.5 text-red-500" />, current: "~2M", projected: `~${Math.round(2 + scenario.tempDelta * 3.5 * (scenario.reforestation ? 0.6 : 1))}M`, delta: Math.round(scenario.tempDelta * 3.5 * (scenario.reforestation ? 0.6 : 1) / 2 * 100), unit: "pessoas" },
    { category: "PIB Agro", icon: <BarChart3 className="h-3.5 w-3.5 text-indigo-500" />, current: "R$ 680 bi", projected: `R$ ${Math.round(680 * (1 - scenario.tempDelta * 0.06))} bi`, delta: -Math.round(scenario.tempDelta * 6), unit: "R$ bilhões" },
    { category: "Nível do Mar", icon: <CloudRain className="h-3.5 w-3.5 text-cyan-500" />, current: "ref. 2020", projected: `+${scenario.seaLevel} cm`, delta: scenario.seaLevel, unit: "cm até 2100" },
  ], [selectedScenario]);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto pb-12 space-y-6">
        {/* Hero */}
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-emerald-800 via-teal-800 to-cyan-800 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <Globe className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Simulador de Futuro Territorial</h1>
              <p className="text-teal-200 text-sm">Visualize impactos de cenários climáticos com IA generativa — IPCC AR6 + dados regionais</p>
            </div>
          </div>
        </div>

        {/* Scenario Selection */}
        <div className="grid sm:grid-cols-2 gap-3">
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedScenario(s.id)}
              className={`p-4 rounded-xl text-left transition-all ${
                selectedScenario === s.id
                  ? "ring-2 ring-teal-500 bg-teal-50 dark:bg-teal-950/20"
                  : "bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <ThermometerSun className={`h-4 w-4 ${
                  s.tempDelta <= 1.5 ? "text-emerald-500" : s.tempDelta <= 2.0 ? "text-amber-500" : s.tempDelta <= 3.0 ? "text-orange-500" : "text-red-500"
                }`} />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{s.name}</span>
              </div>
              <p className="text-[10px] text-slate-500 mb-2">{s.description}</p>
              <div className="flex gap-3 text-[9px]">
                <span className="text-red-500 font-bold">+{s.tempDelta}°C</span>
                <span className="text-blue-500 font-bold">+{s.seaLevel}cm mar</span>
                <span className="text-amber-500 font-bold">{s.rainfallDelta}% chuva</span>
                <span className={`font-bold ${s.reforestation ? "text-emerald-500" : "text-red-500"}`}>
                  {s.reforestation ? "✅ Reflorest." : "❌ Sem reflorest."}
                </span>
              </div>
              <div className="text-[8px] text-slate-400 mt-1">{s.rcp}</div>
            </button>
          ))}
        </div>

        {/* Impact Projections */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-teal-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Impactos Projetados — Brasil 2050-2100</h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {impacts.map(imp => (
              <div key={imp.category} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center gap-1.5 mb-2">
                  {imp.icon}
                  <span className="text-[10px] font-bold text-slate-500">{imp.category}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-[8px] text-slate-400">Atual</div>
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-300">{imp.current}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] text-slate-400">Projetado</div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{imp.projected}</div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1 mt-1">
                  {imp.delta < 0 ? <ArrowDownRight className="h-3 w-3 text-red-500" /> : <ArrowUpRight className="h-3 w-3 text-red-500" />}
                  <span className={`text-[10px] font-bold ${Math.abs(imp.delta) > 20 ? "text-red-600" : "text-amber-600"}`}>
                    {imp.delta > 0 ? "+" : ""}{imp.delta}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Territory Zones */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Zonas Territoriais — Simulação {scenario.name}</h2>
          </div>
          <div className="space-y-3">
            {zones.map(zone => (
              <div key={zone.id} className="p-4 rounded-xl border border-slate-200/60 dark:border-white/5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{zone.name}</div>
                    <div className="text-[9px] text-slate-400">{zone.type} · {zone.area.toLocaleString("pt-BR")} ha</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] text-slate-400">Custo Adapt.</div>
                    <div className="text-sm font-bold text-indigo-600">R$ {zone.adaptationCost}M</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2 text-[10px]">
                  <span className="text-emerald-600 font-medium">🌿 {zone.currentBiome}</span>
                  <span className="text-slate-400">→</span>
                  <span className={`font-medium ${zone.projectedBiome.includes("preservado") ? "text-emerald-600" : "text-red-600"}`}>
                    {zone.projectedBiome.includes("preservado") ? "🌿" : "⚠️"} {zone.projectedBiome}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Perda Produtividade", value: zone.productivityLoss, color: zone.productivityLoss > 40 ? "bg-red-500" : zone.productivityLoss > 20 ? "bg-amber-500" : "bg-emerald-500" },
                    { label: "Estresse Hídrico", value: zone.waterStress, color: zone.waterStress > 70 ? "bg-red-500" : zone.waterStress > 50 ? "bg-amber-500" : "bg-emerald-500" },
                    { label: "Pressão Migratória", value: zone.migrationPressure, color: zone.migrationPressure > 60 ? "bg-red-500" : zone.migrationPressure > 35 ? "bg-amber-500" : "bg-emerald-500" },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="text-[8px] text-slate-400 mb-0.5">{m.label}</div>
                      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${m.color}`} style={{ width: `${m.value}%` }} />
                      </div>
                      <div className="text-[9px] font-bold text-slate-500 mt-0.5">{m.value}%</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/10 border border-teal-200 dark:border-teal-800/40">
            <div className="text-[10px] font-bold text-teal-700 dark:text-teal-300 mb-1">💰 Custo Total de Adaptação</div>
            <div className="text-lg font-black text-teal-700 dark:text-teal-300">
              R$ {zones.reduce((s, z) => s + z.adaptationCost, 0).toFixed(1)} milhões
            </div>
            <div className="text-[9px] text-teal-600 dark:text-teal-400">
              Cenário {scenario.name} — Investimento necessário em infraestrutura verde, irrigação, reassentamento e tecnologia.
            </div>
          </div>
        </div>

        {/* Methodology */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">Modelos Climáticos e Referências</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold text-teal-600 mb-1">Cenários IPCC AR6</div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Shared Socioeconomic Pathways (SSPs) combinados com Representative Concentration Pathways (RCPs).
              </div>
              <div className="text-[9px] text-slate-400 mt-1">CMIP6 — Coupled Model Intercomparison Project Phase 6.</div>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold text-emerald-600 mb-1">Projeções Regionais</div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Downscaling estatístico para América do Sul usando Eta-INPE (resolução 5km).
              </div>
              <div className="text-[9px] text-slate-400 mt-1">Chou et al. (2014), Marengo et al. (2020).</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {["IPCC AR6 WGII Ch.12", "CMIP6 (Eyring 2016)", "Eta-INPE 5km", "Marengo et al. 2020", "PBMC (2014)", "SEEG/OC", "MapBiomas 8.0", "World Bank CCKP", "Stern Review (2006)"].map(ref => (
              <span key={ref} className="text-[8px] font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-500 border border-slate-200 dark:border-slate-700">{ref}</span>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
