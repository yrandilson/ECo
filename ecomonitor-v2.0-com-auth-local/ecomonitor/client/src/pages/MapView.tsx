import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  AlertCircle,
  TrendingUp,
  Filter,
  X,
  Crosshair,
  Maximize,
  Minimize,
  Layers,
  Search,
  Clock,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Flame,
  Droplets,
  Wind,
  TreePine,
  CloudRain,
  Thermometer,
  HelpCircle,
  BarChart3,
  Navigation,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import HeatmapLayer from "@/components/HeatmapLayer";
import type { HeatmapPoint } from "@/components/HeatmapLayer";
import L from "leaflet";

// Import Leaflet and MarkerCluster CSS
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";

// ─── Constants ────────────────────────────────────────────────────────

const OCCURRENCE_TYPES = [
  { value: "fire", label: "Incêndio", icon: "🔥", color: "#ef4444", darkColor: "#dc2626" },
  { value: "water_pollution", label: "Poluição da Água", icon: "💧", color: "#3b82f6", darkColor: "#2563eb" },
  { value: "air_pollution", label: "Poluição do Ar", icon: "💨", color: "#8b5cf6", darkColor: "#7c3aed" },
  { value: "drought", label: "Seca", icon: "🏜️", color: "#f59e0b", darkColor: "#d97706" },
  { value: "deforestation", label: "Desmatamento", icon: "🌳", color: "#10b981", darkColor: "#059669" },
  { value: "flooding", label: "Enchente", icon: "🌊", color: "#06b6d4", darkColor: "#0891b2" },
  { value: "other", label: "Outro", icon: "❓", color: "#6b7280", darkColor: "#4b5563" },
];

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bgClass: string; ring: string }> = {
  low: { label: "Baixa", color: "#3b82f6", bgClass: "bg-blue-500", ring: "ring-blue-400/30" },
  medium: { label: "Média", color: "#f59e0b", bgClass: "bg-amber-500", ring: "ring-amber-400/30" },
  high: { label: "Alta", color: "#f97316", bgClass: "bg-orange-500", ring: "ring-orange-400/30" },
  critical: { label: "Crítica", color: "#ef4444", bgClass: "bg-red-500", ring: "ring-red-400/30" },
};

const TIME_FILTERS = [
  { value: "all", label: "Todos" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
];

const MAP_STYLES = [
  { id: "street", label: "Ruas", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attr: '&copy; OpenStreetMap' },
  { id: "satellite", label: "Satélite", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr: '&copy; Esri' },
  { id: "dark", label: "Escuro", url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attr: '&copy; CARTO' },
  { id: "topo", label: "Topográfico", url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", attr: '&copy; OpenTopoMap' },
];

// ─── Custom Marker Creator ───────────────────────────────────────────

function createStyledIcon(type: string, severity: string) {
  const typeConfig = OCCURRENCE_TYPES.find(t => t.value === type);
  const sevConfig = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.low;
  const icon = typeConfig?.icon || "❓";
  const isCritical = severity === "critical";

  return new L.DivIcon({
    html: `
      <div class="eco-marker ${isCritical ? 'eco-marker-critical' : ''}" style="--marker-color: ${sevConfig.color}">
        <div class="eco-marker-ring"></div>
        <div class="eco-marker-body">
          <span class="eco-marker-icon">${icon}</span>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
    className: "eco-custom-marker",
  });
}

// ─── Map Controller Sub-Components ───────────────────────────────────

function MapResizer({ isFullscreen }: { isFullscreen: boolean }) {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 300);
  }, [isFullscreen, map]);
  return null;
}

function FlyToLocation({ position, zoom }: { position: [number, number] | null; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom || 13, { duration: 1.2 });
    }
  }, [position, zoom, map]);
  return null;
}

function LocateUser({ onLocate }: { onLocate: (lat: number, lng: number) => void }) {
  const map = useMap();
  const handleLocate = useCallback(() => {
    map.locate({ setView: true, maxZoom: 14 });
  }, [map]);

  useMapEvents({
    locationfound(e) {
      onLocate(e.latlng.lat, e.latlng.lng);
    },
  });

  return (
    <button
      onClick={handleLocate}
      className="eco-map-btn"
      title="Minha localização"
    >
      <Navigation className="h-4 w-4" />
    </button>
  );
}

// ─── Search Geocoder ─────────────────────────────────────────────────

function useGeocoder() {
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (query: string): Promise<[number, number] | null> => {
    if (!query.trim()) return null;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=br&limit=1`,
        { headers: { "Accept-Language": "pt-BR" } }
      );
      const data = await res.json();
      if (data?.[0]) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lng || data[0].lon)];
      }
      return null;
    } catch {
      return null;
    } finally {
      setSearching(false);
    }
  }, []);

  return { search, searching };
}

