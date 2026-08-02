"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { toast } from "sonner";
import api from "@/lib/api";
import {
  Sliders, Save, Globe, Shield, Lock, Mail, Bell, Palette,
  Languages, Key, Smartphone, RefreshCw, CheckCircle, AlertTriangle,
  Eye, EyeOff, Download, Trash2, FileText, Settings as SettingsIcon,
} from "lucide-react";
import { useI18n } from "@/context/I18nContext";

const TABS = [
  { key: "general", label: "General & Branding", icon: Palette },
  { key: "security", label: "Security & 2FA", icon: Shield },
  { key: "language", label: "Language", icon: Languages },
  { key: "privacy", label: "Privacy & Data", icon: Lock },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "email", label: "Email Templates", icon: Mail },
];

export default function AdminSettingsPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    adminService
      .getSystemSettings()
      .then(({ data }) => setSettings(data.settings || {}))
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const updateSetting = useCallback(async (key: string, value: any, category: string) => {
    setSaving(key);
    try {
      await adminService.updateSystemSetting({ key, value, category });
      setSettings((prev) => ({ ...prev, [key]: value }));
      toast.success("Setting updated");
    } catch {
      toast.error("Failed to update setting");
    } finally {
      setSaving(null);
    }
  }, []);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-7 h-7 text-blue-500" />
          {t('admin.settings.title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage branding, security, language, privacy, notifications, and email templates
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-1 mb-6 p-1 bg-gray-100 dark:bg-[#222240] rounded-xl">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white dark:bg-[#2d2a4a] text-blue-600 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-[#222240] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {activeTab === "general" && <GeneralTab settings={settings} updateSetting={updateSetting} saving={saving} />}
          {activeTab === "security" && <SecurityTab settings={settings} updateSetting={updateSetting} saving={saving} />}
          {activeTab === "language" && <LanguageTab settings={settings} updateSetting={updateSetting} saving={saving} />}
          {activeTab === "privacy" && <PrivacyTab settings={settings} updateSetting={updateSetting} saving={saving} />}
          {activeTab === "notifications" && <NotificationsTab settings={settings} updateSetting={updateSetting} saving={saving} />}
          {activeTab === "email" && <EmailTemplatesTab />}
        </>
      )}
    </AdminLayout>
  );
}

// ===================== GENERAL & BRANDING =====================
function GeneralTab({ settings, updateSetting, saving }: { settings: Record<string, any>; updateSetting: (k: string, v: any, c: string) => void; saving: string | null }) {
  const [siteName, setSiteName] = useState(settings.site_name || "Ethio Nikah");
  const [primaryColor, setPrimaryColor] = useState(settings.primary_color || "#D4AF37");
  const [logoUrl, setLogoUrl] = useState(settings.logo_url || "/application.png");
  const [tagline, setTagline] = useState(settings.site_tagline || "");
  const [contactEmail, setContactEmail] = useState(settings.contact_email || "");
  const [contactPhone, setContactPhone] = useState(settings.contact_phone || "");

  useEffect(() => {
    setSiteName(settings.site_name || "Ethio Nikah");
    setPrimaryColor(settings.primary_color || "#D4AF37");
    setLogoUrl(settings.logo_url || "/application.png");
    setTagline(settings.site_tagline || "");
    setContactEmail(settings.contact_email || "");
    setContactPhone(settings.contact_phone || "");
  }, [settings]);

  return (
    <div className="space-y-6">
      <SettingsCard icon={<Palette className="w-5 h-5 text-blue-500" />} title="Branding & Appearance" desc="Customize the platform's visual identity">
        <FieldRow label="Site Name" hint="Displayed in headers, emails, and browser tab">
          <input value={siteName} onChange={(e) => setSiteName(e.target.value)} className={inputClass} />
          <SaveButton onClick={() => updateSetting("site_name", siteName, "branding")} saving={saving === "site_name"} />
        </FieldRow>

        <FieldRow label="Tagline" hint="Short slogan shown on landing page">
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Find your righteous spouse" className={inputClass} />
          <SaveButton onClick={() => updateSetting("site_tagline", tagline, "branding")} saving={saving === "site_tagline"} />
        </FieldRow>

        <FieldRow label="Primary Color" hint="Main brand color (hex)">
          <div className="flex items-center gap-2">
            <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-10 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer" />
            <input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className={`${inputClass} font-mono`} />
            <SaveButton onClick={() => updateSetting("primary_color", primaryColor, "branding")} saving={saving === "primary_color"} />
          </div>
        </FieldRow>

        <FieldRow label="Logo URL" hint="Path or URL to the logo image">
          <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className={inputClass} />
          <SaveButton onClick={() => updateSetting("logo_url", logoUrl, "branding")} saving={saving === "logo_url"} />
        </FieldRow>
      </SettingsCard>

      <SettingsCard icon={<Mail className="w-5 h-5 text-green-500" />} title="Contact Information" desc="Displayed in footer and contact pages">
        <FieldRow label="Contact Email" hint="Support email address">
          <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="support@ethionikah.com" className={inputClass} />
          <SaveButton onClick={() => updateSetting("contact_email", contactEmail, "branding")} saving={saving === "contact_email"} />
        </FieldRow>

        <FieldRow label="Contact Phone" hint="Support phone number">
          <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+251 912 345 678" className={inputClass} />
          <SaveButton onClick={() => updateSetting("contact_phone", contactPhone, "branding")} saving={saving === "contact_phone"} />
        </FieldRow>
      </SettingsCard>
    </div>
  );
}

