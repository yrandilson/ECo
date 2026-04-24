/**
 * Hook para conexão WebSocket em tempo real com o EcoMonitor.
 * 
 * Reconecta automaticamente em caso de desconexão.
 * Dispara callbacks para cada tipo de evento recebido.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";

// ─── Tipos ──────────────────────────────────────────────────────
export type WsEventType =
  | "NEW_OCCURRENCE"
  | "OCCURRENCE_VALIDATED"
  | "IRAC_UPDATE"
  | "ALERT"
  | "USER_CONNECTED"
  | "STATS_UPDATE";

export interface WsMessage {
  type: WsEventType;
  payload: any;
  timestamp: string;
}

interface UseWebSocketOptions {
  /** Habilitar/desabilitar conexão */
  enabled?: boolean;
  /** Mostrar toasts para eventos em tempo real */
  showToasts?: boolean;
  /** Callback genérico para qualquer mensagem */
  onMessage?: (msg: WsMessage) => void;
  /** Callbacks específicos por tipo de evento */
  onNewOccurrence?: (payload: any) => void;
  onOccurrenceValidated?: (payload: any) => void;
  onIracUpdate?: (payload: any) => void;
  onAlert?: (payload: any) => void;
}

interface UseWebSocketReturn {
  /** Se o WebSocket está conectado */
  connected: boolean;
  /** Número de clientes conectados (do servidor) */
  connectedClients: number;
  /** Última mensagem recebida */
  lastMessage: WsMessage | null;
  /** Reconectar manualmente */
  reconnect: () => void;
}

// ─── Constantes ─────────────────────────────────────────────────
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

// Ícones por tipo de ocorrência
const TYPE_ICONS: Record<string, string> = {
  fire: "🔥",
  water_pollution: "💧",
  air_pollution: "💨",
  drought: "🏜️",
  deforestation: "🌳",
  flooding: "🌊",
  other: "❓",
};

const TYPE_LABELS: Record<string, string> = {
  fire: "Incêndio",
  water_pollution: "Poluição de Água",
  air_pollution: "Poluição do Ar",
  drought: "Seca",
  deforestation: "Desmatamento",
  flooding: "Enchente",
  other: "Outra",
};

// ─── Hook ───────────────────────────────────────────────────────
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    enabled = true,
    showToasts = true,
    onMessage,
    onNewOccurrence,
    onOccurrenceValidated,
    onIracUpdate,
    onAlert,
  } = options;

  const [connected, setConnected] = useState(false);
  const [connectedClients, setConnectedClients] = useState(0);
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const connect = useCallback(() => {
    if (!enabled) return;

    // Construir URL do WebSocket (mesmo host, porta do servidor)
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    // Em desenvolvimento, o Vite roda em outra porta; o backend está em 3000
    const port = import.meta.env.DEV ? "3000" : window.location.port;
    const wsUrl = `${protocol}//${host}:${port}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        reconnectAttemptsRef.current = 0;
        console.log("[WebSocket] Conectado ao servidor");
      };

      ws.onmessage = (event) => {
        try {
          const msg: WsMessage = JSON.parse(event.data);
          setLastMessage(msg);
          onMessage?.(msg);

          // Dispatch por tipo de evento
          switch (msg.type) {
            case "USER_CONNECTED":
              setConnectedClients(msg.payload.connectedClients || 0);
              break;

            case "NEW_OCCURRENCE":
              onNewOccurrence?.(msg.payload);
              if (showToasts) {
                const icon = TYPE_ICONS[msg.payload.type] || "📍";
                const label = TYPE_LABELS[msg.payload.type] || "Ocorrência";
                toast.info(
                  `${icon} Nova ${label} reportada por ${msg.payload.userName || "usuário"}`,
                  { duration: 5000 }
                );
              }
              break;

            case "OCCURRENCE_VALIDATED":
              onOccurrenceValidated?.(msg.payload);
              if (showToasts) {
                toast.success(
                  `✅ Ocorrência #${msg.payload.occurrenceId} validada por ${msg.payload.source}`,
                  { duration: 4000 }
                );
              }
              break;

            case "IRAC_UPDATE":
              onIracUpdate?.(msg.payload);
              break;

            case "ALERT":
              onAlert?.(msg.payload);
              if (showToasts && msg.payload.severity === "critical") {
                toast.error(`🚨 ${msg.payload.message}`, { duration: 8000 });
              }
              break;
          }
        } catch (err) {
          console.error("[WebSocket] Erro ao parsear mensagem:", err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;

        // Reconectar automaticamente
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          const delay = RECONNECT_DELAY_MS * reconnectAttemptsRef.current;
          console.log(`[WebSocket] Reconectando em ${delay / 1000}s... (tentativa ${reconnectAttemptsRef.current})`);
          reconnectTimerRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        // onclose será chamado automaticamente
      };
    } catch {
      console.error("[WebSocket] Erro ao conectar");
    }
  }, [enabled, showToasts, onMessage, onNewOccurrence, onOccurrenceValidated, onIracUpdate, onAlert]);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { connected, connectedClients, lastMessage, reconnect };
}
