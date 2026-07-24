"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { Button } from "@/components/common";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [maxAttempts, setMaxAttempts] = useState<number | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!email || !email.includes("@")) {
      setSubmitError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email }, {
        _noRedirect: true,
        _noToast: true,
        _silent: true,
      } as any);
      setAttemptsRemaining(data.attemptsRemaining ?? null);
      setMaxAttempts(data.maxAttempts ?? null);
      setSubmitted(true);
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to send reset link. Please try again.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 dark:bg-charcoal-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <Image src="/images/logo.png" alt="Ethio Nikah" width={44} height={44} className="rounded-xl border-2 border-accent ring-2 ring-charcoal-900" />
            <span className="font-display font-bold text-xl text-charcoal-900 dark:text-white [-webkit-text-stroke:0.5px_#D4AF37]">
              Ethio <span className="text-accent">Nikah</span>
            </span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mb-2">{t('auth.resetPassword')}</h1>
          <p className="text-charcoal-500 dark:text-charcoal-400">{t('auth.resetPasswordDesc')}</p>
        </div>

        <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 p-8">
          {submitted ? (
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-display font-bold text-charcoal-900 dark:text-white mb-2">{t('auth.checkEmail')}</h2>
              <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mb-4">
                {t('auth.checkEmailDesc')}
              </p>
              {attemptsRemaining !== null && maxAttempts !== null && (
                <div className="mb-6 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-sm text-amber-700 dark:text-amber-300">
                  You have <strong>{attemptsRemaining}</strong> password reset attempt{attemptsRemaining !== 1 ? "s" : ""} remaining in this 5-day period (out of {maxAttempts}).
                </div>
              )}
              <Link href="/login">
                <Button variant="outline" className="w-full">{t('auth.backToSignIn')}</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.replace(/[^a-zA-Z0-9@.]/g, ""))}
                    placeholder={t('auth.emailPlaceholder')}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-charcoal-900 dark:text-white placeholder-charcoal-300 dark:placeholder-charcoal-600 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                  />
                </div>
              </div>
              <Button type="submit" variant="primary" className="w-full" size="lg" loading={isSubmitting}>
                {t('auth.sendResetLink')}
              </Button>
              {submitError && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
              <div className="text-center">
                <Link href="/login" className="inline-flex items-center gap-1 text-sm text-charcoal-500 dark:text-charcoal-400 hover:text-accent">
                  <ArrowLeft className="w-3 h-3" /> {t('auth.backToSignIn')}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
