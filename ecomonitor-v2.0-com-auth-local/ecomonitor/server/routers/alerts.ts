/**
 * Router de Alertas
 */
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getUserAlerts, markAlertAsRead } from "../db";

export const alertsRouter = router({
  getUserAlerts: protectedProcedure
    .input(z.object({ unreadOnly: z.boolean().optional(), limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      return await getUserAlerts(ctx.user.id, input.unreadOnly);
    }),

  markAsRead: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ input }) => {
      return await markAlertAsRead(input.alertId);
    }),
});
