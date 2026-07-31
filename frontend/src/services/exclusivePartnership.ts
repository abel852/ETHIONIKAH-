import api from "@/lib/api";

export const exclusivePartnershipService = {
  request: (receiverId: string, message?: string) =>
    api.post("/exclusive-partnerships/request", { receiverId, message }),
  respondToRequest: (requestId: string, status: "accepted" | "declined") =>
    api.post(`/exclusive-partnerships/request/${requestId}/respond`, { status }),
  end: (partnershipId: string) =>
    api.post(`/exclusive-partnerships/${partnershipId}/end`),
  getMine: () =>
    api.get("/exclusive-partnerships/mine"),
  getReceivedRequests: (status?: string) =>
    api.get("/exclusive-partnerships/requests/received", { params: status ? { status } : {} }),
  getSentRequests: (status?: string) =>
    api.get("/exclusive-partnerships/requests/sent", { params: status ? { status } : {} }),
  checkStatus: (targetUserId: string) =>
    api.get(`/exclusive-partnerships/status/${targetUserId}`),
};
