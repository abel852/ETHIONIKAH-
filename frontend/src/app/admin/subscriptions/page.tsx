"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, CreditCard, DollarSign, Users, TrendingUp,
  CheckCircle, XCircle, Clock, Eye, ArrowUpRight,
  Calendar, Download, Activity,
} from "lucide-react";
import { Card, Button, Badge } from "@/components/common";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/context/I18nContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area,
} from "recharts";
import toast from "react-hot-toast";

const COLORS = ["#D4AF37", "#10B981", "#F59E0B", "#8B5CF6"];

export default function AdminSubscriptionsPage() {
  const { t } = useI18n();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"subscriptions" | "payments">("subscriptions");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, payRes, revRes] = await Promise.all([
        adminService.getSubscriptions(),
        adminService.getPayments(),
        adminService.getRevenueStats(),
      ]);
      setSubscriptions(subRes.data.data || []);
      setPayments(payRes.data.data || []);
      setRevenue(revRes.data.data);
    } catch { toast.error("Failed to fetch data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(() => { if (document.hidden) return; fetchData(); }, 120000);
    return () => clearInterval(id);
  }, [fetchData]);

  // Listen for real-time payment status changes
  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener("payment-status-changed", handler);
    return () => window.removeEventListener("payment-status-changed", handler);
  }, [fetchData]);

  const rev = revenue || {};
  const filteredSubs = subscriptions.filter((s: any) =>
    !search || s.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    s.user?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    s.planType?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPayments = payments.filter((p: any) =>
    !search || p.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    p.user?.lastName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleAutoRenew = async (id: string, current: boolean) => {
    try {
      await adminService.updateSubscription(id, { autoRenew: !current });
      toast.success(`Auto-renew ${current ? "disabled" : "enabled"}`);
      fetchData();
    } catch { toast.error("Failed to update"); }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm("Cancel this subscription?")) return;
    try {
      await adminService.cancelSubscription(id);
      toast.success("Subscription cancelled");
      fetchData();
    } catch { toast.error("Failed to cancel"); }
  };

  const revenueData = [
    { month: "Jan", revenue: 1200 },
    { month: "Feb", revenue: 1900 },
    { month: "Mar", revenue: 2800 },
    { month: "Apr", revenue: 3600 },
    { month: "May", revenue: 4200 },
    { month: "Jun", revenue: rev.totalRevenue ?? 5000 },
  ];

  const planData = [
    { name: "Platinum", value: rev.premiumSubscriptions ?? 0 },
    { name: "Gold", value: rev.basicSubscriptions ?? 0 },
  ];

  const statCards = [
    { label: "Total Revenue", value: `Birr ${(rev.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: "text-accent", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { label: "Active Subscriptions", value: rev.activeSubscriptions ?? 0, icon: Activity, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
    { label: "Platinum", value: rev.premiumSubscriptions ?? 0, icon: Users, color: "text-accent-dark", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { label: "Total Payments", value: payments.length, icon: CreditCard, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white">{t('admin.nav.plansCredits')}</h1>
            <p className="text-sm text-charcoal-500 dark:text-white">{t('admin.analytics.subscriptionStats')}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat) => (
          <div key={stat.label}>
            <Card hover={false}>
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                {stat.label === "Total Revenue" && (
                  <span className="text-xs text-green-600 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full font-medium">+Birr 5.2k</span>
                )}
              </div>
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-charcoal-400 dark:text-white">{stat.label}</p>
            </Card>
          </div>
        ))}
      </div>

      {/* Revenue Chart + Plan Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-charcoal-900 dark:text-white">Revenue Overview</h3>
              <p className="text-xs text-charcoal-400 dark:text-white">Monthly revenue in Birr</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#999" />
                <YAxis tick={{ fontSize: 12 }} stroke="#999" />
                <RechartsTooltip formatter={(value: any) => [`Birr ${value}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#D4AF37" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-charcoal-900 dark:text-white">Plan Distribution</h3>
              <p className="text-xs text-charcoal-400 dark:text-white">Active plans breakdown</p>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planData.filter(d => d.value > 0).length ? planData : [{ name: "No Data", value: 1 }]}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(planData.filter(d => d.value > 0).length ? planData : [{ name: "No Data", value: 1 }]).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" /> Platinum: {rev.premiumSubscriptions ?? 0}
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> Gold: {rev.basicSubscriptions ?? 0}
            </span>
          </div>
        </Card>
      </div>

      {/* Tabs + Search */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <button
              onClick={() => setTab("subscriptions")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === "subscriptions" ? "bg-accent text-white" : "text-charcoal-500 hover:bg-charcoal-100 dark:hover:bg-charcoal-700"
              }`}
            >
              Subscriptions
            </button>
            <button
              onClick={() => setTab("payments")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === "payments" ? "bg-accent text-white" : "text-charcoal-500 hover:bg-charcoal-100 dark:hover:bg-charcoal-700"
              }`}
            >
              Payments
            </button>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
            <input
              placeholder={tab === "subscriptions" ? "Search subscriptions..." : "Search payments..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none" hover={false}>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-charcoal-100 dark:bg-charcoal-800 rounded-lg animate-pulse" />)}
            </div>
          ) : tab === "subscriptions" ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal-100 dark:border-charcoal-700 bg-charcoal-50/50 dark:bg-charcoal-800/50">
                  <th className="text-left py-3.5 px-4 text-xs font-medium text-charcoal-400 dark:text-white uppercase tracking-wider">User</th>
                  <th className="text-left py-3.5 px-3 text-xs font-medium text-charcoal-400 dark:text-white uppercase tracking-wider">Plan</th>
                  <th className="text-left py-3.5 px-3 text-xs font-medium text-charcoal-400 dark:text-white uppercase tracking-wider">Status</th>
                  <th className="text-left py-3.5 px-3 text-xs font-medium text-charcoal-400 dark:text-white uppercase tracking-wider hidden md:table-cell">Start</th>
                  <th className="text-left py-3.5 px-3 text-xs font-medium text-charcoal-400 dark:text-white uppercase tracking-wider hidden md:table-cell">End</th>
                  <th className="text-center py-3.5 px-3 text-xs font-medium text-charcoal-400 dark:text-white uppercase tracking-wider">Auto-Renew</th>
                  <th className="text-right py-3.5 px-4 text-xs font-medium text-charcoal-400 dark:text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubs.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-sm text-charcoal-400 dark:text-white">No subscriptions found</td></tr>
                ) : filteredSubs.map((sub: any) => (
                  <tr key={sub.id}
                    className="border-b border-charcoal-50 dark:border-charcoal-700/50 hover:bg-charcoal-50 dark:hover:bg-charcoal-700/20 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white text-xs font-bold">
                          {((sub.user?.firstName || "U").charAt(0) + (sub.user?.lastName || "").charAt(0)).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-charcoal-900 dark:text-white">{sub.user?.firstName} {sub.user?.lastName}</p>
                          <p className="text-xs text-charcoal-400 dark:text-white">{sub.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        sub.planType === "platinum"
                          ? "bg-accent/15 text-accent-dark dark:text-accent-light"
                          : sub.planType === "gold"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                          : "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                      }`}>
                        {sub.planType}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        sub.status === "active" ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400" :
                        sub.status === "cancelled" ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400" :
                        "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          sub.status === "active" ? "bg-green-500" : sub.status === "cancelled" ? "bg-red-500" : "bg-amber-500"
                        }`} />
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-xs text-charcoal-500 dark:text-white hidden md:table-cell">{formatDate(sub.startDate)}</td>
                    <td className="py-3.5 px-3 text-xs text-charcoal-500 dark:text-white hidden md:table-cell">{formatDate(sub.endDate)}</td>
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => handleToggleAutoRenew(sub.id, sub.autoRenew)}
                        className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                          sub.autoRenew ? "bg-accent" : "bg-charcoal-200 dark:bg-charcoal-700"
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          sub.autoRenew ? "translate-x-5" : "translate-x-1"
                        }`} />
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {sub.status === "active" && (
                        <Button variant="ghost" size="sm" onClick={() => handleCancel(sub.id)}>
                          <XCircle className="w-4 h-4 mr-1" />Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal-100 dark:border-charcoal-700 bg-charcoal-50/50 dark:bg-charcoal-800/50">
                  <th className="text-left py-3.5 px-4 text-xs font-medium text-charcoal-400 dark:text-white uppercase tracking-wider">User</th>
                  <th className="text-left py-3.5 px-3 text-xs font-medium text-charcoal-400 dark:text-white uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3.5 px-3 text-xs font-medium text-charcoal-400 dark:text-white uppercase tracking-wider">Currency</th>
                  <th className="text-left py-3.5 px-3 text-xs font-medium text-charcoal-400 dark:text-white uppercase tracking-wider">Method</th>
                  <th className="text-left py-3.5 px-3 text-xs font-medium text-charcoal-400 dark:text-white uppercase tracking-wider">Status</th>
                  <th className="text-left py-3.5 px-3 text-xs font-medium text-charcoal-400 dark:text-white uppercase tracking-wider hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-sm text-charcoal-400 dark:text-white">No payments found</td></tr>
                ) : filteredPayments.map((pay: any) => (
                  <tr key={pay.id}
                    className="border-b border-charcoal-50 dark:border-charcoal-700/50 hover:bg-charcoal-50 dark:hover:bg-charcoal-700/20 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white text-xs font-bold">
                          {((pay.user?.firstName || "U").charAt(0) + (pay.user?.lastName || "").charAt(0)).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-charcoal-900 dark:text-white">{pay.user?.firstName} {pay.user?.lastName}</p>
                          <p className="text-xs text-charcoal-400 dark:text-white">{pay.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-charcoal-900 dark:text-white">${pay.amount}</td>
                    <td className="py-3.5 px-3 text-xs text-charcoal-500 dark:text-white">{pay.currency || "Birr"}</td>
                    <td className="py-3.5 px-3 text-xs text-charcoal-500 dark:text-white capitalize">{pay.paymentMethod || "N/A"}</td>
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        pay.status === "completed" ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400" :
                        pay.status === "pending" ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                        "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          pay.status === "completed" ? "bg-green-500" : pay.status === "pending" ? "bg-amber-500" : "bg-red-500"
                        }`} />
                        {pay.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-xs text-charcoal-500 dark:text-white hidden md:table-cell">{formatDate(pay.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </AdminLayout>
  );
}
