/**
 * Serviço de Integração com NASA FIRMS (Fire Information and Resource Management System)
 * Fornece dados de satélite para validação de incêndios
 */

export interface FireDetection {
  latitude: number;
  longitude: number;
  brightness: number; // Radiância em W/m²/sr
  scan: number; // Tamanho do pixel
  track: number;
  acqDate: string; // Data de aquisição
  acqTime: string; // Hora de aquisição (UTC)
  satellite: string; // NOAA-20, Landsat-8, MODIS, etc
  confidence: number; // 0-100
  version: string;
  dayNight: "D" | "N"; // Day or Night
  type: number; // 0=presumed vegetation fire, 1=active volcano, 2=other static source, 3=offshore
}

export interface FireCluster {
  centerLat: number;
  centerLon: number;
  detections: FireDetection[];
  count: number;
  maxConfidence: number;
  avgConfidence: number;
  radius: number; // km
  lastDetection: string;
  severity: "low" | "medium" | "high" | "critical";
}

export interface NASAFIRMSResponse {
  latitude: number;
  longitude: number;
  radiusKm: number;
  detections: FireDetection[];
  clusters: FireCluster[];
  lastUpdated: string;
  dataSource: string;
}

/**
 * Classe para gerenciar requisições à NASA FIRMS API
 */
export class NASAFIRMSService {
  private apiKey: string;
  private baseUrl = "https://firms.modaps.eosdis.nasa.gov/api/area/csv";
  private cache: Map<string, { data: NASAFIRMSResponse; timestamp: number }> = new Map();
  private cacheDuration = 60 * 60 * 1000; // 1 hora

  constructor(apiKey: string) {
    if (!apiKey) {
      console.warn("[FIRMS] API key não fornecida. Usando dados simulados.");
    }
    this.apiKey = apiKey;
  }

  /**
   * Buscar detecções de fogo em uma região
   */
  async getFireDetections(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
    daysBack: number = 7
  ): Promise<NASAFIRMSResponse> {
    try {
      const cacheKey = `fires-${latitude}-${longitude}-${radiusKm}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      if (!this.apiKey) {
        return this.generateMockFireDetections(latitude, longitude, radiusKm);
      }

      // Usar MODIS (Moderate Resolution Imaging Spectroradiometer)
      const response = await fetch(
        `${this.baseUrl}/json/MODIS_NRT/${latitude},${longitude},${radiusKm}/${daysBack}/${this.apiKey}`
      );

      if (!response.ok) {
        console.error(`[FIRMS] Erro: ${response.status}`);
        return this.generateMockFireDetections(latitude, longitude, radiusKm);
      }

      const data = await response.json();
      const result = this.parseFireDetections(data, latitude, longitude, radiusKm);

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error("[FIRMS] Erro ao buscar detecções:", error);
      return this.generateMockFireDetections(latitude, longitude, radiusKm);
    }
  }

  /**
   * Buscar detecções VIIRS (resolução mais alta)
   */
  async getVIIRSDetections(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
    daysBack: number = 7
  ): Promise<NASAFIRMSResponse> {
    try {
      const cacheKey = `viirs-${latitude}-${longitude}-${radiusKm}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      if (!this.apiKey) {
        return this.generateMockFireDetections(latitude, longitude, radiusKm);
      }

      // VIIRS tem melhor resolução (375m vs 1km do MODIS)
      const response = await fetch(
        `${this.baseUrl}/json/VIIRS_NRTNH/${latitude},${longitude},${radiusKm}/${daysBack}/${this.apiKey}`
      );

      if (!response.ok) {
        console.error(`[FIRMS] Erro VIIRS: ${response.status}`);
        return this.generateMockFireDetections(latitude, longitude, radiusKm);
      }

      const data = await response.json();
      const result = this.parseFireDetections(data, latitude, longitude, radiusKm);

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error("[FIRMS] Erro ao buscar VIIRS:", error);
      return this.generateMockFireDetections(latitude, longitude, radiusKm);
    }
  }

