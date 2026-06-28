"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { Activity, Filter, Search, Download } from "lucide-react";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 30 };
      if (actionFilter) params.action = actionFilter;
      const { data } = await adminService.getAuditLogs(params);
      setLogs(data.logs || []);
      setTotal(data.pagination?.total || 0);
    } catch (e) {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, actionFilter]);

  const actionColors: Record<string, string> = {
    suspend_user: "text-red-600 bg-red-50 dark:bg-red-900/20", activate_user: "text-green-600 bg-green-50 dark:bg-green-900/20",
    delete_user: "text-red-600 bg-red-50 dark:bg-red-900/20", verify_user: "text-green-600 bg-green-50 dark:bg-green-900/20",
    ban_user: "text-red-600 bg-red-50 dark:bg-red-900/20", reset_password: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
    toggle_feature: "text-blue-600 bg-blue-50 dark:bg-blue-900/20", grant_permission: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
    revoke_permission: "text-purple-600 bg-purple-50 dark:bg-purple-900/20", update_setting: "text-gray-600 bg-gray-50 dark:bg-gray-800",
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track every admin action across the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white"
          >
            <option value="">All Actions</option>
            <option value="suspend_user">Suspend</option>
            <option value="activate_user">Activate</option>
            <option value="delete_user">Delete</option>
            <option value="verify_user">Verify</option>
            <option value="ban_user">Ban</option>
            <option value="toggle_feature">Feature Toggle</option>
            <option value="update_setting">Settings</option>
            <option value="grant_permission">Permissions</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-white/5">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Admin</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Resource</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Details</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center">
                  <Activity className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">No audit logs yet</p>
                </td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-white/5">
                  <td className="px-5 py-3">
                    <span className="font-medium text-gray-900 dark:text-white">{log.admin?.firstName} {log.admin?.lastName}</span>
                    <span className="text-xs text-gray-400 ml-2">{log.admin?.email}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[log.action] || "text-gray-600 bg-gray-50 dark:bg-gray-800"}`}>
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">
                    {log.resource}{log.resourceId ? ` #${log.resourceId.slice(0, 8)}` : ""}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                    {log.details ? JSON.stringify(log.details).slice(0, 60) : "-"}
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {total > 30 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">{total} total entries</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-700 dark:text-gray-300 disabled:opacity-50"
            >Previous</button>
            <button disabled={page >= Math.ceil(total / 30)} onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-700 dark:text-gray-300 disabled:opacity-50"
            >Next</button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
