"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, CheckCircle, X, Shield, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import api from "@/lib/api";

export function VerificationPrompt() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !user || dismissed) {
      setShow(false);
      return;
    }

    // Don't show for admins
    if (user.role === "admin" || (user as any).adminRole) {
      setShow(false);
      return;
    }

    // Check if already verified
    const emailVerified = (user as any).isEmailVerified;
    const phoneVerified = (user as any).isPhoneVerified;

    if (!emailVerified || !phoneVerified) {
      // Small delay so it appears after page load
      const timer = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isAuthenticated, user, dismissed]);

  const handleSendEmailVerification = async () => {
    try {
      await api.post("/auth/send-email-verification");
      setEmailSent(true);
      setError("");
      setSuccess("Verification email sent! Check your inbox.");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to send verification email.");
    }
  };

  const handleSendPhoneOtp = async () => {
    try {
      await api.post("/auth/send-phone-otp");
      setPhoneOtpSent(true);
      setError("");
      setSuccess("OTP sent to your phone.");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to send OTP.");
    }
  };

  const handleVerifyPhone = async () => {
    setVerifyingPhone(true);
    setError("");
    try {
      await api.post("/auth/verify-phone", { otp });
      setSuccess("Phone verified successfully!");
      // Reload user data
      const { data } = await api.get("/auth/me", { _noRedirect: true } as any);
      if (data.user) {
        const updated = { ...user, isPhoneVerified: true };
        localStorage.setItem("user", JSON.stringify(updated));
        window.location.reload();
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || "Invalid OTP. Try again.");
    } finally {
      setVerifyingPhone(false);
    }
  };

  const handleVerifyEmail = async () => {
    // Mark email as verified (user clicked the link in email and came back)
    try {
      const { data } = await api.get("/auth/me", { _noRedirect: true } as any);
      if (data.user?.isEmailVerified) {
        setSuccess("Email verified successfully!");
        const updated = { ...user, isEmailVerified: true };
        localStorage.setItem("user", JSON.stringify(updated));
        window.location.reload();
      } else {
        setError("Your email is not verified yet. Please click the link in your email.");
      }
    } catch {
      setError("Could not verify email status.");
    }
  };

  const handleSkip = () => {
    setDismissed(true);
    setShow(false);
  };

  const emailVerified = user ? (user as any).isEmailVerified : false;
  const phoneVerified = user ? (user as any).isPhoneVerified : false;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={handleSkip}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-white dark:bg-charcoal-800 rounded-3xl shadow-2xl border border-charcoal-100/50 dark:border-charcoal-700 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-accent/15 via-accent/8 to-transparent dark:from-accent/20 dark:via-accent/10 px-6 pt-6 pb-4 text-center border-b border-charcoal-100/50 dark:border-charcoal-700">
              <div className="w-16 h-16 rounded-2xl bg-accent/15 dark:bg-accent/25 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-xl font-display font-bold text-charcoal-900 dark:text-white mb-1">
                Verify Your Account
              </h2>
              <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                Secure your account by verifying your email and phone number
              </p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {success && (
                <div className="flex items-center gap-2 p-3 text-sm text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-xl">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email Verification */}
              <div className={`rounded-2xl border p-4 transition-all ${emailVerified ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10" : "border-charcoal-200 dark:border-charcoal-700 bg-charcoal-50/50 dark:bg-charcoal-700/30"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${emailVerified ? "bg-green-100 dark:bg-green-900/30" : "bg-accent/10 dark:bg-accent/20"}`}>
                    {emailVerified ? <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" /> : <Mail className="w-5 h-5 text-accent" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-charcoal-900 dark:text-white">Email Verification</h3>
                      {emailVerified && <span className="text-xs text-green-600 dark:text-green-400 font-medium">Verified</span>}
                    </div>
                    <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5 mb-3">
                      {emailVerified
                        ? "Your email has been verified."
                        : "Click the verification link sent to your email inbox."}
                    </p>
                    {!emailVerified && (
                      <div className="flex flex-wrap gap-2">
                        {!emailSent ? (
                          <button
                            onClick={handleSendEmailVerification}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-dark transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5" /> Send Verification Email
                          </button>
                        ) : (
                          <button
                            onClick={handleVerifyEmail}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> I've Verified My Email
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Phone Verification */}
              <div className={`rounded-2xl border p-4 transition-all ${phoneVerified ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10" : "border-charcoal-200 dark:border-charcoal-700 bg-charcoal-50/50 dark:bg-charcoal-700/30"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${phoneVerified ? "bg-green-100 dark:bg-green-900/30" : "bg-accent/10 dark:bg-accent/20"}`}>
                    {phoneVerified ? <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" /> : <Phone className="w-5 h-5 text-accent" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-charcoal-900 dark:text-white">Phone Verification</h3>
                      {phoneVerified && <span className="text-xs text-green-600 dark:text-green-400 font-medium">Verified</span>}
                    </div>
                    <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5 mb-3">
                      {phoneVerified
                        ? "Your phone number has been verified."
                        : "Verify your phone number with an OTP code."}
                    </p>
                    {!phoneVerified && (
                      <div className="space-y-2">
                        {!phoneOtpSent ? (
                          <button
                            onClick={handleSendPhoneOtp}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-dark transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" /> Send OTP
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="Enter 6-digit OTP"
                                className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-sm text-charcoal-900 dark:text-white placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-accent/30"
                              />
                              <button
                                onClick={handleVerifyPhone}
                                disabled={otp.length !== 6 || verifyingPhone}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {verifyingPhone ? "Verifying..." : "Verify"}
                              </button>
                            </div>
                            <button
                              onClick={handleSendPhoneOtp}
                              className="text-xs text-accent hover:text-accent-dark font-medium"
                            >
                              Resend OTP
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-charcoal-100/50 dark:border-charcoal-700 flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-sm text-charcoal-500 dark:text-charcoal-400 hover:text-charcoal-700 dark:hover:text-charcoal-200 transition-colors"
              >
                Remind me later
              </button>
              <button
                onClick={() => router.push("/verification")}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-dark transition-colors"
              >
                Go to Verification Page <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
