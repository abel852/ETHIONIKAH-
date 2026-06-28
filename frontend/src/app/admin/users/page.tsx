"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Users, Search, CheckCircle, XCircle, Trash2, Ban, ToggleLeft, ToggleRight } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { formatDate } from "@/lib/utils";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ id: string; type: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getUsers({ limit: 500 });
      setUsers(data.users || []);
    } catch (e: any) {
      console.error("fetch users error:", e);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = search
    ? users.filter((u) =>
        `${u.firstName} ${u.lastName} ${u.email} ${u.phone || ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : users;

  const doAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    const { id, type } = confirmAction;
    try {
      if (type === "verify") await adminService.verifyUser(id);
      else if (type === "suspend") await adminService.suspendUser(id);
      else if (type === "activate") await adminService.activateUser(id);
      else if (type === "ban") await adminService.banUser(id, "Banned by admin");
      else if (type === "delete") await adminService.deleteUser(id);
      toast.success(`User ${type}ed successfully`);
      setConfirmAction(null);
      fetchUsers();
    } catch (e: any) {
      console.error(`${type} error:`, e);
      toast.error(`Failed to ${type} user`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900 dark:text-white">User Management</h1>
          <p className="text-sm text-charcoal-400 mt-0.5">All registered users — {users.length} total</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-charcoal-100 dark:border-charcoal-700 p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
          <input
            placeholder="Search name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-charcoal-100 dark:border-charcoal-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-charcoal-100 dark:border-charcoal-700 bg-charcoal-50/50 dark:bg-charcoal-700/30">
                <th className="text-left py-3 px-4 text-xs font-medium text-charcoal-400 uppercase">User</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-charcoal-400 uppercase hidden sm:table-cell">Status</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-charcoal-400 uppercase hidden sm:table-cell">Verified</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-charcoal-400 uppercase hidden md:table-cell">Email</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-charcoal-400 uppercase hidden lg:table-cell">Joined</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-charcoal-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-charcoal-50 dark:border-charcoal-700/50">
                    <td colSpan={6} className="py-4 px-4"><div className="h-10 bg-charcoal-50 dark:bg-charcoal-700/30 rounded-lg animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sm text-charcoal-400">No users found</td>
                </tr>
              ) : filtered.map((user) => (
                <tr key={user.id} className="border-b border-charcoal-50 dark:border-charcoal-700/50 hover:bg-charcoal-50 dark:hover:bg-charcoal-700/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {((user.firstName || "U").charAt(0) + (user.lastName || "").charAt(0)).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-charcoal-900 dark:text-white text-sm">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-charcoal-400">{user.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 hidden sm:table-cell">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                      user.isActive ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-green-500" : "bg-red-500"}`} />
                      {user.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="py-3 px-3 hidden sm:table-cell">
                    {user.isVerified ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400"><CheckCircle className="w-3.5 h-3.5" /> Verified</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-charcoal-400"><XCircle className="w-3.5 h-3.5" /> Unverified</span>
                    )}
                  </td>
                  <td className="py-3 px-3 hidden md:table-cell text-xs text-charcoal-500">{user.email}</td>
                  <td className="py-3 px-3 hidden lg:table-cell text-xs text-charcoal-400">{formatDate(user.createdAt)}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      {!user.isVerified && (
                        <button onClick={() => setConfirmAction({ id: user.id, type: "verify" })}
                          className="px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-500/10 rounded-lg hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors">
                          Verify
                        </button>
                      )}
                      {user.isActive ? (
                        <button onClick={() => setConfirmAction({ id: user.id, type: "suspend" })}
                          className="px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 dark:bg-orange-500/10 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors">
                          <ToggleLeft className="w-3.5 h-3.5 inline mr-1" />Suspend
                        </button>
                      ) : (
                        <button onClick={() => setConfirmAction({ id: user.id, type: "activate" })}
                          className="px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-500/10 rounded-lg hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors">
                          <ToggleRight className="w-3.5 h-3.5 inline mr-1" />Activate
                        </button>
                      )}
                      <button onClick={() => setConfirmAction({ id: user.id, type: "ban" })}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                        <Ban className="w-3.5 h-3.5 inline mr-1" />Ban
                      </button>
                      <button onClick={() => setConfirmAction({ id: user.id, type: "delete" })}
                        className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 inline mr-1" />Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmAction(null)}>
          <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 w-full max-w-sm shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-charcoal-900 dark:text-white mb-2 capitalize">{confirmAction.type} User</h3>
            <p className="text-sm text-charcoal-500 mb-5">Are you sure you want to {confirmAction.type} this user?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm font-medium text-charcoal-600 bg-charcoal-100 dark:bg-charcoal-700 rounded-lg hover:bg-charcoal-200 dark:hover:bg-charcoal-600 transition-colors">
                Cancel
              </button>
              <button onClick={doAction} disabled={actionLoading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  confirmAction.type === "delete" || confirmAction.type === "ban"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-accent hover:bg-accent-dark"
                }`}>
                {actionLoading ? "Processing..." : `Yes, ${confirmAction.type}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
