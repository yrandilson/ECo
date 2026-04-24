import { z } from "zod";
import {
  createContentReport,
  getPendingReports,
  getReportsByUser,
  getReportById,
  updateReportStatus,
  addVoteToReport,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

/**
 * Router para gerenciar denúncias de conteúdo
 */
export const reportsRouter = router({
  /**
   * Criar nova denúncia de conteúdo
   * Requer autenticação
   */
  create: protectedProcedure
    .input(
      z.object({
        contentType: z.enum(["post", "comment", "user", "image", "other"]),
        contentId: z.string(),
        reportType: z.enum(["spam", "harassment", "false_info", "inappropriate", "copyright", "other"]),
        reason: z.string().min(10, "Motivo deve ter pelo menos 10 caracteres"),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await createContentReport({
          reporterId: ctx.user.id,
          contentType: input.contentType,
          contentId: input.contentId,
          reportType: input.reportType,
          reason: input.reason,
          description: input.description,
        });

        // Obter o ID do relatório inserido
        const reports = await getReportsByUser(ctx.user.id, 1);
        const lastReport = reports[0];

        return {
          success: true,
          message: "Denúncia registrada com sucesso",
          reportId: lastReport?.id || 0,
        };
      } catch (error) {
        console.error("Erro ao criar denúncia:", error);
        throw new Error("Falha ao registrar denúncia");
      }
    }),

  /**
   * Obter minhas denúncias
   * Requer autenticação
   */
  myReports: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const limit = Math.min(input.limit, 100);
        const reports = await getReportsByUser(ctx.user.id, limit);
        return {
          success: true,
          reports,
          total: reports.length,
        };
      } catch (error) {
        console.error("Erro ao obter denúncias:", error);
        throw new Error("Falha ao obter denúncias");
      }
    }),

  /**
   * Obter denúncia por ID (público pode ver status geral)
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      try {
        const report = await getReportById(input.id);
        if (!report) {
          return { success: false, error: "Denúncia não encontrada" };
        }

        // Retornar apenas informações públicas
        return {
          success: true,
          report: {
            id: report.id,
            contentType: report.contentType,
            status: report.status,
            createdAt: report.createdAt,
            communityVotes: report.communityVotes || 0,
          },
        };
      } catch (error) {
        console.error("Erro ao obter denúncia:", error);
        throw new Error("Falha ao obter denúncia");
      }
    }),

  /**
   * Votar em uma denúncia (comunidade)
   * Requer autenticação
   */
  addVote: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const result = await addVoteToReport(input.reportId);
        if (!result) {
          return { success: false, error: "Denúncia não encontrada" };
        }

        return {
          success: true,
          message: "Voto registrado com sucesso",
        };
      } catch (error) {
        console.error("Erro ao votar em denúncia:", error);
        throw new Error("Falha ao registrar voto");
      }
    }),

  /**
   * Admin: Obter denúncias pendentes
   * Requer autenticação (futura: requer role admin)
   */
  pending: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const limit = Math.min(input.limit, 100);
        // TODO: Verificar se usuário é admin/moderador
        const reports = await getPendingReports(limit, input.offset);
        return {
          success: true,
          reports,
          total: reports.length,
        };
      } catch (error) {
        console.error("Erro ao obter denúncias pendentes:", error);
        throw new Error("Falha ao obter denúncias");
      }
    }),

  /**
   * Admin: Atualizar status de denúncia
   * Requer autenticação e permissões
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        reportId: z.number(),
        status: z.enum(["pending", "reviewing", "resolved", "dismissed"]),
        action: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // TODO: Verificar se usuário é moderador
        const result = await updateReportStatus(
          input.reportId,
          input.status,
          ctx.user.id,
          input.action,
          input.notes
        );

        if (!result) {
          return { success: false, error: "Denúncia não encontrada" };
        }

        return {
          success: true,
          message: `Status atualizado para ${input.status}`,
        };
      } catch (error) {
        console.error("Erro ao atualizar denúncia:", error);
        throw new Error("Falha ao atualizar denúncia");
      }
    }),
});
