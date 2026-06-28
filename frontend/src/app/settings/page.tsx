"use client";

import { useState, useEffect, type ReactNode } from "react";
import {
  User, ChevronRight, Bell, Shield, Globe, HelpCircle,
  Scale, FileText, LogOut, Moon, ArrowLeft,
  Palette, Languages, ShieldCheck, Key, Link as LinkIcon,
  Camera, Mail, Smartphone, CheckCircle, Smartphone as SmartphoneIcon,
  Download,
} from "lucide-react";
import { DashboardSidebar } from "@/components/layout";
import { Button, Badge, Input } from "@/components/common";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { profileService } from "@/services/profile";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { mediaUrl } from "@/lib/utils";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface NavCategory {
  label: string;
  items: { id: string; icon: ReactNode; label: string; description: string }[];
}

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-4 pt-6 pb-1">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-charcoal-400 dark:text-charcoal-500">{title}</p>
    </div>
  );
}

function PanelHeading({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 dark:from-accent/10 dark:to-charcoal-700 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-display font-bold text-charcoal-900 dark:text-white">{title}</h2>
        {subtitle && <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function PanelRow({ label, description, children, href }: {
  label: string; description?: string; children?: ReactNode; href?: string;
}) {
  const inner = (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl hover:bg-charcoal-50 dark:hover:bg-charcoal-700/50 transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-medium text-charcoal-900 dark:text-white">{label}</p>
        {description && <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

function Divider() {
  return <div className="my-1 border-t border-charcoal-100/50 dark:border-charcoal-700/50" />;
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 dark:focus:ring-offset-charcoal-800",
        checked ? "bg-accent" : "bg-charcoal-200 dark:bg-charcoal-600"
      )}
      aria-label={checked ? "Turn off" : "Turn on"}
      role="switch"
      aria-checked={checked}
    >
      <div className={cn(
        "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white dark:bg-charcoal-100 shadow-soft transition-transform",
        checked && "translate-x-5"
      )} />
    </button>
  );
}

function SettingRow({ icon, label, description, href, toggle, badge, onClick }: {
  icon: ReactNode; label: string; description?: string; href?: string;
  toggle?: ReactNode; badge?: string; onClick?: () => void;
}) {
  const inner = (
    <div className="flex items-center gap-4 px-4 py-3.5 bg-white dark:bg-charcoal-800 hover:bg-charcoal-50 dark:hover:bg-charcoal-700/50 transition-colors cursor-pointer active:scale-[0.99] lg:active:scale-100">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 dark:from-accent/10 dark:to-charcoal-700 flex items-center justify-center shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-charcoal-900 dark:text-white">{label}</p>
          {badge && <Badge variant="success" size="sm">{badge}</Badge>}
        </div>
        {description && <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5 truncate">{description}</p>}
      </div>
      {toggle || <ChevronRight className="w-4 h-4 text-charcoal-300 dark:text-charcoal-600 shrink-0" />}
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  if (onClick) return <button onClick={onClick} className="w-full text-left">{inner}</button>;
  return inner;
}

// ---------------------------------------------------------------------------
// Nav categories
// ---------------------------------------------------------------------------
const navCategories: NavCategory[] = [
  {
    label: "General",
    items: [
      { id: "appearance", icon: <Palette className="w-5 h-5" />, label: "Appearance", description: "Theme & display" },
      { id: "languages", icon: <Languages className="w-5 h-5" />, label: "Languages", description: "App language" },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "profile", icon: <User className="w-5 h-5" />, label: "Profile", description: "Personal info & password" },
      { id: "verification", icon: <Shield className="w-5 h-5" />, label: "Verification", description: "ID & badge status" },
    ],
  },
  {
    label: "Notifications",
    items: [
      { id: "notifications", icon: <Bell className="w-5 h-5" />, label: "Notifications", description: "Push, email & SMS" },
    ],
  },
  {
    label: "Security",
    items: [
      { id: "two-factor", icon: <SmartphoneIcon className="w-5 h-5" />, label: "Two-Factor Auth", description: "Google Authenticator 2FA" },
    ],
  },
  {
    label: "System",
    items: [
      { id: "help", icon: <HelpCircle className="w-5 h-5" />, label: "Help & Support", description: "FAQ & contact" },
      { id: "rules", icon: <Scale className="w-5 h-5" />, label: "Rules & Regulations", description: "Community guidelines" },
      { id: "terms", icon: <FileText className="w-5 h-5" />, label: "Terms & Privacy", description: "Policies" },
    ],
  },
  {
    label: "Advanced",
    items: [
      { id: "integrations", icon: <LinkIcon className="w-5 h-5" />, label: "Integrations", description: "Connected services" },
    ],
  },
];

const allNavItems = navCategories.flatMap((c) => c.items);

// ---------------------------------------------------------------------------
// Content panels
// ---------------------------------------------------------------------------
function AppearanceContent() {
  return (
    <>
      <PanelHeading icon={<Palette className="w-5 h-5 text-accent" />} title="Appearance" subtitle="Customize how the app looks on your device" />
      <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-100/50 dark:border-charcoal-700 divide-y divide-charcoal-100/50 dark:divide-charcoal-700/50">
        <PanelRow label="Dark Mode" description="Switch between light and dark themes">
          <ThemeToggle />
        </PanelRow>
      </div>
    </>
  );
}

function LanguagesContent() {
  return (
    <>
      <PanelHeading icon={<Languages className="w-5 h-5 text-accent" />} title="Languages" subtitle="Select your preferred language" />
      <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-100/50 dark:border-charcoal-700 divide-y divide-charcoal-100/50 dark:divide-charcoal-700/50">
        {["English", "አማርኛ (Amharic)", "العربية (Arabic)", "Afaan Oromoo", "Somali"].map((lang) => (
          <PanelRow key={lang} label={lang}>
            <div className="w-4 h-4 rounded-full border-2 border-charcoal-300 dark:border-charcoal-600 flex items-center justify-center">
              {lang === "English" && <div className="w-2 h-2 rounded-full bg-accent" />}
            </div>
          </PanelRow>
        ))}
      </div>
    </>
  );
}

function ProfileContent() {
  const { user, updateUser } = useAuth();
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const [name, setName] = useState(fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(user?.photos?.[0] || "");
  const initials = fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  useEffect(() => {
    setPhotoUrl(user?.photos?.[0] || "");
  }, [user?.photos]);

  const handlePhotoUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const { data } = await profileService.uploadPhoto(file);
        const newUrl = data.photoUrl || user?.photos?.[0] || "";
        setPhotoUrl(newUrl);
        updateUser({ photos: [...(user?.photos || []), newUrl].filter(Boolean) });
        toast.success("Photo uploaded");
      } catch {
        toast.error("Failed to upload photo");
      }
    };
    input.click();
  };

  const handleSaveName = async () => {
    setSaving(true);
    const parts = name.trim().split(" ");
    try {
      await profileService.createOrUpdate({
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
      });
      updateUser({ firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "" });
      toast.success("Name updated");
    } catch {
      toast.error("Failed to update name");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    setSaving(true);
    try {
      await profileService.createOrUpdate({ email });
      updateUser({ email });
      toast.success("Email updated");
    } catch {
      toast.error("Failed to update email");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    toast.info("Password change will be available soon");
  };

  return (
    <>
      <div className="flex items-center gap-6 p-6 -m-6 mb-6 rounded-t-2xl bg-gradient-to-r from-teal-500/5 via-accent/5 to-transparent dark:from-teal-500/10 dark:via-accent/10 dark:to-transparent border-b border-charcoal-100/50 dark:border-charcoal-700">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-teal-500 p-0.5 shadow-glow">
            {photoUrl ? (
              <img src={mediaUrl(photoUrl)} alt={fullName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-white dark:bg-charcoal-800 flex items-center justify-center">
                <span className="text-2xl font-display font-bold text-accent">{initials}</span>
              </div>
            )}
          </div>
          <button onClick={handlePhotoUpload} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent border-2 border-white dark:border-charcoal-800 flex items-center justify-center hover:bg-accent-dark transition-colors">
            <Camera className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-charcoal-900 dark:text-white">{fullName || "User"}</h2>
          <p className="text-sm text-charcoal-500 dark:text-charcoal-400">{user?.email || "No email"}</p>
          <div className="flex items-center gap-2 mt-1.5">
            {user?.verificationStatus === "verified" ? (
              <Badge variant="success" size="sm">
                <CheckCircle className="w-3 h-3 mr-1" /> Verified
              </Badge>
            ) : (
              <Badge variant="default" size="sm">Unverified</Badge>
            )}
            {user?.isPremium && <Badge variant="gold" size="sm">Premium</Badge>}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Full Name</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-sm text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-charcoal-500 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              placeholder="Your full name"
            />
            <Button variant="primary" size="sm" className="shrink-0" onClick={handleSaveName} loading={saving}>Save</Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Email Address</label>
          <div className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-sm text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-charcoal-500 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              placeholder="your@email.com"
            />
            <Button variant="primary" size="sm" className="shrink-0" onClick={handleSaveEmail} loading={saving}>Save</Button>
          </div>
        </div>

        <Divider />

        <div>
          <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Password</label>
          <div className="flex gap-3">
            <input
              type="password"
              value="********"
              readOnly
              className="flex-1 px-4 py-2.5 rounded-xl bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-sm text-charcoal-900 dark:text-white focus:outline-none cursor-not-allowed opacity-60 dark:opacity-50"
              placeholder="Current password"
            />
            <Button variant="secondary" size="sm" className="shrink-0" onClick={handleChangePassword}>
              <Key className="w-4 h-4 mr-1.5" /> Change
            </Button>
          </div>
          <p className="text-xs text-charcoal-400 dark:text-charcoal-500 mt-1.5">Minimum 8 characters with a number and a letter</p>
        </div>
      </div>
    </>
  );
}

function VerificationContent() {
  const { user } = useAuth();
  const [vStatus, setVStatus] = useState<"loading" | "none" | "pending" | "approved" | "rejected">("loading");
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    api.get("/verification/me").then((r) => {
      const v = r.data.verification;
      setVStatus(v.status || "none");
      setAdminNote(v.adminNote || "");
    }).catch(() => setVStatus("none"));
  }, []);

  const statusLabel = { none: "Not Submitted", pending: "Pending Review", approved: "Approved", rejected: "Rejected", loading: "..." };
  const badgeVariant: Record<string, "default" | "success" | "warning" | "danger"> = { none: "default", pending: "warning", approved: "success", rejected: "danger" };

  return (
    <>
      <PanelHeading icon={<Shield className="w-5 h-5 text-accent" />} title="Verification" subtitle="Verify your identity by uploading your ID and selfie" />
      <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-100/50 dark:border-charcoal-700 divide-y divide-charcoal-100/50 dark:divide-charcoal-700/50">
        <PanelRow label="ID Verification" description="National ID + Selfie upload required">
          <Badge variant={badgeVariant[vStatus]} size="sm">{statusLabel[vStatus]}</Badge>
        </PanelRow>
        {vStatus === "rejected" && adminNote && (
          <PanelRow label="Admin Note" description={adminNote} />
        )}
      </div>
      <div className="mt-5">
        <Link href="/verification">
          <Button variant="primary" size="md">
            <ShieldCheck className="w-4 h-4 mr-2" /> {vStatus === "approved" ? "View Status" : "Go to Verification"}
          </Button>
        </Link>
      </div>
    </>
  );
}

function NotificationsContent() {
  const [pushOn, setPushOn] = useState(true);
  const [emailOn, setEmailOn] = useState(true);
  const [smsOn, setSmsOn] = useState(false);

  return (
    <>
      <PanelHeading icon={<Bell className="w-5 h-5 text-accent" />} title="Notifications" subtitle="Choose which notifications you receive" />
      <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-100/50 dark:border-charcoal-700 divide-y divide-charcoal-100/50 dark:divide-charcoal-700/50">
        <PanelRow label="Push Notifications" description="Receive alerts on your device">
          <ToggleSwitch checked={pushOn} onChange={setPushOn} />
        </PanelRow>
        <PanelRow label="Email Notifications" description="Get notified via email">
          <ToggleSwitch checked={emailOn} onChange={setEmailOn} />
        </PanelRow>
        <PanelRow label="SMS Notifications" description="Receive text message updates">
          <ToggleSwitch checked={smsOn} onChange={setSmsOn} />
        </PanelRow>
      </div>
    </>
  );
}

function HelpContent() {
  return (
    <>
      <PanelHeading icon={<HelpCircle className="w-5 h-5 text-accent" />} title="Help & Support" subtitle="Get help or contact our support team" />
      <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-100/50 dark:border-charcoal-700 divide-y divide-charcoal-100/50 dark:divide-charcoal-700/50">
        {["FAQ", "Contact Support", "Report a Problem", "Safety Tips"].map((item) => (
          <PanelRow key={item} label={item}>
            <ChevronRight className="w-4 h-4 text-charcoal-300 dark:text-charcoal-600" />
          </PanelRow>
        ))}
      </div>
    </>
  );
}

function RulesContent() {
  return (
    <>
      <PanelHeading icon={<Scale className="w-5 h-5 text-accent" />} title="Rules & Regulations" subtitle="Our community guidelines ensure a safe environment" />
      <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-100/50 dark:border-charcoal-700 divide-y divide-charcoal-100/50 dark:divide-charcoal-700/50">
        {["Code of Conduct", "Privacy Guidelines", "Prohibited Behavior", "Reporting Violations"].map((item) => (
          <PanelRow key={item} label={item}>
            <ChevronRight className="w-4 h-4 text-charcoal-300 dark:text-charcoal-600" />
          </PanelRow>
        ))}
      </div>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <PanelHeading icon={<FileText className="w-5 h-5 text-accent" />} title="Terms & Privacy" subtitle="Review our terms of service and privacy policy" />
      <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-100/50 dark:border-charcoal-700 divide-y divide-charcoal-100/50 dark:divide-charcoal-700/50">
        {["Terms of Service", "Privacy Policy", "Cookie Policy", "Data Deletion Request"].map((item) => (
          <PanelRow key={item} label={item}>
            <ChevronRight className="w-4 h-4 text-charcoal-300 dark:text-charcoal-600" />
          </PanelRow>
        ))}
      </div>
    </>
  );
}

function IntegrationsContent() {
  return (
    <>
      <PanelHeading icon={<LinkIcon className="w-5 h-5 text-accent" />} title="Integrations" subtitle="Manage connected services and third-party access" />
      <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-100/50 dark:border-charcoal-700 divide-y divide-charcoal-100/50 dark:divide-charcoal-700/50">
        <PanelRow label="Google Calendar" description="Sync your availability for scheduling">
          <div className="flex items-center gap-3">
            <Badge variant="success" size="sm">Connected</Badge>
            <ToggleSwitch checked={true} onChange={() => {}} />
          </div>
        </PanelRow>
        <PanelRow label="Apple Calendar" description="iCloud calendar integration">
          <div className="flex items-center gap-3">
            <Badge variant="default" size="sm">Not Connected</Badge>
            <Button variant="secondary" size="sm">Connect</Button>
          </div>
        </PanelRow>
        <PanelRow label="Zoom" description="Enable video call scheduling">
          <div className="flex items-center gap-3">
            <Badge variant="success" size="sm">Connected</Badge>
            <ToggleSwitch checked={false} onChange={() => {}} />
          </div>
        </PanelRow>
        <PanelRow label="WhatsApp" description="Receive notifications via WhatsApp">
          <div className="flex items-center gap-3">
            <Badge variant="default" size="sm">Not Connected</Badge>
            <Button variant="secondary" size="sm">Connect</Button>
          </div>
        </PanelRow>
        <PanelRow label="Telegram" description="Bot notifications and updates">
          <div className="flex items-center gap-3">
            <Badge variant="success" size="sm">Connected</Badge>
            <ToggleSwitch checked={true} onChange={() => {}} />
          </div>
        </PanelRow>
      </div>
    </>
  );
}

function TwoFactorContent() {
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
    <>
      <PanelHeading icon={<SmartphoneIcon className="w-5 h-5 text-accent" />} title="Two-Factor Authentication" subtitle="Add an extra layer of security to your account" />

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
              Copy Codes
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
              <SmartphoneIcon className="w-12 h-12 text-accent mx-auto mb-3" />
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
          <PanelRow label="Status" description={enabled ? "Account is protected by 2FA" : "No 2FA configured"}>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${enabled ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-charcoal-100 text-charcoal-500 dark:bg-charcoal-700 dark:text-charcoal-400"}`}>
              {enabled ? "Enabled" : "Disabled"}
            </span>
          </PanelRow>
          {enabled && step !== "disable" && (
            <>
              <PanelRow label="Recovery Codes" description={`${recoveryCodeCount} code(s) remaining. Use these if you lose access to your authenticator app.`}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{recoveryCodeCount}</span>
                  <Button variant="secondary" size="sm" onClick={() => { fetchRecoveryCodes(); setShowRegenerate(!showRegenerate); }}>Manage</Button>
                </div>
              </PanelRow>
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
              <PanelRow label="Disable Two-Factor Auth" description="Turn off Google Authenticator protection">
                <Button variant="danger" size="sm" onClick={() => setStep("disable")}>Disable</Button>
              </PanelRow>
            </>
          )}
          {!enabled && (
            <PanelRow label="Enable Two-Factor Auth" description="Secure your account with Google Authenticator">
              <Button variant="primary" size="sm" onClick={handleEnable} loading={saving}>Enable</Button>
            </PanelRow>
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
    </>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("profile");
  const [mobileSection, setMobileSection] = useState<string | null>(null);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const initials = (fullName || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const contentMap: Record<string, ReactNode> = {
    appearance: <AppearanceContent />,
    languages: <LanguagesContent />,
    profile: <ProfileContent />,
    verification: <VerificationContent />,
    notifications: <NotificationsContent />,
    "two-factor": <TwoFactorContent />,
    help: <HelpContent />,
    rules: <RulesContent />,
    terms: <TermsContent />,
    integrations: <IntegrationsContent />,
  };

  return (
    <>
      {/* Mobile layout */}
      <div className="lg:hidden min-h-screen bg-charcoal-50 dark:bg-charcoal-900">
        <DashboardSidebar />
        <div className="pt-14 pb-20">
          <main className="mx-auto max-w-lg">
            {mobileSection ? (
              /* Mobile panel view */
              <div className="px-4 pb-8 pt-4">
                <button onClick={() => setMobileSection(null)} className="flex items-center gap-1.5 text-sm font-medium text-accent mb-4">
                  <ArrowLeft className="w-4 h-4" /> Back to Settings
                </button>
                <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 p-6">
                  {contentMap[mobileSection]}
                </div>
              </div>
            ) : (
              /* Mobile list view */
              <>
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-accent/10 to-white dark:from-teal-500/20 dark:via-accent/15 dark:to-charcoal-900" />
                  <div className="relative px-5 pt-4 pb-5">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-3">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-teal-500 p-0.5 shadow-glow">
                          {user?.photos?.[0] ? (
                            <img src={mediaUrl(user.photos[0])} alt={fullName} className="w-full h-full rounded-full object-cover" />
                          ) : (
                          <div className="w-full h-full rounded-full bg-white dark:bg-charcoal-800 flex items-center justify-center">
                            <span className="text-2xl font-display font-bold text-accent">{initials}</span>
                          </div>
                          )}
                        </div>
                        {user?.verificationStatus === "verified" && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-green-500 border-2 border-white dark:border-charcoal-800 flex items-center justify-center">
                            <Shield className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <h2 className="text-lg font-display font-bold text-charcoal-900 dark:text-white">{fullName || "User"}</h2>
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-8 space-y-1">
                  <SectionHeader title="Account" />
                  <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 overflow-hidden divide-y divide-charcoal-100/50 dark:divide-charcoal-700/50">
                    <SettingRow icon={<User className="w-5 h-5 text-accent" />} label="User Profile" description="View and edit your personal information" href="/profile" />
                    <div className="mx-4 border-t border-charcoal-100/50 dark:border-charcoal-700/50" />
                    <SettingRow icon={<Shield className="w-5 h-5 text-accent" />} label="Verification" description="ID verification and badge status" href="/verification" />
                    <div className="mx-4 border-t border-charcoal-100/50 dark:border-charcoal-700/50" />
                    <SettingRow icon={<Globe className="w-5 h-5 text-accent" />} label="Languages" description="Choose your preferred language" />
                  </div>
                  <SectionHeader title="Preferences" />
                  <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 overflow-hidden divide-y divide-charcoal-100/50 dark:divide-charcoal-700/50">
                    <SettingRow icon={<Moon className="w-5 h-5 text-accent" />} label="Appearance" description="Toggle dark mode or light mode" toggle={<ThemeToggle />} />
                    <div className="mx-4 border-t border-charcoal-100/50 dark:border-charcoal-700/50" />
                    <SettingRow icon={<Bell className="w-5 h-5 text-accent" />} label="Notifications" description="Manage your notification preferences" toggle={<ToggleSwitch checked={true} onChange={() => {}} />} />
                  </div>
                  <SectionHeader title="Security" />
                  <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 overflow-hidden">
                    <SettingRow icon={<SmartphoneIcon className="w-5 h-5 text-accent" />} label="Two-Factor Auth" description="Google Authenticator 2FA" onClick={() => setMobileSection("two-factor")} />
                  </div>
                  <SectionHeader title="Support" />
                  <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 overflow-hidden divide-y divide-charcoal-100/50 dark:divide-charcoal-700/50">
                    <SettingRow icon={<HelpCircle className="w-5 h-5 text-accent" />} label="Help & Support" description="Get help or contact support" />
                    <div className="mx-4 border-t border-charcoal-100/50 dark:border-charcoal-700/50" />
                    <SettingRow icon={<Scale className="w-5 h-5 text-accent" />} label="Rules & Regulations" description="Community guidelines and rules" />
                    <div className="mx-4 border-t border-charcoal-100/50 dark:border-charcoal-700/50" />
                    <SettingRow icon={<FileText className="w-5 h-5 text-accent" />} label="Terms & Privacy" description="Terms of service and privacy policy" />
                  </div>
                  <div className="pt-6">
                    <Button variant="danger" size="md" className="w-full !rounded-2xl h-12" onClick={() => { logout(); router.push("/"); }}>
                      <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </Button>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:block min-h-screen bg-charcoal-50 dark:bg-charcoal-900">
        <DashboardSidebar />
        <div className="lg:pl-64 pt-14 lg:pt-0">
        <div className="max-w-6xl mx-auto px-8 py-8 flex gap-8">
          {/* Settings Sub-nav */}
          <aside className="w-60 shrink-0">
            {navCategories.map((cat) => (
              <div key={cat.label} className="mb-4">
                <p className="px-4 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-charcoal-400 dark:text-charcoal-500">
                  {cat.label}
                </p>
                <div className="space-y-0.5">
                  {cat.items.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={cn(
                          "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-all",
                          isActive
                            ? "bg-accent/10 text-accent-dark dark:text-accent-light"
                            : "text-charcoal-600 dark:text-charcoal-400 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 hover:text-charcoal-900 dark:hover:text-white"
                        )}
                        aria-current={isActive ? "true" : undefined}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                          isActive
                            ? "bg-accent text-white"
                            : "bg-charcoal-100 dark:bg-charcoal-700 text-charcoal-500 dark:text-charcoal-400"
                        )}>
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate text-charcoal-900 dark:text-white">{item.label}</p>
                          <p className="text-[11px] text-charcoal-400 dark:text-charcoal-500 truncate">{item.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Sign Out */}
            <div className="pt-2">
              <button
                onClick={() => { logout(); router.push("/"); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                  <LogOut className="w-4 h-4 text-red-500" />
                </div>
                <span>Sign Out</span>
              </button>
            </div>
          </aside>

          {/* Right Content Panel */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 p-6">
              {contentMap[activeSection]}
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
