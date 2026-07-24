import api from "@/lib/api";

export interface HealthInfoData {
  hivStatus?: string;
  stdStatus?: string;
  stdDetails?: string;
  hereditaryDiseases?: string;
  hereditaryDetails?: string;
  chronicConditions?: string;
  chronicDetails?: string;
  disabilities?: string;
  disabilityDetails?: string;
  otherConditions?: string;
  shareWithMatches?: boolean;
  hivMatchPreference?: string;
  stdMatchPreference?: string;
  hereditaryMatchPreference?: string;
  healthMatchPreference?: string;
}

export const healthService = {
  save: (data: HealthInfoData) => api.post("/health", data),
  getMy: () => api.get("/health/me"),
  delete: () => api.delete("/health/me"),
  getPublic: (profileId: string) => api.get(`/health/public/${profileId}`),
};
