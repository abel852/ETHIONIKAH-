"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle, Smartphone, Shield } from "lucide-react";
import { Button, Input } from "@/components/common";
import api from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  useEffect(() => {
    if (!token) setError("Invalid or missing reset token");
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setIsSubmitting(true);
    try {
      const payload: Record<string, string> = { token, password };
      if (requires2FA && twoFactorCode) payload.twoFactorCode = twoFactorCode;
      if (requires2FA && !twoFactorCode) { setError("2FA code is required"); setIsSubmitting(false); return; }
      await api.post("/auth/reset-password", payload);
      setSuccess(true);
    } catch (err: any) {
      if (err?.response?.data?.error?.includes("2FA code required")) {
        setRequires2FA(true);
        setError("This account has 2FA enabled. Enter your authenticator code.");
      } else {
        setError(err?.response?.data?.error || "Failed to reset password");
      }
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 p-8">
      {success ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-charcoal-900 dark:text-white mb-2">Password Reset!</h2>
          <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mb-6">Your password has been successfully updated.</p>
          <Link href="/login"><Button variant="primary" className="w-full">Sign In with New Password</Button></Link>
        </motion.div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          {requires2FA && (
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">
                <Smartphone className="w-4 h-4 inline mr-1.5 text-accent" /> Authentication Code
              </label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-xl tracking-[0.5em] font-mono px-4 py-2.5 rounded-xl bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-charcoal-900 dark:text-white placeholder-charcoal-300 dark:placeholder-charcoal-600 focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          )}
          <div className="relative">
            <Input id="password" type={showPassword ? "text" : "password"} label="New Password" placeholder="Enter new password" icon={<Lock className="w-4 h-4" />} value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[38px] text-charcoal-400 hover:text-charcoal-600">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <Input id="confirmPassword" type={showConfirm ? "text" : "password"} label="Confirm Password" placeholder="Confirm new password" icon={<Lock className="w-4 h-4" />} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-[38px] text-charcoal-400 hover:text-charcoal-600">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl">
              <Shield className="w-4 h-4 shrink-0" /><span>{error}</span>
            </div>
          )}
          <Button type="submit" variant="primary" className="w-full" size="lg" loading={isSubmitting}>
            {requires2FA ? "Verify & Reset" : "Reset Password"}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 dark:bg-charcoal-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <Image src="/application.png" alt="Ethio Nikah" width={44} height={44} className="rounded-xl border-2 border-accent ring-2 ring-charcoal-900" />
            <span className="font-display font-bold text-xl text-charcoal-900 dark:text-white [-webkit-text-stroke:0.5px_#D4AF37]">Ethio Nikah</span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mb-2">Set New Password</h1>
          <p className="text-charcoal-500 dark:text-charcoal-400">Choose a strong password for your account</p>
        </div>
        <Suspense fallback={<div className="text-center py-8 text-charcoal-500">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
