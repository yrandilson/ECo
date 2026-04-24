import { useState, useMemo } from "react";
import {
  Scale, Users, DollarSign, TrendingUp, TrendingDown, BarChart3,
  AlertTriangle, CheckCircle2, XCircle, Globe, Heart, Shield,
  Eye, ArrowUpRight, ArrowDownRight, MapPin, Landmark, HandCoins,
  Leaf, Droplets, TreePine, Target, Award, Zap, Activity,
  PieChart, GitBranch, Wallet,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import MainLayout from "@/components/MainLayout";

// ─── Types ───────────────────────────────────────────────────────────

interface Community {
  id: string;
  name: string;
  type: "indigenous" | "quilombola" | "smallholder" | "fishing" | "traditional";
  population: number;
  territory: string;
  revenueReceived: number;
  revenueFair: number;
  giniLocal: number; // 0-1
  accessScore: number; // 0-100
  vulnerabilityIndex: number; // 0-100
  icon: string;
}

interface FlowEntry {
  id: string;
  source: string;
  destination: string;
  amount: number;
  type: "carbon_credit" | "refi_grant" | "gov_subsidy" | "tech_fee" | "community_share";
  percentage: number;
  flagged: boolean;
  flagReason?: string;
}

interface AuditFinding {
  id: string;
  severity: "critical" | "warning" | "info" | "pass";
  title: string;
  description: string;
  recommendation: string;
  sdg: string[];
}

// ─── Constants ───────────────────────────────────────────────────────

const COMMUNITIES: Community[] = [
  { id: "c1", name: "Aldeia Pataxó — Reserva Monte Pascoal", type: "indigenous", population: 340, territory: "Mata Atlântica Sul BA", revenueReceived: 45000, revenueFair: 128000, giniLocal: 0.62, accessScore: 28, vulnerabilityIndex: 82, icon: "🏛️" },
  { id: "c2", name: "Quilombo Kalunga — Goiás", type: "quilombola", population: 580, territory: "Cerrado GO", revenueReceived: 67000, revenueFair: 95000, giniLocal: 0.48, accessScore: 42, vulnerabilityIndex: 71, icon: "🏘️" },
  { id: "c3", name: "Assoc. Pequenos Produtores — Sertão CE", type: "smallholder", population: 210, territory: "Caatinga CE", revenueReceived: 34000, revenueFair: 78000, giniLocal: 0.55, accessScore: 35, vulnerabilityIndex: 76, icon: "🌾" },
  { id: "c4", name: "Comunidade Pesqueira — Litoral Sul SP", type: "fishing", population: 150, territory: "Mangue SP", revenueReceived: 89000, revenueFair: 102000, giniLocal: 0.31, accessScore: 68, vulnerabilityIndex: 45, icon: "🐟" },
  { id: "c5", name: "Extrativistas — Reserva Chico Mendes", type: "traditional", population: 420, territory: "Amazônia AC", revenueReceived: 52000, revenueFair: 185000, giniLocal: 0.71, accessScore: 22, vulnerabilityIndex: 88, icon: "🌳" },
  { id: "c6", name: "Cooperativa Agroecológica — Vale do Jequitinhonha", type: "smallholder", population: 310, territory: "Cerrado/Caatinga MG", revenueReceived: 78000, revenueFair: 110000, giniLocal: 0.39, accessScore: 55, vulnerabilityIndex: 58, icon: "🌿" },
];

const FLOWS: FlowEntry[] = [
  { id: "f1", source: "Venda de Créditos VCS", destination: "Plataforma Tech", amount: 850000, type: "tech_fee", percentage: 34, flagged: true, flagReason: "Taxa de tecnologia > 30% do total — desproporcional" },
  { id: "f2", source: "Venda de Créditos VCS", destination: "Comunidades Locais", amount: 365000, type: "community_share", percentage: 14.6, flagged: true, flagReason: "Comunidades recebem < 15% — abaixo do mínimo ético" },
  { id: "f3", source: "Venda de Créditos VCS", destination: "Intermediários/Brokers", amount: 520000, type: "carbon_credit", percentage: 20.8, flagged: true, flagReason: "Intermediação consome 20%+ do valor" },
  { id: "f4", source: "Venda de Créditos VCS", destination: "Governo (impostos)", amount: 180000, type: "gov_subsidy", percentage: 7.2, flagged: false },
  { id: "f5", source: "Venda de Créditos VCS", destination: "Conservação direta", amount: 385000, type: "refi_grant", percentage: 15.4, flagged: false },
  { id: "f6", source: "Venda de Créditos VCS", destination: "Operacional/Admin", amount: 200000, type: "tech_fee", percentage: 8.0, flagged: false },
];

const AUDIT_FINDINGS: AuditFinding[] = [
  { id: "a1", severity: "critical", title: "Distribuição assimétrica de receita", description: "Comunidades tradicionais recebem apenas 14.6% do total gerado por créditos de carbono, enquanto taxas de tecnologia absorvem 34%. Razão de 2.3:1 contra comunidades.", recommendation: "Implementar split mínimo de 40% para comunidades + teto de 20% para taxas tech", sdg: ["ODS 10", "ODS 1"] },
  { id: "a2", severity: "critical", title: "Aldeia Pataxó com gap de justiça de 65%", description: "Recebe R$ 45k/ano mas análise de contribuição ao sequestro indica R$ 128k justos. Gap de R$ 83k. Comunidade com maior vulnerabilidade (82/100) e menor acesso (28/100).", recommendation: "Priorizar repasses proporcionais à vulnerabilidade + contribuição territorial", sdg: ["ODS 10", "ODS 15"] },
  { id: "a3", severity: "warning", title: "Índice de Gini ambiental regional: 0.51", description: "Gini combinado das comunidades indica desigualdade moderada-alta na distribuição dos benefícios dos serviços ecossistêmicos.", recommendation: "Meta de Gini < 0.35 até 2027 com redistribuição progressiva", sdg: ["ODS 10", "ODS 16"] },
  { id: "a4", severity: "warning", title: "Intermediários consomem 20.8% do fluxo", description: "Brokers e intermediários de carbono capturam mais que as próprias comunidades. Estrutura de mercado favorece rent-seeking.", recommendation: "Venda direta via EcoProtocol API — reduzir intermediação para < 5%", sdg: ["ODS 8", "ODS 17"] },
  { id: "a5", severity: "info", title: "Comunidade Pesqueira com melhor equidade", description: "Comunidade do Litoral Sul SP tem Gini 0.31, acesso 68/100, recebe 87% do justo. Modelo replicável.", recommendation: "Documentar caso como benchmark para as demais comunidades", sdg: ["ODS 14", "ODS 10"] },
  { id: "a6", severity: "pass", title: "Conformidade com ODS 13 (Ação Climática)", description: "100% dos fluxos financeiros estão vinculados a projetos de mitigação/adaptação climática verificados.", recommendation: "Manter padrão — expandir para ODS 6 (água)", sdg: ["ODS 13"] },
];

const COMMUNITY_TYPES = {
  indigenous: { label: "Indígena", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20" },
  quilombola: { label: "Quilombola", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/20" },
  smallholder: { label: "Pequeno Produtor", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/20" },
  fishing: { label: "Pesqueira", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20" },
  traditional: { label: "Extrativista", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
};

const SEVERITY_CONFIG = {
  critical: { label: "Crítico", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-200 dark:border-red-800/40", icon: XCircle },
  warning: { label: "Atenção", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-200 dark:border-amber-800/40", icon: AlertTriangle },
  info: { label: "Info", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-200 dark:border-blue-800/40", icon: Eye },
  pass: { label: "OK", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-800/40", icon: CheckCircle2 },
};

// ─── Main Component ──────────────────────────────────────────────────

export default function ClimateJustice() {
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);

  const totals = useMemo(() => {
    const totalReceived = COMMUNITIES.reduce((s, c) => s + c.revenueReceived, 0);
    const totalFair = COMMUNITIES.reduce((s, c) => s + c.revenueFair, 0);
    const avgGini = COMMUNITIES.reduce((s, c) => s + c.giniLocal, 0) / COMMUNITIES.length;
    const avgVulnerability = COMMUNITIES.reduce((s, c) => s + c.vulnerabilityIndex, 0) / COMMUNITIES.length;
    const totalFlow = FLOWS.reduce((s, f) => s + f.amount, 0);
    const communityShare = FLOWS.filter(f => f.type === "community_share").reduce((s, f) => s + f.amount, 0);
    const techShare = FLOWS.filter(f => f.type === "tech_fee").reduce((s, f) => s + f.amount, 0);
    return { totalReceived, totalFair, avgGini, avgVulnerability, totalFlow, communityShare, techShare, gap: totalFair - totalReceived };
  }, []);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto pb-12 space-y-6">
        {/* Hero */}
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-rose-700 via-pink-700 to-fuchsia-700 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <Scale className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Justiça Climática</h1>
              <p className="text-rose-100 text-sm">Auditoria IA de equidade na distribuição de benefícios — Finanças Regenerativas (ReFi)</p>
            </div>
          </div>
          <div className="relative grid grid-cols-4 gap-3 mt-5">
            {[
              { value: `R$ ${(totals.totalReceived / 1000).toFixed(0)}k`, label: "Recebido por comunidades", icon: "💰" },
              { value: `R$ ${(totals.gap / 1000).toFixed(0)}k`, label: "Gap de justiça", icon: "⚖️" },
              { value: (totals.avgGini).toFixed(2), label: "Gini ambiental médio", icon: "📊" },
              { value: `${totals.avgVulnerability.toFixed(0)}%`, label: "Vulnerabilidade média", icon: "🔴" },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-lg font-black text-white">{s.icon} {s.value}</div>
                <div className="text-[10px] text-rose-100 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Flow Sankey-style */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="h-4 w-4 text-rose-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Fluxo Financeiro — Rastreio Ponta a Ponta</h2>
            <div className="flex-1" />
            <span className="text-[9px] text-slate-400 font-bold">R$ {(totals.totalFlow / 1e6).toFixed(2)}M total</span>
          </div>
          <div className="space-y-2">
            {FLOWS.map(f => (
              <div key={f.id} className={`p-3 rounded-xl border ${f.flagged ? "border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-950/10" : "border-slate-200/60 dark:border-white/5"}`}>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-slate-400">{f.source}</span>
                      <ArrowUpRight className="h-3 w-3 text-slate-300" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{f.destination}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          f.type === "community_share" ? "bg-emerald-400" :
                          f.type === "tech_fee" ? "bg-red-400" :
                          f.type === "carbon_credit" ? "bg-amber-400" :
                          f.type === "gov_subsidy" ? "bg-blue-400" : "bg-green-400"
                        }`}
                        style={{ width: `${f.percentage * 2.5}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <div className="text-sm font-black text-slate-700 dark:text-slate-200">R$ {(f.amount / 1000).toFixed(0)}k</div>
                    <div className="text-[9px] text-slate-400">{f.percentage}%</div>
                  </div>
                  {f.flagged && (
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                  )}
                </div>
                {f.flagged && f.flagReason && (
                  <div className="mt-2 text-[9px] text-red-600 dark:text-red-400 font-medium">
                    ⚠️ {f.flagReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Communities */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-purple-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Comunidades Monitoradas</h2>
            <div className="flex-1" />
            <span className="text-[9px] text-slate-400 font-bold">{COMMUNITIES.length} comunidades • {COMMUNITIES.reduce((s, c) => s + c.population, 0).toLocaleString("pt-BR")} pessoas</span>
          </div>
          <div className="space-y-3">
            {COMMUNITIES.map(c => {
              const typeCfg = COMMUNITY_TYPES[c.type];
              const fairPct = (c.revenueReceived / c.revenueFair) * 100;
              const isExpanded = selectedCommunity === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCommunity(isExpanded ? null : c.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isExpanded ? "border-rose-300 dark:border-rose-700 ring-2 ring-rose-500/20 bg-white dark:bg-slate-900/80" :
                    "border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{c.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{c.name}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${typeCfg.bg} ${typeCfg.color}`}>{typeCfg.label}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{c.territory} • {c.population} pessoas</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-black ${fairPct >= 80 ? "text-emerald-600" : fairPct >= 50 ? "text-amber-600" : "text-red-600"}`}>
                        {fairPct.toFixed(0)}%
                      </div>
                      <div className="text-[8px] text-slate-400">do justo</div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-1 duration-200">
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-center">
                          <div className="text-xs font-black text-emerald-700 dark:text-emerald-400">R$ {(c.revenueReceived / 1000).toFixed(0)}k</div>
                          <div className="text-[8px] text-emerald-500">Recebido</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-center">
                          <div className="text-xs font-black text-blue-700 dark:text-blue-400">R$ {(c.revenueFair / 1000).toFixed(0)}k</div>
                          <div className="text-[8px] text-blue-500">Justo (IA)</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 text-center">
                          <div className="text-xs font-black text-red-700 dark:text-red-400">{c.giniLocal.toFixed(2)}</div>
                          <div className="text-[8px] text-red-500">Gini local</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-center">
                          <div className="text-xs font-black text-amber-700 dark:text-amber-400">{c.vulnerabilityIndex}</div>
                          <div className="text-[8px] text-amber-500">Vulnerabilidade</div>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] text-slate-400 font-bold">Acesso a benefícios</span>
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{c.accessScore}/100</span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${
                            c.accessScore >= 60 ? "bg-emerald-400" : c.accessScore >= 40 ? "bg-amber-400" : "bg-red-400"
                          }`} style={{ width: `${c.accessScore}%` }} />
                        </div>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Audit Findings */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-rose-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Auditoria IA — Justiça Distributiva</h2>
            <div className="flex-1" />
            <div className="flex gap-1.5">
              {[
                { count: AUDIT_FINDINGS.filter(a => a.severity === "critical").length, color: "bg-red-500" },
                { count: AUDIT_FINDINGS.filter(a => a.severity === "warning").length, color: "bg-amber-500" },
                { count: AUDIT_FINDINGS.filter(a => a.severity === "pass").length, color: "bg-emerald-500" },
              ].map((b, i) => (
                <span key={i} className={`text-[8px] text-white font-bold px-2 py-0.5 rounded-full ${b.color}`}>{b.count}</span>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {AUDIT_FINDINGS.map(f => {
              const cfg = SEVERITY_CONFIG[f.severity];
              const Icon = cfg.icon;
              return (
                <div key={f.id} className={`p-4 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                  <div className="flex items-start gap-3">
                    <Icon className={`h-4 w-4 ${cfg.color} mt-0.5 shrink-0`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{f.title}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-2">{f.description}</p>
                      <div className="p-2 rounded-lg bg-white/60 dark:bg-slate-900/40">
                        <div className="text-[9px] text-slate-500"><strong>Recomendação IA:</strong> {f.recommendation}</div>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {f.sdg.map(s => (
                          <span key={s} className="text-[7px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Methodology */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">Metodologia — Justiça Climática</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold text-rose-600 mb-1">Índice de Gini Ambiental</div>
              <div className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                G = (2 × Σ(i × y_i)) / (n × Σy_i) - (n+1)/n
              </div>
              <div className="text-[9px] text-slate-400 mt-1">Adaptação do Gini para distribuição de serviços ecossistêmicos. Schlosberg (2007).</div>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold text-purple-600 mb-1">Fair Share Calculation</div>
              <div className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                FS_i = (V_i × A_i × T_i) / Σ(V_j × A_j × T_j) × R_total
              </div>
              <div className="text-[9px] text-slate-400 mt-1">V=vulnerabilidade, A=área, T=tempo de posse. Rawls (1971) + Sen (1999).</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {["Schlosberg (2007)", "Rawls — Theory of Justice", "Sen — Development as Freedom", "ODS/ONU Agenda 2030", "IPCC AR6 WG3 Cap.17", "ReFi Framework"].map(ref => (
              <span key={ref} className="text-[8px] font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-500 border border-slate-200 dark:border-slate-700">{ref}</span>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
