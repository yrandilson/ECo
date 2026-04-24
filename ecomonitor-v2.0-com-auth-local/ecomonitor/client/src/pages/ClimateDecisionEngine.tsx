import { useState, useMemo } from "react";
import {
  Sprout, Sun, Cloud, CloudRain, Droplets, ThermometerSun, Wind,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Calendar,
  MapPin, Target, Zap, BarChart3, Leaf, Wheat, Activity,
  ArrowUpRight, ArrowDownRight, Clock, Eye, Info,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";

// ─── Types ───────────────────────────────────────────────────────────

interface CropRecommendation {
  id: string;
  name: string;
  scientificName: string;
  icon: string;
  suitability: number; // 0-100
  plantWindow: string;
  harvestWindow: string;
  irrigationMm: number;
  yieldEstimate: string;
  riskLevel: "low" | "moderate" | "high";
  reason: string;
}

interface SoilProfile {
  type: string;
  ph: number;
  organicMatter: number; // %
  nitrogen: number; // mg/kg
  phosphorus: number; // mg/kg
  potassium: number; // mg/kg
  waterRetention: number; // mm/m
  texture: string;
}

interface WeatherForecast {
  day: string;
  tempMax: number;
  tempMin: number;
  humidity: number;
  rain: number;
  icon: string;
}

interface RiskAlert {
  type: "drought" | "frost" | "flood" | "pest" | "heat";
  severity: "low" | "moderate" | "high" | "critical";
  title: string;
  description: string;
  probability: number;
  recommendation: string;
}

// ─── Constants ───────────────────────────────────────────────────────

const REGIONS = [
  { id: "ne_semiarido", name: "Semiárido Nordestino", lat: -9.5, lng: -38.5, climate: "BSh (Köppen)", rainfall: 550 },
  { id: "se_cerrado", name: "Cerrado — Triângulo Mineiro", lat: -19.0, lng: -48.0, climate: "Aw (Köppen)", rainfall: 1450 },
  { id: "s_subtropical", name: "Subtropical — Norte PR", lat: -23.3, lng: -51.2, climate: "Cfa (Köppen)", rainfall: 1600 },
  { id: "ne_agreste", name: "Agreste — Pernambuco", lat: -8.3, lng: -36.4, climate: "As (Köppen)", rainfall: 780 },
  { id: "n_amazonia", name: "Amazônia — Rondônia", lat: -10.8, lng: -62.2, climate: "Am (Köppen)", rainfall: 2100 },
];

const CROPS: CropRecommendation[] = [
  { id: "cr1", name: "Feijão-caupi", scientificName: "Vigna unguiculata", icon: "🫘", suitability: 92, plantWindow: "15 Abr – 10 Mai 2026", harvestWindow: "Jul – Ago 2026", irrigationMm: 4.2, yieldEstimate: "800-1200 kg/ha", riskLevel: "low", reason: "Tolerante à seca, ciclo curto (70d), ideal para semiárido com chuvas de outono" },
  { id: "cr2", name: "Sorgo granífero", scientificName: "Sorghum bicolor", icon: "🌾", suitability: 87, plantWindow: "01 Mar – 15 Mar 2026", harvestWindow: "Jun – Jul 2026", irrigationMm: 3.8, yieldEstimate: "2000-3500 kg/ha", riskLevel: "low", reason: "Alta tolerância hídrica, sistema radicular profundo, boa relação custo-benefício" },
  { id: "cr3", name: "Palma forrageira", scientificName: "Opuntia ficus-indica", icon: "🌵", suitability: 95, plantWindow: "Ano todo", harvestWindow: "12-18 meses", irrigationMm: 0.5, yieldEstimate: "40-80 t/ha (massa verde)", riskLevel: "low", reason: "CAM fotossíntese — mínima necessidade hídrica, ideal para pecuária no semiárido" },
  { id: "cr4", name: "Milho (BRS Caatingueiro)", scientificName: "Zea mays", icon: "🌽", suitability: 58, plantWindow: "01 Fev – 28 Fev 2026", harvestWindow: "Mai – Jun 2026", irrigationMm: 5.5, yieldEstimate: "1500-2500 kg/ha", riskLevel: "high", reason: "Variedade adaptada, mas risco alto em ano de El Niño — precipitação abaixo da média" },
  { id: "cr5", name: "Mandioca", scientificName: "Manihot esculenta", icon: "🥔", suitability: 84, plantWindow: "Out – Nov 2026", harvestWindow: "8-12 meses", irrigationMm: 2.0, yieldEstimate: "15-25 t/ha", riskLevel: "moderate", reason: "Boa adaptação ao semiárido, mas ciclo longo exige planejamento de longo prazo" },
  { id: "cr6", name: "Algodão herbáceo", scientificName: "Gossypium hirsutum", icon: "☁️", suitability: 72, plantWindow: "Jan – Fev 2026", harvestWindow: "Jun – Jul 2026", irrigationMm: 4.8, yieldEstimate: "1800-2800 kg/ha", riskLevel: "moderate", reason: "Boa rentabilidade mas sensível a veranicos — monitorar precipitação quinzenal" },
];

const SOIL_PROFILE: SoilProfile = {
  type: "Latossolo Vermelho-Amarelo", ph: 5.8, organicMatter: 1.4,
  nitrogen: 22, phosphorus: 8, potassium: 85, waterRetention: 120,
  texture: "Franco-arenosa",
};

const FORECAST: WeatherForecast[] = [
  { day: "Seg", tempMax: 34, tempMin: 22, humidity: 45, rain: 0, icon: "☀️" },
  { day: "Ter", tempMax: 35, tempMin: 23, humidity: 42, rain: 0, icon: "☀️" },
  { day: "Qua", tempMax: 33, tempMin: 22, humidity: 55, rain: 2, icon: "⛅" },
  { day: "Qui", tempMax: 30, tempMin: 21, humidity: 68, rain: 15, icon: "🌧️" },
  { day: "Sex", tempMax: 28, tempMin: 20, humidity: 72, rain: 22, icon: "🌧️" },
  { day: "Sáb", tempMax: 31, tempMin: 21, humidity: 58, rain: 5, icon: "⛅" },
  { day: "Dom", tempMax: 33, tempMin: 22, humidity: 48, rain: 0, icon: "☀️" },
];

const RISK_ALERTS: RiskAlert[] = [
  { type: "drought", severity: "high", title: "Veranico detectado — 18 dias sem chuva", description: "Modelo CPTEC indica precipitação abaixo de 5mm nos próximos 12 dias. Reserva hídrica do solo a 28%.", probability: 78, recommendation: "Adiar plantio de milho. Priorizar palma forrageira e feijão-caupi irrigado." },
  { type: "heat", severity: "moderate", title: "Onda de calor — 5 dias acima de 36°C", description: "Temperaturas máximas projetadas entre 36-38°C. Evapotranspiração elevada.", probability: 65, recommendation: "Aumentar irrigação em 30%. Aplicar cobertura morta (mulching)." },
  { type: "pest", severity: "low", title: "Monitorar lagarta-do-cartucho", description: "Condições climáticas favoráveis a Spodoptera frugiperda. Sem foco confirmado na região.", probability: 35, recommendation: "Instalar armadilhas com feromônio. Planejar MIP preventivo." },
];

const SEVERITY_COLORS = {
  low: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20",
  moderate: "text-amber-600 bg-amber-50 dark:bg-amber-950/20",
  high: "text-orange-600 bg-orange-50 dark:bg-orange-950/20",
  critical: "text-red-600 bg-red-50 dark:bg-red-950/20",
};

// ─── Main Component ──────────────────────────────────────────────────

export default function ClimateDecisionEngine() {
  const [selectedRegion, setSelectedRegion] = useState("ne_semiarido");
  const region = REGIONS.find(r => r.id === selectedRegion)!;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto pb-12 space-y-6">
        {/* Hero */}
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-yellow-700 via-orange-700 to-red-700 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <Sprout className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Motor de Decisão Climática</h1>
              <p className="text-orange-100 text-sm">Recomendações preditivas para pequenos produtores — O que, quando e quanto plantar</p>
            </div>
          </div>
        </div>

        {/* Region Selector */}
        <div className="flex flex-wrap gap-2">
          {REGIONS.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRegion(r.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedRegion === r.id
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              }`}
            >
              📍 {r.name}
            </button>
          ))}
        </div>

        {/* Weather + Soil */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* 7-day forecast */}
          <div className="md:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Cloud className="h-4 w-4 text-blue-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Previsão 7 Dias — {region.name}</span>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {FORECAST.map(f => (
                <div key={f.day} className="text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <div className="text-[10px] font-bold text-slate-500">{f.day}</div>
                  <div className="text-xl my-1">{f.icon}</div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{f.tempMax}°</div>
                  <div className="text-[10px] text-slate-400">{f.tempMin}°</div>
                  {f.rain > 0 && <div className="text-[9px] text-blue-500 font-bold mt-0.5">{f.rain}mm</div>}
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-4 text-[9px] text-slate-400">
              <span>📍 {region.lat}°S, {Math.abs(region.lng)}°W</span>
              <span>🌧️ Precipitação anual: {region.rainfall}mm</span>
              <span>🌡️ Köppen: {region.climate}</span>
            </div>
          </div>

          {/* Soil Profile */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Leaf className="h-4 w-4 text-amber-600" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Perfil do Solo</span>
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-3">{SOIL_PROFILE.type}</div>
            <div className="space-y-2">
              {[
                { label: "pH", value: SOIL_PROFILE.ph.toFixed(1), ideal: "5.5-6.5", ok: SOIL_PROFILE.ph >= 5.5 },
                { label: "Mat. Orgânica", value: `${SOIL_PROFILE.organicMatter}%`, ideal: ">2.5%", ok: SOIL_PROFILE.organicMatter >= 2.5 },
                { label: "Nitrogênio", value: `${SOIL_PROFILE.nitrogen} mg/kg`, ideal: ">30", ok: SOIL_PROFILE.nitrogen >= 30 },
                { label: "Fósforo", value: `${SOIL_PROFILE.phosphorus} mg/kg`, ideal: ">12", ok: SOIL_PROFILE.phosphorus >= 12 },
                { label: "Potássio", value: `${SOIL_PROFILE.potassium} mg/kg`, ideal: ">60", ok: SOIL_PROFILE.potassium >= 60 },
                { label: "Retenção Hídrica", value: `${SOIL_PROFILE.waterRetention} mm/m`, ideal: ">150", ok: SOIL_PROFILE.waterRetention >= 150 },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">{s.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{s.value}</span>
                    {s.ok ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <AlertTriangle className="h-3 w-3 text-amber-500" />}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[8px] text-slate-400">Textura: {SOIL_PROFILE.texture}</div>
          </div>
        </div>

        {/* Risk Alerts */}
        <div className="space-y-2">
          {RISK_ALERTS.map((alert, i) => (
            <div key={i} className={`p-4 rounded-xl border ${
              alert.severity === "high" ? "border-orange-200 dark:border-orange-800/40 bg-orange-50/50 dark:bg-orange-950/10" :
              alert.severity === "moderate" ? "border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/10" :
              "border-slate-200/60 dark:border-white/5"
            }`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${
                  alert.severity === "high" ? "text-orange-500" : alert.severity === "moderate" ? "text-amber-500" : "text-slate-400"
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{alert.title}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${SEVERITY_COLORS[alert.severity]}`}>
                      {alert.probability}% probabilidade
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-1">{alert.description}</p>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    💡 {alert.recommendation}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Crop Recommendations */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Wheat className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Recomendações de Plantio — IA</h2>
            <div className="flex-1" />
            <span className="text-[9px] text-slate-400 font-bold">Ordenado por aptidão</span>
          </div>
          <div className="space-y-3">
            {CROPS.sort((a, b) => b.suitability - a.suitability).map(crop => (
              <div key={crop.id} className="p-4 rounded-xl border border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{crop.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{crop.name}</span>
                      <span className="text-[9px] text-slate-400 italic">{crop.scientificName}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${SEVERITY_COLORS[crop.riskLevel]}`}>
                        Risco {crop.riskLevel === "low" ? "Baixo" : crop.riskLevel === "moderate" ? "Médio" : "Alto"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mb-2">{crop.reason}</p>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-center">
                        <div className="text-[8px] text-slate-400">Plantio</div>
                        <div className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{crop.plantWindow}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-center">
                        <div className="text-[8px] text-slate-400">Colheita</div>
                        <div className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{crop.harvestWindow}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-center">
                        <div className="text-[8px] text-slate-400">Irrigação</div>
                        <div className="text-[10px] font-bold text-blue-600">{crop.irrigationMm} mm/dia</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-center">
                        <div className="text-[8px] text-slate-400">Produtividade</div>
                        <div className="text-[10px] font-bold text-emerald-600">{crop.yieldEstimate}</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <div className={`text-2xl font-black ${crop.suitability >= 80 ? "text-emerald-600" : crop.suitability >= 60 ? "text-amber-600" : "text-red-600"}`}>
                      {crop.suitability}
                    </div>
                    <div className="text-[8px] text-slate-400">aptidão</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Methodology */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">Modelos e Fontes de Dados</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold text-orange-600 mb-1">Balanço Hídrico (Thornthwaite-Mather)</div>
              <div className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                ETp = 16 × (10 × T_m / I)^a × (N/12) × (d/30)
              </div>
              <div className="text-[9px] text-slate-400 mt-1">Evapotranspiração potencial para cálculo de deficit hídrico.</div>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold text-blue-600 mb-1">Aptidão Agroclimática</div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Score = f(precipitação, temp, solo, ETP, fotoperíodo, risco)
              </div>
              <div className="text-[9px] text-slate-400 mt-1">EMBRAPA Zoneamento Agrícola de Risco Climático (ZARC).</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {["CPTEC/INPE", "EMBRAPA ZARC", "INMET", "ANA", "Thornthwaite (1948)", "FAO Penman-Monteith", "IBGE Censo Agro"].map(ref => (
              <span key={ref} className="text-[8px] font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-500 border border-slate-200 dark:border-slate-700">{ref}</span>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
