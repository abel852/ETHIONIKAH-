import api from "@/lib/api";

export const verificationService = {
  submitVerification: (formData: FormData) =>
    api.post("/verification", formData, {
      headers: { "Content-Type": undefined },
    }),
  getStatus: () => api.get("/verification/me"),
  uploadProfilePhoto: (formData: FormData) =>
    api.post("/profile/photo", formData, {
      headers: { "Content-Type": undefined },
    }),
};
