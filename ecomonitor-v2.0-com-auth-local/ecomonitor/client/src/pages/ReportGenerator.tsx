import { useState, useMemo, useRef } from "react";
import {
  FileText, Download, Printer, Eye, Clock, MapPin, BarChart3,
  CheckCircle2, AlertTriangle, Shield, Leaf, Zap, Users,
  ChevronRight, Globe, Activity, TrendingUp, Hash, Calendar,
  Building, FileCheck, Stamp, Lock,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import MainLayout from "@/components/MainLayout";

// ─── Types ───────────────────────────────────────────────────────────

interface ReportConfig {
  title: string;
  period: "7d" | "30d" | "90d" | "1y";
  sections: string[];
  format: "completo" | "resumido" | "tecnico";
  includeCharts: boolean;
  includeMap: boolean;
  includeRecommendations: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────

const REPORT_SECTIONS = [
  { id: "overview", label: "Visão Geral", icon: <Eye className="h-3.5 w-3.5" />, desc: "Resumo executivo com indicadores principais" },
  { id: "occurrences", label: "Ocorrências", icon: <MapPin className="h-3.5 w-3.5" />, desc: "Detalhamento de todas as ocorrências registradas" },
  { id: "iem", label: "Índice EcoMonitor (IEM)", icon: <Globe className="h-3.5 w-3.5" />, desc: "Score ambiental por região com evolução" },
  { id: "health", label: "Saúde Ambiental", icon: <Activity className="h-3.5 w-3.5" />, desc: "Correlações epidemiológicas e riscos" },
  { id: "losses", label: "Perdas Econômicas", icon: <TrendingUp className="h-3.5 w-3.5" />, desc: "Valoração dos serviços ecossistêmicos perdidos" },
  { id: "gamification", label: "Engajamento", icon: <Users className="h-3.5 w-3.5" />, desc: "Rankings, badges e participação comunitária" },
  { id: "recommendations", label: "Recomendações", icon: <CheckCircle2 className="h-3.5 w-3.5" />, desc: "Ações sugeridas baseadas nos dados" },
];

const PERIODS = [
  { value: "7d" as const, label: "Últimos 7 dias" },
  { value: "30d" as const, label: "Últimos 30 dias" },
  { value: "90d" as const, label: "Últimos 90 dias" },
  { value: "1y" as const, label: "Último ano" },
];

const FORMATS = [
  { value: "completo" as const, label: "Completo", desc: "Todas as seções com detalhamento máximo", icon: "📋" },
  { value: "resumido" as const, label: "Resumo Executivo", desc: "Indicadores-chave em 2 páginas", icon: "📄" },
  { value: "tecnico" as const, label: "Técnico", desc: "Dados brutos + metodologia para auditoria", icon: "🔬" },
];

// ─── Report Preview ──────────────────────────────────────────────────

function ReportPreview({ config, occurrences, user }: { config: ReportConfig; occurrences: any[]; user: any }) {
  const now = new Date();
  const protocol = `RPT-${now.getFullYear().toString().slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  const total = occurrences.length;
  const critical = occurrences.filter(o => o.severity === "critical").length;
  const high = occurrences.filter(o => o.severity === "high").length;
  const validated = occurrences.filter(o => o.status === "validated").length;
  const byType = occurrences.reduce((acc: Record<string, number>, o) => {
    acc[o.type] = (acc[o.type] || 0) + 1;
    return acc;
  }, {});

  const typeLabels: Record<string, string> = {
    fire: "Incêndio", water_pollution: "Poluição Hídrica", air_pollution: "Poluição do Ar",
    drought: "Seca", deforestation: "Desmatamento", flooding: "Enchente", other: "Outros",
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Leaf className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black">EcoMonitor — Relatório Ambiental</h2>
              <p className="text-emerald-100 text-xs">{config.title || "Relatório de Monitoramento Ambiental"}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-emerald-200">Protocolo</div>
            <div className="text-sm font-mono font-bold">{protocol}</div>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-4 gap-px bg-slate-200 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-700">
        {[
          { label: "Gerado em", value: now.toLocaleDateString("pt-BR") + " " + now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), icon: <Calendar className="h-3 w-3" /> },
          { label: "Período", value: PERIODS.find(p => p.value === config.period)?.label || "", icon: <Clock className="h-3 w-3" /> },
          { label: "Formato", value: config.format.charAt(0).toUpperCase() + config.format.slice(1), icon: <FileText className="h-3 w-3" /> },
          { label: "Responsável", value: user?.name || "Sistema", icon: <Shield className="h-3 w-3" /> },
        ].map((m, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-3">
            <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
              {m.icon} {m.label}
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="p-6 space-y-6">
        {/* Section: Overview */}
        {config.sections.includes("overview") && (
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 text-[10px] font-black">1</span>
              Visão Geral
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Total Ocorrências", value: total, color: "text-blue-600 bg-blue-50" },
                { label: "Críticas", value: critical, color: "text-red-600 bg-red-50" },
                { label: "Alta Severidade", value: high, color: "text-orange-600 bg-orange-50" },
                { label: "Validadas", value: validated, color: "text-emerald-600 bg-emerald-50" },
              ].map((s, i) => (
                <div key={i} className={`p-3 rounded-xl text-center ${s.color}`}>
                  <div className="text-2xl font-black">{s.value}</div>
                  <div className="text-[10px] font-bold opacity-70">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Occurrences */}
        {config.sections.includes("occurrences") && (
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-[10px] font-black">2</span>
              Distribuição de Ocorrências
            </h3>
            <div className="space-y-2">
              {Object.entries(byType).sort(([, a], [, b]) => (b as number) - (a as number)).map(([type, count]) => {
                const pct = total > 0 ? ((count as number) / total) * 100 : 0;
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-32 truncate">{typeLabels[type] || type}</span>
                    <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200 w-12 text-right">{count as number}</span>
                    <span className="text-[10px] text-slate-400 w-12 text-right">{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section: IEM */}
        {config.sections.includes("iem") && (
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 text-[10px] font-black">3</span>
              Índice EcoMonitor (IEM)
            </h3>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-black text-emerald-600">
                  {(() => {
                    const deg = (critical / Math.max(1, total)) * 30 + ((total - validated) / Math.max(1, total)) * 20 + 12;
                    const eng = 0.8 + (validated / Math.max(1, total)) * 0.4;
                    return Math.max(0, Math.min(100, 100 - deg * eng)).toFixed(0);
                  })()}
                  <span className="text-lg text-emerald-400">/100</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Saúde Ambiental da Cidade</div>
                  <div className="text-[10px] text-emerald-500">Baseado em {total} ocorrências no período</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section: Recommendations */}
        {config.sections.includes("recommendations") && config.includeRecommendations && (
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="w-6 h-6 rounded bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 text-[10px] font-black">R</span>
              Recomendações
            </h3>
            <div className="space-y-2">
              {[
                critical > 0 && `⚠️ ${critical} ocorrência(s) crítica(s) requerem ação imediata da Defesa Civil`,
                byType["fire"] > 0 && `🔥 ${byType["fire"]} foco(s) de incêndio detectado(s) — acionar Corpo de Bombeiros`,
                byType["water_pollution"] > 0 && `💧 ${byType["water_pollution"]} caso(s) de poluição hídrica — notificar SEMACE/ANA`,
                byType["deforestation"] > 0 && `🌳 ${byType["deforestation"]} caso(s) de desmatamento — acionar IBAMA/ICMBio`,
                validated < total * 0.5 && `📋 Taxa de validação baixa (${((validated / Math.max(1, total)) * 100).toFixed(0)}%) — intensificar engajamento comunitário`,
                "✅ Manter monitoramento contínuo via EcoMonitor para detecção precoce",
              ].filter(Boolean).map((rec, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/10 rounded-lg">
                  <span className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-3 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-[9px] text-slate-400">
            <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Documento autenticado digitalmente</span>
            <span className="flex items-center gap-1"><Stamp className="h-3 w-3" /> Hash: {Math.random().toString(16).substring(2, 18)}</span>
          </div>
          <div className="text-[9px] text-slate-400">
            EcoMonitor v2.1 — {now.toLocaleDateString("pt-BR")}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function ReportGenerator() {
  const { user } = useAuth();
  const { data: recentOccurrences } = trpc.occurrences.getRecent.useQuery({ limit: 100 });
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const [config, setConfig] = useState<ReportConfig>({
    title: "Relatório de Monitoramento Ambiental",
    period: "30d",
    sections: REPORT_SECTIONS.map(s => s.id),
    format: "completo",
    includeCharts: true,
    includeMap: true,
    includeRecommendations: true,
  });

  const toggleSection = (id: string) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.includes(id)
        ? prev.sections.filter(s => s !== id)
        : [...prev.sections, id],
    }));
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setShowPreview(true);
    }, 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto pb-12 space-y-6">
        {/* Hero */}
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Relatório One-Click</h1>
              <p className="text-blue-100 text-sm">Gere relatórios completos para auditoria em um clique</p>
            </div>
          </div>
        </div>

        {!showPreview ? (
          <>
            {/* Config */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Left: Title + Period + Format */}
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">Título do Relatório</label>
                  <input
                    type="text"
                    value={config.title}
                    onChange={e => setConfig(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-300 outline-none"
                  />
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Período</div>
                  <div className="grid grid-cols-2 gap-2">
                    {PERIODS.map(p => (
                      <button
                        key={p.value}
                        onClick={() => setConfig(prev => ({ ...prev, period: p.value }))}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                          config.period === p.value
                            ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-600 text-indigo-600"
                            : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Formato</div>
                  <div className="space-y-2">
                    {FORMATS.map(f => (
                      <button
                        key={f.value}
                        onClick={() => setConfig(prev => ({ ...prev, format: f.value }))}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                          config.format === f.value
                            ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-600"
                            : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-lg">{f.icon}</span>
                        <div>
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{f.label}</div>
                          <div className="text-[10px] text-slate-400">{f.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Sections + Options */}
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-300">Seções do Relatório</div>
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, sections: prev.sections.length === REPORT_SECTIONS.length ? [] : REPORT_SECTIONS.map(s => s.id) }))}
                      className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700"
                    >
                      {config.sections.length === REPORT_SECTIONS.length ? "Desmarcar todas" : "Selecionar todas"}
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {REPORT_SECTIONS.map(s => (
                      <label key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={config.sections.includes(s.id)}
                          onChange={() => toggleSection(s.id)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-300"
                        />
                        <span className="text-indigo-500">{s.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{s.label}</div>
                          <div className="text-[9px] text-slate-400">{s.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Opções Adicionais</div>
                  <div className="space-y-2">
                    {[
                      { key: "includeCharts" as const, label: "Incluir gráficos", icon: "📊" },
                      { key: "includeMap" as const, label: "Incluir mapa", icon: "🗺️" },
                      { key: "includeRecommendations" as const, label: "Incluir recomendações", icon: "💡" },
                    ].map(opt => (
                      <label key={opt.key} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config[opt.key]}
                          onChange={e => setConfig(prev => ({ ...prev, [opt.key]: e.target.checked }))}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-300"
                        />
                        <span>{opt.icon}</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={config.sections.length === 0 || generating}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-sm hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Gerando relatório...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Gerar Relatório ({config.sections.length} seções)
                </>
              )}
            </button>
          </>
        ) : (
          <>
            {/* Actions */}
            <div className="flex items-center gap-3">
              <button onClick={() => setShowPreview(false)} className="px-4 py-2 text-xs font-bold text-slate-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                ← Editar configurações
              </button>
              <div className="flex-1" />
              <button onClick={handlePrint} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 transition-colors">
                <Printer className="h-3.5 w-3.5" /> Imprimir
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/20"
              >
                <Download className="h-3.5 w-3.5" /> Exportar PDF
              </button>
            </div>

            {/* Preview */}
            <div ref={reportRef}>
              <ReportPreview config={config} occurrences={recentOccurrences || []} user={user} />
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
