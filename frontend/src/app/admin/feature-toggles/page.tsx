"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { Puzzle, Power, PowerOff, RefreshCw } from "lucide-react";

const HIDDEN_KEYS = ["video_calls"];

export default function FeatureTogglesPage() {
  const [toggles, setToggles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchToggles = () => {
    adminService.getFeatureToggles().then(({ data }) => {
      const filtered = (data.toggles || []).filter((t: any) => !HIDDEN_KEYS.includes(t.key));
      setToggles(filtered);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchToggles(); }, []);

  const toggle = async (id: string, current: boolean) => {
    await adminService.updateFeatureToggle(id, !current);
    setToggles((prev) => prev.map((t) => t.id === id ? { ...t, enabled: !current } : t));
  };

  const categories = [...new Set(toggles.map((t) => t.category))];

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feature Toggles</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enable or disable platform modules and features</p>
        </div>
        <button onClick={fetchToggles} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-[#222240] rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat} className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-white/5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{cat}</h3>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {toggles.filter((t) => t.category === cat).map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{t.label}</p>
                      {t.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.description}</p>}
                    </div>
                    <button onClick={() => toggle(t.id, t.enabled)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${t.enabled ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center transition-transform duration-200 ${t.enabled ? "left-6" : "left-0.5"}`}>
                        {t.enabled ? <Power className="w-3 h-3 text-green-500" /> : <PowerOff className="w-3 h-3 text-gray-400" />}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {toggles.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700">
              <Puzzle className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 dark:text-gray-500">No feature toggles configured. Seed default data first.</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
