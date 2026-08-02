import api from "@/lib/api";

export const messageService = {
  getConversations: () => api.get("/messages/conversations"),
  getMessages: (conversationId: string, before?: string, limit?: number) =>
    api.get(`/messages/conversation/${conversationId}`, {
      params: { ...(before ? { before } : {}), ...(limit ? { limit } : {}) },
    }),
  sendMessage: (conversationId: string, content: string, replyToId?: string | null) =>
    api.post("/messages", { receiverId: conversationId, content, replyToId: replyToId || undefined }, { _noToast: true } as any),
  sendImage: (receiverId: string, file: File, caption?: string, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append("chatImage", file);
    form.append("receiverId", receiverId);
    if (caption) form.append("caption", caption);
    return api.post("/messages/image", form, {
      _noToast: true,
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e: { total?: number; loaded: number }) => {
        if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    } as any);
  },
  sendFile: (receiverId: string, file: File, caption?: string, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append("chatFile", file);
    form.append("receiverId", receiverId);
    if (caption) form.append("caption", caption);
    return api.post("/messages/file", form, {
      _noToast: true,
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e: { total?: number; loaded: number }) => {
        if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    } as any);
  },
  markAsRead: (messageId: string) => api.put(`/messages/${messageId}/read`),
  editMessage: (messageId: string, content: string) =>
    api.put(`/messages/${messageId}/edit`, { content }, { _noToast: true } as any),
  reactToMessage: (messageId: string, reaction: string) =>
    api.put(`/messages/${messageId}/react`, { reaction }, { _noToast: true } as any),
  deleteMessage: (messageId: string, deleteFor: "me" | "both" = "me") =>
    api.delete(`/messages/${messageId}`, { data: { deleteFor } }),
  blockUser: (blockedUserId: string) => api.post("/messages/block", { blockedUserId }),
  unblockUser: (blockedUserId: string) => api.post("/messages/unblock", { blockedUserId }),
  deleteConversation: (otherUserId: string, deleteFor: "me" | "both" = "me") =>
    api.post(`/messages/conversation/${otherUserId}/delete`, { deleteFor }),
};