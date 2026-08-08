"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import {
  Activity, Clock, UserPlus, ShieldCheck, LogIn, Users,
  UserCheck, TrendingUp, Calendar, ArrowRight, Eye,
  BarChart3, Hourglass, CheckCircle, XCircle,
} from "lucide-react";
import { useI18n } from "@/context/I18nContext";

type TimelineData = {
  adminLogins: any[];
  userLogins: any[];
  registrationsByHour: { hour: number; count: number }[];
  totalRegistrationsToday: number;
  verificationsByHour: { hour: number; count: number }[];
  totalVerificationsToday: number;
  verifiedToday: number;
  rejectedToday: number;
  dailyStats: { date: string; registrations: number; verifications: number; logins: number }[];
  totals: { users: number; verified: number };
};

export default function ActivityTimelinePage() {
  const { t } = useI18n();
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("today");

  useEffect(() => {
    adminService.getActivityTimeline().then(({ data: res }) => {
      setData(res.timeline);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 dark:bg-[#222240] rounded-2xl animate-pulse" />)}
          </div>
          <div className="h-96 bg-gray-100 dark:bg-[#222240] rounded-2xl animate-pulse" />
        </div>
      </AdminLayout>
    );
  }

  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.activity.title')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> {todayStr}
            </p>
          </div>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: t('admin.activity.registrationsToday'), value: data?.totalRegistrationsToday ?? 0, icon: UserPlus, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: t('admin.activity.usersLoggedIn'), value: data?.userLogins.length ?? 0, icon: LogIn, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
          { label: t('admin.activity.verificationsToday'), value: data?.totalVerificationsToday ?? 0, icon: ShieldCheck, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
          { label: t('admin.activity.adminLogins'), value: data?.adminLogins.length ?? 0, icon: Activity, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
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

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-gray-100 dark:bg-white/5 w-fit">
        {[
          { id: "today", label: t('admin.activity.todaysActivity'), icon: Clock },
          { id: "registrations", label: t('admin.activity.registrations'), icon: UserPlus },
          { id: "verifications", label: t('admin.activity.verificationsToday'), icon: ShieldCheck },
          { id: "daily", label: t('admin.activity.30DayStats'), icon: BarChart3 },
        ].map((tabItem) => (
          <button key={tabItem.id} onClick={() => setTab(tabItem.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === tabItem.id ? "bg-white dark:bg-[#2e2e42] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
            }`}
          ><tabItem.icon className="w-4 h-4" /> {t(`admin.activity.${tabItem.id === "today" ? "todaysActivity" : tabItem.id === "daily" ? "30DayStats" : tabItem.id}`)}</button>
        ))}
      </div>

      {tab === "today" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Admin Logins */}
          <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Activity className="w-4 h-4" /> {t('admin.activity.adminLoginsToday')}</h3>
              <span className="text-xs text-gray-500">{data?.adminLogins.length ?? 0} {t('admin.activity.events')}</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
              {data?.adminLogins.length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">{t('admin.activity.noAdminLogins')}</div>
              ) : data?.adminLogins.map((log, i) => (
                <div key={log.id || i} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs font-bold shrink-0">
                    {log.admin?.firstName?.charAt(0)}{log.admin?.lastName?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{log.admin?.firstName} {log.admin?.lastName}</p>
                    <p className="text-xs text-gray-400">{log.admin?.email}</p>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              ))}
            </div>
          </div>

          {/* User Logins */}
          <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><LogIn className="w-4 h-4" /> {t('admin.activity.userLoginsToday')}</h3>
              <span className="text-xs text-gray-500">{data?.userLogins.length ?? 0} {t('admin.activity.users')}</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
              {data?.userLogins.length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">{t('admin.activity.noUserLogins')}</div>
              ) : data?.userLogins.slice(0, 30).map((u) => (
                <div key={u.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium truncate">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "registrations" && (
        <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('admin.activity.registrationsByHour')}</h3>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-blue-600"><div className="w-3 h-3 rounded-sm bg-blue-500" /> {t('admin.activity.registrations')}</span>
              <span className="text-xs text-gray-400">{data?.totalRegistrationsToday ?? 0} {t('admin.activity.total')}</span>
            </div>
          </div>
          <div className="flex items-end gap-1 h-48">
            {(data?.registrationsByHour ?? []).map((h) => {
              const maxCount = Math.max(...(data?.registrationsByHour ?? []).map((x) => x.count), 1);
              const height = (h.count / maxCount) * 100;
              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400 font-medium">{h.count}</span>
                  <div className="w-full rounded-t-md bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-500"
                    style={{ height: `${height}%`, minHeight: h.count > 0 ? 4 : 0 }}
                  />
                  <span className="text-[10px] text-gray-500">{h.hour}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center">
              <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{data?.totalRegistrationsToday ?? 0}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">{t('admin.activity.today')}</p>
            </div>
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-center">
              <p className="text-lg font-bold text-green-700 dark:text-green-400">{data?.totals.users ?? 0}</p>
              <p className="text-xs text-green-600 dark:text-green-400">{t('admin.activity.totalUsers')}</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-center">
              <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{data?.totals.verified ?? 0}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400">{t('admin.activity.verified')}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-center">
              <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{data?.userLogins.length ?? 0}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">{t('admin.activity.loggedInToday')}</p>
            </div>
          </div>
        </div>
      )}

      {tab === "verifications" && (
        <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('admin.activity.verificationsByHour')}</h3>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-purple-600"><div className="w-3 h-3 rounded-sm bg-purple-500" /> {t('admin.activity.reviews')}</span>
              <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3 h-3" /> {data?.verifiedToday ?? 0}</span>
              <span className="flex items-center gap-1 text-xs text-red-600"><XCircle className="w-3 h-3" /> {data?.rejectedToday ?? 0}</span>
            </div>
          </div>
          <div className="flex items-end gap-1 h-48">
            {(data?.verificationsByHour ?? []).map((h) => {
              const maxCount = Math.max(...(data?.verificationsByHour ?? []).map((x) => x.count), 1);
              const height = (h.count / maxCount) * 100;
              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400 font-medium">{h.count}</span>
                  <div className="w-full rounded-t-md bg-gradient-to-t from-purple-500 to-purple-400 transition-all duration-500"
                    style={{ height: `${height}%`, minHeight: h.count > 0 ? 4 : 0 }}
                  />
                  <span className="text-[10px] text-gray-500">{h.hour}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-center">
              <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{data?.totalVerificationsToday ?? 0}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400">{t('admin.activity.totalReviews')}</p>
            </div>
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-center">
              <p className="text-lg font-bold text-green-700 dark:text-green-400">{data?.verifiedToday ?? 0}</p>
              <p className="text-xs text-green-600 dark:text-green-400">{t('admin.activity.approved')}</p>
            </div>
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-center">
              <p className="text-lg font-bold text-red-700 dark:text-red-400">{data?.rejectedToday ?? 0}</p>
              <p className="text-xs text-red-600 dark:text-red-400">{t('admin.activity.rejected')}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-center">
              <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{data?.totals.verified ?? 0}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">{t('admin.activity.totalVerified')}</p>
            </div>
          </div>
        </div>
      )}

      {tab === "daily" && (
        <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('admin.activity.last30Days')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-white/5">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t('admin.activity.date')}</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                    <span className="flex items-center justify-center gap-1"><UserPlus className="w-3 h-3" /> {t('admin.activity.registrations')}</span>
                  </th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                    <span className="flex items-center justify-center gap-1"><ShieldCheck className="w-3 h-3" /> {t('admin.activity.verificationsToday')}</span>
                  </th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                    <span className="flex items-center justify-center gap-1"><LogIn className="w-3 h-3" /> {t('admin.activity.logins')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.dailyStats.map((d) => (
                  <tr key={d.date} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">
                      {new Date(d.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`font-bold ${d.registrations > 0 ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`}>{d.registrations}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`font-bold ${d.verifications > 0 ? "text-purple-600 dark:text-purple-400" : "text-gray-400"}`}>{d.verifications}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`font-bold ${d.logins > 0 ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>{d.logins}</span>
                    </td>
                  </tr>
                ))}
                {(!data?.dailyStats || data.dailyStats.length === 0) && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400">{t('admin.activity.noData')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
