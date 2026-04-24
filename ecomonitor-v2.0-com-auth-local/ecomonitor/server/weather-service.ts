/**
 * Serviço de Integração com OpenWeatherMap API
 * Fornece dados meteorológicos reais para previsões de ML
 */

export interface WeatherData {
  temperature: number; // °C
  humidity: number; // %
  windSpeed: number; // m/s
  windGust: number; // m/s
  precipitation: number; // mm
  pressure: number; // hPa
  cloudiness: number; // %
  visibility: number; // m
  uvIndex: number;
  feelsLike: number; // °C
  dewPoint: number; // °C
  description: string;
  icon: string;
}

export interface WeatherForecast {
  date: string;
  data: WeatherData[];
  dayAverage: WeatherData;
  dayMax: WeatherData;
  dayMin: WeatherData;
}

export interface LocationWeather {
  latitude: number;
  longitude: number;
  location: string;
  timezone: string;
  current: WeatherData;
  forecast7days: WeatherForecast[];
  lastUpdated: string;
}

/**
 * Classe para gerenciar requisições à OpenWeatherMap API
 */
export class WeatherService {
  private apiKey: string;
  private baseUrl = "https://api.openweathermap.org";
  private cache: Map<string, { data: LocationWeather; timestamp: number }> = new Map();
  private cacheDuration = 30 * 60 * 1000; // 30 minutos

  constructor(apiKey: string) {
    if (!apiKey) {
      console.warn("[Weather] API key não fornecida. Usando dados simulados.");
    }
    this.apiKey = apiKey;
  }

