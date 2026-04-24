import { useState, useMemo, useEffect, useRef } from "react";
import {
  AudioLines, Volume2, Bird, Bug, Music, Activity, BarChart3,
  MapPin, Info, TrendingUp, TrendingDown, Waves, Radio, Signal,
  Mic, Play, Pause, RefreshCw, ChevronDown, ChevronUp, Leaf,
  TreePine, Droplets, ThermometerSun, AlertTriangle, CheckCircle2,
  Clock, Zap,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";

// ─── Types ───────────────────────────────────────────────────────────

interface Species {
  id: string;
  name: string;
  scientificName: string;
  group: "bird" | "insect" | "amphibian" | "mammal";
  frequency: [number, number]; // Hz range
  confidence: number; // 0–1
  detections: number;
  status: "LC" | "VU" | "EN" | "CR"; // IUCN status
  color: string;
}

interface ListeningPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  aci: number; // Acoustic Complexity Index
  speciesCount: number;
  healthRating: "excellent" | "good" | "moderate" | "poor";
}

// ─── Constants ───────────────────────────────────────────────────────

const SPECIES: Species[] = [
  { id: "s1", name: "Sabiá-laranjeira", scientificName: "Turdus rufiventris", group: "bird", frequency: [1800, 5200], confidence: 0.94, detections: 847, status: "LC", color: "#f97316" },
  { id: "s2", name: "João-de-barro", scientificName: "Furnarius rufus", group: "bird", frequency: [2200, 4800], confidence: 0.91, detections: 623, status: "LC", color: "#a16207" },
  { id: "s3", name: "Bem-te-vi", scientificName: "Pitangus sulphuratus", group: "bird", frequency: [2000, 6000], confidence: 0.97, detections: 1205, status: "LC", color: "#eab308" },
  { id: "s4", name: "Tucano-toco", scientificName: "Ramphastos toco", group: "bird", frequency: [800, 3500], confidence: 0.88, detections: 192, status: "LC", color: "#f59e0b" },
  { id: "s5", name: "Seriema", scientificName: "Cariama cristata", group: "bird", frequency: [500, 2800], confidence: 0.85, detections: 156, status: "LC", color: "#78716c" },
  { id: "s6", name: "Urutau", scientificName: "Nyctibius griseus", group: "bird", frequency: [600, 1500], confidence: 0.72, detections: 43, status: "LC", color: "#6b7280" },
  { id: "s7", name: "Arara-azul-grande", scientificName: "Anodorhynchus hyacinthinus", group: "bird", frequency: [1200, 4000], confidence: 0.68, detections: 12, status: "VU", color: "#2563eb" },
  { id: "s8", name: "Perereca-verde", scientificName: "Hypsiboas albopunctatus", group: "amphibian", frequency: [800, 2400], confidence: 0.82, detections: 534, status: "LC", color: "#22c55e" },
  { id: "s9", name: "Rã-martelo", scientificName: "Boana faber", group: "amphibian", frequency: [400, 1800], confidence: 0.79, detections: 389, status: "LC", color: "#15803d" },
  { id: "s10", name: "Sapo-cururu", scientificName: "Rhinella icterica", group: "amphibian", frequency: [200, 1200], confidence: 0.91, detections: 712, status: "LC", color: "#65a30d" },
  { id: "s11", name: "Grilo-campestre", scientificName: "Gryllus assimilis", group: "insect", frequency: [3000, 8000], confidence: 0.95, detections: 2341, status: "LC", color: "#84cc16" },
  { id: "s12", name: "Cigarra", scientificName: "Quesada gigas", group: "insect", frequency: [4000, 12000], confidence: 0.93, detections: 1876, status: "LC", color: "#a3e635" },
  { id: "s13", name: "Grilo-toupeira", scientificName: "Neoscapteriscus sp.", group: "insect", frequency: [2500, 5000], confidence: 0.76, detections: 465, status: "LC", color: "#4d7c0f" },
  { id: "s14", name: "Lobo-guará", scientificName: "Chrysocyon brachyurus", group: "mammal", frequency: [300, 2000], confidence: 0.62, detections: 8, status: "VU", color: "#dc2626" },
  { id: "s15", name: "Bugio-preto", scientificName: "Alouatta caraya", group: "mammal", frequency: [100, 1500], confidence: 0.75, detections: 67, status: "LC", color: "#991b1b" },
];

