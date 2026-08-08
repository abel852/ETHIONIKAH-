"use client";

import { useState, useCallback, useEffect } from "react";
import { Heart, Upload, X, Check, Camera, FileText, Sparkles, Loader2 } from "lucide-react";
import { marriageSuccessService } from "@/services/marriageSuccess";
import { useI18n } from "@/context/I18nContext";

type Stage = "request" | "awaiting_confirm" | "upload" | "reviewing" | "approved" | "rejected";

interface MarriageSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  partnershipId: string | null;
  partnerName: string;
  currentUserId?: string;
  onStatusChange?: () => void;
}

export function MarriageSuccessDialog({ open, onClose, partnershipId, partnerName, currentUserId, onStatusChange }: MarriageSuccessDialogProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<Stage>("request");
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [successStory, setSuccessStory] = useState("");
  const [consentToPublish, setConsentToPublish] = useState(false);
  const [weddingPhotos, setWeddingPhotos] = useState<File[]>([]);
  const [engagementPhotos, setEngagementPhotos] = useState<File[]>([]);
  const [ringPhotos, setRingPhotos] = useState<File[]>([]);
  const [marriageCertificate, setMarriageCertificate] = useState<File | null>(null);
  const [isPartner, setIsPartner] = useState(false);

  // Check for existing submissions when dialog opens
  useEffect(() => {
    if (!open) return;
    marriageSuccessService.getMine().then(({ data }) => {
      const submissions = data.submissions || [];
      // Find a submission related to this partnership
      const existing = submissions.find((s: any) => s.partnershipId === partnershipId);
      if (existing) {
        setSubmissionId(existing.id);
        setIsPartner(currentUserId ? existing.partnerId === currentUserId : false);
        if (existing.status === "pending_partner_confirm") {
          setStage("awaiting_confirm");
        } else if (existing.status === "pending_upload") {
          setStage("upload");
        } else if (existing.status === "pending_admin_review") {
          setStage("reviewing");
        } else if (existing.status === "approved") {
          setStage("approved");
        } else if (existing.status === "rejected") {
          setStage("request");
        }
      } else {
        setStage("request");
        setSubmissionId(null);
      }
    }).catch(() => {
      setStage("request");
      setSubmissionId(null);
    });
  }, [open, partnershipId, currentUserId]);

  const handleRequest = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await marriageSuccessService.request();
      setSubmissionId(data.submission.id);
      setStage("awaiting_confirm");
      onStatusChange?.();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to send request");
    } finally {
      setLoading(false);
    }
  }, [onStatusChange]);

  const handleConfirm = useCallback(async () => {
    if (!submissionId) return;
    setLoading(true);
    setError("");
    try {
      await marriageSuccessService.confirm(submissionId);
      setStage("upload");
      onStatusChange?.();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to confirm");
    } finally {
      setLoading(false);
    }
  }, [submissionId, onStatusChange]);

  const handleUpload = useCallback(async () => {
    if (!submissionId) return;
    if (weddingPhotos.length === 0 && engagementPhotos.length === 0 && ringPhotos.length === 0) {
      setError("Please upload at least one photo");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      weddingPhotos.forEach((f) => formData.append("weddingPhotos", f));
      engagementPhotos.forEach((f) => formData.append("engagementPhotos", f));
      ringPhotos.forEach((f) => formData.append("ringPhotos", f));
      if (marriageCertificate) formData.append("marriageCertificate", marriageCertificate);
      formData.append("successStory", successStory);
      formData.append("consentToPublish", String(consentToPublish));

      await marriageSuccessService.uploadPhotos(submissionId, formData);
      setStage("reviewing");
      onStatusChange?.();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to upload photos");
    } finally {
      setLoading(false);
    }
  }, [submissionId, weddingPhotos, engagementPhotos, ringPhotos, marriageCertificate, successStory, consentToPublish, onStatusChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, setter: (files: File[]) => void, multiple = true) => {
    const files = Array.from(e.target.files || []);
    if (multiple) {
      setter(files);
    } else {
      setter(files.slice(0, 1));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-charcoal-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#D4AF37]/20 to-purple-500/20 px-6 py-4 flex items-center justify-between rounded-t-3xl border-b border-[#D4AF37]/20">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
            <h2 className="font-display font-bold text-lg text-charcoal-900 dark:text-white">{t("marriageSuccess.title")}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-charcoal-600 dark:text-charcoal-300" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Stage: Request */}
          {stage === "request" && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#D4AF37] to-purple-500 flex items-center justify-center mb-3">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <p className="text-charcoal-700 dark:text-charcoal-200 text-sm leading-relaxed">
                  {t("marriageSuccess.requestDesc").replace("{partner}", partnerName)}
                </p>
              </div>
              <button
                onClick={handleRequest}
                disabled={loading || !partnershipId}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F2D675] text-black font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
                {t("marriageSuccess.sendRequest")}
              </button>
            </div>
          )}

          {/* Stage: Awaiting partner confirmation */}
          {stage === "awaiting_confirm" && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mb-3">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              </div>
              {isPartner ? (
                <>
                  <p className="text-charcoal-700 dark:text-charcoal-200 text-sm">
                    {t("marriageSuccess.partnerConfirmDesc").replace("{partner}", partnerName)}
                  </p>
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F2D675] text-black font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
                    {t("marriageSuccess.confirmMarriage")}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-charcoal-700 dark:text-charcoal-200 text-sm">
                    {t("marriageSuccess.awaitingConfirm").replace("{partner}", partnerName)}
                  </p>
                  <p className="text-xs text-charcoal-400">{t("marriageSuccess.awaitingConfirmDesc")}</p>
                </>
              )}
            </div>
          )}

          {/* Stage: Upload photos */}
          {stage === "upload" && (
            <div className="space-y-4">
              <p className="text-sm text-charcoal-600 dark:text-charcoal-300">{t("marriageSuccess.uploadDesc")}</p>

              {/* Wedding photos */}
              <div>
                <label className="text-xs font-medium text-charcoal-500 dark:text-charcoal-400 mb-1.5 block flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> {t("marriageSuccess.weddingPhotos")}
                </label>
                <input type="file" accept="image/*" multiple onChange={(e) => handleFileSelect(e, setWeddingPhotos)} className="block w-full text-xs text-charcoal-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#D4AF37]/20 file:text-[#D4AF37] hover:file:bg-[#D4AF37]/30" />
                {weddingPhotos.length > 0 && <p className="text-xs text-green-500 mt-1">{weddingPhotos.length} file(s) selected</p>}
              </div>

              {/* Engagement photos */}
              <div>
                <label className="text-xs font-medium text-charcoal-500 dark:text-charcoal-400 mb-1.5 block flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> {t("marriageSuccess.engagementPhotos")}
                </label>
                <input type="file" accept="image/*" multiple onChange={(e) => handleFileSelect(e, setEngagementPhotos)} className="block w-full text-xs text-charcoal-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#D4AF37]/20 file:text-[#D4AF37] hover:file:bg-[#D4AF37]/30" />
                {engagementPhotos.length > 0 && <p className="text-xs text-green-500 mt-1">{engagementPhotos.length} file(s) selected</p>}
              </div>

              {/* Ring photos */}
              <div>
                <label className="text-xs font-medium text-charcoal-500 dark:text-charcoal-400 mb-1.5 block flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> {t("marriageSuccess.ringPhotos")}
                </label>
                <input type="file" accept="image/*" multiple onChange={(e) => handleFileSelect(e, setRingPhotos)} className="block w-full text-xs text-charcoal-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#D4AF37]/20 file:text-[#D4AF37] hover:file:bg-[#D4AF37]/30" />
                {ringPhotos.length > 0 && <p className="text-xs text-green-500 mt-1">{ringPhotos.length} file(s) selected</p>}
              </div>

              {/* Marriage certificate (optional) */}
              <div>
                <label className="text-xs font-medium text-charcoal-500 dark:text-charcoal-400 mb-1.5 block flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> {t("marriageSuccess.certificate")} ({t("common.optional")})
                </label>
                <input type="file" accept="image/*,application/pdf" onChange={(e) => { const files = Array.from(e.target.files || []); setMarriageCertificate(files[0] || null); }} className="block w-full text-xs text-charcoal-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#D4AF37]/20 file:text-[#D4AF37] hover:file:bg-[#D4AF37]/30" />
              </div>

              {/* Success story */}
              <div>
                <label className="text-xs font-medium text-charcoal-500 dark:text-charcoal-400 mb-1.5 block">
                  {t("marriageSuccess.successStory")} ({t("common.optional")})
                </label>
                <textarea
                  value={successStory}
                  onChange={(e) => setSuccessStory(e.target.value)}
                  rows={3}
                  placeholder={t("marriageSuccess.successStoryPlaceholder")}
                  className="w-full px-3 py-2 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-sm text-charcoal-900 dark:text-white resize-none"
                />
              </div>

              {/* Consent to publish */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={consentToPublish} onChange={(e) => setConsentToPublish(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-[#D4AF37]" />
                <span className="text-xs text-charcoal-600 dark:text-charcoal-300">{t("marriageSuccess.consentToPublish")}</span>
              </label>

              <button
                onClick={handleUpload}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F2D675] text-black font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {t("marriageSuccess.submitForReview")}
              </button>
            </div>
          )}

          {/* Stage: Reviewing */}
          {stage === "reviewing" && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
              <p className="text-charcoal-700 dark:text-charcoal-200 text-sm">{t("marriageSuccess.reviewing")}</p>
              <p className="text-xs text-charcoal-400">{t("marriageSuccess.reviewingDesc")}</p>
            </div>
          )}

          {/* Stage: Approved */}
          {stage === "approved" && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mb-3">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-charcoal-700 dark:text-charcoal-200 text-sm font-medium">{t("marriageSuccess.approved")}</p>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F2D675] text-black font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                {t("marriageSuccess.viewCongratulations")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
