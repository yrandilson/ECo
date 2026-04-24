/**
 * Módulo de "banco de dados" para chatbot — armazenamento in-memory
 * (Sem tabela SQL dedicada; pode ser migrado para MySQL futuramente)
 */
import { logger } from "../logger";

interface ChatMessage {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  metadata: Record<string, unknown>;
  tokenCount?: number;
  createdAt: Date;
}

interface ChatConversation {
  id: number;
  userId: number;
  context: string;
  title: string;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory stores
let conversationIdSeq = 1;
let messageIdSeq = 1;
const conversations: ChatConversation[] = [];
const messages: ChatMessage[] = [];

/**
 * Cria uma nova conversa para o usuário
 */
export async function createChatConversation(
  userId: number,
  context: string,
): Promise<number> {
  const id = conversationIdSeq++;
  conversations.push({
    id,
    userId,
    context,
    title: "Nova Conversa",
    archived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  logger.debug("Chat conversation created", { conversationId: id, userId });
  return id;
}

/**
 * Retorna conversas não-arquivadas do usuário
 */
export async function getUserConversations(userId: number) {
  return conversations
    .filter((c) => c.userId === userId && !c.archived)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

/**
 * Adiciona mensagem a uma conversa
 */
export async function addChatMessage(
  conversationId: number,
  role: string,
  content: string,
  metadata: Record<string, unknown> = {},
  tokenCount?: number,
): Promise<void> {
  messages.push({
    id: messageIdSeq++,
    conversationId,
    role,
    content,
    metadata,
    tokenCount,
    createdAt: new Date(),
  });

  // Atualiza timestamp da conversa
  const conv = conversations.find((c) => c.id === conversationId);
  if (conv) conv.updatedAt = new Date();
}

/**
 * Retorna mensagens de uma conversa, opcionalmente limitadas
 */
export async function getConversationMessages(
  conversationId: number,
  limit?: number,
) {
  const all = messages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  return limit ? all.slice(-limit) : all;
}

/**
 * Arquiva uma conversa
 */
export async function archiveChatConversation(conversationId: number): Promise<void> {
  const conv = conversations.find((c) => c.id === conversationId);
  if (conv) conv.archived = true;
}

/**
 * Retorna estatísticas de uso do chatbot para o usuário
 */
export async function getChatbotStats(userId: number) {
  const userConvs = conversations.filter((c) => c.userId === userId);
  const convIds = new Set(userConvs.map((c) => c.id));
  const userMsgs = messages.filter((m) => convIds.has(m.conversationId));

  return {
    totalConversations: userConvs.length,
    totalMessages: userMsgs.length,
    totalTokens: userMsgs.reduce((sum, m) => sum + (m.tokenCount || 0), 0),
  };
}
