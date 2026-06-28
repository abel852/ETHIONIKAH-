"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Phone, Shield, Smartphone, Key, Home } from "lucide-react";
import { Button, Input } from "@/components/common";
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) router.replace("/matches");
  }, []);

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
  const [twoFactorEmail, setTwoFactorEmail] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const twoFactorRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (requires2FA && twoFactorRef.current) twoFactorRef.current.focus();
  }, [requires2FA]);

  const handleLoginSuccess = (data: any) => {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));

    if (rememberMe) {
      localStorage.setItem("rememberMe", "true");
      localStorage.setItem("rememberMeTimestamp", String(Date.now()));
      document.cookie = `accessToken=${data.accessToken}; path=/; max-age=${60*60*24*3}; SameSite=Lax`;
    }

    if (data.deviceToken) {
      localStorage.setItem("trustedDeviceToken", data.deviceToken);
    }

    if (data.user?.role === "admin") {
      window.location.href = "/admin";
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
      setError(err?.response?.data?.error || "Invalid credentials. Please try again.");
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
      const msg = err?.response?.data?.error || "Invalid code. Try again.";
      setError(msg);
      if (err?.response?.data?.attemptsRemaining !== undefined) {
        setError(`${msg} (${err.response.data.attemptsRemaining} attempt(s) remaining)`);
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
                <span className="text-sm font-medium text-charcoal-600 dark:text-charcoal-300">Home</span>
              </Link>
              <div className="flex items-center gap-2 opacity-60">
                <Image src="/images/logo.png" alt="" width={28} height={28} className="rounded-lg border border-accent/50" />
                <span className="font-display font-semibold text-sm text-charcoal-500 dark:text-charcoal-400">Ethio Nikah</span>
              </div>
            </div>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mb-2">Two-Factor Auth</h1>
              <p className="text-charcoal-500 dark:text-charcoal-400">{useBackupCode ? "Enter one of your saved recovery codes" : "Enter the 6-digit code from your authenticator app"}</p>
            </div>

            <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 p-8">
              <form onSubmit={handle2FASubmit} className="space-y-5">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 dark:bg-accent/20 flex items-center justify-center mx-auto mb-4">
                    {useBackupCode ? <Key className="w-8 h-8 text-accent" /> : <Smartphone className="w-8 h-8 text-accent" />}
                  </div>
                  <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mb-1">
                    Authenticating as <span className="font-medium text-charcoal-700 dark:text-charcoal-200">{twoFactorEmail}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2 text-center">
                    {useBackupCode ? "Recovery Code" : "Authentication Code"}
                  </label>
                  {useBackupCode ? (
                    <input
                      ref={twoFactorRef}
                      type="text"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.toUpperCase().slice(0, 9))}
                      placeholder="A1B2-C3D4"
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
                      placeholder="000000"
                      className="w-full text-center text-2xl tracking-[0.5em] font-mono px-4 py-3 rounded-xl bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-charcoal-900 dark:text-white placeholder-charcoal-300 dark:placeholder-charcoal-600 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                    />
                  )}
                </div>

                  {captchaRequired && (
                    <div className="p-3 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-700">
                      Too many failed attempts. CAPTCHA verification required.
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
                    Remember this device for 3 days
                  </label>

                  <Button type="submit" variant="primary" className="w-full" size="lg" loading={isSubmitting} disabled={useBackupCode ? twoFactorCode.length < 9 : twoFactorCode.length !== 6}>
                    Verify
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <button type="button" onClick={() => { setUseBackupCode(!useBackupCode); setTwoFactorCode(""); }} className="w-full text-sm text-accent hover:text-accent-dark font-medium text-center">
                    {useBackupCode ? "Use authenticator code instead" : "Use a recovery code instead"}
                  </button>

                <button type="button" onClick={handleBackToLogin} className="w-full text-sm text-accent hover:text-accent-dark font-medium text-center">
                  Back to login
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-accent/20 via-accent/10 to-accent/5 dark:from-accent/10 dark:to-charcoal-800 items-center justify-center p-12">
          <div className="max-w-md text-center">
            <Image src="/images/logo.png" alt="Ethio Nikah" width={80} height={80} className="mx-auto mb-6 rounded-2xl border-2 border-accent ring-2 ring-charcoal-900 dark:ring-charcoal-700" />
            <h2 className="text-3xl font-display font-bold text-charcoal-900 dark:text-white mb-4">Secure Login</h2>
            <p className="text-charcoal-500 dark:text-charcoal-400 leading-relaxed">
              Two-factor authentication adds an extra layer of security to your account.
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
              <span className="text-sm font-medium text-charcoal-600 dark:text-charcoal-300">Home</span>
            </Link>
            <div className="flex items-center gap-2 opacity-60">
              <Image src="/images/logo.png" alt="" width={28} height={28} className="rounded-lg border border-accent/50" />
              <span className="font-display font-semibold text-sm text-charcoal-500 dark:text-charcoal-400">Ethio Nikah</span>
            </div>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mb-2">Welcome Back</h1>
            <p className="text-charcoal-500 dark:text-charcoal-400">Sign in to continue your journey</p>
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
                Email
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
                Phone
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              {loginMethod === "email" ? (
                <Input
                  id="email"
                  type="email"
                  label="Email Address"
                  placeholder="Enter your email"
                  icon={<Mail className="w-4 h-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              ) : (
                <Input
                  id="phone"
                  type="tel"
                  label="Phone Number"
                  placeholder="+251 911 000 000"
                  icon={<Phone className="w-4 h-4" />}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              )}
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  placeholder="Enter your password"
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
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl">
                  <Shield className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-charcoal-600 dark:text-charcoal-400 cursor-pointer">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded border-charcoal-300 text-accent focus:ring-accent/30" />
                  Remember me
                </label>
                <Link href="/forgot-password" className="text-accent hover:text-accent-dark font-medium">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" variant="primary" className="w-full" size="lg" loading={isSubmitting}>
                Sign In
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-charcoal-500 dark:text-charcoal-400 text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-accent hover:text-accent-dark font-medium">
                  Create one
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
            Find Your Naseeb
          </h2>
          <p className="text-charcoal-500 dark:text-charcoal-400 leading-relaxed">
            &ldquo;And among His signs is this, that He created for you mates from among yourselves,
            that you may dwell in tranquility with them.&rdquo;
          </p>
          <p className="text-charcoal-400 dark:text-charcoal-500 text-sm mt-4 italic">— Quran, Surah Ar-Rum (30:21)</p>
        </div>
      </div>
    </div>
  );
}
