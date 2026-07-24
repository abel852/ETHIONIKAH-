"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { Shield, Flag, Scale, UserCheck, CheckCircle, XCircle, Clock, AlertTriangle, Search } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

export default function CommunityPage() {
  const { t } = useI18n();
  const [flags, setFlags] = useState<any[]>([]);
  const [compliance, setCompliance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("flags");

  useEffect(() => {
    Promise.all([
      adminService.getContentFlags().catch(() => ({ data: { flags: [] } })),
      adminService.getCompliance().catch(() => ({ data: { checks: [] } })),
    ]).then(([f, c]) => {
      setFlags(f.data.flags || []);
      setCompliance(c.data.checks || []);
    }).finally(() => setLoading(false));
  }, []);

  const reviewFlag = async (id: string, status: string, adminNote?: string) => {
    await adminService.reviewContentFlag(id, status, adminNote);
    setFlags((prev) => prev.map((f) => f.id === id ? { ...f, status, adminNote, reviewedAt: new Date().toISOString() } : f));
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.community.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('admin.community.subtitle')}</p>
      </div>

      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-gray-100 dark:bg-white/5 w-fit">
        {[
          { id: "flags", label: "Content Flags", icon: Flag },
          { id: "compliance", label: "Compliance", icon: Scale },
          { id: "wali", label: "Wali Oversight", icon: UserCheck },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? "bg-white dark:bg-[#2e2e42] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-[#222240] rounded-xl animate-pulse" />)}</div>
      ) : tab === "flags" ? (
        <div className="space-y-3">
          {flags.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No flagged content</p>
            </div>
          )}
          {flags.map((flag) => (
            <div key={flag.id} className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      flag.status === "pending" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                      flag.status === "reviewed" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    }`}>{flag.status}</span>
                    <span className="text-xs text-gray-400">{flag.targetType}</span>
                    {flag.aiScore && <span className="text-xs text-purple-500">AI Score: {flag.aiScore.toFixed(2)}</span>}
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{flag.reason}</p>
                  <p className="text-xs text-gray-400 mt-1">Target: {flag.targetId} | {new Date(flag.createdAt).toLocaleDateString()}</p>
                </div>
                {flag.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => reviewFlag(flag.id, "reviewed", "Approved after review")}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 transition-colors"
                    >Approve</button>
                    <button onClick={() => reviewFlag(flag.id, "dismissed", "No violation")}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors"
                    >Dismiss</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : tab === "compliance" ? (
        <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Cultural & Religious Compliance Checks</p>
          {compliance.length === 0 ? (
            <p className="text-center py-8 text-gray-400">No compliance issues found</p>
          ) : compliance.map((c: any) => (
            <div key={c.id} className="flex items-center gap-3 p-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-800 dark:text-gray-200">{c.issue}</p>
                <p className="text-xs text-gray-400">{c.user?.firstName} {c.user?.lastName} - {c.field}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.user?.isVerified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                {c.user?.isVerified ? "Verified" : "Unverified"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Guardian / Wali Involvement</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Wali oversight is currently configured through profile spouse preferences. Feature toggle available in System Settings.</p>
          <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Enable the &quot;Wali Oversight&quot; feature toggle to activate guardian involvement workflows
            </p>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
