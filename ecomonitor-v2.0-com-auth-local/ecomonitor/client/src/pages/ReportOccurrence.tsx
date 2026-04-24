import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import {
  MapPin, AlertCircle, CheckCircle2, Camera, Wind, Droplets,
  Thermometer, Leaf, Loader2, Search, ChevronLeft, ChevronRight,
  Sparkles, X, FileCheck2, Send, Award, Info, CircleDot, Shield, Zap, Trophy,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";
import InteractiveMapInput from "@/components/ui/InteractiveMapInput";
import LocationSearch from "@/components/ui/LocationSearch";
import { LatLngExpression } from "leaflet";

// ─── Config ──────────────────────────────────────────────────────────

const OCCURRENCE_TYPES = [
  { value: "fire", icon: "🔥", label: "Incêndio", gradient: "from-red-500 to-orange-400", bgSelected: "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20", borderSelected: "border-red-400 dark:border-red-500" },
  { value: "water_pollution", icon: "💧", label: "Poluição Hídrica", gradient: "from-blue-500 to-cyan-400", bgSelected: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/20", borderSelected: "border-blue-400 dark:border-blue-500" },
  { value: "air_pollution", icon: "💨", label: "Poluição do Ar", gradient: "from-purple-500 to-violet-400", bgSelected: "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/20", borderSelected: "border-purple-400 dark:border-purple-500" },
  { value: "drought", icon: "🏜️", label: "Seca", gradient: "from-amber-500 to-yellow-400", bgSelected: "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20", borderSelected: "border-amber-400 dark:border-amber-500" },
  { value: "deforestation", icon: "🌳", label: "Desmatamento", gradient: "from-emerald-500 to-green-400", bgSelected: "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20", borderSelected: "border-emerald-400 dark:border-emerald-500" },
  { value: "flooding", icon: "🌊", label: "Enchente", gradient: "from-cyan-500 to-blue-400", bgSelected: "bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/20", borderSelected: "border-cyan-400 dark:border-cyan-500" },
  { value: "other", icon: "⚠️", label: "Outro", gradient: "from-gray-500 to-slate-400", bgSelected: "bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/20", borderSelected: "border-gray-400 dark:border-gray-500" },
];

const SEVERITY_LEVELS = [
  { value: "low", label: "Baixa", description: "Situação controlada", gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-50 dark:bg-emerald-950/20", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-300 dark:border-emerald-700", emoji: "🟢" },
  { value: "medium", label: "Média", description: "Requer atenção", gradient: "from-amber-500 to-yellow-500", bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-700 dark:text-amber-300", border: "border-amber-300 dark:border-amber-700", emoji: "🟡" },
  { value: "high", label: "Alta", description: "Situação preocupante", gradient: "from-orange-500 to-red-400", bg: "bg-orange-50 dark:bg-orange-950/20", text: "text-orange-700 dark:text-orange-300", border: "border-orange-300 dark:border-orange-700", emoji: "🟠" },
  { value: "critical", label: "Crítica", description: "Risco imediato · Fotos obrigatórias", gradient: "from-red-500 to-rose-600", bg: "bg-red-50 dark:bg-red-950/20", text: "text-red-700 dark:text-red-300", border: "border-red-300 dark:border-red-700", emoji: "🔴" },
];

const STEP_META = [
  { label: "Tipo", icon: AlertCircle, color: "text-emerald-500" },
  { label: "Local", icon: MapPin, color: "text-blue-500" },
  { label: "Fotos", icon: Camera, color: "text-purple-500" },
  { label: "Dados", icon: Thermometer, color: "text-orange-500" },
  { label: "Enviar", icon: Send, color: "text-rose-500" },
];

const DEFAULT_CENTER: [number, number] = [-23.5505, -46.6333];

const calculatePhotoHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

interface PhotoPreview {
  file: File;
  preview: string;
  hash: string;
  width: number;
  height: number;
}

// ─── Component ───────────────────────────────────────────────────────

export default function ReportOccurrence() {
  const { user } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [selectedType, setSelectedType] = useState<string>("fire");
  const [latitude, setLatitude] = useState<number>(0);
  const [longitude, setLongitude] = useState<number>(0);
  const [description, setDescription] = useState<string>("");
  const [severity, setSeverity] = useState<string>("medium");
  const [photoPreviews, setPhotoPreviews] = useState<PhotoPreview[]>([]);
  const [physicalParams, setPhysicalParams] = useState<Record<string, any>>({
    temperature: "", humidity: "", windSpeed: "", vegetation: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId] = useState<string>("");
  const [locationMode, setLocationMode] = useState<"map" | "search">("map");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createOccurrence = trpc.occurrences.create.useMutation();
  const { data: nearbyOccurrences } = trpc.occurrences.getRecent.useQuery(
    { limit: 50 },
    { enabled: latitude !== 0 && longitude !== 0 }
  );

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          toast.success("📍 Localização capturada com sucesso!");
        },
        () => {
          setLatitude(DEFAULT_CENTER[0]);
          setLongitude(DEFAULT_CENTER[1]);
        }
      );
    }
  }, []);

  const handleLocationChange = (location: { lat: number; lng: number }) => {
    setLatitude(location.lat);
    setLongitude(location.lng);
  };

  const handleSearchLocationSelect = (location: { lat: number; lng: number; label: string }) => {
    setLatitude(location.lat);
    setLongitude(location.lng);
    setLocationMode("map");
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const maxFiles = 5;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024;
    const minResolution = 800;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!allowed.includes(file.type)) { toast.error(`❌ Formato não suportado: ${file.name}`); continue; }
      if (file.size > maxSize) { toast.error(`❌ Arquivo muito grande: ${file.name}`); continue; }
      const img = document.createElement("img");
      const preview = URL.createObjectURL(file);
      img.onload = async () => {
        if (img.width < minResolution || img.height < minResolution) {
          toast.error(`❌ Resolução baixa: ${file.name}`); return;
        }
        const hash = await calculatePhotoHash(file);
        if (photoPreviews.some((p) => p.hash === hash)) {
          toast.error(`❌ Foto duplicada: ${file.name}`); return;
        }
        setPhotoPreviews((prev) => {
          const updated = [...prev, { file, preview, hash, width: img.width, height: img.height }];
          return updated.length > maxFiles ? prev.slice(0, maxFiles) : updated;
        });
        toast.success(`✅ Foto adicionada: ${file.name}`);
      };
      img.onerror = () => toast.error(`❌ Erro ao carregar: ${file.name}`);
      img.src = preview;
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));

  const handlePhysicalParamChange = (key: string, value: string) => {
    setPhysicalParams((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const nearbyCount = nearbyOccurrences?.filter(
    (occ) =>
      occ.type === selectedType &&
      Math.abs((occ.latitude as any) - latitude) < 0.5 &&
      Math.abs((occ.longitude as any) - longitude) < 0.5
  ).length || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) { toast.error("Selecione o tipo de ocorrência"); return; }
    if (!latitude || !longitude) { toast.error("Defina a localização da ocorrência"); return; }
    if (description.trim().length < 10) { toast.error("Descrição muito curta (mínimo 10 caracteres)"); return; }
    if (severity === "critical" && photoPreviews.length === 0) { toast.error("Para severidade crítica, envie ao menos 1 foto"); return; }

    setLoading(true);
    try {
      const result = await createOccurrence.mutateAsync({
        type: selectedType as any,
        latitude, longitude, description,
        severity: severity as any,
        physicalParameters: Object.values(physicalParams).some((v) => v) ? physicalParams : undefined,
      });
      if (photoPreviews.length > 0) {
        for (const photo of photoPreviews) {
          try {
            const b64 = await new Promise<string | null>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => { const res = reader.result as string; resolve(res.split(",")[1]); };
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(photo.file);
            });
            if (!b64) continue;
            // @ts-ignore
            await trpc.occurrences.uploadPhoto.mutateAsync({
              occurrenceId: (result as any).insertId || (result as any)[0]?.id || 1,
              fileName: photo.file.name, b64,
            });
          } catch (err) { console.error("Erro upload foto:", err); }
        }
      }
      setReportId(String((result as any).insertId || (result as any)[0]?.id || ""));
      setSubmitted(true);
      toast.success("✅ Ocorrência registrada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("❌ Erro ao registrar ocorrência");
    } finally { setLoading(false); }
  };

  const mapCenter: LatLngExpression = latitude && longitude ? [latitude, longitude] : DEFAULT_CENTER;
  const currentType = OCCURRENCE_TYPES.find((t) => t.value === selectedType);
  const currentSeverity = SEVERITY_LEVELS.find((s) => s.value === severity);

  // ══════════════════════════════════════════════════════════════
  // SUCCESS SCREEN
  // ══════════════════════════════════════════════════════════════
  if (submitted) {
    return (
      <MainLayout>
        <div className="min-h-[75vh] flex items-center justify-center">
          <div className="relative text-center max-w-md mx-auto px-6">
            {/* Background decorative blobs */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl animate-eco-float" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl animate-eco-float-delay" />

            <div className="relative">
              {/* Success icon */}
              <div className="relative mx-auto mb-8 h-28 w-28">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 animate-ping opacity-20" />
                <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-400/20 blur-lg" />
                <div className="relative h-28 w-28 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                  <CheckCircle2 className="h-14 w-14 text-white drop-shadow-lg" />
                </div>
              </div>

              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                Relatório Enviado! 🎉
              </h2>
              <p className="text-base text-gray-600 dark:text-gray-300 mb-6">
                Obrigado por contribuir para o monitoramento ambiental!
              </p>

              {/* Info cards */}
              <div className="flex gap-3 mb-6 justify-center">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-5 py-3 rounded-2xl border border-blue-200/50 dark:border-blue-800/30">
                  <p className="text-xs text-blue-500 font-semibold mb-0.5">ID Relatório</p>
                  <p className="text-lg font-mono font-extrabold text-blue-700 dark:text-blue-300">#{reportId}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 px-5 py-3 rounded-2xl border border-amber-200/50 dark:border-amber-800/30">
                  <p className="text-xs text-amber-500 font-semibold mb-0.5">Pontos Ganhos</p>
                  <p className="text-lg font-extrabold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                    <Trophy className="h-4 w-4" /> +10
                  </p>
                </div>
              </div>

              <Button
                onClick={() => {
                  setStep(1); setSubmitted(false); setDescription(""); setPhotoPreviews([]);
                  setPhysicalParams({ temperature: "", humidity: "", windSpeed: "", vegetation: "" });
                }}
                className="w-full h-12 text-base font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl shadow-xl shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:-translate-y-0.5"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Criar Novo Relatório
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // MAIN FORM
  // ══════════════════════════════════════════════════════════════
  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-blue-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 -m-6 p-6">
        <div className="max-w-3xl mx-auto">

          {/* ──── Hero Header ──── */}
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-6 mb-6 shadow-xl shadow-emerald-900/20">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
            <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-white/5 rounded-full" />

            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-extrabold text-white">Relatório Ambiental</h1>
                </div>
                <p className="text-emerald-100 text-sm ml-[52px]">
                  Passo <span className="font-bold text-white">{step}</span> de 5 — {STEP_META[step - 1].label}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs px-3 py-1">
                  <Camera className="h-3 w-3 mr-1" /> {photoPreviews.length}/5
                </Badge>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative mt-5">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{ width: `${(step / 5) * 100}%` }}
                />
              </div>
              {/* Step dots on progress bar */}
              <div className="absolute inset-0 flex items-center justify-between px-0">
                {STEP_META.map((s, i) => {
                  const stepNum = i + 1;
                  const isDone = stepNum < step;
                  const isActive = stepNum === step;
                  const Icon = s.icon;
                  return (
                    <div
                      key={i}
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                        isDone
                          ? "bg-white text-emerald-600 shadow-lg scale-100"
                          : isActive
                          ? "bg-white text-emerald-600 shadow-lg scale-110 ring-4 ring-white/30"
                          : "bg-white/30 text-white/70 scale-90"
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ──── Form Content ──── */}
          <Card className="shadow-xl border-0 rounded-3xl overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* ═══ STEP 1: Tipo ═══ */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        Qual tipo de ocorrência? 🌍
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Selecione a categoria que melhor descreve o evento
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {OCCURRENCE_TYPES.map((type) => {
                        const isSelected = selectedType === type.value;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setSelectedType(type.value)}
                            className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 text-center hover:-translate-y-1 hover:shadow-lg ${
                              isSelected
                                ? `${type.borderSelected} ${type.bgSelected} shadow-lg ring-1 ring-opacity-30`
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-slate-800/50"
                            }`}
                          >
                            <div className={`text-4xl mb-3 transition-transform duration-300 ${isSelected ? "scale-125" : "group-hover:scale-110"}`}>
                              {type.icon}
                            </div>
                            <p className={`text-sm font-bold ${isSelected ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300"}`}>
                              {type.label}
                            </p>
                            {isSelected && (
                              <div className={`absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gradient-to-br ${type.gradient} flex items-center justify-center shadow-lg`}>
                                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ═══ STEP 2: Localização ═══ */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        Onde aconteceu? 📍
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Marque no mapa ou busque por município
                      </p>
                    </div>

                    {/* Mode toggle */}
                    <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setLocationMode("map")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          locationMode === "map"
                            ? "bg-white dark:bg-gray-700 shadow-md text-emerald-600 dark:text-emerald-400"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <MapPin className="h-4 w-4" /> Mapa Interativo
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocationMode("search")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          locationMode === "search"
                            ? "bg-white dark:bg-gray-700 shadow-md text-blue-600 dark:text-blue-400"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <Search className="h-4 w-4" /> Buscar Município
                      </button>
                    </div>

                    {locationMode === "search" && (
                      <LocationSearch onLocationSelect={handleSearchLocationSelect} />
                    )}

                    <div className="rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-inner">
                      <InteractiveMapInput center={mapCenter} onLocationChange={handleLocationChange} />
                    </div>

                    {/* Coordinates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10 rounded-xl px-4 py-3 border border-blue-200/50 dark:border-blue-800/30">
                        <p className="text-xs font-bold text-blue-500 mb-0.5">📍 Latitude</p>
                        <p className="text-base font-mono font-extrabold text-blue-800 dark:text-blue-200">
                          {latitude ? latitude.toFixed(5) : "—"}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/10 rounded-xl px-4 py-3 border border-purple-200/50 dark:border-purple-800/30">
                        <p className="text-xs font-bold text-purple-500 mb-0.5">📍 Longitude</p>
                        <p className="text-base font-mono font-extrabold text-purple-800 dark:text-purple-200">
                          {longitude ? longitude.toFixed(5) : "—"}
                        </p>
                      </div>
                    </div>

                    {nearbyCount > 0 && (
                      <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/15 dark:to-cyan-900/10 rounded-2xl border border-blue-200/60 dark:border-blue-800/30">
                        <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-xl">
                          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                            {nearbyCount} ocorrência(s) similar(es) próxima(s)
                          </p>
                          <p className="text-xs text-blue-500">Considere vincular a este relatório se for relacionada</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ═══ STEP 3: Evidências + Severidade ═══ */}
                {step === 3 && (
                  <div className="space-y-6">
                    {/* Photos */}
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        Evidências Fotográficas 📸
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Fotos ajudam na validação da ocorrência
                      </p>

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative border-3 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-10 text-center cursor-pointer hover:border-emerald-400 hover:bg-gradient-to-br hover:from-emerald-50/50 hover:to-teal-50/50 dark:hover:from-emerald-900/10 dark:hover:to-teal-900/5 transition-all duration-300"
                      >
                        <div className="inline-flex p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 group-hover:bg-gradient-to-br group-hover:from-emerald-100 group-hover:to-teal-100 dark:group-hover:from-emerald-900/30 dark:group-hover:to-teal-900/20 transition-all duration-300 mb-3">
                          <Camera className="h-8 w-8 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                        </div>
                        <p className="text-base font-bold text-gray-600 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          Clique para adicionar fotos
                        </p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP · até 5MB · mín. 800x800px</p>
                        <input
                          type="file" multiple accept="image/*"
                          ref={fileInputRef} onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`h-2 w-6 rounded-full transition-colors ${i < photoPreviews.length ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"}`} />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-gray-500">{photoPreviews.length}/5 fotos</span>
                      </div>
                    </div>

                    {/* Photo grid */}
                    {photoPreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {photoPreviews.map((photo, idx) => (
                          <div key={idx} className="group relative rounded-2xl overflow-hidden aspect-square shadow-lg border-2 border-white dark:border-gray-700">
                            <img src={photo.preview} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <button
                              type="button"
                              onClick={() => removePhoto(idx)}
                              className="absolute top-2 right-2 h-7 w-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                            >
                              <X className="h-3.5 w-3.5 text-white" />
                            </button>
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-white font-mono">
                              {photo.width}×{photo.height}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Severity */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        Nível de Severidade
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        Avalie a gravidade da situação observada
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {SEVERITY_LEVELS.map((sev) => {
                          const isSelected = severity === sev.value;
                          return (
                            <button
                              key={sev.value}
                              type="button"
                              onClick={() => setSeverity(sev.value)}
                              className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                                isSelected
                                  ? `${sev.border} ${sev.bg} shadow-lg`
                                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800/50 hover:border-gray-300"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 mb-1">
                                <span className="text-xl">{sev.emoji}</span>
                                <span className={`text-sm font-extrabold ${isSelected ? sev.text : "text-gray-700 dark:text-gray-200"}`}>
                                  {sev.label}
                                </span>
                              </div>
                              <p className={`text-xs ml-[30px] ${isSelected ? sev.text : "text-gray-500"}`}>
                                {sev.description}
                              </p>
                              {isSelected && (
                                <div className={`absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gradient-to-br ${sev.gradient} flex items-center justify-center shadow-lg`}>
                                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══ STEP 4: Parâmetros + Descrição ═══ */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          Dados Ambientais 🌡️
                        </h2>
                        <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 text-xs font-bold">
                          Opcional
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Informações extras ajudam na análise de risco
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/15 dark:to-orange-900/10 rounded-2xl p-4 border border-red-200/50 dark:border-red-800/30">
                          <div className="flex items-center gap-2 mb-2.5">
                            <div className="p-1.5 bg-red-100 dark:bg-red-800/30 rounded-lg">
                              <Thermometer className="h-4 w-4 text-red-500" />
                            </div>
                            <span className="text-xs font-bold text-red-600 dark:text-red-400">Temperatura °C</span>
                          </div>
                          <Input
                            type="number" placeholder="ex: 28.5"
                            value={physicalParams.temperature || ""}
                            onChange={(e) => handlePhysicalParamChange("temperature", e.target.value)}
                            className="h-10 text-sm font-semibold bg-white/80 dark:bg-slate-900/50 border-red-200 dark:border-red-800/40 rounded-xl focus:ring-red-500/30"
                          />
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/15 dark:to-cyan-900/10 rounded-2xl p-4 border border-blue-200/50 dark:border-blue-800/30">
                          <div className="flex items-center gap-2 mb-2.5">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
                              <Droplets className="h-4 w-4 text-blue-500" />
                            </div>
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Umidade %</span>
                          </div>
                          <Input
                            type="number" placeholder="ex: 65" min="0" max="100"
                            value={physicalParams.humidity || ""}
                            onChange={(e) => handlePhysicalParamChange("humidity", e.target.value)}
                            className="h-10 text-sm font-semibold bg-white/80 dark:bg-slate-900/50 border-blue-200 dark:border-blue-800/40 rounded-xl focus:ring-blue-500/30"
                          />
                        </div>
                        <div className="bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-900/15 dark:to-sky-900/10 rounded-2xl p-4 border border-cyan-200/50 dark:border-cyan-800/30">
                          <div className="flex items-center gap-2 mb-2.5">
                            <div className="p-1.5 bg-cyan-100 dark:bg-cyan-800/30 rounded-lg">
                              <Wind className="h-4 w-4 text-cyan-500" />
                            </div>
                            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">Vento km/h</span>
                          </div>
                          <Input
                            type="number" placeholder="ex: 10"
                            value={physicalParams.windSpeed || ""}
                            onChange={(e) => handlePhysicalParamChange("windSpeed", e.target.value)}
                            className="h-10 text-sm font-semibold bg-white/80 dark:bg-slate-900/50 border-cyan-200 dark:border-cyan-800/40 rounded-xl focus:ring-cyan-500/30"
                          />
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/15 dark:to-green-900/10 rounded-2xl p-4 border border-emerald-200/50 dark:border-emerald-800/30">
                          <div className="flex items-center gap-2 mb-2.5">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-800/30 rounded-lg">
                              <Leaf className="h-4 w-4 text-emerald-500" />
                            </div>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Vegetação</span>
                          </div>
                          <Select value={physicalParams.vegetation || ""} onValueChange={(v) => handlePhysicalParamChange("vegetation", v)}>
                            <SelectTrigger className="h-10 text-sm font-semibold bg-white/80 dark:bg-slate-900/50 border-emerald-200 dark:border-emerald-800/40 rounded-xl">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="densa">🌿 Densa</SelectItem>
                              <SelectItem value="moderada">🌱 Moderada</SelectItem>
                              <SelectItem value="esparsa">🍂 Esparsa</SelectItem>
                              <SelectItem value="nenhuma">🏜️ Nenhuma</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        Descrição Detalhada ✍️
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        Descreva o que observou com o máximo de detalhes
                      </p>
                      <Textarea
                        placeholder="Descreva o que você observou: contexto da situação, consequências potenciais, ações já tomadas..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-36 text-sm rounded-2xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/50 resize-none focus:ring-emerald-500/30"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <div className={`flex items-center gap-1.5 text-xs font-bold ${description.length >= 10 ? "text-emerald-500" : "text-gray-400"}`}>
                          {description.length >= 10 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleDot className="h-3.5 w-3.5" />}
                          {description.length >= 10 ? "Descrição OK ✓" : `Mínimo 10 caracteres`}
                        </div>
                        <span className="text-xs text-gray-400 font-mono">{description.length}/1000</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══ STEP 5: Revisão ═══ */}
                {step === 5 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        Revisão Final 📋
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Confira os dados antes de enviar o relatório
                      </p>
                    </div>

                    {/* Summary */}
                    <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-2xl p-5 border border-emerald-200/50 dark:border-emerald-800/30 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Tipo</p>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{currentType?.icon}</span>
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{currentType?.label}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Severidade</p>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{currentSeverity?.emoji}</span>
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{currentSeverity?.label}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Localização</p>
                          <p className="text-sm font-mono font-bold text-gray-700 dark:text-gray-300">
                            {latitude.toFixed(4)}, {longitude.toFixed(4)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Fotos</p>
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                            📷 {photoPreviews.length} arquivo(s)
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Descrição</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-slate-800/40 p-3 rounded-xl leading-relaxed">
                          {description}
                        </p>
                      </div>

                      {Object.values(physicalParams).some((v) => v) && (
                        <div>
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Parâmetros</p>
                          <div className="flex flex-wrap gap-2">
                            {physicalParams.temperature && (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-bold">
                                🌡️ {physicalParams.temperature}°C
                              </span>
                            )}
                            {physicalParams.humidity && (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold">
                                💧 {physicalParams.humidity}%
                              </span>
                            )}
                            {physicalParams.windSpeed && (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-100 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 text-xs font-bold">
                                💨 {physicalParams.windSpeed} km/h
                              </span>
                            )}
                            {physicalParams.vegetation && (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-bold">
                                🌿 {physicalParams.vegetation}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quality checklist */}
                    <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-3">
                        <Shield className="h-4 w-4 text-emerald-500" />
                        Checklist de Qualidade
                      </h4>
                      <div className="space-y-2">
                        {[
                          { ok: description.length >= 10, label: "Descrição com mínimo 10 caracteres", required: true },
                          { ok: severity !== "critical" || photoPreviews.length > 0, label: "Fotos para severidade crítica", required: severity === "critical", critical: severity === "critical" && photoPreviews.length === 0 },
                          { ok: photoPreviews.length > 0, label: "Evidências fotográficas adicionadas", required: false },
                          { ok: Object.values(physicalParams).some((v) => v), label: "Dados ambientais preenchidos", required: false },
                        ].map((item, i) => (
                          <div key={i} className={`flex items-center gap-2.5 p-2 rounded-xl ${item.ok ? "bg-emerald-50 dark:bg-emerald-900/10" : item.critical ? "bg-red-50 dark:bg-red-900/10" : ""}`}>
                            {item.ok ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            ) : item.critical ? (
                              <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                            ) : (
                              <CircleDot className="h-4 w-4 text-gray-300 flex-shrink-0" />
                            )}
                            <span className={`text-xs font-semibold ${
                              item.ok ? "text-emerald-700 dark:text-emerald-300" :
                              item.critical ? "text-red-600 dark:text-red-400" :
                              "text-gray-400"
                            }`}>
                              {item.label}
                              {!item.required && !item.ok && <span className="ml-1 text-gray-400">(opcional)</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══ Navigation ═══ */}
                <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(Math.max(1, step - 1))}
                    disabled={step === 1}
                    className="flex-1 h-12 rounded-2xl text-sm font-bold border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>

                  {step < 5 ? (
                    <Button
                      type="button"
                      onClick={() => {
                        if (step === 1 && !selectedType) { toast.error("Selecione o tipo de ocorrência"); return; }
                        if (step === 2 && (!latitude || !longitude)) { toast.error("Defina a localização"); return; }
                        if (step === 4 && description.trim().length < 10) { toast.error("Descrição muito curta (mínimo 10 caracteres)"); return; }
                        setStep(Math.min(5, step + 1));
                      }}
                      className="flex-1 h-12 rounded-2xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5"
                    >
                      Próximo
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 h-12 rounded-2xl text-sm font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5 mr-2" />
                          Enviar Relatório (+10 pts)
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
