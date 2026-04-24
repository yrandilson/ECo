/**
 * IracGauge — Componente visual do Índice de Risco Ambiental Composto
 * 
 * Exibe:
 *  - Gauge semicircular com ponteiro animado
 *  - Score numérico grande
 *  - Nível de risco com cor
 *  - Breakdown dos 6 componentes em barras
 *  - Recomendação textual
 */
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Thermometer, Droplets, Wind, Leaf, BarChart3, Calendar, AlertTriangle, Shield,
} from "lucide-react";

// ─── Tipos ──────────────────────────────────────────────────────
interface IracData {
  score: number;
  level: string;
  color: string;
  icon: string;
  components: {
    thermal: number;
    hydric: number;
    wind: number;
    vegetation: number;
    density: number;
    seasonal: number;
  };
  dominantFactor: string;
  recommendation: string;
  calculatedAt: string;
}

interface IracGaugeProps {
  data: IracData | null | undefined;
  loading?: boolean;
  compact?: boolean;
}

// ─── Labels e ícones ────────────────────────────────────────────
const COMPONENT_META = {
  thermal: { label: "Térmico", icon: Thermometer, color: "bg-red-500" },
  hydric: { label: "Hídrico", icon: Droplets, color: "bg-blue-500" },
  wind: { label: "Eólico", icon: Wind, color: "bg-gray-500" },
  vegetation: { label: "Vegetação", icon: Leaf, color: "bg-green-500" },
  density: { label: "Densidade", icon: BarChart3, color: "bg-purple-500" },
  seasonal: { label: "Sazonal", icon: Calendar, color: "bg-amber-500" },
};

const LEVEL_LABELS: Record<string, string> = {
  muito_baixo: "Muito Baixo",
  baixo: "Baixo",
  moderado: "Moderado",
  alto: "Alto",
  critico: "Crítico",
};

