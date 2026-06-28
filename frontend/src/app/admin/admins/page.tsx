"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import {
  Shield, ShieldCheck, ShieldOff, UserPlus, Plus, X, Trash2,
  CheckCircle, XCircle, Mail, Key, Smartphone, Lock, Unlock,
  RefreshCw, Eye, EyeOff, Copy, Check,
} from "lucide-react";

type Step = "details" | "email" | "2fa" | "permissions" | "done";

interface PermissionGroup {
  group: string;
  permissions: string[];
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchAdmins = () => {
    adminService.listAdmins().then(({ data }) => setAdmins(data.admins || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAdmins(); }, []);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage admin accounts, permissions, and roles</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1a2e] dark:bg-white text-white dark:text-[#1a1a2e] text-sm font-medium hover:opacity-90 transition-opacity"
        >{showCreate ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />} {showCreate ? "Cancel" : "New Admin"}</button>
      </div>

      {showCreate && <CreateAdminForm onDone={() => { setShowCreate(false); fetchAdmins(); }} />}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-[#222240] rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-white/5">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Admin</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">2FA</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">Permissions</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase" />
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          a.adminRole === "super_admin" ? "bg-amber-500" : "bg-blue-600"
                        }`}>
                          {a.firstName?.charAt(0)}{a.lastName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{a.firstName} {a.lastName}</p>
                          <p className="text-xs text-gray-400">{a.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        a.adminRole === "super_admin" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}>
                        {a.adminRole === "super_admin" ? "Super Admin" : "Admin"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${a.isActive ? "text-green-600" : "text-red-600"}`}>
                        {a.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {a.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {a.googleAuthSecret
                        ? <Lock className="w-4 h-4 text-green-500 mx-auto" />
                        : <Unlock className="w-4 h-4 text-gray-300 dark:text-gray-600 mx-auto" />
                      }
                    </td>
                    <td className="px-5 py-3 text-center text-sm text-gray-600 dark:text-gray-400">{a._count?.permissions ?? 0}</td>
                    <td className="px-5 py-3 text-right text-xs text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right">
                      {a.adminRole !== "super_admin" && (
                        <button onClick={() => { if (confirm("Delete this admin?")) adminService.deleteAdmin(a.id).then(fetchAdmins); }}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete admin">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {admins.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">No admins found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function CreateAdminForm({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<Step>("details");
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [code, setCode] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [devCode, setDevCode] = useState("");
  const [qrUri, setQrUri] = useState("");
  const [secret, setSecret] = useState("");
  const [permissions, setPermissions] = useState<PermissionGroup[]>([]);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (step === "permissions") {
      adminService.getAvailablePermissions().then(({ data }) => setPermissions(data.groups || [])).catch(() => {});
    }
  }, [step]);

  const nextStep = () => {
    setError("");
    const steps: Step[] = ["details", "email", "2fa", "permissions", "done"];
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  };

  const sendVerification = async () => {
    try {
      setError("");
      const { data } = await adminService.sendAdminVerification(form.email);
      setDevCode(data.devCode || "");
      nextStep();
    } catch (e: any) {
      setError(e.response?.data?.error || "Failed to send code");
    }
  };

  const verifyEmail = async () => {
    try {
      setError("");
      await adminService.verifyAdminEmail(form.email, code);
      nextStep();
    } catch (e: any) {
      setError(e.response?.data?.error || "Invalid code");
    }
  };

  const setup2FA = async () => {
    try {
      setError("");
      const { data } = await adminService.setupAdmin2FA(form.email);
      setQrUri(data.uri);
      setSecret(data.secret);
      nextStep();
    } catch (e: any) {
      setError(e.response?.data?.error || "Failed to setup 2FA");
    }
  };

  const verify2FA = async () => {
    try {
      setError("");
      await adminService.verifyAdmin2FA(form.email, authToken);
      nextStep();
    } catch (e: any) {
      setError(e.response?.data?.error || "Invalid code");
    }
  };

  const createAdmin = async () => {
    try {
      setError("");
      await adminService.createAdmin({ ...form, permissions: selectedPerms });
      nextStep();
    } catch (e: any) {
      setError(e.response?.data?.error || "Failed to create admin");
    }
  };

  const togglePerm = (perm: string) => {
    setSelectedPerms((prev) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]);
  };

  const selectAllInGroup = (perms: string[]) => {
    const allSelected = perms.every((p) => selectedPerms.includes(p));
    if (allSelected) {
      setSelectedPerms((prev) => prev.filter((p) => !perms.includes(p)));
    } else {
      setSelectedPerms((prev) => [...new Set([...prev, ...perms])]);
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
    <div className="mb-6 bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Progress Steps */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm">
          {(["details", "email", "2fa", "permissions", "done"] as Step[]).map((s, i) => {
            const idx = ["details", "email", "2fa", "permissions", "done"].indexOf(step);
            const currentIdx = ["details", "email", "2fa", "permissions", "done"].indexOf(s);
            const isDone = currentIdx < idx;
            const isCurrent = s === step;
            const stepLabels: Record<Step, string> = { details: "Details", email: "Email Verify", "2fa": "2FA Setup", permissions: "Permissions", done: "Done" };
            return (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <div className={`w-6 h-px ${isDone ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`} />}
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  isDone ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                  isCurrent ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                  "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                }`}>
                  {isDone ? <CheckCircle className="w-3 h-3" /> : currentIdx + 1}
                  {stepLabels[s]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-6 py-5">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">{error}</div>
        )}

        {step === "details" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">First Name</label>
              <input value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Last Name</label>
              <input value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button onClick={sendVerification} disabled={!form.email || !form.password || !form.firstName}
                className="px-6 py-2 rounded-xl bg-[#1a1a2e] dark:bg-white text-white dark:text-[#1a1a2e] text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
              >Send Verification Email <Mail className="w-4 h-4 inline ml-1" /></button>
            </div>
          </div>
        )}

        {step === "email" && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Enter the verification code sent to <strong>{form.email}</strong></p>
            {devCode && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-400">DEV MODE: Verification code is <strong className="text-lg">{devCode}</strong></p>
              </div>
            )}
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">6-digit Code</label>
                <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm font-mono text-center text-lg tracking-widest" />
              </div>
              <button onClick={verifyEmail} disabled={code.length !== 6}
                className="px-6 py-2 rounded-xl bg-green-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-green-700 transition-colors"
              >Verify <CheckCircle className="w-4 h-4 inline ml-1" /></button>
            </div>
          </div>
        )}

        {step === "2fa" && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Set up Google Authenticator for <strong>{form.email}</strong></p>
            {!qrUri ? (
              <button onClick={setup2FA}
                className="px-6 py-2 rounded-xl bg-[#1a1a2e] dark:bg-white text-white dark:text-[#1a1a2e] text-sm font-medium hover:opacity-90 transition-opacity"
              >Generate 2FA Secret <Smartphone className="w-4 h-4 inline ml-1" /></button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Secret Key (manual entry):</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 text-sm font-mono text-gray-900 dark:text-white break-all">{secret}</code>
                    <button onClick={copySecret} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-colors">
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {qrUri.startsWith("otpauth://") && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Or use this URI in Google Authenticator:</p>
                    <p className="text-xs text-gray-400 break-all bg-gray-50 dark:bg-white/5 p-3 rounded-lg font-mono">{qrUri}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Enter 6-digit code from Google Authenticator</label>
                  <div className="flex gap-3">
                    <input value={authToken} onChange={(e) => setAuthToken(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm font-mono text-center text-lg tracking-widest" />
                    <button onClick={verify2FA} disabled={authToken.length !== 6}
                      className="px-6 py-2 rounded-xl bg-green-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-green-700 transition-colors"
                    >Verify & Continue</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === "permissions" && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Grant permissions for <strong>{form.email}</strong></p>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {permissions.map((g) => (
                <div key={g.group} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-white/5">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{g.group}</p>
                    <button onClick={() => selectAllInGroup(g.permissions)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >{g.permissions.every((p) => selectedPerms.includes(p)) ? "Deselect All" : "Select All"}</button>
                  </div>
                  <div className="px-4 py-2 space-y-1">
                    {g.permissions.map((p) => (
                      <label key={p} className="flex items-center gap-2.5 py-1 cursor-pointer">
                        <input type="checkbox" checked={selectedPerms.includes(p)} onChange={() => togglePerm(p)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#1a1a2e] focus:ring-[#1a1a2e]/30" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{p.replace(/_/g, " ")}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-gray-500">{selectedPerms.length} permissions selected</p>
              <button onClick={createAdmin}
                className="px-6 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
              >Create Admin <UserPlus className="w-4 h-4 inline ml-1" /></button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Admin Created Successfully!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{form.firstName} {form.lastName} ({form.email}) can now log in with their credentials.</p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-6">
              <Shield className="w-3.5 h-3.5" /> {selectedPerms.length} permissions granted
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <Smartphone className="w-3.5 h-3.5" /> 2FA enabled
            </div>
            <button onClick={onDone}
              className="px-6 py-2 rounded-xl bg-[#1a1a2e] dark:bg-white text-white dark:text-[#1a1a2e] text-sm font-medium hover:opacity-90 transition-opacity"
            >Back to Admin List</button>
          </div>
        )}
      </div>
    </div>
  );
}
