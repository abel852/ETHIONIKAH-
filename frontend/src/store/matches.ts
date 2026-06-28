import { create } from "zustand";
import type { Match, RecommendedProfile } from "@/types";
import { matchService } from "@/services/matches";

interface MatchState {
  matches: Match[];
  recommendations: RecommendedProfile[];
  favorites: string[];
  favoriteProfiles: Match[];
  isLoading: boolean;
  error: string | null;
  fetchMatches: (params?: Record<string, unknown>) => Promise<void>;
  fetchRecommendations: () => Promise<void>;
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  sendInterest: (id: string) => Promise<void>;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: [],
  recommendations: [],
  favorites: [],
  favoriteProfiles: [],
  isLoading: false,
  error: null,
  fetchMatches: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await matchService.search(params);
      set({ matches: data.matches || data.profiles || data, isLoading: false });
    } catch { set({ error: "Failed to load matches", isLoading: false }); }
  },
  fetchRecommendations: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await matchService.getRecommended();
      set({ recommendations: data.matches || data, isLoading: false });
    } catch { set({ error: "Failed to load recommendations", isLoading: false }); }
  },
  fetchFavorites: async () => {
    try {
      const { data } = await matchService.getFavorites();
      const list = data.favorites || data;
      set({ favorites: Array.isArray(list) ? list.map((m: any) => m.id) : [], favoriteProfiles: Array.isArray(list) ? list : [] });
    } catch { /* ignore */ }
  },
  toggleFavorite: async (id) => {
    const isFav = get().favorites.includes(id);
    try {
      if (isFav) { await matchService.removeFavorite(id); set((s) => ({ favorites: s.favorites.filter((f) => f !== id) })); }
      else { await matchService.addFavorite(id); set((s) => ({ favorites: [...s.favorites, id] })); }
    } catch { /* ignore */ }
  },
  sendInterest: async (id) => {
    try { await matchService.sendInterest(id); } catch { /* ignore */ }
  },
}));
