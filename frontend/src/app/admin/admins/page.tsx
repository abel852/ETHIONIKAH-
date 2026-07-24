"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import {
  Shield, ShieldCheck, ShieldOff, UserPlus, Plus, X, Trash2,
  CheckCircle, XCircle, Mail, Key, Smartphone, Lock, Unlock,
  RefreshCw, Eye, EyeOff, Copy, Check, ChevronDown, ArrowRight,
} from "lucide-react";
import { useI18n } from "@/context/I18nContext";

function timeSince(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

type Step = "details" | "email" | "2fa" | "permissions" | "done";

interface PermissionItem {
  key: string;
  label: string;
}

interface PermissionGroup {
  group: string;
  permissions: PermissionItem[];
}

export default function AdminsPage() {
  const { t } = useI18n();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ firstName: string; lastName: string; selectedPerms: string[] }>({ firstName: "", lastName: "", selectedPerms: [] });
  const [permGroups, setPermGroups] = useState<PermissionGroup[]>([]);
  const [editError, setEditError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [delete2FA, setDelete2FA] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchAdmins = () => {
    adminService.listAdmins().then(({ data }) => setAdmins(data.admins || [])).catch(() => {}).finally(() => setLoading(false));
  };

  const startEdit = async (a: any) => {
    setEditingId(a.id);
    setEditError("");
    setEditForm({
      firstName: a.firstName || "",
      lastName: a.lastName || "",
      selectedPerms: (a.permissions || []).map((p: any) => p.permission),
    });
    adminService.getAvailablePermissions().then(({ data }) => setPermGroups(data.groups || [])).catch(() => {});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ firstName: "", lastName: "", selectedPerms: [] });
    setEditError("");
  };

  const saveEdit = async (id: string) => {
    try {
      setEditError("");
      await adminService.updateAdmin(id, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        permissions: editForm.selectedPerms,
      });
      setEditingId(null);
      fetchAdmins();
    } catch (e: any) {
      setEditError(e.response?.data?.error || "Failed to save");
    }
  };

  const toggleEditPerm = (perm: string) => {
    setEditForm((prev) => ({
      ...prev,
      selectedPerms: prev.selectedPerms.includes(perm)
        ? prev.selectedPerms.filter((p) => p !== perm)
        : [...prev.selectedPerms, perm],
    }));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError("");
    setDeleting(true);
    try {
      const data: any = { password: deletePassword };
      if (delete2FA) data.twoFactorCode = delete2FA;
      await adminService.deleteAdmin(deleteTarget.id, data);
      setDeleteTarget(null);
      setDeletePassword("");
      setDelete2FA("");
      fetchAdmins();
    } catch (e: any) {
      setDeleteError(e.response?.data?.error || "Failed to delete admin");
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
    setDeletePassword("");
    setDelete2FA("");
    setDeleteError("");
  };

  useEffect(() => { fetchAdmins(); }, []);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.admins.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-white mt-1">{t('admin.admins.subtitle')}</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1a2e] dark:bg-white text-white dark:text-[#1a1a2e] text-sm font-medium hover:opacity-90 transition-opacity"
        >{showCreate ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />} {showCreate ? "Cancel" : "New Admin"}</button>
      </div>

      {showCreate && <CreateAdminForm onDone={() => { setShowCreate(false); fetchAdmins(); }} />}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 dark:bg-[#222240] rounded-2xl animate-pulse" />)}</div>
      ) : admins.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-white">No admins found</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {admins.map((a) => {
            const isOpen = expandedId === a.id;
            return (
              <div key={a.id}
                className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
                onClick={() => setExpandedId(isOpen ? null : a.id)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                        a.adminRole === "super_admin" ? "bg-amber-500" : "bg-blue-600"
                      }`}>
                        {a.firstName?.charAt(0)}{a.lastName?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{a.firstName} {a.lastName}</p>
                        <p className="text-xs text-gray-500 dark:text-white truncate">{a.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        a.adminRole === "super_admin"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}>
                        {a.adminRole === "super_admin" ? "Super Admin" : "Admin"}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                  </div>

                  {!isOpen && (
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-white">
                      <span>{a.lastLoginAt ? `${timeSince(a.lastLoginAt)} ago` : "Never logged in"}</span>
                      <span>{a.stats30d?.actions ?? 0} actions (30d)</span>
                      <span>{a.stats30d?.usersServed ?? 0} users served</span>
                    </div>
                  )}
                </div>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                    {editingId === a.id ? (
                      <div className="mt-3 space-y-4">
                        {editError && (
                          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-xs text-red-600 dark:text-red-400">{editError}</div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-white mb-1 block">First Name</label>
                            <input value={editForm.firstName} onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-white mb-1 block">Last Name</label>
                            <input value={editForm.lastName} onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" />
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-white mb-2">Permissions</p>
                          <div className="max-h-60 overflow-y-auto space-y-3 rounded-xl bg-gray-50 dark:bg-white/5 p-3 border border-gray-200 dark:border-gray-700">
                            {permGroups.map((g) => (
                              <div key={g.group}>
                                <p className="text-xs font-semibold text-gray-700 dark:text-white uppercase tracking-wider mb-1">{g.group}</p>
                                <div className="space-y-1 pl-1">
                                  {g.permissions.map((p) => (
                                    <label key={p.key} className="flex items-center gap-2 py-0.5 cursor-pointer">
                                      <input type="checkbox" checked={editForm.selectedPerms.includes(p.key)} onChange={() => toggleEditPerm(p.key)}
                                        className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-[#1a1a2e] focus:ring-[#1a1a2e]/30" />
                                      <span className="text-xs text-gray-600 dark:text-white">{p.label}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-gray-500 dark:text-white mt-1">{editForm.selectedPerms.length} permissions selected</p>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <button onClick={cancelEdit}
                            className="px-4 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white text-xs font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">Cancel</button>
                          <button onClick={() => saveEdit(a.id)}
                            className="px-4 py-1.5 rounded-lg bg-[#1a1a2e] dark:bg-white text-white dark:text-[#1a1a2e] text-xs font-medium hover:opacity-90 transition-opacity">Save Changes</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                            <p className="text-[10px] font-medium text-gray-500 dark:text-white uppercase tracking-wider">Last Login</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                              {a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Never"}
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                            <p className="text-[10px] font-medium text-gray-500 dark:text-white uppercase tracking-wider">Created</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                            <p className="text-[10px] font-medium text-gray-500 dark:text-white uppercase tracking-wider">Actions (30d)</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{a.stats30d?.actions ?? a._count?.auditLogs ?? 0}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                            <p className="text-[10px] font-medium text-gray-500 dark:text-white uppercase tracking-wider">Users Served (30d)</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{a.stats30d?.usersServed ?? 0}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-white">
                            <span className="flex items-center gap-1">
                              <Shield className="w-3.5 h-3.5" /> {a._count?.permissions ?? 0} permissions
                            </span>
                            <span className="flex items-center gap-1">
                              {a.googleAuthSecret ? <Lock className="w-3.5 h-3.5 text-green-500" /> : <Unlock className="w-3.5 h-3.5" />}
                              {a.googleAuthSecret ? "2FA enabled" : "2FA off"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {a.adminRole !== "super_admin" && (
                              <>
                                <button onClick={() => startEdit(a)}
                                  className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                                  Edit Permissions
                                </button>
                                <button onClick={() => setDeleteTarget(a)}
                                  className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={cancelDelete}>
          <div className="bg-white dark:bg-[#222240] rounded-2xl p-6 w-full max-w-md shadow-elevated border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Delete Admin Permanently</h3>
                <p className="text-sm text-gray-500 dark:text-white">This action cannot be undone</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 mb-4">
              <p className="text-sm text-red-700 dark:text-red-400">
                You are about to delete <strong>{deleteTarget.firstName} {deleteTarget.lastName}</strong> ({deleteTarget.email}). All their data, permissions, and audit history will be removed.
              </p>
            </div>

            {deleteError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">{deleteError}</div>
            )}

            <div className="mb-3">
              <label className="text-xs font-medium text-gray-500 dark:text-white mb-1 block">Enter your super admin password to confirm</label>
              <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" />
            </div>

            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 dark:text-white mb-1 block">2FA code (if enabled)</label>
              <input value={delete2FA} onChange={(e) => setDelete2FA(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6}
                placeholder="Leave blank if 2FA is off"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" />
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-white bg-gray-100 dark:bg-white/10 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting || !deletePassword}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors">
                {deleting ? "Deleting..." : "Yes, Delete Permanently"}
              </button>
            </div>
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
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [permissions, setPermissions] = useState<PermissionGroup[]>([]);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (step === "permissions") {
      adminService.getAvailablePermissions().then(({ data }) => {
        const groups = data.groups || [];
        setPermissions(groups);
        setSelectedPerms(groups.flatMap((g: PermissionGroup) => g.permissions.map((p) => p.key)));
      }).catch(() => {});
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
      setQrCode(data.qrCode || "");
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

  const selectAllInGroup = (perms: { key: string; label: string }[]) => {
    const allSelected = perms.every((p) => selectedPerms.includes(p.key));
    if (allSelected) {
      setSelectedPerms((prev) => prev.filter((p) => !perms.some((perm) => perm.key === p)));
    } else {
      setSelectedPerms((prev) => [...new Set([...prev, ...perms.map((p) => p.key)])]);
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
              <label className="text-xs font-medium text-gray-500 dark:text-white mb-1 block">First Name</label>
              <input value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-white mb-1 block">Last Name</label>
              <input value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-white mb-1 block">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value.replace(/[^a-zA-Z0-9@.]/g, "")})}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-white mb-1 block">Password</label>
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
            <p className="text-sm text-gray-600 dark:text-white mb-4">Enter the verification code sent to <strong>{form.email}</strong></p>
            {devCode && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-400">DEV MODE: Verification code is <strong className="text-lg">{devCode}</strong></p>
              </div>
            )}
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-500 dark:text-white mb-1 block">6-digit Code</label>
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
            <p className="text-sm text-gray-600 dark:text-white mb-4">Set up Google Authenticator for <strong>{form.email}</strong></p>
            <div className="mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-400">2FA is optional during creation. The admin can set it up themselves later from their security settings.</p>
            </div>
            {!qrUri ? (
              <div className="flex gap-3">
                <button onClick={setup2FA}
                  className="px-6 py-2 rounded-xl bg-[#1a1a2e] dark:bg-white text-white dark:text-[#1a1a2e] text-sm font-medium hover:opacity-90 transition-opacity"
                >Generate 2FA Secret <Smartphone className="w-4 h-4 inline ml-1" /></button>
                <button onClick={nextStep}
                  className="px-6 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                >Skip 2FA <ArrowRight className="w-4 h-4 inline ml-1" /></button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-white mb-2">Secret Key (manual entry):</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 text-sm font-mono text-gray-900 dark:text-white break-all">{secret}</code>
                    <button onClick={copySecret} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-colors">
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {qrCode ? (
                  <div className="flex justify-center">
                    <img src={qrCode} alt="Google Authenticator QR Code" className="w-48 h-48" />
                  </div>
                ) : qrUri.startsWith("otpauth://") && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-white mb-2">Or use this URI in Google Authenticator:</p>
                    <p className="text-xs text-gray-500 dark:text-white break-all bg-gray-50 dark:bg-white/5 p-3 rounded-lg font-mono">{qrUri}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-white mb-1 block">Enter 6-digit code from Google Authenticator</label>
                  <div className="flex gap-3">
                    <input value={authToken} onChange={(e) => setAuthToken(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white text-sm font-mono text-center text-lg tracking-widest" />
                    <button onClick={verify2FA} disabled={authToken.length !== 6}
                      className="px-6 py-2 rounded-xl bg-green-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-green-700 transition-colors"
                    >Verify & Continue</button>
                  </div>
                  <button onClick={nextStep} className="mt-3 text-xs text-gray-400 dark:text-white hover:text-gray-600 dark:hover:text-white transition-colors">
                    Skip 2FA for now →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === "permissions" && (
          <div>
            <p className="text-sm text-gray-600 dark:text-white mb-4">Grant permissions for <strong>{form.email}</strong></p>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {permissions.map((g) => (
                <div key={g.group} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-white/5">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{g.group}</p>
                    <button onClick={() => selectAllInGroup(g.permissions)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >{g.permissions.every((p) => selectedPerms.includes(p.key)) ? "Deselect All" : "Select All"}</button>
                  </div>
                  <div className="px-4 py-2 space-y-1">
                    {g.permissions.map((p) => (
                      <label key={p.key} className="flex items-center gap-2.5 py-1 cursor-pointer">
                        <input type="checkbox" checked={selectedPerms.includes(p.key)} onChange={() => togglePerm(p.key)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#1a1a2e] focus:ring-[#1a1a2e]/30" />
                        <span className="text-sm text-gray-700 dark:text-white">{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-white">{selectedPerms.length} permissions selected</p>
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
            <p className="text-sm text-gray-500 dark:text-white mb-4">{form.firstName} {form.lastName} ({form.email}) can now log in with their credentials.</p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-white mb-6">
              <Shield className="w-3.5 h-3.5" /> {selectedPerms.length} permissions granted
              <span className="text-gray-300 dark:text-gray-500">·</span>
              {qrUri ? <><Smartphone className="w-3.5 h-3.5" /> 2FA enabled</> : <><Smartphone className="w-3.5 h-3.5" /> 2FA not set up</>}
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
