/**
 * Conexão com o banco de dados — módulo compartilhado
 * Todas as queries usam getDb() para obter a instância do Drizzle
 */
import { drizzle } from "drizzle-orm/mysql2";
import { logger } from "../logger";

let _db: ReturnType<typeof drizzle> | null = null;

/**
 * Retorna instância lazy do Drizzle conectada ao MySQL
 */
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
      logger.info("Database connection established");
    } catch (error) {
      logger.error("Failed to connect to database", { error: String(error) });
      _db = null;
    }
  }
  return _db;
}
