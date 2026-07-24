"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Phone, Shield, Smartphone, Key, Home, Clock, AlertTriangle, LifeBuoy, HelpCircle } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { Button, Input } from "@/components/common";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [twoFactorEmail, setTwoFactorEmail] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const twoFactorRef = useRef<HTMLInputElement>(null);

  // Lockout state
  const [lockout, setLockout] = useState<any>(null);
  const [countdown, setCountdown] = useState("");
  const [showContactAdmin, setShowContactAdmin] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    if (requires2FA && twoFactorRef.current) twoFactorRef.current.focus();
  }, [requires2FA]);

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockout || lockout.permanent || !lockout.lockedUntil) return;
    const updateCountdown = () => {
      const remaining = new Date(lockout.lockedUntil).getTime() - Date.now();
      if (remaining <= 0) {
        setCountdown("");
        setLockout(null);
        setShowContactAdmin(false);
        setShowForgotPassword(false);
        return;
      }
      const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
      const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      const secs = Math.floor((remaining % (60 * 1000)) / 1000);
      if (days > 0) setCountdown(`${days}d ${hours}h ${mins}m ${secs}s`);
      else if (hours > 0) setCountdown(`${hours}h ${mins}m ${secs}s`);
      else if (mins > 0) setCountdown(`${mins}m ${secs}s`);
      else setCountdown(`${secs}s`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lockout]);

  const handleLoginSuccess = (data: any) => {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));

    document.cookie = `accessToken=${data.accessToken}; path=/; max-age=${60*60*24*3}; SameSite=Lax`;

    if (data.deviceToken) {
      localStorage.setItem("trustedDeviceToken", data.deviceToken);
    }

    if (data.user?.role === "admin" || data.user?.adminRole) {
      window.location.href = "/admin";
    } else if (!data.user?.isEmailVerified || !data.user?.isPhoneVerified || !data.user?.isVerified) {
      window.location.href = "/verification";
    } else {
      window.location.href = "/matches";
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const payload = loginMethod === "email" ? { email, password } : { phone, password };
      const endpoint = loginMethod === "email" ? "/auth/login" : "/auth/login/phone";

      const trustedDeviceToken = localStorage.getItem("trustedDeviceToken");
      const headers: Record<string, string> = {};
      if (trustedDeviceToken) headers["x-trusted-device"] = trustedDeviceToken;

      const { data } = await api.post(endpoint, payload, { headers });

      if (data.requiresTwoFactor) {
        setRequires2FA(true);
        setTempToken(data.tempToken);
        setTwoFactorEmail(data.email || email);
        setCaptchaRequired(data.captchaRequired || false);
        return;
      }

      handleLoginSuccess(data);
    } catch (err: any) {
      const resp = err?.response?.data;
      if (resp?.code === "ACCOUNT_LOCKED" && resp.lockout) {
        setLockout(resp.lockout);
        setShowContactAdmin(resp.lockout.showContactAdmin || false);
        setShowForgotPassword(resp.lockout.showForgotPassword || false);
        setError(resp.error || resp.lockout.message);
      } else if (resp?.attemptsRemaining !== undefined) {
        // Failed login but still has account-level attempts left
        const remaining = resp.attemptsRemaining;
        const level = resp.lockoutLevel || 0;
        const lockLabels = ["5 minutes", "30 minutes", "12 hours", "3 days"];
        const nextLock = lockLabels[level] || "permanent lock";
        let msg = `Invalid credentials. You have ${remaining} account attempt${remaining > 1 ? "s" : ""} remaining. Next lockout: ${nextLock}.`;
        if (resp.ipAttemptsRemaining !== undefined && resp.ipAttemptsRemaining <= 1) {
          msg += ` Warning: Only ${resp.ipAttemptsRemaining} IP attempt left before 1-hour IP block!`;
        }
        setError(msg);
      } else {
        setError(getErrorMessage(err, t('auth.invalidCredentials')));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const { data } = await api.post("/auth/2fa/verify", { tempToken, token: twoFactorCode, trustDevice });
      handleLoginSuccess(data);
    } catch (err: any) {
      const msg = getErrorMessage(err, "Invalid code. Try again.");
      setError(msg);
      if (err?.response?.data?.attemptsRemaining !== undefined) {
        setError(t('auth.attemptsRemaining', { error: msg, n: err.response.data.attemptsRemaining }));
      }
      setTwoFactorCode("");
      if (twoFactorRef.current) twoFactorRef.current.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    setRequires2FA(false);
    setTempToken("");
    setTwoFactorCode("");
    setEmailOtpCode("");
    setError("");
  };

  if (requires2FA) {
    return (
      <div className="min-h-screen flex dark:bg-charcoal-900">
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between mb-2">
              <Link href="/" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-charcoal-800/80 backdrop-blur-sm border border-charcoal-100/50 dark:border-charcoal-700 shadow-xs hover:shadow-md hover:bg-white dark:hover:bg-charcoal-700 transition-all group">
                <ArrowLeft className="w-4 h-4 text-accent group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm font-medium text-charcoal-600 dark:text-charcoal-300">{t('auth.home')}</span>
              </Link>
              <div className="flex items-center gap-2 opacity-60">
                <Image src="/images/logo.png" alt="" width={28} height={28} className="rounded-lg border border-accent/50" />
                <span className="font-display font-semibold text-sm text-charcoal-500 dark:text-charcoal-400">Ethio Nikah</span>
              </div>
            </div>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mb-2">{t('auth.twoFactor')}</h1>
              <p className="text-charcoal-500 dark:text-charcoal-400">{useBackupCode ? t('auth.enterRecoveryCode') : t('auth.enterAuthCode')}</p>
            </div>

            <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 p-8">
              <form onSubmit={handle2FASubmit} className="space-y-5">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 dark:bg-accent/20 flex items-center justify-center mx-auto mb-4">
                    {useBackupCode ? <Key className="w-8 h-8 text-accent" /> : <Smartphone className="w-8 h-8 text-accent" />}
                  </div>
                  <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mb-1">
                    {t('auth.authenticatingAs', { email: twoFactorEmail })}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2 text-center">
                    {useBackupCode ? t('auth.recoveryCode') : t('auth.authenticatorCode')}
                  </label>
                  {useBackupCode ? (
                    <input
                      ref={twoFactorRef}
                      type="text"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.toUpperCase().slice(0, 9))}
                      placeholder={t('auth.recoveryCodePlaceholder')}
                      className="w-full text-center text-xl tracking-wider font-mono px-4 py-3 rounded-xl bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-charcoal-900 dark:text-white placeholder-charcoal-300 dark:placeholder-charcoal-600 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                    />
                  ) : (
                    <input
                      ref={twoFactorRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder={t('auth.authenticatorCodePlaceholder')}
                      className="w-full text-center text-2xl tracking-[0.5em] font-mono px-4 py-3 rounded-xl bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-charcoal-900 dark:text-white placeholder-charcoal-300 dark:placeholder-charcoal-600 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                    />
                  )}
                </div>

                  {captchaRequired && (
                    <div className="p-3 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-700">
                      {t('auth.tooManyAttempts')}
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl">
                      <Shield className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <label className="flex items-center gap-2 text-sm text-charcoal-600 dark:text-charcoal-400 cursor-pointer">
                    <input type="checkbox" checked={trustDevice} onChange={(e) => setTrustDevice(e.target.checked)} className="rounded border-charcoal-300 text-accent focus:ring-accent/30" />
                    {t('auth.rememberDevice')}
                  </label>

                  <Button type="submit" variant="primary" className="w-full" size="lg" loading={isSubmitting} disabled={useBackupCode ? twoFactorCode.length < 9 : twoFactorCode.length !== 6}>
                    {t('auth.verify')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <button type="button" onClick={() => { setUseBackupCode(!useBackupCode); setTwoFactorCode(""); setEmailOtpCode(""); }} className="w-full text-sm text-accent hover:text-accent-dark font-medium text-center">
                    {useBackupCode ? t('auth.useAuthCode') : t('auth.useRecoveryCode')}
                  </button>

                <button type="button" onClick={handleBackToLogin} className="w-full text-sm text-accent hover:text-accent-dark font-medium text-center">
                  {t('auth.backToLogin')}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-accent/20 via-accent/10 to-accent/5 dark:from-accent/10 dark:to-charcoal-800 items-center justify-center p-12">
          <div className="max-w-md text-center">
            <Image src="/images/logo.png" alt="Ethio Nikah" width={80} height={80} className="mx-auto mb-6 rounded-2xl border-2 border-accent ring-2 ring-charcoal-900 dark:ring-charcoal-700" />
            <h2 className="text-3xl font-display font-bold text-charcoal-900 dark:text-white mb-4">{t('auth.secureLogin')}</h2>
            <p className="text-charcoal-500 dark:text-charcoal-400 leading-relaxed">
              {t('auth.secureLoginDesc')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex dark:bg-charcoal-900">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-2">
            <Link href="/" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-charcoal-800/80 backdrop-blur-sm border border-charcoal-100/50 dark:border-charcoal-700 shadow-xs hover:shadow-md hover:bg-white dark:hover:bg-charcoal-700 transition-all group">
              <ArrowLeft className="w-4 h-4 text-accent group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-sm font-medium text-charcoal-600 dark:text-charcoal-300">{t('auth.home')}</span>
            </Link>
            <div className="flex items-center gap-2 opacity-60">
              <Image src="/images/logo.png" alt="" width={28} height={28} className="rounded-lg border border-accent/50" />
              <span className="font-display font-semibold text-sm text-charcoal-500 dark:text-charcoal-400">Ethio Nikah</span>
            </div>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mb-2">{t('auth.welcomeBack')}</h1>
            <p className="text-charcoal-500 dark:text-charcoal-400">{t('auth.signInToContinue')}</p>
          </div>

          <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 p-8">
            <div className="flex gap-2 mb-6 p-1 bg-charcoal-100 dark:bg-charcoal-700 rounded-xl">
              <button
                type="button"
                onClick={() => setLoginMethod("email")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  loginMethod === "email"
                    ? "bg-white dark:bg-charcoal-600 text-accent shadow-sm"
                    : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-charcoal-200"
                }`}
              >
                {t('auth.emailMethod')}
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod("phone")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  loginMethod === "phone"
                    ? "bg-white dark:bg-charcoal-600 text-accent shadow-sm"
                    : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-charcoal-200"
                }`}
              >
                {t('auth.phoneMethod')}
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              {loginMethod === "email" ? (
                <Input
                  id="email"
                  type="email"
                  label={t('auth.email')}
                  placeholder={t('auth.emailPlaceholder')}
                  icon={<Mail className="w-4 h-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value.replace(/[^a-zA-Z0-9@.]/g, ""))}
                />
              ) : (
                <Input
                  id="phone"
                  type="tel"
                  label={t('auth.phone')}
                  placeholder={t('auth.phonePlaceholder')}
                  icon={<Phone className="w-4 h-4" />}
                  value={phone}
                  onChange={(e) => {
                    let v = e.target.value.replace(/[^0-9+]/g, "").slice(0, 13);
                    const plusCount = (v.match(/\+/g) || []).length;
                    if (plusCount > 1) v = v.replace(/\+/g, "") + "+";
                    if (v.includes("+") && !v.startsWith("+")) v = v.replace(/\+/g, "") + "+";
                    setPhone(v);
                  }}
                />
              )}
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  label={t('auth.password')}
                  placeholder={t('auth.passwordPlaceholder')}
                  icon={<Lock className="w-4 h-4" />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-charcoal-400 hover:text-charcoal-600 dark:hover:text-charcoal-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl">
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Lockout countdown timer */}
              {lockout && !lockout.permanent && countdown && (
                <div className="flex flex-col items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-medium">Account temporarily locked</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 tabular-nums">
                    {countdown}
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-500 text-center">
                    Attempt {lockout.lockoutCount} of 5. Lockout escalates with each attempt.
                  </p>
                </div>
              )}

              {/* Permanent lockout */}
              {lockout && lockout.permanent && (
                <div className="flex flex-col items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-sm font-semibold">Account Permanently Locked</span>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-500 text-center">
                    Your account has been flagged for admin review. You must contact support to regain access.
                  </p>
                </div>
              )}

              {/* Contact admin during lockout — password reset is BLOCKED during countdown */}
              {showContactAdmin && lockout && (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/contact-support"
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-all"
                  >
                    <LifeBuoy className="w-4 h-4" />
                    Contact Admin Support
                  </Link>
                </div>
              )}

              {/* Hide forgot password link during active lockout */}
              {(!lockout || (!lockout.locked && !lockout.permanent)) && (
                <div className="flex items-center justify-between text-sm">
                  <Link href="/contact-support" className="text-charcoal-500 dark:text-charcoal-400 hover:text-accent font-medium flex items-center gap-1">
                    <LifeBuoy className="w-3.5 h-3.5" /> Contact Support
                  </Link>
                  <Link href="/forgot-password" className="text-accent hover:text-accent-dark font-medium">
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
              )}

              <Button type="submit" variant="primary" className="w-full" size="lg" loading={isSubmitting} disabled={!!lockout && !lockout.permanent && !!countdown}>
                {t('auth.signIn')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-charcoal-500 dark:text-charcoal-400 text-sm">
                {t('auth.noAccount')}{" "}
                <Link href="/register" className="text-accent hover:text-accent-dark font-medium">
                  {t('auth.createOne')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-accent/20 via-accent/10 to-accent/5 dark:from-accent/10 dark:to-charcoal-800 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <Image src="/images/logo.png" alt="Ethio Nikah" width={80} height={80} className="mx-auto mb-6 rounded-2xl border-2 border-accent ring-2 ring-charcoal-900 dark:ring-charcoal-700" />
          <h2 className="text-3xl font-display font-bold text-charcoal-900 dark:text-white mb-4">
            {t('auth.sideTitle')}
          </h2>
          <p className="text-charcoal-500 dark:text-charcoal-400 leading-relaxed">
            &ldquo;{t('auth.sideQuote')}&rdquo;
          </p>
          <p className="text-charcoal-400 dark:text-charcoal-500 text-sm mt-4 italic">{t('auth.sideQuoteSource')}</p>
        </div>
      </div>
    </div>
  );
}