// ===================== SECURITY & 2FA =====================
function SecurityTab({ settings, updateSetting, saving }: { settings: Record<string, any>; updateSetting: (k: string, v: any, c: string) => void; saving: string | null }) {
  const [twoFAStatus, setTwoFAStatus] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(true);
  const [force2FA, setForce2FA] = useState(settings.force_2fa_for_admins === true);
  const [requireEmailVerify, setRequireEmailVerify] = useState(settings.require_email_verification !== false);
  const [requirePhoneVerify, setRequirePhoneVerify] = useState(settings.require_phone_verification !== false);
  const [minPasswordLength, setMinPasswordLength] = useState(settings.min_password_length || 8);
  const [sessionTimeout, setSessionTimeout] = useState(settings.session_timeout_minutes || 60);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(settings.max_login_attempts || 5);
  const [ipWhitelist, setIpWhitelist] = useState(settings.ip_whitelist || "");

  useEffect(() => {
    api.get("/auth/2fa/status").then((r) => setTwoFAStatus(r.data.enabled)).catch(() => {}).finally(() => setTwoFALoading(false));
    setForce2FA(settings.force_2fa_for_admins === true);
    setRequireEmailVerify(settings.require_email_verification !== false);
    setRequirePhoneVerify(settings.require_phone_verification !== false);
    setMinPasswordLength(settings.min_password_length || 8);
    setSessionTimeout(settings.session_timeout_minutes || 60);
    setMaxLoginAttempts(settings.max_login_attempts || 5);
    setIpWhitelist(settings.ip_whitelist || "");
  }, [settings]);

  return (
    <div className="space-y-6">
      {/* 2FA Status */}
      <SettingsCard icon={<Shield className="w-5 h-5 text-green-500" />} title="Two-Factor Authentication (2FA)" desc="Protect admin accounts with TOTP-based 2FA">
        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${twoFAStatus ? "bg-green-50 dark:bg-green-900/20" : "bg-amber-50 dark:bg-amber-900/20"}`}>
              {twoFAStatus ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertTriangle className="w-5 h-5 text-amber-500" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                2FA is {twoFALoading ? "..." : twoFAStatus ? "Enabled" : "Not Enabled"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {twoFAStatus ? "Your account is protected with 2FA" : "Enable 2FA to secure your admin account"}
              </p>
            </div>
          </div>
          <a
            href="/admin/security"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            {twoFAStatus ? "Manage 2FA" : "Enable 2FA"}
          </a>
        </div>

        <ToggleRow
          label="Force 2FA for All Admins"
          desc="Require all admin accounts to have 2FA enabled"
          checked={force2FA}
          onChange={(v) => { setForce2FA(v); updateSetting("force_2fa_for_admins", v, "security"); }}
          saving={saving === "force_2fa_for_admins"}
        />
      </SettingsCard>

      {/* Authentication Settings */}
      <SettingsCard icon={<Key className="w-5 h-5 text-amber-500" />} title="Authentication & Password" desc="Configure password and login security policies">
        <ToggleRow
          label="Require Email Verification"
          desc="Users must verify their email before accessing the platform"
          checked={requireEmailVerify}
          onChange={(v) => { setRequireEmailVerify(v); updateSetting("require_email_verification", v, "security"); }}
          saving={saving === "require_email_verification"}
        />
        <ToggleRow
          label="Require Phone Verification"
          desc="Users must verify their phone number via OTP"
          checked={requirePhoneVerify}
          onChange={(v) => { setRequirePhoneVerify(v); updateSetting("require_phone_verification", v, "security"); }}
          saving={saving === "require_phone_verification"}
        />

        <FieldRow label="Minimum Password Length" hint="Minimum characters required for passwords">
          <input type="number" min={6} max={32} value={minPasswordLength} onChange={(e) => setMinPasswordLength(parseInt(e.target.value) || 8)} className={`${inputClass} w-24`} />
          <SaveButton onClick={() => updateSetting("min_password_length", minPasswordLength, "security")} saving={saving === "min_password_length"} />
        </FieldRow>

        <FieldRow label="Session Timeout (minutes)" hint="Auto-logout after inactivity">
          <input type="number" min={5} max={1440} value={sessionTimeout} onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 60)} className={`${inputClass} w-24`} />
          <SaveButton onClick={() => updateSetting("session_timeout_minutes", sessionTimeout, "security")} saving={saving === "session_timeout_minutes"} />
        </FieldRow>

        <FieldRow label="Max Login Attempts" hint="Failed attempts before account lockout">
          <input type="number" min={3} max={20} value={maxLoginAttempts} onChange={(e) => setMaxLoginAttempts(parseInt(e.target.value) || 5)} className={`${inputClass} w-24`} />
          <SaveButton onClick={() => updateSetting("max_login_attempts", maxLoginAttempts, "security")} saving={saving === "max_login_attempts"} />
        </FieldRow>
      </SettingsCard>

      {/* IP Whitelist */}
      <SettingsCard icon={<Lock className="w-5 h-5 text-red-500" />} title="IP Restrictions" desc="Restrict admin panel access to specific IP addresses">
        <FieldRow label="Admin IP Whitelist" hint="Comma-separated list of allowed IPs (leave empty to allow all)">
          <input value={ipWhitelist} onChange={(e) => setIpWhitelist(e.target.value)} placeholder="192.168.1.1, 10.0.0.5" className={inputClass} />
          <SaveButton onClick={() => updateSetting("ip_whitelist", ipWhitelist, "security")} saving={saving === "ip_whitelist"} />
        </FieldRow>
      </SettingsCard>
    </div>
  );
}

// ===================== LANGUAGE =====================
function LanguageTab({ settings, updateSetting, saving }: { settings: Record<string, any>; updateSetting: (k: string, v: any, c: string) => void; saving: string | null }) {
  const [defaultLang, setDefaultLang] = useState(settings.default_language || "en");
  const [availableLangs, setAvailableLangs] = useState<string[]>(settings.available_languages || ["en", "am", "ar", "om"]);
  const [rtlSupport, setRtlSupport] = useState(settings.rtl_support === true);

  useEffect(() => {
    setDefaultLang(settings.default_language || "en");
    setAvailableLangs(settings.available_languages || ["en", "am", "ar", "om"]);
    setRtlSupport(settings.rtl_support === true);
  }, [settings]);

  const LANGUAGES = [
    { code: "en", label: "English", flag: "🇬🇧", native: "English" },
    { code: "am", label: "Amharic", flag: "🇪🇹", native: "አማርኛ" },
    { code: "ar", label: "Arabic", flag: "🇸🇦", native: "العربية" },
    { code: "om", label: "Oromo", flag: "🇪🇹", native: "Afaan Oromoo" },
  ];

  const toggleLang = (code: string) => {
    const newList = availableLangs.includes(code)
      ? availableLangs.filter((c) => c !== code)
      : [...availableLangs, code];
    setAvailableLangs(newList);
    updateSetting("available_languages", newList, "localization");
  };

  return (
    <div className="space-y-6">
      <SettingsCard icon={<Languages className="w-5 h-5 text-purple-500" />} title="Language & Localization" desc="Configure which languages are available on the platform">
        <FieldRow label="Default Language" hint="Language for new users and guests">
          <select value={defaultLang} onChange={(e) => setDefaultLang(e.target.value)} className={inputClass}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label} ({l.native})</option>
            ))}
          </select>
          <SaveButton onClick={() => updateSetting("default_language", defaultLang, "localization")} saving={saving === "default_language"} />
        </FieldRow>

        <div className="pt-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Available Languages</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Toggle which languages users can switch between</p>
          <div className="grid grid-cols-2 gap-3">
            {LANGUAGES.map((l) => {
              const enabled = availableLangs.includes(l.code);
              return (
                <button
                  key={l.code}
                  onClick={() => toggleLang(l.code)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    enabled
                      ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5"
                  }`}
                >
                  <span className="text-2xl">{l.flag}</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{l.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{l.native}</p>
                  </div>
                  {enabled && <CheckCircle className="w-4 h-4 text-blue-500" />}
                </button>
              );
            })}
          </div>
        </div>

        <ToggleRow
          label="RTL Support"
          desc="Enable right-to-left layout for Arabic"
          checked={rtlSupport}
          onChange={(v) => { setRtlSupport(v); updateSetting("rtl_support", v, "localization"); }}
          saving={saving === "rtl_support"}
        />
      </SettingsCard>
    </div>
  );
}

