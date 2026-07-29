import api from "@/lib/api";

export const matchService = {
  getRecommended: () => api.get("/matches/recommended"),
  getSuggested: (params?: Record<string, unknown>) => api.get("/matches/suggested", { params }),
  search: (params?: Record<string, unknown>) => api.get("/matches/search", { params }),
  sendInterest: (matchedUserId: string) => api.post("/matches/interest", { matchedUserId }),
  passProfile: (matchedUserId: string) => api.post("/matches/pass", { matchedUserId }),
  respondToInterest: (id: string, status: "accepted" | "rejected") => api.put(`/matches/${id}/respond`, { status }),
  getMyMatches: () => api.get("/matches/my-matches"),
  getFavorites: () => api.get("/matches/favorites"),
  addFavorite: (favoritedUserId: string) => api.post("/matches/favorites", { favoritedUserId }),
  removeFavorite: (favoritedUserId: string) => api.delete(`/matches/favorites/${favoritedUserId}`),
  getLikesReceived: () => api.get("/matches/likes-received"),
  getLikesSent: () => api.get("/matches/likes-sent"),
  getVisitors: () => api.get("/matches/visitors"),
  removeInterest: (matchedUserId: string) => api.post("/matches/remove-interest", { matchedUserId }),
};
