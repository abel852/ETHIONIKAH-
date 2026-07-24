"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Search, CheckCircle, XCircle, MessageSquare, Bell, Megaphone, Gavel, Lock, ArrowLeft, Users, Calendar, Clock, MessageCircle, AlertTriangle, Ban, Phone, Mail, Shield, Eye, Crown, Gem, Moon, Sparkles, BookOpen, Pin } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { formatDate, formatRelativeTime, cn } from "@/lib/utils";
import { useI18n } from "@/context/I18nContext";

export default function AdminUsersPage() {
  const { t } = useI18n();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ id: string; type: string } | null>(null);
  const [messageModal, setMessageModal] = useState<{ id: string; name: string } | null>(null);
  const [messageText, setMessageText] = useState("");
  const [notifyModal, setNotifyModal] = useState<{ id: string; name: string } | null>(null);
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyBody, setNotifyBody] = useState("");
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastGender, setBroadcastGender] = useState("both");
  const [sending, setSending] = useState(false);
  const [banDuration, setBanDuration] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [tick, setTick] = useState(0);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const formatRemaining = (expiresAt: string): string => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expiring...";
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getUsers({ limit: 500 });
      setUsers((data.users || []).filter((u: any) => u.role !== "admin"));
      adminService.markUsersViewed();
      window.dispatchEvent(new CustomEvent("refresh-badge-counts"));
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

  const handleViewUser = async (user: any) => {
    setSelectedUser(user);
    setStatsLoading(true);
    try {
      const { data } = await adminService.getUserStats(user.id);
      setUserStats(data.stats);
    } catch { toast.error("Failed to load user stats"); }
    finally { setStatsLoading(false); }
  };

  const filtered = users.filter((u) => {
    if (search && !`${u.firstName} ${u.lastName} ${u.email} ${u.phone || ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (quickFilter === "flagged" && !u.isFlaggedForReview) return false;
    if (quickFilter === "locked" && !u.loginPermanentlyLocked && !(u.loginLockedUntil && new Date(u.loginLockedUntil) > new Date())) return false;
    if (quickFilter === "pinned" && !u.adminPinned) return false;
    return true;
  });

  const sendMessage = async () => {
    if (!messageModal || !messageText.trim()) return;
    setSending(true);
    try {
      await adminService.sendUserMessage(messageModal.id, messageText);
      toast.success("Message sent");
      setMessageModal(null);
      setMessageText("");
    } catch { toast.error("Failed to send message"); }
    finally { setSending(false); }
  };

  const sendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return;
    setSending(true);
    try {
      const genderParam = broadcastGender === "both" ? undefined : broadcastGender;
      await adminService.broadcastNotification(broadcastTitle, broadcastBody, genderParam);
      toast.success("Broadcast sent");
      setBroadcastOpen(false);
      setBroadcastTitle("");
      setBroadcastBody("");
      setBroadcastGender("both");
    } catch { toast.error("Failed to broadcast"); }
    finally { setSending(false); }
  };

  const sendNotification = async () => {
    if (!notifyModal || !notifyTitle.trim() || !notifyBody.trim()) return;
    setSending(true);
    try {
      await adminService.notifyUser(notifyModal.id, notifyTitle, notifyBody);
      toast.success("Notification sent");
      setNotifyModal(null);
      setNotifyTitle("");
      setNotifyBody("");
    } catch { toast.error("Failed to send notification"); }
    finally { setSending(false); }
  };

  const doAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    const { id, type } = confirmAction;
    try {
      if (type === "verify") await adminService.verifyUser(id);
      else if (type === "reject-verification") await adminService.rejectUserVerification(id, rejectReason || undefined);
      else if (type === "ban") await adminService.banUser(id, "Banned by admin", banDuration || undefined);
      else if (type === "unban") await adminService.unbanUser(id);
      else if (type === "pin") await adminService.pinUser(id);
      else if (type === "unpin") await adminService.unpinUser(id);
      else if (type === "unlock") await adminService.unlockUser(id);
      else if (type === "clear-flag") await adminService.clearFlag(id);
      toast.success(type === "unban" ? "User unbanned" : `User ${type}ed successfully`);
      setConfirmAction(null);
      fetchUsers();
    } catch (e: any) {
      const msg = e?.response?.data?.error || "";
      if (type === "ban" && msg.includes("already banned")) {
        toast.error("This user is already banned");
      } else {
        toast.error(`Failed to ${type} user`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const verifiedCount = users.filter((u: any) => u.isVerified).length;
  const premiumCount = users.filter((u: any) => u.subscriptions?.[0]).length;
  const bannedCount = users.filter((u: any) => !u.isActive).length;
  const flaggedCount = users.filter((u: any) => u.isFlaggedForReview).length;
  const lockedCount = users.filter((u: any) => u.loginPermanentlyLocked || (u.loginLockedUntil && new Date(u.loginLockedUntil) > new Date())).length;
  const pinnedCount = users.filter((u: any) => u.adminPinned).length;

  return (
    <AdminLayout>
      <div className="relative">
        {/* Islamic geometric background */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, currentColor 1px, transparent 1px),
                              radial-gradient(circle at 75% 75%, currentColor 1px, transparent 1px),
                              radial-gradient(circle at 50% 50%, currentColor 1px, transparent 1px)`,
            backgroundSize: "60px 60px, 80px 80px, 120px 120px",
            color: "currentColor"
          }}
        />
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-gradient-to-br from-teal-200/30 to-emerald-200/20 dark:from-teal-800/15 dark:to-emerald-800/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-gradient-to-br from-amber-200/20 to-orange-200/15 dark:from-amber-900/15 dark:to-orange-900/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-charcoal-900 dark:text-white">{t('admin.users.title')}</h1>
              <p className="text-sm text-charcoal-400 dark:text-charcoal-500 mt-0.5">{t('admin.users.subtitle')} — {users.length} {t('admin.total').toLowerCase()}</p>
            </div>
          </div>
          <button onClick={() => setBroadcastOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-xl shadow-lg shadow-teal-500/20 transition-all">
            <Megaphone className="w-4 h-4" /> Broadcast
          </button>
        </div>

        {/* Stats Cards */}
        {!selectedUser && (
        <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="bg-white/90 dark:bg-white/[0.06] dark:backdrop-blur-xl rounded-2xl border border-teal-100/50 dark:border-white/10 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <span className="text-xs font-medium text-charcoal-400 dark:text-charcoal-500">{t('admin.users.totalUsers')}</span>
            </div>
            <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{users.length}</p>
          </div>
          <div className="bg-white/90 dark:bg-white/[0.06] dark:backdrop-blur-xl rounded-2xl border border-emerald-100/50 dark:border-white/10 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-charcoal-400 dark:text-charcoal-500">{t('admin.users.verifiedUsers')}</span>
            </div>
            <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{verifiedCount}</p>
          </div>
          <div className="bg-white/90 dark:bg-white/[0.06] dark:backdrop-blur-xl rounded-2xl border border-amber-100/50 dark:border-white/10 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs font-medium text-charcoal-400 dark:text-charcoal-500">Premium</span>
            </div>
            <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{premiumCount}</p>
          </div>
          <div className="bg-white/90 dark:bg-white/[0.06] dark:backdrop-blur-xl rounded-2xl border border-red-100/50 dark:border-white/10 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                <Ban className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-xs font-medium text-charcoal-400 dark:text-charcoal-500">{t('admin.banned')}</span>
            </div>
            <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{bannedCount}</p>
          </div>
          <div className="bg-white/90 dark:bg-white/[0.06] dark:backdrop-blur-xl rounded-2xl border border-orange-100/50 dark:border-white/10 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-xs font-medium text-charcoal-400 dark:text-charcoal-500">Flagged</span>
            </div>
            <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{flaggedCount}</p>
          </div>
          <div className="bg-white/90 dark:bg-white/[0.06] dark:backdrop-blur-xl rounded-2xl border border-red-100/50 dark:border-white/10 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                <Lock className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-xs font-medium text-charcoal-400 dark:text-charcoal-500">Locked</span>
            </div>
            <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{lockedCount}</p>
          </div>
          <div className="bg-white/90 dark:bg-white/[0.06] dark:backdrop-blur-xl rounded-2xl border border-blue-100/50 dark:border-white/10 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <Pin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-medium text-charcoal-400 dark:text-charcoal-500">Pinned</span>
            </div>
            <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{pinnedCount}</p>
          </div>
        </div>
        )}

        {/* Search + Quick Filters */}
        {!selectedUser && (
        <div className="relative bg-white/90 dark:bg-white/[0.06] dark:backdrop-blur-xl rounded-2xl border border-teal-100/50 dark:border-white/10 p-4 mb-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500 dark:text-teal-400" />
            <input
              placeholder={t('admin.users.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-teal-50/50 dark:bg-white/5 dark:text-white border border-teal-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setQuickFilter(quickFilter === "flagged" ? null : "flagged")}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                quickFilter === "flagged" ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 hover:bg-orange-100")}>
              <AlertTriangle className="w-3 h-3 inline mr-1" />Flagged ({flaggedCount})
            </button>
            <button onClick={() => setQuickFilter(quickFilter === "locked" ? null : "locked")}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                quickFilter === "locked" ? "bg-red-500 text-white" : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-100")}>
              <Lock className="w-3 h-3 inline mr-1" />Locked ({lockedCount})
            </button>
            <button onClick={() => setQuickFilter(quickFilter === "pinned" ? null : "pinned")}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                quickFilter === "pinned" ? "bg-blue-500 text-white" : "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 hover:bg-blue-100")}>
              <Pin className="w-3 h-3 inline mr-1" />Pinned ({pinnedCount})
            </button>
            {quickFilter && (
              <button onClick={() => setQuickFilter(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-charcoal-100 dark:bg-white/10 text-charcoal-600 dark:text-charcoal-300 hover:bg-charcoal-200 dark:hover:bg-white/20 transition-all">
                Clear filter
              </button>
            )}
          </div>
        </div>
        )}

      {/* User Detail Panel */}
      {selectedUser ? (() => {
        const u = selectedUser;
        const s = userStats;
        return (
        <div className="relative bg-white/95 dark:bg-white/[0.06] dark:backdrop-blur-xl rounded-2xl border border-teal-100/50 dark:border-white/10 overflow-hidden shadow-lg">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-teal-100/50 dark:border-white/10 bg-gradient-to-r from-teal-50/50 to-transparent dark:from-teal-950/20">
            <button onClick={() => { setSelectedUser(null); setUserStats(null); }} className="p-2 rounded-xl hover:bg-teal-50 dark:hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-teal-500/20">
              {((u.firstName || "U").charAt(0) + (u.lastName || "").charAt(0)).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-charcoal-900 dark:text-white text-lg truncate">{u.firstName} {u.lastName}</p>
              <p className="text-xs text-charcoal-400 dark:text-charcoal-500">{u.email} {u.gender && `· ${u.gender}`}</p>
            </div>
            <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
              u.isActive ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400")}>
              <span className={cn("w-1.5 h-1.5 rounded-full", u.isActive ? "bg-emerald-500" : "bg-red-500")} />
              {u.isActive ? t('admin.active') : t('admin.banned')}
            </span>
            {u.subscriptions?.[0] ? (() => {
              const sub = u.subscriptions[0];
              const isPlatinum = sub.planType === "platinum";
              return (
                <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white",
                  isPlatinum ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-gradient-to-r from-amber-400 to-yellow-500")}>
                  {isPlatinum ? <Gem className="w-3.5 h-3.5" /> : <Crown className="w-3.5 h-3.5" />}
                  <span className="capitalize">{sub.planType}</span>
                  <span className="opacity-80">&middot; {formatRemaining(sub.endDate)}</span>
                </span>
              );
            })() : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-charcoal-100 text-charcoal-600 dark:bg-charcoal-700 dark:text-charcoal-300">
                <Crown className="w-3.5 h-3.5" /> Free
              </span>
            )}
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-teal-50/50 dark:bg-white/[0.04] rounded-xl p-4 border border-teal-100/50 dark:border-white/5">
                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs mb-2"><Mail className="w-3.5 h-3.5" /> Email</div>
                  <p className="text-sm font-medium text-charcoal-900 dark:text-white">{u.email}</p>
                </div>
                <div className="bg-teal-50/50 dark:bg-white/[0.04] rounded-xl p-4 border border-teal-100/50 dark:border-white/5">
                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs mb-2"><Phone className="w-3.5 h-3.5" /> Phone</div>
                  <p className="text-sm font-medium text-charcoal-900 dark:text-white">{u.phone || "—"}</p>
                </div>
                <div className="bg-teal-50/50 dark:bg-white/[0.04] rounded-xl p-4 border border-teal-100/50 dark:border-white/5">
                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs mb-2"><Users className="w-3.5 h-3.5" /> Gender</div>
                  <p className="text-sm font-medium text-charcoal-900 dark:text-white capitalize">{u.gender || "—"}</p>
                </div>
                <div className="bg-teal-50/50 dark:bg-white/[0.04] rounded-xl p-4 border border-teal-100/50 dark:border-white/5">
                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs mb-2"><Calendar className="w-3.5 h-3.5" /> Date of Birth</div>
                  <p className="text-sm font-medium text-charcoal-900 dark:text-white">{u.dateOfBirth ? formatDate(u.dateOfBirth) : "—"}</p>
                </div>
                <div className="bg-teal-50/50 dark:bg-white/[0.04] rounded-xl p-4 border border-teal-100/50 dark:border-white/5">
                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs mb-2"><Calendar className="w-3.5 h-3.5" /> Joined</div>
                  <p className="text-sm font-medium text-charcoal-900 dark:text-white">{formatDate(u.createdAt)}</p>
                </div>
                <div className="bg-teal-50/50 dark:bg-white/[0.04] rounded-xl p-4 border border-teal-100/50 dark:border-white/5">
                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs mb-2"><Clock className="w-3.5 h-3.5" /> Last Login</div>
                  <p className="text-sm font-medium text-charcoal-900 dark:text-white">{u.lastLoginAt ? formatRelativeTime(u.lastLoginAt) : "Never"}</p>
                </div>
                <div className="bg-teal-50/50 dark:bg-white/[0.04] rounded-xl p-4 border border-teal-100/50 dark:border-white/5">
                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs mb-2"><Shield className="w-3.5 h-3.5" /> Role</div>
                  <p className="text-sm font-medium text-charcoal-900 dark:text-white capitalize">{u.role}</p>
                </div>
                <div className="bg-teal-50/50 dark:bg-white/[0.04] rounded-xl p-4 border border-teal-100/50 dark:border-white/5">
                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs mb-2"><CheckCircle className="w-3.5 h-3.5" /> Verified</div>
                  <p className="text-sm font-medium">{u.isVerified ? <span className="text-emerald-600 dark:text-emerald-400">Verified</span> : <span className="text-charcoal-400">Unverified</span>}</p>
                </div>
                {u.subscriptions?.[0] ? (() => {
                  const sub = u.subscriptions[0];
                  const isPlatinum = sub.planType === "platinum";
                  const remaining = formatRemaining(sub.endDate);
                  return (
                    <div className="col-span-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10 rounded-xl p-4 border border-purple-100 dark:border-purple-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md", isPlatinum ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-gradient-to-br from-amber-400 to-yellow-500")}>
                            {isPlatinum ? <Gem className="w-5 h-5" /> : <Crown className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-xs text-charcoal-500 dark:text-charcoal-400">Membership</p>
                            <p className="text-sm font-bold text-charcoal-900 dark:text-white capitalize">{sub.planType} Member</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-charcoal-500 dark:text-charcoal-400">Expires in</p>
                          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{remaining}</p>
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="col-span-2 bg-teal-50/50 dark:bg-white/[0.04] rounded-xl p-4 border border-teal-100/50 dark:border-white/5">
                    <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs mb-2"><Crown className="w-3.5 h-3.5" /> Membership</div>
                    <p className="text-sm font-medium text-charcoal-400">Free user</p>
                  </div>
                )}
              </div>

              {u.restrictions?.length > 0 && (
                <div className="bg-red-50 dark:bg-red-500/5 rounded-xl p-4 border border-red-100 dark:border-red-500/10">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-semibold mb-3"><Ban className="w-3.5 h-3.5" /> Restrictions</div>
                  {u.restrictions.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between text-sm mb-2 last:mb-0">
                      <span className="text-charcoal-700 dark:text-charcoal-300 capitalize">{r.type}{r.reason ? `: ${r.reason}` : ""}</span>
                      {r.expiresAt && <span className="text-xs text-charcoal-400">Until {formatDate(r.expiresAt)}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Activity Stats</p>
              {statsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-teal-50/50 dark:bg-white/5 rounded-xl animate-pulse" />)}
                </div>
              ) : s ? (
                <>
                  <div className="bg-teal-50/50 dark:bg-white/[0.04] rounded-xl p-4 border border-teal-100/50 dark:border-white/5">
                    <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs mb-1"><MessageCircle className="w-3.5 h-3.5" /> Chat Partners</div>
                    <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{s.chatPartners}</p>
                    <p className="text-[10px] text-charcoal-400 mt-0.5">unique users they exchanged messages with</p>
                  </div>

                  <div className="bg-teal-50/50 dark:bg-white/[0.04] rounded-xl p-4 border border-teal-100/50 dark:border-white/5">
                    <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs mb-1"><AlertTriangle className="w-3.5 h-3.5" /> Bad Language</div>
                    <p className={cn("text-2xl font-bold", s.badWordTotal > 0 ? "text-red-500" : "text-emerald-500")}>{s.badWordTotal}</p>
                    <p className="text-[10px] text-charcoal-400 mt-0.5">flagged words used in messages</p>
                    {s.badWordTotal > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.entries(s.badWordDetails as Record<string, number>).map(([word, count]) => (
                          <span key={word} className="text-[10px] bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                            {word} ×{count}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-teal-50/50 dark:bg-white/[0.04] rounded-xl p-4 border border-teal-100/50 dark:border-white/5">
                    <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs mb-1"><Eye className="w-3.5 h-3.5" /> Last Activity</div>
                    <p className="text-sm font-medium text-charcoal-900 dark:text-white">{u.lastLoginAt ? formatRelativeTime(u.lastLoginAt) : "Never"}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-charcoal-400">Failed to load stats</p>
              )}
            </div>
          </div>
        </div>
        );
      })() : null}

      {/* Table */}
      {!selectedUser && (
      <div className="relative bg-white/90 dark:bg-white/[0.06] dark:backdrop-blur-xl rounded-2xl border border-teal-100/50 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-teal-100/50 dark:border-white/10 bg-gradient-to-r from-teal-50/50 to-emerald-50/30 dark:from-white/5 dark:to-white/[0.02]">
                <th className="text-left py-3.5 px-4 text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">User</th>
                <th className="text-left py-3.5 px-3 text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="text-left py-3.5 px-3 text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider hidden md:table-cell">Membership</th>
                <th className="text-left py-3.5 px-3 text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider hidden sm:table-cell">Verified</th>
                <th className="text-left py-3.5 px-3 text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider hidden lg:table-cell">Email</th>
                <th className="text-left py-3.5 px-3 text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider hidden xl:table-cell">Joined</th>
                <th className="text-right py-3.5 px-4 text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider max-sm:hidden">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-teal-50/50 dark:border-charcoal-700/50">
                    <td colSpan={7} className="py-4 px-4"><div className="h-10 bg-teal-50/50 dark:bg-white/5 rounded-lg animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-sm text-charcoal-400 dark:text-white">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-white/5 flex items-center justify-center">
                        <Users className="w-8 h-8 text-teal-300 dark:text-white/20" />
                      </div>
                      <p>No users found</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((user) => (
                <tr key={user.id} className={cn("border-b border-teal-50/50 dark:border-charcoal-700/50 hover:bg-teal-50/30 dark:hover:bg-white/[0.04] transition-colors cursor-pointer",
                  user.isFlaggedForReview && "flagged-user-row")} onClick={() => handleViewUser(user)}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                        {((user.firstName || "U").charAt(0) + (user.lastName || "").charAt(0)).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-charcoal-900 dark:text-white text-sm truncate">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-charcoal-400 dark:text-charcoal-500 capitalize">{user.gender}</p>
                      </div>
                      {/* Mobile actions — inline next to name */}
                      <div className="flex items-center gap-1 sm:hidden shrink-0" onClick={(e) => e.stopPropagation()}>
                        {!user.isVerified && (user.verification?.idDocumentPath || user.verification?.selfiePath) && (
                          <>
                            <button onClick={() => setConfirmAction({ id: user.id, type: "verify" })}
                              className="w-7 h-7 flex items-center justify-center text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                              title="Verify">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => { setConfirmAction({ id: user.id, type: "reject-verification" }); setRejectReason(""); }}
                              className="w-7 h-7 flex items-center justify-center text-red-600 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                              title="Reject verification">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button onClick={() => setMessageModal({ id: user.id, name: `${user.firstName} ${user.lastName}` })}
                          className="w-7 h-7 flex items-center justify-center text-teal-600 bg-teal-50 dark:bg-teal-500/10 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-colors"
                          title="Send message">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setNotifyModal({ id: user.id, name: `${user.firstName} ${user.lastName}` })}
                          className="w-7 h-7 flex items-center justify-center text-purple-600 bg-purple-50 dark:bg-purple-500/10 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors"
                          title="Send notification">
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                        {user.isActive ? (
                          <button onClick={() => { setConfirmAction({ id: user.id, type: "ban" }); setBanDuration(null); }}
                            className="w-7 h-7 flex items-center justify-center text-red-600 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                            title="Ban user">
                            <Gavel className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button onClick={() => { setConfirmAction({ id: user.id, type: "unban" }); }}
                            className="w-7 h-7 flex items-center justify-center text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                            title="Unban user">
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 hidden sm:table-cell">
                    <div className="flex flex-col gap-1">
                      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-fit",
                        user.isActive ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400")}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", user.isActive ? "bg-emerald-500" : "bg-red-500")} />
                        {user.isActive ? "Active" : "Banned"}
                        {!user.isActive && (() => {
                          const banRestriction = user.restrictions?.find((r: any) => r.type === "ban" && r.expiresAt);
                          return banRestriction ? <span className="ml-1 text-[10px] opacity-75">&middot; {formatRemaining(banRestriction.expiresAt)}</span> : null;
                        })()}
                      </span>
                      {user.loginPermanentlyLocked && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400 w-fit">
                          <Lock className="w-2.5 h-2.5" /> Perm Locked
                        </span>
                      )}
                      {user.loginLockedUntil && new Date(user.loginLockedUntil) > new Date() && !user.loginPermanentlyLocked && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 w-fit">
                          <Clock className="w-2.5 h-2.5" /> Locked ({user.loginLockoutCount}x)
                        </span>
                      )}
                      {user.isFlaggedForReview && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400 w-fit">
                          <AlertTriangle className="w-2.5 h-2.5" /> Flagged
                        </span>
                      )}
                      {user.adminPinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400 w-fit">
                          <Pin className="w-2.5 h-2.5" /> Pinned
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 hidden md:table-cell">
                    {user.subscriptions?.[0] ? (() => {
                      const sub = user.subscriptions[0];
                      const isPlatinum = sub.planType === "platinum";
                      return (
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                          isPlatinum ? "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400")}>
                          {isPlatinum ? <Gem className="w-3 h-3" /> : <Crown className="w-3 h-3" />}
                          <span className="capitalize">{sub.planType}</span>
                          <span className="opacity-75">&middot; {formatRemaining(sub.endDate)}</span>
                        </span>
                      );
                    })() : (
                      <span className="text-xs text-charcoal-400">Free</span>
                    )}
                  </td>
                  <td className="py-3 px-3 hidden sm:table-cell">
                    {user.isVerified ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"><CheckCircle className="w-3.5 h-3.5" /> Verified</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-charcoal-400 dark:text-charcoal-500"><XCircle className="w-3.5 h-3.5" /> Unverified</span>
                    )}
                  </td>
                  <td className="py-3 px-3 hidden md:table-cell text-xs text-charcoal-500 dark:text-charcoal-400">{user.email}</td>
                  <td className="py-3 px-3 hidden lg:table-cell text-xs text-charcoal-400 dark:text-charcoal-500">{formatDate(user.createdAt)}</td>
                  <td className="py-3 px-4 text-right max-sm:hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5 max-sm:hidden">
                      {!user.isVerified && (user.verification?.idDocumentPath || user.verification?.selfiePath) && (
                        <>
                          <button onClick={() => setConfirmAction({ id: user.id, type: "verify" })}
                            className="w-8 h-8 flex items-center justify-center text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                            title="Verify">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setConfirmAction({ id: user.id, type: "reject-verification" }); setRejectReason(""); }}
                            className="w-8 h-8 flex items-center justify-center text-red-600 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                            title="Reject verification">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button onClick={() => setMessageModal({ id: user.id, name: `${user.firstName} ${user.lastName}` })}
                        className="w-8 h-8 flex items-center justify-center text-teal-600 bg-teal-50 dark:bg-teal-500/10 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-colors"
                        title="Send message">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button onClick={() => setNotifyModal({ id: user.id, name: `${user.firstName} ${user.lastName}` })}
                        className="w-8 h-8 flex items-center justify-center text-purple-600 bg-purple-50 dark:bg-purple-500/10 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors"
                        title="Send notification">
                        <Bell className="w-4 h-4" />
                      </button>
                      {user.isActive ? (
                        <button onClick={() => { setConfirmAction({ id: user.id, type: "ban" }); setBanDuration(null); }}
                          className="w-8 h-8 flex items-center justify-center text-red-600 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                          title="Ban user">
                          <Gavel className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => { setConfirmAction({ id: user.id, type: "unban" }); }}
                          className="w-8 h-8 flex items-center justify-center text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                          title="Unban user">
                          <Lock className="w-4 h-4" />
                        </button>
                      )}
                      {/* Lockout management actions */}
                      {user.loginPermanentlyLocked && (
                        <button onClick={() => setConfirmAction({ id: user.id, type: "unlock" })}
                          className="w-8 h-8 flex items-center justify-center text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                          title="Unlock account">
                          <Lock className="w-4 h-4" />
                        </button>
                      )}
                      {user.isFlaggedForReview && (
                        <button onClick={() => setConfirmAction({ id: user.id, type: "clear-flag" })}
                          className="w-8 h-8 flex items-center justify-center text-orange-600 bg-orange-50 dark:bg-orange-500/10 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors"
                          title="Clear flag">
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      )}
                      {user.adminPinned ? (
                        <button onClick={() => setConfirmAction({ id: user.id, type: "unpin" })}
                          className="w-8 h-8 flex items-center justify-center text-blue-600 bg-blue-50 dark:bg-blue-500/10 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                          title="Unpin user">
                          <Pin className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => setConfirmAction({ id: user.id, type: "pin" })}
                          className="w-8 h-8 flex items-center justify-center text-blue-600 bg-blue-50 dark:bg-blue-500/10 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                          title="Pin user for review">
                          <Pin className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmAction(null)}>
          <div className="bg-white dark:bg-[#151028]/95 dark:backdrop-blur-xl rounded-2xl p-6 w-full max-w-sm shadow-elevated border border-teal-100/50 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-charcoal-900 dark:text-white mb-2 capitalize">{confirmAction.type} User</h3>
            <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mb-4">Are you sure you want to {confirmAction.type} this user?</p>
            {confirmAction.type === "ban" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-charcoal-600 dark:text-white mb-2">Ban Duration</label>
                <select value={banDuration ?? ""} onChange={(e) => setBanDuration(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-teal-50/50 dark:bg-black/60 dark:text-white border border-teal-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30">
                  <option value="">Permanent</option>
                  <option value="3">3 Days</option>
                  <option value="10">10 Days</option>
                  <option value="30">1 Month</option>
                </select>
              </div>
            )}
            {confirmAction.type === "reject-verification" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-charcoal-600 dark:text-white mb-2">Reason (optional)</label>
                <textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Why is this verification being rejected?"
                  className="w-full px-3 py-2 bg-teal-50/50 dark:bg-black/60 dark:text-white border border-teal-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none" />
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setConfirmAction(null); setRejectReason(""); }}
                className="px-4 py-2 text-sm font-medium text-charcoal-600 dark:text-white bg-charcoal-100 dark:bg-charcoal-700 rounded-lg hover:bg-charcoal-200 dark:hover:bg-charcoal-600 transition-colors">
                Cancel
              </button>
              <button onClick={doAction} disabled={actionLoading}
                className={cn("px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors",
                  confirmAction.type === "ban" || confirmAction.type === "reject-verification"
                    ? "bg-red-500 dark:bg-red-700 hover:bg-red-600 dark:hover:bg-red-800"
                    : "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700")}>
                {actionLoading ? "Processing..." : `Yes, ${confirmAction.type}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {broadcastOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setBroadcastOpen(false)}>
          <div className="bg-white dark:bg-[#151028]/95 dark:backdrop-blur-xl rounded-2xl p-6 w-full max-w-md shadow-elevated border border-teal-100/50 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h3 className="font-semibold text-charcoal-900 dark:text-white">Broadcast Notification</h3>
                <p className="text-sm text-charcoal-400 dark:text-charcoal-500">Send a notification to users</p>
              </div>
            </div>
            <select value={broadcastGender} onChange={(e) => setBroadcastGender(e.target.value)}
              className="w-full px-3 py-2.5 bg-teal-50/50 dark:bg-black/60 dark:text-white border border-teal-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 mb-3">
              <option value="both">All Users</option>
              <option value="male">Brothers Only</option>
              <option value="female">Sisters Only</option>
            </select>
            <input value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)}
              placeholder="Title"
              className="w-full px-4 py-2.5 bg-teal-50/50 dark:bg-white/5 dark:text-white border border-teal-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 mb-3" />
            <textarea rows={4} value={broadcastBody} onChange={(e) => setBroadcastBody(e.target.value)}
              placeholder="Message body"
              className="w-full px-4 py-2.5 bg-teal-50/50 dark:bg-white/5 dark:text-white border border-teal-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none mb-4" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setBroadcastOpen(false); setBroadcastTitle(""); setBroadcastBody(""); setBroadcastGender("both"); }}
                className="px-4 py-2 text-sm font-medium text-charcoal-600 dark:text-white bg-charcoal-100 dark:bg-white/10 rounded-lg hover:bg-charcoal-200 dark:hover:bg-white/20 transition-colors">Cancel</button>
              <button onClick={sendBroadcast} disabled={sending || !broadcastTitle.trim() || !broadcastBody.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-lg transition-colors disabled:opacity-50">
                {sending ? "Sending..." : `Send to ${broadcastGender === "both" ? users.length : users.filter((u: any) => u.gender === broadcastGender).length} user${broadcastGender === "both" && users.length !== 1 || users.filter((u: any) => u.gender === broadcastGender).length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {messageModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setMessageModal(null)}>
          <div className="bg-white dark:bg-[#151028]/95 dark:backdrop-blur-xl rounded-2xl p-6 w-full max-w-md shadow-elevated border border-teal-100/50 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-charcoal-900 dark:text-white mb-1">Message {messageModal.name}</h3>
            <p className="text-sm text-charcoal-400 dark:text-charcoal-500 mb-4">Send a direct message to this user</p>
            <textarea rows={4} value={messageText} onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              className="w-full px-4 py-2.5 bg-teal-50/50 dark:bg-white/5 dark:text-white border border-teal-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none mb-4" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setMessageModal(null); setMessageText(""); }}
                className="px-4 py-2 text-sm font-medium text-charcoal-600 dark:text-white bg-charcoal-100 dark:bg-charcoal-700 rounded-lg hover:bg-charcoal-200 dark:hover:bg-charcoal-600 transition-colors">Cancel</button>
              <button onClick={sendMessage} disabled={sending || !messageText.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-lg transition-colors disabled:opacity-50">
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notify Modal */}
      {notifyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setNotifyModal(null)}>
          <div className="bg-white dark:bg-[#151028]/95 dark:backdrop-blur-xl rounded-2xl p-6 w-full max-w-md shadow-elevated border border-teal-100/50 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-charcoal-900 dark:text-white mb-1">Notify {notifyModal.name}</h3>
            <p className="text-sm text-charcoal-400 dark:text-charcoal-500 mb-4">Send a notification/reminder to this user</p>
            <input value={notifyTitle} onChange={(e) => setNotifyTitle(e.target.value)}
              placeholder="Notification title"
              className="w-full px-4 py-2.5 bg-teal-50/50 dark:bg-white/5 dark:text-white border border-teal-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 mb-3" />
            <textarea rows={3} value={notifyBody} onChange={(e) => setNotifyBody(e.target.value)}
              placeholder="Notification body"
              className="w-full px-4 py-2.5 bg-teal-50/50 dark:bg-white/5 dark:text-white border border-teal-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none mb-4" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setNotifyModal(null); setNotifyTitle(""); setNotifyBody(""); }}
                className="px-4 py-2 text-sm font-medium text-charcoal-600 dark:text-white bg-charcoal-100 dark:bg-charcoal-700 rounded-lg hover:bg-charcoal-200 dark:hover:bg-charcoal-600 transition-colors">Cancel</button>
              <button onClick={sendNotification} disabled={sending || !notifyTitle.trim() || !notifyBody.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-500 dark:bg-purple-700 rounded-lg hover:bg-purple-600 dark:hover:bg-purple-800 transition-colors disabled:opacity-50">
                {sending ? "Sending..." : "Send Notification"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
