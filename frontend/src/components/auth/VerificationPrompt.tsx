"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CheckCircle, X, Shield, ArrowRight } from "lucide-react";
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !user || dismissed) {
      setShow(false);
      return;
    }

    if (user.role === "admin" || (user as any).adminRole) {
      setShow(false);
      return;
    }

    const emailVerified = (user as any).isEmailVerified;

    if (!emailVerified) {
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

  const handleVerifyEmail = async () => {
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
            <div className="bg-gradient-to-br from-accent/15 via-accent/8 to-transparent dark:from-accent/20 dark:via-accent/10 px-6 pt-6 pb-4 text-center border-b border-charcoal-100/50 dark:border-charcoal-700">
              <div className="w-16 h-16 rounded-2xl bg-accent/15 dark:bg-accent/25 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-xl font-display font-bold text-charcoal-900 dark:text-white mb-1">
                Verify Your Email
              </h2>
              <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                Secure your account by verifying your email address
              </p>
            </div>

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
                            <CheckCircle className="w-3.5 h-3.5" /> I&apos;ve Verified My Email
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

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
                Verify Identity <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
