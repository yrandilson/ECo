/**
 * Router de Validação por Satélite (NASA FIRMS)
 */
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getOccurrenceById, updateOccurrenceRiskScore } from "../db";
import { validateFireOccurrence, getFireStatistics, getFireDetections } from "../integrations/nasa-firms";

export const satelliteRouter = router({
  validateOccurrence: protectedProcedure
    .input(z.object({ occurrenceId: z.number() }))
    .mutation(async ({ input }) => {
      const occurrence = await getOccurrenceById(input.occurrenceId);
      if (!occurrence) throw new Error("Occurrence not found");

      const result = await validateFireOccurrence(
        Number(occurrence.latitude),
        Number(occurrence.longitude),
        new Date(occurrence.createdAt),
        5,
        48
      );

      if (result.isValidated) {
        await updateOccurrenceRiskScore(input.occurrenceId, result.confidence);
      }

      return result;
    }),

  getFireDetections: publicProcedure
    .input(z.object({
      latitude: z.number(),
      longitude: z.number(),
      radius: z.number().default(10),
      days: z.number().default(1),
    }))
    .query(async ({ input }) => {
      return await getFireDetections(input.latitude, input.longitude, input.radius, input.days);
    }),

  getStatistics: publicProcedure
    .input(z.object({
      latitude: z.number(),
      longitude: z.number(),
      radius: z.number().default(50),
      days: z.number().default(7),
    }))
    .query(async ({ input }) => {
      return await getFireStatistics(input.latitude, input.longitude, input.radius, input.days);
    }),
});
