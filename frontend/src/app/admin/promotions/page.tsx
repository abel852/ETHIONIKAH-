"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { Tag, Plus, Percent, DollarSign, Calendar, CheckCircle, XCircle } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

export default function PromotionsPage() {
  const { t } = useI18n();
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", type: "percentage", value: 0, maxUses: null as number | null, minAmount: null as number | null, startsAt: "", expiresAt: "" as string | null, isActive: true });

  useEffect(() => {
    adminService.getPromotions().then(({ data }) => setPromotions(data.promotions || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const createPromo = async () => {
    try {
      const { data } = await adminService.createPromotion(form);
      setPromotions((prev) => [data.promotion, ...prev]);
      setShowForm(false);
      setForm({ code: "", type: "percentage", value: 0, maxUses: null, minAmount: null, startsAt: "", expiresAt: null, isActive: true });
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed");
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.nav.revenue')} — Promotions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage coupon codes, seasonal offers, and bundle deals</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1a2e] dark:bg-white text-white dark:text-[#1a1a2e] text-sm font-medium hover:opacity-90 transition-opacity"
        ><Plus className="w-4 h-4" /> New Promotion</button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Create Promotion</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">Code</label><input value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" /></div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">Type</label><select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm"><option value="percentage">Percentage</option><option value="fixed">Fixed Amount</option><option value="bundle">Bundle</option></select></div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">Value</label><input type="number" value={form.value} onChange={(e) => setForm({...form, value: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" /></div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">Max Uses</label><input type="number" value={form.maxUses ?? ""} onChange={(e) => setForm({...form, maxUses: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" /></div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">Min Amount</label><input type="number" value={form.minAmount ?? ""} onChange={(e) => setForm({...form, minAmount: e.target.value ? parseFloat(e.target.value) : null})} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" /></div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">Start Date</label><input type="date" value={form.startsAt} onChange={(e) => setForm({...form, startsAt: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" /></div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">Expires (optional)</label><input type="date" value={form.expiresAt ?? ""} onChange={(e) => setForm({...form, expiresAt: e.target.value || null})} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" /></div>
            <div className="flex items-end">
              <button onClick={createPromo} className="w-full px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors">Create</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-white/5">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Used</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Valid</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : promotions.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">No promotions yet</td></tr>
              ) : promotions.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-white/5">
                  <td className="px-5 py-3 font-mono font-bold text-gray-900 dark:text-white">{p.code}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{p.type}</td>
                  <td className="px-5 py-3">{p.type === "percentage" ? `${p.value}%` : `$${p.value}`}</td>
                  <td className="px-5 py-3 text-gray-500">{p.usedCount}{p.maxUses ? ` / ${p.maxUses}` : ""}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
                      {p.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">{p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : "No expiry"}</td>
                  <td className="px-5 py-3 text-right text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