const LEVEL_BG: Record<string, string> = {
  muito_baixo: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  baixo: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  moderado: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  alto: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  critico: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

// ─── Componente Gauge SVG ───────────────────────────────────────
function GaugeMeter({ score, color }: { score: number; color: string }) {
  // Arco semicircular: de 180° a 0° (esquerda para direita)
  const radius = 80;
  const cx = 100;
  const cy = 95;
  const startAngle = Math.PI; // 180°
  const endAngle = 0;        // 0°
  const scoreAngle = startAngle - (score / 100) * Math.PI;

  // Calcular path do arco de fundo
  const bgArcEnd = { x: cx + radius * Math.cos(endAngle), y: cy - radius * Math.sin(endAngle) };
  const bgArcStart = { x: cx + radius * Math.cos(startAngle), y: cy - radius * Math.sin(startAngle) };

  // Posição do ponteiro
  const needleX = cx + (radius - 10) * Math.cos(scoreAngle);
  const needleY = cy - (radius - 10) * Math.sin(scoreAngle);

  // Gradiente de cores no arco
  const arcColors = [
    { offset: "0%", color: "#22c55e" },
    { offset: "25%", color: "#3b82f6" },
    { offset: "50%", color: "#eab308" },
    { offset: "75%", color: "#f97316" },
    { offset: "100%", color: "#ef4444" },
  ];

  return (
    <svg viewBox="0 0 200 115" className="w-full max-w-[240px] mx-auto">
      <defs>
        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          {arcColors.map((c) => (
            <stop key={c.offset} offset={c.offset} stopColor={c.color} />
          ))}
        </linearGradient>
      </defs>

      {/* Arco de fundo (cinza) */}
      <path
        d={`M ${bgArcStart.x} ${bgArcStart.y} A ${radius} ${radius} 0 0 1 ${bgArcEnd.x} ${bgArcEnd.y}`}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="12"
        strokeLinecap="round"
      />

      {/* Arco colorido (gradiente até o score) */}
      {score > 0 && (
        <path
          d={`M ${bgArcStart.x} ${bgArcStart.y} A ${radius} ${radius} 0 ${score > 50 ? 1 : 0} 1 ${cx + radius * Math.cos(scoreAngle)} ${cy - radius * Math.sin(scoreAngle)}`}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      )}

      {/* Ponteiro */}
      <circle
        cx={needleX}
        cy={needleY}
        r="6"
        fill={color}
        stroke="white"
        strokeWidth="2"
        className="transition-all duration-1000 ease-out drop-shadow-md"
      />

      {/* Score central */}
      <text x={cx} y={cy - 10} textAnchor="middle" className="text-3xl font-bold" fill={color} fontSize="32">
        {Math.round(score)}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#6b7280" fontSize="11">
        IRAC
      </text>

      {/* Labels de escala */}
      <text x="15" y="100" fill="#9ca3af" fontSize="9">0</text>
      <text x="90" y="8" fill="#9ca3af" fontSize="9">50</text>
      <text x="175" y="100" fill="#9ca3af" fontSize="9">100</text>
    </svg>
  );
}

// ─── Componente Principal ───────────────────────────────────────
export default function IracGauge({ data, loading, compact }: IracGaugeProps) {
  const components = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.components).map(([key, value]) => ({
      key,
      value: value as number,
      ...COMPONENT_META[key as keyof typeof COMPONENT_META],
    }));
  }, [data]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            IRAC — Índice de Risco Ambiental
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            IRAC — Índice de Risco Ambiental
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-gray-500">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Selecione uma localização para calcular o IRAC</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-white dark:bg-slate-800">
        <div className="text-2xl font-bold" style={{ color: data.color }}>
          {Math.round(data.score)}
        </div>
        <div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${LEVEL_BG[data.level] || ""}`}>
            {data.icon} {LEVEL_LABELS[data.level] || data.level}
          </span>
          <p className="text-xs text-gray-500 mt-0.5">IRAC</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-slate-800 dark:to-slate-700">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-600" />
          IRAC — Índice de Risco Ambiental Composto
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Gauge */}
        <div className="flex flex-col items-center">
          <GaugeMeter score={data.score} color={data.color} />
          <span className={`mt-2 px-3 py-1 rounded-full text-sm font-bold ${LEVEL_BG[data.level] || ""}`}>
            {data.icon} Risco {LEVEL_LABELS[data.level] || data.level}
          </span>
        </div>

        {/* Componentes */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Componentes</p>
          {components.map((comp) => {
            const Icon = comp.icon;
            const isDominant = comp.key === data.dominantFactor;
            return (
              <div key={comp.key} className={`flex items-center gap-2 ${isDominant ? "font-semibold" : ""}`}>
                <Icon className={`w-4 h-4 ${isDominant ? "text-red-500" : "text-gray-400"}`} />
                <span className="text-xs w-20 truncate">{comp.label}</span>
                <div className="flex-1">
                  <Progress value={comp.value} className="h-2" />
                </div>
                <span className="text-xs w-8 text-right tabular-nums">{Math.round(comp.value)}</span>
              </div>
            );
          })}
        </div>

        {/* Recomendação */}
        <div className={`p-3 rounded-lg text-sm border-l-4 ${
          data.level === "critico" ? "bg-red-50 dark:bg-red-900/20 border-red-500" :
          data.level === "alto" ? "bg-orange-50 dark:bg-orange-900/20 border-orange-500" :
          data.level === "moderado" ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500" :
          "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
        }`}>
          <p className="font-semibold text-xs mb-1">Recomendação</p>
          <p className="text-xs leading-relaxed">{data.recommendation}</p>
        </div>

        {/* Timestamp */}
        <p className="text-[10px] text-gray-400 text-right">
          Calculado em: {new Date(data.calculatedAt).toLocaleString("pt-BR")}
        </p>
      </CardContent>
    </Card>
  );
}
