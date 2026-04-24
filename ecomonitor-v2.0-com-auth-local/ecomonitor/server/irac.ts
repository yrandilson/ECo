/**
 * ═══════════════════════════════════════════════════════════════
 * IRAC — Índice de Risco Ambiental Composto
 * ═══════════════════════════════════════════════════════════════
 * 
 * Indicador científico original do EcoMonitor que combina múltiplas
 * variáveis ambientais em um score unificado de risco (0–100).
 * 
 * ── Fórmula ────────────────────────────────────────────────────
 * 
 *   IRAC = Σ (wᵢ × fᵢ(xᵢ))
 * 
 * Onde:
 *   wᵢ = peso do componente i
 *   fᵢ = função de normalização do componente i
 *   xᵢ = valor bruto da variável ambiental
 * 
 * ── Componentes ────────────────────────────────────────────────
 * 
 *   T  (Térmico)      → Baseado na temperatura e anomalia térmica
 *   H  (Hídrico)      → Baseado na umidade relativa e déficit hídrico
 *   W  (Eólico)       → Baseado na velocidade e rajadas de vento
 *   V  (Vegetação)    → Baseado no NDVI (Normalized Difference Vegetation Index)
 *   D  (Densidade)    → Baseado na densidade histórica de ocorrências na região
 *   S  (Sazonal)      → Fator de ajuste sazonal (período de seca/chuva)
 * 
 * ── Classificação ──────────────────────────────────────────────
 * 
 *   0–20   → Muito Baixo  (verde)
 *   21–40  → Baixo        (azul)
 *   41–60  → Moderado     (amarelo)
 *   61–80  → Alto         (laranja)
 *   81–100 → Crítico      (vermelho)
 * 
 * ── Base Científica ────────────────────────────────────────────
 * 
 *   - Componente T: Modelo de estresse térmico de Arrhenius
 *   - Componente H: Equação de Penman-Monteith para evapotranspiração
 *   - Componente W: Modelo de dispersão eólica de Rothermel
 *   - Componente V: Threshold de NDVI do MODIS/Landsat
 *   - Componente D: Kernel Density Estimation (KDE)
 *   - Componente S: Modelo senoidal baseado em climatologia regional
 * 
 * Referências:
 *   [1] Arrhenius, S. (1889). On the reaction velocity of the inversion of cane sugar by acids.
 *   [2] Penman, H.L. (1948). Natural evaporation from open water, bare soil and grass.
 *   [3] Rothermel, R.C. (1972). A mathematical model for predicting fire spread in wildland fuels.
 *   [4] Rouse, J.W. et al. (1974). Monitoring vegetation systems in the Great Plains with ERTS.
 * 
 * @author EcoMonitor Research Team
 */

// ─── Tipos ──────────────────────────────────────────────────────

/** Dados de entrada para cálculo do IRAC */
export interface IracInput {
  /** Temperatura do ar em °C */
  temperature: number;
  /** Umidade relativa do ar em % (0–100) */
  humidity: number;
  /** Velocidade do vento em km/h */
  windSpeed: number;
  /** Índice NDVI (-1 a 1). Se indisponível, usa estimativa por bioma */
  ndvi?: number;
  /** Número de ocorrências recentes na região (raio de 50km, últimos 30 dias) */
  occurrenceDensity: number;
  /** Mês do ano (1–12) para cálculo sazonal */
  month: number;
  /** Latitude para ajuste hemisférico */
  latitude: number;
  /** Precipitação acumulada nos últimos 7 dias em mm (opcional) */
  precipitation7d?: number;
}

