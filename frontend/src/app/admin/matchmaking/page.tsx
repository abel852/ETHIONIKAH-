"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import {
  Heart, Sliders, Save, Sparkles, Users, TrendingUp,
  Shield, Info, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/context/I18nContext";

const CATEGORY_INFO = [
  { key: "religious", label: "Religious Compatibility", defaultWeight: 15, icon: "🕌", desc: "Prayer habits, Quran frequency, religious commitment, Islamic classes" },
  { key: "age", label: "Age Compatibility", defaultWeight: 12, icon: "📅", desc: "Age difference, preferred age range matching" },
  { key: "maritalStatus", label: "Marital Status", defaultWeight: 10, icon: "💍", desc: "Current marital status match, preferred marital status" },
  { key: "wali", label: "Wali & Family Involvement", defaultWeight: 10, icon: "🤝", desc: "Family involvement level, gender interaction preferences, wali oversight" },
  { key: "children", label: "Children Preference", defaultWeight: 10, icon: "👶", desc: "Children desire, existing children status, preferred children status" },
  { key: "health", label: "Health & Diseases", defaultWeight: 10, icon: "⚕️", desc: "HIV, STD, hereditary diseases, chronic conditions, disabilities" },
  { key: "marriageGoals", label: "Marriage Goals", defaultWeight: 8, icon: "🎯", desc: "Marriage timeline, polygamy preference" },
  { key: "personal", label: "Personal Compatibility", defaultWeight: 7, icon: "👤", desc: "Height, education level, languages spoken" },
  { key: "location", label: "Location Compatibility", defaultWeight: 5, icon: "📍", desc: "Country, city, preferred location" },
  { key: "lifestyle", label: "Lifestyle Compatibility", defaultWeight: 5, icon: "🌿", desc: "Smoking, khat, exercise, living preference" },
  { key: "education", label: "Education & Career", defaultWeight: 5, icon: "🎓", desc: "Education level, employment status" },
  { key: "family", label: "Family & Cultural", defaultWeight: 2, icon: "👨‍👩‍👧", desc: "Ethnic background, mother tongue" },
  { key: "hobbies", label: "Interests & Hobbies", defaultWeight: 1, icon: "�", desc: "Shared interests, qualities" },
];

const DEFAULT_WEIGHTS = CATEGORY_INFO.reduce((acc, c) => { acc[c.key] = c.defaultWeight; return acc; }, {} as Record<string, number>);

