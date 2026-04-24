/**
 * Router de Simulações
 */
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { createSimulation, getUserSimulations, updateUserRanking } from "../db";

export const simulationsRouter = router({
  create: protectedProcedure
    .input(z.object({
      type: z.enum(["fire", "water", "pollution", "deforestation", "water-quality"]),
      parameters: z.record(z.string(), z.any()),
      results: z.record(z.string(), z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      await createSimulation({
        userId: ctx.user.id,
        type: input.type as any,
        parameters: JSON.stringify(input.parameters),
        results: JSON.stringify(input.results),
      });
      await updateUserRanking(ctx.user.id, 3);
    }),

  getUserSimulations: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      return await getUserSimulations(ctx.user.id, input.limit || 20);
    }),
});
