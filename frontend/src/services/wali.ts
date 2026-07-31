import api from "@/lib/api";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const waliService = {
  invite: (partnershipId: string, waliName: string, relationship: string, waliEmail: string) =>
    api.post("/wali/invite", { partnershipId, waliName, relationship, waliEmail }),
  approve: (partnershipId: string) =>
    api.post("/wali/approve", { partnershipId }),
  decline: (partnershipId: string) =>
    api.post("/wali/decline", { partnershipId }),
  revoke: (partnershipId: string) =>
    api.post("/wali/revoke", { partnershipId }),
  getStatus: (partnershipId: string) =>
    api.get(`/wali/status/${partnershipId}`),
  // Public routes — no auth, use plain axios to avoid auth interceptors
  verifyToken: (token: string) =>
    axios.get(`${API_URL}/wali/view/${token}`),
  getMessages: (token: string, page?: number, limit?: number) =>
    axios.get(`${API_URL}/wali/view/${token}/messages`, {
      params: { page: page || 1, limit: limit || 50 },
    }),
};
