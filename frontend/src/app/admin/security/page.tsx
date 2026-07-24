"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { Button } from "@/components/common";
import api from "@/lib/api";
import {
  ShieldAlert, Eye, Shield, UserX, AlertTriangle, Fingerprint, Smartphone,
  CheckCircle, Download, X, Copy, Trash2, Key
} from "lucide-react";
import { useI18n } from "@/context/I18nContext";

export default function SecurityPage() {
  const { t } = useI18n();
  const [gdpr, setGdpr] = useState<any>({});
  const [suspicious, setSuspicious] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminService.getGDPRRequests().catch(() => ({ data: { stats: {} } })),
      adminService.getSuspiciousActivity().catch(() => ({ data: { flags: {} } })),
    ]).then(([g, s]) => {
      setGdpr(g.data.stats || {});
      setSuspicious(s.data.flags || {});
    }).finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.security.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-white mt-1">{t('admin.security.subtitle')}</p>
      </div>

      <TwoFactorSection />

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {[1,2].map(i => <div key={i} className="h-64 bg-gray-100 dark:bg-[#222240] rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-blue-500" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">GDPR & Privacy</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "Total Users", value: gdpr.totalUsers, color: "text-blue-600" },
                { label: "Inactive Users", value: gdpr.inactiveUsers, color: "text-gray-600" },
                { label: "Pending Deletions", value: gdpr.pendingDeletions, color: "text-red-600" },
                { label: "Retention Days", value: gdpr.retentionDays, color: "text-amber-600" },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                  <p className="text-xs text-gray-500 dark:text-white">{s.label}</p>
                  <p className={`text-xl font-bold ${s.color} dark:text-white`}>{s.value ?? 0}</p>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1.5"><Fingerprint className="w-3.5 h-3.5" /> Data retention is set to {gdpr.retentionDays || 30} days. User deletion requests are processed automatically.</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Suspicious Activity</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                <p className="text-xs text-gray-500 dark:text-white">24h Registrations</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{suspicious.rapidRegistrations ?? 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                <p className="text-xs text-gray-500 dark:text-white">Suspicious IPs</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{suspicious.suspiciousIPs?.length ?? 0}</p>
              </div>
            </div>
            {suspicious.suspiciousIPs?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-white mb-2">Top Suspicious IPs</p>
                <div className="space-y-1.5">
                  {suspicious.suspiciousIPs.slice(0, 5).map((ip: any) => (
                    <div key={ip.ip} className="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                      <span className="font-mono text-gray-700 dark:text-white">{ip.ip}</span>
                      <span className="text-gray-500 dark:text-white">{ip.count} actions</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { href: "/admin/audit-logs", icon: Eye, label: "View Full Audit Logs", desc: "Complete history of all admin actions", color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
              { href: "/admin/users", icon: UserX, label: "Manage Banned Users", desc: "Review and manage restricted accounts", color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
              { href: "/admin/settings", icon: Shield, label: "Privacy Settings", desc: "Configure data retention and privacy rules", color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-900/20" },
            ].map((l) => (
              <a key={l.href} href={l.href} className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-[#222240] border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-all">
                <div className={`w-10 h-10 rounded-lg ${l.bg} flex items-center justify-center`}>
                  <l.icon className={`w-5 h-5 ${l.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{l.label}</p>
                  <p className="text-xs text-gray-500 dark:text-white">{l.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function TwoFactorSection() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"status" | "setup" | "confirm" | "disable">("status");
  const [secret, setSecret] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [forcePassword, setForcePassword] = useState("");
  const [showForceInput, setShowForceInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<{index: number; used: boolean; hint: string}[]>([]);
  const [recoveryCodeCount, setRecoveryCodeCount] = useState(0);
  const [regeneratePassword, setRegeneratePassword] = useState("");
  const [showRegenerate, setShowRegenerate] = useState(false);

  useEffect(() => {
    api.get("/auth/2fa/status").then((r) => {
      setEnabled(r.data.enabled);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const fetchRecoveryCodes = async () => {
    try {
      const { data } = await api.get("/auth/2fa/recovery-codes");
      setRecoveryCodes(data.codes || []);
      setRecoveryCodeCount(data.count || 0);
    } catch {}
  };

  useEffect(() => {
    if (enabled) fetchRecoveryCodes();
  }, [enabled]);

  const [existingSecret, setExistingSecret] = useState(false);
  const handleEnable = async () => {
    setSaving(true);
    try {
      const { data } = await api.post("/auth/2fa/enable");
      setSecret(data.secret);
      setQrCode(data.qrCode);
      setExistingSecret(data.existing);
      setStep("setup");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to setup 2FA");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (verifyCode.length !== 6) return;
    setSaving(true);
    try {
      const { data } = await api.post("/auth/2fa/confirm", { secret, token: verifyCode });
      setEnabled(true);
      setBackupCodes(data.backupCodes || []);
      setShowBackupCodes(true);
      setStep("status");
      setVerifyCode("");
      toast.success("Two-factor authentication enabled");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Invalid code. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDisableConfirm = async () => {
    if (!disablePassword || disableCode.length !== 6) return;
    setSaving(true);
    try {
      await api.post("/auth/2fa/disable", { password: disablePassword, token: disableCode });
      setEnabled(false);
      setStep("status");
      setDisablePassword("");
      setDisableCode("");
      toast.success("Two-factor authentication disabled");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to disable 2FA");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!regeneratePassword) return;
    setSaving(true);
    try {
      const { data } = await api.post("/auth/2fa/regenerate-codes", { password: regeneratePassword });
      setBackupCodes(data.backupCodes || []);
      setShowBackupCodes(true);
      setShowRegenerate(false);
      setRegeneratePassword("");
      toast.success("Recovery codes regenerated");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to regenerate");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-100/50 dark:border-charcoal-700 overflow-hidden">
      <div className="flex items-start gap-4 p-5 pb-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 dark:from-accent/10 dark:to-charcoal-700 flex items-center justify-center shrink-0 mt-0.5">
          <Smartphone className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h2 className="text-lg font-display font-bold text-charcoal-900 dark:text-white">Two-Factor Authentication</h2>
          <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-0.5">Add an extra layer of security to your account</p>
        </div>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        ) : showBackupCodes && backupCodes.length > 0 ? (
          <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-100/50 dark:border-charcoal-700 p-6 space-y-4">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-charcoal-900 dark:text-white">Backup Recovery Codes</p>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">Save these codes in a safe place. Each code can be used only once to access your account if you lose your phone.</p>
            </div>
            <div className="bg-charcoal-50 dark:bg-charcoal-700 rounded-xl p-4 space-y-1.5">
              {backupCodes.map((code, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-white dark:bg-charcoal-600 rounded-lg">
                  <span className="text-sm font-mono font-bold text-charcoal-900 dark:text-white tracking-wider">{code}</span>
                  <span className="text-[10px] text-charcoal-400 dark:text-charcoal-500 uppercase">Code {i + 1}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" className="flex-1" onClick={() => { navigator.clipboard.writeText(backupCodes.join("\n")); toast.success("Codes copied to clipboard"); }}>
                <Copy className="w-4 h-4 inline mr-1.5" /> Copy Codes
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { const blob = new Blob([backupCodes.join("\n")], {type: "text/plain"}); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "ethio-nikah-backup-codes.txt"; a.click(); toast.success("Codes downloaded"); }}>
                <Download className="w-4 h-4 mr-1" /> Download
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowBackupCodes(false)}>
                I've Saved Them
              </Button>
            </div>
          </div>
        ) : step === "setup" ? (
          <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-100/50 dark:border-charcoal-700 p-6 space-y-5">
            {existingSecret ? (
              <div className="text-center">
                <Smartphone className="w-12 h-12 text-accent mx-auto mb-3" />
                <p className="text-sm font-medium text-charcoal-700 dark:text-charcoal-300">Use your existing authenticator entry</p>
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">Your previously saved secret is still valid. Enter the code from your existing Google Authenticator entry.</p>
                {showForceInput ? (
                  <div className="flex items-center gap-2 mt-2">
                    <input type="password" value={forcePassword} onChange={(e) => setForcePassword(e.target.value)}
                      placeholder="Enter your password" className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-charcoal-900 dark:text-white placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                    <button type="button" onClick={async () => { if (!forcePassword) return; setSaving(true); try { const { data } = await api.post("/auth/2fa/enable", { force: true, password: forcePassword }); setSecret(data.secret); setQrCode(data.qrCode); setExistingSecret(false); setShowForceInput(false); setForcePassword(""); } catch (e: any) { toast.error(e?.response?.data?.error || "Failed"); } finally { setSaving(false); } }}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-dark">Confirm</button>
                    <button type="button" onClick={() => { setShowForceInput(false); setForcePassword(""); }} className="text-xs text-charcoal-400 hover:text-charcoal-600">Cancel</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowForceInput(true)}
                    className="text-xs text-accent hover:text-accent-dark mt-2 underline underline-offset-2"
                  >I don't have access — generate a new key</button>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-3">Scan this QR code with Google Authenticator</p>
                {qrCode && <img src={qrCode} alt="QR Code" className="mx-auto w-48 h-48 rounded-lg border border-charcoal-200 dark:border-charcoal-600" />}
              </div>
            )}
            {!existingSecret && (
              <div className="bg-charcoal-50 dark:bg-charcoal-700 rounded-lg p-3 text-center">
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-1">Or enter this key manually:</p>
                <p className="text-sm font-mono font-bold text-charcoal-900 dark:text-white tracking-wider select-all">{secret}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Enter the 6-digit code from the app</label>
              <input
                type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-xl tracking-[0.5em] font-mono px-4 py-2.5 rounded-xl bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-charcoal-900 dark:text-white placeholder-charcoal-300 dark:placeholder-charcoal-600 focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="primary" className="flex-1" size="md" onClick={handleConfirm} loading={saving} disabled={verifyCode.length !== 6}>
                {existingSecret ? "Enable with existing entry" : "Verify & Enable"}
              </Button>
              <Button variant="secondary" size="md" onClick={() => setStep("status")}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-100/50 dark:border-charcoal-700 divide-y divide-charcoal-100/50 dark:divide-charcoal-700/50">
            <TwoFactorRow label="Status" description={enabled ? "Account is protected by 2FA" : "No 2FA configured"}>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${enabled ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-charcoal-100 text-charcoal-500 dark:bg-charcoal-700 dark:text-charcoal-400"}`}>
                {enabled ? "Enabled" : "Disabled"}
              </span>
            </TwoFactorRow>
            {enabled && step !== "disable" && (
              <>
                <TwoFactorRow label="Recovery Codes" description={`${recoveryCodeCount} code(s) remaining. Use these if you lose access to your authenticator app.`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{recoveryCodeCount}</span>
                    <Button variant="secondary" size="sm" onClick={() => { fetchRecoveryCodes(); setShowRegenerate(!showRegenerate); }}>Manage</Button>
                  </div>
                </TwoFactorRow>
                {showRegenerate && (
                  <div className="px-4 py-3 bg-charcoal-50 dark:bg-charcoal-700/50 space-y-3">
                    {recoveryCodes.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-charcoal-500 dark:text-charcoal-400">Remaining codes (masked for security):</p>
                        <div className="grid grid-cols-2 gap-1">
                          {recoveryCodes.map((c) => (
                            <span key={c.index} className="text-xs font-mono text-charcoal-600 dark:text-charcoal-300">{c.hint}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input type="password" value={regeneratePassword} onChange={(e) => setRegeneratePassword(e.target.value)}
                        placeholder="Enter password to regenerate" className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-charcoal-600 border border-charcoal-200 dark:border-charcoal-500 text-charcoal-900 dark:text-white placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                      <Button variant="primary" size="sm" onClick={handleRegenerate} loading={saving} disabled={!regeneratePassword}>Regenerate</Button>
                    </div>
                  </div>
                )}
                <TwoFactorRow label="Disable Two-Factor Auth" description="Turn off Google Authenticator protection">
                  <Button variant="danger" size="sm" onClick={() => setStep("disable")}>Disable</Button>
                </TwoFactorRow>
              </>
            )}
            {!enabled && (
              <TwoFactorRow label="Enable Two-Factor Auth" description="Secure your account with Google Authenticator">
                <Button variant="primary" size="sm" onClick={handleEnable} loading={saving}>Enable</Button>
              </TwoFactorRow>
            )}
          </div>
        )}
        {step === "disable" && (
          <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-100/50 dark:border-charcoal-700 p-5 space-y-4 mt-4">
            <p className="text-sm font-medium text-charcoal-700 dark:text-charcoal-300">Confirm to disable 2FA</p>
            <div>
              <label className="block text-xs font-medium text-charcoal-600 dark:text-charcoal-400 mb-1.5">Current Password</label>
              <input type="password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2 text-sm rounded-lg bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-charcoal-900 dark:text-white placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal-600 dark:text-charcoal-400 mb-1.5">Authenticator Code</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                value={disableCode} onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-lg tracking-[0.5em] font-mono px-3 py-2 text-sm rounded-lg bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-charcoal-900 dark:text-white placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="danger" size="sm" onClick={handleDisableConfirm} loading={saving} disabled={!disablePassword || disableCode.length !== 6}>
                Disable 2FA
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { setStep("status"); setDisablePassword(""); setDisableCode(""); }}>Cancel</Button>
            </div>
          </div>
        )}
        <p className="text-xs text-charcoal-400 dark:text-charcoal-500 mt-3 px-1">
          Two-factor authentication uses time-based one-time passwords (TOTP) from apps like Google Authenticator or Authy.
          You will need to enter a code from the app each time you sign in.
        </p>
      </div>
    </div>
  );
}

function TwoFactorRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl hover:bg-charcoal-50 dark:hover:bg-charcoal-700/50 transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-medium text-charcoal-900 dark:text-white">{label}</p>
        {description && <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
