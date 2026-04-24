import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Bell, BellRing, MapPin, AlertCircle, CheckCircle2, Trash2, Settings,
  Shield, Zap, Clock, Navigation, Eye, EyeOff, Filter, ChevronDown, Volume2,
} from "lucide-react";
import { toast } from "sonner";
import MainLayout from "@/components/MainLayout";

// ─── Config ──────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<string, { label: string; emoji: string; gradient: string; bg: string; border: string; text: string; glow: string }> = {
  critical: { label: "Crítico", emoji: "🔴", gradient: "from-red-500 to-rose-600", bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-300 dark:border-red-700", text: "text-red-700 dark:text-red-300", glow: "shadow-red-500/20" },
  high: { label: "Alto", emoji: "🟠", gradient: "from-orange-500 to-amber-500", bg: "bg-orange-50 dark:bg-orange-950/20", border: "border-orange-300 dark:border-orange-700", text: "text-orange-700 dark:text-orange-300", glow: "shadow-orange-500/20" },
  medium: { label: "Médio", emoji: "🟡", gradient: "from-amber-400 to-yellow-500", bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-300 dark:border-amber-700", text: "text-amber-700 dark:text-amber-300", glow: "shadow-amber-500/20" },
  low: { label: "Baixo", emoji: "🟢", gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-300 dark:border-emerald-700", text: "text-emerald-700 dark:text-emerald-300", glow: "shadow-emerald-500/20" },
};

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  fire: { icon: "🔥", label: "Incêndio", color: "text-red-500" },
  water_pollution: { icon: "💧", label: "Poluição Hídrica", color: "text-blue-500" },
  air_pollution: { icon: "💨", label: "Poluição do Ar", color: "text-purple-500" },
  drought: { icon: "🏜️", label: "Seca", color: "text-amber-500" },
  deforestation: { icon: "🌳", label: "Desmatamento", color: "text-emerald-500" },
  flooding: { icon: "🌊", label: "Enchente", color: "text-cyan-500" },
};

const ALERT_TYPES_TOGGLE = [
  { key: "fire", icon: "🔥", label: "Incêndio", gradient: "from-red-500 to-orange-400" },
  { key: "water_pollution", icon: "💧", label: "Água", gradient: "from-blue-500 to-cyan-400" },
  { key: "air_pollution", icon: "💨", label: "Ar", gradient: "from-purple-500 to-violet-400" },
  { key: "drought", icon: "🏜️", label: "Seca", gradient: "from-amber-500 to-yellow-400" },
  { key: "deforestation", icon: "🌳", label: "Mata", gradient: "from-emerald-500 to-green-400" },
  { key: "flooding", icon: "🌊", label: "Enchente", gradient: "from-cyan-500 to-blue-400" },
];

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
}

// ─── Component ───────────────────────────────────────────────────────

