import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";
import {
  Trophy, Star, TrendingUp, Users, AlertCircle, Zap, Shield, Award,
  MapPin, Flame, Droplets, Wind, TreePine, CloudRain, HelpCircle,
  ChevronRight, ArrowUpRight, Sparkles, Eye, Clock, Target, Globe,
} from "lucide-react";
import { Link, Redirect } from "wouter";
import MainLayout from "@/components/MainLayout";
import RealtimeIndicator from "@/components/RealtimeIndicator";
import IracGauge from "@/components/IracGauge";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useState, useCallback, useMemo } from "react";

// ─── Config ──────────────────────────────────────────────────────────

const BADGE_INFO: Record<string, { icon: string; gradient: string; description: string }> = {
  fire_watcher: { icon: "🔥", gradient: "from-red-500 to-orange-500", description: "Vigilante do Fogo" },
  water_guardian: { icon: "💧", gradient: "from-blue-500 to-cyan-500", description: "Guardião da Água" },
  verifier: { icon: "✓", gradient: "from-emerald-500 to-green-500", description: "Verificador" },
  student: { icon: "📚", gradient: "from-amber-500 to-yellow-500", description: "Estudante" },
  star: { icon: "⭐", gradient: "from-purple-500 to-violet-500", description: "Estrela" },
  environmental_hero: { icon: "🦸", gradient: "from-orange-500 to-rose-500", description: "Herói Ambiental" },
};

const TYPE_ICONS: Record<string, string> = {
  fire: "🔥", water_pollution: "💧", air_pollution: "💨",
  drought: "🏜️", deforestation: "🌳", flooding: "🌊", other: "⚠️",
};

const CHART_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316"];

const MEDAL_COLORS = [
  "from-amber-400 to-yellow-500",   // 1st - gold
  "from-slate-300 to-gray-400",     // 2nd - silver
  "from-orange-400 to-amber-600",   // 3rd - bronze
];

