"use client";

import { useState, useEffect, type ReactNode } from "react";
import {
  ChevronRight, Bell, Shield, Globe, HelpCircle,
  Scale, FileText, LogOut, ArrowLeft,
  Languages, ShieldCheck,
  Mail, Smartphone, CheckCircle, Smartphone as SmartphoneIcon,
  Download, Heart, Crown, Send, AlertTriangle, ShieldAlert,
  MessageSquare, Trash2, Lock, BookOpen,
} from "lucide-react";
import { Button, Badge, Input, Textarea } from "@/components/common";
import { useAuth } from "@/context/AuthContext";
import { useI18n, type Lang } from "@/context/I18nContext";
import { complaintService } from "@/services/complaint";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { mediaUrl, getInitials } from "@/lib/utils";
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
  const { t } = useI18n();
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 dark:focus:ring-offset-charcoal-800",
        checked ? "bg-accent" : "bg-charcoal-200 dark:bg-charcoal-600"
      )}
      aria-label={checked ? t("settings.turnOff") : t("settings.turnOn")}
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
// Content panels
// ---------------------------------------------------------------------------
function LanguagesContent() {
  const { lang, setLang, t } = useI18n();
  const languageOptions: { code: Lang; label: string }[] = [
    { code: "en", label: t("lang.english") },
    { code: "am", label: t("lang.amharic") },
    { code: "ar", label: t("lang.arabic") },
    { code: "om", label: t("lang.oromo") },
  ];

  return (
    <>
      <PanelHeading icon={<Languages className="w-5 h-5 text-accent" />} title={t("settings.languages")} subtitle={t("settings.selectLanguage")} />
      <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-100/50 dark:border-charcoal-700 divide-y divide-charcoal-100/50 dark:divide-charcoal-700/50">
        {languageOptions.map(({ code, label }) => (
          <button key={code} type="button" className="w-full text-left" onClick={() => setLang(code)}>
            <PanelRow label={label}>
              <div className="w-4 h-4 rounded-full border-2 border-charcoal-300 dark:border-charcoal-600 flex items-center justify-center">
                {lang === code && <div className="w-2 h-2 rounded-full bg-accent" />}
              </div>
            </PanelRow>
          </button>
        ))}
      </div>
    </>
  );
}

function VerificationContent() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [vStatus, setVStatus] = useState<"loading" | "none" | "pending" | "approved" | "rejected">("loading");
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    api.get("/verification/me").then((r) => {
      const v = r.data.verification;
      setVStatus(v.status || "none");
      setAdminNote(v.adminNote || "");
    }).catch(() => setVStatus("none"));
  }, []);

  const statusLabel = { none: t("settings.notSubmitted"), pending: t("settings.pendingReview"), approved: t("settings.approved"), rejected: t("settings.rejected"), loading: "..." };
  const badgeVariant: Record<string, "default" | "success" | "warning" | "danger"> = { none: "default", pending: "warning", approved: "success", rejected: "danger" };

  return (
    <>
      <PanelHeading icon={<Shield className="w-5 h-5 text-accent" />} title={t("settings.verification")} subtitle={t("settings.verifyIdentity")} />
      <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-100/50 dark:border-charcoal-700 divide-y divide-charcoal-100/50 dark:divide-charcoal-700/50">
        <PanelRow label={t("settings.idVerification")} description={t("settings.idVerificationDesc")}>
          <Badge variant={badgeVariant[vStatus]} size="sm">{statusLabel[vStatus]}</Badge>
        </PanelRow>
        {vStatus === "rejected" && adminNote && (
          <PanelRow label={t("settings.adminNote")} description={adminNote} />
        )}
      </div>
      <div className="mt-5">
        <Link href="/verification">
          <Button variant="primary" size="md">
            <ShieldCheck className="w-4 h-4 mr-2" /> {vStatus === "approved" ? t("settings.viewStatus") : t("settings.goToVerification")}
          </Button>
        </Link>
      </div>
    </>
  );
}

