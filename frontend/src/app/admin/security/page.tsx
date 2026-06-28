"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { ShieldAlert, Eye, Shield, UserX, AlertTriangle, Fingerprint, Activity as ActivityIcon } from "lucide-react";

export default function SecurityPage() {
  const [gdpr, setGdpr] = useState<any>({});
  const [suspicious, setSuspicious] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminService.getGDPRRequests().catch(() => ({ data: { stats: {} } })),
      adminService.getSuspiciousActivity().catch(() => ({ data: { flags: {} } })),
    ]).then(([g, s]) => {
      setGdpr(g.data.stats || {});
      setSuspicious(s.data.flags || {});
    }).finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security & Compliance</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Audit logs, GDPR controls, and suspicious activity monitoring</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1,2].map(i => <div key={i} className="h-64 bg-gray-100 dark:bg-[#222240] rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GDPR / Privacy */}
          <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-blue-500" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">GDPR & Privacy</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "Total Users", value: gdpr.totalUsers, color: "text-blue-600" },
                { label: "Inactive Users", value: gdpr.inactiveUsers, color: "text-gray-600" },
                { label: "Pending Deletions", value: gdpr.pendingDeletions, color: "text-red-600" },
                { label: "Retention Days", value: gdpr.retentionDays, color: "text-amber-600" },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                  <p className={`text-xl font-bold ${s.color} dark:text-white`}>{s.value ?? 0}</p>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1.5"><Fingerprint className="w-3.5 h-3.5" /> Data retention is set to {gdpr.retentionDays || 30} days. User deletion requests are processed automatically.</p>
            </div>
          </div>

          {/* Suspicious Activity */}
          <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Suspicious Activity</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                <p className="text-xs text-gray-500 dark:text-gray-400">24h Registrations</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{suspicious.rapidRegistrations ?? 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                <p className="text-xs text-gray-500 dark:text-gray-400">Suspicious IPs</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{suspicious.suspiciousIPs?.length ?? 0}</p>
              </div>
            </div>
            {suspicious.suspiciousIPs?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Top Suspicious IPs</p>
                <div className="space-y-1.5">
                  {suspicious.suspiciousIPs.slice(0, 5).map((ip: any) => (
                    <div key={ip.ip} className="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                      <span className="font-mono text-gray-700 dark:text-gray-300">{ip.ip}</span>
                      <span className="text-gray-500">{ip.count} actions</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { href: "/admin/audit-logs", icon: ActivityIcon, label: "View Full Audit Logs", desc: "Complete history of all admin actions", color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
              { href: "/admin/users", icon: UserX, label: "Manage Banned Users", desc: "Review and manage restricted accounts", color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
              { href: "/admin/settings", icon: Shield, label: "Privacy Settings", desc: "Configure data retention and privacy rules", color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-900/20" },
            ].map((l) => (
              <a key={l.href} href={l.href} className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-[#222240] border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-all">
                <div className={`w-10 h-10 rounded-lg ${l.bg} flex items-center justify-center`}>
                  <l.icon className={`w-5 h-5 ${l.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{l.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{l.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
