/**
 * Router de Gamificação
 */
import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getTopRankings, getMonthlyTopRankings, getUserBadges } from "../db";

export const gamificationRouter = router({
  getTopRankings: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      return await getTopRankings(input.limit || 10);
    }),

  getMonthlyRankings: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      return await getMonthlyTopRankings(input.limit || 10);
    }),

  getUserBadges: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return await getUserBadges(input.userId);
    }),
});
