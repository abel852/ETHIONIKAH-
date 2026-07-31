"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { HeartHandshake, Users, DollarSign, TrendingUp, Gift } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

export default function AffiliatesPage() {
  const { t } = useI18n();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAffiliateReferrals().then(({ data }) => {
      setReferrals(data.referrals || []);
      setStats(data.stats || {});
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "Total Referrals", value: stats.total ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Converted", value: stats.converted ?? 0, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
    { label: "Rewarded", value: stats.rewarded ?? 0, icon: Gift, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
    { label: "Total Rewards", value: `Birr ${(stats.totalRewards ?? 0).toFixed(2)}`, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><HeartHandshake className="w-6 h-6" /> {t('admin.nav.community')} — Affiliate</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor referrals, conversions, and reward programs</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-[#222240] rounded-2xl animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((c) => (
            <div key={c.label} className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                  <c.icon className={`w-5 h-5 ${c.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{c.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{c.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Referral History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Referrer</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Referred</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Reward</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {referrals.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No referrals yet</td></tr>
              ) : referrals.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-white/5">
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{r.referrer?.firstName} {r.referrer?.lastName}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{r.referred?.firstName} {r.referred?.lastName}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">{r.code}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.status === "rewarded" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      r.status === "converted" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-900 dark:text-white">${r.rewardAmount?.toFixed(2) || "-"}</td>
                  <td className="px-5 py-3 text-right text-gray-500 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
