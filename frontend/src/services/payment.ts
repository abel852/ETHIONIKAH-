import api from "@/lib/api";

export interface CreatePaymentPayload {
  planType: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  referenceNumber: string;
  receiptUrl?: string;
}

export const paymentService = {
  createRequest: (data: CreatePaymentPayload) => api.post("/payments", data),
  getMyPayments: (params?: Record<string, unknown>) => api.get("/payments/my", { params }),
  getWallet: () => api.get("/payments/wallet"),
  getMembershipPlans: () => api.get("/membership/plans"),
  getCreditPackages: () => api.get("/membership/credits"),
  getPaymentMethods: () => api.get("/membership/methods"),
  getMyContactCredits: () => api.get("/membership/my-credits"),
  uploadReceipt: (file: File) => {
    const fd = new FormData();
    fd.append("receipt", file);
    return api.post("/payments/receipt", fd);
  },
};
