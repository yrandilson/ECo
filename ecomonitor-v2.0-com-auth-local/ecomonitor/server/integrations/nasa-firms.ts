/**
 * NASA FIRMS (Fire Information for Resource Management System) Integration
 * Detecção de focos de calor e incêndios via satélite
 * Documentação: https://firms.modaps.eosdis.nasa.gov/api/
 */

import axios from 'axios';

const FIRMS_BASE_URL = 'https://firms.modaps.eosdis.nasa.gov/api';
const NASA_FIRMS_API_KEY = process.env.NASA_FIRMS_API_KEY || '';

export interface FireDetection {
  latitude: number;
  longitude: number;
  brightness: number; // Temperatura de brilho (K)
  scan: number; // Tamanho do pixel (km)
  track: number; // Tamanho do pixel (km)
  acquisitionDate: Date;
  acquisitionTime: string; // HHMM
  satellite: string; // MODIS, VIIRS, etc
  confidence: number; // 0-100
  version: string;
  brightT31: number; // Temperatura banda 31
  frp: number; // Fire Radiative Power (MW)
  dayNight: 'D' | 'N';
}

export interface ValidationResult {
  isValidated: boolean;
  confidence: number;
  nearestFire: FireDetection | null;
  distance: number; // metros
  timeDifference: number; // horas
  message: string;
}

/**
 * Cache de detecções de fogo (atualizado a cada 3 horas)
 */
const fireDetectionCache = new Map<string, { data: FireDetection[]; timestamp: number }>();
const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 horas

/**
 * Obter detecções de fogo em uma região (área ou ponto)
 * @param latitude - Latitude central
 * @param longitude - Longitude central
 * @param radius - Raio em km (padrão: 10km)
 * @param days - Número de dias para buscar (1-10, padrão: 1)
 */
export async function getFireDetections(
  latitude: number,
  longitude: number,
  radius: number = 10,
  days: number = 1
): Promise<FireDetection[]> {
  try {
    const cacheKey = `fires-${latitude}-${longitude}-${radius}-${days}`;
    const cached = fireDetectionCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('[NASA FIRMS] Usando detecções do cache');
      return cached.data;
    }

    // NASA FIRMS permite buscar por área ou país
    // Usar endpoint de área (mais preciso para validação)
    const response = await axios.get(`${FIRMS_BASE_URL}/area/csv/${NASA_FIRMS_API_KEY}/VIIRS_SNPP_NRT/${latitude},${longitude}/${days}`, {
      timeout: 10000,
    });

    // Parsear CSV
    const lines = response.data.split('\n');
    const headers = lines[0].split(',');
    const detections: FireDetection[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',');
      const data: any = {};
      
      headers.forEach((header: string, index: number) => {
        data[header.trim()] = values[index]?.trim();
      });

      // Filtrar por proximidade (raio)
      const fireLat = parseFloat(data.latitude);
      const fireLon = parseFloat(data.longitude);
      const distance = calculateDistance(latitude, longitude, fireLat, fireLon);

      if (distance <= radius * 1000) {
        const [year, month, day] = data.acq_date.split('-');
        const dateTime = new Date(`${year}-${month}-${day}T${data.acq_time.slice(0, 2)}:${data.acq_time.slice(2)}:00Z`);

        detections.push({
          latitude: fireLat,
          longitude: fireLon,
          brightness: parseFloat(data.brightness) || 0,
          scan: parseFloat(data.scan) || 0,
          track: parseFloat(data.track) || 0,
          acquisitionDate: dateTime,
          acquisitionTime: data.acq_time,
          satellite: data.satellite || 'VIIRS',
          confidence: parseFloat(data.confidence) || 0,
          version: data.version || '1.0',
          brightT31: parseFloat(data.bright_t31) || 0,
          frp: parseFloat(data.frp) || 0,
          dayNight: data.daynight as 'D' | 'N',
        });
      }
    }

    // Atualizar cache
    fireDetectionCache.set(cacheKey, { data: detections, timestamp: Date.now() });

    console.log(`[NASA FIRMS] Encontradas ${detections.length} detecções em raio de ${radius}km`);
    return detections;
  } catch (error) {
    console.error('[NASA FIRMS] Erro ao buscar detecções:', error);
    return [];
  }
}

/**
 * Validar se uma ocorrência de incêndio corresponde a uma detecção de satélite
 * @param latitude - Latitude da ocorrência
 * @param longitude - Longitude da ocorrência
 * @param occurrenceDate - Data/hora da ocorrência
 * @param radiusKm - Raio de busca em km (padrão: 5km)
 * @param timeWindowHours - Janela de tempo em horas (padrão: 24h)
 */
