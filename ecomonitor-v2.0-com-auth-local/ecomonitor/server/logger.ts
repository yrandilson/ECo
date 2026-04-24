/**
 * Módulo de logging estruturado.
 * Produz saída JSON em produção e formatada para humanos em dev.
 * Uso:
 *   import { logger } from "./logger";
 *   logger.info("Mensagem", { extra: "dados" });
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[minLevel];
}

function formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  if (process.env.NODE_ENV === "production") {
    return JSON.stringify(entry);
  }

  // Formato legível para desenvolvimento
  const prefix = `[${entry.timestamp}] ${level.toUpperCase().padEnd(5)}`;
  const metaStr = meta && Object.keys(meta).length > 0
    ? ` ${JSON.stringify(meta)}`
    : "";
  return `${prefix} ${message}${metaStr}`;
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  const formatted = formatLog(level, message, meta);
  switch (level) {
    case "error":
      console.error(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log("debug", msg, meta),
  info:  (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta),
  warn:  (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta),
};
