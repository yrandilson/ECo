/**
 * Indicador de conexão em tempo real — mostra status do WebSocket
 * e contagem de usuários online.
 */
import { Wifi, WifiOff } from "lucide-react";

interface RealtimeIndicatorProps {
  connected: boolean;
  connectedClients: number;
}

export default function RealtimeIndicator({ connected, connectedClients }: RealtimeIndicatorProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
        connected
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      }`}
      title={connected ? `WebSocket conectado — ${connectedClients} online` : "Desconectado do servidor"}
    >
      {connected ? (
        <>
          <Wifi className="w-3 h-3" />
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span>Tempo Real</span>
          {connectedClients > 1 && (
            <span className="ml-0.5 text-green-600 dark:text-green-300">
              · {connectedClients} online
            </span>
          )}
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}