export default function MatchmakingPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    adminService
      .getSystemSettings()
      .then(({ data }) => {
        setSettings(data.settings || {});
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const updateSetting = useCallback(async (key: string, value: any, category: string) => {
    setSaving(key);
    try {
      await adminService.updateSystemSetting({ key, value, category });
      setSettings((prev) => ({ ...prev, [key]: value }));
      toast.success("Setting updated successfully");
    } catch {
      toast.error("Failed to update setting");
    } finally {
      setSaving(null);
    }
  }, []);

  const minScore = typeof settings.min_compatibility_score === "number" ? settings.min_compatibility_score : 20;
  const matchEnabled = settings.matchmaking_enabled !== false;

  // Get current weight for a category (from DB settings or fallback to default)
  const getWeight = (key: string) => {
    const dbVal = settings[`matchmaking_weight_${key}`];
    return typeof dbVal === "number" ? dbVal : DEFAULT_WEIGHTS[key] ?? 0;
  };

  const totalWeight = CATEGORY_INFO.reduce((sum, c) => sum + getWeight(c.key), 0);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Heart className="w-7 h-7 text-rose-500" />
          {t('admin.matchmaking.title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Control how the AI matchmaking algorithm filters and scores profiles for users
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Min Score</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{minScore}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Categories</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">8</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{matchEnabled ? "Active" : "Disabled"}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Weight</p>
              <p className={`text-xl font-bold ${totalWeight === 100 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>{totalWeight}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Minimum Compatibility Score */}
          <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-500" />
              Minimum Compatibility Score
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Profiles scoring below this threshold will be hidden from user match suggestions
            </p>

            <div className="flex items-center gap-4 mb-4">
              <input
                type="range"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  setSettings((prev) => ({ ...prev, min_compatibility_score: v }));
                }}
                className="flex-1 h-3 rounded-full appearance-none cursor-pointer bg-gray-100 dark:bg-gray-800 accent-blue-500"
              />
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={minScore}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                    setSettings((prev) => ({ ...prev, min_compatibility_score: v }));
                  }}
                  className="w-16 px-2 py-1.5 text-center text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
                <span className="text-sm font-medium text-gray-500">%</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              {[0, 20, 40, 60, 80, 100].map((v) => (
                <button
                  key={v}
                  onClick={() => setSettings((prev) => ({ ...prev, min_compatibility_score: v }))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    minScore === v
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {v}%
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {minScore === 0
                  ? "All profiles will be shown regardless of compatibility"
                  : minScore >= 80
                  ? "Very strict — only highly compatible profiles shown"
                  : minScore >= 50
                  ? "Moderate — decent quality matches"
                  : "Lenient — most profiles will appear"}
              </p>
              <button
                onClick={() => updateSetting("min_compatibility_score", minScore, "matchmaking")}
                disabled={saving === "min_compatibility_score"}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving === "min_compatibility_score" ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Scoring Categories & Weights
              </h3>
              <span className={`text-sm font-bold ${totalWeight === 100 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                Total: {totalWeight}%
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Adjust the weight of each category — the algorithm uses these percentages to calculate compatibility scores
            </p>

            {totalWeight !== 100 && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  ⚠️ Weights should ideally sum to 100%. Current total is {totalWeight}%. The algorithm will still work but scores may be skewed.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {CATEGORY_INFO.map((cat) => {
                const w = getWeight(cat.key);
                const settingKey = `matchmaking_weight_${cat.key}`;
                return (
                  <div key={cat.key} className="p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl shrink-0">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{cat.label}</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={w}
                              onChange={(e) => {
                                const v = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                setSettings((prev) => ({ ...prev, [settingKey]: v }));
                              }}
                              className="w-14 px-2 py-1 text-center text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-500">%</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 truncate">{cat.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={50}
                        value={w}
                        onChange={(e) => {
                          const v = parseInt(e.target.value);
                          setSettings((prev) => ({ ...prev, [settingKey]: v }));
                        }}
                        className="flex-1 h-2 rounded-full appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700 accent-blue-500"
                      />
                      <button
                        onClick={() => updateSetting(settingKey, w, "matchmaking")}
                        disabled={saving === settingKey}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors disabled:opacity-50 shrink-0"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {saving === settingKey ? "Saving..." : "Save"}
                      </button>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                        style={{ width: `${Math.min(w * 2, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reset to defaults button */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  CATEGORY_INFO.forEach((cat) => {
                    const sk = `matchmaking_weight_${cat.key}`;
                    setSettings((prev) => ({ ...prev, [sk]: cat.defaultWeight }));
                    updateSetting(sk, cat.defaultWeight, "matchmaking");
                  });
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Enable/Disable Matchmaking */}
          <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              Matchmaking Status
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Enable or disable the matchmaking feature for all users
            </p>

            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {matchEnabled ? "Enabled" : "Disabled"}
                </p>
                <p className="text-xs text-gray-400">
                  {matchEnabled ? "Users can see match suggestions" : "Match suggestions are hidden"}
                </p>
              </div>
              <button
                onClick={() => updateSetting("matchmaking_enabled", !matchEnabled, "matchmaking")}
                disabled={saving === "matchmaking_enabled"}
                className={`relative rounded-full transition-all duration-300 shrink-0 ${
                  matchEnabled ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
                style={{ width: "48px", height: "26px" }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300"
                  style={{ transform: matchEnabled ? "translateX(22px)" : "translateX(0)" }}
                />
              </button>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" />
              How It Works
            </h3>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <p>1. The algorithm scores each profile across 8 weighted categories</p>
              <p>2. Scores are combined into a 0-100% compatibility rating</p>
              <p>3. Profiles below the minimum threshold are filtered out</p>
              <p>4. Results are sorted by highest compatibility first</p>
              <p>5. Health penalties and verification bonuses are applied</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-purple-500" />
              Quick Presets
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setSettings((prev) => ({ ...prev, min_compatibility_score: 0 }));
                  updateSetting("min_compatibility_score", 0, "matchmaking");
                }}
                className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white">Show All Profiles</p>
                <p className="text-xs text-gray-400">Set minimum to 0%</p>
              </button>
              <button
                onClick={() => {
                  setSettings((prev) => ({ ...prev, min_compatibility_score: 20 }));
                  updateSetting("min_compatibility_score", 20, "matchmaking");
                }}
                className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white">Default (Recommended)</p>
                <p className="text-xs text-gray-400">Set minimum to 20%</p>
              </button>
              <button
                onClick={() => {
                  setSettings((prev) => ({ ...prev, min_compatibility_score: 50 }));
                  updateSetting("min_compatibility_score", 50, "matchmaking");
                }}
                className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white">Quality Matches</p>
                <p className="text-xs text-gray-400">Set minimum to 50%</p>
              </button>
              <button
                onClick={() => {
                  setSettings((prev) => ({ ...prev, min_compatibility_score: 75 }));
                  updateSetting("min_compatibility_score", 75, "matchmaking");
                }}
                className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white">Strict — High Compatibility Only</p>
                <p className="text-xs text-gray-400">Set minimum to 75%</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
