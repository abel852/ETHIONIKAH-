"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Shield, Search, Check, X, Clock, AlertCircle, Camera } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { mediaUrl, formatDate } from "@/lib/utils";
import { useI18n } from "@/context/I18nContext";

export default function AdminVerificationsPage() {
  const { t } = useI18n();
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState("all");
  const [previewVerification, setPreviewVerification] = useState<any | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getVerifications();
      setVerifications(data.verifications || []);
      adminService.markVerificationViewed();
      window.dispatchEvent(new CustomEvent("refresh-badge-counts"));
    } catch (e: any) {
      console.error("fetch verifications error:", e);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 45000);
    return () => clearInterval(id);
  }, [fetchAll]);

  // Listen for real-time verification status changes
  useEffect(() => {
    const handler = () => fetchAll();
    window.addEventListener("verification-status-changed", handler);
    return () => window.removeEventListener("verification-status-changed", handler);
  }, [fetchAll]);

  const stats = {
    total: verifications.length,
    pending: verifications.filter((v) => v.status === "pending").length,
    approved: verifications.filter((v) => v.status === "approved").length,
    rejected: verifications.filter((v) => v.status === "rejected").length,
  };

  const tabs = [
    { key: "all", label: "All Requests", count: stats.total },
    { key: "pending", label: "Pending", count: stats.pending },
    { key: "approved", label: "Approved", count: stats.approved },
    { key: "rejected", label: "Rejected", count: stats.rejected },
  ];

  const filtered = verifications
    .filter((v) =>
      filterTab === "all" || v.status === filterTab
    )
    .filter((v) => {
      if (!search) return true;
      const name = `${v.user?.firstName || ""} ${v.user?.lastName || ""} ${v.user?.email || ""}`.toLowerCase();
      return name.includes(search.toLowerCase());
    });

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
    };
    return map[status] || map.pending;
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal-900 dark:text-white">{t('admin.verifications.title')}</h1>
        <p className="text-sm text-charcoal-400 dark:text-white mt-0.5">{t('admin.verifications.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total Requests", value: stats.total, icon: Shield, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
          { label: "Approved", value: stats.approved, icon: Check, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
          { label: "Rejected", value: stats.rejected, icon: X, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-white/[0.06] dark:backdrop-blur-xl rounded-2xl border border-charcoal-100 dark:border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-charcoal-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-charcoal-400 dark:text-white">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="bg-white dark:bg-white/[0.06] dark:backdrop-blur-xl rounded-2xl border border-charcoal-100 dark:border-white/10 p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
          <div className="flex gap-1 flex-wrap">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setFilterTab(tab.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filterTab === tab.key
                    ? "bg-accent text-white"
                    : "bg-charcoal-50 dark:bg-white/5 text-charcoal-600 dark:text-white hover:bg-charcoal-100 dark:hover:bg-white/10"
                }`}>
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
            <input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-charcoal-50 dark:bg-white/5 border border-charcoal-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
          </div>
        </div>
      </div>

      {/* Verification Cards */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-charcoal-100 dark:bg-white/5 rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-white/[0.06] dark:backdrop-blur-xl rounded-2xl border border-charcoal-100 dark:border-white/10 p-8 text-center">
          <Camera className="w-10 h-10 text-charcoal-200 dark:text-charcoal-700 mx-auto mb-2" />
          <p className="text-sm text-charcoal-400 dark:text-white">No verification requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((v: any) => {
            const user = v.user || {};
            const isPending = v.status === "pending";

            return (
              <div key={v.id} className={`bg-white dark:bg-white/[0.06] dark:backdrop-blur-xl rounded-2xl border overflow-hidden ${
                isPending ? "border-amber-400/30 ring-1 ring-amber-400/10" : "border-charcoal-100 dark:border-white/10"
              }`}>
                <div className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* User Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {(user.firstName || "U").charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-charcoal-900 dark:text-white">{user.firstName} {user.lastName}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(v.status)}`}>{v.status}</span>
                        </div>
                        <p className="text-xs text-charcoal-400 dark:text-white mt-0.5">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-charcoal-400 dark:text-white">
                          <span>{user.gender || "N/A"}</span>
                          <span>&middot; {formatDate(v.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Document Images */}
                    <div className="flex flex-col sm:flex-row gap-3 lg:ml-auto">
                      {v.idDocumentPath && (
                        <div className="relative group cursor-pointer" onClick={() => setPreviewVerification(v)}>
                          <img src={mediaUrl(v.idDocumentPath) || ""} alt="National ID"
                            className="w-full sm:w-36 h-24 object-cover rounded-xl border border-charcoal-200 dark:border-white/10" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-xl transition-colors flex items-center justify-center">
                            <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <span className="absolute bottom-1 left-1.5 text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded">ID</span>
                        </div>
                      )}
                      {v.selfiePath && (
                        <div className="relative group cursor-pointer" onClick={() => setPreviewVerification(v)}>
                          <img src={mediaUrl(v.selfiePath) || ""} alt="Selfie"
                            className="w-full sm:w-36 h-24 object-cover rounded-xl border border-charcoal-200 dark:border-white/10" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-xl transition-colors flex items-center justify-center">
                            <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <span className="absolute bottom-1 left-1.5 text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded">Selfie</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-charcoal-100 dark:border-white/10">
                    {isPending && (
                      <>
                        <button onClick={() => handleApprove(v.id)}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors">
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button onClick={() => setRejectModal(v.id)}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                    {v.status === "approved" && (
                      <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
                        <Check className="w-3.5 h-3.5" /> Approved
                      </span>
                    )}
                    {v.status === "rejected" && (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
                          <X className="w-3.5 h-3.5" /> Rejected
                        </span>
                        {v.adminNote && (
                          <span className="text-xs text-charcoal-400 dark:text-white/60">Reason: {v.adminNote}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Modal — side-by-side comparison */}
      {previewVerification && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" onClick={() => setPreviewVerification(null)}>
          <div className="relative w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button onClick={() => setPreviewVerification(null)}
              className="absolute -top-5 -right-5 w-12 h-12 rounded-full bg-red-500 text-white shadow-xl flex items-center justify-center hover:bg-red-600 hover:scale-110 transition-all z-10">
              <X className="w-6 h-6" />
            </button>

            {/* User name */}
            <div className="text-center mb-3">
              <p className="text-white font-semibold text-lg">
                {previewVerification.user?.firstName} {previewVerification.user?.lastName}
              </p>
              <p className="text-white/50 text-sm">{previewVerification.user?.email}</p>
            </div>

            {/* Side-by-side images */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
              {previewVerification.idDocumentPath && (
                <div className="flex-1 max-w-md">
                  <p className="text-white/60 text-xs text-center mb-2 font-medium">National ID</p>
                  <img src={mediaUrl(previewVerification.idDocumentPath) || ""} alt="National ID"
                    className="w-full h-auto max-h-[70vh] object-contain rounded-xl border border-white/10" />
                </div>
              )}
              {previewVerification.selfiePath && (
                <div className="flex-1 max-w-md">
                  <p className="text-white/60 text-xs text-center mb-2 font-medium">Selfie Photo</p>
                  <img src={mediaUrl(previewVerification.selfiePath) || ""} alt="Selfie"
                    className="w-full h-auto max-h-[70vh] object-contain rounded-xl border border-white/10" />
                </div>
              )}
            </div>

            {/* Approve / Reject / Close buttons */}
            {previewVerification.status === "pending" && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <button onClick={() => { handleApprove(previewVerification.id); setPreviewVerification(null); }}
                  className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors">
                  <Check className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => { setRejectModal(previewVerification.id); setPreviewVerification(null); }}
                  className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
                  <X className="w-4 h-4" /> Reject
                </button>
                <button onClick={() => setPreviewVerification(null)}
                  className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-medium text-white/80 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                  Close
                </button>
              </div>
            )}
            {previewVerification.status !== "pending" && (
              <div className="flex items-center justify-center mt-4">
                <button onClick={() => setPreviewVerification(null)}
                  className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-medium text-white/80 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRejectModal(null)}>
          <div className="bg-white dark:bg-[#151028]/95 dark:backdrop-blur-xl rounded-2xl p-6 w-full max-w-md shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-charcoal-900 dark:text-white">Reject Verification</h3>
                <p className="text-sm text-charcoal-400 dark:text-white">Provide a reason for rejection</p>
              </div>
            </div>
            <textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Why is this being rejected? (optional)"
              className="w-full px-4 py-2.5 bg-charcoal-50 dark:bg-white/5 border border-charcoal-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none mb-4" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejectModal(null)}
                className="px-4 py-2 text-sm font-medium text-charcoal-600 dark:text-white bg-charcoal-100 dark:bg-white/10 rounded-lg hover:bg-charcoal-200 dark:hover:bg-white/20 transition-colors">Cancel</button>
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
