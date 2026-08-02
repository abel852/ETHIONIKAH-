"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Phone, Shield, Smartphone, Key, Home, Clock, AlertTriangle, LifeBuoy, HelpCircle, Headphones, Download, X } from "lucide-react";
import { useI18n, type Lang } from "@/context/I18nContext";
import { Button, Input } from "@/components/common";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";

export default function LoginPage() {
  const { t, lang, setLang } = useI18n();
  const router = useRouter();

  const LANGS: { code: Lang; label: string }[] = [
    { code: "en", label: "EN" },
    { code: "am", label: "አማ" },
    { code: "ar", label: "ع" },
  ];

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
  const [attemptsInfo, setAttemptsInfo] = useState<{remaining: number; nextLockout: string} | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [appInstalled, setAppInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const installedHandler = () => {
      setAppInstalled(true);
      setShowInstallBanner(false);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setAppInstalled(true);
      setShowInstallBanner(false);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setShowInstallBanner(false);
  };

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

    document.cookie = `accessToken=${data.accessToken}; path=/; SameSite=Lax`;

    if (data.deviceToken) {
      localStorage.setItem("trustedDeviceToken", data.deviceToken);
    }

    if (data.user?.role === "admin" || data.user?.adminRole) {
      window.location.href = "/admin";
    } else {
      const identityVerified = data.user?.isVerified || data.user?.verification?.status === "approved";
      if (!identityVerified) {
        window.location.href = "/verification";
      } else {
        window.location.href = "/matches";
      }
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    setAttemptsInfo(null);

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
        setAttemptsInfo({ remaining, nextLockout: nextLock });
        let msg = `Invalid credentials. You have ${remaining} attempt${remaining > 1 ? "s" : ""} remaining before lockout.`;
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
      <div className="min-h-screen login-premium-bg relative overflow-hidden flex flex-col dark:bg-charcoal-900">
        <div className="absolute top-0 left-0 w-40 h-40 islamic-pattern opacity-[0.04] pointer-events-none" />
        <div className="absolute top-0 right-0 w-40 h-40 islamic-pattern opacity-[0.04] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 islamic-pattern opacity-[0.04] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-40 h-40 islamic-pattern opacity-[0.04] pointer-events-none" />
        <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-accent/10 blur-[80px] rounded-full pointer-events-none" />

        {/* Premium black navigation bar */}
        <div className="relative z-10 bg-charcoal-900 px-4 py-3 flex items-center justify-between shadow-md">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/images/logo.svg" alt="Ethio Nikah" width={32} height={32} className="rounded-lg border-2 border-accent ring-1 ring-white/10" />
            <span className="font-display font-bold text-sm text-white [-webkit-text-stroke:0.5px_#D4AF37]">Ethio Nikah</span>
          </Link>
          <div className="flex items-center gap-0.5">
            {LANGS.map((l, i) => (
              <div key={l.code} className="flex items-center">
                {i > 0 && <span className="text-white/15">|</span>}
                <button onClick={() => setLang(l.code)} className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${lang === l.code ? "text-accent font-bold" : "text-white/50 hover:text-white/80"}`}>
                  {l.label}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-6 lg:py-10">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-6 animate-hero-fade">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full" />
                <Image src="/images/logo.svg" alt="Ethio Nikah" width={72} height={72} className="relative rounded-2xl border-2 border-accent ring-2 ring-white/20 shadow-glow mx-auto" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-charcoal-900 dark:text-white mb-1">{t('auth.twoFactor')}</h1>
              <p className="text-charcoal-500 dark:text-charcoal-400 text-sm">{useBackupCode ? t('auth.enterRecoveryCode') : t('auth.enterAuthCode')}</p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-accent/50" />
                <div className="w-1.5 h-1.5 rotate-45 bg-accent" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-accent/50" />
              </div>
            </div>

            <div className="bg-white dark:bg-charcoal-800 rounded-[28px] premium-card-glow p-6 sm:p-8 animate-card-float">
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
                      className="w-full text-center text-xl tracking-wider font-mono px-4 py-3 rounded-[18px] bg-white dark:bg-charcoal-700 border border-[#E9E9E9] dark:border-charcoal-600 text-charcoal-900 dark:text-white placeholder-[#9CA3AF] premium-input focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all"
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
                      className="w-full text-center text-2xl tracking-[0.5em] font-mono px-4 py-3 rounded-[18px] bg-white dark:bg-charcoal-700 border border-[#E9E9E9] dark:border-charcoal-600 text-charcoal-900 dark:text-white placeholder-[#9CA3AF] premium-input focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all"
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

                <button
                  type="submit"
                  disabled={isSubmitting || (useBackupCode ? twoFactorCode.length < 9 : twoFactorCode.length !== 6)}
                  className="w-full h-[60px] bg-gradient-to-r from-accent to-accent-dark text-white font-bold text-lg rounded-[18px] shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <>
                      {t('auth.verify')} <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <button type="button" onClick={() => { setUseBackupCode(!useBackupCode); setTwoFactorCode(""); setEmailOtpCode(""); }} className="w-full text-sm text-accent hover:text-accent-dark font-semibold text-center transition-colors">
                  {useBackupCode ? t('auth.useAuthCode') : t('auth.useRecoveryCode')}
                </button>

                <button type="button" onClick={handleBackToLogin} className="w-full text-sm text-accent hover:text-accent-dark font-semibold text-center transition-colors">
                  {t('auth.backToLogin')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen login-premium-bg relative overflow-hidden flex flex-col dark:bg-charcoal-900">
      {/* Islamic geometric pattern corners */}
      <div className="absolute top-0 left-0 w-40 h-40 islamic-pattern opacity-[0.04] pointer-events-none" />
      <div className="absolute top-0 right-0 w-40 h-40 islamic-pattern opacity-[0.04] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-40 h-40 islamic-pattern opacity-[0.04] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-40 h-40 islamic-pattern opacity-[0.04] pointer-events-none" />
      {/* Gold glow around hero */}
      <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-accent/10 blur-[80px] rounded-full pointer-events-none" />

      {/* Premium black navigation bar */}
      <div className="relative z-10 bg-charcoal-900 px-4 py-3 flex items-center justify-between shadow-md">
        <Link href="/" className="inline-flex items-center gap-2">
          <Image src="/images/logo.svg" alt="Ethio Nikah" width={32} height={32} className="rounded-lg border-2 border-accent ring-1 ring-white/10" />
          <span className="font-display font-bold text-sm text-white [-webkit-text-stroke:0.5px_#D4AF37]">Ethio Nikah</span>
        </Link>
        <div className="flex items-center gap-0.5">
          {LANGS.map((l, i) => (
            <div key={l.code} className="flex items-center">
              {i > 0 && <span className="text-white/15">|</span>}
              <button onClick={() => setLang(l.code)} className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${lang === l.code ? "text-accent font-bold" : "text-white/50 hover:text-white/80"}`}>
                {l.label}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Install App banner */}
      {showInstallBanner && installPrompt && !appInstalled && (
        <div className="relative z-10 bg-gradient-to-r from-[#D4AF37]/15 to-[#D4AF37]/5 border-b border-[#D4AF37]/20 px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">Install EthioNikah App</p>
              <p className="text-[11px] text-white/50 truncate">Quick access from your home screen</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallApp}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#0c0a1a] bg-[#D4AF37] hover:bg-[#D4AF37]/90 transition-colors"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="p-1 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-6 lg:py-10">
        <div className="w-full max-w-md mx-auto">
          {/* Hero section */}
          <div className="text-center mb-6 animate-hero-fade">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full" />
              <Image src="/images/logo.svg" alt="Ethio Nikah" width={72} height={72} className="relative rounded-2xl border-2 border-accent ring-2 ring-white/20 shadow-glow mx-auto" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-charcoal-900 dark:text-white mb-1">{t('auth.welcomeBack')}</h1>
            <p className="text-charcoal-500 dark:text-charcoal-400 text-sm">{t('auth.signInToContinue')}</p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-accent/50" />
              <div className="w-1.5 h-1.5 rotate-45 bg-accent" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-accent/50" />
            </div>
          </div>

          {/* Floating login card */}
          <div className="bg-white dark:bg-charcoal-800 rounded-[28px] premium-card-glow p-6 sm:p-8 animate-card-float">
            {/* Premium segmented control */}
            <div className="flex gap-2 mb-6 p-1 bg-charcoal-100 dark:bg-charcoal-700/50 rounded-2xl">
              <button
                type="button"
                onClick={() => setLoginMethod("email")}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${loginMethod === "email" ? "bg-gradient-to-r from-accent to-accent-dark text-white shadow-md shadow-accent/30" : "text-charcoal-500 dark:text-charcoal-400 hover:text-charcoal-700 dark:hover:text-charcoal-200"}`}
              >
                {t('auth.emailMethod')}
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod("phone")}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${loginMethod === "phone" ? "bg-gradient-to-r from-accent to-accent-dark text-white shadow-md shadow-accent/30" : "text-charcoal-500 dark:text-charcoal-400 hover:text-charcoal-700 dark:hover:text-charcoal-200"}`}
              >
                {t('auth.phoneMethod')}
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              {loginMethod === "email" ? (
                <div>
                  <label className="block text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">{t('auth.email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400 dark:text-charcoal-500" />
                    <input
                      id="email"
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value.replace(/[^a-zA-Z0-9@.]/g, ""))}
                      className="w-full h-[60px] pl-12 pr-4 text-base bg-white dark:bg-charcoal-700 border border-[#E9E9E9] dark:border-charcoal-600 rounded-[18px] text-charcoal-900 dark:text-white placeholder-[#9CA3AF] premium-input focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">{t('auth.phone')}</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400 dark:text-charcoal-500" />
                    <input
                      id="phone"
                      type="tel"
                      placeholder={t('auth.phonePlaceholder')}
                      value={phone}
                      onChange={(e) => {
                        let v = e.target.value.replace(/[^0-9+]/g, "").slice(0, 13);
                        const plusCount = (v.match(/\+/g) || []).length;
                        if (plusCount > 1) v = v.replace(/\+/g, "") + "+";
                        if (v.includes("+") && !v.startsWith("+")) v = v.replace(/\+/g, "") + "+";
                        setPhone(v);
                      }}
                      className="w-full h-[60px] pl-12 pr-4 text-base bg-white dark:bg-charcoal-700 border border-[#E9E9E9] dark:border-charcoal-600 rounded-[18px] text-charcoal-900 dark:text-white placeholder-[#9CA3AF] premium-input focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">{t('auth.password')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400 dark:text-charcoal-500" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t('auth.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-[60px] pl-12 pr-12 text-base bg-white dark:bg-charcoal-700 border border-[#E9E9E9] dark:border-charcoal-600 rounded-[18px] text-charcoal-900 dark:text-white placeholder-[#9CA3AF] premium-input focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-charcoal-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl">
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Attempts remaining warning */}
              {attemptsInfo && !lockout && (
                <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">{attemptsInfo.remaining}</span>
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-400">attempt{attemptsInfo.remaining > 1 ? "s" : ""} remaining</span>
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                      Next lockout: {attemptsInfo.nextLockout}
                    </p>
                  </div>
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
                    Lockout level {lockout.lockoutLevel || 1}. Lockout escalates with each round.
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

              {/* Support row */}
              {(!lockout || (!lockout.locked && !lockout.permanent)) && (
                <div className="flex items-center justify-end text-sm">
                  <Link href="/forgot-password" className="text-accent hover:text-accent-dark font-semibold transition-colors">
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
              )}

              {/* Primary button */}
              <button
                type="submit"
                disabled={isSubmitting || (!!lockout && !lockout.permanent && !!countdown)}
                className="w-full h-[60px] bg-gradient-to-r from-accent to-accent-dark text-white font-bold text-lg rounded-[18px] shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    {t('auth.signIn')} <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Social login divider */}
            <div className="mt-6 mb-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-charcoal-200 dark:bg-charcoal-700" />
              <span className="text-xs text-charcoal-400 dark:text-charcoal-500 font-medium">or continue with</span>
              <div className="flex-1 h-px bg-charcoal-200 dark:bg-charcoal-700" />
            </div>

            {/* Social login buttons */}
            <div className="flex gap-3">
              <button className="flex-1 h-14 bg-white dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </button>
              <button className="flex-1 h-14 bg-white dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              </button>
              <button className="flex-1 h-14 bg-white dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all">
                <Phone className="w-5 h-5 text-charcoal-600 dark:text-charcoal-300" />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-charcoal-500 dark:text-charcoal-400 text-sm">
              {t('auth.noAccount')}{" "}
              <Link href="/register" className="text-accent hover:text-accent-dark font-semibold">
                {t('auth.createOne')}
              </Link>
            </p>
          </div>

          {/* Security section */}
          <div className="mt-5 flex items-center justify-center gap-2 text-charcoal-400 dark:text-charcoal-500">
            <Shield className="w-4 h-4 text-accent/60" />
            <p className="text-xs">Your data is safe and secure with us.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
