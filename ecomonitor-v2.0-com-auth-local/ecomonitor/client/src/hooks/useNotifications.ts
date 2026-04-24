import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export interface Notification {
  id: string;
  type: "alert" | "validation" | "comment" | "badge" | "system";
  title: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  read: boolean;
  data?: Record<string, any>;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Simular conexão WebSocket
  useEffect(() => {
    if (!user) return;

    // Em produção, conectar a um servidor WebSocket real
    // const ws = new WebSocket(`wss://api.example.com/notifications?userId=${user.id}`);

    // Simular notificações de teste
    const interval = setInterval(() => {
      const mockNotifications: Notification[] = [
        {
          id: Math.random().toString(36),
          type: "alert",
          title: "Alerta Crítico",
          message: "Incêndio crítico detectado a 2.3 km de sua localização",
          severity: "critical",
          timestamp: new Date(),
          read: false,
          data: { occurrenceId: 1, distance: 2.3 },
        },
        {
          id: Math.random().toString(36),
          type: "validation",
          title: "Validação Recebida",
          message: "Sua ocorrência foi validada por 3 usuários",
          severity: "high",
          timestamp: new Date(),
          read: false,
          data: { occurrenceId: 2, validations: 3 },
        },
        {
          id: Math.random().toString(36),
          type: "badge",
          title: "Badge Desbloqueado",
          message: "Você desbloqueou o badge 'Vigia do Fogo'",
          severity: "medium",
          timestamp: new Date(),
          read: false,
          data: { badge: "fire_watcher" },
        },
      ];

      // Mostrar apenas uma notificação aleatória
      if (Math.random() > 0.7) {
        const notification = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
        setNotifications((prev) => [notification, ...prev].slice(0, 20));
        setUnreadCount((prev) => prev + 1);

        // Mostrar toast
        if (notification.severity === "critical") {
          toast.error(notification.message);
        } else if (notification.severity === "high") {
          toast.warning(notification.message);
        } else {
          toast.info(notification.message);
        }
      }
    }, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}