// ─── Main Component ──────────────────────────────────────────────────

export default function MapView() {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [selectedOccurrence, setSelectedOccurrence] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [mapStyle, setMapStyle] = useState("street");
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const { search, searching } = useGeocoder();

  const { data: recentOccurrences, isLoading } = trpc.occurrences.getRecent.useQuery({ limit: 500 });

  // Time filtering
  const getTimeThreshold = useCallback((filter: string) => {
    const now = Date.now();
    switch (filter) {
      case "24h": return now - 24 * 60 * 60 * 1000;
      case "7d": return now - 7 * 24 * 60 * 60 * 1000;
      case "30d": return now - 30 * 24 * 60 * 60 * 1000;
      case "90d": return now - 90 * 24 * 60 * 60 * 1000;
      default: return 0;
    }
  }, []);

  const filteredOccurrences = useMemo(() => {
    if (!recentOccurrences) return [];
    const threshold = getTimeThreshold(timeFilter);
    return recentOccurrences.filter(occurrence => {
      const typeMatch = selectedType === "all" || occurrence.type === selectedType;
      const severityMatch = selectedSeverity === "all" || occurrence.severity === selectedSeverity;
      const timeMatch = timeFilter === "all" || new Date(occurrence.createdAt).getTime() >= threshold;
      return typeMatch && severityMatch && timeMatch;
    });
  }, [recentOccurrences, selectedType, selectedSeverity, timeFilter, getTimeThreshold]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: filteredOccurrences.length,
      critical: filteredOccurrences.filter(o => o.severity === "critical").length,
      high: filteredOccurrences.filter(o => o.severity === "high").length,
      validated: filteredOccurrences.filter(o => o.status === "validated").length,
    };
  }, [filteredOccurrences]);

  // IRAC Heatmap points — derive intensity from riskScore + severity
  const heatmapPoints: HeatmapPoint[] = useMemo(() => {
    if (!filteredOccurrences.length) return [];
    const severityBoost: Record<string, number> = {
      critical: 30, high: 15, medium: 5, low: 0,
    };
    return filteredOccurrences
      .filter(o => o.latitude && o.longitude)
      .map(o => {
        const base = Number(o.riskScore) || 40;
        const boost = severityBoost[o.severity] || 0;
        return {
          lat: Number(o.latitude),
          lng: Number(o.longitude),
          intensity: Math.min(100, base + boost),
        };
      });
  }, [filteredOccurrences]);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && mapRef.current) {
      mapRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Search
  const handleSearch = useCallback(async () => {
    const result = await search(searchQuery);
    if (result) {
      setFlyTo(result);
    }
  }, [search, searchQuery]);

  const currentMapStyle = MAP_STYLES.find(s => s.id === mapStyle) || MAP_STYLES[0];

  const formatType = (type: string) => {
    const config = OCCURRENCE_TYPES.find(t => t.value === type);
    return config ? `${config.icon} ${config.label}` : type;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <MainLayout>
      <div
        ref={mapRef}
        className={`relative ${isFullscreen ? "h-screen" : "h-[calc(100vh-7rem)]"} w-full rounded-xl overflow-hidden bg-slate-900`}
      >
        {/* The Map */}
        <MapContainer
          center={[-14.235, -51.9253]}
          zoom={4}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
          zoomControl={false}
          className="z-0"
        >
          <TileLayer
            key={mapStyle}
            attribution={currentMapStyle.attr}
            url={currentMapStyle.url}
          />
          <MapResizer isFullscreen={isFullscreen} />
          <FlyToLocation position={flyTo} />

          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
            spiderfyOnMaxZoom
            showCoverageOnHover={false}
            iconCreateFunction={(cluster: any) => {
              const count = cluster.getChildCount();
              let size = "small";
              let px = 36;
              if (count >= 50) { size = "large"; px = 48; }
              else if (count >= 10) { size = "medium"; px = 42; }
              return new L.DivIcon({
                html: `<div class="eco-cluster eco-cluster-${size}"><span>${count}</span></div>`,
                className: "eco-cluster-icon",
                iconSize: [px, px],
              });
            }}
          >
            {filteredOccurrences.map(occurrence => (
              <Marker
                key={occurrence.id}
                position={[Number(occurrence.latitude), Number(occurrence.longitude)]}
                icon={createStyledIcon(occurrence.type, occurrence.severity)}
                eventHandlers={{
                  click: () => setSelectedOccurrence(occurrence),
                }}
              >
                <Popup className="eco-popup" maxWidth={300} minWidth={240}>
                  <div className="p-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">
                        {OCCURRENCE_TYPES.find(t => t.value === occurrence.type)?.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-slate-800 capitalize truncate">
                          {occurrence.type.replace(/_/g, " ")}
                        </h3>
                        <p className="text-[11px] text-slate-500">{formatDate(occurrence.createdAt)}</p>
                      </div>
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${SEVERITY_CONFIG[occurrence.severity]?.bgClass || "bg-gray-400"}`} />
                    </div>
                    {occurrence.description && (
                      <p className="text-xs text-slate-600 mb-2 line-clamp-2">{occurrence.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Risco: {(Number(occurrence.riskScore) || 0).toFixed(0)}
                      </span>
                      <span>✓ {occurrence.communityValidations || 0}</span>
                      <span>✕ {occurrence.communityRejections || 0}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>

          {/* IRAC Heatmap Layer */}
          <HeatmapLayer
            points={heatmapPoints}
            visible={showHeatmap}
            radius={35}
            blur={25}
            maxZoom={14}
          />

          {/* Locate user button (inside the map) */}
          <div className="leaflet-top leaflet-right" style={{ top: 10, right: 10 }}>
            <div className="leaflet-control">
              <LocateUser onLocate={(lat, lng) => {
                setUserLocation([lat, lng]);
                setFlyTo([lat, lng]);
              }} />
            </div>
          </div>
        </MapContainer>

        {/* ─── Floating UI Overlays ──────────────────────────── */}

        {/* Top bar: Search + Time filter */}
        <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center gap-2 pointer-events-none">
          {/* Search bar */}
          <div className="pointer-events-auto flex items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-lg border border-slate-200/50 dark:border-white/10 overflow-hidden flex-1 max-w-md">
            <Search className="h-4 w-4 text-slate-400 ml-3 flex-shrink-0" />
            <Input
              placeholder="Buscar cidade, bairro..."
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="p-1.5 mr-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="h-3.5 w-3.5 text-slate-400" />
              </button>
            )}
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-3 h-10 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              {searching ? <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Ir"}
            </button>
          </div>

          {/* Time filter pills */}
          <div className="pointer-events-auto flex items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-lg border border-slate-200/50 dark:border-white/10 p-1 gap-0.5">
            {TIME_FILTERS.map(tf => (
              <button
                key={tf.value}
                onClick={() => setTimeFilter(tf.value)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  timeFilter === tf.value
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Left side: Controls */}
        <div className="absolute top-16 left-3 z-[1100] flex flex-col gap-1.5">
          {/* Filter toggle */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`eco-map-btn ${showFilters ? "eco-map-btn-active" : ""}`}
              title="Filtros"
            >
              <Filter className="h-4 w-4" />
            </button>

            {/* Filter Panel (attached to filter button) */}
            {showFilters && (
              <div className="absolute left-full ml-2 top-0 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-xl border border-slate-200/50 dark:border-white/10 p-4 animate-in slide-in-from-left-2 duration-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5" /> Filtros
                  </h3>
                  <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                    <X className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                      Tipo
                    </label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className="h-9 text-xs rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        {OCCURRENCE_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.icon} {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                      Severidade
                    </label>
                    <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                      <SelectTrigger className="h-9 text-xs rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full ${cfg.bgClass}`} />
                              {cfg.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {(selectedType !== "all" || selectedSeverity !== "all" || timeFilter !== "all") && (
                    <button
                      onClick={() => { setSelectedType("all"); setSelectedSeverity("all"); setTimeFilter("all"); }}
                      className="w-full text-xs text-red-500 hover:text-red-600 font-medium py-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Map style toggle */}
          <div className="relative">
            <button
              onClick={() => setShowStylePicker(!showStylePicker)}
              className={`eco-map-btn ${showStylePicker ? "eco-map-btn-active" : ""}`}
              title="Estilo do mapa"
            >
              <Layers className="h-4 w-4" />
            </button>
            {showStylePicker && (
              <div className="absolute left-full ml-2 top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-xl border border-slate-200/50 dark:border-white/10 p-1.5 min-w-[120px]">
                {MAP_STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => { setMapStyle(style.id); setShowStylePicker(false); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      mapStyle === style.id
                        ? "bg-emerald-500 text-white"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Legend toggle */}
          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`eco-map-btn ${showLegend ? "eco-map-btn-active" : ""}`}
            title={showLegend ? "Ocultar legenda" : "Mostrar legenda"}
          >
            {showLegend ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>

          {/* Heatmap toggle */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`eco-map-btn ${showHeatmap ? "eco-map-btn-active" : ""}`}
            title={showHeatmap ? "Ocultar heatmap IRAC" : "Mostrar heatmap de risco (IRAC)"}
          >
            <Thermometer className="h-4 w-4" />
          </button>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="eco-map-btn" title="Tela cheia">
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>

        {/* Bottom-left: Legend */}
        {showLegend && (
          <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-lg border border-slate-200/50 dark:border-white/10 p-3 animate-in fade-in duration-200">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Legenda</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {OCCURRENCE_TYPES.filter(t => t.value !== "other").map(t => (
                <div key={t.value} className="flex items-center gap-1.5">
                  <span className="text-xs">{t.icon}</span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300">{t.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-white/10">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Severidade</p>
              <div className="flex items-center gap-2">
                {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-1">
                    <span className={`h-2 w-2 rounded-full ${cfg.bgClass}`} />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{cfg.label}</span>
                  </div>
                ))}
              </div>
            </div>
            {showHeatmap && (
              <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-white/10">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Heatmap IRAC</p>
                <div className="flex items-center gap-0.5">
                  {[
                    { color: "bg-emerald-500", label: "Baixo" },
                    { color: "bg-lime-500", label: "" },
                    { color: "bg-yellow-500", label: "Médio" },
                    { color: "bg-orange-500", label: "" },
                    { color: "bg-red-500", label: "Alto" },
                    { color: "bg-red-900", label: "Crítico" },
                  ].map((g, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <span className={`h-2 w-4 ${g.color} ${i === 0 ? "rounded-l" : ""} ${i === 5 ? "rounded-r" : ""}`} />
                      {g.label && <span className="text-[8px] text-slate-400 mt-0.5">{g.label}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom-right: Stats */}
        <div className="absolute bottom-3 right-3 z-[1000] flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-lg border border-slate-200/50 dark:border-white/10 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{stats.total}</span>
            <span className="text-[10px] text-slate-500">total</span>
          </div>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-red-600 dark:text-red-400">{stats.critical}</span>
            <span className="text-[10px] text-slate-500">críticas</span>
          </div>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{stats.validated}</span>
            <span className="text-[10px] text-slate-500">validadas</span>
          </div>
        </div>

        {/* Right side: Occurrence Detail Panel */}
        {selectedOccurrence && (
          <div className="absolute top-16 right-3 z-[1000] w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-xl border border-slate-200/50 dark:border-white/10 overflow-hidden animate-in slide-in-from-right-2 duration-200">
            {/* Header */}
            <div className={`px-4 py-3 bg-gradient-to-r ${
              selectedOccurrence.severity === "critical" ? "from-red-500 to-rose-500" :
              selectedOccurrence.severity === "high" ? "from-orange-500 to-amber-500" :
              selectedOccurrence.severity === "medium" ? "from-amber-500 to-yellow-500" :
              "from-blue-500 to-cyan-500"
            } text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {OCCURRENCE_TYPES.find(t => t.value === selectedOccurrence.type)?.icon}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold capitalize">
                      {selectedOccurrence.type.replace(/_/g, " ")}
                    </h3>
                    <p className="text-[11px] text-white/70">
                      {formatDate(selectedOccurrence.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOccurrence(null)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={`text-[11px] ${SEVERITY_CONFIG[selectedOccurrence.severity]?.bgClass || "bg-gray-500"} text-white border-0`}>
                  {SEVERITY_CONFIG[selectedOccurrence.severity]?.label || "?"}
                </Badge>
                <Badge variant="outline" className="text-[11px] flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Risco: {(Number(selectedOccurrence.riskScore) || 0).toFixed(0)}%
                </Badge>
              </div>

              {selectedOccurrence.description && (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedOccurrence.description}
                </p>
              )}

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  <MapPin className="h-3 w-3" />
                  Coordenadas
                </div>
                <p className="text-xs font-mono text-slate-700 dark:text-slate-200">
                  {(Number(selectedOccurrence.latitude) || 0).toFixed(5)}, {(Number(selectedOccurrence.longitude) || 0).toFixed(5)}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {selectedOccurrence.communityValidations || 0} validações
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  {selectedOccurrence.communityRejections || 0} rejeições
                </span>
              </div>

              {selectedOccurrence.status && (
                <Badge
                  variant="outline"
                  className={`text-[11px] ${
                    selectedOccurrence.status === "validated"
                      ? "border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
                      : selectedOccurrence.status === "rejected"
                      ? "border-red-300 text-red-600 bg-red-50 dark:bg-red-950/30"
                      : "border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/30"
                  }`}
                >
                  {selectedOccurrence.status === "validated" ? "✓ Validada" :
                   selectedOccurrence.status === "rejected" ? "✕ Rejeitada" : "⏳ Pendente"}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-[1001] bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl px-5 py-3 shadow-xl">
              <span className="h-5 w-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Carregando ocorrências...</span>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
