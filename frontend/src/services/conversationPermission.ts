import api from "@/lib/api";

export const conversationPermissionService = {
  requestPermission: (partnerId: string, targetUserId: string, message?: string) =>
    api.post("/conversation-permissions/request", { partnerId, targetUserId, message }),
  respondToPermission: (permissionId: string, status: "approved" | "denied") =>
    api.post(`/conversation-permissions/${permissionId}/respond`, { status }),
  getReceivedPermissions: (status?: string) =>
    api.get("/conversation-permissions/received", { params: status ? { status } : {} }),
  getSentPermissions: (status?: string) =>
    api.get("/conversation-permissions/sent", { params: status ? { status } : {} }),
};
