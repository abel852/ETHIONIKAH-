"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { Bot, Brain, Shield, Sliders, Cpu, Sparkles, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/context/I18nContext";

export default function AiAutomationPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [suspicious, setSuspicious] = useState<any>({});
  const [minScore, setMinScore] = useState(20);
  const [savingScore, setSavingScore] = useState(false);

  useEffect(() => {
    adminService.getSuspiciousActivity().then(({ data }) => setSuspicious(data.flags || {})).catch(() => {}).finally(() => setLoading(false));
    adminService.getSystemSettings().then(({ data }) => {
      const val = data.settings?.min_compatibility_score;
      if (typeof val === "number") setMinScore(val);
    }).catch(() => {});
  }, []);

  const handleSaveScore = useCallback(async () => {
    setSavingScore(true);
    try {
      await adminService.updateSystemSetting({ key: "min_compatibility_score", value: minScore, category: "matchmaking" });
      toast.success("Minimum compatibility score updated");
    } catch {
      toast.error("Failed to update setting");
    } finally {
      setSavingScore(false);
    }
  }, [minScore]);

  const modules = [
    { icon: Brain, label: "Fraud Detection AI", desc: "Auto-flag fake profiles, bots, and suspicious behaviour patterns", status: "Active", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
    { icon: Sliders, label: "Matchmaking Algorithm", desc: "Tweak compatibility scoring rules and match suggestions", status: "Active", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { icon: Shield, label: "Automated Moderation", desc: "Pre-filter inappropriate or non-compliant content before human review", status: "Active", color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
    { icon: Sparkles, label: "Recommendation Engine", desc: "Monitor and adjust how Suggested Matches are generated", status: "Active", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.aiAutomation.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('admin.aiAutomation.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {modules.map((m) => (
          <div key={m.label} className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${m.bg} flex items-center justify-center shrink-0`}>
                <m.icon className={`w-6 h-6 ${m.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{m.label}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.status === "Active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-100 text-amber-700"}`}>{m.status}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{m.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detection Stats */}
        <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Cpu className="w-4 h-4" /> Detection Statistics</h3>
          {loading ? (
            <div className="h-32 bg-gray-100 dark:bg-[#1a1a2e] rounded-xl animate-pulse" />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                <p className="text-xs text-gray-500 dark:text-gray-400">24h Registrations</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{suspicious.rapidRegistrations ?? 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                <p className="text-xs text-gray-500 dark:text-gray-400">Suspicious IPs</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{suspicious.suspiciousIPs?.length ?? 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                <p className="text-xs text-gray-500 dark:text-gray-400">Top Senders Flagged</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{suspicious.topMessageSenders?.length ?? 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                <p className="text-xs text-gray-500 dark:text-gray-400">Models Active</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">4</p>
              </div>
            </div>
          )}
        </div>

        {/* Algorithm Controls */}
        <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Sliders className="w-4 h-4" /> Matchmaking Algorithm Controls</h3>
          <div className="space-y-5">
            {/* Minimum Compatibility Score - functional */}
            <div>
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Minimum Compatibility Score</span>
                <span className="text-gray-500 font-bold text-sm">{minScore}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-100 dark:bg-gray-800 accent-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1.5">Profiles scoring below {minScore}% compatibility will be hidden from user match suggestions.</p>
              <button
                onClick={handleSaveScore}
                disabled={savingScore}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {savingScore ? "Saving..." : "Save Threshold"}
              </button>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
              {[
                { label: "Compatibility Score Weight", value: 70 },
                { label: "Location Proximity Weight", value: 50 },
                { label: "Religious Alignment Weight", value: 80 },
                { label: "Age Preference Match Weight", value: 60 },
              ].map((ctrl) => (
                <div key={ctrl.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700 dark:text-gray-300">{ctrl.label}</span>
                    <span className="text-gray-500">{ctrl.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${ctrl.value}%` }} />
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-400 mt-2">Algorithm weights can be fine-tuned based on platform requirements and user feedback.</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
