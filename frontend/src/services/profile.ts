import api from "@/lib/api";

export const profileService = {
  getMyProfile: () => api.get("/profile/me"),
  getProfileById: (id: string) => api.get(`/profile/${id}`),
  getProfileByUserId: (userId: string) => api.get(`/profile/user/${userId}`),
  createOrUpdate: (data: Record<string, unknown>) => api.post("/profile", data),
  updateProfileStep: (data: Record<string, unknown>) => api.post("/profile/step", data),
  uploadPhoto: (file: File) => {
    const fd = new FormData();
    fd.append("photo", file);
    return api.post("/profile/photo", fd);
  },
  deletePhoto: (photoIndex: number) => api.delete("/profile/photo", { data: { photoIndex } }),
  setProfileComplete: () => api.post("/profile/complete"),
  getSpousePreference: () => api.get("/spouse-preference"),
  updateSpousePreference: (data: Record<string, unknown>) => api.post("/spouse-preference", data),
};