// ===================== PRIVACY & DATA =====================
function PrivacyTab({ settings, updateSetting, saving }: { settings: Record<string, any>; updateSetting: (k: string, v: any, c: string) => void; saving: string | null }) {
  const [retentionDays, setRetentionDays] = useState(settings.data_retention_days || 30);
  const [profileIndexing, setProfileIndexing] = useState(settings.allow_search_engine_indexing !== false);
  const [shareAnalytics, setShareAnalytics] = useState(settings.share_analytics_data === true);
  const [requireConsent, setRequireConsent] = useState(settings.require_data_consent === true);
  const [autoDeleteInactive, setAutoDeleteInactive] = useState(settings.auto_delete_inactive_days || 0);

  useEffect(() => {
    setRetentionDays(settings.data_retention_days || 30);
    setProfileIndexing(settings.allow_search_engine_indexing !== false);
    setShareAnalytics(settings.share_analytics_data === true);
    setRequireConsent(settings.require_data_consent === true);
    setAutoDeleteInactive(settings.auto_delete_inactive_days || 0);
  }, [settings]);

  return (
    <div className="space-y-6">
      <SettingsCard icon={<Lock className="w-5 h-5 text-red-500" />} title="Data Retention & Privacy" desc="Control how long user data is kept and privacy policies">
        <FieldRow label="Data Retention (days)" hint="How long to keep user data after deletion request">
          <input type="number" min={1} max={365} value={retentionDays} onChange={(e) => setRetentionDays(parseInt(e.target.value) || 30)} className={`${inputClass} w-24`} />
          <SaveButton onClick={() => updateSetting("data_retention_days", retentionDays, "privacy")} saving={saving === "data_retention_days"} />
        </FieldRow>

        <FieldRow label="Auto-Delete Inactive Accounts (days)" hint="Delete accounts inactive for this many days (0 = disabled)">
          <input type="number" min={0} max={3650} value={autoDeleteInactive} onChange={(e) => setAutoDeleteInactive(parseInt(e.target.value) || 0)} className={`${inputClass} w-24`} />
          <SaveButton onClick={() => updateSetting("auto_delete_inactive_days", autoDeleteInactive, "privacy")} saving={saving === "auto_delete_inactive_days"} />
        </FieldRow>

        <ToggleRow
          label="Require Data Consent"
          desc="Show consent dialog before collecting user data"
          checked={requireConsent}
          onChange={(v) => { setRequireConsent(v); updateSetting("require_data_consent", v, "privacy"); }}
          saving={saving === "require_data_consent"}
        />

        <ToggleRow
          label="Allow Search Engine Indexing"
          desc="Let Google and other search engines index public profiles"
          checked={profileIndexing}
          onChange={(v) => { setProfileIndexing(v); updateSetting("allow_search_engine_indexing", v, "privacy"); }}
          saving={saving === "allow_search_engine_indexing"}
        />

        <ToggleRow
          label="Share Anonymous Analytics"
          desc="Share anonymized usage data for platform improvement"
          checked={shareAnalytics}
          onChange={(v) => { setShareAnalytics(v); updateSetting("share_analytics_data", v, "privacy"); }}
          saving={saving === "share_analytics_data"}
        />
      </SettingsCard>

      <SettingsCard icon={<FileText className="w-5 h-5 text-blue-500" />} title="Legal Pages" desc="Links to legal documents">
        <FieldRow label="Privacy Policy URL" hint="Link to your privacy policy page">
          <input defaultValue={settings.privacy_policy_url || "/privacy"} placeholder="/privacy" className={inputClass} onBlur={(e) => updateSetting("privacy_policy_url", e.target.value, "privacy")} />
        </FieldRow>
        <FieldRow label="Terms of Service URL" hint="Link to your terms of service">
          <input defaultValue={settings.terms_url || "/terms"} placeholder="/terms" className={inputClass} onBlur={(e) => updateSetting("terms_url", e.target.value, "privacy")} />
        </FieldRow>
        <FieldRow label="Cookie Policy URL" hint="Link to cookie policy">
          <input defaultValue={settings.cookie_policy_url || "/cookies"} placeholder="/cookies" className={inputClass} onBlur={(e) => updateSetting("cookie_policy_url", e.target.value, "privacy")} />
        </FieldRow>
      </SettingsCard>
    </div>
  );
}

