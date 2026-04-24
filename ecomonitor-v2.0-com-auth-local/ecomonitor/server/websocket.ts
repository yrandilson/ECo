/**
 * ─── WebSocket Server para Dados em Tempo Real ─────────────────
 * 
 * Gerencia conexões WebSocket para broadcast de eventos em tempo real:
 * - Novas ocorrências ambientais
 * - Atualizações de risco (IRAC)
 * - Alertas críticos
 * - Validações satelitais
 * 
 * Protocolo: JSON sobre WebSocket
 * Eventos: NEW_OCCURRENCE, OCCURRENCE_VALIDATED, IRAC_UPDATE, ALERT
 */

import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer } from "http";
import { logger } from "./logger";

// ─── Tipos de Eventos ───────────────────────────────────────────
export type WsEventType =
  | "NEW_OCCURRENCE"
  | "OCCURRENCE_VALIDATED"
  | "IRAC_UPDATE"
  | "ALERT"
  | "USER_CONNECTED"
  | "STATS_UPDATE";

export interface WsMessage {
  type: WsEventType;
  payload: unknown;
  timestamp: string;
}

// ─── Singleton do WebSocket Server ──────────────────────────────
let wss: WebSocketServer | null = null;
let connectedClients = 0;

/**
 * Inicializa o WebSocket Server compartilhando o HTTP server do Express
 */
export function initWebSocket(server: HttpServer): WebSocketServer {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, req) => {
    connectedClients++;
    const clientIp = req.socket.remoteAddress || "unknown";
    logger.info(`[WebSocket] Cliente conectado (${connectedClients} ativos)`, { clientIp });

    // Enviar mensagem de boas-vindas com contagem de clientes
    const welcome: WsMessage = {
      type: "USER_CONNECTED",
      payload: { connectedClients, message: "Conectado ao EcoMonitor em tempo real" },
      timestamp: new Date().toISOString(),
    };
    ws.send(JSON.stringify(welcome));

    // Heartbeat para manter conexão viva
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    ws.on("close", () => {
      connectedClients--;
      clearInterval(heartbeat);
      logger.info(`[WebSocket] Cliente desconectado (${connectedClients} ativos)`);
    });

    ws.on("error", (err) => {
      logger.error("[WebSocket] Erro na conexão", { error: String(err) });
    });
  });

  logger.info("[WebSocket] Servidor WebSocket iniciado em /ws");
  return wss;
}

/**
 * Envia mensagem para TODOS os clientes conectados
 */
export function broadcast(type: WsEventType, payload: unknown): void {
  if (!wss) return;

  const message: WsMessage = {
    type,
    payload,
    timestamp: new Date().toISOString(),
  };

  const data = JSON.stringify(message);
  let sent = 0;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
      sent++;
    }
  });

  if (sent > 0) {
    logger.info(`[WebSocket] Broadcast ${type} para ${sent} cliente(s)`);
  }
}

/**
 * Envia evento de nova ocorrência
 */
export function broadcastNewOccurrence(occurrence: {
  id: number;
  type: string;
  latitude: number;
  longitude: number;
  severity?: string;
  description?: string;
  userName?: string;
}): void {
  broadcast("NEW_OCCURRENCE", occurrence);
}

/**
 * Envia evento de validação satelital
 */
export function broadcastOccurrenceValidated(occurrenceId: number, source: string): void {
  broadcast("OCCURRENCE_VALIDATED", { occurrenceId, source });
}

/**
 * Envia atualização do IRAC para uma região
 */
export function broadcastIracUpdate(data: {
  latitude: number;
  longitude: number;
  iracScore: number;
  riskLevel: string;
  components: Record<string, number>;
}): void {
  broadcast("IRAC_UPDATE", data);
}

/**
 * Envia alerta crítico em tempo real
 */
export function broadcastAlert(alert: {
  type: string;
  message: string;
  severity: string;
  latitude?: number;
  longitude?: number;
}): void {
  broadcast("ALERT", alert);
}

/**
 * Retorna número de clientes conectados
 */
export function getConnectedClients(): number {
  return connectedClients;
}
