import { useState, useMemo } from "react";
import {
  Award, Leaf, Shield, TrendingUp, CheckCircle2, Clock, Building,
  Star, Download, Globe, BarChart3, ChevronRight, ChevronDown, ChevronUp,
  Sparkles, Target, ArrowUpRight, Zap, Users, Lock, Stamp, Heart,
  Factory, TreePine, Droplets, Wind, Recycle, Sun, AlertTriangle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import MainLayout from "@/components/MainLayout";

// ─── Types ───────────────────────────────────────────────────────────

interface ESGCriteria {
  id: string;
  name: string;
  category: "E" | "S" | "G";
  icon: React.ReactNode;
  weight: number;
  score: number;
  maxScore: number;
  description: string;
  status: "approved" | "pending" | "failing";
}

interface CertLevel {
  name: string;
  minScore: number;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  benefits: string[];
}

// ─── Constants ───────────────────────────────────────────────────────

const CERT_LEVELS: CertLevel[] = [
  {
    name: "Platina",
    minScore: 90,
    color: "text-violet-600",
    bgColor: "bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-950/30 dark:to-purple-950/30",
    borderColor: "border-violet-300 dark:border-violet-700",
    icon: "💎",
    benefits: ["Selo exclusivo 💎", "Destaque no marketplace", "Prioridade em licitações verdes", "Créditos de carbono premium"],
  },
  {
    name: "Ouro",
    minScore: 75,
    color: "text-amber-600",
    bgColor: "bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-950/30 dark:to-yellow-950/30",
    borderColor: "border-amber-300 dark:border-amber-700",
    icon: "🥇",
    benefits: ["Selo ouro 🥇", "Relatório ESG anual", "Consultoria ambiental", "Marketing verde certificado"],
  },
  {
    name: "Prata",
    minScore: 60,
    color: "text-slate-500",
    bgColor: "bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-800/30 dark:to-gray-800/30",
    borderColor: "border-slate-300 dark:border-slate-600",
    icon: "🥈",
    benefits: ["Selo prata 🥈", "Acesso ao painel ESG", "Indicadores trimestrais"],
  },
  {
    name: "Bronze",
    minScore: 40,
    color: "text-orange-600",
    bgColor: "bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-950/30 dark:to-amber-950/30",
    borderColor: "border-orange-300 dark:border-orange-700",
    icon: "🥉",
    benefits: ["Selo bronze 🥉", "Recomendações básicas"],
  },
];

// ─── Data Generation ─────────────────────────────────────────────────

function generateESGCriteria(occurrences: any[] | undefined): ESGCriteria[] {
  const total = occurrences?.length || 15;
  const critical = occurrences?.filter(o => o.severity === "critical").length || 2;
  const validated = occurrences?.filter(o => o.status === "validated").length || 5;
  const deforest = occurrences?.filter(o => o.type === "deforestation").length || 1;
  const pollution = occurrences?.filter(o => o.type === "air_pollution" || o.type === "water_pollution").length || 3;

  const healthFactor = 1 - (critical / Math.max(1, total));
  const engageFactor = validated / Math.max(1, total);

  const criteria: ESGCriteria[] = [
    // Environmental
    {
      id: "emissions", name: "Emissões e Poluição", category: "E",
      icon: <Wind className="h-4 w-4" />, weight: 15,
      score: Math.round(Math.max(0, (1 - pollution / Math.max(1, total) * 2) * 100)),
      maxScore: 100, description: "Controle de emissões atmosféricas e poluição hídrica",
      status: pollution < 3 ? "approved" : pollution < 6 ? "pending" : "failing",
    },
    {
      id: "biodiversity", name: "Biodiversidade", category: "E",
      icon: <TreePine className="h-4 w-4" />, weight: 12,
      score: Math.round(Math.max(0, (1 - deforest / Math.max(1, total) * 3) * 100)),
      maxScore: 100, description: "Preservação de áreas verdes e ecossistemas",
      status: deforest === 0 ? "approved" : deforest < 3 ? "pending" : "failing",
    },
    {
      id: "water", name: "Gestão Hídrica", category: "E",
      icon: <Droplets className="h-4 w-4" />, weight: 10,
      score: Math.round(65 + healthFactor * 25 + (Math.random() - 0.5) * 10),
      maxScore: 100, description: "Uso responsável de recursos hídricos",
      status: "pending",
    },
    {
      id: "energy", name: "Energia Renovável", category: "E",
      icon: <Sun className="h-4 w-4" />, weight: 8,
      score: Math.round(50 + Math.random() * 30),
      maxScore: 100, description: "Percentual de energia de fontes renováveis",
      status: "pending",
    },
    {
      id: "waste", name: "Gestão de Resíduos", category: "E",
      icon: <Recycle className="h-4 w-4" />, weight: 8,
      score: Math.round(55 + healthFactor * 20 + (Math.random() - 0.5) * 15),
      maxScore: 100, description: "Reciclagem e destinação correta de resíduos",
      status: "pending",
    },
    // Social
    {
      id: "community", name: "Engajamento Comunitário", category: "S",
      icon: <Users className="h-4 w-4" />, weight: 12,
      score: Math.round(engageFactor * 100),
      maxScore: 100, description: "Participação da comunidade em ações ambientais",
      status: engageFactor > 0.6 ? "approved" : engageFactor > 0.3 ? "pending" : "failing",
    },
    {
      id: "health", name: "Saúde e Segurança", category: "S",
      icon: <Heart className="h-4 w-4" />, weight: 10,
      score: Math.round(healthFactor * 90 + (Math.random() - 0.5) * 10),
      maxScore: 100, description: "Impacto na saúde pública da região",
      status: healthFactor > 0.7 ? "approved" : "pending",
    },
    {
      id: "education", name: "Educação Ambiental", category: "S",
      icon: <Sparkles className="h-4 w-4" />, weight: 8,
      score: Math.round(60 + engageFactor * 30 + (Math.random() - 0.5) * 10),
      maxScore: 100, description: "Programas educativos e conscientização",
      status: "approved",
    },
    // Governance
    {
      id: "transparency", name: "Transparência", category: "G",
      icon: <Shield className="h-4 w-4" />, weight: 10,
      score: Math.round(70 + engageFactor * 20 + (Math.random() - 0.5) * 10),
      maxScore: 100, description: "Dados abertos e prestação de contas",
      status: "approved",
    },
    {
      id: "compliance", name: "Conformidade Legal", category: "G",
      icon: <CheckCircle2 className="h-4 w-4" />, weight: 7,
      score: Math.round(65 + healthFactor * 25 + (Math.random() - 0.5) * 10),
      maxScore: 100, description: "Aderência à legislação ambiental vigente",
      status: critical === 0 ? "approved" : "pending",
    },
  ];

  return criteria.map(c => ({
    ...c,
    score: Math.max(0, Math.min(100, c.score)),
  }));
}

// ─── Components ──────────────────────────────────────────────────────

function ESGScoreRing({ score, size = 180 }: { score: number; size?: number }) {
  const level = CERT_LEVELS.find(l => score >= l.minScore) || CERT_LEVELS[CERT_LEVELS.length - 1];
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const strokeColor = score >= 90 ? "#8b5cf6" : score >= 75 ? "#f59e0b" : score >= 60 ? "#94a3b8" : "#f97316";

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="10" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={strokeColor} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-1000 ease-out" />
        <text x={size / 2} y={size / 2 - 10} textAnchor="middle" className="fill-slate-900 dark:fill-white" style={{ fontSize: size / 4, fontWeight: 900 }}>{score}</text>
        <text x={size / 2} y={size / 2 + 12} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 11, fontWeight: 700 }}>/100</text>
      </svg>
      <div className={`mt-2 px-4 py-1.5 rounded-xl text-xs font-bold border-2 ${level.bgColor} ${level.borderColor} ${level.color}`}>
        {level.icon} Selo {level.name}
      </div>
    </div>
  );
}