function NotificationsContent() {
  const { t } = useI18n();
  const [pushOn, setPushOn] = useState(true);
  const [emailOn, setEmailOn] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/users/preferences").then(({ data }) => {
      setEmailOn(data.emailNotifications !== false);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleEmailToggle = async (v: boolean) => {
    setEmailOn(v);
    try {
      await api.patch("/users/preferences", { emailNotifications: v });
      toast.success(v
        ? "Email notifications enabled. You will receive emails for matches, messages, and system updates."
        : "Email notifications disabled. You will only receive emails for OTP and password reset. No other emails will be sent."
      );
    } catch {
      setEmailOn(!v);
      toast.error("Failed to update email notification preference.");
    }
  };

  return (
    <>
      <PanelHeading icon={<Bell className="w-5 h-5 text-accent" />} title={t("settings.notifications")} subtitle={t("settings.chooseNotifications")} />
      <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-100/50 dark:border-charcoal-700 divide-y divide-charcoal-100/50 dark:divide-charcoal-700/50">
        <PanelRow label={t("settings.pushNotifications")} description={t("settings.pushNotificationsDesc")}>
          <ToggleSwitch checked={pushOn} onChange={setPushOn} />
        </PanelRow>
        <PanelRow label={t("settings.emailNotifications")} description={t("settings.emailNotificationsDesc")}>
          <ToggleSwitch checked={emailOn} onChange={handleEmailToggle} />
        </PanelRow>
      </div>
    </>
  );
}

function CollapsibleDoc({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-100/50 dark:border-charcoal-700 overflow-hidden mb-4">
      <button onClick={() => setOpen(!open)} className="w-full px-4 py-3.5 flex items-center justify-between text-left">
        <span className="text-sm font-semibold text-charcoal-900 dark:text-white">{title}</span>
        <ChevronRight className={cn("w-4 h-4 text-charcoal-400 transition-transform", open && "rotate-90")} />
      </button>
      {open && <div className="px-4 pb-4 text-sm text-charcoal-600 dark:text-charcoal-300 leading-relaxed border-t border-charcoal-100/50 dark:border-charcoal-700/50 pt-4">{children}</div>}
    </div>
  );
}