/** Resultado detalhado do cálculo IRAC */
export interface IracResult {
  /** Score final composto (0–100) */
  score: number;
  /** Classificação textual do risco */
  level: "muito_baixo" | "baixo" | "moderado" | "alto" | "critico";
  /** Cor associada ao nível de risco */
  color: string;
  /** Ícone sugerido */
  icon: string;
  /** Scores individuais de cada componente (0–100) */
  components: {
    thermal: number;
    hydric: number;
    wind: number;
    vegetation: number;
    density: number;
    seasonal: number;
  };
  /** Pesos utilizados */
  weights: typeof DEFAULT_WEIGHTS;
  /** Fator de risco dominante */
  dominantFactor: string;
  /** Recomendação textual */
  recommendation: string;
  /** Timestamp do cálculo */
  calculatedAt: string;
}

// ─── Pesos Default ──────────────────────────────────────────────
const DEFAULT_WEIGHTS = {
  thermal: 0.22,
  hydric: 0.22,
  wind: 0.15,
  vegetation: 0.18,
  density: 0.15,
  seasonal: 0.08,
} as const;

// Validação: soma dos pesos = 1.0
const WEIGHT_SUM = Object.values(DEFAULT_WEIGHTS).reduce((a, b) => a + b, 0);
if (Math.abs(WEIGHT_SUM - 1.0) > 0.001) {
  throw new Error(`IRAC: Soma dos pesos inválida (${WEIGHT_SUM}). Deve ser 1.0`);
}

// ─── Funções de Normalização por Componente ─────────────────────

/**
 * Componente Térmico (T)
 * Baseia-se no estresse térmico: temperaturas acima de 30°C aumentam
 * exponencialmente o risco (modelo Arrhenius simplificado).
 * 
 * Score 0 em T ≤ 15°C, crescimento logístico até 100 em T ≥ 45°C
 */
function calcThermal(temperature: number): number {
  if (temperature <= 15) return 0;
  if (temperature >= 45) return 100;

  // Curva sigmoide centrada em 30°C
  const midpoint = 30;
  const steepness = 0.25;
  const sigmoid = 1 / (1 + Math.exp(-steepness * (temperature - midpoint)));

  // Fator Arrhenius para não-linearidade em altas temperaturas
  const E_a = 50000; // Energia de ativação (J/mol)
  const R = 8.314;   // Constante dos gases
  const T_K = temperature + 273.15;
  const T_ref = 288.15; // 15°C referência
  const arrhenius = Math.exp((-E_a / R) * (1 / T_K - 1 / T_ref));
  const arrheniusNorm = Math.min(1, arrhenius * 2);

  return Math.min(100, (sigmoid * 0.6 + arrheniusNorm * 0.4) * 100);
}

/**
 * Componente Hídrico (H)
 * Quanto MENOR a umidade, MAIOR o risco.
 * Incorpora o déficit de saturação (vapor pressure deficit).
 */
function calcHydric(humidity: number, temperature: number, precipitation7d?: number): number {
  // Déficit hídrico básico
  const humidityRisk = Math.max(0, (100 - humidity) / 100);

  // Vapor Pressure Deficit (VPD) — Penman
  const saturatedVP = 0.6108 * Math.exp((17.27 * temperature) / (temperature + 237.3));
  const actualVP = saturatedVP * (humidity / 100);
  const vpd = saturatedVP - actualVP; // kPa
  const vpdNorm = Math.min(1, vpd / 4); // Normalizado (4 kPa = muito seco)

  // Fator de precipitação recente
  let precipFactor = 1.0;
  if (precipitation7d !== undefined) {
    precipFactor = Math.max(0.2, 1 - precipitation7d / 100); // 100mm em 7 dias = baixo risco
  }

  return Math.min(100, (humidityRisk * 0.4 + vpdNorm * 0.4 + precipFactor * 0.2) * 100);
}

/**
 * Componente Eólico (W)
 * Vento forte espalha fogo e poluentes.
 * Baseado no modelo de propagação eólica de Rothermel.
 */
function calcWind(windSpeed: number): number {
  if (windSpeed <= 5) return 5; // Vento calmo — risco mínimo
  if (windSpeed >= 80) return 100;

  // Modelo de Rothermel: impacto do vento cresce com o quadrado da velocidade
  const normalized = windSpeed / 80;
  const rothermelFactor = Math.pow(normalized, 1.5); // Não-linear

  return Math.min(100, rothermelFactor * 100);
}