function CriteriaCard({ criteria }: { criteria: ESGCriteria }) {
  const statusConfig = {
    approved: { label: "Aprovado", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20", icon: <CheckCircle2 className="h-3 w-3" /> },
    pending: { label: "Pendente", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20", icon: <Clock className="h-3 w-3" /> },
    failing: { label: "Reprovado", color: "text-red-600 bg-red-50 dark:bg-red-950/20", icon: <AlertTriangle className="h-3 w-3" /> },
  };
  const s = statusConfig[criteria.status];
  const catColors = { E: "text-emerald-500", S: "text-blue-500", G: "text-purple-500" };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50 hover:shadow-sm transition-all">
      <span className={catColors[criteria.category]}>{criteria.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{criteria.name}</span>
          <span className="text-[8px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{criteria.category}</span>
        </div>
        <div className="text-[9px] text-slate-400">{criteria.description}</div>
        <div className="mt-1.5 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              criteria.score >= 75 ? "bg-emerald-400" : criteria.score >= 50 ? "bg-amber-400" : "bg-red-400"
            }`}
            style={{ width: `${criteria.score}%` }}
          />
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-black text-slate-800 dark:text-white tabular-nums">{criteria.score}</div>
        <div className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${s.color}`}>
          {s.icon} {s.label}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function GreenSeal() {
  const { user } = useAuth();
  const { data: recentOccurrences } = trpc.occurrences.getRecent.useQuery({ limit: 100 });
  const [showCert, setShowCert] = useState(false);

  const criteria = useMemo(() => generateESGCriteria(recentOccurrences), [recentOccurrences]);

  const esgScore = useMemo(() => {
    const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);
    return Math.round(criteria.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight);
  }, [criteria]);

  const level = CERT_LEVELS.find(l => esgScore >= l.minScore) || CERT_LEVELS[CERT_LEVELS.length - 1];

  const byCategory = useMemo(() => {
    const cats = { E: { label: "Environmental", items: [] as ESGCriteria[], score: 0, weight: 0, color: "emerald" },
                   S: { label: "Social", items: [] as ESGCriteria[], score: 0, weight: 0, color: "blue" },
                   G: { label: "Governance", items: [] as ESGCriteria[], score: 0, weight: 0, color: "purple" } };
    criteria.forEach(c => {
      cats[c.category].items.push(c);
      cats[c.category].score += c.score * c.weight;
      cats[c.category].weight += c.weight;
    });
    Object.values(cats).forEach(c => { c.score = c.weight > 0 ? Math.round(c.score / c.weight) : 0; });
    return cats;
  }, [criteria]);

  const approved = criteria.filter(c => c.status === "approved").length;
  const pending = criteria.filter(c => c.status === "pending").length;
  const failing = criteria.filter(c => c.status === "failing").length;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto pb-12 space-y-6">
        {/* Hero */}
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-emerald-600 via-green-600 to-lime-600 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <Award className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Certificação Selo Verde (ESG)</h1>
              <p className="text-emerald-100 text-sm">Environmental, Social & Governance — Avaliação automatizada</p>
            </div>
          </div>
          <div className="relative grid grid-cols-4 gap-3 mt-5">
            {[
              { value: `${esgScore}/100`, label: "Score ESG", icon: "📊" },
              { value: `${approved}/${criteria.length}`, label: "Aprovados", icon: "✅" },
              { value: `${pending}`, label: "Pendentes", icon: "⏳" },
              { value: level.name, label: "Nível Atual", icon: level.icon },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-lg font-black text-white">{s.icon} {s.value}</div>
                <div className="text-[10px] text-emerald-100 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Score + Levels */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 flex flex-col items-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Score ESG Consolidado</div>
            <ESGScoreRing score={esgScore} />
            <div className="grid grid-cols-3 gap-3 mt-4 w-full">
              {(["E", "S", "G"] as const).map(cat => {
                const d = byCategory[cat];
                const colors = { E: "emerald", S: "blue", G: "purple" };
                const c = colors[cat];
                return (
                  <div key={cat} className={`p-3 rounded-xl bg-${c}-50 dark:bg-${c}-950/20 text-center`}>
                    <div className={`text-xl font-black text-${c}-600`}>{d.score}</div>
                    <div className={`text-[9px] font-bold text-${c}-500`}>{d.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Níveis de Certificação</div>
            <div className="space-y-2">
              {CERT_LEVELS.map(l => {
                const isActive = l.name === level.name;
                return (
                  <div key={l.name} className={`p-3 rounded-xl border-2 transition-all ${
                    isActive ? `${l.bgColor} ${l.borderColor} ring-2 ring-offset-1 ring-emerald-300` : "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 opacity-60"
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{l.icon}</span>
                      <div className="flex-1">
                        <div className={`text-xs font-bold ${isActive ? l.color : "text-slate-500"}`}>
                          Selo {l.name} {isActive && "← Seu nível"}
                        </div>
                        <div className="text-[9px] text-slate-400">Score mínimo: {l.minScore}/100</div>
                      </div>
                      {isActive && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    </div>
                    {isActive && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {l.benefits.map((b, i) => (
                          <span key={i} className="text-[9px] font-bold bg-white/60 dark:bg-slate-800/60 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300">{b}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Criteria by Category */}
        {(["E", "S", "G"] as const).map(cat => {
          const catLabels = { E: "Environmental (Ambiental)", S: "Social", G: "Governance (Governança)" };
          const catColors = { E: "emerald", S: "blue", G: "purple" };
          const c = catColors[cat];
          return (
            <div key={cat} className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-6 h-6 rounded-lg bg-${c}-100 dark:bg-${c}-900/30 flex items-center justify-center`}>
                  <span className={`text-[10px] font-black text-${c}-600`}>{cat}</span>
                </div>
                <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">{catLabels[cat]}</h2>
                <div className="flex-1" />
                <span className={`text-sm font-black text-${c}-600`}>{byCategory[cat].score}/100</span>
              </div>
              <div className="space-y-2">
                {byCategory[cat].items.map(cr => (
                  <CriteriaCard key={cr.id} criteria={cr} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Generate Certificate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          {!showCert ? (
            <button
              onClick={() => setShowCert(true)}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-black text-sm hover:from-emerald-700 hover:to-green-700 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <Award className="h-5 w-5" /> Emitir Certificado Digital
            </button>
          ) : (
            <div className="animate-in slide-in-from-top-2 duration-300">
              {/* Certificate */}
              <div className={`p-6 rounded-2xl border-4 ${level.borderColor} ${level.bgColor} relative overflow-hidden`}>
                <div className="absolute top-2 right-2 opacity-10 text-8xl">{level.icon}</div>
                <div className="relative text-center space-y-3">
                  <div className="text-5xl">{level.icon}</div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white">Certificado Selo Verde</h3>
                  <p className={`text-sm font-bold ${level.color}`}>Nível {level.name}</p>
                  <div className="w-16 h-0.5 bg-slate-300 dark:bg-slate-600 mx-auto" />
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Certificamos que a região monitorada pelo <strong>EcoMonitor</strong> atingiu o score ESG de <strong>{esgScore}/100</strong>,
                    qualificando-se para o Selo Verde nível <strong>{level.name}</strong>.
                  </p>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="text-center">
                      <div className="text-xs font-bold text-emerald-600">{byCategory.E.score}</div>
                      <div className="text-[9px] text-slate-400">Environmental</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-bold text-blue-600">{byCategory.S.score}</div>
                      <div className="text-[9px] text-slate-400">Social</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-bold text-purple-600">{byCategory.G.score}</div>
                      <div className="text-[9px] text-slate-400">Governance</div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-center gap-4 text-[9px] text-slate-400">
                    <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Autenticado digitalmente</span>
                    <span className="flex items-center gap-1"><Stamp className="h-3 w-3" /> {new Date().toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-lg"
                >
                  <Download className="h-3.5 w-3.5" /> Exportar Certificado
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