// ===================== NOTIFICATIONS =====================
function NotificationsTab({ settings, updateSetting, saving }: { settings: Record<string, any>; updateSetting: (k: string, v: any, c: string) => void; saving: string | null }) {
  const [emailNotif, setEmailNotif] = useState(settings.email_notifications_enabled !== false);
  const [pushNotif, setPushNotif] = useState(settings.push_notifications_enabled !== false);
  const [smsNotif, setSmsNotif] = useState(settings.sms_notifications_enabled === true);
  const [matchNotif, setMatchNotif] = useState(settings.match_notifications !== false);
  const [messageNotif, setMessageNotif] = useState(settings.message_notifications !== false);
  const [visitorNotif, setVisitorNotif] = useState(settings.visitor_notifications !== false);
  const [likeNotif, setLikeNotif] = useState(settings.like_notifications !== false);

  useEffect(() => {
    setEmailNotif(settings.email_notifications_enabled !== false);
    setPushNotif(settings.push_notifications_enabled !== false);
    setSmsNotif(settings.sms_notifications_enabled === true);
    setMatchNotif(settings.match_notifications !== false);
    setMessageNotif(settings.message_notifications !== false);
    setVisitorNotif(settings.visitor_notifications !== false);
    setLikeNotif(settings.like_notifications !== false);
  }, [settings]);

  return (
    <div className="space-y-6">
      <SettingsCard icon={<Bell className="w-5 h-5 text-amber-500" />} title="Notification Channels" desc="Enable or disable notification delivery methods">
        <ToggleRow label="Email Notifications" desc="Send notifications via email" checked={emailNotif}
          onChange={(v) => { setEmailNotif(v); updateSetting("email_notifications_enabled", v, "notifications"); }} saving={saving === "email_notifications_enabled"} />
        <ToggleRow label="Push Notifications" desc="In-app and browser push notifications" checked={pushNotif}
          onChange={(v) => { setPushNotif(v); updateSetting("push_notifications_enabled", v, "notifications"); }} saving={saving === "push_notifications_enabled"} />
        <ToggleRow label="SMS Notifications" desc="Send notifications via SMS (requires SMS gateway)" checked={smsNotif}
          onChange={(v) => { setSmsNotif(v); updateSetting("sms_notifications_enabled", v, "notifications"); }} saving={saving === "sms_notifications_enabled"} />
      </SettingsCard>

      <SettingsCard icon={<Bell className="w-5 h-5 text-blue-500" />} title="Notification Types" desc="Choose which events trigger notifications">
        <ToggleRow label="Match Notifications" desc="Notify users when they get a new match" checked={matchNotif}
          onChange={(v) => { setMatchNotif(v); updateSetting("match_notifications", v, "notifications"); }} saving={saving === "match_notifications"} />
        <ToggleRow label="Message Notifications" desc="Notify users on new messages" checked={messageNotif}
          onChange={(v) => { setMessageNotif(v); updateSetting("message_notifications", v, "notifications"); }} saving={saving === "message_notifications"} />
        <ToggleRow label="Visitor Notifications" desc="Notify users when someone views their profile" checked={visitorNotif}
          onChange={(v) => { setVisitorNotif(v); updateSetting("visitor_notifications", v, "notifications"); }} saving={saving === "visitor_notifications"} />
        <ToggleRow label="Like Notifications" desc="Notify users when someone likes their profile" checked={likeNotif}
          onChange={(v) => { setLikeNotif(v); updateSetting("like_notifications", v, "notifications"); }} saving={saving === "like_notifications"} />
      </SettingsCard>
    </div>
  );
}

