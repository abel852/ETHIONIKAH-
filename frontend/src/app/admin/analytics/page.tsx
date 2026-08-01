"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users, UserCheck, ShieldAlert, AlertTriangle, DollarSign,
  Activity, TrendingUp, CreditCard, Wallet, MessageSquare,
  Ban, UserX, Download, Calendar, BarChart3,
} from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const CHART_COLORS = ["#D4AF37", "#10B981", "#3B82F6", "#8B5CF6", "#EF4444", "#F59E0B"];

export default function AdminAnalyticsPage() {
  const { t } = useI18n();
  const [analytics, setAnalytics] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

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
      // Silent fail — no error display
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
    { label: "Total Revenue", value: `Birr ${(a.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
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
    { label: "Total Revenue", value: `Birr ${(rev.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: "text-accent", bg: "bg-amber-50 dark:bg-amber-500/10", sub: "Lifetime" },
    { label: "Active Subs", value: rev.activeSubscriptions ?? 0, icon: CreditCard, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10", sub: `${rev.premiumSubscriptions ?? 0} platinum, ${rev.basicSubscriptions ?? 0} gold` },
    { label: "Conversion Rate", value: `${conversionRate}%`, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10", sub: "Free to paid" },
    { label: "ARPU", value: `Birr ${arpu}`, icon: Wallet, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", sub: "Avg revenue/user" },
  ];

  // Monthly data from analytics (already returned by backend)
  const monthlyData = a.monthlyData || [];

  // Gender pie data
  const genderPieData = [
    { name: "Male", value: a.genderDistribution?.male ?? 0 },
    { name: "Female", value: a.genderDistribution?.female ?? 0 },
  ];

  // Payment pie data
  const paymentPieData = [
    { name: "Approved", value: a.paymentStats?.approved ?? ps.approved ?? 0 },
    { name: "Pending", value: a.paymentStats?.pending ?? ps.pending ?? 0 },
    { name: "Rejected", value: a.paymentStats?.rejected ?? ps.rejected ?? 0 },
  ].filter(d => d.value > 0);

  // Subscription pie data
  const subPieData = [
    { name: "Active", value: a.subscriptionStats?.active ?? 0 },
    { name: "Inactive", value: Math.max(0, (a.subscriptionStats?.total ?? 0) - (a.subscriptionStats?.active ?? 0)) },
  ].filter(d => d.value > 0);

  // PDF export
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: "#0F0F10",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", "a4");

      // Premium header
      pdf.setFillColor(15, 15, 16);
      pdf.rect(0, 0, 210, 40, "F");
      pdf.setTextColor(212, 175, 55);
      pdf.setFontSize(22);
      pdf.setFont("helvetica", "bold");
      pdf.text("ETHIONIKAH", 105, 18, { align: "center" });
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(200, 200, 200);
      pdf.text("Premium Analytics Report", 105, 26, { align: "center" });
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 105, 32, { align: "center" });

      // Gold divider line
      pdf.setDrawColor(212, 175, 55);
      pdf.setLineWidth(0.8);
      pdf.line(20, 42, 190, 42);

      // Add screenshot
      const imgData = canvas.toDataURL("image/png");
      const pageHeight = 297; // A4 height
      let heightLeft = imgHeight;
      let position = 48;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - position);

      while (heightLeft > 0) {
        position = -(imgHeight - heightLeft);
        pdf.addPage();
        pdf.setFillColor(15, 15, 16);
        pdf.rect(0, 0, 210, pageHeight, "F");
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Footer on last page
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        pdf.text(`EthioNikah Admin Analytics — Page ${i} of ${pageCount}`, 105, pageHeight - 5, { align: "center" });
      }

      pdf.save(`EthioNikah-Analytics-${new Date().toISOString().split("T")[0]}.pdf`);
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
            {[...Array(12)].map((_, i) => <div key={i} className="h-28 bg-charcoal-100 dark:bg-charcoal-800 rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white">{t('admin.analytics.title')}</h1>
          <p className="text-sm text-charcoal-500 dark:text-white/60 mt-1">{t('admin.analytics.subtitle')}</p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#F2D675] text-black font-semibold text-sm shadow-lg shadow-[#D4AF37]/20 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
        >
          {exporting ? (
            <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Generating PDF…</>
          ) : (
            <><Download className="w-4 h-4" /> Export PDF Report</>
          )}
        </button>
      </div>

      {/* Report Container — captured for PDF */}
      <div ref={reportRef} className="bg-[#0F0F10] p-6 rounded-2xl space-y-8">

      {/* Platform Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <div key={stat.label} className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-0.5">{stat.value}</p>
            <p className="text-xs text-white/60">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Monthly Analytics Charts */}
      <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-[#D4AF37]" />
          <h2 className="text-lg font-semibold text-white">Monthly Analytics (Last 6 Months)</h2>
        </div>

        {monthlyData.length > 0 ? (
          <div className="space-y-8">
            {/* Revenue Chart */}
            <div>
              <h3 className="text-sm font-medium text-white/80 mb-3">Monthly Revenue (Birr)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="month" stroke="#ffffff60" fontSize={12} />
                  <YAxis stroke="#ffffff60" fontSize={12} />
                  <Tooltip contentStyle={{ background: "#1A1A24", border: "1px solid #2D2D2D", borderRadius: "12px", color: "#fff" }} />
                  <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Users & Matches Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-white/80 mb-3">New Users per Month</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="month" stroke="#ffffff60" fontSize={12} />
                    <YAxis stroke="#ffffff60" fontSize={12} />
                    <Tooltip contentStyle={{ background: "#1A1A24", border: "1px solid #2D2D2D", borderRadius: "12px", color: "#fff" }} />
                    <Bar dataKey="users" fill="#3B82F6" radius={[8, 8, 0, 0]} name="New Users" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white/80 mb-3">Matches per Month</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="month" stroke="#ffffff60" fontSize={12} />
                    <YAxis stroke="#ffffff60" fontSize={12} />
                    <Tooltip contentStyle={{ background: "#1A1A24", border: "1px solid #2D2D2D", borderRadius: "12px", color: "#fff" }} />
                    <Bar dataKey="matches" fill="#8B5CF6" radius={[8, 8, 0, 0]} name="Matches" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Combined trend line */}
            <div>
              <h3 className="text-sm font-medium text-white/80 mb-3">Combined Trends</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="month" stroke="#ffffff60" fontSize={12} />
                  <YAxis stroke="#ffffff60" fontSize={12} />
                  <Tooltip contentStyle={{ background: "#1A1A24", border: "1px solid #2D2D2D", borderRadius: "12px", color: "#fff" }} />
                  <Legend wrapperStyle={{ color: "#fff", fontSize: 12 }} />
                  <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} name="Users" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="matches" stroke="#8B5CF6" strokeWidth={2} name="Matches" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} name="Revenue" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-white/40 text-sm">
            <BarChart3 className="w-6 h-6 mr-2" /> No monthly data available yet
          </div>
        )}
      </div>

      {/* Revenue Highlight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {revenueStatsCards.map((stat) => (
          <div key={stat.label} className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-xl font-bold text-white mb-0.5">{stat.value}</p>
            <p className="text-xs font-medium text-white/80">{stat.label}</p>
            <p className="text-[11px] text-white/50 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Pie Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gender Distribution Pie */}
        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Gender Distribution</h3>
          {genderPieData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={genderPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                  {genderPieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#1A1A24", border: "1px solid #2D2D2D", borderRadius: "12px", color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-[200px] text-white/40 text-sm">No data</div>}
        </div>

        {/* Payment Stats Pie */}
        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Payment Distribution</h3>
          {paymentPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={paymentPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                  {paymentPieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i + 1]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#1A1A24", border: "1px solid #2D2D2D", borderRadius: "12px", color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-[200px] text-white/40 text-sm">No data</div>}
        </div>

        {/* Subscription Pie */}
        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Subscription Status</h3>
          {subPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={subPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                  {subPieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i + 3]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#1A1A24", border: "1px solid #2D2D2D", borderRadius: "12px", color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-[200px] text-white/40 text-sm">No data</div>}
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-white">Platform Statistics</h3>
            <p className="text-xs text-white/60">Detailed metrics breakdown</p>
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
            { label: "Total Revenue", value: `Birr ${(a.totalRevenue ?? 0).toLocaleString()}`, sub: `lifetime revenue` },
            { label: "Active Subs", value: rev.activeSubscriptions ?? a.subscriptionStats?.active ?? 0, sub: `${rev.premiumSubscriptions ?? 0} platinum, ${rev.basicSubscriptions ?? 0} gold` },
            { label: "Total Messages", value: a.totalMessages ?? 0, sub: `${a.unreadMessages ?? 0} unread` },
            { label: "Open Complaints", value: a.openComplaints ?? 0, sub: `need attention` },
            { label: "Suspended Users", value: a.suspendedUsers ?? 0, sub: `currently suspended` },
            { label: "Banned Users", value: a.bannedUsers ?? 0, sub: `permanently banned` },
          ].map((stat) => (
            <div key={stat.label} className="p-4 bg-white/[0.04] rounded-xl border border-white/5">
              <p className="text-xs text-white/60 mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-[11px] text-white/50 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      </div>
    </AdminLayout>
  );
}
