"use client";

import { useState, useEffect, useRef } from "react";
import { ShieldCheck, Smartphone, Key, Copy, Check, AlertTriangle } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export function Admin2FAGate({ children }: { children: React.ReactNode }) {
  const { user, updateUser } = useAuth();
  const [showGate, setShowGate] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      setChecking(false);
      return;
    }
    if (user.adminRole === "super_admin") {
      setChecking(false);
      return;
    }
    api.get("/auth/2fa/status", { _noToast: true } as any)
      .then(({ data }) => {
        if (!data.enabled) {
          setShowGate(true);
        }
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [user]);

  if (checking) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "#0c0a1a" }}>
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (showGate) {
    return <TwoFactorSetup onComplete={() => { setShowGate(false); updateUser({ twoFactorEnabled: true }); }} />;
  }

  return <>{children}</>;
}

function TwoFactorSetup({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<"intro" | "qr" | "verify" | "backup">("intro");
  const [secret, setSecret] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const verifyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "verify" && verifyRef.current) verifyRef.current.focus();
  }, [step]);

  const handleEnable = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/2fa/enable", {}, { _noToast: true } as any);
      setSecret(data.secret);
      setQrCode(data.qrCode);
      setStep("qr");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to generate 2FA setup");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/2fa/confirm", { secret, token: verifyCode }, { _noToast: true } as any);
      setBackupCodes(data.backupCodes || []);
      setStep("backup");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Invalid code. Try again.");
      setVerifyCode("");
    } finally {
      setLoading(false);
    }
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#0c0a1a" }}>
      <div className="w-full max-w-md" style={{ background: "#151028", borderRadius: "24px", border: "1px solid #2a1e4a", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        {/* Header */}
        <div className="px-6 py-5 text-center border-b" style={{ borderColor: "#2a1e4a" }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))" }}>
            <ShieldCheck className="w-7 h-7" style={{ color: "#D4AF37" }} />
          </div>
          <h2 className="text-lg font-bold text-white">Two-Factor Authentication Required</h2>
          <p className="text-sm mt-1" style={{ color: "#8b80a8" }}>
            You must set up 2FA before accessing the admin panel.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {error && (
            <div className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {step === "intro" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <Smartphone className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#D4AF37" }} />
                  <div>
                    <p className="text-sm font-medium text-white">Install Google Authenticator</p>
                    <p className="text-xs mt-0.5" style={{ color: "#8b80a8" }}>Download from App Store or Google Play</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <Key className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#D4AF37" }} />
                  <div>
                    <p className="text-sm font-medium text-white">Scan QR Code</p>
                    <p className="text-xs mt-0.5" style={{ color: "#8b80a8" }}>We&apos;ll generate a secret for your authenticator app</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#D4AF37" }} />
                  <div>
                    <p className="text-sm font-medium text-white">Verify & Save Backup Codes</p>
                    <p className="text-xs mt-0.5" style={{ color: "#8b80a8" }}>Enter a 6-digit code to confirm, then save your recovery codes</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleEnable}
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #D4AF37, #B8860B)", color: "#0c0a1a" }}
              >
                {loading ? "Generating..." : "Get Started"}
              </button>
            </div>
          )}

          {step === "qr" && (
            <div className="space-y-4">
              {qrCode && (
                <div className="flex justify-center">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48 rounded-xl" />
                </div>
              )}
              <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                <p className="text-xs mb-2" style={{ color: "#8b80a8" }}>Or enter this key manually:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 rounded-lg text-sm font-mono text-white break-all" style={{ background: "#0c0a1a", border: "1px solid #2a1e4a" }}>
                    {secret}
                  </code>
                  <button onClick={copySecret} className="p-2 rounded-lg transition-colors" style={{ background: "rgba(255,255,255,0.05)" }}>
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" style={{ color: "#8b80a8" }} />}
                  </button>
                </div>
              </div>
              <button
                onClick={() => setStep("verify")}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                style={{ background: "linear-gradient(135deg, #D4AF37, #B8860B)", color: "#0c0a1a" }}
              >
                I&apos;ve Scanned the QR Code
              </button>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2 text-center">
                  Enter the 6-digit code from your authenticator app
                </label>
                <input
                  ref={verifyRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="w-full text-center text-2xl tracking-[0.5em] font-mono px-4 py-3 rounded-xl text-white"
                  style={{ background: "#0c0a1a", border: "1px solid #2a1e4a" }}
                />
              </div>
              <button
                onClick={handleVerify}
                disabled={loading || verifyCode.length !== 6}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #D4AF37, #B8860B)", color: "#0c0a1a" }}
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
            </div>
          )}

          {step === "backup" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}>
                <p className="text-sm font-medium text-white mb-2">Save Your Backup Codes</p>
                <p className="text-xs mb-3" style={{ color: "#8b80a8" }}>
                  Store these safely. You&apos;ll need them if you lose access to your authenticator device.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, i) => (
                    <code key={i} className="px-2 py-1.5 rounded-lg text-xs font-mono text-center text-white" style={{ background: "#0c0a1a", border: "1px solid #2a1e4a" }}>
                      {code}
                    </code>
                  ))}
                </div>
              </div>
              <button
                onClick={onComplete}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                style={{ background: "linear-gradient(135deg, #D4AF37, #B8860B)", color: "#0c0a1a" }}
              >
                I&apos;ve Saved My Codes — Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
