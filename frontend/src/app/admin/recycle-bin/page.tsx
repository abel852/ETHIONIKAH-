"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Trash2, RotateCcw, AlertTriangle, Clock,
  RefreshCw, AlertCircle, CheckCircle2, User,
} from "lucide-react";
import { Button, Card, Input } from "@/components/common";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { formatRelativeTime } from "@/lib/utils";
import toast from "react-hot-toast";
import { useI18n } from "@/context/I18nContext";

const glass = "bg-white dark:bg-white/[0.06] backdrop-blur-xl border-charcoal-100 dark:border-white/10";

type DeletedUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  deletedAt: string;
  daysLeft: number;
  canRestore: boolean;
  profile?: { country?: string; city?: string };
};

export default function RecycleBinPage() {
  const { t } = useI18n();
  const [users, setUsers] = useState<DeletedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  const fetchUsers = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      const { data } = await adminService.getDeletedUsers({ search: search || undefined });
      setUsers(data.users || []);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Failed to fetch deleted users";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRestore = async (id: string) => {
    setProcessing((p) => ({ ...p, [id]: true }));
    try {
      await adminService.restoreDeletedUser(id);
      toast.success("Account restored successfully");
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to restore account");
    } finally {
      setProcessing((p) => ({ ...p, [id]: false }));
    }
  };

  const handlePurge = async () => {
    const eligible = users.filter((u) => !u.canRestore);
    if (eligible.length === 0) {
      toast("No accounts are beyond the 30-day grace period yet.");
      return;
    }
    if (!confirm(`This will permanently delete ${eligible.length} accounts and all their data. This cannot be undone. Continue?`)) return;
    setProcessing((p) => ({ ...p, __purge: true }));
    try {
      const { data } = await adminService.purgeDeletedUsers();
      toast.success(data.message || `Purged ${data.purged} accounts`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to purge accounts");
    } finally {
      setProcessing((p) => ({ ...p, __purge: false }));
    }
  };

  const total = users.length;
  const restorable = users.filter((u) => u.canRestore).length;
  const expired = users.filter((u) => !u.canRestore).length;

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white">{t('admin.recycleBin.title')}</h1>
            <p className="text-sm text-charcoal-500 dark:text-white/60">{t('admin.recycleBin.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Deleted", value: total, icon: Trash2, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
          { label: "Restorable", value: restorable, icon: RotateCcw, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
          { label: "Expired", value: expired, icon: Clock, color: "text-charcoal-500", bg: "bg-charcoal-100 dark:bg-charcoal-700/50" },
          { label: "Purge", value: "Now", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100 dark:bg-red-500/20" },
        ].map((stat) => (
          <Card key={stat.label} hover={false} className={glass}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-charcoal-400 dark:text-white/60">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-white dark:bg-white/[0.06] backdrop-blur-xl rounded-2xl border border-charcoal-100 dark:border-white/10 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
            <Input
              placeholder={t('admin.users.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={fetchUsers}
            loading={loading}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button
            variant="danger"
            onClick={handlePurge}
            loading={processing.__purge}
            className="gap-2"
          >
            <AlertTriangle className="w-4 h-4" /> Purge Expired
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-charcoal-100 dark:bg-charcoal-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : error ? (
        <Card className={glass}>
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-500 font-medium mb-2">Failed to load deleted users</p>
            <p className="text-xs text-charcoal-400 dark:text-white/60 mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchUsers} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Retry
            </Button>
          </div>
        </Card>
      ) : users.length === 0 ? (
        <Card className={glass}>
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-sm text-charcoal-400 dark:text-white/60">{t('admin.recycleBin.noItems')}</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id} hover={false} className={glass}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-charcoal-500 to-charcoal-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-charcoal-900 dark:text-white text-sm">
                      {user.firstName} {user.lastName}
                    </span>
                    {user.canRestore ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        {user.daysLeft} day{user.daysLeft !== 1 ? "s" : ""} left
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400">
                        Expired
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-charcoal-500 dark:text-white/60 flex-wrap mt-1">
                    <span>{user.email}</span>
                    {user.phone && <span>{user.phone}</span>}
                    {user.profile?.city && <span>{[user.profile.city, user.profile.country].filter(Boolean).join(", ")}</span>}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Deleted {formatRelativeTime(user.deletedAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {user.canRestore && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRestore(user.id)}
                      loading={processing[user.id]}
                      className="gap-2"
                    >
                      <RotateCcw className="w-4 h-4" /> {t('admin.recycleBin.restore')}
                    </Button>
                  )}
                  {!user.canRestore && (
                    <span className="text-xs text-red-500 font-medium px-2 py-1 rounded-lg bg-red-50 dark:bg-red-500/10">
                      Eligible for purge
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