/**
 * Componente Vegetação (V)
 * NDVI baixo indica vegetação seca/morta = maior risco.
 * NDVI alto indica vegetação saudável = menor risco de incêndio
 * (mas maior risco de desflorestamento se cair).
 */
function calcVegetation(ndvi?: number): number {
  if (ndvi === undefined || ndvi === null) return 50; // Sem dados = risco moderado

  // NDVI varia de -1 a 1
  // < 0.2 = solo exposto/água
  // 0.2-0.4 = vegetação rala/seca (ALTO RISCO)
  // 0.4-0.6 = vegetação moderada
  // > 0.6 = vegetação densa e saudável (BAIXO RISCO de incêndio)
  if (ndvi < 0.1) return 70; // Solo exposto — vulnerável
  if (ndvi > 0.7) return 10; // Vegetação densa — baixo risco

  // Curva invertida: menor NDVI = maior risco
  const riskCurve = Math.max(0, 1 - (ndvi - 0.1) / 0.6);

  return Math.min(100, riskCurve * 100);
}

/**
 * Componente Densidade (D)
 * Mais ocorrências históricas na área = maior risco atual.
 * Usa kernel density simplificado.
 */
function calcDensity(occurrenceDensity: number): number {
  if (occurrenceDensity <= 0) return 0;
  if (occurrenceDensity >= 20) return 100;

  // Crescimento logarítmico: muitas ocorrências indicam "hotspot"
  const logDensity = Math.log(occurrenceDensity + 1) / Math.log(21);

  return Math.min(100, logDensity * 100);
}

/**
 * Componente Sazonal (S)
 * Ajuste baseado na época do ano:
 * - Hemisfério Sul: seca de junho a outubro (maior risco)
 * - Hemisfério Norte: seca de dezembro a março
 * Modelo senoidal com período de 12 meses.
 */
function calcSeasonal(month: number, latitude: number): number {
  // Determinar hemisfério
  const isNorthern = latitude > 0;

  // Mês de pico de seca (risco máximo)
  // Sul: agosto (mês 8), Norte: fevereiro (mês 2)
  const peakMonth = isNorthern ? 2 : 8;

  // Modelo senoidal: pico no mês seco
  const phase = ((month - peakMonth) / 12) * 2 * Math.PI;
  const seasonalFactor = (Math.cos(phase) + 1) / 2; // 0–1

  return seasonalFactor * 100;
}

// ─── Cálculo Principal ──────────────────────────────────────────

/**
 * Calcula o Índice de Risco Ambiental Composto (IRAC)
 * 
 * @param input - Dados ambientais da região
 * @returns Resultado detalhado com score, componentes e recomendação
 */