  /**
   * Validar ocorrência contra dados de satélite
   */
  async validateOccurrence(
    latitude: number,
    longitude: number,
    occurrenceType: string,
    radiusKm: number = 5
  ): Promise<{
    isValidated: boolean;
    confidence: number;
    nearbyDetections: FireDetection[];
    message: string;
  }> {
    try {
      if (occurrenceType !== "fire") {
        return {
          isValidated: false,
          confidence: 0,
          nearbyDetections: [],
          message: "Validação por satélite disponível apenas para incêndios",
        };
      }

      const response = await this.getVIIRSDetections(latitude, longitude, radiusKm, 1);

      if (response.detections.length === 0) {
        return {
          isValidated: false,
          confidence: 0,
          nearbyDetections: [],
          message: "Nenhuma detecção de satélite próxima",
        };
      }

      // Encontrar detecções próximas
      const nearbyDetections = response.detections.filter(
        (d) => this.calculateDistance(latitude, longitude, d.latitude, d.longitude) <= radiusKm
      );

      if (nearbyDetections.length === 0) {
        return {
          isValidated: false,
          confidence: 0,
          nearbyDetections: [],
          message: "Nenhuma detecção de satélite no raio especificado",
        };
      }

      // Calcular confiança média
      const avgConfidence =
        nearbyDetections.reduce((sum, d) => sum + d.confidence, 0) / nearbyDetections.length;

      return {
        isValidated: avgConfidence >= 50,
        confidence: avgConfidence,
        nearbyDetections,
        message: `${nearbyDetections.length} detecções de satélite encontradas com ${avgConfidence.toFixed(0)}% de confiança`,
      };
    } catch (error) {
      console.error("[FIRMS] Erro ao validar ocorrência:", error);
      return {
        isValidated: false,
        confidence: 0,
        nearbyDetections: [],
        message: "Erro ao validar com satélite",
      };
    }
  }

  /**
   * Obter clusters de fogo (agrupamentos)
   */
  async getFireClusters(
    latitude: number,
    longitude: number,
    radiusKm: number = 50
  ): Promise<FireCluster[]> {
    try {
      const response = await this.getVIIRSDetections(latitude, longitude, radiusKm, 7);

      if (response.detections.length === 0) {
        return [];
      }

      // Agrupar detecções próximas (clustering simples)
      const clusters: FireCluster[] = [];
      const clusterRadius = 2; // km

      for (const detection of response.detections) {
        let foundCluster = false;

        for (const cluster of clusters) {
          const distance = this.calculateDistance(
            detection.latitude,
            detection.longitude,
            cluster.centerLat,
            cluster.centerLon
          );

          if (distance <= clusterRadius) {
            cluster.detections.push(detection);
            cluster.count++;
            cluster.maxConfidence = Math.max(cluster.maxConfidence, detection.confidence);
            cluster.avgConfidence =
              cluster.detections.reduce((sum, d) => sum + d.confidence, 0) / cluster.detections.length;
            cluster.lastDetection = detection.acqDate;
            foundCluster = true;
            break;
          }
        }

        if (!foundCluster) {
          clusters.push({
            centerLat: detection.latitude,
            centerLon: detection.longitude,
            detections: [detection],
            count: 1,
            maxConfidence: detection.confidence,
            avgConfidence: detection.confidence,
            radius: clusterRadius,
            lastDetection: detection.acqDate,
            severity: this.getSeverity(detection.confidence, detection.brightness),
          });
        }
      }

      return clusters.sort((a, b) => b.maxConfidence - a.maxConfidence);
    } catch (error) {
      console.error("[FIRMS] Erro ao agrupar clusters:", error);
      return [];
    }
  }

  /**
   * Parsear resposta da API
   */
  private parseFireDetections(
    data: any[],
    latitude: number,
    longitude: number,
    radiusKm: number
  ): NASAFIRMSResponse {
    const detections: FireDetection[] = data.map((item) => ({
      latitude: parseFloat(item.latitude),
      longitude: parseFloat(item.longitude),
      brightness: parseFloat(item.brightness),
      scan: parseFloat(item.scan),
      track: parseFloat(item.track),
      acqDate: item.acq_date,
      acqTime: item.acq_time,
      satellite: item.satellite,
      confidence: parseInt(item.confidence),
      version: item.version,
      dayNight: item.daynight,
      type: parseInt(item.type),
    }));

    // Agrupar em clusters
    const clusters = this.clusterDetections(detections);

    return {
      latitude,
      longitude,
      radiusKm,
      detections,
      clusters,
      lastUpdated: new Date().toISOString(),
      dataSource: "NASA FIRMS VIIRS",
    };
  }

