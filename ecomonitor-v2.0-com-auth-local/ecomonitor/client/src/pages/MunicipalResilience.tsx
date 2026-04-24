import { useState, useMemo } from "react";
import {
  Building2, Droplets, ThermometerSun, AlertTriangle, Shield, MapPin,
  TrendingUp, TrendingDown, Users, Activity, Zap, Wind, CloudRain,
  CheckCircle2, XCircle, Clock, BarChart3, ArrowUpRight, Eye,
  Waves, Mountain, Flame, Target, Info, Bell,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";

// ─── Types ───────────────────────────────────────────────────────────

interface Municipality {
  id: string;
  name: string;
  state: string;
  population: number;
  area: number; // km²
  irct: number; // Índice de Resiliência Climático-Territorial 0-100
  hydricRisk: number; // 0-100
  desertificationRisk: number; // 0-100
  socialVulnerability: number; // 0-100
  heatIsland: number; // °C difference
  alertLevel: "normal" | "attention" | "alert" | "emergency";
  trend: "improving" | "stable" | "worsening";
  recentEvents: number;
}

interface AlertMessage {
  id: string;
  type: "hydric" | "heat" | "desertification" | "social" | "biodiversity";
  severity: "info" | "warning" | "critical";
  municipality: string;
  title: string;
  description: string;
  timestamp: string;
  automated: boolean;
}

interface InfraStatus {
  category: string;
  icon: React.ReactNode;
  items: { name: string; status: "ok" | "warning" | "critical"; value: string }[];
}

// ─── Constants ───────────────────────────────────────────────────────

const MUNICIPALITIES: Municipality[] = [
  { id: "m1", name: "Petrolina", state: "PE", population: 354895, area: 4561, irct: 42, hydricRisk: 78, desertificationRisk: 72, socialVulnerability: 61, heatIsland: 3.2, alertLevel: "alert", trend: "worsening", recentEvents: 14 },
  { id: "m2", name: "Juazeiro", state: "BA", population: 216588, area: 6500, irct: 38, hydricRisk: 82, desertificationRisk: 75, socialVulnerability: 68, heatIsland: 2.8, alertLevel: "emergency", trend: "worsening", recentEvents: 21 },
  { id: "m3", name: "Sobral", state: "CE", population: 212437, area: 2123, irct: 55, hydricRisk: 65, desertificationRisk: 58, socialVulnerability: 52, heatIsland: 2.1, alertLevel: "attention", trend: "stable", recentEvents: 7 },
  { id: "m4", name: "Caruaru", state: "PE", population: 361118, area: 921, irct: 48, hydricRisk: 70, desertificationRisk: 45, socialVulnerability: 55, heatIsland: 2.9, alertLevel: "attention", trend: "improving", recentEvents: 9 },
  { id: "m5", name: "Mossoró", state: "RN", population: 300618, area: 2110, irct: 51, hydricRisk: 68, desertificationRisk: 64, socialVulnerability: 49, heatIsland: 2.5, alertLevel: "attention", trend: "stable", recentEvents: 6 },
  { id: "m6", name: "Campina Grande", state: "PB", population: 411807, area: 594, irct: 62, hydricRisk: 55, desertificationRisk: 38, socialVulnerability: 42, heatIsland: 1.8, alertLevel: "normal", trend: "improving", recentEvents: 3 },
];

const ALERTS: AlertMessage[] = [
  { id: "a1", type: "hydric", severity: "critical", municipality: "Juazeiro", title: "Reservatório Sobradinho abaixo de 15%", description: "Volume útil em 14.2%. Rodízio de abastecimento iminente. ANA emitiu alerta de escassez hídrica.", timestamp: "2h atrás", automated: true },
  { id: "a2", type: "desertification", severity: "critical", municipality: "Petrolina", title: "Avanço de desertificação detectado — NDDI > 0.4", description: "Índice de seca por sensoriamento remoto indica degradação acelerada em 340 km² no último trimestre.", timestamp: "6h atrás", automated: true },
  { id: "a3", type: "heat", severity: "warning", municipality: "Caruaru", title: "Ilha de calor urbano acima do limiar", description: "Diferença térmica de 4.1°C entre centro e periferia. Risco de estresse térmico em idosos.", timestamp: "12h atrás", automated: true },
  { id: "a4", type: "social", severity: "warning", municipality: "Sobral", title: "Êxodo rural acelerando — 3.2% pop. rural/ano", description: "Taxa de migração rural-urbana acima da média estadual. Correlação com queda de produtividade agrícola.", timestamp: "1d atrás", automated: false },
  { id: "a5", type: "biodiversity", severity: "warning", municipality: "Mossoró", title: "Declínio de polinizadores — Apis mellifera -22%", description: "Monitoramento apícola indica queda populacional associada a uso de agrotóxicos e perda de habitat.", timestamp: "2d atrás", automated: true },
];

const ALERT_ICON_COLORS = { info: "text-blue-500", warning: "text-amber-500", critical: "text-red-500" };
const ALERT_BG = { info: "bg-blue-50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-800/40", warning: "bg-amber-50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800/40", critical: "bg-red-50 dark:bg-red-950/10 border-red-200 dark:border-red-800/40" };
const LEVEL_COLORS = { normal: "text-emerald-600 bg-emerald-50", attention: "text-amber-600 bg-amber-50", alert: "text-orange-600 bg-orange-50", emergency: "text-red-600 bg-red-50" };

// ─── Main Component ──────────────────────────────────────────────────

export default function MunicipalResilience() {
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>("m2");
  const selected = MUNICIPALITIES.find(m => m.id === selectedMunicipality)!;

  const aggrStats = useMemo(() => ({
    avgIrct: Math.round(MUNICIPALITIES.reduce((s, m) => s + m.irct, 0) / MUNICIPALITIES.length),
    highRisk: MUNICIPALITIES.filter(m => m.hydricRisk > 70).length,
    totalEvents: MUNICIPALITIES.reduce((s, m) => s + m.recentEvents, 0),
    critAlerts: ALERTS.filter(a => a.severity === "critical").length,
  }), []);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto pb-12 space-y-6">
        {/* Hero */}
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-blue-800 via-indigo-800 to-purple-800 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Sistema Anti-Colapso Municipal</h1>
              <p className="text-indigo-200 text-sm">Painel de resiliência climático-territorial para gestores municipais</p>
            </div>
          </div>
          <div className="relative grid grid-cols-4 gap-3 mt-5">
            {[
              { label: "IRCT Médio", value: `${aggrStats.avgIrct}/100`, color: aggrStats.avgIrct > 50 ? "text-emerald-300" : "text-red-300" },
              { label: "Municípios Risco Hídrico", value: `${aggrStats.highRisk}/${MUNICIPALITIES.length}`, color: "text-red-300" },
              { label: "Ocorrências 30d", value: `${aggrStats.totalEvents}`, color: "text-amber-300" },
              { label: "Alertas Críticos", value: `${aggrStats.critAlerts}`, color: "text-red-300" },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl bg-white/10 backdrop-blur-sm text-center">
                <div className="text-[9px] font-bold text-white/60 uppercase">{s.label}</div>
                <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Municipal Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MUNICIPALITIES.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMunicipality(m.id)}
              className={`p-4 rounded-xl text-left transition-all ${
                selectedMunicipality === m.id
                  ? "ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-950/20"
                  : "bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{m.name} — {m.state}</span>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${LEVEL_COLORS[m.alertLevel]}`}>
                  {m.alertLevel === "normal" ? "Normal" : m.alertLevel === "attention" ? "Atenção" : m.alertLevel === "alert" ? "Alerta" : "Emergência"}
                </span>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className={`text-2xl font-black ${m.irct >= 55 ? "text-emerald-600" : m.irct >= 40 ? "text-amber-600" : "text-red-600"}`}>{m.irct}</span>
                <span className="text-[9px] text-slate-400 mb-1">IRCT</span>
                {m.trend === "improving" ? <ArrowUpRight className="h-3 w-3 text-emerald-500 mb-1" /> :
                 m.trend === "worsening" ? <TrendingDown className="h-3 w-3 text-red-500 mb-1" /> :
                 <Activity className="h-3 w-3 text-slate-400 mb-1" />}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: "Hídrico", val: m.hydricRisk, color: m.hydricRisk > 70 ? "bg-red-500" : m.hydricRisk > 50 ? "bg-amber-500" : "bg-emerald-500" },
                  { label: "Desert.", val: m.desertificationRisk, color: m.desertificationRisk > 70 ? "bg-red-500" : m.desertificationRisk > 50 ? "bg-amber-500" : "bg-emerald-500" },
                  { label: "Social", val: m.socialVulnerability, color: m.socialVulnerability > 60 ? "bg-red-500" : m.socialVulnerability > 40 ? "bg-amber-500" : "bg-emerald-500" },
                ].map(r => (
                  <div key={r.label}>
                    <div className="text-[8px] text-slate-400 mb-0.5">{r.label}</div>
                    <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.val}%` }} />
                    </div>
                    <div className="text-[8px] font-bold text-slate-500 mt-0.5">{r.val}%</div>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Selected Municipality Detail */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">{selected.name} — Diagnóstico Detalhado</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: "População", value: selected.population.toLocaleString("pt-BR"), icon: <Users className="h-3 w-3 text-indigo-500" /> },
              { label: "Área", value: `${selected.area.toLocaleString("pt-BR")} km²`, icon: <Mountain className="h-3 w-3 text-amber-500" /> },
              { label: "Ilha de Calor", value: `+${selected.heatIsland}°C`, icon: <ThermometerSun className="h-3 w-3 text-red-500" /> },
              { label: "Ocorrências/30d", value: `${selected.recentEvents}`, icon: <AlertTriangle className="h-3 w-3 text-orange-500" /> },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {s.icon}
                  <span className="text-[8px] text-slate-400 uppercase">{s.label}</span>
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{s.value}</span>
              </div>
            ))}
          </div>

          {/* IRCT Breakdown */}
          <div className="text-[10px] font-bold text-slate-500 mb-2">Índice de Resiliência Climático-Territorial (IRCT)</div>
          <div className="space-y-1.5">
            {[
              { label: "Segurança Hídrica", value: 100 - selected.hydricRisk, weight: 30 },
              { label: "Resistência à Desertificação", value: 100 - selected.desertificationRisk, weight: 25 },
              { label: "Coesão Social", value: 100 - selected.socialVulnerability, weight: 20 },
              { label: "Infraestrutura Verde", value: Math.min(100, selected.irct + 12), weight: 15 },
              { label: "Capacidade Institucional", value: Math.min(100, selected.irct + 8), weight: 10 },
            ].map(dim => (
              <div key={dim.label} className="flex items-center gap-2">
                <span className="text-[9px] text-slate-500 w-44">{dim.label} ({dim.weight}%)</span>
                <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className={`h-full rounded-full ${dim.value >= 50 ? "bg-emerald-500" : dim.value >= 30 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${dim.value}%` }} />
                </div>
                <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 w-8 text-right">{dim.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Alerts */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Alertas Automatizados</h2>
            <span className="text-[8px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded-md">{ALERTS.length} ativos</span>
          </div>
          <div className="space-y-2">
            {ALERTS.map(alert => (
              <div key={alert.id} className={`p-3 rounded-xl border ${ALERT_BG[alert.severity]}`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${ALERT_ICON_COLORS[alert.severity]}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{alert.title}</span>
                      <span className="text-[8px] text-slate-400">{alert.municipality} · {alert.timestamp}</span>
                      {alert.automated && <span className="text-[7px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 px-1 py-0.5 rounded">AUTO</span>}
                    </div>
                    <p className="text-[10px] text-slate-500">{alert.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Methodology */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">Metodologia — IRCT (Índice de Resiliência Climático-Territorial)</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold text-indigo-600 mb-1">Fórmula IRCT</div>
              <div className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                IRCT = Σ (wᵢ × Dᵢ) × α_institucional
              </div>
              <div className="text-[9px] text-slate-400 mt-1">5 dimensões ponderadas × fator de capacidade institucional (0.7-1.3).</div>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold text-blue-600 mb-1">Classificação de Alerta</div>
              <div className="text-[9px] text-slate-500 space-y-0.5">
                <div>🟢 <b>Normal</b>: IRCT ≥ 60 — monitoramento padrão</div>
                <div>🟡 <b>Atenção</b>: 45 ≤ IRCT {"<"} 60 — relatórios quinzenais</div>
                <div>🟠 <b>Alerta</b>: 30 ≤ IRCT {"<"} 45 — ação preventiva</div>
                <div>🔴 <b>Emergência</b>: IRCT {"<"} 30 — intervenção imediata</div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {["IPCC AR6 WGII", "IBGE Censo 2022", "ANA Sist. Hídrico", "INPE DETER", "MapBiomas Alerta", "CEMADEN", "Rockström et al. (2009)", "UNDRR Sendai Framework"].map(ref => (
              <span key={ref} className="text-[8px] font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-500 border border-slate-200 dark:border-slate-700">{ref}</span>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
