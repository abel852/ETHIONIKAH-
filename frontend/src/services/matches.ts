import api from "@/lib/api";

export const matchService = {
  getRecommended: () => api.get("/matches/recommended"),
  search: (params?: Record<string, unknown>) => api.get("/matches/search", { params }),
  sendInterest: (matchedUserId: string) => api.post("/matches/interest", { matchedUserId }),
  respondToInterest: (id: string, status: "accepted" | "rejected") => api.put(`/matches/${id}/respond`, { status }),
  getMyMatches: () => api.get("/matches/my-matches"),
  getFavorites: () => api.get("/matches/favorites"),
  addFavorite: (favoritedUserId: string) => api.post("/matches/favorites", { favoritedUserId }),
  removeFavorite: (favoritedUserId: string) => api.delete(`/matches/favorites/${favoritedUserId}`),
};
