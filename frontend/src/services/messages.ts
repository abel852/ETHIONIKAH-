import api from "@/lib/api";

export const messageService = {
  getConversations: () => api.get("/messages/conversations"),
  getMessages: (conversationId: string) => api.get(`/messages/conversation/${conversationId}`),
  sendMessage: (conversationId: string, content: string) => api.post("/messages", { receiverId: conversationId, content }),
  markAsRead: (messageId: string) => api.put(`/messages/${messageId}/read`),
  deleteMessage: (messageId: string) => api.delete(`/messages/${messageId}`),
  blockUser: (blockedUserId: string) => api.post("/messages/block", { blockedUserId }),
};