function HelpContent() {
  const { t } = useI18n();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const sendToAdmin = async () => {
    if (!subject.trim() || !message.trim()) return toast.error("Please fill in both subject and message.");
    setLoading(true);
    try {
      await complaintService.createComplaint({ subject: subject.trim(), description: message.trim() });
      toast.success("Your message has been sent to the support team.");
      setSubject("");
      setMessage("");
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PanelHeading icon={<HelpCircle className="w-5 h-5 text-accent" />} title={t("settings.help")} subtitle={t("settings.helpDesc")} />

      <CollapsibleDoc title={t("settings.faq")}>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>How do I verify my profile?</strong> Go to the Verification section and upload your national ID plus a selfie.</li>
          <li><strong>Can I change my spouse preferences?</strong> Yes — visit Preferences in your profile settings at any time.</li>
          <li><strong>Why was my photo rejected?</strong> Photos must clearly show your face, be decent, and not contain contact information.</li>
          <li><strong>How do I report a user?</strong> Use the report button on any profile or message thread.</li>
          <li><strong>What happens if I delete my account?</strong> Your account enters a 30-day grace period. You can contact support to restore it during that window. After 30 days it is permanently erased.</li>
        </ul>
      </CollapsibleDoc>

      <CollapsibleDoc title={t("settings.contactSupport")}>
        <p className="mb-3">Our support team typically replies within 24-48 hours on business days.</p>
        <div className="space-y-3">
          <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <Textarea placeholder="Describe your issue or question..." rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
          <Button onClick={sendToAdmin} loading={loading} className="w-full">
            <Send className="w-4 h-4 mr-2" /> Send to Support
          </Button>
        </div>
      </CollapsibleDoc>

      <CollapsibleDoc title={t("settings.reportProblem")}>
        <p className="mb-3">Found a bug or inappropriate behavior? Please describe it in detail using the contact form above or report a user directly from their profile.</p>
        <div className="bg-amber-50 dark:bg-amber-500/10 rounded-lg p-3 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          For urgent safety concerns, mention "URGENT" in the subject line.
        </div>
      </CollapsibleDoc>

      <CollapsibleDoc title={t("settings.safetyTips")}>
        <ul className="list-disc pl-5 space-y-2">
          <li>Keep initial conversations inside the app until you feel comfortable.</li>
          <li>Never send money or share banking details with matches.</li>
          <li>Meet in public places and involve your wali or guardian.</li>
          <li>Trust your instincts — report anyone who pressures you.</li>
        </ul>
      </CollapsibleDoc>
    </>
  );
}

function UserManualContent() {
  const { t } = useI18n();
  return (
    <>
      <PanelHeading icon={<BookOpen className="w-5 h-5 text-accent" />} title={t("settings.userManual")} subtitle={t("settings.userManualDesc")} />

      <CollapsibleDoc title={t("manual.gettingStarted")}>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Create your account</strong> — Sign up with your email and complete your profile with accurate personal information.</li>
          <li><strong>Verify your identity</strong> — Go to Settings → Verification and upload your national ID plus a selfie to get the verified badge.</li>
          <li><strong>Set spouse preferences</strong> — Visit the Preferences page to define age range, location, education, and other criteria.</li>
          <li><strong>Complete your profile</strong> — Add photos, bio, education, occupation, and health info (optional & confidential) to increase match quality.</li>
        </ul>
      </CollapsibleDoc>

      <CollapsibleDoc title={t("manual.discoveringMatches")}>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Discover</strong> — Browse recommended profiles on the Discover page, filtered by your preferences.</li>
          <li><strong>Search</strong> — Use the Search page to find members by name, location, or other criteria.</li>
          <li><strong>Favorites</strong> — Save profiles you like to your Favorites for quick access later.</li>
          <li><strong>Liked Interest</strong> — Express interest in a profile. If they accept, a conversation request is sent.</li>
        </ul>
      </CollapsibleDoc>

      <CollapsibleDoc title={t("manual.messaging")}>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Conversation requests</strong> — Before messaging, you must send a conversation request. The other person must accept.</li>
          <li><strong>Exclusive Partnership</strong> — Once you and a match agree, one of you can request an exclusive partnership from the chat menu (3-dot icon).</li>
          <li><strong>Wali involvement</strong> — You can invite a wali (guardian) to your conversation from the chat menu. The wali receives an email invitation.</li>
          <li><strong>Media sharing</strong> — Send photos and files in chats. All media is encrypted and stored securely.</li>
        </ul>
      </CollapsibleDoc>

      <CollapsibleDoc title={t("manual.marriageSuccess")}>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>We're Married</strong> — When you and your partner decide to marry, open the chat 3-dot menu and select "We're Getting Married".</li>
          <li><strong>Partner confirmation</strong> — Your partner must confirm the marriage request from their chat.</li>
          <li><strong>Upload photos</strong> — After confirmation, upload wedding, engagement, and ring photos plus an optional marriage certificate and success story.</li>
          <li><strong>Admin review</strong> — An admin reviews your submission. Once approved, both accounts are marked as married.</li>
          <li><strong>Congratulations page</strong> — After approval, visit the Congratulations page to view your photos and manage your account.</li>
        </ul>
      </CollapsibleDoc>

      <CollapsibleDoc title={t("manual.accountManagement")}>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Archive account</strong> — On the Congratulations page, you can archive your account. This hides your profile and disables matching, but keeps your data.</li>
          <li><strong>Permanent deletion</strong> — For permanent deletion, verify your password, then enter the 6-digit OTP sent to your phone. This action is irreversible.</li>
          <li><strong>Standard deletion</strong> — From Settings → Terms & Privacy, you can request account deletion with a 30-day grace period for recovery.</li>
        </ul>
      </CollapsibleDoc>

      <CollapsibleDoc title={t("manual.privacySafety")}>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Profile visibility</strong> — Only verified members can see your full profile. Unverified users see limited information.</li>
          <li><strong>Block & report</strong> — Block or report any user from their profile or chat. Reports are reviewed by admins within 24-48 hours.</li>
          <li><strong>Two-Factor Authentication</strong> — Enable 2FA in Settings → Security for an extra layer of account protection.</li>
          <li><strong>Never share</strong> — Do not share passwords, banking details, or sensitive personal information with matches.</li>
        </ul>
      </CollapsibleDoc>

      <CollapsibleDoc title={t("manual.membership")}>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Free tier</strong> — Browse profiles, send conversation requests, and message accepted matches.</li>
          <li><strong>Gold membership</strong> — Unlimited likes, advanced search filters, read receipts, and priority support.</li>
          <li><strong>Platinum membership</strong> — All Gold features plus profile boosts, see who liked you, and verified badge priority.</li>
          <li><strong>Manage subscription</strong> — Visit the Membership page to upgrade, view plans, or cancel.</li>
        </ul>
      </CollapsibleDoc>
    </>
  );
}

function RulesContent() {
  const { t } = useI18n();
  return (
    <>
      <PanelHeading icon={<Scale className="w-5 h-5 text-accent" />} title={t("settings.rules")} subtitle={t("settings.rulesDesc")} />

      <CollapsibleDoc title={t("settings.codeOfConduct")}>
        <ul className="list-disc pl-5 space-y-2">
          <li>Treat all members with respect, kindness, and Islamic adab.</li>
          <li>Be honest about your age, marital status, location, and intentions.</li>
          <li>Keep conversations decent and marriage-focused.</li>
          <li>Do not share another member&apos;s private information.</li>
        </ul>
      </CollapsibleDoc>

      <CollapsibleDoc title={t("settings.privacyGuidelines")}>
        <ul className="list-disc pl-5 space-y-2">
          <li>Only upload photos you own and that clearly represent you.</li>
          <li>Do not post phone numbers, emails, or social handles in public photos or bio.</li>
          <li>We never sell your data to third parties.</li>
          <li>You can request data deletion at any time from Terms &amp; Privacy.</li>
        </ul>
      </CollapsibleDoc>

      <CollapsibleDoc title={t("settings.prohibitedBehavior")}>
        <ul className="list-disc pl-5 space-y-2">
          <li>Hate speech, harassment, threats, or discrimination of any kind.</li>
          <li>Solicitation, commercial promotion, or scam attempts.</li>
          <li>Fake profiles, impersonation, or misleading information.</li>
          <li>Sexual content, nudity, or indecent language.</li>
          <li>Encouraging users to leave the platform for unsafe external chat.</li>
        </ul>
      </CollapsibleDoc>

      <CollapsibleDoc title={t("settings.reportingViolations")}>
        <p className="mb-3">If you see a violation, tap the report icon on a profile or message. Admins review reports within 24-48 hours and may suspend accounts that break the rules.</p>
        <div className="bg-red-50 dark:bg-red-500/10 rounded-lg p-3 text-red-700 dark:text-red-400 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          Repeated violations may result in permanent suspension without refund.
        </div>
      </CollapsibleDoc>
    </>
  );
}

function TermsContent() {
  const { t } = useI18n();
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm" | "final">("idle");
  const [loading, setLoading] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete("/auth/me");
      toast.success("Your account has been scheduled for deletion. It can be restored within 30 days by contacting support.");
      logout();
      router.push("/");
    } catch {
      toast.error("Failed to delete account. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PanelHeading icon={<FileText className="w-5 h-5 text-accent" />} title={t("settings.terms")} subtitle={t("settings.termsDesc")} />

      <CollapsibleDoc title={t("settings.termsOfService")}>
        <div className="space-y-3">
          <p>By using this platform, you agree to use it solely for the purpose of finding a righteous spouse in a manner consistent with Islamic principles.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>You must be at least 18 years old.</li>
            <li>Account information must be truthful and kept up to date.</li>
            <li>Premium memberships are non-refundable unless required by law.</li>
            <li>We reserve the right to suspend accounts that violate these terms.</li>
          </ul>
        </div>
      </CollapsibleDoc>

      <CollapsibleDoc title={t("settings.privacyPolicy")}>
        <div className="space-y-3">
          <p>We collect only the information needed to provide matchmaking services safely:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Profile data you provide (name, gender, date of birth, preferences).</li>
            <li>Verification documents to confirm identity and age.</li>
            <li>Payment information for premium memberships.</li>
          </ul>
          <p>Your data is encrypted in transit and at rest. We do not sell personal data to advertisers.</p>
        </div>
      </CollapsibleDoc>

      <CollapsibleDoc title={t("settings.cookiePolicy")}>
        <p>We use essential cookies to keep you logged in and remember your language/theme preferences. We do not use tracking cookies for advertising. By continuing to use the app, you consent to essential cookies.</p>
      </CollapsibleDoc>

      <CollapsibleDoc title={t("settings.dataDeletion")}>
        <div className="space-y-4">
          <p>You can request deletion of your account and personal data below. Here is what happens:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Your profile is hidden immediately and you will be logged out.</li>
            <li>Your account enters a 30-day grace period in the admin recycle bin.</li>
            <li>During the grace period you can contact support to restore your account.</li>
            <li>After 30 days all personal data is permanently erased and cannot be recovered.</li>
          </ul>

          {deleteStep === "idle" && (
            <Button variant="danger" className="w-full" onClick={() => setDeleteStep("confirm")}>
              <Trash2 className="w-4 h-4 mr-2" /> Request Account Deletion
            </Button>
          )}

          {deleteStep === "confirm" && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-300 text-sm">This action is not undoable</p>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-1">If you delete your account, you will not be able to get it back after 30 days. Your photos, messages, matches, and preferences will be permanently erased.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setDeleteStep("idle")}>Cancel</Button>
                <Button variant="danger" className="flex-1" onClick={() => setDeleteStep("final")}>I understand, continue</Button>
              </div>
            </div>
          )}

          {deleteStep === "final" && (
            <div className="bg-charcoal-900 dark:bg-black text-white rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-red-400" />
                <h3 className="font-display font-bold text-sm">Final confirmation</h3>
              </div>
              <p className="text-sm text-charcoal-200">Type <strong>DELETE</strong> below to confirm you understand this is irreversible after 30 days.</p>
              <Input placeholder="Type DELETE to confirm" className="bg-white/10 border-white/20 text-white placeholder:text-white/50" />
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setDeleteStep("idle")}>Cancel</Button>
                <Button variant="danger" className="flex-1" loading={loading} onClick={handleDelete}>Permanently delete my account</Button>
              </div>
            </div>
          )}
        </div>
      </CollapsibleDoc>
    </>
  );
}

