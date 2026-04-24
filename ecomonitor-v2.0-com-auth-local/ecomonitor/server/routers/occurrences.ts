/**
 * Router de Ocorrências
 */
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  createOccurrence, getRecentOccurrences, getOccurrenceById,
  getOccurrencesByType, getCriticalOccurrences, getOccurrencesByStatus,
  getOccurrenceStats, updateOccurrenceRiskScore, addPhotos, updateUserRanking, createAlert,
} from "../db";
import { calculateOccurrenceRisk } from "../physics";
import { validateFireOccurrence } from "../integrations/nasa-firms";
import { broadcastNewOccurrence, broadcastOccurrenceValidated } from "../websocket";

export const occurrencesRouter = router({
  create: protectedProcedure
    .input(z.object({
      type: z.enum(["fire", "water_pollution", "air_pollution", "drought", "deforestation", "flooding", "other"]),
      latitude: z.number(),
      longitude: z.number(),
      description: z.string().optional(),
      severity: z.enum(["low", "medium", "high", "critical"]).optional(),
      physicalParameters: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await createOccurrence({
        userId: ctx.user.id,
        type: input.type as any,
        latitude: input.latitude as any,
        longitude: input.longitude as any,
        description: input.description,
        severity: input.severity as any,
        physicalParameters: input.physicalParameters ? (input.physicalParameters as any) : null,
      });

      if (input.physicalParameters) {
        const riskScore = calculateOccurrenceRisk(input.type, input.physicalParameters);
        const occurrenceId = (result as any).insertId || 1;
        await updateOccurrenceRiskScore(occurrenceId, riskScore);
      }

      await updateUserRanking(ctx.user.id, 10);

      // ── Broadcast em tempo real via WebSocket ──
      const occId = (result as any).insertId || (result as any)[0]?.id || 0;
      broadcastNewOccurrence({
        id: occId,
        type: input.type,
        latitude: input.latitude,
        longitude: input.longitude,
        severity: input.severity,
        description: input.description,
        userName: ctx.user.name || ctx.user.email || "Anônimo",
      });

      // Validação satelital em background para incêndios
      if (input.type === "fire") {
        setTimeout(async () => {
          try {
            const occurrenceId = (result as any).insertId || 1;
            const validation = await validateFireOccurrence(
              input.latitude, input.longitude, new Date(), 5, 24
            );
            if (validation.isValidated) {
              console.log(`[Auto-validation] Occurrence #${occurrenceId} validated by satellite!`);
              broadcastOccurrenceValidated(occurrenceId, "NASA FIRMS");
            }
          } catch (error) {
            console.error("[Auto-validation] Error:", error);
          }
        }, 0);
      }

      return result;
    }),

  getRecent: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      return await getRecentOccurrences(input.limit || 20);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await getOccurrenceById(input.id);
    }),

  getByType: publicProcedure
    .input(z.object({ type: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return await getOccurrencesByType(input.type, input.limit || 50);
    }),

  getCritical: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      return await getCriticalOccurrences(input.limit || 20);
    }),

  getByStatus: publicProcedure
    .input(z.object({ status: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return await getOccurrencesByStatus(input.status, input.limit || 50);
    }),

  getStats: publicProcedure.query(async () => {
    return await getOccurrenceStats();
  }),
});
