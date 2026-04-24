/**
 * Router de Dados Meteorológicos (OpenWeatherMap)
 */
import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getCurrentWeather, getWeatherForecast, calculateFireWeatherIndex } from "../integrations/openweather";

export const weatherRouter = router({
  getCurrent: publicProcedure
    .input(z.object({ latitude: z.number(), longitude: z.number() }))
    .query(async ({ input }) => {
      return await getCurrentWeather(input.latitude, input.longitude);
    }),

  getForecast: publicProcedure
    .input(z.object({
      latitude: z.number(),
      longitude: z.number(),
      days: z.number().min(1).max(7).default(7),
    }))
    .query(async ({ input }) => {
      return await getWeatherForecast(input.latitude, input.longitude, input.days);
    }),

  getFireIndex: publicProcedure
    .input(z.object({ latitude: z.number(), longitude: z.number() }))
    .query(async ({ input }) => {
      return await calculateFireWeatherIndex(input.latitude, input.longitude);
    }),
});