// ===================== EMAIL TEMPLATES =====================
function EmailTemplatesTab() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");

  useEffect(() => {
    adminService.getNotificationTemplates().then(({ data }) => {
      setTemplates(data.templates || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const startEdit = (t: any) => {
    setEditing(t.id);
    setEditSubject(t.subject);
    setEditBody(t.body);
  };

  const saveEdit = async (id: string) => {
    try {
      await adminService.updateNotificationTemplate(id, { subject: editSubject, body: editBody });
      setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, subject: editSubject, body: editBody } : t));
      setEditing(null);
      toast.success("Template updated");
    } catch {
      toast.error("Failed to update template");
    }
  };

  if (loading) return <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-24 bg-gray-100 dark:bg-[#222240] rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      {templates.map((t) => (
        <div key={t.id} className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${t.type === "email" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"}`}>
                {t.type}
              </span>
              <code className="text-xs text-gray-500 dark:text-gray-400">{t.key}</code>
            </div>
            {editing === t.id ? (
              <div className="flex gap-2">
                <button onClick={() => saveEdit(t.id)} className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium">Save</button>
                <button onClick={() => setEditing(null)} className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium">Cancel</button>
              </div>
            ) : (
              <button onClick={() => startEdit(t)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
            )}
          </div>
          {editing === t.id ? (
            <div className="space-y-3">
              <input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className={inputClass} placeholder="Subject" />
              <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={4} className={`${inputClass} resize-y`} placeholder="Body (use {{variables}})" />
              {t.variables?.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">Variables: {t.variables.map((v: string) => `{{${v}}}`).join(", ")}</p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{t.subject}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{t.body}</p>
            </div>
          )}
        </div>
      ))}
      {templates.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700">
          <Mail className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400 dark:text-gray-500">No templates found. Seed default data first.</p>
        </div>
      )}
    </div>
  );
}

// ===================== SHARED COMPONENTS =====================
const inputClass = "flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors";

function SettingsCard({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#222240] rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-900 dark:text-white">{label}</label>
      </div>
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{hint}</p>}
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange, saving }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void; saving?: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
      </div>
      <div className="flex items-center gap-2">
        {saving && <RefreshCw className="w-3 h-3 animate-spin text-gray-400" />}
        <button
          onClick={() => onChange(!checked)}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${checked ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "left-6" : "left-0.5"}`} />
        </button>
      </div>
    </div>
  );
}

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors disabled:opacity-50 shrink-0"
    >
      {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
      {saving ? "Saving..." : "Save"}
    </button>
  );
}