const LISTENING_POINTS: ListeningPoint[] = [
  { id: "lp1", name: "Mata Ciliar — Rio Verde", lat: -22.91, lng: -47.06, aci: 0.87, speciesCount: 12, healthRating: "excellent" },
  { id: "lp2", name: "Cerrado — Serra da Canastra", lat: -20.25, lng: -46.52, aci: 0.74, speciesCount: 9, healthRating: "good" },
  { id: "lp3", name: "Fragmento Urbano — Parque", lat: -23.55, lng: -46.63, aci: 0.52, speciesCount: 5, healthRating: "moderate" },
  { id: "lp4", name: "Área Degradada — Pasto", lat: -22.32, lng: -49.07, aci: 0.28, speciesCount: 3, healthRating: "poor" },
  { id: "lp5", name: "Manguezal — Litoral Sul", lat: -24.18, lng: -46.79, aci: 0.81, speciesCount: 11, healthRating: "excellent" },
  { id: "lp6", name: "Caatinga — Sertão", lat: -13.38, lng: -39.07, aci: 0.65, speciesCount: 7, healthRating: "good" },
];

const GROUP_CONFIG = {
  bird: { label: "Aves", icon: Bird, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20" },
  amphibian: { label: "Anfíbios", icon: Droplets, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
  insect: { label: "Insetos", icon: Bug, color: "text-lime-500", bg: "bg-lime-50 dark:bg-lime-950/20" },
  mammal: { label: "Mamíferos", icon: TreePine, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20" },
};

const IUCN_COLORS = {
  LC: { label: "Pouco Preocupante", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" },
  VU: { label: "Vulnerável", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20" },
  EN: { label: "Em Perigo", color: "text-orange-600 bg-orange-50 dark:bg-orange-950/20" },
  CR: { label: "Criticamente em Perigo", color: "text-red-600 bg-red-50 dark:bg-red-950/20" },
};

const HEALTH_CONFIG = {
  excellent: { label: "Excelente", color: "bg-emerald-500", ring: "ring-emerald-500/20" },
  good: { label: "Bom", color: "bg-blue-500", ring: "ring-blue-500/20" },
  moderate: { label: "Moderado", color: "bg-amber-500", ring: "ring-amber-500/20" },
  poor: { label: "Degradado", color: "bg-red-500", ring: "ring-red-500/20" },
};

// ─── ACI Calculation ─────────────────────────────────────────────────

/**
 * ACI — Acoustic Complexity Index (Pieretti et al. 2011)
 * Measures irregularity in sound intensity across frequency bins.
 * Higher ACI → more biophonic diversity → healthier ecosystem.
 * Range: 0 (silent/monotone) – 1 (highly complex).
 */
function calculateGlobalACI(points: ListeningPoint[]) {
  if (!points.length) return 0;
  return points.reduce((sum, p) => sum + p.aci, 0) / points.length;
}

// ─── Spectrogram Component ──────────────────────────────────────────

function Spectrogram({ species, isPlaying }: { species: Species[]; isPlaying: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const maxFreq = 14000; // Hz

    function draw() {
      if (!ctx) return;
      // Shift existing content left
      const imageData = ctx.getImageData(2, 0, W - 2, H);
      ctx.putImageData(imageData, 0, 0);

      // Clear rightmost column
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(W - 2, 0, 2, H);

      if (isPlaying) {
        // Draw each species' frequency band
        species.forEach(sp => {
          const y1 = H - (sp.frequency[1] / maxFreq) * H;
          const y2 = H - (sp.frequency[0] / maxFreq) * H;
          const alpha = sp.confidence * (0.3 + 0.7 * Math.random());
          ctx.fillStyle = sp.color + Math.round(alpha * 255).toString(16).padStart(2, "0");
          ctx.fillRect(W - 2, y1, 2, y2 - y1);
        });

        // Random noise
        for (let i = 0; i < 5; i++) {
          const y = Math.random() * H;
          ctx.fillStyle = `rgba(100,116,139,${Math.random() * 0.15})`;
          ctx.fillRect(W - 2, y, 2, 1);
        }
      }

      timeRef.current += 1;
      animationRef.current = requestAnimationFrame(draw);
    }

    animationRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationRef.current);
  }, [species, isPlaying]);

  return (
    <div className="relative rounded-xl overflow-hidden">
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        className="w-full h-[200px] bg-slate-950 rounded-xl"
      />
      {/* Y-axis labels */}
      <div className="absolute left-1 top-0 bottom-0 flex flex-col justify-between py-1 pointer-events-none">
        {[14, 10, 6, 2, 0].map(f => (
          <span key={f} className="text-[7px] text-slate-500 font-mono">{f}kHz</span>
        ))}
      </div>
      {/* Play indicator */}
      <div className="absolute top-2 right-2">
        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
          isPlaying ? "bg-emerald-500/20 text-emerald-400 animate-pulse" : "bg-slate-500/20 text-slate-400"
        }`}>
          {isPlaying ? "🔴 REC" : "⏸ PAUSED"}
        </span>
      </div>
    </div>
  );
}

// ─── Species Card ────────────────────────────────────────────────────

function SpeciesRow({ sp }: { sp: Species }) {
  const group = GROUP_CONFIG[sp.group];
  const iucn = IUCN_COLORS[sp.status];
  const Icon = group.icon;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className={`p-2 rounded-lg ${group.bg}`}>
        <Icon className={`h-4 w-4 ${group.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{sp.name}</span>
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${iucn.color}`}>
            {sp.status}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 italic">{sp.scientificName}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-black text-slate-700 dark:text-slate-200">{(sp.confidence * 100).toFixed(0)}%</div>
        <div className="text-[9px] text-slate-400">{sp.detections} det.</div>
      </div>
      <div className="w-20 h-5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${sp.confidence * 100}%`,
            backgroundColor: sp.color,
            opacity: 0.7,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-slate-600 dark:text-slate-300">
          {sp.frequency[0]}–{sp.frequency[1]} Hz
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function Bioacoustics() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [expandedPoint, setExpandedPoint] = useState<string | null>("lp1");

  const globalACI = useMemo(() => calculateGlobalACI(LISTENING_POINTS), []);

  const filteredSpecies = useMemo(() => {
    if (filterGroup === "all") return SPECIES;
    return SPECIES.filter(s => s.group === filterGroup);
  }, [filterGroup]);

  const totalDetections = SPECIES.reduce((s, sp) => s + sp.detections, 0);
  const threatSpecies = SPECIES.filter(s => s.status === "VU" || s.status === "EN" || s.status === "CR");
  const groupCounts = {
    bird: SPECIES.filter(s => s.group === "bird").length,
    amphibian: SPECIES.filter(s => s.group === "amphibian").length,
    insect: SPECIES.filter(s => s.group === "insect").length,
    mammal: SPECIES.filter(s => s.group === "mammal").length,
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto pb-12 space-y-6">
        {/* Hero */}
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-700 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <AudioLines className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Bioacústica</h1>
              <p className="text-purple-100 text-sm">Índice de Vitalidade Acústica — monitoramento de biodiversidade por paisagem sonora</p>
            </div>
          </div>
          <div className="relative grid grid-cols-4 gap-3 mt-5">
            {[
              { value: SPECIES.length, label: "espécies detectadas", icon: "🦜" },
              { value: totalDetections.toLocaleString("pt-BR"), label: "detecções totais", icon: "📡" },
              { value: `${(globalACI * 100).toFixed(0)}%`, label: "ACI global médio", icon: "📊" },
              { value: threatSpecies.length, label: "espécies ameaçadas", icon: "⚠️" },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-lg font-black text-white">{s.icon} {s.value}</div>
                <div className="text-[10px] text-purple-100 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ACI Global Gauge + Spectrogram */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* ACI Gauge */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Índice de Complexidade Acústica</div>
            <div className="text-center mb-4">
              <div className="text-5xl font-black text-purple-600 dark:text-purple-400">
                {(globalACI * 100).toFixed(0)}
              </div>
              <div className="text-xs text-slate-400 font-medium">ACI (0–100)</div>
            </div>
            <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-400 via-amber-400 via-green-400 to-emerald-500 transition-all duration-700"
                style={{ width: `${globalACI * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-slate-400">
              <span>0 — Silêncio</span>
              <span>50 — Moderado</span>
              <span>100 — Biodiverso</span>
            </div>
            <div className="mt-4 space-y-2">
              {Object.entries(groupCounts).map(([g, count]) => {
                const cfg = GROUP_CONFIG[g as keyof typeof GROUP_CONFIG];
                const Icon = cfg.icon;
                return (
                  <div key={g} className="flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                    <span className="text-[10px] text-slate-500 flex-1">{cfg.label}</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{count}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 p-2 rounded-lg bg-purple-50 dark:bg-purple-950/15 text-[9px] text-purple-600 dark:text-purple-400">
              <strong>ACI</strong> — Pieretti et al. (2011). Mede irregularidade de intensidade entre faixas de frequência. Quanto maior, mais complexa a paisagem sonora.
            </div>
          </div>

          {/* Spectrogram */}
          <div className="md:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Waves className="h-4 w-4 text-purple-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Espectrograma em Tempo Real</span>
              <div className="flex-1" />
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  isPlaying
                    ? "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                    : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                }`}
              >
                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                {isPlaying ? "Pausar" : "Reproduzir"}
              </button>
            </div>
            <Spectrogram species={SPECIES} isPlaying={isPlaying} />
            <div className="flex flex-wrap gap-1.5 mt-3">
              {SPECIES.slice(0, 8).map(sp => (
                <span key={sp.id} className="flex items-center gap-1 text-[8px] font-medium text-slate-500">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sp.color }} />
                  {sp.name}
                </span>
              ))}
              {SPECIES.length > 8 && (
                <span className="text-[8px] text-slate-400">+{SPECIES.length - 8} mais</span>
              )}
            </div>
          </div>
        </div>

        {/* Species List */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Bird className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Espécies Detectadas</h2>
            <div className="flex-1" />
            <div className="flex gap-1">
              {[
                { key: "all", label: "Todos" },
                ...Object.entries(GROUP_CONFIG).map(([k, v]) => ({ key: k, label: v.label })),
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilterGroup(f.key)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    filterGroup === f.key
                      ? "bg-purple-500 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {filteredSpecies.map(sp => (
              <SpeciesRow key={sp.id} sp={sp} />
            ))}
          </div>
        </div>

        {/* Listening Points */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Radio className="h-4 w-4 text-purple-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Pontos de Escuta</h2>
            <div className="flex-1" />
            <span className="text-[9px] font-bold text-slate-400">{LISTENING_POINTS.length} pontos ativos</span>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {LISTENING_POINTS.map(lp => {
              const health = HEALTH_CONFIG[lp.healthRating];
              const isExpanded = expandedPoint === lp.id;
              return (
                <button
                  key={lp.id}
                  onClick={() => setExpandedPoint(isExpanded ? null : lp.id)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    isExpanded
                      ? `border-purple-300 dark:border-purple-700 ring-2 ${health.ring} bg-white dark:bg-slate-900/80`
                      : "border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${health.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{lp.name}</div>
                      <div className="text-[10px] text-slate-400">{lp.lat.toFixed(2)}°S, {Math.abs(lp.lng).toFixed(2)}°W</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-purple-600 dark:text-purple-400">{(lp.aci * 100).toFixed(0)}</div>
                      <div className="text-[8px] text-slate-400">ACI</div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 animate-in slide-in-from-top-1 duration-200">
                      <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{lp.speciesCount}</div>
                        <div className="text-[8px] text-slate-400">Espécies</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                        <div className={`text-xs font-bold ${
                          lp.healthRating === "excellent" ? "text-emerald-600" :
                          lp.healthRating === "good" ? "text-blue-600" :
                          lp.healthRating === "moderate" ? "text-amber-600" : "text-red-600"
                        }`}>{health.label}</div>
                        <div className="text-[8px] text-slate-400">Saúde</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                        <div className="text-xs font-bold text-purple-600 dark:text-purple-400">{(lp.aci * 100).toFixed(0)}%</div>
                        <div className="text-[8px] text-slate-400">Complexidade</div>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Methodology */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">Metodologia Científica</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold text-purple-600 mb-1">ACI — Acoustic Complexity Index</div>
              <div className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                ACI = Σ|I_k - I_(k+1)| / Σ I_k
              </div>
              <div className="text-[9px] text-slate-400 mt-1">Pieretti, Farina & Morri (2011). Ecological Indicators.</div>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold text-blue-600 mb-1">Identificação por Deep Learning</div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                CNN (ResNet-50) treinada em espectrogramas Mel, janelas de 3s, overlap 50%.
              </div>
              <div className="text-[9px] text-slate-400 mt-1">Baseado em BirdNET (Kahl et al. 2021).</div>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold text-emerald-600 mb-1">NDSI — Normalized Difference Soundscape Index</div>
              <div className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                NDSI = (bio - anthro) / (bio + anthro)
              </div>
              <div className="text-[9px] text-slate-400 mt-1">Kasten et al. (2012). Biofonia (1–11kHz) vs Antropofonia (0–1kHz).</div>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold text-amber-600 mb-1">Estado de Conservação</div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Classificação IUCN Red List. Espécies VU/EN/CR recebem prioridade no monitoramento.
              </div>
              <div className="text-[9px] text-slate-400 mt-1">IUCN (2024). ICMBio / MMA.</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {["Pieretti et al. (2011)", "Kahl et al. (2021)", "Kasten et al. (2012)", "IUCN Red List", "ICMBio", "Sueur et al. (2008)"].map(ref => (
              <span key={ref} className="text-[8px] font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-500 border border-slate-200 dark:border-slate-700">{ref}</span>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
