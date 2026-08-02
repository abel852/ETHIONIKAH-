"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, UserCheck, ShieldAlert, AlertTriangle, DollarSign,
  Activity, TrendingUp, CreditCard, Wallet, MessageSquare,
  Ban, UserX, Download, Calendar,
} from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";

export default function AdminAnalyticsPage() {
  const { t } = useI18n();
  const [analytics, setAnalytics] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

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
    } catch {
      // Silent fail
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

  const monthlyData = a.monthlyData || [];

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const jsPDF = (await import("jspdf")).default;
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = 210;
      const pageH = 297;
      const margin = 20;
      let y = 0;

      const ensureSpace = (h: number) => {
        if (y + h > pageH - 15) {
          pdf.addPage();
          y = 20;
        }
      };

      // HEADER
      pdf.setFillColor(15, 15, 16);
      pdf.rect(0, 0, pageW, 45, "F");

      // Logo — load image and place in header
      try {
        const logoResp = await fetch("/application.png");
        const logoBlob = await logoResp.blob();
        const logoReader = new FileReader();
        const logoDataUrl: string = await new Promise((resolve, reject) => {
          logoReader.onload = () => resolve(logoReader.result as string);
          logoReader.onerror = reject;
          logoReader.readAsDataURL(logoBlob);
        });
        pdf.addImage(logoDataUrl, "PNG", 12, 8, 28, 28);
      } catch {
        // If logo fails to load, continue without it
      }

      pdf.setTextColor(212, 175, 55);
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text("ETHIONIKAH", pageW / 2, 20, { align: "center" });
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(200, 200, 200);
      pdf.text("Analytics Report", pageW / 2, 28, { align: "center" });
      pdf.setFontSize(9);
      pdf.setTextColor(160, 160, 160);
      pdf.text("Generated: " + new Date().toLocaleString(), pageW / 2, 35, { align: "center" });

      pdf.setDrawColor(212, 175, 55);
      pdf.setLineWidth(0.8);
      pdf.line(margin, 48, pageW - margin, 48);

      y = 58;

      // SECTION 1: PLATFORM OVERVIEW
      pdf.setTextColor(212, 175, 55);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("1. Platform Overview", margin, y);
      y += 8;
      pdf.setDrawColor(212, 175, 55);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageW - margin, y);
      y += 8;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(60, 60, 60);
      const overviewItems: [string, string][] = [
        ["Total Users", String(a.totalUsers ?? 0)],
        ["Active Users", String(a.activeUsers ?? 0)],
        ["Verified Users", String(a.verifiedUsers ?? 0)],
        ["Pending Verifications", String(a.pendingVerifications ?? 0)],
        ["New Users (30 days)", String(a.newUsersThisMonth ?? 0)],
        ["Total Matches", String(a.totalMatches ?? 0)],
        ["Total Messages", String(a.totalMessages ?? 0)],
        ["Unread Messages", String(a.unreadMessages ?? 0)],
        ["Open Reports", String(a.totalReports ?? 0)],
        ["Open Complaints", String(a.openComplaints ?? 0)],
        ["Suspended Users", String(a.suspendedUsers ?? 0)],
        ["Banned Users", String(a.bannedUsers ?? 0)],
      ];
      overviewItems.forEach(([label, val]) => {
        ensureSpace(7);
        pdf.setFont("helvetica", "normal");
        pdf.text(label, margin + 4, y);
        pdf.setFont("helvetica", "bold");
        pdf.text(val, pageW - margin - 4, y, { align: "right" });
        y += 7;
      });

      y += 6;

      // SECTION 2: REVENUE
      ensureSpace(20);
      pdf.setTextColor(212, 175, 55);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("2. Revenue & Subscriptions", margin, y);
      y += 8;
      pdf.setDrawColor(212, 175, 55);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageW - margin, y);
      y += 8;

      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      const revenueItems: [string, string][] = [
        ["Total Revenue", "Birr " + (rev.totalRevenue ?? a.totalRevenue ?? 0).toLocaleString()],
        ["Total Payments", String(rev.totalPayments ?? a.paymentStats?.total ?? ps.total ?? 0)],
        ["Approved Payments", String(a.paymentStats?.approved ?? ps.approved ?? 0)],
        ["Pending Payments", String(a.paymentStats?.pending ?? ps.pending ?? 0)],
        ["Rejected Payments", String(a.paymentStats?.rejected ?? ps.rejected ?? 0)],
        ["Active Subscriptions", String(rev.activeSubscriptions ?? a.subscriptionStats?.active ?? 0)],
        ["Total Subscriptions", String(a.subscriptionStats?.total ?? 0)],
        ["Platinum Subscriptions", String(rev.premiumSubscriptions ?? 0)],
        ["Gold Subscriptions", String(rev.basicSubscriptions ?? 0)],
        ["Conversion Rate", conversionRate + "%"],
        ["ARPU (Avg Revenue/User)", "Birr " + arpu],
      ];
      revenueItems.forEach(([label, val]) => {
        ensureSpace(7);
        pdf.setFont("helvetica", "normal");
        pdf.text(label, margin + 4, y);
        pdf.setFont("helvetica", "bold");
        pdf.text(val, pageW - margin - 4, y, { align: "right" });
        y += 7;
      });

      y += 6;

      // SECTION 3: GENDER
      ensureSpace(20);
      pdf.setTextColor(212, 175, 55);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("3. Gender Distribution", margin, y);
      y += 8;
      pdf.setDrawColor(212, 175, 55);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageW - margin, y);
      y += 8;

      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      const totalGender = (a.genderDistribution?.male ?? 0) + (a.genderDistribution?.female ?? 0);
      const malePct = totalGender ? (((a.genderDistribution?.male ?? 0) / totalGender) * 100).toFixed(1) : "0";
      const femalePct = totalGender ? (((a.genderDistribution?.female ?? 0) / totalGender) * 100).toFixed(1) : "0";
      const genderItems: [string, string][] = [
        ["Male Users", (a.genderDistribution?.male ?? 0) + " (" + malePct + "%)"],
        ["Female Users", (a.genderDistribution?.female ?? 0) + " (" + femalePct + "%)"],
      ];
      genderItems.forEach(([label, val]) => {
        ensureSpace(7);
        pdf.setFont("helvetica", "normal");
        pdf.text(label, margin + 4, y);
        pdf.setFont("helvetica", "bold");
        pdf.text(val, pageW - margin - 4, y, { align: "right" });
        y += 7;
      });

      y += 6;

      // SECTION 4: MONTHLY BREAKDOWN
      ensureSpace(20);
      pdf.setTextColor(212, 175, 55);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("4. Monthly Breakdown (Last 6 Months)", margin, y);
      y += 8;
      pdf.setDrawColor(212, 175, 55);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageW - margin, y);
      y += 10;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(100, 100, 100);
      pdf.text("Month", margin + 4, y);
      pdf.text("New Users", margin + 70, y, { align: "right" });
      pdf.text("Matches", margin + 115, y, { align: "right" });
      pdf.text("Revenue (Birr)", pageW - margin - 4, y, { align: "right" });
      y += 2;
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.2);
      pdf.line(margin, y, pageW - margin, y);
      y += 7;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(60, 60, 60);
      monthlyData.forEach((m: any) => {
        ensureSpace(7);
        pdf.text(String(m.month || ""), margin + 4, y);
        pdf.text(String(m.users ?? 0), margin + 70, y, { align: "right" });
        pdf.text(String(m.matches ?? 0), margin + 115, y, { align: "right" });
        pdf.setFont("helvetica", "bold");
        pdf.text(String((m.revenue ?? 0).toLocaleString()), pageW - margin - 4, y, { align: "right" });
        pdf.setFont("helvetica", "normal");
        y += 7;
      });

      // FOOTER
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text("EthioNikah Admin Analytics Report - Page " + i + " of " + pageCount, pageW / 2, pageH - 8, { align: "center" });
      }

      pdf.save("EthioNikah-Analytics-Report-" + new Date().toISOString().split("T")[0] + ".pdf");
    } catch {
      // Silent fail
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="h-8 w-48 bg-charcoal-100 dark:bg-charcoal-800 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-28 bg-charcoal-100 dark:bg-charcoal-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const statsCards = [
    { label: "Total Users", value: a.totalUsers ?? 0, icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
    { label: "Active Users", value: a.activeUsers ?? 0, icon: Activity, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
    { label: "Verified Users", value: a.verifiedUsers ?? 0, icon: UserCheck, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { label: "Matches", value: a.totalMatches ?? 0, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
    { label: "Open Reports", value: a.totalReports ?? 0, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
    { label: "Total Revenue", value: "Birr " + (a.totalRevenue ?? 0).toLocaleString(), icon: DollarSign, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { label: "Total Messages", value: a.totalMessages ?? 0, icon: MessageSquare, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-500/10" },
    { label: "Unread Messages", value: a.unreadMessages ?? 0, icon: MessageSquare, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
    { label: "Open Complaints", value: a.openComplaints ?? 0, icon: ShieldAlert, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
    { label: "Suspended Users", value: a.suspendedUsers ?? 0, icon: UserX, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
    { label: "Banned Users", value: a.bannedUsers ?? 0, icon: Ban, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
    { label: "Pending Verifications", value: a.pendingVerifications ?? 0, icon: UserCheck, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
  ];

  const paymentCards = [
    { label: "Total Payments", value: a.paymentStats?.total ?? ps.total ?? 0 },
    { label: "Approved", value: a.paymentStats?.approved ?? ps.approved ?? 0 },
    { label: "Pending", value: a.paymentStats?.pending ?? ps.pending ?? 0 },
    { label: "Rejected", value: a.paymentStats?.rejected ?? ps.rejected ?? 0 },
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
    { label: "Total Revenue", value: "Birr " + (rev.totalRevenue ?? 0).toLocaleString(), icon: DollarSign, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10", sub: "Lifetime" },
    { label: "Active Subs", value: rev.activeSubscriptions ?? 0, icon: CreditCard, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10", sub: (rev.premiumSubscriptions ?? 0) + " platinum, " + (rev.basicSubscriptions ?? 0) + " gold" },
    { label: "Conversion Rate", value: conversionRate + "%", icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10", sub: "Free to paid" },
    { label: "ARPU", value: "Birr " + arpu, icon: Wallet, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", sub: "Avg revenue/user" },
  ];

  const monthlyRows = monthlyData.length > 0 ? monthlyData : [{ month: "-", users: 0, matches: 0, revenue: 0 }];

  const detailStats = [
    { label: "Total Users", value: a.totalUsers ?? 0, sub: "+" + (a.newUsersThisMonth ?? 0) + " this month" },
    { label: "Active Users", value: a.activeUsers ?? 0, sub: Math.round(((a.activeUsers ?? 0) / (a.totalUsers || 1)) * 100) + "% engagement" },
    { label: "Verified Users", value: a.verifiedUsers ?? 0, sub: (a.pendingVerifications ?? 0) + " pending review" },
    { label: "Total Matches", value: a.totalMatches ?? 0, sub: "successful connections" },
    { label: "New Users (30d)", value: a.newUsersThisMonth ?? 0, sub: "this month" },
    { label: "Open Reports", value: a.totalReports ?? 0, sub: "need attention" },
    { label: "Total Revenue", value: "Birr " + (a.totalRevenue ?? 0).toLocaleString(), sub: "lifetime revenue" },
    { label: "Active Subs", value: rev.activeSubscriptions ?? a.subscriptionStats?.active ?? 0, sub: (rev.premiumSubscriptions ?? 0) + " platinum, " + (rev.basicSubscriptions ?? 0) + " gold" },
    { label: "Total Messages", value: a.totalMessages ?? 0, sub: (a.unreadMessages ?? 0) + " unread" },
    { label: "Open Complaints", value: a.openComplaints ?? 0, sub: "need attention" },
    { label: "Suspended Users", value: a.suspendedUsers ?? 0, sub: "currently suspended" },
    { label: "Banned Users", value: a.bannedUsers ?? 0, sub: "permanently banned" },
  ];

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white">{t("admin.analytics.title")}</h1>
          <p className="text-sm text-charcoal-500 dark:text-white/60 mt-1">{t("admin.analytics.subtitle")}</p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#F2D675] text-black font-semibold text-sm shadow-lg shadow-[#D4AF37]/20 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
        >
          {exporting ? (
            <>
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export PDF Report
            </>
          )}
        </button>
      </div>

      <div className="space-y-6">
        {/* Platform Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white dark:bg-white/[0.06] backdrop-blur-xl border border-charcoal-100 dark:border-white/10 rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={"w-10 h-10 rounded-xl " + stat.bg + " flex items-center justify-center"}>
                    <Icon className={"w-5 h-5 " + stat.color} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-charcoal-900 dark:text-white mb-0.5">{stat.value}</p>
                <p className="text-xs text-charcoal-400 dark:text-white/60">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Monthly Analytics Table */}
        <div className="bg-white dark:bg-white/[0.06] backdrop-blur-xl border border-charcoal-100 dark:border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-lg font-semibold text-charcoal-900 dark:text-white">Monthly Analytics (Last 6 Months)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal-100 dark:border-white/10">
                  <th className="text-left py-3 px-4 font-semibold text-charcoal-600 dark:text-white/70">Month</th>
                  <th className="text-right py-3 px-4 font-semibold text-charcoal-600 dark:text-white/70">New Users</th>
                  <th className="text-right py-3 px-4 font-semibold text-charcoal-600 dark:text-white/70">Matches</th>
                  <th className="text-right py-3 px-4 font-semibold text-charcoal-600 dark:text-white/70">Revenue (Birr)</th>
                </tr>
              </thead>
              <tbody>
                {monthlyRows.map((m: any, i: number) => (
                  <tr key={i} className="border-b border-charcoal-50 dark:border-white/5 hover:bg-charcoal-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-medium text-charcoal-900 dark:text-white">{m.month}</td>
                    <td className="py-3 px-4 text-right text-charcoal-700 dark:text-white/80">{m.users ?? 0}</td>
                    <td className="py-3 px-4 text-right text-charcoal-700 dark:text-white/80">{m.matches ?? 0}</td>
                    <td className="py-3 px-4 text-right font-bold text-[#D4AF37]">{(m.revenue ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {revenueStatsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white dark:bg-white/[0.06] backdrop-blur-xl border border-charcoal-100 dark:border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={"w-9 h-9 rounded-lg " + stat.bg + " flex items-center justify-center"}>
                    <Icon className={"w-4 h-4 " + stat.color} />
                  </div>
                </div>
                <p className="text-xl font-bold text-charcoal-900 dark:text-white mb-0.5">{stat.value}</p>
                <p className="text-xs font-medium text-charcoal-600 dark:text-white/80">{stat.label}</p>
                <p className="text-[11px] text-charcoal-400 dark:text-white/50 mt-0.5">{stat.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Payment Statistics */}
        <div className="bg-white dark:bg-white/[0.06] backdrop-blur-xl border border-charcoal-100 dark:border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">Payment Statistics</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {paymentCards.map((stat) => (
              <div key={stat.label} className="p-4 bg-charcoal-50 dark:bg-white/[0.04] rounded-xl border border-charcoal-100 dark:border-white/5">
                <p className="text-xs text-charcoal-400 dark:text-white/60 mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-charcoal-900 dark:text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gender & Subscription */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-white/[0.06] backdrop-blur-xl border border-charcoal-100 dark:border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">Gender Distribution</h2>
            <div className="space-y-3">
              {genderCards.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between p-3 bg-charcoal-50 dark:bg-white/[0.04] rounded-xl border border-charcoal-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={"w-9 h-9 rounded-lg " + stat.bg + " flex items-center justify-center"}>
                      <Users className={"w-4 h-4 " + stat.color} />
                    </div>
                    <span className="text-sm font-medium text-charcoal-600 dark:text-white/80">{stat.label}</span>
                  </div>
                  <span className="text-xl font-bold text-charcoal-900 dark:text-white">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-white/[0.06] backdrop-blur-xl border border-charcoal-100 dark:border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">Subscription Statistics</h2>
            <div className="space-y-3">
              {subscriptionCards.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between p-3 bg-charcoal-50 dark:bg-white/[0.04] rounded-xl border border-charcoal-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={"w-9 h-9 rounded-lg " + stat.bg + " flex items-center justify-center"}>
                      <CreditCard className={"w-4 h-4 " + stat.color} />
                    </div>
                    <span className="text-sm font-medium text-charcoal-600 dark:text-white/80">{stat.label}</span>
                  </div>
                  <span className="text-xl font-bold text-charcoal-900 dark:text-white">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="bg-white dark:bg-white/[0.06] backdrop-blur-xl border border-charcoal-100 dark:border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-charcoal-900 dark:text-white">Platform Statistics</h3>
              <p className="text-xs text-charcoal-400 dark:text-white/60">Detailed metrics breakdown</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {detailStats.map((stat) => (
              <div key={stat.label} className="p-4 bg-charcoal-50 dark:bg-white/[0.04] rounded-xl border border-charcoal-100 dark:border-white/5">
                <p className="text-xs text-charcoal-400 dark:text-white/60 mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-charcoal-900 dark:text-white">{stat.value}</p>
                <p className="text-[11px] text-charcoal-400 dark:text-white/50 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
