import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getEcoBotService } from "../ai-chatbot-service";
import {
  createChatConversation,
  getUserConversations,
  addChatMessage,
  getConversationMessages,
  archiveChatConversation,
  getChatbotStats,
} from "../db";

export const chatbotRouter = router({
  startConversation: protectedProcedure
    .input(
      z.object({
        context: z.string().default("general"),
        initialMessage: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user!.id;
      const ecoBot = getEcoBotService();

      const conversationId = await createChatConversation(userId, input.context);

      if (input.initialMessage) {
        await addChatMessage(conversationId, "user", input.initialMessage);
        const response = await ecoBot.chat(
          [{ role: "user", content: input.initialMessage }],
          input.context as any
        );
        await addChatMessage(conversationId, "assistant", response.message, {}, response.tokenCount);
        return { conversationId, response };
      }

      return { conversationId };
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        message: z.string().min(1).max(2000),
        context: z.string().default("general"),
      })
    )
    .mutation(async ({ input }) => {
      const ecoBot = getEcoBotService();
      await addChatMessage(input.conversationId, "user", input.message);
      const history = await getConversationMessages(input.conversationId, 10);
      const messages = history.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      }));
      const response = await ecoBot.chat(messages, input.context as any);
      await addChatMessage(input.conversationId, "assistant", response.message, {}, response.tokenCount);
      return response;
    }),

  getConversations: protectedProcedure.query(async ({ ctx }) => {
    return await getUserConversations(ctx.user!.id);
  }),

  getMessages: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input }) => await getConversationMessages(input.conversationId)),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    return await getChatbotStats(ctx.user!.id);
  }),
});
