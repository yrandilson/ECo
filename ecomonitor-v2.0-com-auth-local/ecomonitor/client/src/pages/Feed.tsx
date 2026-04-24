import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  MapPin,
  Calendar,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Flame,
  Droplets,
  Wind,
  TreePine,
  CloudRain,
  Sun as SunIcon,
  HelpCircle,
  Eye,
  Users,
  Award,
  Share2,
  Bookmark,
  BookmarkCheck,
  Copy,
  Heart,
  Zap,
  Shield,
  Star,
  ArrowUp,
  Navigation,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Megaphone,
  Target,
  Trophy,
  Verified,
} from "lucide-react";
import { toast } from "sonner";

import MainLayout from "@/components/MainLayout";

// ─── Config ──────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string; gradient: string; bg: string }> = {
  fire: { icon: "🔥", label: "Incêndio", color: "text-red-500", gradient: "from-red-500 to-orange-500", bg: "bg-red-50 dark:bg-red-950/20" },
  water_pollution: { icon: "💧", label: "Poluição Hídrica", color: "text-blue-500", gradient: "from-blue-500 to-cyan-500", bg: "bg-blue-50 dark:bg-blue-950/20" },
  air_pollution: { icon: "💨", label: "Poluição do Ar", color: "text-purple-500", gradient: "from-purple-500 to-violet-500", bg: "bg-purple-50 dark:bg-purple-950/20" },
  drought: { icon: "🏜️", label: "Seca", color: "text-amber-500", gradient: "from-amber-500 to-yellow-500", bg: "bg-amber-50 dark:bg-amber-950/20" },
  deforestation: { icon: "🌳", label: "Desmatamento", color: "text-emerald-500", gradient: "from-emerald-500 to-green-500", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
  flooding: { icon: "🌊", label: "Enchente", color: "text-cyan-500", gradient: "from-cyan-500 to-blue-500", bg: "bg-cyan-50 dark:bg-cyan-950/20" },
  other: { icon: "⚠️", label: "Outro", color: "text-slate-500", gradient: "from-slate-500 to-gray-500", bg: "bg-slate-50 dark:bg-slate-950/20" },
};

