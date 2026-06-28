import api from "@/lib/api";

export const notificationService = {
  getAll: () => api.get("/notifications"),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put("/notifications/read-all"),
  getUnreadCount: () => api.get("/notifications/unread-count"),
};
