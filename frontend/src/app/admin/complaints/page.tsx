"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, MessageSquare, Clock, CheckCheck,
  Send, AlertCircle, ChevronLeft, RefreshCw, Ban, Pin,
} from "lucide-react";
import { Button, Card } from "@/components/common";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { formatRelativeTime } from "@/lib/utils";
import toast from "react-hot-toast";
import { useI18n } from "@/context/I18nContext";
import api from "@/lib/api";

const glass = "bg-white dark:bg-white/[0.06] backdrop-blur-xl border-charcoal-100 dark:border-white/10";

type Complaint = any;
type UserGroup = { user: { id: string; firstName: string; lastName: string; email: string; isActive: boolean; restrictions: { type: string; reason?: string; expiresAt?: string }[] } | null; complaints: Complaint[] };

const ANON_USER: UserGroup["user"] = {
  id: "anonymous",
  firstName: "Anonymous",
  lastName: "",
  email: "",
  isActive: true,
  restrictions: [],
};

function groupByUser(complaints: Complaint[]): UserGroup[] {
  const map: Record<string, UserGroup> = {};
  for (const c of complaints) {
    const uid = c.userId || "anonymous";
    if (!map[uid]) map[uid] = { user: c.user || ANON_USER, complaints: [] };
    map[uid].complaints.push(c);
  }
  return Object.values(map).sort((a, b) => {
    const aPinned = a.complaints.some((c) => c.isPinned);
    const bPinned = b.complaints.some((c) => c.isPinned);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    const aLast = a.complaints.reduce((latest, c) => new Date(c.createdAt) > latest ? new Date(c.createdAt) : latest, new Date(0));
    const bLast = b.complaints.reduce((latest, c) => new Date(c.createdAt) > latest ? new Date(c.createdAt) : latest, new Date(0));
    return bLast.getTime() - aLast.getTime();
  });
}

function userStatusBadge(user: UserGroup["user"]) {
  if (!user) return null;
  const ban = user.restrictions?.[0];
  if (!user.isActive) {
    if (ban?.expiresAt) {
      return { label: `Banned until ${new Date(ban.expiresAt).toLocaleDateString()}`, color: "text-red-500 bg-red-50 dark:bg-red-500/10 dark:text-red-400" };
    }
    return { label: "Suspended", color: "text-red-500 bg-red-50 dark:bg-red-500/10 dark:text-red-400" };
  }
  return null;
}

