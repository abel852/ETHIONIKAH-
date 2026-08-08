"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, Sparkles, Archive, Trash2, CheckCircle, Loader2, Lock, Eye, X } from "lucide-react";
import { marriageSuccessService } from "@/services/marriageSuccess";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { mediaUrl } from "@/lib/utils";

export default function CongratulationsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteStep1, setShowDeleteStep1] = useState(false);
  const [showDeleteStep2, setShowDeleteStep2] = useState(false);
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [archived, setArchived] = useState(false);

  useEffect(() => {
    marriageSuccessService.getMine().then(({ data }) => {
      setSubmissions(data.submissions || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const approvedSubmission = submissions.find((s) => s.status === "approved");

  const handleArchive = async () => {
    setActionLoading(true);
    setError("");
    try {
      await marriageSuccessService.archiveAccount();
      setArchived(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to archive account");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteVerifyPassword = async () => {
    setActionLoading(true);
    setError("");
    try {
      await marriageSuccessService.deleteAccountVerifyPassword(password);
      setShowDeleteStep1(false);
      setShowDeleteStep2(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Password verification failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setActionLoading(true);
    setError("");
    try {
      await marriageSuccessService.deleteAccountConfirm(otp);
      logout();
      router.push("/");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to delete account");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0c0a1a] via-[#151028] to-[#1a0f2e]">
        <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  if (!approvedSubmission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0c0a1a] via-[#151028] to-[#1a0f2e] p-4">
        <div className="text-center">
          <Heart className="w-16 h-16 text-[#D4AF37]/30 mx-auto mb-4" />
          <p className="text-gray-400 text-sm">{t("marriageSuccess.noApprovedSubmission")}</p>
          <button onClick={() => router.push("/dashboard")} className="mt-4 text-sm text-[#D4AF37] hover:underline">
            {t("marriageSuccess.backToDashboard")}
          </button>
        </div>
      </div>
    );
  }

  const allPhotos = [
    ...(approvedSubmission.weddingPhotos || []).map((p: string) => ({ url: p, type: "Wedding" })),
    ...(approvedSubmission.engagementPhotos || []).map((p: string) => ({ url: p, type: "Engagement" })),
    ...(approvedSubmission.ringPhotos || []).map((p: string) => ({ url: p, type: "Ring" })),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c0a1a] via-[#151028] to-[#1a0f2e] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#D4AF37] to-purple-500 mb-4 shadow-[0_0_30px_rgba(212,175,55,0.3)]">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t("marriageSuccess.congratulations")}</h1>
          <p className="text-[#D4AF37] text-lg">
            {approvedSubmission.initiator?.firstName} & {approvedSubmission.partner?.firstName}
          </p>
          <p className="text-gray-400 text-sm mt-2">{t("marriageSuccess.marriageBlessing")}</p>
        </div>

        {/* Photos */}
        {allPhotos.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#D4AF37]" /> {t("marriageSuccess.yourPhotos")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {allPhotos.map((p: any, i: number) => (
                <img key={i} src={mediaUrl(p.url)} alt="" className="w-full h-40 rounded-xl object-cover" />
              ))}
            </div>
          </div>
        )}

        {/* Success story */}
        {approvedSubmission.successStory && (
          <div className="mb-8 bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">{t("marriageSuccess.yourStory")}</h2>
            <p className="text-gray-300 leading-relaxed text-sm">{approvedSubmission.successStory}</p>
          </div>
        )}

        {/* Feature status */}
        <div className="mb-8 bg-green-500/10 rounded-2xl p-5 border border-green-500/20">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h2 className="text-sm font-semibold text-green-400">{t("marriageSuccess.featuresDisabled")}</h2>
          </div>
          <ul className="text-xs text-gray-400 space-y-1.5 ml-7">
            <li>• {t("marriageSuccess.matchingDisabled")}</li>
            <li>• {t("marriageSuccess.messagingDisabled")}</li>
            <li>• {t("marriageSuccess.profileHidden")}</li>
            <li>• {t("marriageSuccess.partnershipEnded")}</li>
          </ul>
        </div>

        {/* Account management */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#D4AF37]" /> {t("marriageSuccess.accountManagement")}
          </h2>

          {archived && (
            <div className="mb-4 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-sm text-green-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {t("marriageSuccess.archivedSuccess")}
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {/* Archive */}
            <button
              onClick={handleArchive}
              disabled={actionLoading || archived}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-left disabled:opacity-50"
            >
              <Archive className="w-5 h-5 text-[#D4AF37] shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">{t("marriageSuccess.archiveAccount")}</p>
                <p className="text-xs text-gray-400">{t("marriageSuccess.archiveDesc")}</p>
              </div>
            </button>

            {/* Delete */}
            <button
              onClick={() => setShowDeleteStep1(true)}
              disabled={actionLoading}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 transition-colors text-left"
            >
              <Trash2 className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-400">{t("marriageSuccess.deleteAccount")}</p>
                <p className="text-xs text-gray-400">{t("marriageSuccess.deleteDesc")}</p>
              </div>
            </button>
          </div>
        </div>

        {/* View success stories */}
        <div className="text-center mt-6">
          <button onClick={() => router.push("/success-stories")} className="text-sm text-[#D4AF37] hover:underline flex items-center gap-1.5 mx-auto">
            <Eye className="w-4 h-4" /> {t("marriageSuccess.viewStories")}
          </button>
        </div>
      </div>

      {/* Delete Step 1: Password */}
      {showDeleteStep1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowDeleteStep1(false)}>
          <div className="bg-[#1a1a2e] rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{t("marriageSuccess.deleteConfirmTitle")}</h3>
              <button onClick={() => setShowDeleteStep1(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-400 mb-4">{t("marriageSuccess.deleteConfirmDesc")}</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2.5 rounded-xl bg-[#0F0F10] border border-white/10 text-sm text-white mb-4 outline-none focus:border-red-500/40"
            />
            <button
              onClick={handleDeleteVerifyPassword}
              disabled={actionLoading || !password}
              className="w-full py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {t("marriageSuccess.verifyPassword")}
            </button>
          </div>
        </div>
      )}

      {/* Delete Step 2: OTP */}
      {showDeleteStep2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowDeleteStep2(false)}>
          <div className="bg-[#1a1a2e] rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{t("marriageSuccess.enterCode")}</h3>
              <button onClick={() => setShowDeleteStep2(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-400 mb-4">{t("marriageSuccess.otpSent")}</p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit code"
              maxLength={6}
              className="w-full px-3 py-2.5 rounded-xl bg-[#0F0F10] border border-white/10 text-sm text-white text-center tracking-widest mb-4 outline-none focus:border-red-500/40"
            />
            <button
              onClick={handleDeleteConfirm}
              disabled={actionLoading || otp.length !== 6}
              className="w-full py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {t("marriageSuccess.deletePermanently")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