function TwoFactorContent() {
  const { t } = useI18n();
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
  const [show2faSuccess, setShow2faSuccess] = useState(false);
  const [show2faError, setShow2faError] = useState(false);

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
      toast.error(err?.response?.data?.error || t("settings.twoFactorSetupFailed"));
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
      setShow2faSuccess(true);
      setTimeout(() => setShow2faSuccess(false), 2500);
    } catch (err: any) {
      setShow2faError(true);
      setTimeout(() => setShow2faError(false), 2500);
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
      toast.success(t("settings.twoFactorDisabled"));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t("settings.twoFactorDisableFailed"));
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
      toast.success(t("settings.recoveryRegenerated"));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t("settings.regenerateFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PanelHeading icon={<SmartphoneIcon className="w-5 h-5 text-accent" />} title={t("settings.twoFactor")} subtitle={t("settings.twoFactorDesc")} />

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      ) : showBackupCodes && backupCodes.length > 0 ? (
        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-100/50 dark:border-charcoal-700 p-4 sm:p-6 space-y-4">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-charcoal-900 dark:text-white">{t("settings.recoveryCodes")}</p>
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">{t("settings.recoveryCodesDesc")}</p>
          </div>
          <div className="bg-charcoal-50 dark:bg-charcoal-700 rounded-xl p-3 sm:p-4 space-y-1.5">
            {backupCodes.map((code, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-white dark:bg-charcoal-600 rounded-lg">
                <span className="text-sm font-mono font-bold text-charcoal-900 dark:text-white tracking-wider">{code}</span>
                <span className="text-[10px] text-charcoal-400 dark:text-charcoal-500 uppercase">{t("settings.codeN", { n: i + 1 })}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="primary" size="sm" className="flex-1 w-full" onClick={() => { navigator.clipboard.writeText(backupCodes.join("\n")); toast.success(t("settings.codesCopied")); }}>
              {t("settings.copyCodes")}
            </Button>
            <Button variant="secondary" size="sm" className="w-full sm:w-auto" onClick={() => { const blob = new Blob([backupCodes.join("\n")], {type: "text/plain"}); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "ethio-nikah-backup-codes.txt"; a.click(); toast.success(t("settings.codesDownloaded")); }}>
              <Download className="w-4 h-4 mr-1" /> {t("settings.download")}
            </Button>
            <Button variant="secondary" size="sm" className="w-full sm:w-auto" onClick={() => setShowBackupCodes(false)}>
              {t("settings.iveSavedThem")}
            </Button>
          </div>
        </div>
      ) : step === "setup" ? (
        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-100/50 dark:border-charcoal-700 p-4 sm:p-6 space-y-5">
          {existingSecret ? (
            <div className="text-center">
              <SmartphoneIcon className="w-12 h-12 text-accent mx-auto mb-3" />
              <p className="text-sm font-medium text-charcoal-700 dark:text-charcoal-300">{t("settings.existingEntry")}</p>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">{t("settings.existingEntryDesc")}</p>
              {showForceInput ? (
                <div className="flex flex-col sm:flex-row items-center gap-2 mt-3">
                  <input type="password" value={forcePassword} onChange={(e) => setForcePassword(e.target.value)}
                    placeholder={t("settings.enterPassword")} className="w-full sm:flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-charcoal-900 dark:text-white placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button type="button" onClick={async () => { if (!forcePassword) return; setSaving(true); try { const { data } = await api.post("/auth/2fa/enable", { force: true, password: forcePassword }); setSecret(data.secret); setQrCode(data.qrCode); setExistingSecret(false); setShowForceInput(false); setForcePassword(""); } catch (e: any) { toast.error(e?.response?.data?.error || t("settings.genericFailed")); } finally { setSaving(false); } }}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-dark flex-1 sm:flex-none">{t("settings.confirm")}</button>
                    <button type="button" onClick={() => { setShowForceInput(false); setForcePassword(""); }} className="text-xs text-charcoal-400 hover:text-charcoal-600 px-2">{t("common.cancel")}</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setShowForceInput(true)}
                  className="text-xs text-accent hover:text-accent-dark mt-2 underline underline-offset-2"
                >{t("settings.generateNewKey")}</button>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-3">{t("settings.scanQR")}</p>
              {qrCode && <img src={qrCode} alt="QR Code" className="mx-auto w-40 h-40 sm:w-48 sm:h-48 rounded-lg border border-charcoal-200 dark:border-charcoal-600" />}
            </div>
          )}
          {!existingSecret && (
            <div className="bg-charcoal-50 dark:bg-charcoal-700 rounded-lg p-3 text-center">
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-1">{t("settings.manualKey")}</p>
              <p className="text-xs sm:text-sm font-mono font-bold text-charcoal-900 dark:text-white tracking-wider select-all break-all">{secret}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">{t("settings.enterCode")}</label>
            <input
              type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
              value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder={t("settings.codePlaceholder")}
              className="w-full text-center text-xl tracking-[0.5em] font-mono px-4 py-2.5 rounded-xl bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-charcoal-900 dark:text-white placeholder-charcoal-300 dark:placeholder-charcoal-600 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="primary" className="flex-1 w-full sm:w-auto" size="md" onClick={handleConfirm} loading={saving} disabled={verifyCode.length !== 6}>
              {existingSecret ? t("settings.enableWithExisting") : t("settings.verifyAndEnable")}
            </Button>
            <Button variant="secondary" size="md" className="w-full sm:w-auto" onClick={() => setStep("status")}>{t("common.cancel")}</Button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-100/50 dark:border-charcoal-700 divide-y divide-charcoal-100/50 dark:divide-charcoal-700/50">
          <PanelRow label={t("settings.status")} description={enabled ? t("settings.protectedBy2FA") : t("settings.no2FA")}>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${enabled ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-charcoal-100 text-charcoal-500 dark:bg-charcoal-700 dark:text-charcoal-400"}`}>
              {enabled ? t("profile.enabled") : t("profile.disabled")}
            </span>
          </PanelRow>
          {enabled && step !== "disable" && (
            <>
              <PanelRow label={t("settings.recoveryCodes")} description={t("settings.recoveryCodesRemaining", { count: recoveryCodeCount })}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{recoveryCodeCount}</span>
                  <Button variant="secondary" size="sm" onClick={() => { fetchRecoveryCodes(); setShowRegenerate(!showRegenerate); }}>{t("settings.manage")}</Button>
                </div>
              </PanelRow>
              {showRegenerate && (
                <div className="px-4 py-3 bg-charcoal-50 dark:bg-charcoal-700/50 space-y-3">
                  {recoveryCodes.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-charcoal-500 dark:text-charcoal-400">{t("settings.remainingCodes")}</p>
                      <div className="grid grid-cols-2 gap-1">
                        {recoveryCodes.map((c) => (
                          <span key={c.index} className="text-xs font-mono text-charcoal-600 dark:text-charcoal-300">{c.hint}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input type="password" value={regeneratePassword} onChange={(e) => setRegeneratePassword(e.target.value)}
                      placeholder={t("settings.passwordPlaceholder")} className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-charcoal-600 border border-charcoal-200 dark:border-charcoal-500 text-charcoal-900 dark:text-white placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                    <Button variant="primary" size="sm" onClick={handleRegenerate} loading={saving} disabled={!regeneratePassword}>{t("settings.regenerate")}</Button>
                  </div>
                </div>
              )}
              <PanelRow label={t("settings.disable2FA")} description={t("settings.disable2FADesc")}>
                <Button variant="danger" size="sm" onClick={() => setStep("disable")}>{t("settings.disable")}</Button>
              </PanelRow>
            </>
          )}
          {!enabled && (
            <PanelRow label={t("settings.enable2FA")} description={t("settings.enable2FADesc")}>
              <Button variant="primary" size="sm" onClick={handleEnable} loading={saving}>{t("settings.enable")}</Button>
            </PanelRow>
          )}
        </div>
      )}
      {step === "disable" && (
        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-100/50 dark:border-charcoal-700 p-4 sm:p-5 space-y-4 mt-4">
          <p className="text-sm font-medium text-charcoal-700 dark:text-charcoal-300">{t("settings.confirmDisable2FA")}</p>
          <div>
            <label className="block text-xs font-medium text-charcoal-600 dark:text-charcoal-400 mb-1.5">{t("settings.currentPassword")}</label>
            <input type="password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)}
              placeholder={t("settings.enterPassword")}
              className="w-full px-3 py-2 text-sm rounded-lg bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-charcoal-900 dark:text-white placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-charcoal-600 dark:text-charcoal-400 mb-1.5">{t("settings.authenticatorCode")}</label>
            <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
              value={disableCode} onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder={t("settings.codePlaceholder")}
              className="w-full text-center text-lg tracking-[0.5em] font-mono px-3 py-2 text-sm rounded-lg bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-charcoal-900 dark:text-white placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="danger" size="sm" className="w-full sm:w-auto" onClick={handleDisableConfirm} loading={saving} disabled={!disablePassword || disableCode.length !== 6}>
              {t("settings.disable2FAButton")}
            </Button>
            <Button variant="secondary" size="sm" className="w-full sm:w-auto" onClick={() => { setStep("status"); setDisablePassword(""); setDisableCode(""); }}>{t("common.cancel")}</Button>
          </div>
        </div>
      )}
      <p className="text-xs text-charcoal-400 dark:text-charcoal-500 mt-3 px-1">
        {t("settings.twoFactorInfo")}
      </p>

      {show2faSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-xl p-8 text-center max-w-sm mx-4 animate-bounce-in">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-lg font-semibold text-charcoal-900 dark:text-white">{t("settings.connectedTitle")}</p>
          </div>
        </div>
      )}

      {show2faError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-xl p-8 text-center max-w-sm mx-4 animate-bounce-in">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <p className="text-lg font-semibold text-charcoal-900 dark:text-white">{t("settings.useSameEmail")}</p>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("languages");
  const [mobileSection, setMobileSection] = useState<string | null>(null);

  // Deep-link into a section via ?section= (e.g. /settings?section=two-factor)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get("section");
    if (section) {
      setActiveSection(section);
      setMobileSection(section);
    }
  }, []);

  const navCategories: NavCategory[] = [
    {
      label: t("settings.general"),
      items: [
        { id: "languages", icon: <Languages className="w-5 h-5" />, label: t("settings.languages"), description: t("settings.languagesDesc") },
      ],
    },
    {
      label: t("settings.account"),
      items: [
        { id: "verification", icon: <Shield className="w-5 h-5" />, label: t("settings.verification"), description: t("settings.verificationDesc") },
      ],
    },
    {
      label: t("settings.notifications"),
      items: [
        { id: "notifications", icon: <Bell className="w-5 h-5" />, label: t("settings.notifications"), description: t("settings.notificationsDesc") },
      ],
    },
    {
      label: t("settings.security"),
      items: [
        { id: "two-factor", icon: <SmartphoneIcon className="w-5 h-5" />, label: t("settings.twoFactor"), description: t("settings.twoFactorDesc") },
      ],
    },
    {
      label: t("settings.system"),
      items: [
        { id: "user-manual", icon: <BookOpen className="w-5 h-5" />, label: t("settings.userManual"), description: t("settings.userManualDesc") },
        { id: "help", icon: <HelpCircle className="w-5 h-5" />, label: t("settings.help"), description: t("settings.helpDesc") },
        { id: "rules", icon: <Scale className="w-5 h-5" />, label: t("settings.rules"), description: t("settings.rulesDesc") },
        { id: "terms", icon: <FileText className="w-5 h-5" />, label: t("settings.terms"), description: t("settings.termsDesc") },
      ],
    },
  ];
  const allNavItems = navCategories.flatMap((c) => c.items);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const initials = getInitials(user?.firstName, user?.lastName);

  const contentMap: Record<string, ReactNode> = {
    languages: <LanguagesContent />,
    verification: <VerificationContent />,
    notifications: <NotificationsContent />,
    "two-factor": <TwoFactorContent />,
    "user-manual": <UserManualContent />,
    help: <HelpContent />,
    rules: <RulesContent />,
    terms: <TermsContent />,
  };

  return (
    <>
      {/* Mobile layout */}
      <div className="lg:hidden min-h-screen bg-blur-image">
        <div className="pt-14 pb-20">
          <main className="mx-auto max-w-lg">
            {mobileSection ? (
              /* Mobile panel view */
              <div className="px-4 pb-8 pt-4">
                <button onClick={() => setMobileSection(null)} className="flex items-center gap-1.5 text-sm font-medium text-accent mb-4">
                  <ArrowLeft className="w-4 h-4" /> {t("settings.backToSettings")}
                </button>
                <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 p-3 sm:p-6">
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
                      <h2 className="text-lg font-display font-bold text-charcoal-900 dark:text-white">{fullName || t("settings.user")}</h2>
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-8 space-y-1">
                  <SectionHeader title={t("settings.mobileAccount")} />
                  <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 overflow-hidden divide-y divide-charcoal-100/50 dark:divide-charcoal-700/50">
                    <SettingRow icon={<Crown className="w-5 h-5 text-accent" />} label={user?.isPremium ? "Membership" : "Upgrade to Premium"} description="Gold, Platinum, boost & more" href="/membership" badge={user?.isPremium ? undefined : "PRO"} />
                    <div className="mx-4 border-t border-charcoal-100/50 dark:border-charcoal-700/50" />
                    <SettingRow icon={<Shield className="w-5 h-5 text-accent" />} label={t("settings.verificationMobile")} description={t("settings.verificationMobileDesc")} href="/verification" />
                    <div className="mx-4 border-t border-charcoal-100/50 dark:border-charcoal-700/50" />
                    <SettingRow icon={<Globe className="w-5 h-5 text-accent" />} label={t("settings.languagesMobile")} description={t("settings.languagesMobileDesc")} />
                  </div>
                  <SectionHeader title={t("settings.mobilePreferences")} />
                  <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 overflow-hidden divide-y divide-charcoal-100/50 dark:divide-charcoal-700/50">
                    <SettingRow icon={<Bell className="w-5 h-5 text-accent" />} label={t("settings.notificationsMobile")} description={t("settings.notificationsMobileDesc")} toggle={<ToggleSwitch checked={true} onChange={() => {}} />} />
                  </div>
                  <SectionHeader title={t("settings.mobileSecurity")} />
                  <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 overflow-hidden">
                    <SettingRow icon={<SmartphoneIcon className="w-5 h-5 text-accent" />} label={t("settings.twoFactorMobile")} description={t("settings.twoFactorMobileDesc")} onClick={() => setMobileSection("two-factor")} />
                    <div className="mx-4 border-t border-charcoal-100/50 dark:border-charcoal-700/50" />
                    <Link href="/health-info">
                      <SettingRow icon={<Heart className="w-5 h-5 text-accent" />} label={t("settings.healthInfo")} description={t("settings.healthInfoDesc")} />
                    </Link>
                  </div>
                  <SectionHeader title={t("settings.mobileSupport")} />
                  <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 overflow-hidden divide-y divide-charcoal-100/50 dark:divide-charcoal-700/50">
                    <SettingRow icon={<BookOpen className="w-5 h-5 text-accent" />} label={t("settings.userManualMobile")} description={t("settings.userManualMobileDesc")} onClick={() => setMobileSection("user-manual")} />
                    <div className="mx-4 border-t border-charcoal-100/50 dark:border-charcoal-700/50" />
                    <SettingRow icon={<HelpCircle className="w-5 h-5 text-accent" />} label={t("settings.helpMobile")} description={t("settings.helpMobileDesc")} onClick={() => setMobileSection("help")} />
                    <div className="mx-4 border-t border-charcoal-100/50 dark:border-charcoal-700/50" />
                    <SettingRow icon={<Scale className="w-5 h-5 text-accent" />} label={t("settings.rulesMobile")} description={t("settings.rulesMobileDesc")} onClick={() => setMobileSection("rules")} />
                    <div className="mx-4 border-t border-charcoal-100/50 dark:border-charcoal-700/50" />
                    <SettingRow icon={<FileText className="w-5 h-5 text-accent" />} label={t("settings.termsMobile")} description={t("settings.termsMobileDesc")} onClick={() => setMobileSection("terms")} />
                  </div>
                  <div className="pt-6">
                    <Button variant="danger" size="md" className="w-full !rounded-2xl h-12" onClick={() => { logout(); router.push("/"); }}>
                      <LogOut className="w-4 h-4 mr-2" /> {t("settings.signOut")}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:block min-h-screen bg-blur-image">
        <div className="lg:pl-64 pt-14 lg:pt-0">
        <div className="max-w-6xl mx-auto px-8 py-8 flex gap-8">
          {/* Settings Sub-nav */}
          <aside className="w-60 shrink-0">
            {navCategories.map((cat, idx) => (
              <div key={`navcat-${idx}`} className="mb-4">
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
                <span>{t("settings.signOut")}</span>
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
