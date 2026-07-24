"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Users, UserCheck, UserPlus, Shield,
  Heart, MessageCircle, DollarSign, Activity,
  Mail, AlertTriangle, Clock, TrendingUp, TrendingDown,
  Calendar, ArrowRight, CheckCircle, XCircle, Eye,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  resolved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  user_registered: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  verification: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  payment: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  report: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

const activityIcons: Record<string, React.ElementType> = {
  user_registered: UserPlus,
  verification: Shield,
  payment: DollarSign,
  report: AlertTriangle,
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t('admin.dashboard.goodMorning'));
    else if (hour < 18) setGreeting(t('admin.dashboard.goodAfternoon'));
    else setGreeting(t('admin.dashboard.goodEvening'));
  }, []);

  const fetchDashboard = useCallback(() => {
    adminService.getDashboardData().then(({ data: res }) => {
      setData(res.dashboard || {});
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDashboard();
    const id = setInterval(fetchDashboard, 45000);
    return () => clearInterval(id);
  }, [fetchDashboard]);

  const s = data?.stats || {};
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const statCards = [
    { label: t('admin.dashboard.totalUsers'), value: s.totalUsers, icon: Users, change: `+${s.newUsersThisMonth || 0} ${t('admin.analytics.thisMonth')}`, color: "from-blue-500 to-blue-600", bgLight: "bg-blue-50 dark:bg-blue-900/20", iconColor: "text-blue-600 dark:text-blue-400" },
    { label: t('admin.dashboard.activeUsers'), value: s.activeUsers, icon: UserCheck, change: `${((s.activeUsers / (s.totalUsers || 1)) * 100).toFixed(0)}% ${t('admin.total').toLowerCase()}`, color: "from-green-500 to-emerald-600", bgLight: "bg-green-50 dark:bg-green-900/20", iconColor: "text-green-600 dark:text-green-400" },
    { label: t('admin.dashboard.verifiedUsers'), value: s.verifiedUsers, icon: Shield, change: `${((s.verifiedUsers / (s.totalUsers || 1)) * 100).toFixed(0)}% ${t('admin.analytics.verifiedUsers').toLowerCase()}`, color: "from-purple-500 to-violet-600", bgLight: "bg-purple-50 dark:bg-purple-900/20", iconColor: "text-purple-600 dark:text-purple-400" },
    { label: t('admin.dashboard.pendingVerifications'), value: s.pendingVerifications, icon: Clock, change: t('admin.analytics.pendingReview'), color: "from-amber-500 to-orange-600", bgLight: "bg-amber-50 dark:bg-amber-900/20", iconColor: "text-amber-600 dark:text-amber-400" },
  ];

  const metricCards = [
    { label: t('admin.dashboard.totalMatches'), value: s.totalMatches, icon: Heart, color: "text-rose-600 dark:text-rose-400" },
    { label: t('admin.dashboard.totalMessages'), value: s.totalMessages, icon: MessageCircle, color: "text-sky-600 dark:text-sky-400" },
    { label: t('admin.analytics.unreadMessages'), value: s.unreadMessages, icon: Mail, color: "text-indigo-600 dark:text-indigo-400" },
    { label: t('admin.dashboard.activeSubscriptions'), value: s.activeSubscriptions, icon: DollarSign, color: "text-emerald-600 dark:text-emerald-400" },
    { label: t('admin.dashboard.openReports'), value: s.openReports, icon: AlertTriangle, color: "text-red-600 dark:text-red-400" },
    { label: t('admin.dashboard.openComplaints'), value: s.openComplaints, icon: Activity, color: "text-orange-600 dark:text-orange-400" },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {greeting}, {user?.adminRole === "super_admin" ? t('admin.dashboard.superAdmin') : t('admin.dashboard.admin')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {today}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#222240] border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{t('admin.dashboard.systemOnline')}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 bg-gray-100 dark:bg-[#222240] rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="h-64 bg-gray-100 dark:bg-[#222240] rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map((card) => (
              <div key={card.label}
                className="relative group bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{card.value ?? 0}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{card.change}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${card.bgLight} flex items-center justify-center`}>
                    <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                </div>
                <div className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r ${card.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">{t('admin.dashboard.quickActions')}</h2>
              <div className="space-y-2">
                {[
                  { href: "/admin/users", label: t('admin.dashboard.manageUsers'), desc: t('admin.dashboard.manageUsersDesc'), icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
                  { href: "/admin/verifications", label: t('admin.dashboard.verificationRequests'), desc: t('admin.dashboard.verificationRequestsDesc'), icon: Shield, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" },
                  { href: "/admin/activities", label: t('admin.dashboard.activityLog'), desc: t('admin.dashboard.activityLogDesc'), icon: Activity, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
                ].map((item) => (
                  <a key={item.href} href={item.href}
                    className="group flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                  >
                    <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            </div>

            {/* Gender & Subscription */}
            <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">{t('admin.dashboard.userDistribution')}</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('admin.dashboard.gender')}</p>
                  <div className="space-y-2">
                    {data?.genderDistribution?.length > 0 ? data.genderDistribution.map((g: any) => {
                      const pct = ((g.value / (s.totalUsers || 1)) * 100).toFixed(1);
                      const colors: Record<string, string> = { Male: "bg-blue-500", Female: "bg-pink-500" };
                      const barColors: Record<string, string> = { Male: "from-blue-500 to-blue-400", Female: "from-pink-500 to-pink-400" };
                      return (
                        <div key={g.name}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-700 dark:text-gray-300 font-medium">{g.name}</span>
                            <span className="text-gray-500 dark:text-gray-400">{g.value} ({pct}%)</span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div className={`h-full rounded-full bg-gradient-to-r ${barColors[g.name] || "bg-gray-400"} transition-all duration-500`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    }) : (
                      <p className="text-sm text-gray-400 dark:text-gray-500">{t('admin.dashboard.noData')}</p>
                    )}
                  </div>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('admin.dashboard.subscriptionPlans')}</p>
                  <div className="space-y-2">
                    {data?.subscriptionBreakdown?.length > 0 ? data.subscriptionBreakdown.map((p: any) => {
                      const total = data.subscriptionBreakdown.reduce((a: number, b: any) => a + b.value, 0);
                      const pct = ((p.value / (total || 1)) * 100).toFixed(1);
                      const colors: Record<string, string> = {
                        Basic: "from-gray-400 to-gray-300",
                        Premium: "from-amber-400 to-amber-300",
                        Gold: "from-yellow-400 to-yellow-300",
                      };
                      return (
                        <div key={p.name}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-700 dark:text-gray-300 font-medium">{p.name}</span>
                            <span className="text-gray-500 dark:text-gray-400">{p.value} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div className={`h-full rounded-full bg-gradient-to-r ${colors[p.name] || "bg-gray-400"} transition-all duration-500`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    }) : (
                      <p className="text-sm text-gray-400 dark:text-gray-500">{t('admin.dashboard.noData')}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue & Metrics */}
            <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">{t('admin.dashboard.revenueOverview')}</h2>
              <div className="mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('admin.dashboard.totalRevenue')}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">${(s.totalRevenue || 0).toLocaleString()}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  +${(s.revenueThisMonth || 0).toLocaleString()} {t('admin.analytics.thisMonth').toLowerCase()}
                </p>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{t('admin.dashboard.platformMetrics')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {metricCards.map((m) => (
                    <div key={m.label} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-white/5">
                      <m.icon className={`w-4 h-4 ${m.color} shrink-0`} />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.label}</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{m.value ?? 0}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">{t('admin.dashboard.recentUsers')}</h2>
                <a href="/admin/users" className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                  {t('admin.dashboard.viewAll')} <ArrowRight className="w-3 h-3" />
                </a>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin.users.name')}</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin.users.email')}</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin.users.status')}</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin.users.date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recentUsers?.length > 0 ? data.recentUsers.slice(0, 8).map((u: any) => (
                      <tr key={u.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{u.firstName} {u.lastName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{u.email}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.isVerified ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                            "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}>
                            {u.isVerified ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {u.isVerified ? t('admin.verified') : t('admin.pending')}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-gray-500 dark:text-gray-400 text-xs">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                          {t('admin.dashboard.noUsers')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">{t('admin.dashboard.recentActivity')}</h2>
                <a href="/admin/activities" className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                  {t('admin.dashboard.viewAll')} <ArrowRight className="w-3 h-3" />
                </a>
              </div>
              <div className="p-5 max-h-[420px] overflow-y-auto">
                {data?.activities?.length > 0 ? (
                  <div className="relative space-y-0">
                    {data.activities.slice(0, 12).map((a: any, i: number) => {
                      const Icon = activityIcons[a.type] || Activity;
                      const color = statusColors[a.type] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
                      return (
                        <div key={a.id} className="relative flex gap-4 pb-5 last:pb-0">
                          {i < Math.min(data.activities.length, 12) - 1 && (
                            <div className="absolute left-[17px] top-8 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
                          )}
                          <div className={`relative w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
                            <p className="text-sm text-gray-800 dark:text-gray-200">{a.message}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500 dark:text-gray-400">{a.user}</span>
                              <span className="text-gray-300 dark:text-gray-600">·</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">{t('admin.dashboard.noActivity')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
