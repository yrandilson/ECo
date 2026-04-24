import { useState, useMemo, useEffect } from "react";
import {
  TreePine, Landmark, Vote, Wallet, Users, Shield, Zap, ArrowUpRight,
  ArrowDownRight, TrendingUp, Clock, CheckCircle2, XCircle, AlertTriangle,
  ChevronDown, ChevronUp, Globe, Leaf, Droplets, Scale, DollarSign,
  Activity, Lock, Unlock, CircleDot, Target, Award, Heart, HandCoins,
  FileCheck, Gavel, Timer, Sprout, Eye,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import MainLayout from "@/components/MainLayout";

// ─── Types ───────────────────────────────────────────────────────────

interface Territory {
  id: string;
  name: string;
  biome: string;
  areaHa: number;
  legalStatus: "active" | "pending" | "proposed";
  treasuryBRL: number;
  carbonCredits: number;
  guardians: number;
  smartContracts: number;
  healthScore: number; // 0-100
  icon: string;
}

interface SmartContract {
  id: string;
  type: "payment" | "reforest" | "patrol" | "research" | "emergency";
  title: string;
  description: string;
  status: "active" | "executed" | "pending" | "failed";
  valueBRL: number;
  beneficiary: string;
  triggerCondition: string;
  executedAt?: string;
  territory: string;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: "voting" | "approved" | "rejected" | "executed";
  votesFor: number;
  votesAgainst: number;
  quorum: number;
  endDate: string;
  category: "funding" | "conservation" | "governance" | "emergency";
}

// ─── Constants ───────────────────────────────────────────────────────

const TERRITORIES: Territory[] = [
  {
    id: "t1", name: "Reserva Serra da Canastra", biome: "Cerrado",
    areaHa: 12500, legalStatus: "active", treasuryBRL: 2847000,
    carbonCredits: 18400, guardians: 47, smartContracts: 12,
    healthScore: 82, icon: "🏔️",
  },
  {
    id: "t2", name: "Mata Ciliar do Rio Verde", biome: "Mata Atlântica",
    areaHa: 3200, legalStatus: "active", treasuryBRL: 945000,
    carbonCredits: 7200, guardians: 23, smartContracts: 8,
    healthScore: 91, icon: "🌊",
  },
  {
    id: "t3", name: "Caatinga do Sertão Central", biome: "Caatinga",
    areaHa: 8700, legalStatus: "pending", treasuryBRL: 423000,
    carbonCredits: 4100, guardians: 31, smartContracts: 5,
    healthScore: 58, icon: "🌵",
  },
  {
    id: "t4", name: "Manguezal Litoral Sul", biome: "Mangue",
    areaHa: 1800, legalStatus: "active", treasuryBRL: 1230000,
    carbonCredits: 9800, guardians: 15, smartContracts: 9,
    healthScore: 76, icon: "🌊",
  },
  {
    id: "t5", name: "Fragmento Urbano Parque Central", biome: "Mata Atlântica",
    areaHa: 450, legalStatus: "proposed", treasuryBRL: 87000,
    carbonCredits: 620, guardians: 8, smartContracts: 2,
    healthScore: 45, icon: "🏡",
  },
];

const SMART_CONTRACTS: SmartContract[] = [
  {
    id: "sc1", type: "payment", title: "Pagamento Mensal — Guardiões",
    description: "Repasse automático para 47 guardiões locais pela vigilância da reserva",
    status: "executed", valueBRL: 94000, beneficiary: "Comunidade Serra da Canastra",
    triggerCondition: "Dia 5 de cada mês + score de patrulha ≥ 70%",
    executedAt: "2026-03-01T10:00:00", territory: "t1",
  },
  {
    id: "sc2", type: "reforest", title: "Plantio de 5.000 mudas nativas",
    description: "Liberação de verba para compra de mudas e pagamento de plantadores",
    status: "active", valueBRL: 35000, beneficiary: "Cooperativa Verde Esperança",
    triggerCondition: "Índice IRAC da zona < 0.4 por 30 dias + aprovação DAO",
    territory: "t1",
  },
  {
    id: "sc3", type: "patrol", title: "Bônus Anti-Desmatamento",
    description: "Pagamento extra quando sensores confirmam 0 alertas de desmate no mês",
    status: "executed", valueBRL: 12000, beneficiary: "Patrulheiros Comunidade Indígena",
    triggerCondition: "0 alertas DETER/INPE no polígono + 30 dias",
    executedAt: "2026-02-28T18:00:00", territory: "t2",
  },
  {
    id: "sc4", type: "emergency", title: "Fundo de Emergência — Incêndio",
    description: "Liberação imediata de recursos para combate a fogo detectado por sensores",
    status: "pending", valueBRL: 50000, beneficiary: "Brigada Municipal de Incêndio",
    triggerCondition: "Detecção de foco de calor FIRMS/NASA + confirmação IRAC > 0.8",
    territory: "t3",
  },
  {
    id: "sc5", type: "research", title: "Bolsa Pesquisa — Bioacústica",
    description: "Pagamento trimestral para pesquisadores monitorando biodiversidade sonora",
    status: "active", valueBRL: 18000, beneficiary: "Lab. Ecoacústica — UFRJ",
    triggerCondition: "Entrega de relatório trimestral + ACI médio computado",
    territory: "t4",
  },
  {
    id: "sc6", type: "payment", title: "Royalties de Carbono — Comunidade",
    description: "Distribuição de 60% dos créditos vendidos para comunidades locais",
    status: "executed", valueBRL: 186000, beneficiary: "Assoc. Moradores Litoral Sul",
    triggerCondition: "Venda de créditos VCS confirmada + split automático 60/40",
    executedAt: "2026-02-15T14:30:00", territory: "t4",
  },
];

const PROPOSALS: Proposal[] = [
  {
    id: "p1", title: "Expandir zona de proteção em 800 ha",
    description: "Incorporar área adjacente de cerrado nativo ao perímetro da DAO",
    proposer: "Sensor IRAC — Alerta Automático", status: "voting",
    votesFor: 34, votesAgainst: 8, quorum: 50, endDate: "2026-03-10",
    category: "conservation",
  },
  {
    id: "p2", title: "Contratar brigada permanente de 10 pessoas",
    description: "Fundo anual de R$ 360.000 para equipe dedicada de vigilância",
    proposer: "Comunidade Serra da Canastra", status: "voting",
    votesFor: 41, votesAgainst: 3, quorum: 50, endDate: "2026-03-07",
    category: "funding",
  },
  {
    id: "p3", title: "Alterar split de carbono para 70/30",
    description: "Aumentar parcela da comunidade de 60% para 70% dos créditos",
    proposer: "Assoc. Moradores Litoral Sul", status: "approved",
    votesFor: 52, votesAgainst: 6, quorum: 50, endDate: "2026-02-28",
    category: "governance",
  },
  {
    id: "p4", title: "Ativar protocolo de emergência hídrica",
    description: "Liberar R$ 25.000 para construção de cisternas na Caatinga",
    proposer: "Sensor — Estresse Hídrico Crítico", status: "executed",
    votesFor: 48, votesAgainst: 1, quorum: 40, endDate: "2026-02-20",
    category: "emergency",
  },
];

const CONTRACT_TYPE_CONFIG = {
  payment: { label: "Pagamento", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20", icon: HandCoins },
  reforest: { label: "Reflorestamento", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/20", icon: Sprout },
  patrol: { label: "Patrulha", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20", icon: Eye },
  research: { label: "Pesquisa", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/20", icon: Activity },
  emergency: { label: "Emergência", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/20", icon: AlertTriangle },
};

const STATUS_CONFIG = {
  active: { label: "Ativo", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/20" },
  executed: { label: "Executado", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" },
  pending: { label: "Pendente", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20" },
  failed: { label: "Falhou", color: "text-red-600 bg-red-50 dark:bg-red-950/20" },
};

const LEGAL_PRECEDENTS = [
  { year: 2008, place: "Equador", desc: "Constituição concede direitos à Pachamama (Natureza)" },
  { year: 2016, place: "Colômbia", desc: "Rio Atrato reconhecido como sujeito de direitos" },
  { year: 2017, place: "Nova Zelândia", desc: "Rio Whanganui recebe personalidade jurídica" },
  { year: 2019, place: "Bangladesh", desc: "Todos os rios recebem status de entidade legal" },
  { year: 2021, place: "Espanha", desc: "Mar Menor reconhecido como pessoa jurídica" },
  { year: 2024, place: "Brasil", desc: "PL 2.119/2021 — Direitos da Natureza em tramitação" },
];

// ─── Main Component ──────────────────────────────────────────────────

export default function NatureDAO() {
  const { data: occurrences } = trpc.occurrences.getRecent.useQuery({ limit: 50 });
  const [selectedTerritory, setSelectedTerritory] = useState<string>("t1");
  const [showAllContracts, setShowAllContracts] = useState(false);

  const territory = TERRITORIES.find(t => t.id === selectedTerritory)!;
  const territoryContracts = SMART_CONTRACTS.filter(c => c.territory === selectedTerritory);
  const displayContracts = showAllContracts ? SMART_CONTRACTS : territoryContracts;

  const totals = useMemo(() => ({
    treasury: TERRITORIES.reduce((s, t) => s + t.treasuryBRL, 0),
    credits: TERRITORIES.reduce((s, t) => s + t.carbonCredits, 0),
    guardians: TERRITORIES.reduce((s, t) => s + t.guardians, 0),
    area: TERRITORIES.reduce((s, t) => s + t.areaHa, 0),
    contracts: SMART_CONTRACTS.length,
    executed: SMART_CONTRACTS.filter(c => c.status === "executed").length,
    totalPaid: SMART_CONTRACTS.filter(c => c.status === "executed").reduce((s, c) => s + c.valueBRL, 0),
  }), []);

  // Simulated live treasury counter
  const [liveCounter, setLiveCounter] = useState(totals.treasury);
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCounter(prev => prev + Math.random() * 15);
    }, 3000);
    return () => clearInterval(interval);
  }, [totals.treasury]);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto pb-12 space-y-6">
        {/* Hero */}
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-amber-700 via-yellow-700 to-orange-700 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <Landmark className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Nature as a DAO</h1>
              <p className="text-amber-100 text-sm">Personalidade Jurídica da Natureza — Governança Descentralizada Autônoma</p>
            </div>
          </div>
          <div className="relative grid grid-cols-4 gap-3 mt-5">
            {[
              { value: `R$ ${(liveCounter / 1e6).toFixed(3)}M`, label: "Treasury total (tempo real)", icon: "🏦" },
              { value: `${(totals.credits / 1000).toFixed(1)}k`, label: "Créditos de carbono", icon: "🌱" },
              { value: totals.guardians, label: "Guardiões ativos", icon: "👥" },
              { value: `${(totals.area / 1000).toFixed(1)}k ha`, label: "Área sob governança", icon: "🗺️" },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-lg font-black text-white">{s.icon} {s.value}</div>
                <div className="text-[10px] text-amber-100 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Territory Select + Details */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Territory List */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Territórios DAO</div>
            <div className="space-y-2">
              {TERRITORIES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTerritory(t.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedTerritory === t.id
                      ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 ring-2 ring-amber-500/20"
                      : "border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{t.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{t.name}</div>
                      <div className="text-[9px] text-slate-400">{t.biome} • {t.areaHa.toLocaleString("pt-BR")} ha</div>
                    </div>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${
                      t.legalStatus === "active" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30" :
                      t.legalStatus === "pending" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30" :
                      "bg-slate-100 text-slate-500 dark:bg-slate-800"
                    }`}>
                      {t.legalStatus === "active" ? "Ativo" : t.legalStatus === "pending" ? "Pendente" : "Proposto"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Territory Dashboard */}
          <div className="md:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{territory.icon}</span>
              <div>
                <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">{territory.name}</h2>
                <div className="text-[10px] text-slate-400">{territory.biome} — Governança Autônoma</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: "Treasury", value: `R$ ${(territory.treasuryBRL / 1000).toFixed(0)}k`, icon: Wallet, color: "text-amber-600" },
                { label: "Créditos CO₂", value: territory.carbonCredits.toLocaleString("pt-BR"), icon: Leaf, color: "text-emerald-600" },
                { label: "Guardiões", value: territory.guardians, icon: Users, color: "text-blue-600" },
                { label: "Contratos", value: territory.smartContracts, icon: FileCheck, color: "text-purple-600" },
              ].map((m, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center">
                  <m.icon className={`h-4 w-4 mx-auto mb-1 ${m.color}`} />
                  <div className="text-sm font-black text-slate-700 dark:text-slate-200">{m.value}</div>
                  <div className="text-[8px] text-slate-400">{m.label}</div>
                </div>
              ))}
            </div>

            {/* Health Score */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-bold text-slate-400">Saúde do Ecossistema (sensores)</span>
                <span className={`text-sm font-black ${
                  territory.healthScore >= 80 ? "text-emerald-600" :
                  territory.healthScore >= 60 ? "text-amber-600" : "text-red-600"
                }`}>{territory.healthScore}/100</span>
              </div>
              <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    territory.healthScore >= 80 ? "bg-emerald-500" :
                    territory.healthScore >= 60 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${territory.healthScore}%` }}
                />
              </div>
              <div className="text-[8px] text-slate-400 mt-1">
                Dados de IRAC + bioacústica + NDVI alimentam smart contracts automaticamente
              </div>
            </div>

            {/* How the DAO works */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/15 border border-amber-200 dark:border-amber-800/40">
              <div className="text-[9px] font-bold text-amber-700 dark:text-amber-400 mb-1">Como a DAO funciona</div>
              <div className="text-[10px] text-amber-600 dark:text-amber-300 leading-relaxed">
                Sensores IoT + IA EcoMonitor coletam dados → Oráculos alimentam Smart Contracts → 
                Pagamentos automáticos para guardiões → Comunidade vota propostas → Natureza é agente econômico
              </div>
            </div>
          </div>
        </div>

        {/* Smart Contracts */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <FileCheck className="h-4 w-4 text-purple-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Smart Contracts Ativos</h2>
            <div className="flex-1" />
            <button
              onClick={() => setShowAllContracts(!showAllContracts)}
              className="text-[10px] font-bold text-purple-500 hover:text-purple-700 transition-colors"
            >
              {showAllContracts ? "Filtrar território" : "Ver todos"}
            </button>
          </div>
          <div className="space-y-3">
            {displayContracts.map(c => {
              const cfg = CONTRACT_TYPE_CONFIG[c.type];
              const st = STATUS_CONFIG[c.status];
              const Icon = cfg.icon;
              return (
                <div key={c.id} className="p-4 rounded-xl border border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${cfg.bg}`}>
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{c.title}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${st.color}`}>{st.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mb-2">{c.description}</p>
                      <div className="flex flex-wrap gap-3 text-[9px]">
                        <span className="text-slate-400">💰 <strong className="text-slate-600 dark:text-slate-300">R$ {c.valueBRL.toLocaleString("pt-BR")}</strong></span>
                        <span className="text-slate-400">👥 <strong className="text-slate-600 dark:text-slate-300">{c.beneficiary}</strong></span>
                      </div>
                      <div className="mt-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-[9px] text-slate-500">
                        <strong className="text-slate-600 dark:text-slate-400">Trigger:</strong> {c.triggerCondition}
                      </div>
                      {c.executedAt && (
                        <div className="text-[8px] text-emerald-500 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Executado em {new Date(c.executedAt).toLocaleDateString("pt-BR")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Governance — Proposals */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Vote className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Propostas de Governança</h2>
            <div className="flex-1" />
            <span className="text-[9px] text-slate-400 font-bold">
              {PROPOSALS.filter(p => p.status === "voting").length} em votação
            </span>
          </div>
          <div className="space-y-3">
            {PROPOSALS.map(p => {
              const totalVotes = p.votesFor + p.votesAgainst;
              const pctFor = totalVotes > 0 ? (p.votesFor / totalVotes) * 100 : 0;
              const quorumReached = totalVotes >= p.quorum;
              return (
                <div key={p.id} className="p-4 rounded-xl border border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                      p.status === "voting" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20" :
                      p.status === "approved" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20" :
                      p.status === "executed" ? "bg-purple-50 text-purple-600 dark:bg-purple-950/20" :
                      "bg-red-50 text-red-600 dark:bg-red-950/20"
                    }`}>
                      {p.status === "voting" ? "⏳ Em Votação" : p.status === "approved" ? "✅ Aprovada" : p.status === "executed" ? "🚀 Executada" : "❌ Rejeitada"}
                    </span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${
                      p.category === "emergency" ? "bg-red-50 text-red-500 dark:bg-red-950/20" :
                      p.category === "funding" ? "bg-amber-50 text-amber-500 dark:bg-amber-950/20" :
                      p.category === "conservation" ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20" :
                      "bg-slate-100 text-slate-500 dark:bg-slate-800"
                    }`}>
                      {p.category === "emergency" ? "Emergência" : p.category === "funding" ? "Financeiro" : p.category === "conservation" ? "Conservação" : "Governança"}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">{p.title}</h3>
                  <p className="text-[10px] text-slate-500 mb-2">{p.description}</p>
                  <div className="text-[9px] text-slate-400 mb-2">Proposto por: <strong>{p.proposer}</strong></div>
                  {/* Vote bar */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold text-emerald-600">✓ {p.votesFor}</span>
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      <div className="h-full bg-emerald-400 transition-all" style={{ width: `${pctFor}%` }} />
                      <div className="h-full bg-red-400 transition-all" style={{ width: `${100 - pctFor}%` }} />
                    </div>
                    <span className="text-[9px] font-bold text-red-600">✗ {p.votesAgainst}</span>
                  </div>
                  <div className="flex items-center justify-between text-[8px] text-slate-400">
                    <span>Quórum: {totalVotes}/{p.quorum} {quorumReached ? "✅" : "⏳"}</span>
                    <span>Encerra: {new Date(p.endDate).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legal Precedents */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Gavel className="h-4 w-4 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400">Precedentes Jurídicos — Direitos da Natureza</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-2">
            {LEGAL_PRECEDENTS.map((lp, i) => (
              <div key={i} className="p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-amber-600">{lp.year}</span>
                  <span className="text-[10px] font-bold text-slate-500">— {lp.place}</span>
                </div>
                <div className="text-[9px] text-slate-600 dark:text-slate-400">{lp.desc}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {["Constituição Equador (2008)", "Sentença T-622 Colômbia", "Te Awa Tupua Act NZ", "PL 2.119/2021 Brasil", "Earth Law Center", "Rights of Nature Tribunal"].map(ref => (
              <span key={ref} className="text-[8px] font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-500 border border-slate-200 dark:border-slate-700">{ref}</span>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
