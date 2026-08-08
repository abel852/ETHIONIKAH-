"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { marriageSuccessService } from "@/services/marriageSuccess";
import { useI18n } from "@/context/I18nContext";
import { mediaUrl } from "@/lib/utils";
import {
  Heart, CheckCircle, XCircle, Clock, Eye, X, Image as ImageIcon,
  FileText, ChevronRight, Loader2, Search,
} from "lucide-react";

type Submission = {
  id: string;
  status: string;
  initiatorConfirmed: boolean;
  partnerConfirmed: boolean;
  weddingPhotos: string[];
  engagementPhotos: string[];
  ringPhotos: string[];
  marriageCertificate: string | null;
  successStory: string | null;
  consentToPublish: boolean;
  adminNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  initiator: { id: string; firstName: string; lastName: string; email: string };
  partner: { id: string; firstName: string; lastName: string; email: string };
  admin?: { id: string; firstName: string; lastName: string } | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending_partner_confirm: { label: "Awaiting Partner", color: "text-amber-500 bg-amber-500/10", icon: Clock },
  pending_upload: { label: "Awaiting Photos", color: "text-blue-500 bg-blue-500/10", icon: Clock },
  pending_admin_review: { label: "Pending Review", color: "text-purple-500 bg-purple-500/10", icon: Eye },
  approved: { label: "Approved", color: "text-green-500 bg-green-500/10", icon: CheckCircle },
  rejected: { label: "Rejected", color: "text-red-500 bg-red-500/10", icon: XCircle },
};

export default function MarriageSuccessAdminPage() {
  const { t } = useI18n();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending_admin_review");
  const [selected, setSelected] = useState<Submission | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [search, setSearch] = useState("");

  const fetchSubmissions = useCallback(() => {
    setLoading(true);
    marriageSuccessService.adminGetSubmissions(filter || undefined).then(({ data }) => {
      setSubmissions(data.submissions || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleApprove = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await marriageSuccessService.adminApprove(selected.id, adminNote || undefined);
      setSelected(null);
      setAdminNote("");
      fetchSubmissions();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Failed to approve");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await marriageSuccessService.adminReject(selected.id, adminNote || undefined);
      setSelected(null);
      setAdminNote("");
      fetchSubmissions();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Failed to reject");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = submissions.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.initiator?.firstName?.toLowerCase().includes(q) ||
      s.initiator?.lastName?.toLowerCase().includes(q) ||
      s.partner?.firstName?.toLowerCase().includes(q) ||
      s.partner?.lastName?.toLowerCase().includes(q)
    );
  });

  const allPhotos = (s: Submission) => [
    ...s.weddingPhotos.map((p) => ({ url: p, type: "Wedding" })),
    ...s.engagementPhotos.map((p) => ({ url: p, type: "Engagement" })),
    ...s.ringPhotos.map((p) => ({ url: p, type: "Ring" })),
  ];

  return (
    <AdminLayout>
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-purple-500 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("admin.marriageSuccess.title")}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("admin.marriageSuccess.subtitle")}</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {["pending_admin_review", "approved", "rejected", "pending_partner_confirm", "pending_upload", ""].map((f) => (
            <button
              key={f || "all"}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? "bg-[#D4AF37] text-black"
                  : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10"
              }`}
            >
              {f ? (STATUS_CONFIG[f]?.label || f) : "All"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-sm text-gray-900 dark:text-white"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            {t("admin.marriageSuccess.noSubmissions")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s) => {
              const sc = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending_admin_review;
              const SIcon = sc.icon;
              const photos = allPhotos(s);
              return (
                <div
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className="cursor-pointer rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] p-4 hover:shadow-lg transition-shadow"
                >
                  {/* Photo preview */}
                  {photos.length > 0 && (
                    <div className="flex gap-1 mb-3 overflow-hidden">
                      {photos.slice(0, 3).map((p, i) => (
                        <img
                          key={i}
                          src={mediaUrl(p.url)}
                          alt=""
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      ))}
                      {photos.length > 3 && (
                        <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-xs text-gray-400">
                          +{photos.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Names */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {s.initiator?.firstName} {s.initiator?.lastName}
                    </span>
                    <Heart className="w-3 h-3 text-[#D4AF37]" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {s.partner?.firstName} {s.partner?.lastName}
                    </span>
                  </div>

                  {/* Status */}
                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${sc.color}`}>
                    <SIcon className="w-3 h-3" />
                    {sc.label}
                  </div>

                  {/* Date */}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>

                  {/* Consent */}
                  {s.consentToPublish && (
                    <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Consent to publish
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#D4AF37]/20 to-purple-500/20 px-6 py-4 flex items-center justify-between rounded-t-2xl border-b border-[#D4AF37]/20">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
                <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                  {selected.initiator?.firstName} {selected.initiator?.lastName} & {selected.partner?.firstName} {selected.partner?.lastName}
                </h2>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Status */}
              <div className="flex items-center gap-2">
                {(() => {
                  const sc = STATUS_CONFIG[selected.status] || STATUS_CONFIG.pending_admin_review;
                  const SIcon = sc.icon;
                  return (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${sc.color}`}>
                      <SIcon className="w-4 h-4" />
                      {sc.label}
                    </div>
                  );
                })()}
              </div>

              {/* Photos */}
              {allPhotos(selected).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" /> Photos
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {allPhotos(selected).map((p, i) => (
                      <div key={i} className="relative group">
                        <img src={mediaUrl(p.url)} alt="" className="w-full h-24 rounded-lg object-cover" />
                        <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">{p.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Marriage certificate */}
              {selected.marriageCertificate && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> Marriage Certificate
                  </h3>
                  {selected.marriageCertificate.endsWith(".pdf") ? (
                    <a href={mediaUrl(selected.marriageCertificate)} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
                      View PDF
                    </a>
                  ) : (
                    <img src={mediaUrl(selected.marriageCertificate)} alt="Certificate" className="max-w-full h-40 rounded-lg object-cover" />
                  )}
                </div>
              )}

              {/* Success story */}
              {selected.successStory && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Success Story</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                    {selected.successStory}
                  </p>
                </div>
              )}

              {/* Consent */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Publish consent:</span>
                {selected.consentToPublish ? (
                  <span className="text-green-500 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Yes</span>
                ) : (
                  <span className="text-gray-400 flex items-center gap-1"><XCircle className="w-4 h-4" /> No</span>
                )}
              </div>

              {/* Admin note input + actions */}
              {selected.status === "pending_admin_review" && (
                <>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Admin Note (optional)</label>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      rows={2}
                      placeholder="Add a note..."
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F0F10] text-sm text-gray-900 dark:text-white resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="flex-1 py-2.5 rounded-xl bg-green-500 text-white font-semibold text-sm hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Approve
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Reject
                    </button>
                  </div>
                </>
              )}

              {/* Admin note from previous review */}
              {selected.adminNote && selected.status !== "pending_admin_review" && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Admin Note</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 rounded-xl p-3">{selected.adminNote}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
