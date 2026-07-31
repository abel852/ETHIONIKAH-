import api from "@/lib/api";

export const conversationRequestService = {
  create: (receiverId: string, message?: string) =>
    api.post("/conversation-requests", { receiverId, message }),
  respond: (requestId: string, status: "accepted" | "declined") =>
    api.post(`/conversation-requests/${requestId}/respond`, { status }),
  getReceived: (status?: string) =>
    api.get("/conversation-requests/received", { params: status ? { status } : {} }),
  getSent: (status?: string) =>
    api.get("/conversation-requests/sent", { params: status ? { status } : {} }),
  checkStatus: (targetUserId: string) =>
    api.get(`/conversation-requests/status/${targetUserId}`),
};
