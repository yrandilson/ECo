/**
 * Router de Validações
 */
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { createValidation, getValidationsByOccurrence, updateUserRanking, createAlert } from "../db";

export const validationsRouter = router({
  create: protectedProcedure
    .input(z.object({
      occurrenceId: z.number(),
      isValid: z.boolean(),
      comment: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await createValidation({
        occurrenceId: input.occurrenceId,
        userId: ctx.user.id,
        isValid: input.isValid,
        comment: input.comment,
      });

      await updateUserRanking(ctx.user.id, 5);

      await createAlert({
        userId: ctx.user.id,
        occurrenceId: input.occurrenceId,
        type: "validation",
        severity: "medium",
        message: input.isValid ? "Sua ocorrência foi validada!" : "Sua ocorrência foi rejeitada",
      });
    }),

  getByOccurrence: publicProcedure
    .input(z.object({ occurrenceId: z.number() }))
    .query(async ({ input }) => {
      return await getValidationsByOccurrence(input.occurrenceId);
    }),
});