export default function Alerts() {
  const { user, isAuthenticated } = useAuth();
  const [filter, setFilter] = useState<"all" | "unread" | "critical">("all");
  const [showSettings, setShowSettings] = useState(false);
  const [radius, setRadius] = useState(10);
  const [enabledTypes, setEnabledTypes] = useState<string[]>(["fire", "water_pollution", "air_pollution", "drought", "deforestation", "flooding"]);

  // Mock data
  const mockAlerts = [
    {
      id: 1, type: "fire", severity: "critical",
      message: "Incêndio crítico detectado a 2.3 km de sua localização",
      location: "São Paulo, SP", lat: -23.5505, lng: -46.6333,
      distance: 2.3, isRead: false,
      createdAt: new Date(Date.now() - 5 * 60000),
    },
    {
      id: 2, type: "water_pollution", severity: "high",
      message: "Poluição de água detectada no rio próximo",
      location: "Guarulhos, SP", lat: -23.5510, lng: -46.6340,
      distance: 1.5, isRead: false,
      createdAt: new Date(Date.now() - 15 * 60000),
    },
    {
      id: 3, type: "drought", severity: "medium",
      message: "Condições de seca moderada na região",
      location: "Campinas, SP", lat: -23.5500, lng: -46.6330,
      distance: 5.2, isRead: true,
      createdAt: new Date(Date.now() - 60 * 60000),
    },
    {
      id: 4, type: "air_pollution", severity: "high",
      message: "Qualidade do ar comprometida — Índice acima de 150",
      location: "Osasco, SP", lat: -23.5325, lng: -46.7917,
      distance: 8.1, isRead: true,
      createdAt: new Date(Date.now() - 120 * 60000),
    },
    {
      id: 5, type: "flooding", severity: "critical",
      message: "Enchente com risco de deslizamento",
      location: "São Bernardo, SP", lat: -23.6914, lng: -46.5646,
      distance: 3.7, isRead: false,
      createdAt: new Date(Date.now() - 8 * 60000),
    },
  ];

  const handleMarkAsRead = (alertId: number) => {
    toast.success("✅ Alerta marcado como lido");
  };

  const handleDismiss = (alertId: number) => {
    toast.success("🗑️ Alerta removido");
  };

  const toggleType = (key: string) => {
    setEnabledTypes((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
  };

  const filteredAlerts = mockAlerts.filter((alert) => {
    if (filter === "unread") return !alert.isRead;
    if (filter === "critical") return alert.severity === "critical";
    return true;
  });

  const unreadCount = mockAlerts.filter((a) => !a.isRead).length;
  const criticalCount = mockAlerts.filter((a) => a.severity === "critical").length;

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-xl shadow-red-500/25">
              <Bell className="h-8 w-8 text-white" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-semibold">Faça login para ver seus alertas</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-red-50/40 via-white to-orange-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 -m-6 p-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* ──── Hero Header ──── */}
          <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 rounded-3xl p-6 shadow-2xl shadow-red-900/20">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-10 -translate-x-10" />
            <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/5 rounded-full" />

            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                    <BellRing className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-extrabold text-white">Alertas Geoespaciais</h1>
                </div>
                <p className="text-red-100 text-sm ml-[52px]">
                  Notificações de ocorrências críticas perto de você
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                {unreadCount > 0 && (
                  <div className="relative">
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs px-3 py-1.5 font-bold">
                      <BellRing className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
                      {unreadCount} não lido{unreadCount > 1 ? "s" : ""}
                    </Badge>
                  </div>
                )}
                {criticalCount > 0 && (
                  <Badge className="bg-red-900/30 text-white border-red-400/30 backdrop-blur-sm text-xs px-3 py-1.5 font-bold">
                    <Zap className="h-3.5 w-3.5 mr-1.5" />
                    {criticalCount} crítico{criticalCount > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>

            {/* Quick stats */}
            <div className="relative grid grid-cols-3 gap-3 mt-5">
              {[
                { label: "Total", value: mockAlerts.length, icon: Bell },
                { label: "Não Lidos", value: unreadCount, icon: EyeOff },
                { label: "Críticos", value: criticalCount, icon: Shield },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 text-center">
                  <stat.icon className="h-4 w-4 text-white/70 mx-auto mb-1" />
                  <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                  <p className="text-[11px] text-white/70 font-semibold">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ──── Settings Panel ──── */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-gray-800/60 shadow-lg overflow-hidden">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/20">
                  <Settings className="h-4 w-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Configurações de Alertas</p>
                  <p className="text-xs text-gray-500">Raio: {radius} km • {enabledTypes.length} tipos ativos</p>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${showSettings ? "rotate-180" : ""}`} />
            </button>

            {showSettings && (
              <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4 space-y-5">
                {/* Radius slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Raio de Notificação</span>
                    </div>
                    <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-xl">
                      {radius} km
                    </span>
                  </div>
                  <input
                    type="range" min="1" max="50" value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-1">
                    <span>1 km</span><span>25 km</span><span>50 km</span>
                  </div>
                </div>

                {/* Type toggles */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Volume2 className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Tipos de Alerta</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {ALERT_TYPES_TOGGLE.map((type) => {
                      const active = enabledTypes.includes(type.key);
                      return (
                        <button
                          key={type.key}
                          onClick={() => toggleType(type.key)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-200 ${
                            active
                              ? `border-transparent bg-gradient-to-br ${type.gradient} text-white shadow-lg`
                              : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-50 hover:opacity-80"
                          }`}
                        >
                          <span className="text-xl">{type.icon}</span>
                          <span className="text-[10px] font-bold">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  onClick={() => { setShowSettings(false); toast.success("✅ Configurações salvas!"); }}
                  className="w-full h-11 rounded-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-xl shadow-blue-500/20"
                >
                  Salvar Configurações
                </Button>
              </div>
            )}
          </div>

          {/* ──── Filter Tabs ──── */}
          <div className="flex gap-2 p-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm">
            {[
              { key: "all" as const, label: "Todos", count: mockAlerts.length, icon: Bell, color: "text-gray-600 dark:text-gray-300", activeBg: "bg-white dark:bg-gray-700" },
              { key: "unread" as const, label: "Não Lidos", count: unreadCount, icon: EyeOff, color: "text-emerald-600 dark:text-emerald-400", activeBg: "bg-emerald-50 dark:bg-emerald-900/20" },
              { key: "critical" as const, label: "Críticos", count: criticalCount, icon: Zap, color: "text-red-600 dark:text-red-400", activeBg: "bg-red-50 dark:bg-red-900/20" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  filter === tab.key
                    ? `${tab.activeBg} ${tab.color} shadow-md`
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
                <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                  filter === tab.key
                    ? "bg-white/80 dark:bg-gray-800/80"
                    : "bg-gray-100 dark:bg-gray-800"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* ──── Alert Cards ──── */}
          <div className="space-y-3">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert, idx) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  index={idx}
                  onMarkAsRead={handleMarkAsRead}
                  onDismiss={handleDismiss}
                />
              ))
            ) : (
              <EmptyState filter={filter} />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// ─── AlertCard ───────────────────────────────────────────────────────

function AlertCard({ alert, index, onMarkAsRead, onDismiss }: {
  alert: any; index: number; onMarkAsRead: (id: number) => void; onDismiss: (id: number) => void;
}) {
  const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium;
  const typeInfo = TYPE_CONFIG[alert.type] || { icon: "📍", label: "Outro", color: "text-gray-500" };
  const isCritical = alert.severity === "critical";

  return (
    <div
      className={`group relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 ${
        !alert.isRead
          ? `${sev.border} ${sev.glow} shadow-lg`
          : "border-gray-200/60 dark:border-gray-700/60"
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Severity colored left bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${sev.gradient} rounded-l-2xl`} />

      <div className="pl-5 pr-4 py-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="relative flex-shrink-0">
            <div className={`h-12 w-12 rounded-2xl ${sev.bg} flex items-center justify-center text-2xl shadow-sm`}>
              {typeInfo.icon}
            </div>
            {isCritical && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 animate-ping opacity-50" />
            )}
            {isCritical && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-white dark:border-slate-900" />
            )}
            {!alert.isRead && !isCritical && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <h3 className={`text-sm font-bold leading-snug ${!alert.isRead ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>
                {alert.message}
              </h3>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold ${sev.bg} ${sev.text} ${sev.border} border`}>
                  {sev.emoji} {sev.label}
                </span>
                {!alert.isRead && (
                  <span className="px-2 py-1 rounded-xl text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    NOVO
                  </span>
                )}
              </div>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-blue-400" />
                <span className="font-semibold">{alert.location}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/15">
                <Navigation className="h-3 w-3 text-blue-500" />
                <span className="font-bold text-blue-600 dark:text-blue-400">{alert.distance} km</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-semibold">{timeAgo(alert.createdAt)}</span>
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {!alert.isRead && (
                <Button
                  size="sm"
                  onClick={() => onMarkAsRead(alert.id)}
                  className="h-8 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Marcar como Lido
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDismiss(alert.id)}
                className="h-8 px-3 rounded-xl text-xs font-bold border-gray-200 dark:border-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/10"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Remover
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 rounded-xl text-xs font-bold border-gray-200 dark:border-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-900/10"
              >
                <MapPin className="h-3.5 w-3.5 mr-1" />
                Ver no Mapa
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: string }) {
  return (
    <div className="text-center py-16">
      <div className="relative mx-auto mb-6 h-20 w-20">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-400/20 blur-xl" />
        <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
      </div>
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">
        {filter === "unread" ? "Tudo em dia!" : filter === "critical" ? "Sem alertas críticos!" : "Nenhum alerta"}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {filter === "unread"
          ? "Você não tem nenhum alerta não lido no momento"
          : filter === "critical"
          ? "Nenhuma ocorrência crítica registrada — boas notícias! 🎉"
          : "Nenhum alerta para mostrar"}
      </p>
    </div>
  );
}