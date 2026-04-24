/**
 * Módulo central de banco de dados — re-exporta todos os submódulos
 * 
 * Uso: import * as db from './db' (continua funcionando como antes)
 * Ou:  import { getUserById } from './db/users' (import granular)
 */

// Conexão
export { getDb } from "./connection";

// Usuários
export {
  upsertUser,
  getUserByOpenId,
  getUserByEmail,
  getUserById,
  createLocalUser,
  updateUserLastSignIn,
  savePasswordResetToken,
  validatePasswordResetToken,
  clearPasswordResetToken,
  updateUserPassword,
} from "./users";

// Ocorrências, Fotos e Validações
export {
  createOccurrence,
  getOccurrenceById,
  getOccurrencesByType,
  getRecentOccurrences,
  updateOccurrenceRiskScore,
  getCriticalOccurrences,
  getOccurrencesByStatus,
  getOccurrenceStats,
  addPhotos,
  getPhotosByOccurrence,
  createValidation,
  getValidationsByOccurrence,
} from "./occurrences";

// Gamificação (Simulações, Alertas, Badges, Rankings)
export {
  createSimulation,
  getUserSimulations,
  createAlert,
  getUserAlerts,
  markAlertAsRead,
  awardBadge,
  getUserBadges,
  updateUserRanking,
  getTopRankings,
  getMonthlyTopRankings,
} from "./gamification";

// Denúncias de Conteúdo
export {
  createContentReport,
  getPendingReports,
  getReportsByStatus,
  updateReportStatus,
  getReportsByUser,
  getReportById,
  addVoteToReport,
} from "./reports";

// Chatbot (in-memory)
export {
  createChatConversation,
  getUserConversations,
  addChatMessage,
  getConversationMessages,
  archiveChatConversation,
  getChatbotStats,
} from "./chatbot";
