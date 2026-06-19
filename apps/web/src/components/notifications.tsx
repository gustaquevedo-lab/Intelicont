"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { Bell, CheckCircle2, AlertCircle, FileText, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type NotificationType =
  | "sifen_pending"
  | "sifen_approved"
  | "sifen_rejected"
  | "period_closing"
  | "period_closed"
  | "team_invite"
  | "rg90_discrepancy"
  | "bank_match";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, "id" | "read" | "createdAt">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = (n: Omit<Notification, "id" | "read" | "createdAt">) => {
    const notification: Notification = {
      ...n,
      id: Math.random().toString(36).slice(2),
      read: false,
      createdAt: new Date(),
    };
    setNotifications((prev) => [notification, ...prev].slice(0, 50));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// ─── Notification Bell Component ─────────────────────────────────────────

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "sifen_pending":
      case "sifen_approved":
      case "sifen_rejected":
        return FileText;
      case "period_closing":
      case "period_closed":
        return AlertCircle;
      case "team_invite":
        return Users;
      case "rg90_discrepancy":
        return AlertCircle;
      case "bank_match":
        return CheckCircle2;
      default:
        return Bell;
    }
  };

  const getIconColor = (type: NotificationType) => {
    switch (type) {
      case "sifen_approved":
      case "bank_match":
        return "text-green-400";
      case "sifen_rejected":
      case "rg90_discrepancy":
        return "text-red-400";
      case "sifen_pending":
      case "period_closing":
        return "text-yellow-400";
      default:
        return "text-blue-400";
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="p-3 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-white text-sm font-medium">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-primary text-xs hover:underline"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Sin notificaciones</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = getIcon(n.type);
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "p-3 border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors cursor-pointer",
                      !n.read && "bg-gray-800/30"
                    )}
                    onClick={() => {
                      markAsRead(n.id);
                      if (n.actionUrl) window.location.href = n.actionUrl;
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Icon
                        className={cn("h-4 w-4 mt-0.5 shrink-0", getIconColor(n.type))}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{n.title}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{n.message}</p>
                        <p className="text-gray-600 text-[10px] mt-1">
                          {formatTimeAgo(n.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(n.id);
                        }}
                        className="text-gray-600 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Ahora mismo";
  if (minutes < 60) return `Hace ${minutes}m`;
  if (hours < 24) return `Hace ${hours}h`;
  return `Hace ${days}d`;
}
