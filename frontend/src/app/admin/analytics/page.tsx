"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, UserCheck, ShieldAlert, AlertTriangle, DollarSign,
  Activity, TrendingUp, CreditCard, Wallet, MessageSquare,
  Ban, UserX,
} from "lucide-react";
import { Card } from "@/components/common";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { useI18n } from "@/context/I18nContext";

const glass = "bg-white dark:bg-white/[0.06] backdrop-blur-xl border-charcoal-100 dark:border-white/10";

export default function AdminAnalyticsPage() {
  const { t } = useI18n();
  const [analytics, setAnalytics] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, rRes, psRes] = await Promise.allSettled([
        adminService.getAnalytics(),
        adminService.getRevenueStats(),
        adminService.getPaymentStats(),
      ]);
      if (aRes.status === "fulfilled") setAnalytics(aRes.value.data.analytics || {});
      if (rRes.status === "fulfilled") setRevenue(rRes.value.data.data || rRes.value.data || {});
      if (psRes.status === "fulfilled") setPaymentStats(psRes.value.data.data || psRes.value.data || {});
    } catch (e) {
      console.error("Analytics fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(() => { if (document.hidden) return; fetchAnalytics(); }, 120000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  const a = analytics || {};
  const rev = revenue || {};
  const ps = paymentStats || {};

  const conversionRate = a.totalUsers ? (((rev.activeSubscriptions ?? 0) / a.totalUsers) * 100).toFixed(1) : "0";
  const arpu = rev.activeSubscriptions ? ((rev.totalRevenue ?? 0) / rev.activeSubscriptions).toFixed(2) : "0";

  const statsCards = [
    { label: "Total Users", value: a.totalUsers ?? 0, icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
    { label: "Active Users", value: a.activeUsers ?? 0, icon: Activity, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
    { label: "Verified Users", value: a.verifiedUsers ?? 0, icon: UserCheck, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { label: "Matches", value: a.totalMatches ?? 0, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
    { label: "Open Reports", value: a.totalReports ?? 0, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
    { label: "Total Revenue", value: `$${(a.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { label: "Total Messages", value: a.totalMessages ?? 0, icon: MessageSquare, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-500/10" },
    { label: "Unread Messages", value: a.unreadMessages ?? 0, icon: MessageSquare, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
    { label: "Open Complaints", value: a.openComplaints ?? 0, icon: ShieldAlert, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
    { label: "Suspended Users", value: a.suspendedUsers ?? 0, icon: UserX, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
    { label: "Banned Users", value: a.bannedUsers ?? 0, icon: Ban, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
    { label: "Pending Verifications", value: a.pendingVerifications ?? 0, icon: UserCheck, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
  ];

  const paymentCards = [
    { label: "Total Payments", value: a.paymentStats?.total ?? ps.total ?? 0, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
    { label: "Approved", value: a.paymentStats?.approved ?? ps.approved ?? 0, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
    { label: "Pending", value: a.paymentStats?.pending ?? ps.pending ?? 0, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { label: "Rejected", value: a.paymentStats?.rejected ?? ps.rejected ?? 0, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
  ];

  const genderCards = [
    { label: "Male Users", value: a.genderDistribution?.male ?? 0, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
    { label: "Female Users", value: a.genderDistribution?.female ?? 0, color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-500/10" },
  ];

  const subscriptionCards = [
    { label: "Total Subscriptions", value: a.subscriptionStats?.total ?? 0, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
    { label: "Active Subscriptions", value: a.subscriptionStats?.active ?? 0, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
  ];

  const revenueStatsCards = [
    { label: "Total Revenue", value: `$${(rev.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: "text-accent", bg: "bg-amber-50 dark:bg-amber-500/10", sub: "Lifetime" },
    { label: "Active Subs", value: rev.activeSubscriptions ?? 0, icon: CreditCard, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10", sub: `${rev.premiumSubscriptions ?? 0} platinum, ${rev.basicSubscriptions ?? 0} gold` },
    { label: "Conversion Rate", value: `${conversionRate}%`, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10", sub: "Free to paid" },
    { label: "ARPU", value: `$${arpu}`, icon: Wallet, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", sub: "Avg revenue/user" },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="h-8 w-48 bg-charcoal-100 dark:bg-charcoal-800 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => <div key={i} className="h-28 bg-charcoal-100 dark:bg-charcoal-800 rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white">{t('admin.analytics.title')}</h1>
        <p className="text-sm text-charcoal-500 dark:text-white/60 mt-1">{t('admin.analytics.subtitle')}</p>
      </div>

      {/* Platform Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {statsCards.map((stat) => (
          <div key={stat.label}>
            <Card hover={false} className={glass}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white mb-0.5">{stat.value}</p>
              <p className="text-xs text-charcoal-400 dark:text-white/60">{stat.label}</p>
            </Card>
          </div>
        ))}
      </div>

      {/* Revenue Highlight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {revenueStatsCards.map((stat) => (
          <div key={stat.label} className={`${glass} rounded-2xl p-4 border`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-xl font-bold text-charcoal-900 dark:text-white mb-0.5">{stat.value}</p>
            <p className="text-xs font-medium text-charcoal-600 dark:text-white/80">{stat.label}</p>
            <p className="text-[11px] text-charcoal-400 dark:text-white/50 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Payment Stats */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">Payment Statistics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {paymentCards.map((stat) => (
            <div key={stat.label} className={`${glass} rounded-2xl p-4 border`}>
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                <CreditCard className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-xl font-bold text-charcoal-900 dark:text-white mb-0.5">{stat.value}</p>
              <p className="text-xs font-medium text-charcoal-600 dark:text-white/80">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Gender & Subscription Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">Gender Distribution</h2>
          <div className="grid grid-cols-2 gap-4">
            {genderCards.map((stat) => (
              <div key={stat.label} className={`${glass} rounded-2xl p-4 border`}>
                <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                  <Users className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className="text-xl font-bold text-charcoal-900 dark:text-white mb-0.5">{stat.value}</p>
                <p className="text-xs font-medium text-charcoal-600 dark:text-white/80">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">Subscription Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            {subscriptionCards.map((stat) => (
              <div key={stat.label} className={`${glass} rounded-2xl p-4 border`}>
                <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                  <CreditCard className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className="text-xl font-bold text-charcoal-900 dark:text-white mb-0.5">{stat.value}</p>
                <p className="text-xs font-medium text-charcoal-600 dark:text-white/80">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Stats Table */}
      <Card className={glass}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-charcoal-900 dark:text-white">Platform Statistics</h3>
            <p className="text-xs text-charcoal-400 dark:text-white/60">Detailed metrics breakdown</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: a.totalUsers ?? 0, sub: `+${a.newUsersThisMonth ?? 0} this month` },
            { label: "Active Users", value: a.activeUsers ?? 0, sub: `${Math.round(((a.activeUsers ?? 0) / (a.totalUsers || 1)) * 100)}% engagement rate` },
            { label: "Verified Users", value: a.verifiedUsers ?? 0, sub: `${a.pendingVerifications ?? 0} pending review` },
            { label: "Total Matches", value: a.totalMatches ?? 0, sub: `successful connections` },
            { label: "New Users (30d)", value: a.newUsersThisMonth ?? 0, sub: `this month` },
            { label: "Open Reports", value: a.totalReports ?? 0, sub: `need attention` },
            { label: "Total Revenue", value: `$${(a.totalRevenue ?? 0).toLocaleString()}`, sub: `lifetime revenue` },
            { label: "Active Subs", value: rev.activeSubscriptions ?? a.subscriptionStats?.active ?? 0, sub: `${rev.premiumSubscriptions ?? 0} platinum, ${rev.basicSubscriptions ?? 0} gold` },
            { label: "Total Messages", value: a.totalMessages ?? 0, sub: `${a.unreadMessages ?? 0} unread` },
            { label: "Open Complaints", value: a.openComplaints ?? 0, sub: `need attention` },
            { label: "Suspended Users", value: a.suspendedUsers ?? 0, sub: `currently suspended` },
            { label: "Banned Users", value: a.bannedUsers ?? 0, sub: `permanently banned` },
          ].map((stat) => (
            <div key={stat.label} className="p-4 bg-white/50 dark:bg-white/[0.04] rounded-xl border border-charcoal-100/50 dark:border-white/5">
              <p className="text-xs text-charcoal-400 dark:text-white/60 mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-charcoal-900 dark:text-white">{stat.value}</p>
              <p className="text-[11px] text-charcoal-400 dark:text-white/50 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>
      </Card>
    </AdminLayout>
  );
}
