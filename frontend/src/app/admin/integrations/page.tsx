"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { Bell, CheckCircle } from "lucide-react";

export default function IntegrationsPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getNotificationTemplates().then(({ data }) => {
      setTemplates(data.templates || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Templates</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Customize system emails, SMS, and push notifications</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-[#222240] rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {templates.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Bell className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 dark:text-gray-500">No notification templates configured</p>
              </div>
            ) : templates.map((t) => (
              <div key={t.id} className="p-5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{t.key.replace(/_/g, " ")}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{t.type}</span>
                      {t.subject && <><span className="text-gray-300 dark:text-gray-600">·</span><span className="text-xs text-gray-500">{t.subject}</span></>}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    t.type === "email" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                    t.type === "sms" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                  }`}>{t.type}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-100 dark:border-gray-800">{t.body}</p>
                {t.variables?.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-xs text-gray-400">Variables:</span>
                    {t.variables.map((v: string) => (
                      <span key={v} className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">{`{{${v}}}`}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