  /**
   * Agrupar detecções em clusters
   */
  private clusterDetections(detections: FireDetection[]): FireCluster[] {
    const clusters: FireCluster[] = [];
    const clusterRadius = 2; // km

    for (const detection of detections) {
      let foundCluster = false;

      for (const cluster of clusters) {
        const distance = this.calculateDistance(
          detection.latitude,
          detection.longitude,
          cluster.centerLat,
          cluster.centerLon
        );

        if (distance <= clusterRadius) {
          cluster.detections.push(detection);
          cluster.count++;
          cluster.maxConfidence = Math.max(cluster.maxConfidence, detection.confidence);
          cluster.avgConfidence =
            cluster.detections.reduce((sum, d) => sum + d.confidence, 0) / cluster.detections.length;
          cluster.lastDetection = detection.acqDate;
          foundCluster = true;
          break;
        }
      }

      if (!foundCluster) {
        clusters.push({
          centerLat: detection.latitude,
          centerLon: detection.longitude,
          detections: [detection],
          count: 1,
          maxConfidence: detection.confidence,
          avgConfidence: detection.confidence,
          radius: clusterRadius,
          lastDetection: detection.acqDate,
          severity: this.getSeverity(detection.confidence, detection.brightness),
        });
      }
    }

    return clusters;
  }

  /**
   * Calcular distância entre dois pontos (Haversine)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Determinar severidade baseada em confiança e brilho
   */
  private getSeverity(confidence: number, brightness: number): "low" | "medium" | "high" | "critical" {
    if (confidence >= 80 && brightness >= 350) {
      return "critical";
    } else if (confidence >= 60 && brightness >= 300) {
      return "high";
    } else if (confidence >= 40 && brightness >= 250) {
      return "medium";
    }
    return "low";
  }

  /**
   * Gerenciar cache
   */
  private getFromCache(key: string): NASAFIRMSResponse | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: NASAFIRMSResponse): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Gerar detecções simuladas (fallback)
   */
  private generateMockFireDetections(
    latitude: number,
    longitude: number,
    radiusKm: number
  ): NASAFIRMSResponse {
    const detections: FireDetection[] = [];

    // Gerar 0-3 detecções aleatórias
    const count = Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const offsetLat = (Math.random() - 0.5) * (radiusKm / 111); // ~111 km por grau
      const offsetLon = (Math.random() - 0.5) * (radiusKm / 111);

      detections.push({
        latitude: latitude + offsetLat,
        longitude: longitude + offsetLon,
        brightness: 300 + Math.random() * 200,
        scan: 0.375,
        track: 0.375,
        acqDate: new Date().toISOString().split("T")[0],
        acqTime: String(Math.floor(Math.random() * 24)).padStart(2, "0") + "00",
        satellite: Math.random() > 0.5 ? "NOAA-20" : "Landsat-8",
        confidence: 50 + Math.random() * 50,
        version: "1.0",
        dayNight: Math.random() > 0.5 ? "D" : "N",
        type: 0,
      });
    }

    const clusters = this.clusterDetections(detections);

    return {
      latitude,
      longitude,
      radiusKm,
      detections,
      clusters,
      lastUpdated: new Date().toISOString(),
      dataSource: "Mock Data",
    };
  }
}

/**
 * Instância singleton do serviço
 */
let nasaFIRMSInstance: NASAFIRMSService | null = null;

export function getNASAFIRMSService(): NASAFIRMSService {
  if (!nasaFIRMSInstance) {
    const apiKey = process.env.NASA_FIRMS_API_KEY || "";
    nasaFIRMSInstance = new NASAFIRMSService(apiKey);
  }
  return nasaFIRMSInstance;
}
