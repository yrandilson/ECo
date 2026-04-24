/**
 * Router principal da aplicação — compõe todos os sub-routers
 */
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { addPhotos } from "./db";
import { storagePut } from "./storage";

// Sub-routers modulares
import { occurrencesRouter } from "./routers/occurrences";
import { validationsRouter } from "./routers/validations";
import { simulationsRouter } from "./routers/simulations";
import { alertsRouter } from "./routers/alerts";
import { gamificationRouter } from "./routers/gamification";
import { predictionsRouter } from "./routers/predictions";
import { weatherRouter } from "./routers/weather";
import { satelliteRouter } from "./routers/satellite";
import { reportsRouter } from "./routers/reports";
import { iracRouter } from "./routers/irac";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(({ ctx }) => {
      return ctx.user || null;
    }),

    uploadPhoto: protectedProcedure
      .input(z.object({ occurrenceId: z.number(), fileName: z.string(), b64: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const buffer = Buffer.from(input.b64, "base64");
          const key = `occurrences/${Date.now()}_${input.fileName}`;
          const { url } = await storagePut(key, buffer, undefined as any);
          await addPhotos(input.occurrenceId, [url]);
          return { success: true, url };
        } catch (error) {
          console.error("Erro ao enviar foto:", error);
          throw new Error("Falha ao enviar foto");
        }
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Sub-routers de domínio
  occurrences: occurrencesRouter,
  validations: validationsRouter,
  simulations: simulationsRouter,
  alerts: alertsRouter,
  gamification: gamificationRouter,
  predictions: predictionsRouter,
  weather: weatherRouter,
  satellite: satelliteRouter,
  reports: reportsRouter,
  irac: iracRouter,
});

export type AppRouter = typeof appRouter;
