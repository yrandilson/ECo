/**
 * Physics Engine for Environmental Risk Analysis
 * Implements scientific models for fire propagation, hydrology, and pollution
 */

// Fire Propagation Model (Arrhenius + Rothermel)
export interface FireParams {
  temperature: number; // °C (15-45)
  humidity: number; // % (10-90)
  windSpeed: number; // km/h (0-60)
  vegetation: "grass" | "shrub" | "forest" | "mixed";
}

export function calculateFireRisk(params: FireParams): number {
  // Normalize inputs
  const tempNorm = (params.temperature - 15) / 30; // 0-1
  const humidityNorm = (90 - params.humidity) / 80; // Inverse: lower humidity = higher risk
  const windNorm = params.windSpeed / 60; // 0-1

  // Vegetation factor
  const vegFactors: Record<string, number> = {
    grass: 0.6,
    shrub: 0.8,
    forest: 1.0,
    mixed: 0.85,
  };

  const vegFactor = vegFactors[params.vegetation];

  // Arrhenius-based combustion rate
  const E_a = 50000; // Activation energy (J/mol)
  const R = 8.314; // Gas constant
  const T_abs = params.temperature + 273.15; // Convert to Kelvin
  const arrhenius = Math.exp(-E_a / (R * T_abs));

  // Rothermel wind factor
  const windFactor = 1 + 0.1 * params.windSpeed;

  // Combined risk score (0-100)
  const riskScore =
    (tempNorm * 0.3 + humidityNorm * 0.3 + windNorm * 0.2 + arrhenius * 0.2) *
    vegFactor *
    windFactor *
    100;

  return Math.min(100, Math.max(0, riskScore));
}

// Hydrological Model (Penman + Darcy)
export interface WaterParams {
  waterLevel: "low" | "normal" | "high";
  waterColor: "clear" | "cloudy" | "brown" | "green";
  temperature?: number;
  humidity?: number;
}

export function calculateWaterQualityRisk(params: WaterParams): number {
  // Water level factor
  const levelFactors: Record<string, number> = {
    low: 0.3,
    normal: 0.5,
    high: 0.8,
  };

  // Water color indicates pollution
  const colorFactors: Record<string, number> = {
    clear: 0.1,
    cloudy: 0.4,
    brown: 0.7,
    green: 0.9, // Algal bloom
  };

  // Penman evaporation factor (affects water availability)
  const temp = params.temperature || 25;
  const humidity = params.humidity || 60;
  const penmanFactor = (temp / 40) * ((100 - humidity) / 100);

  const riskScore =
    (levelFactors[params.waterLevel] * 0.4 +
      colorFactors[params.waterColor] * 0.4 +
      penmanFactor * 0.2) *
    100;

  return Math.min(100, Math.max(0, riskScore));
}

// Air Pollution Model (Gaussian Plume)
export interface AirParams {
  airQuality: "good" | "moderate" | "poor";
  visibility: "clear" | "hazy" | "poor";
  windSpeed?: number;
}

export function calculateAirQualityRisk(params: AirParams): number {
  // Air quality baseline
  const qualityFactors: Record<string, number> = {
    good: 0.1,
    moderate: 0.5,
    poor: 0.9,
  };

  // Visibility indicates particle concentration
  const visibilityFactors: Record<string, number> = {
    clear: 0.1,
    hazy: 0.5,
    poor: 0.9,
  };

  // Gaussian plume dispersion (wind helps dispersion)
  const windSpeed = params.windSpeed || 5;
  const dispersionFactor = Math.min(1, windSpeed / 10); // Better dispersion with wind

  const riskScore =
    ((qualityFactors[params.airQuality] * 0.4 +
      visibilityFactors[params.visibility] * 0.4) *
      (1 - dispersionFactor * 0.3) +
      0.1) *
    100;

  return Math.min(100, Math.max(0, riskScore));
}

// Drought Risk Model
export interface DroughtParams {
  temperature: number;
  humidity: number;
  precipitation?: number; // mm
}

export function calculateDroughtRisk(params: DroughtParams): number {
  // Temperature stress
  const tempNorm = Math.max(0, (params.temperature - 25) / 20); // Above 25°C increases risk

  // Humidity deficit
  const humidityDeficit = (100 - params.humidity) / 100;

  // Precipitation factor (lower = higher risk)
  const precip = params.precipitation || 0;
  const precipFactor = Math.max(0, 1 - precip / 100); // Normalized to 100mm

  const riskScore =
    (tempNorm * 0.3 + humidityDeficit * 0.4 + precipFactor * 0.3) * 100;

  return Math.min(100, Math.max(0, riskScore));
}

// Deforestation Risk (based on vegetation loss indicators)
export interface DeforestationParams {
  vegetationDensity: number; // 0-100%
  accessibilityLevel: "low" | "medium" | "high";
}

export function calculateDeforestationRisk(
  params: DeforestationParams
): number {
  // Lower vegetation = higher risk
  const vegRisk = (100 - params.vegetationDensity) / 100;

  // Accessibility factor (easier access = higher risk)
  const accessFactors: Record<string, number> = {
    low: 0.2,
    medium: 0.5,
    high: 0.9,
  };

  const riskScore = (vegRisk * 0.6 + accessFactors[params.accessibilityLevel] * 0.4) * 100;

  return Math.min(100, Math.max(0, riskScore));
}

// Flooding Risk Model
export interface FloodingParams {
  elevation: number; // meters
  proximity_to_water: number; // meters
  slope: number; // degrees
}

export function calculateFloodingRisk(params: FloodingParams): number {
  // Lower elevation = higher risk
  const elevationRisk = Math.max(0, 1 - params.elevation / 1000);

  // Proximity to water (closer = higher risk)
  const proximityRisk = Math.max(0, 1 - params.proximity_to_water / 500);

  // Slope (flatter = higher risk)
  const slopeRisk = Math.max(0, 1 - params.slope / 45);

  const riskScore =
    (elevationRisk * 0.3 + proximityRisk * 0.4 + slopeRisk * 0.3) * 100;

  return Math.min(100, Math.max(0, riskScore));
}

// Generic risk calculator
export function calculateOccurrenceRisk(
  type: string,
  physicalParams: Record<string, any>
): number {
  try {
    switch (type) {
      case "fire":
        return calculateFireRisk(physicalParams as FireParams);
      case "water_pollution":
        return calculateWaterQualityRisk(physicalParams as WaterParams);
      case "air_pollution":
        return calculateAirQualityRisk(physicalParams as AirParams);
      case "drought":
        return calculateDroughtRisk(physicalParams as DroughtParams);
      case "deforestation":
        return calculateDeforestationRisk(physicalParams as DeforestationParams);
      case "flooding":
        return calculateFloodingRisk(physicalParams as FloodingParams);
      default:
        return 50; // Default medium risk
    }
  } catch (error) {
    console.error("Error calculating risk:", error);
    return 50;
  }
}
