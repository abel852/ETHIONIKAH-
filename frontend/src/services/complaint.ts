import api from "@/lib/api";

export const complaintService = {
  createComplaint: (data: { subject: string; description: string }) => api.post("/complaints", data),
  getMyComplaints: () => api.get("/complaints/me"),
  getComplaint: (id: string) => api.get(`/complaints/${id}`),
};