const SEVERITY_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string; ring: string; emoji: string }> = {
  critical: { label: "Crítica", dot: "bg-red-500", bg: "bg-red-50 dark:bg-red-950/20", text: "text-red-700 dark:text-red-300", ring: "ring-red-500/20", emoji: "🔴" },
  high: { label: "Alta", dot: "bg-orange-500", bg: "bg-orange-50 dark:bg-orange-950/20", text: "text-orange-700 dark:text-orange-300", ring: "ring-orange-500/20", emoji: "🟠" },
  medium: { label: "Média", dot: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-700 dark:text-amber-300", ring: "ring-amber-500/20", emoji: "🟡" },
  low: { label: "Baixa", dot: "bg-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20", text: "text-blue-700 dark:text-blue-300", ring: "ring-blue-500/20", emoji: "🔵" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  validated: { label: "Validada", icon: CheckCircle2, color: "text-emerald-500" },
  rejected: { label: "Rejeitada", icon: XCircle, color: "text-red-500" },
  pending: { label: "Pendente", icon: Clock, color: "text-amber-500" },
};

// Mock photos by type
const MOCK_PHOTOS: Record<string, string[]> = {
  fire: [
    "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1602980360498-73e6e8e98d44?w=600&h=400&fit=crop",
  ],
  water_pollution: [
    "https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=600&h=400&fit=crop",
  ],
  air_pollution: [
    "https://images.unsplash.com/photo-1532511472002-bb1de283c1a4?w=600&h=400&fit=crop",
  ],
  deforestation: [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop",
  ],
  flooding: [
    "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&h=400&fit=crop",
  ],
  drought: [
    "https://images.unsplash.com/photo-1504279577054-acfeccf8fc52?w=600&h=400&fit=crop",
  ],
  other: [],
};

const USER_NAMES = [
  "Ana Silva", "Carlos Oliveira", "Mariana Santos", "Pedro Costa", "Juliana Lima",
  "Rafael Pereira", "Fernanda Souza", "Lucas Rodrigues", "Camila Almeida", "Thiago Ferreira",
  "Beatriz Gomes", "Gabriel Martins", "Isabela Ribeiro", "Mateus Carvalho", "Larissa Araújo",
];

const USER_LEVELS = [
  { min: 0, title: "Observador", icon: "👁️", color: "text-slate-500" },
  { min: 3, title: "Eco Guardião", icon: "🛡️", color: "text-blue-500" },
  { min: 8, title: "Sentinela", icon: "⚡", color: "text-purple-500" },
  { min: 15, title: "Protetor", icon: "🌿", color: "text-emerald-500" },
  { min: 25, title: "Lenda Ambiental", icon: "🏆", color: "text-amber-500" },
];

const REACTION_TYPES = [
  { emoji: "😨", label: "Preocupante", key: "worried" },
  { emoji: "🙏", label: "Solidariedade", key: "solidarity" },
  { emoji: "💪", label: "Vamos resolver", key: "resolve" },
  { emoji: "📢", label: "Atenção!", key: "attention" },
  { emoji: "❤️", label: "Apoio", key: "support" },
];

const TAGS_BY_TYPE: Record<string, string[]> = {
  fire: ["#queimada", "#incêndio", "#mata", "#urgente"],
  water_pollution: ["#rio", "#água", "#poluição", "#esgoto"],
  air_pollution: ["#ar", "#fumaça", "#indústria", "#saúde"],
  deforestation: ["#desmatamento", "#floresta", "#fauna", "#ilegal"],
  flooding: ["#enchente", "#chuva", "#alagamento", "#risco"],
  drought: ["#seca", "#água", "#estiagem", "#emergência"],
  other: ["#ambiente", "#denúncia"],
};

type FeedTab = "recent" | "trending" | "urgent" | "nearby";

// ─── Helpers ─────────────────────────────────────────────────────────

function getUserName(userId: number) {
  return USER_NAMES[userId % USER_NAMES.length];
}

function getUserLevel(userId: number) {
  const mockContributions = (userId * 7 + 3) % 30;
  const level = [...USER_LEVELS].reverse().find(l => mockContributions >= l.min) || USER_LEVELS[0];
  return level;
}

function getUserInitials(userId: number) {
  const name = getUserName(userId);
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
}

function formatTimeAgo(date: string | Date) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffH < 24) return `há ${diffH}h`;
  if (diffD === 1) return "ontem";
  if (diffD < 7) return `há ${diffD} dias`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function formatAddress(lat: number, lng: number) {
  // Simplified reverse geocoding mock based on coordinates
  const zones = [
    { lat: -23.55, lng: -46.63, name: "Vila Mariana, SP" },
    { lat: -22.90, lng: -43.17, name: "Centro, RJ" },
    { lat: -19.92, lng: -43.93, name: "Savassi, BH" },
    { lat: -15.79, lng: -47.88, name: "Asa Norte, BSB" },
    { lat: -3.71, lng: -38.52, name: "Aldeota, Fortaleza" },
    { lat: -12.97, lng: -38.51, name: "Barra, Salvador" },
    { lat: -8.05, lng: -34.87, name: "Boa Viagem, Recife" },
    { lat: -25.42, lng: -49.27, name: "Centro, Curitiba" },
    { lat: -30.03, lng: -51.22, name: "Moinhos, POA" },
  ];
  
  let closest = zones[0];
  let minDist = Infinity;
  for (const z of zones) {
    const d = Math.sqrt((lat - z.lat) ** 2 + (lng - z.lng) ** 2);
    if (d < minDist) { minDist = d; closest = z; }
  }
  
  if (minDist < 2) return closest.name;
  return `${Math.abs(lat).toFixed(2)}°${lat < 0 ? "S" : "N"}, ${Math.abs(lng).toFixed(2)}°${lng < 0 ? "W" : "E"}`;
}

function getTimelineSteps(occurrence: any) {
  const steps = [
    { icon: "📝", label: "Reportado", done: true, time: formatTimeAgo(occurrence.createdAt) },
  ];
  
  const validations = (occurrence.communityValidations || 0);
  const rejections = (occurrence.communityRejections || 0);
  
  if (validations > 0 || rejections > 0) {
    steps.push({ icon: "👥", label: `${validations} confirmações`, done: true, time: "" });
  }
  
  if (occurrence.status === "validated") {
    steps.push({ icon: "✅", label: "Validado", done: true, time: "" });
    steps.push({ icon: "🏛️", label: "Enviado a órgãos", done: false, time: "" });
  } else if (occurrence.status === "rejected") {
    steps.push({ icon: "❌", label: "Rejeitado", done: true, time: "" });
  } else {
    steps.push({ icon: "🔄", label: "Em análise", done: false, time: "" });
  }
  
  return steps;
}

// ─── Components ──────────────────────────────────────────────────────

function PhotoCarousel({ type, occurrenceId }: { type: string; occurrenceId: number }) {
  const [current, setCurrent] = useState(0);
  const photos = MOCK_PHOTOS[type] || [];
  
  if (photos.length === 0) return null;
  
  return (
    <div className="relative mt-3 rounded-xl overflow-hidden group/photo">
      <img
        src={photos[current]}
        alt="Evidência"
        className="w-full h-48 object-cover transition-transform duration-500"
        loading="lazy"
      />
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      
      {/* Photo counter */}
      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold">
        <ImageIcon className="h-3 w-3" />
        {current + 1}/{photos.length}
      </div>
      
      {/* Navigation arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrent(p => p === 0 ? photos.length - 1 : p - 1); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white opacity-0 group-hover/photo:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrent(p => p === photos.length - 1 ? 0 : p + 1); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white opacity-0 group-hover/photo:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
      
      {/* Dots */}
      {photos.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {photos.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === current ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReactionBar({ occurrenceId }: { occurrenceId: number }) {
  const [reactions, setReactions] = useState<Record<string, number>>(() => {
    const mock: Record<string, number> = {};
    REACTION_TYPES.forEach(r => { mock[r.key] = Math.floor(Math.random() * 12); });
    return mock;
  });
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());
  
  const toggleReaction = (key: string) => {
    setUserReactions(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        setReactions(r => ({ ...r, [key]: Math.max(0, r[key] - 1) }));
      } else {
        next.add(key);
        setReactions(r => ({ ...r, [key]: r[key] + 1 }));
      }
      return next;
    });
  };
  
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {REACTION_TYPES.map(r => {
        const count = reactions[r.key];
        const active = userReactions.has(r.key);
        return (
          <button
            key={r.key}
            onClick={(e) => { e.stopPropagation(); toggleReaction(r.key); }}
            title={r.label}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium transition-all ${
              active
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30 scale-105"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <span>{r.emoji}</span>
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

function TimelineView({ occurrence }: { occurrence: any }) {
  const steps = getTimelineSteps(occurrence);
  
  return (
    <div className="flex items-center gap-0 overflow-x-auto py-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-shrink-0">
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium ${
            step.done
              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300"
              : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
          }`}>
            <span>{step.icon}</span>
            <span>{step.label}</span>
            {step.time && <span className="text-[9px] opacity-60">{step.time}</span>}
          </div>
          {i < steps.length - 1 && (
            <div className={`w-6 h-0.5 flex-shrink-0 ${
              step.done ? "bg-emerald-300 dark:bg-emerald-700" : "bg-slate-200 dark:bg-slate-700"
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export default function Feed() {
  const { user } = useAuth();
  const [selectedOccurrence, setSelectedOccurrence] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedTab>("recent");
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());
  const [confirmed, setConfirmed] = useState<Set<number>>(new Set());
  const [newCount, setNewCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(10);
  const feedRef = useRef<HTMLDivElement>(null);
  
  const { data: recentOccurrences, isLoading, refetch } = trpc.occurrences.getRecent.useQuery({ limit: 50 });
  const { data: validations } = trpc.validations.getByOccurrence.useQuery(
    { occurrenceId: selectedOccurrence || 0 },
    { enabled: !!selectedOccurrence }
  );
  const createValidation = trpc.validations.create.useMutation();

  // Simulate new occurrences notification
  useEffect(() => {
    const interval = setInterval(() => {
      setNewCount(prev => prev + Math.floor(Math.random() * 2));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sort/filter logic per tab
  const sortedOccurrences = useMemo(() => {
    if (!recentOccurrences) return [];
    let items = [...recentOccurrences];
    
    // Type filter
    if (filterType !== "all") {
      items = items.filter(o => o.type === filterType);
    }
    
    // Tab sorting
    switch (activeTab) {
      case "trending":
        items.sort((a, b) => ((b.communityValidations || 0) + (b.communityRejections || 0)) - ((a.communityValidations || 0) + (a.communityRejections || 0)));
        break;
      case "urgent":
        items = items.filter(o => o.severity === "critical" || o.severity === "high");
        items.sort((a, b) => Number(b.riskScore || 0) - Number(a.riskScore || 0));
        break;
      case "nearby":
        // Mock: shuffle for "nearby" effect
        items.sort(() => Math.random() - 0.5);
        break;
      default:
        // Already sorted by date from API
        break;
    }
    
    return items;
  }, [recentOccurrences, filterType, activeTab]);

  const visibleOccurrences = sortedOccurrences.slice(0, visibleCount);

  const handleValidate = async (occurrenceId: number, isValid: boolean) => {
    try {
      await createValidation.mutateAsync({
        occurrenceId,
        isValid,
        comment: comment || undefined,
      });
      toast.success(isValid ? "✅ Validado com sucesso! +5 pontos" : "❌ Rejeitado com sucesso! +5 pontos");
      setComment("");
      setSelectedOccurrence(null);
    } catch (error) {
      toast.error("Erro ao validar ocorrência");
    }
  };

  const handleConfirm = (occurrenceId: number) => {
    setConfirmed(prev => {
      const next = new Set(prev);
      if (next.has(occurrenceId)) {
        next.delete(occurrenceId);
        toast("Confirmação removida");
      } else {
        next.add(occurrenceId);
        toast.success("🗺️ Eu confirmo! +2 pontos de credibilidade");
      }
      return next;
    });
  };

  const handleBookmark = (occurrenceId: number) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(occurrenceId)) {
        next.delete(occurrenceId);
        toast("Removido dos salvos");
      } else {
        next.add(occurrenceId);
        toast.success("🔖 Salvo! Acompanhe atualizações");
      }
      return next;
    });
  };

  const handleShare = async (occurrence: any) => {
    const typeConf = TYPE_CONFIG[occurrence.type] || TYPE_CONFIG.other;
    const text = `${typeConf.icon} ${typeConf.label} reportada no EcoMonitor!\nRisco: ${Number(occurrence.riskScore || 0).toFixed(0)}/100\n${occurrence.description || ""}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: "EcoMonitor - Ocorrência", text, url: window.location.href });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("📋 Copiado para a área de transferência!");
    }
  };

  const handleRefresh = () => {
    setNewCount(0);
    refetch();
    toast.success("Feed atualizado!");
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 80) return "text-red-500";
    if (risk >= 60) return "text-orange-500";
    if (risk >= 40) return "text-amber-500";
    return "text-emerald-500";
  };

  const TABS: { key: FeedTab; label: string; icon: string; desc: string }[] = [
    { key: "recent", label: "Recentes", icon: "🕐", desc: "Mais novos" },
    { key: "trending", label: "Em Alta", icon: "🔥", desc: "Mais interações" },
    { key: "urgent", label: "Urgentes", icon: "🚨", desc: "Risco alto" },
    { key: "nearby", label: "Perto", icon: "📍", desc: "Sua região" },
  ];

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto pb-8">
        
        {/* ═══ Hero Header ═══ */}
        <div className="relative mb-6 p-5 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-400/20 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Feed Colaborativo</h1>
                  <p className="text-emerald-100 text-xs">Valide, confirme e interaja com a comunidade</p>
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  showFilters || filterType !== "all"
                    ? "bg-white text-emerald-700 shadow-lg"
                    : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                Filtrar
                {filterType !== "all" && <span className="bg-emerald-500 text-white px-1 rounded text-[9px]">1</span>}
              </button>
            </div>

            {/* Stats row */}
            {recentOccurrences && (
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: recentOccurrences.length, label: "Total", icon: Eye },
                  { value: recentOccurrences.filter(o => o.severity === "critical").length, label: "Críticas", icon: AlertCircle },
                  { value: recentOccurrences.filter(o => o.status === "validated").length, label: "Validadas", icon: CheckCircle2 },
                  { value: recentOccurrences.reduce((a, o) => a + (o.communityValidations || 0), 0), label: "Interações", icon: Heart },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-2 text-center">
                    <div className="text-lg font-bold text-white">{stat.value}</div>
                    <div className="text-[10px] text-emerald-100 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ New Occurrences Banner ═══ */}
        {newCount > 0 && (
          <button
            onClick={handleRefresh}
            className="w-full mb-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all active:scale-[0.98] animate-pulse"
          >
            <ArrowUp className="h-4 w-4" />
            {newCount} {newCount === 1 ? "nova ocorrência" : "novas ocorrências"} — toque para atualizar
          </button>
        )}

        {/* ═══ Tabs ═══ */}
        <div className="flex gap-1.5 mb-4 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setVisibleCount(10); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ═══ Filter Bar ═══ */}
        {showFilters && (
          <div className="mb-4 p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Filter className="h-3 w-3" />
              Filtrar por tipo
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterType === "all"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                Todos
              </button>
              {Object.entries(TYPE_CONFIG).filter(([k]) => k !== "other").map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    filterType === key
                      ? `bg-gradient-to-r ${cfg.gradient} text-white shadow-lg`
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <span className="text-sm">{cfg.icon}</span>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ Results Counter ═══ */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              <span className="font-bold text-slate-700 dark:text-slate-200">{sortedOccurrences.length}</span> resultados
            </span>
            {sortedOccurrences.filter(o => o.severity === "critical").length > 0 && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-bold text-red-600 dark:text-red-400">
                  {sortedOccurrences.filter(o => o.severity === "critical").length}
                </span> críticas
              </span>
            )}
          </div>
          <button onClick={handleRefresh} className="text-xs text-emerald-500 hover:text-emerald-600 font-bold flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            Atualizar
          </button>
        </div>

        {/* ═══ Loading Skeleton ═══ */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-white/5 p-5 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-xl bg-slate-200 dark:bg-slate-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-3 w-56 bg-slate-100 dark:bg-slate-800/50 rounded" />
                    <div className="h-40 w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl mt-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ Feed Cards ═══ */}
        <div className="space-y-4" ref={feedRef}>
          {visibleOccurrences.map((occurrence) => {
            const isSelected = selectedOccurrence === occurrence.id;
            const typeConf = TYPE_CONFIG[occurrence.type] || TYPE_CONFIG.other;
            const sevConf = SEVERITY_CONFIG[occurrence.severity] || SEVERITY_CONFIG.low;
            const statusConf = STATUS_CONFIG[occurrence.status || "pending"] || STATUS_CONFIG.pending;
            const StatusIcon = statusConf.icon;
            const risk = Number(occurrence.riskScore || 0);
            const isCritical = occurrence.severity === "critical" && risk >= 80;
            const isBookmarked = bookmarks.has(occurrence.id);
            const isConfirmed = confirmed.has(occurrence.id);
            const userLevel = getUserLevel(occurrence.userId);
            const tags = TAGS_BY_TYPE[occurrence.type] || TAGS_BY_TYPE.other;
            const mockViews = Math.floor(occurrence.id * 17 + 42) % 500 + 20;
            const mockConfirmations = (occurrence.communityValidations || 0) + (isConfirmed ? 1 : 0);

            return (
              <div
                key={occurrence.id}
                className={`group bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isCritical
                    ? "border-red-300 dark:border-red-700 shadow-lg shadow-red-500/10 ring-1 ring-red-500/20 animate-pulse-slow"
                    : isSelected
                    ? "border-emerald-300 dark:border-emerald-700 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/20"
                    : "border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:shadow-lg"
                }`}
              >
                {/* Critical urgent banner */}
                {isCritical && (
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[11px] font-bold">
                    <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                    <AlertCircle className="h-3.5 w-3.5" />
                    OCORRÊNCIA CRÍTICA — RISCO ELEVADO
                  </div>
                )}

                {/* ── Author Header ── */}
                <div className="px-4 pt-4 pb-2 flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-slate-200 dark:border-slate-700">
                    <AvatarFallback className={`text-xs font-bold bg-gradient-to-br ${typeConf.gradient} text-white`}>
                      {getUserInitials(occurrence.userId)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {getUserName(occurrence.userId)}
                      </span>
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${userLevel.color}`}>
                        {userLevel.icon} {userLevel.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {formatAddress(Number(occurrence.latitude), Number(occurrence.longitude))}
                      </span>
                      <span>•</span>
                      <span>{formatTimeAgo(occurrence.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleBookmark(occurrence.id); }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      {isBookmarked 
                        ? <BookmarkCheck className="h-4 w-4 text-amber-500" /> 
                        : <Bookmark className="h-4 w-4 text-slate-400" />
                      }
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleShare(occurrence); }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Share2 className="h-4 w-4 text-slate-400 hover:text-blue-500" />
                    </button>
                  </div>
                </div>

                {/* ── Card Body (clickable) ── */}
                <div
                  className="px-4 cursor-pointer"
                  onClick={() => setSelectedOccurrence(isSelected ? null : occurrence.id)}
                >
                  {/* Type + Severity + Status row */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r ${typeConf.gradient} text-white shadow-sm`}>
                      <span>{typeConf.icon}</span>
                      {typeConf.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold ${sevConf.bg} ${sevConf.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${sevConf.dot} ${isCritical ? "animate-ping" : ""}`} />
                      {sevConf.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${statusConf.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusConf.label}
                    </span>
                    
                    {/* Risk score pill */}
                    <span className={`ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold ${
                      risk >= 80 ? "bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400" :
                      risk >= 60 ? "bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400" :
                      risk >= 40 ? "bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400" :
                      "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                    }`}>
                      <Zap className="h-3 w-3" />
                      Risco {risk.toFixed(0)}
                    </span>
                  </div>

                  {/* Description */}
                  {occurrence.description && (
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed mb-2">
                      {occurrence.description}
                    </p>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Photo Carousel */}
                  <PhotoCarousel type={occurrence.type} occurrenceId={occurrence.id} />
                </div>

                {/* ── Reactions ── */}
                <div className="px-4 py-2.5">
                  <ReactionBar occurrenceId={occurrence.id} />
                </div>

                {/* ── Action Bar ── */}
                <div className="border-t border-slate-100 dark:border-white/5 px-4 py-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Confirm button (Waze-style) */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleConfirm(occurrence.id); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isConfirmed
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/20 hover:text-emerald-600"
                        }`}
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        {isConfirmed ? "Confirmado!" : "Eu confirmo"}
                        {mockConfirmations > 0 && (
                          <span className={`px-1 rounded text-[10px] ${isConfirmed ? "bg-white/20" : "bg-emerald-500/10 text-emerald-600"}`}>
                            {mockConfirmations}
                          </span>
                        )}
                      </button>

                      {/* Validate button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedOccurrence(isSelected ? null : occurrence.id); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-950/20 hover:text-blue-600 transition-all"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        Validar
                        <ChevronDown className={`h-3 w-3 transition-transform ${isSelected ? "rotate-180" : ""}`} />
                      </button>

                      {/* Comment count */}
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {(occurrence.communityValidations || 0) + (occurrence.communityRejections || 0)}
                      </span>
                    </div>

                    {/* View count */}
                    <span className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Eye className="h-3 w-3" />
                      {mockViews}
                    </span>
                  </div>
                </div>

                {/* ═══ Expanded Detail Section ═══ */}
                {isSelected && (
                  <div className="border-t border-slate-100 dark:border-white/5 animate-in slide-in-from-top-1 duration-200">
                    
                    {/* Timeline */}
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <TrendingUp className="h-3 w-3" />
                        Ciclo de vida
                      </div>
                      <TimelineView occurrence={occurrence} />
                    </div>

                    {/* Validation stats grid */}
                    <div className="grid grid-cols-4 gap-px bg-slate-100 dark:bg-slate-800/50">
                      {[
                        { value: validations?.filter(v => v.isValid).length || occurrence.communityValidations || 0, label: "Validações", color: "text-emerald-500" },
                        { value: validations?.filter(v => !v.isValid).length || occurrence.communityRejections || 0, label: "Rejeições", color: "text-red-500" },
                        { value: mockConfirmations, label: "Confirmações", color: "text-blue-500" },
                        { value: mockViews, label: "Visualizações", color: "text-slate-500" },
                      ].map((stat, i) => (
                        <div key={i} className="p-3 text-center bg-white dark:bg-slate-900/80">
                          <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                          <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Physical Parameters */}
                    {occurrence.physicalParameters && (
                      <div className="px-4 py-3 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <Sparkles className="h-3 w-3 text-amber-500" />
                          Parâmetros Físicos
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(occurrence.physicalParameters as Record<string, any>).slice(0, 4).map(([key, val]) => (
                            <div key={key} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                              <span className="text-[11px] text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Validation form */}
                    {user && (
                      <div className="p-4 space-y-3 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <Shield className="h-3.5 w-3.5 text-blue-500" />
                          Validar esta ocorrência (+5 pts)
                        </div>
                        
                        <Textarea
                          placeholder="Comentário sobre a veracidade desta ocorrência..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="min-h-16 text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 resize-none focus:ring-emerald-500/30"
                          maxLength={300}
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">{comment.length}/300</span>
                          <div className="flex gap-2">
                            <Button
                              onClick={(e) => { e.stopPropagation(); handleValidate(occurrence.id, true); }}
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 h-9 text-xs px-4"
                              disabled={createValidation.isPending}
                            >
                              <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />
                              Válido
                            </Button>
                            <Button
                              onClick={(e) => { e.stopPropagation(); handleValidate(occurrence.id, false); }}
                              variant="outline"
                              className="border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl h-9 text-xs px-4"
                              disabled={createValidation.isPending}
                            >
                              <ThumbsDown className="w-3.5 h-3.5 mr-1.5" />
                              Inválido
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Comments */}
                    {validations && validations.length > 0 && (
                      <div className="border-t border-slate-100 dark:border-white/5 p-4 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <MessageCircle className="h-3.5 w-3.5" />
                          Comentários ({validations.length})
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {validations.map((validation, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40"
                            >
                              <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                                <AvatarFallback className={`text-[10px] font-bold ${
                                  validation.isValid
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                }`}>
                                  {getUserInitials(validation.userId)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    {getUserName(validation.userId)}
                                  </span>
                                  <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${
                                    validation.isValid ? "text-emerald-600" : "text-red-500"
                                  }`}>
                                    {validation.isValid ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                                    {validation.isValid ? "Válido" : "Inválido"}
                                  </span>
                                  <span className={`text-[10px] ${getUserLevel(validation.userId).color}`}>
                                    {getUserLevel(validation.userId).icon}
                                  </span>
                                </div>
                                {validation.comment && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {validation.comment}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Collapse */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedOccurrence(null); }}
                      className="w-full py-2.5 flex items-center justify-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors border-t border-slate-100 dark:border-white/5"
                    >
                      <ChevronUp className="h-3 w-3" />
                      Fechar detalhes
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ═══ Load More ═══ */}
        {visibleCount < sortedOccurrences.length && (
          <button
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="w-full mt-4 py-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            <ChevronDown className="h-4 w-4" />
            Carregar mais ({sortedOccurrences.length - visibleCount} restantes)
          </button>
        )}

        {/* ═══ Empty State ═══ */}
        {!isLoading && sortedOccurrences.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex p-5 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 mb-4">
              {activeTab === "urgent" ? (
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              ) : activeTab === "nearby" ? (
                <MapPin className="h-10 w-10 text-blue-400" />
              ) : (
                <Eye className="h-10 w-10 text-slate-400" />
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">
              {activeTab === "urgent" 
                ? "Nenhuma ocorrência urgente!" 
                : activeTab === "nearby"
                ? "Nenhuma ocorrência perto de você"
                : filterType !== "all" 
                ? "Nenhuma ocorrência deste tipo" 
                : "Nenhuma ocorrência encontrada"
              }
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              {activeTab === "urgent"
                ? "Isso é uma boa notícia! Todas as ocorrências estão sob controle. 🌿"
                : "Tente mudar o filtro, aba ou volte mais tarde"
              }
            </p>
            {(filterType !== "all" || activeTab !== "recent") && (
              <Button
                variant="outline"
                className="mt-4 rounded-xl text-sm"
                onClick={() => { setFilterType("all"); setActiveTab("recent"); }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
