/**
 * Router de Previsões ML
 */
import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { FireRiskPredictor, generateMockHistoricalData, type FirePredictionInput } from "../ml-predictor";

export const predictionsRouter = router({
  predictFireRisk: publicProcedure
    .input(z.object({
      latitude: z.number(),
      longitude: z.number(),
      daysAhead: z.number().min(1).max(7).default(7),
    }))
    .query(async ({ input }) => {
      try {
        const historicalData = generateMockHistoricalData(30);
        const predictor = new FireRiskPredictor();
        predictor.train(historicalData);

        const predictionInput: FirePredictionInput = {
          latitude: input.latitude,
          longitude: input.longitude,
          historicalTemperature: historicalData.temperature,
          historicalHumidity: historicalData.humidity,
          historicalWindSpeed: historicalData.windSpeed,
          historicalPrecipitation: historicalData.precipitation,
          vegetationDensity: 75,
          elevation: 750,
          daysAhead: input.daysAhead,
        };

        const predictions = predictor.predictNext7Days(predictionInput);
        return { success: true, predictions };
      } catch (error) {
        console.error("[ML] Erro ao prever risco:", error);
        return { success: false, predictions: [], error: "Erro ao gerar previsões" };
      }
    }),
});
