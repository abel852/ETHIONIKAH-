"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { CreditCard, DollarSign, TrendingUp, Users, Calendar } from "lucide-react";

export default function PaymentsPage() {
  const [data, setData] = useState<any>({});

  useEffect(() => {
    adminService.getDashboardData().then(({ data: res }) => setData(res.dashboard?.stats || {})).catch(() => {});
  }, []);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payments & Revenue</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track subscriptions, revenue, and payment history</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Revenue", value: `$${(data.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
          { label: "This Month", value: `$${(data.revenueThisMonth || 0).toLocaleString()}`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Active Subscriptions", value: data.activeSubscriptions ?? 0, icon: Users, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
          { label: "Pending Verifications", value: data.pendingVerifications ?? 0, icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
        ].map((c) => (
          <div key={c.label} className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}><c.icon className={`w-5 h-5 ${c.color}`} /></div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{c.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{c.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Subscription Management</h2>
        <a href="/admin/subscriptions" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1a2e] dark:bg-white text-white dark:text-[#1a1a2e] text-sm font-medium hover:opacity-90 transition-opacity">
          <CreditCard className="w-4 h-4" /> Manage Subscriptions
        </a>
      </div>
    </AdminLayout>
  );
}
