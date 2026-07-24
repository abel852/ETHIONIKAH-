import { create } from "zustand";
import type { Match, RecommendedProfile } from "@/types";
import { matchService } from "@/services/matches";

interface SuggestedProfile {
  id: string;
  firstName: string;
  lastName: string;
  username?: string;
  age: number;
  city: string | null;
  country: string | null;
  occupation: string | null;
  educationLevel: string | null;
  maritalStatus: string | null;
  religiousCommitment: string | null;
  bio: string | null;
  photos: string[];
  selfDescription: string | null;
  height: number | null;
  smokingHabits: string | null;
  childrenStatus: string | null;
  isVerified: boolean;
  compatibilityScore?: number;
  recommendationLevel?: string;
  strengths?: string[];
  potentialDifferences?: string[];
}

interface MatchState {
  matches: Match[];
  recommendations: RecommendedProfile[];
  suggestedMatches: SuggestedProfile[];
  suggestedTotal: number;
  suggestedPage: number;
  suggestedTotalPages: number;
  needsProfile: boolean;
  favorites: string[];
  favoriteProfiles: Match[];
  isLoading: boolean;
  error: string | null;
  fetchMatches: (params?: Record<string, unknown>) => Promise<void>;
  fetchRecommendations: () => Promise<void>;
  fetchSuggested: (page?: number) => Promise<void>;
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  sendInterest: (id: string) => Promise<void>;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: [],
  recommendations: [],
  suggestedMatches: [],
  suggestedTotal: 0,
  suggestedPage: 1,
  suggestedTotalPages: 0,
  needsProfile: false,
  favorites: [],
  favoriteProfiles: [],
  isLoading: true,
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
      set({ recommendations: data.matches || data, needsProfile: data.needsProfile || false, isLoading: false });
    } catch { set({ error: "Failed to load recommendations", isLoading: false }); }
  },
  fetchSuggested: async (page = 1) => {
    set({ isLoading: page === 1, error: null });
    try {
      const { data } = await matchService.getSuggested({ page, limit: 12 });
      set((s) => ({
        suggestedMatches: page <= 1 ? (data.matches || []) : [...s.suggestedMatches, ...(data.matches || [])],
        suggestedTotal: data.total || 0,
        suggestedPage: data.page || 1,
        suggestedTotalPages: data.totalPages || 0,
        needsProfile: data.needsProfile || false,
        isLoading: false,
      }));
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to load suggestions";
      set({ error: msg, isLoading: false });
    }
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
    await matchService.sendInterest(id);
  },
}));