  /**
   * Obter dados meteorológicos atuais
   */
  async getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData> {
    try {
      if (!this.apiKey) {
        return this.generateMockWeather();
      }

      const cacheKey = `current-${latitude}-${longitude}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached.current;
      }

      const response = await fetch(
        `${this.baseUrl}/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        console.error(`[Weather] Erro: ${response.status}`);
        return this.generateMockWeather();
      }

      const data = await response.json();
      return this.parseWeatherData(data);
    } catch (error) {
      console.error("[Weather] Erro ao buscar dados:", error);
      return this.generateMockWeather();
    }
  }

  /**
   * Obter previsão para 7 dias
   */
  async getForecast7Days(latitude: number, longitude: number): Promise<WeatherForecast[]> {
    try {
      if (!this.apiKey) {
        return this.generateMockForecast();
      }

      const cacheKey = `forecast-${latitude}-${longitude}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached.forecast7days;
      }

      // OpenWeatherMap One Call API (3.0)
      const response = await fetch(
        `${this.baseUrl}/data/3.0/onecall?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric&exclude=minutely,hourly,alerts`
      );

      if (!response.ok) {
        console.error(`[Weather] Erro: ${response.status}`);
        return this.generateMockForecast();
      }

      const data = await response.json();
      const forecast = this.parseForecast(data.daily || []);

      // Cachear resultado
      this.setCache(cacheKey, {
        current: this.parseWeatherData(data.current),
        forecast7days: forecast,
        latitude,
        longitude,
        location: `${latitude}, ${longitude}`,
        timezone: data.timezone,
        lastUpdated: new Date().toISOString(),
      });

      return forecast;
    } catch (error) {
      console.error("[Weather] Erro ao buscar previsão:", error);
      return this.generateMockForecast();
    }
  }

  /**
   * Obter dados completos de localização
   */
  async getLocationWeather(latitude: number, longitude: number): Promise<LocationWeather> {
    try {
      const cacheKey = `location-${latitude}-${longitude}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const current = await this.getCurrentWeather(latitude, longitude);
      const forecast = await this.getForecast7Days(latitude, longitude);

      // Obter nome da localização (reverse geocoding)
      const locationName = await this.reverseGeocode(latitude, longitude);

      const result: LocationWeather = {
        latitude,
        longitude,
        location: locationName,
        timezone: "America/Sao_Paulo",
        current,
        forecast7days: forecast,
        lastUpdated: new Date().toISOString(),
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error("[Weather] Erro ao buscar dados de localização:", error);
      throw error;
    }
  }

  /**
   * Obter histórico de 30 dias para ML
   */
  async getHistoricalData(latitude: number, longitude: number): Promise<{
    temperature: number[];
    humidity: number[];
    windSpeed: number[];
    precipitation: number[];
  }> {
    try {
      if (!this.apiKey) {
        return this.generateMockHistoricalData();
      }

      // OpenWeatherMap Historical Data (requer plano pago)
      // Para demonstração, retornar dados simulados
      console.warn("[Weather] Dados históricos requerem plano pago. Usando simulação.");
      return this.generateMockHistoricalData();
    } catch (error) {
      console.error("[Weather] Erro ao buscar dados históricos:", error);
      return this.generateMockHistoricalData();
    }
  }

  /**
   * Calcular índice de risco de incêndio baseado em dados reais
   */
  async calculateFireRiskIndex(latitude: number, longitude: number): Promise<number> {
    try {
      const weather = await this.getCurrentWeather(latitude, longitude);

      // Fórmula simplificada baseada em dados reais
      // Temperatura: 0-40 contribui para risco
      const tempFactor = Math.max(0, (weather.temperature - 10) / 30) * 40;

      // Umidade: quanto menor, maior o risco
      const humidityFactor = (100 - weather.humidity) / 100 * 30;

      // Vento: quanto maior, maior o risco
      const windFactor = Math.min(weather.windSpeed / 10, 1) * 20;

      // Precipitação: quanto menor, maior o risco
      const precipFactor = Math.max(0, 1 - weather.precipitation / 10) * 10;

      const riskIndex = tempFactor + humidityFactor + windFactor + precipFactor;

      return Math.min(100, Math.max(0, riskIndex));
    } catch (error) {
      console.error("[Weather] Erro ao calcular índice de risco:", error);
      return 50; // Valor padrão
    }
  }

  /**
   * Parsear dados meteorológicos da API
   */
  private parseWeatherData(data: any): WeatherData {
    return {
      temperature: data.main?.temp || 25,
      humidity: data.main?.humidity || 60,
      windSpeed: (data.wind?.speed || 5) * 3.6, // Converter m/s para km/h
      windGust: ((data.wind?.gust || 0) * 3.6),
      precipitation: data.rain?.["1h"] || 0,
      pressure: data.main?.pressure || 1013,
      cloudiness: data.clouds?.all || 0,
      visibility: data.visibility || 10000,
      uvIndex: data.uvi || 0,
      feelsLike: data.main?.feels_like || 25,
      dewPoint: this.calculateDewPoint(data.main?.temp || 25, data.main?.humidity || 60),
      description: data.weather?.[0]?.description || "Sem dados",
      icon: data.weather?.[0]?.icon || "01d",
    };
  }

  /**
   * Parsear previsão de 7 dias
   */
  private parseForecast(dailyData: any[]): WeatherForecast[] {
    return dailyData.slice(0, 7).map((day, index) => {
      const dayData = this.parseWeatherData(day);

      return {
        date: new Date(day.dt * 1000).toISOString().split("T")[0],
        data: [dayData], // Simplificado para 1 ponto por dia
        dayAverage: dayData,
        dayMax: {
          ...dayData,
          temperature: day.main?.temp_max || dayData.temperature,
        },
        dayMin: {
          ...dayData,
          temperature: day.main?.temp_min || dayData.temperature,
        },
      };
    });
  }

  /**
   * Reverse geocoding (lat/lon para nome de localização)
   */
  private async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      if (!this.apiKey) {
        return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }

      const response = await fetch(
        `${this.baseUrl}/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${this.apiKey}`
      );

      if (!response.ok) {
        return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }

      const data = await response.json();
      if (data.length > 0) {
        const place = data[0];
        return `${place.name}, ${place.state || place.country}`;
      }

      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    } catch (error) {
      console.error("[Weather] Erro em reverse geocoding:", error);
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  }

  /**
   * Calcular ponto de orvalho
   */
  private calculateDewPoint(temperature: number, humidity: number): number {
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * temperature) / (b + temperature)) + Math.log(humidity / 100);
    return (b * alpha) / (a - alpha);
  }

  /**
   * Gerenciar cache
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Gerar dados meteorológicos simulados (fallback)
   */
  private generateMockWeather(): WeatherData {
    const hour = new Date().getHours();
    const baseTemp = 25 + 5 * Math.sin((hour / 24) * Math.PI * 2);

    return {
      temperature: baseTemp + (Math.random() - 0.5) * 5,
      humidity: 60 + (Math.random() - 0.5) * 20,
      windSpeed: 10 + (Math.random() - 0.5) * 8,
      windGust: 15 + (Math.random() - 0.5) * 10,
      precipitation: Math.random() < 0.3 ? Math.random() * 5 : 0,
      pressure: 1013 + (Math.random() - 0.5) * 10,
      cloudiness: Math.random() * 100,
      visibility: 10000 + (Math.random() - 0.5) * 2000,
      uvIndex: Math.max(0, 5 + (Math.random() - 0.5) * 3),
      feelsLike: baseTemp + (Math.random() - 0.5) * 3,
      dewPoint: 15 + (Math.random() - 0.5) * 10,
      description: "Parcialmente nublado",
      icon: "02d",
    };
  }

  /**
   * Gerar previsão simulada para 7 dias
   */
  private generateMockForecast(): WeatherForecast[] {
    const forecast: WeatherForecast[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      const dayData = this.generateMockWeather();
      forecast.push({
        date: date.toISOString().split("T")[0],
        data: [dayData],
        dayAverage: dayData,
        dayMax: { ...dayData, temperature: dayData.temperature + 2 },
        dayMin: { ...dayData, temperature: dayData.temperature - 2 },
      });
    }

    return forecast;
  }

  /**
   * Gerar dados históricos simulados para 30 dias
   */
  private generateMockHistoricalData(): {
    temperature: number[];
    humidity: number[];
    windSpeed: number[];
    precipitation: number[];
  } {
    const temperature: number[] = [];
    const humidity: number[] = [];
    const windSpeed: number[] = [];
    const precipitation: number[] = [];

    for (let i = 0; i < 30; i++) {
      const dayOfYear = (i % 365) / 365;
      const seasonalTemp = 25 + 10 * Math.sin(dayOfYear * 2 * Math.PI);
      temperature.push(seasonalTemp + (Math.random() - 0.5) * 5);

      const seasonalHumidity = 60 - 20 * Math.sin(dayOfYear * 2 * Math.PI);
      humidity.push(Math.max(10, Math.min(100, seasonalHumidity + (Math.random() - 0.5) * 15)));

      windSpeed.push(Math.max(0, 10 + (Math.random() - 0.5) * 8));
      precipitation.push(Math.max(0, Math.random() < 0.3 ? Math.random() * 20 : 0));
    }

    return { temperature, humidity, windSpeed, precipitation };
  }
}

/**
 * Instância singleton do serviço
 */
let weatherServiceInstance: WeatherService | null = null;

export function getWeatherService(): WeatherService {
  if (!weatherServiceInstance) {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY || "";
    weatherServiceInstance = new WeatherService(apiKey);
  }
  return weatherServiceInstance;
}