export function calculateIRAC(input: IracInput): IracResult {
  // Calcular cada componente
  const components = {
    thermal: calcThermal(input.temperature),
    hydric: calcHydric(input.humidity, input.temperature, input.precipitation7d),
    wind: calcWind(input.windSpeed),
    vegetation: calcVegetation(input.ndvi),
    density: calcDensity(input.occurrenceDensity),
    seasonal: calcSeasonal(input.month, input.latitude),
  };

  // Score final ponderado
  const score = Math.min(100, Math.max(0,
    components.thermal * DEFAULT_WEIGHTS.thermal +
    components.hydric * DEFAULT_WEIGHTS.hydric +
    components.wind * DEFAULT_WEIGHTS.wind +
    components.vegetation * DEFAULT_WEIGHTS.vegetation +
    components.density * DEFAULT_WEIGHTS.density +
    components.seasonal * DEFAULT_WEIGHTS.seasonal
  ));

  // Classificação
  const { level, color, icon } = classifyRisk(score);

  // Fator dominante
  const componentEntries = Object.entries(components) as [string, number][];
  const dominantFactor = componentEntries.reduce((a, b) => 
    (a[1] * DEFAULT_WEIGHTS[a[0] as keyof typeof DEFAULT_WEIGHTS]) > 
    (b[1] * DEFAULT_WEIGHTS[b[0] as keyof typeof DEFAULT_WEIGHTS]) ? a : b
  )[0];

  // Recomendação
  const recommendation = generateRecommendation(score, level, dominantFactor, components);

  return {
    score: Math.round(score * 10) / 10,
    level,
    color,
    icon,
    components: {
      thermal: Math.round(components.thermal * 10) / 10,
      hydric: Math.round(components.hydric * 10) / 10,
      wind: Math.round(components.wind * 10) / 10,
      vegetation: Math.round(components.vegetation * 10) / 10,
      density: Math.round(components.density * 10) / 10,
      seasonal: Math.round(components.seasonal * 10) / 10,
    },
    weights: DEFAULT_WEIGHTS,
    dominantFactor,
    recommendation,
    calculatedAt: new Date().toISOString(),
  };
}

// ─── Classificação ──────────────────────────────────────────────

function classifyRisk(score: number): { level: IracResult["level"]; color: string; icon: string } {
  if (score <= 20) return { level: "muito_baixo", color: "#22c55e", icon: "🟢" };
  if (score <= 40) return { level: "baixo", color: "#3b82f6", icon: "🔵" };
  if (score <= 60) return { level: "moderado", color: "#eab308", icon: "🟡" };
  if (score <= 80) return { level: "alto", color: "#f97316", icon: "🟠" };
  return { level: "critico", color: "#ef4444", icon: "🔴" };
}

// ─── Recomendações ──────────────────────────────────────────────

const FACTOR_NAMES: Record<string, string> = {
  thermal: "Temperatura",
  hydric: "Umidade/Precipitação",
  wind: "Vento",
  vegetation: "Vegetação",
  density: "Histórico de Ocorrências",
  seasonal: "Fator Sazonal",
};

function generateRecommendation(
  score: number,
  level: IracResult["level"],
  dominantFactor: string,
  components: IracResult["components"]
): string {
  const factorName = FACTOR_NAMES[dominantFactor] || dominantFactor;

  switch (level) {
    case "muito_baixo":
      return "Condições ambientais estáveis. Monitoramento padrão recomendado.";

    case "baixo":
      return `Risco baixo. Fator de atenção: ${factorName}. Acompanhar evolução.`;

    case "moderado":
      return `Risco moderado — fator principal: ${factorName}. ` +
        "Recomenda-se intensificar o monitoramento e preparar equipes de resposta.";

    case "alto":
      if (components.thermal > 70 && components.hydric > 70) {
        return "⚠️ RISCO ALTO — Combinação de alta temperatura e baixa umidade. " +
          "Ativar protocolo de prevenção a incêndios. Alertar populações vulneráveis.";
      }
      return `⚠️ RISCO ALTO — Fator principal: ${factorName}. ` +
        "Recomenda-se alertar órgãos competentes e ativar plano de contingência.";

    case "critico":
      return "🚨 RISCO CRÍTICO — Condições ambientais extremas. " +
        "Acionar Defesa Civil e IBAMA imediatamente. " +
        "Evacuar áreas de risco se necessário. " +
        `Fator dominante: ${factorName} (${Math.round(components[dominantFactor as keyof typeof components])}/100).`;

    default:
      return "Monitoramento em andamento.";
  }
}

// ─── Cálculo rápido sem detalhes (para listas/mapas) ────────────

/**
 * Versão simplificada que retorna apenas score e nível.
 * Útil para renderizar muitos pontos no mapa.
 */
export function calculateIRACQuick(input: IracInput): { score: number; level: string; color: string } {
  const result = calculateIRAC(input);
  return { score: result.score, level: result.level, color: result.color };
}