export default function AdminComplaintsPage() {
  const { t } = useI18n();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserGroup | null>(null);
  const [responseText, setResponseText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [reopening, setReopening] = useState(false);

  const fetchComplaints = useCallback(async () => {
    try {
      setError("");
      const { data } = await adminService.getComplaints(statusFilter !== "all" ? statusFilter : undefined);
      setComplaints(data.complaints || []);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Failed to fetch complaints";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchComplaints();
    api.post("/admin/mark-viewed/complaints", {}, { _noToast: true } as any).then(() => {
      window.dispatchEvent(new Event("refresh-badge-counts"));
    }).catch(() => {});
  }, [fetchComplaints]);

  useEffect(() => {
    const interval = setInterval(() => { if (document.hidden) return; fetchComplaints(); }, 120000);
    return () => clearInterval(interval);
  }, [fetchComplaints]);

  useEffect(() => {
    if (selectedUser) {
      const currentId = selectedUser.user?.id || "anonymous";
      const updated = groupByUser(complaints).find((g) => (g.user?.id || "anonymous") === currentId);
      setSelectedUser(updated || null);
    }
  }, [complaints]);

  const userGroups = groupByUser(complaints);

  const filtered = userGroups.filter((g) =>
    !search || g.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    g.user?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    g.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    g.complaints.some((c) => c.subject?.toLowerCase().includes(search.toLowerCase())) ||
    g.complaints.some((c) => c.description?.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = {
    total: userGroups.length,
    open: complaints.filter((c) => c.status === "open").length,
    inProgress: complaints.filter((c) => c.status === "in_progress" || c.status === "investigating").length,
    closed: userGroups.filter((g) => g.complaints.every((c) => c.status === "resolved")).length,
  };

  const latestOpen = (group: UserGroup) =>
    group.complaints.filter((c) => c.status !== "resolved").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  const handleOpenConversation = async (group: UserGroup) => {
    setSelectedUser(group);
    const unseen = group.complaints.filter((c) => !c.viewedAt).map((c) => c.id);
    if (unseen.length > 0) {
      try {
        await adminService.markComplaintViewed(unseen);
        window.dispatchEvent(new CustomEvent("refresh-badge-counts"));
      } catch { /* silent */ }
    }
  };

  const handleRespond = async () => {
    if (!selectedUser || !responseText.trim()) return;
    const target = latestOpen(selectedUser);
    if (!target) { toast.error("No open complaints for this user"); return; }
    try {
      await adminService.respondToComplaint(target.id, responseText);
      toast.success("Response sent");
      setResponseText("");
      fetchComplaints();
    } catch { toast.error("Failed to respond"); }
  };

  const handleClose = async () => {
    if (!selectedUser) return;
    const target = latestOpen(selectedUser);
    if (!target) { toast.error("No open complaints to close"); return; }
    try {
      await adminService.closeComplaint(target.id);
      toast.success("Complaint closed");
      fetchComplaints();
    } catch { toast.error("Failed to close"); }
  };

  const handleReopen = async () => {
    if (!selectedUser) return;
    const resolved = selectedUser.complaints.filter((c) => c.status === "resolved");
    if (resolved.length === 0) { toast.error("No resolved complaints to reopen"); return; }
    setReopening(true);
    try {
      await Promise.all(resolved.map((c) => adminService.reopenComplaint(c.id)));
      toast.success(`Case reopened — user can now reply`);
      fetchComplaints();
    } catch { toast.error("Failed to reopen"); }
    finally { setReopening(false); }
  };

  const allResolved = (group: UserGroup) => group.complaints.every((c) => c.status === "resolved");

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white">{t('admin.complaints.title')}</h1>
            <p className="text-sm text-charcoal-500 dark:text-white">{t('admin.complaints.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total, icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { label: "Open", value: stats.open, icon: Clock, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
          { label: "In Progress", value: stats.inProgress, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
          { label: "Closed", value: stats.closed, icon: CheckCheck, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
        ].map((stat) => (
          <div key={stat.label}>
            <Card hover={false} className={glass}>
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
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-white/[0.06] backdrop-blur-xl rounded-2xl border border-charcoal-100 dark:border-white/10 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
            <input
              placeholder="Search by user name, email, or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/10 border border-charcoal-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 text-charcoal-900 dark:text-white placeholder-charcoal-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-white/10 border border-charcoal-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 text-charcoal-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="investigating">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Conversation View */}
      {selectedUser ? (() => {
        const msgs = [...selectedUser.complaints]
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .flatMap(c => {
            const items: { id: string; text: string; isUser: boolean; time: Date; adminName?: string; isResolved?: boolean }[] = [
              { id: c.id + "-u", text: c.description, isUser: true, time: new Date(c.createdAt) },
            ];
            if (c.adminResponse) {
              const adminName = c.admin ? `${c.admin.firstName} ${c.admin.lastName}` : "Admin";
              items.push({ id: c.id + "-a", text: c.adminResponse, isUser: false, time: new Date(c.updatedAt), adminName, isResolved: c.status === "resolved" });
            }
            return items;
          })
          .sort((a, b) => a.time.getTime() - b.time.getTime());

        const groups: { msgs: typeof msgs; isUser: boolean }[] = [];
        for (const m of msgs) {
          const last = groups[groups.length - 1];
          if (last && last.isUser === m.isUser) last.msgs.push(m);
          else groups.push({ msgs: [m], isUser: m.isUser });
        }

        return (
        <div className="flex flex-col h-[600px]">
          <Card className={`${glass} flex flex-col flex-1 overflow-hidden`}>
            <div className="flex items-center gap-3 px-6 py-3 border-b border-charcoal-100 dark:border-charcoal-700 shrink-0">
              <button onClick={() => setSelectedUser(null)} className="p-1.5 rounded-lg hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors">
                <ChevronLeft className="w-5 h-5 text-charcoal-500" />
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {(selectedUser.user?.firstName || "U").charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-charcoal-900 dark:text-white text-sm truncate">{selectedUser.user ? `${selectedUser.user.firstName} ${selectedUser.user.lastName}` : "Anonymous User"}</p>
                  {(() => { const b = userStatusBadge(selectedUser.user); return b ? <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${b.color}`}><Ban className="w-2.5 h-2.5 inline mr-0.5" />{b.label}</span> : null; })()}
                </div>
                <p className="text-xs text-charcoal-400 truncate">{selectedUser.user?.email || "No email on file"}</p>
              </div>
              <span className="text-[11px] text-charcoal-400 shrink-0">{selectedUser.complaints.length} msg{selectedUser.complaints.length !== 1 ? "s" : ""}</span>
              {allResolved(selectedUser) ? (
                <span className="text-[11px] font-medium text-green-500 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full shrink-0">Closed</span>
              ) : (
                <span className="text-[11px] font-medium text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full shrink-0">Open</span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1 scroll-smooth" ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}>
              {groups.map((g, gi) => (
                <div key={gi} className={`flex ${g.isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-4 py-2 shadow-sm ${
                    g.isUser
                      ? "bg-accent text-white rounded-2xl rounded-br-sm"
                      : "bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-900 dark:text-white rounded-2xl rounded-bl-sm"
                  }`}>
                    {!g.isUser && g.msgs[0]?.adminName && (
                      <p className="text-[10px] text-charcoal-400 dark:text-white/40 font-medium mb-1">
                        {g.msgs[0].isResolved ? "Closed" : "Admin"} — {g.msgs[0].adminName}
                      </p>
                    )}
                    {g.msgs.map((m, mi) => (
                      <p key={m.id} className={`text-sm whitespace-pre-wrap ${mi > 0 ? "mt-1.5 pt-1.5 border-t border-white/10 dark:border-white/5" : ""}`}>{m.text}</p>
                    ))}
                    <p className={`text-[10px] mt-0.5 ${g.isUser ? "text-white/60 text-right" : "text-charcoal-400 dark:text-white/40 text-right"}`}>
                      {formatRelativeTime(g.msgs[g.msgs.length - 1].time)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {!allResolved(selectedUser) ? (
              <div className="flex items-end gap-2 px-6 py-4 border-t border-charcoal-100 dark:border-charcoal-700 shrink-0">
                <div className="flex-1 relative">
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleRespond(); } }}
                    placeholder="Message..."
                    rows={1}
                    className="w-full rounded-2xl border border-charcoal-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  />
                </div>
                <button
                  onClick={handleRespond}
                  disabled={!responseText.trim()}
                  className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity hover:opacity-90"
                >
                  <Send className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="text-xs text-red-400 hover:text-red-500 shrink-0 whitespace-nowrap px-2"
                >
                  Close case
                </button>
              </div>
            ) : (
              <div className="px-6 py-4 border-t border-charcoal-100 dark:border-charcoal-700 text-center shrink-0">
                <Button variant="outline" size="sm" onClick={handleReopen} loading={reopening}>
                  Reopen case
                </Button>
              </div>
            )}
          </Card>

          {showConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 max-w-sm mx-4 shadow-xl">
                <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">Close this case?</h3>
                <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mb-6">
                  This will mark all complaints from this user as resolved. The user will no longer be able to send messages.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button variant="ghost" onClick={() => setShowConfirm(false)}>Cancel</Button>
                  <Button variant="danger" onClick={async () => { await handleClose(); setShowConfirm(false); }}>Close Case</Button>
                </div>
              </div>
            </div>
          )}
        </div>
        );
      })() : loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-charcoal-100 dark:bg-charcoal-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : error ? (
        <Card className={glass}>
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-500 font-medium mb-2">Failed to load complaints</p>
            <p className="text-xs text-charcoal-400 dark:text-white/60 mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchComplaints} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Retry
            </Button>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className={glass}>
          <div className="text-center py-12">
            <CheckCheck className="w-12 h-12 text-charcoal-200 dark:text-white/20 mx-auto mb-3" />
            <p className="text-sm text-charcoal-400 dark:text-white/60">{search ? "No users match your search" : "No complaints found"}</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((group) => {
            const last = group.complaints.reduce((a, b) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b);
            const status = userStatusBadge(group.user);
            return (
              <div key={group.user?.id || "anonymous"}>
                <Card
                  hover={false}
                  className={`${glass} cursor-pointer transition-all duration-200 hover:border-accent/30`}
                  onClick={() => handleOpenConversation(group)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(group.user?.firstName || "U").charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-charcoal-900 dark:text-white text-sm truncate">
                          {group.user ? `${group.user.firstName} ${group.user.lastName}` : "Anonymous User"}
                          {!group.user && (
                            <span className="text-[10px] text-charcoal-400 ml-1">(Contact Support)</span>
                          )}
                        </span>
                        {group.complaints.some((c) => c.isPinned) && (
                          <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 flex items-center gap-0.5">
                            <Pin className="w-2.5 h-2.5" />Priority
                          </span>
                        )}
                        {status && (
                          <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${status.color}`}>
                            <Ban className="w-2.5 h-2.5 inline mr-0.5" />{status.label}
                          </span>
                        )}
                        <span className="text-[11px] text-charcoal-400 bg-charcoal-100 dark:bg-charcoal-800 px-2 py-0.5 rounded-full shrink-0">
                          {group.complaints.length} msg{group.complaints.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-xs text-charcoal-400 truncate mb-1">{last.subject}</p>
                      <div className="flex items-center gap-3 text-[11px] text-charcoal-400 flex-wrap">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatRelativeTime(last.createdAt)}</span>
                        {group.complaints.some((c) => c.adminResponse) && (
                          <span className="flex items-center gap-1"><CheckCheck className="w-3 h-3 text-green-500" />Responded</span>
                        )}
                        {group.complaints.some((c) => c.status === "open") ? (
                          <span className="text-red-500 font-medium">{group.complaints.filter((c) => c.status === "open").length} open</span>
                        ) : group.complaints.every((c) => c.status === "resolved") && group.complaints.length > 0 ? (
                          <span className="text-green-500 font-medium">Closed</span>
                        ) : null}
                        {(() => {
                          const assigned = [...group.complaints].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).find(c => c.admin);
                          if (!assigned) return null;
                          const name = `${assigned.admin.firstName} ${assigned.admin.lastName}`;
                          return (
                            <span className={`flex items-center gap-1 ${assigned.status === "resolved" ? "text-green-500" : "text-amber-500"}`}>
                              {assigned.status === "resolved" ? "Closed by" : "Handled by"} {name}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-charcoal-300 rotate-180 shrink-0 mt-1" />
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