export async function validateFireOccurrence(
  latitude: number,
  longitude: number,
  occurrenceDate: Date,
  radiusKm: number = 5,
  timeWindowHours: number = 24
): Promise<ValidationResult> {
  try {
    // Buscar detecções nos últimos dias (baseado na janela de tempo)
    const daysToSearch = Math.ceil(timeWindowHours / 24);
    const detections = await getFireDetections(latitude, longitude, radiusKm * 2, daysToSearch);

    if (detections.length === 0) {
      return {
        isValidated: false,
        confidence: 0,
        nearestFire: null,
        distance: Infinity,
        timeDifference: Infinity,
        message: 'Nenhuma detecção de satélite encontrada na região.',
      };
    }

    // Encontrar a detecção mais próxima no tempo e espaço
    let nearestFire: FireDetection | null = null;
    let minScore = Infinity;
    let bestDistance = Infinity;
    let bestTimeDiff = Infinity;

    for (const detection of detections) {
      const distance = calculateDistance(
        latitude,
        longitude,
        detection.latitude,
        detection.longitude
      );

      const timeDiff = Math.abs(
        (occurrenceDate.getTime() - detection.acquisitionDate.getTime()) / (1000 * 60 * 60)
      );

      // Score combinado: distância (km) + diferença de tempo (horas)
      // Penalizar fortemente se fora da janela de tempo
      if (timeDiff > timeWindowHours) continue;
      if (distance > radiusKm * 1000) continue;

      const score = (distance / 1000) + timeDiff;

      if (score < minScore) {
        minScore = score;
        nearestFire = detection;
        bestDistance = distance;
        bestTimeDiff = timeDiff;
      }
    }

    if (!nearestFire) {
      return {
        isValidated: false,
        confidence: 0,
        nearestFire: null,
        distance: Infinity,
        timeDifference: Infinity,
        message: 'Nenhuma detecção dentro da janela de tempo e espaço.',
      };
    }

    // Calcular confiança da validação
    // - Distância menor = maior confiança
    // - Diferença de tempo menor = maior confiança
    // - Confiança do satélite alta = maior confiança

    const distanceConfidence = Math.max(0, 100 - (bestDistance / (radiusKm * 1000)) * 100);
    const timeConfidence = Math.max(0, 100 - (bestTimeDiff / timeWindowHours) * 100);
    const satelliteConfidence = nearestFire.confidence;

    const overallConfidence =
      distanceConfidence * 0.4 +
      timeConfidence * 0.3 +
      satelliteConfidence * 0.3;

    const isValidated = overallConfidence >= 60; // Threshold de 60%

    let message = '';
    if (isValidated) {
      message = `Validado por satélite ${nearestFire.satellite}! Confiança: ${overallConfidence.toFixed(0)}%. Distância: ${(bestDistance / 1000).toFixed(2)}km, Tempo: ${bestTimeDiff.toFixed(1)}h.`;
    } else {
      message = `Validação inconclusiva (${overallConfidence.toFixed(0)}%). Detecção mais próxima a ${(bestDistance / 1000).toFixed(2)}km, ${bestTimeDiff.toFixed(1)}h de diferença.`;
    }

    return {
      isValidated,
      confidence: Math.round(overallConfidence),
      nearestFire,
      distance: bestDistance,
      timeDifference: bestTimeDiff,
      message,
    };
  } catch (error) {
    console.error('[NASA FIRMS] Erro ao validar ocorrência:', error);
    return {
      isValidated: false,
      confidence: 0,
      nearestFire: null,
      distance: Infinity,
      timeDifference: Infinity,
      message: 'Erro ao validar com dados de satélite.',
    };
  }
}

/**
 * Obter estatísticas de incêndios em uma região
 */
export async function getFireStatistics(
  latitude: number,
  longitude: number,
  radiusKm: number = 50,
  days: number = 7
): Promise<{
  totalDetections: number;
  averageFRP: number; // Fire Radiative Power médio
  highConfidenceDetections: number;
  dayDetections: number;
  nightDetections: number;
  satellites: string[];
}> {
  try {
    const detections = await getFireDetections(latitude, longitude, radiusKm, days);

    const stats = {
      totalDetections: detections.length,
      averageFRP: detections.reduce((sum, d) => sum + d.frp, 0) / (detections.length || 1),
      highConfidenceDetections: detections.filter((d) => d.confidence >= 80).length,
      dayDetections: detections.filter((d) => d.dayNight === 'D').length,
      nightDetections: detections.filter((d) => d.dayNight === 'N').length,
      satellites: Array.from(new Set(detections.map((d) => d.satellite))),
    };

    return stats;
  } catch (error) {
    console.error('[NASA FIRMS] Erro ao calcular estatísticas:', error);
    return {
      totalDetections: 0,
      averageFRP: 0,
      highConfidenceDetections: 0,
      dayDetections: 0,
      nightDetections: 0,
      satellites: [],
    };
  }
}

/**
 * Calcular distância entre dois pontos (Haversine)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Raio da Terra em metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distância em metros
}

/**
 * Limpar cache
 */
export function clearFireDetectionCache(): void {
  fireDetectionCache.clear();
  console.log('[NASA FIRMS] Cache limpo');
}

/**
 * Verificar se a API está configurada
 */
export function isConfigured(): boolean {
  return Boolean(NASA_FIRMS_API_KEY && NASA_FIRMS_API_KEY.length > 0);
}

/**
 * Obter URL para visualização no mapa interativo do NASA FIRMS
 */
export function getFIRMSMapURL(latitude: number, longitude: number, zoom: number = 10): string {
  return `https://firms.modaps.eosdis.nasa.gov/map/#d:24hrs;@${longitude},${latitude},${zoom}z`;
}
