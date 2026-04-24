/**
 * Router do IRAC — Índice de Risco Ambiental Composto
 */
import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { calculateIRAC, calculateIRACQuick } from "../irac";
import { getRecentOccurrences } from "../db";

export const iracRouter = router({
  /**
   * Calcula o IRAC completo para um ponto geográfico.
   * Requer dados meteorológicos (podem vir do frontend via OpenWeather).
   */
  calculate: publicProcedure
    .input(z.object({
      temperature: z.number().min(-40).max(60),
      humidity: z.number().min(0).max(100),
      windSpeed: z.number().min(0).max(200),
      ndvi: z.number().min(-1).max(1).optional(),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      precipitation7d: z.number().min(0).optional(),
    }))
    .query(async ({ input }) => {
      // Calcular densidade de ocorrências na região (raio ~50km ≈ 0.5°)
      const recentOccurrences = await getRecentOccurrences(200);
      const nearbyCount = recentOccurrences.filter((occ) => {
        const latDiff = Math.abs(Number(occ.latitude) - input.latitude);
        const lngDiff = Math.abs(Number(occ.longitude) - input.longitude);
        return latDiff < 0.5 && lngDiff < 0.5;
      }).length;

      const result = calculateIRAC({
        temperature: input.temperature,
        humidity: input.humidity,
        windSpeed: input.windSpeed,
        ndvi: input.ndvi,
        occurrenceDensity: nearbyCount,
        month: new Date().getMonth() + 1,
        latitude: input.latitude,
        precipitation7d: input.precipitation7d,
      });

      return result;
    }),

  /**
   * Cálculo rápido (score + nível) para múltiplos pontos no mapa.
   */
  quickBatch: publicProcedure
    .input(z.object({
      points: z.array(z.object({
        temperature: z.number(),
        humidity: z.number(),
        windSpeed: z.number(),
        latitude: z.number(),
        longitude: z.number(),
        ndvi: z.number().optional(),
      })).max(50),
    }))
    .query(async ({ input }) => {
      const recentOccurrences = await getRecentOccurrences(200);
      const month = new Date().getMonth() + 1;

      return input.points.map((point) => {
        const nearbyCount = recentOccurrences.filter((occ) => {
          const latDiff = Math.abs(Number(occ.latitude) - point.latitude);
          const lngDiff = Math.abs(Number(occ.longitude) - point.longitude);
          return latDiff < 0.5 && lngDiff < 0.5;
        }).length;

        const result = calculateIRACQuick({
          temperature: point.temperature,
          humidity: point.humidity,
          windSpeed: point.windSpeed,
          ndvi: point.ndvi,
          occurrenceDensity: nearbyCount,
          month,
          latitude: point.latitude,
        });

        return {
          latitude: point.latitude,
          longitude: point.longitude,
          ...result,
        };
      });
    }),
});
