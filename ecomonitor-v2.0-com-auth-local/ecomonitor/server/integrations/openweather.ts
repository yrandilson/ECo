import axios from 'axios';
import { cache, CacheTTL, CacheKeys } from '../cache';

const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '';

export interface WeatherData {
  temperature: number; // °C
  humidity: number; // %
  windSpeed: number; // km/h
  precipitation: number; // mm
  pressure: number; // hPa
  description: string;
  icon: string;
  visibility: number; // metros
  cloudCover: number; // %
  timestamp: Date;
}

export interface WeatherForecast {
  date: string;
  temperature: {
    min: number;
    max: number;
    avg: number;
  };
  humidity: number;
  windSpeed: number;
  precipitation: number;
  precipitationProbability: number;
  description: string;
  icon: string;
}

export interface FireWeatherIndex {
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  fwi: number; // Fire Weather Index (0-100)
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

/**
 * Obter dados meteorológicos atuais
 */
export async function getCurrentWeather(
  latitude: number,
  longitude: number
): Promise<WeatherData | null> {
  const cacheKey = CacheKeys.weather(latitude, longitude);
  
  // CORREÇÃO: Removida a duplicata do cache.cached que estava aberta aqui
  return cache.cached(cacheKey, async () => {
    const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
      params: {
        lat: latitude,
        lon: longitude,
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
        lang: 'pt_br',
      },
    });

    const data = response.data;
    
    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      windSpeed: (data.wind.speed * 3.6), // m/s para km/h
      precipitation: data.rain?.['1h'] || data.snow?.['1h'] || 0,
      pressure: data.main.pressure,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      visibility: data.visibility,
      cloudCover: data.clouds.all,
      timestamp: new Date(data.dt * 1000),
    };
  }, CacheTTL.LONG);
}

/**
 * Obter previsão de 7 dias
 */
export async function getWeatherForecast(
  latitude: number,
  longitude: number,
  days: number = 7
): Promise<WeatherForecast[]> {
  const cacheKey = CacheKeys.forecast(latitude, longitude, days);
  
  return cache.cached(cacheKey, async () => {
    // Usar API de previsão de 5 dias (free tier) ou One Call API (paid)
    const response = await axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
      params: {
        lat: latitude,
        lon: longitude,
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
        lang: 'pt_br',
        cnt: days * 8, // 8 previsões por dia (a cada 3 horas)
      },
    });

    const forecasts: WeatherForecast[] = [];
    const dailyData = new Map<string, any[]>();

    // Agrupar por dia
    response.data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!dailyData.has(date)) {
        dailyData.set(date, []);
      }
      dailyData.get(date)!.push(item);
    });

    // Processar cada dia
    for (const [date, items] of dailyData.entries()) {
      const temps = items.map((i: any) => i.main.temp);
      const humidities = items.map((i: any) => i.main.humidity);
      const winds = items.map((i: any) => i.wind.speed * 3.6);
      const precips = items.map((i: any) => i.rain?.['3h'] || 0);

      forecasts.push({
        date,
        temperature: {
          min: Math.min(...temps),
          max: Math.max(...temps),
          avg: temps.reduce((a: number, b: number) => a + b) / temps.length,
        },
        humidity: humidities.reduce((a: number, b: number) => a + b) / humidities.length,
        windSpeed: winds.reduce((a: number, b: number) => a + b) / winds.length,
        precipitation: precips.reduce((a: number, b: number) => a + b),
        precipitationProbability: items[0].pop * 100 || 0,
        description: items[0].weather[0].description,
        icon: items[0].weather[0].icon,
      });
    }

    // Limitar ao número de dias solicitado
    return forecasts.slice(0, days);
  }, CacheTTL.LONG);
}

/**
 * Calcular índice de risco de incêndio baseado em dados meteorológicos
 */
export async function calculateFireWeatherIndex(
  latitude: number,
  longitude: number
): Promise<FireWeatherIndex | null> {
  try {
    const weather = await getCurrentWeather(latitude, longitude);
    if (!weather) return null;

    const { temperature, humidity, windSpeed, precipitation } = weather;

    const tempFactor = Math.min(100, Math.max(0, (temperature - 10) * 2.5));
    const humidityFactor = Math.min(100, Math.max(0, 100 - humidity));
    const windFactor = Math.min(100, Math.max(0, windSpeed * 2));
    const precipFactor = Math.min(100, Math.max(0, precipitation * -10));

    const fwi =
      tempFactor * 0.3 +
      humidityFactor * 0.35 +
      windFactor * 0.25 +
      Math.max(0, -precipFactor * 0.1);

    let severity: 'low' | 'medium' | 'high' | 'critical';
    let recommendation: string;

    if (fwi < 30) {
      severity = 'low';
      recommendation = 'Risco baixo de incêndio. Condições meteorológicas favoráveis.';
    } else if (fwi < 50) {
      severity = 'medium';
      recommendation = 'Risco moderado. Mantenha vigilância em áreas com vegetação seca.';
    } else if (fwi < 70) {
      severity = 'high';
      recommendation = 'Risco alto! Evite atividades com fogo. Monitore constantemente.';
    } else {
      severity = 'critical';
      recommendation = `ALERTA CRÍTICO! Condições extremas: ${temperature.toFixed(1)}°C, ${humidity}% umidade, vento ${windSpeed.toFixed(1)} km/h. PROIBIDO uso de fogo!`;
    }

    return {
      temperature,
      humidity,
      windSpeed,
      precipitation,
      fwi: Math.round(fwi),
      severity,
      recommendation,
    };
  } catch (error) {
    console.error('[OpenWeather] Erro ao calcular FWI:', error);
    return null;
  }
}

/**
 * Obter dados históricos meteorológicos
 */
export async function getHistoricalWeather(
  latitude: number,
  longitude: number,
  startDate: Date,
  endDate: Date
): Promise<WeatherData[]> {
  try {
    console.log('[OpenWeather] Dados históricos requerem API paga');
    return [];
  } catch (error) {
    console.error('[OpenWeather] Erro ao buscar dados históricos:', error);
    return [];
  }
}

/**
 * Verificar se a API está configurada corretamente
 */
export function isConfigured(): boolean {
  return Boolean(OPENWEATHER_API_KEY && OPENWEATHER_API_KEY.length > 0);
}