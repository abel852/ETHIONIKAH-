import { create } from "zustand";
import type { Notification } from "@/types";
import { notificationService } from "@/services/notifications";
import { cacheGetStale, cacheSet, CACHE_TTL, STORES } from "@/lib/cache";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const extractArray = (data: any): Notification[] =>
  Array.isArray(data) ? data : data?.notifications ?? [];

function hasAuthToken(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("accessToken");
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  fetchNotifications: async () => {
    if (!hasAuthToken()) {
      set({ notifications: [], unreadCount: 0, isLoading: false });
      return;
    }
    // Try cached notifications first
    const cached = await cacheGetStale<Notification[]>(STORES.NOTIFICATIONS, "all");
    if (cached) {
      const unread = cached.data.filter((n) => !n.read).length;
      set({ notifications: cached.data, unreadCount: unread, isLoading: false });
    } else {
      set({ isLoading: true });
    }
    // Fetch fresh data
    try {
      const { data } = await notificationService.getAll();
      const list = extractArray(data);
      const unread = list.filter((n: Notification) => !n.read).length;
      set({ notifications: list, unreadCount: unread, isLoading: false });
      cacheSet(STORES.NOTIFICATIONS, "all", list, CACHE_TTL.NOTIFICATIONS);
    } catch { if (!cached) set({ isLoading: false }); }
  },
  fetchUnreadCount: async () => {
    if (!hasAuthToken()) {
      set({ unreadCount: 0 });
      return;
    }
    try {
      const { data } = await notificationService.getUnreadCount();
      set({ unreadCount: data.count ?? 0 });
    } catch { /* ignore */ }
  },
  markAsRead: async (id) => {
    try {
      await notificationService.markAsRead(id);
      set((s) => ({
        notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }));
    } catch { /* ignore */ }
  },
  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead();
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch { /* ignore */ }
  },
}));