// ─── Custom Tooltip ──────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl px-3 py-2 rounded-xl shadow-xl border border-slate-200/60 dark:border-white/10">
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 capitalize">{label || payload[0]?.name}</p>
      <p className="text-sm font-bold text-emerald-600">{payload[0]?.value}</p>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const { data: topRankings } = trpc.gamification.getTopRankings.useQuery({ limit: 10 });
  const { data: monthlyRankings } = trpc.gamification.getMonthlyRankings.useQuery({ limit: 10 });
  const { data: userBadges } = trpc.gamification.getUserBadges.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user }
  );
  const { data: recentOccurrences } = trpc.occurrences.getRecent.useQuery({ limit: 50 });

  // ── WebSocket ──
  const [realtimeEvents, setRealtimeEvents] = useState<Array<{ type: string; payload: any; time: string }>>([]);
  const utils = trpc.useUtils();

  const handleNewOccurrence = useCallback((payload: any) => {
    setRealtimeEvents((prev) => [
      { type: "NEW_OCCURRENCE", payload, time: new Date().toLocaleTimeString("pt-BR") },
      ...prev.slice(0, 9),
    ]);
    utils.occurrences.getRecent.invalidate();
    utils.occurrences.getStats.invalidate();
  }, [utils]);

  const { connected, connectedClients } = useWebSocket({
    showToasts: true,
    onNewOccurrence: handleNewOccurrence,
  });

  // ── IRAC ──
  const { data: iracData, isLoading: iracLoading } = trpc.irac.calculate.useQuery({
    temperature: 28, humidity: 55, windSpeed: 12,
    latitude: -23.55, longitude: -46.63,
  });

  if (isAuthenticated && user?.role === "admin") {
    return <Redirect to="/admin" />;
  }

  // ── Chart data ──
  const occurrencesByType = useMemo(() =>
    recentOccurrences
      ? Object.entries(
          recentOccurrences.reduce((acc: Record<string, number>, occ) => {
            acc[occ.type] = (acc[occ.type] || 0) + 1;
            return acc;
          }, {})
        ).map(([type, count]) => ({
          name: type.replace(/_/g, " "),
          value: count,
          icon: TYPE_ICONS[type] || "📍",
        }))
      : [],
    [recentOccurrences]
  );

  const occurrencesBySeverity = useMemo(() =>
    recentOccurrences
      ? Object.entries(
          recentOccurrences.reduce((acc: Record<string, number>, occ) => {
            acc[occ.severity] = (acc[occ.severity] || 0) + 1;
            return acc;
          }, {})
        ).map(([severity, count]) => ({
          name: severity === "critical" ? "Crítica" : severity === "high" ? "Alta" : severity === "medium" ? "Média" : "Baixa",
          value: count,
          fill: severity === "critical" ? "#ef4444" : severity === "high" ? "#f97316" : severity === "medium" ? "#f59e0b" : "#10b981",
        }))
      : [],
    [recentOccurrences]
  );

  const criticalCount = recentOccurrences?.filter(o => o.severity === "critical").length || 0;
  const validatedCount = recentOccurrences?.filter(o => o.status === "validated").length || 0;
  const trustScore = Number(user?.trustScore) || 0;

  // ── Stat cards config ──
  const stats = [
    {
      label: "Pontos Totais",
      value: user?.points || 0,
      sub: "+10 ocorrência · +5 validação",
      icon: Sparkles,
      gradient: "from-emerald-500 to-teal-500",
      shadow: "shadow-emerald-500/20",
    },
    {
      label: "Confiança",
      value: trustScore.toFixed(1),
      sub: "Score de confiabilidade",
      icon: Shield,
      gradient: "from-blue-500 to-indigo-500",
      shadow: "shadow-blue-500/20",
    },
    {
      label: "Conquistas",
      value: userBadges?.length || 0,
      sub: "Badges desbloqueados",
      icon: Award,
      gradient: "from-purple-500 to-violet-500",
      shadow: "shadow-purple-500/20",
    },
    {
      label: "Ocorrências",
      value: recentOccurrences?.length || 0,
      sub: `${criticalCount} críticas · ${validatedCount} validadas`,
      icon: Target,
      gradient: "from-orange-500 to-rose-500",
      shadow: "shadow-orange-500/20",
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-[52px]">
              Olá, <span className="font-semibold text-slate-700 dark:text-slate-200">{user?.name}</span>! Aqui está seu resumo.
            </p>
          </div>
          <RealtimeIndicator connected={connected} connectedClients={connectedClients} />
        </div>

        {/* ─── Stats Grid ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="group relative bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-white/5 p-4 hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                {/* Subtle gradient bg on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity`} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${s.gradient} shadow-md ${s.shadow}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {s.value}
                  </div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{s.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Charts Row ─── */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Pie Chart - Por Tipo */}
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-white/5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Eye className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Por Tipo</h3>
            </div>
            {occurrencesByType.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie
                      data={occurrencesByType}
                      cx="50%" cy="50%"
                      innerRadius={45} outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {occurrencesByType.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {occurrencesByType.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-slate-600 dark:text-slate-300 capitalize truncate flex-1">{entry.icon} {entry.name}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-slate-400 text-xs">Sem dados</div>
            )}
          </div>

          {/* Bar Chart - Por Severidade */}
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-white/5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <AlertCircle className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Por Severidade</h3>
            </div>
            {occurrencesBySeverity.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={occurrencesBySeverity} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={30} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {occurrencesBySeverity.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-slate-400 text-xs">Sem dados</div>
            )}
          </div>
        </div>

        {/* ─── IEM + IRAC + Real-time Feed ─── */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* IEM Mini + IRAC */}
          <div className="space-y-4">
            {/* IEM Widget */}
            <Link href="/iem">
              <div className="group bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-4 cursor-pointer hover:shadow-xl hover:shadow-emerald-500/15 transition-all duration-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white/20">
                        <Globe className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="text-xs font-bold text-white/80">Índice IEM</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/40 group-hover:text-white/80 transition-colors" />
                  </div>
                  <div className="text-3xl font-black text-white tabular-nums">
                    {(() => {
                      const total = recentOccurrences?.length || 1;
                      const critical = recentOccurrences?.filter(o => o.severity === "critical").length || 0;
                      const validated = recentOccurrences?.filter(o => o.status === "validated").length || 0;
                      const degradation = (critical / total) * 30 + ((total - validated) / total) * 20 + 12;
                      const engFactor = 0.8 + (validated / total) * 0.4;
                      return Math.max(0, Math.min(100, 100 - degradation * engFactor)).toFixed(0);
                    })()}
                    <span className="text-lg text-white/50 font-bold">/100</span>
                  </div>
                  <p className="text-[10px] text-white/60 mt-1">Saúde ambiental da cidade</p>
                </div>
              </div>
            </Link>
            {/* IRAC */}
            <IracGauge data={iracData} loading={iracLoading} />
          </div>

          {/* Feed Tempo Real */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-white/5 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-white/5">
              <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                <Zap className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex-1">Feed em Tempo Real</h3>
              {connected && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              )}
            </div>
            <div className="p-4">
              {realtimeEvents.length === 0 ? (
                <div className="text-center py-10">
                  <div className="inline-flex p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 mb-3">
                    <Zap className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-xs text-slate-400">Aguardando eventos em tempo real...</p>
                  <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">Novas ocorrências aparecerão aqui instantaneamente</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin">
                  {realtimeEvents.map((event, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-xl text-sm transition-all ${
                        idx === 0
                          ? "bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200/60 dark:border-emerald-800/30"
                          : "bg-slate-50 dark:bg-slate-800/40"
                      }`}
                    >
                      <span className="text-base flex-shrink-0">
                        {TYPE_ICONS[event.payload?.type] || "📍"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs text-slate-700 dark:text-slate-200 truncate">
                          {event.payload?.type?.replace(/_/g, " ")}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {event.payload?.userName || "anônimo"} · {event.time}
                        </p>
                      </div>
                      {event.payload?.severity && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          event.payload.severity === "critical"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                        }`}>
                          {event.payload.severity}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Rankings Row ─── */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Global */}
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-white/5 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-white/5">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Trophy className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Global</h3>
            </div>
            <div className="p-3 space-y-1">
              {topRankings?.slice(0, 5).map((rank, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                    idx < 3 ? "hover:bg-slate-50 dark:hover:bg-slate-800/50" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  {idx < 3 ? (
                    <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${MEDAL_COLORS[idx]} flex items-center justify-center shadow-sm`}>
                      <span className="text-xs font-black text-white">{idx + 1}</span>
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <span className="text-xs font-bold text-slate-400">{idx + 1}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                      Usuário #{rank.userId}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {rank.totalPoints} pts
                  </span>
                </div>
              ))}
              {(!topRankings || topRankings.length === 0) && (
                <p className="text-xs text-slate-400 text-center py-4">Sem dados de ranking</p>
              )}
            </div>
          </div>

          {/* Mensal */}
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-white/5 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-white/5">
              <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <Star className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Mensal</h3>
            </div>
            <div className="p-3 space-y-1">
              {monthlyRankings?.slice(0, 5).map((rank, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {idx < 3 ? (
                    <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${MEDAL_COLORS[idx]} flex items-center justify-center shadow-sm`}>
                      <span className="text-xs font-black text-white">{idx + 1}</span>
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <span className="text-xs font-bold text-slate-400">{idx + 1}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                      Usuário #{rank.userId}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400 tabular-nums">
                    {rank.monthlyPoints} pts
                  </span>
                </div>
              ))}
              {(!monthlyRankings || monthlyRankings.length === 0) && (
                <p className="text-xs text-slate-400 text-center py-4">Sem dados de ranking</p>
              )}
            </div>
          </div>
        </div>

        {/* ─── Badges ─── */}
        {userBadges && userBadges.length > 0 && (
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-white/5 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-white/5">
              <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Award className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Suas Conquistas</h3>
              <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {userBadges.length}
              </span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {userBadges.map((badge, idx) => {
                  const info = BADGE_INFO[badge.badgeType];
                  return (
                    <div
                      key={idx}
                      className="group relative text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:shadow-md transition-all duration-200 cursor-default"
                    >
                      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${info?.gradient || "from-slate-400 to-slate-500"} opacity-0 group-hover:opacity-10 transition-opacity`} />
                      <div className="text-3xl mb-1.5">{info?.icon || "🏅"}</div>
                      <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight">
                        {info?.description || badge.badgeType}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── Quick Actions ─── */}
        <div className="grid grid-cols-3 gap-3">
          <Link href="/report">
            <div className="group bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-4 cursor-pointer hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-200 hover:-translate-y-0.5">
              <AlertCircle className="h-5 w-5 text-white/80 mb-2 group-hover:text-white transition-colors" />
              <p className="text-sm font-bold text-white">Reportar</p>
              <p className="text-[10px] text-white/60">Nova ocorrência</p>
            </div>
          </Link>
          <Link href="/map">
            <div className="group bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl p-4 cursor-pointer hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5">
              <MapPin className="h-5 w-5 text-white/80 mb-2 group-hover:text-white transition-colors" />
              <p className="text-sm font-bold text-white">Mapa</p>
              <p className="text-[10px] text-white/60">Ver ocorrências</p>
            </div>
          </Link>
          <Link href="/simulators">
            <div className="group bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl p-4 cursor-pointer hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-200 hover:-translate-y-0.5">
              <Zap className="h-5 w-5 text-white/80 mb-2 group-hover:text-white transition-colors" />
              <p className="text-sm font-bold text-white">Simuladores</p>
              <p className="text-[10px] text-white/60">Cenários ambientais</p>
            </div>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
