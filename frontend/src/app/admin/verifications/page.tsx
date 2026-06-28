"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Shield, Search, Check, X, Clock, AlertCircle, Eye, Camera } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { mediaUrl, formatDate } from "@/lib/utils";

export default function AdminVerificationsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [previewImgs, setPreviewImgs] = useState<{ id: string; selfie: string } | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [usersRes, verificationsRes] = await Promise.all([
        adminService.getUsers({ limit: 500 }),
        adminService.getVerifications(),
      ]);
      setUsers(usersRes.data.users || []);
      setVerifications(verificationsRes.data.verifications || []);
    } catch (e: any) {
      console.error("fetch verifications error:", e);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const vMap = new Map(verifications.map((v: any) => [v.userId, v]));

  const merged = users.map((u: any) => {
    const v = vMap.get(u.id);
    return {
      ...u,
      vStatus: u.isVerified ? "approved" : v?.status || "none",
      vDoc: v,
    };
  });

  const priority: Record<string, number> = { pending: 0, none: 1, rejected: 2, approved: 3 };
  const sorted = [...merged].sort((a, b) => (priority[a.vStatus] ?? 99) - (priority[b.vStatus] ?? 99));

  const filtered = search
    ? sorted.filter((u) =>
        `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
      )
    : sorted;

  const handleVerify = async (id: string) => {
    try {
      await adminService.verifyUser(id);
      toast.success("User verified");
      fetchAll();
    } catch { toast.error("Failed to verify"); }
  };

  const handleApprove = async (docId: string) => {
    try {
      await adminService.approveVerification(docId);
      toast.success("Verification approved");
      fetchAll();
    } catch { toast.error("Failed to approve"); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(true);
    try {
      await adminService.rejectVerification(rejectModal, rejectReason);
      toast.success("Verification rejected");
      setRejectModal(null);
      setRejectReason("");
      fetchAll();
    } catch { toast.error("Failed to reject"); }
    finally { setActionLoading(false); }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      approved: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400",
      pending: "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
      rejected: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
      none: "bg-charcoal-100 text-charcoal-500 dark:bg-charcoal-700 dark:text-charcoal-400",
    };
    return map[status] || map.none;
  };

  const stats = {
    total: users.length,
    none: users.filter((u) => !u.isVerified && !vMap.has(u.id)).length,
    pending: verifications.filter((v) => v.status === "pending").length,
    approved: verifications.filter((v) => v.status === "approved").length,
    rejected: verifications.filter((v) => v.status === "rejected").length,
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal-900 dark:text-white">Verification Management</h1>
        <p className="text-sm text-charcoal-400 mt-0.5">Review uploaded documents, approve or reject</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {[
          { label: "Total Users", value: stats.total, icon: Shield, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { label: "Not Verified", value: stats.none, icon: AlertCircle, color: "text-charcoal-500", bg: "bg-charcoal-100 dark:bg-charcoal-700" },
          { label: "Pending Docs", value: stats.pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
          { label: "Approved", value: stats.approved, icon: Check, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
          { label: "Rejected", value: stats.rejected, icon: X, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-charcoal-800 rounded-2xl border border-charcoal-100 dark:border-charcoal-700 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-charcoal-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-charcoal-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-charcoal-100 dark:border-charcoal-700 p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
          <input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-charcoal-100 dark:bg-charcoal-700 rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-charcoal-100 dark:border-charcoal-700 p-8 text-center">
          <Shield className="w-10 h-10 text-charcoal-200 dark:text-charcoal-700 mx-auto mb-2" />
          <p className="text-sm text-charcoal-400">No users found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((user: any) => {
            const status = user.vStatus;
            const doc = user.vDoc;
            const isPending = status === "pending";

            return (
              <div key={user.id} className={`bg-white dark:bg-charcoal-800 rounded-2xl border p-4 ${
                isPending ? "border-amber-400/30 ring-1 ring-amber-400/10" :
                status === "none" ? "border-accent/30 ring-1 ring-accent/10" :
                "border-charcoal-100 dark:border-charcoal-700"
              }`}>
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {(user.firstName || "U").charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-charcoal-900 dark:text-white">{user.firstName} {user.lastName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(status)}`}>
                          {status === "none" ? "Unverified" : status}
                        </span>
                      </div>
                      <p className="text-xs text-charcoal-400 mt-0.5">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-charcoal-400">
                        <span>{user.gender}</span>
                        <span>&middot; {formatDate(user.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Document Previews (for pending only) */}
                  {isPending && doc && (
                    <div className="flex flex-wrap gap-2">
                      {doc.idDocumentPath && doc.selfiePath && (
                        <button onClick={() => setPreviewImgs({ id: mediaUrl(doc.idDocumentPath) || "", selfie: mediaUrl(doc.selfiePath) || "" })}
                          className="flex items-center gap-2 px-3 py-2 bg-charcoal-50 dark:bg-charcoal-700/50 rounded-xl hover:bg-charcoal-100 dark:hover:bg-charcoal-700 transition-colors text-sm group">
                          <Camera className="w-4 h-4 text-charcoal-400" />
                          <span className="text-charcoal-600 dark:text-charcoal-300">View Photos</span>
                          <Eye className="w-3.5 h-3.5 text-charcoal-400 group-hover:text-accent" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isPending && doc && (
                      <>
                        <button onClick={() => handleApprove(doc.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors">
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button onClick={() => setRejectModal(doc.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                    {status === "none" && (
                      <button onClick={() => handleVerify(user.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-accent rounded-lg hover:bg-accent-dark transition-colors">
                        <Check className="w-3.5 h-3.5" /> Verify Now
                      </button>
                    )}
                    {status === "rejected" && (
                      <button onClick={() => handleVerify(user.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-accent rounded-lg hover:bg-accent-dark transition-colors">
                        <Check className="w-3.5 h-3.5" /> Verify Now
                      </button>
                    )}
                    {status === "approved" && (
                      <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium px-3 py-1.5">
                        <Check className="w-3.5 h-3.5" /> Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Modal (side by side) */}
      {previewImgs && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewImgs(null)}>
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewImgs(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white dark:bg-charcoal-800 shadow-lg flex items-center justify-center hover:bg-charcoal-100 dark:hover:bg-charcoal-700 transition-colors z-10">
              <X className="w-4 h-4 text-charcoal-600" />
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-charcoal-900 rounded-2xl overflow-hidden">
                <div className="text-xs text-white/60 text-center py-1.5 bg-black/30">National ID</div>
                <img src={previewImgs.id} alt="National ID" className="w-full h-auto max-h-[70vh] object-contain" />
              </div>
              <div className="bg-charcoal-900 rounded-2xl overflow-hidden">
                <div className="text-xs text-white/60 text-center py-1.5 bg-black/30">Selfie</div>
                <img src={previewImgs.selfie} alt="Selfie" className="w-full h-auto max-h-[70vh] object-contain" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRejectModal(null)}>
          <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 w-full max-w-md shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-charcoal-900 dark:text-white">Reject Verification</h3>
                <p className="text-sm text-charcoal-400">Provide a reason for rejection</p>
              </div>
            </div>
            <textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Why is this being rejected? (optional)"
              className="w-full px-4 py-2.5 bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none mb-4" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejectModal(null)}
                className="px-4 py-2 text-sm font-medium text-charcoal-600 bg-charcoal-100 dark:bg-charcoal-700 rounded-lg hover:bg-charcoal-200 dark:hover:bg-charcoal-600 transition-colors">Cancel</button>
              <button onClick={handleReject} disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
                {actionLoading ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
