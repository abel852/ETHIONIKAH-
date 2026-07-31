"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Shield, ShieldCheck, Settings, Activity,
  LogOut, Sun, Moon, ChevronDown,
  FileText, CreditCard, BarChart3,
  ShieldAlert, Sliders, Puzzle,
  Flag, Menu, Languages, Search,
  Crown, Wallet, Heart, Bot, Trash2,
  Database, BookOpen,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n, type Lang } from "@/context/I18nContext";
import NotificationBell from "@/components/notifications/NotificationBell";
import api from "@/lib/api";

const navSections = [
  {
    labelKey: "admin.nav.overview",
    items: [
      { href: "/admin", icon: LayoutDashboard, labelKey: "admin.nav.dashboard", perm: "overview.dashboard" },
      { href: "/admin/activity", icon: Activity, labelKey: "admin.nav.activity", perm: "overview.activity" },
    ],
  },
  {
    labelKey: "admin.nav.management",
    items: [
      { href: "/admin/users", icon: Users, labelKey: "admin.nav.users", perm: "users.view" },
      { href: "/admin/verifications", icon: ShieldCheck, labelKey: "admin.nav.verifications", perm: "verifications.view" },
      { href: "/admin/admins", icon: Shield, labelKey: "admin.nav.admins", perm: "admins.view" },
      { href: "/admin/recycle-bin", icon: Trash2, labelKey: "admin.nav.recycleBin", perm: "recycle_bin.view" },
    ],
  },
  {
    labelKey: "admin.nav.moderation",
    items: [
      { href: "/admin/complaints", icon: FileText, labelKey: "admin.nav.complaints", perm: "complaints.view" },
      { href: "/admin/reports", icon: Flag, labelKey: "admin.nav.reports", perm: "reports.view" },
    ],
  },
  {
    labelKey: "admin.nav.revenue",
    items: [
      { href: "/admin/payments", icon: CreditCard, labelKey: "admin.nav.payments", perm: "payments.view" },
      { href: "/admin/membership-plans", icon: Crown, labelKey: "admin.nav.plansCredits", perm: "membership_plans.view" },
      { href: "/admin/payment-methods", icon: Wallet, labelKey: "admin.nav.paymentMethods", perm: "payment_methods.view" },
      { href: "/admin/analytics", icon: BarChart3, labelKey: "admin.nav.analytics", perm: "analytics.view" },
    ],
  },
  {
    labelKey: "admin.nav.security",
    items: [
      { href: "/admin/security", icon: ShieldAlert, labelKey: "admin.nav.security", perm: "security.view" },
      { href: "/admin/audit-logs", icon: FileText, labelKey: "admin.nav.auditLogs", perm: "security.audit_logs" },
    ],
  },
  {
    labelKey: "admin.nav.matchmaking",
    items: [
      { href: "/admin/matchmaking", icon: Heart, labelKey: "admin.nav.matchmaking", perm: "matchmaking.view" },
      { href: "/admin/ai-automation", icon: Bot, labelKey: "admin.nav.aiAutomation", perm: "ai.fraud" },
    ],
  },
  {
    labelKey: "admin.nav.system",
    items: [
      { href: "/admin/settings", icon: Sliders, labelKey: "admin.nav.settings", perm: "settings.view" },
      { href: "/admin/feature-toggles", icon: Puzzle, labelKey: "admin.nav.featureToggles", perm: "settings.feature_toggles" },
      { href: "/admin/backup", icon: Database, labelKey: "admin.nav.backup", perm: "backup.view" },
      { href: "/admin/books", icon: BookOpen, labelKey: "admin.nav.books", perm: "books.view" },
    ],
  },
];

// Map each href to its required permission for page-level access control
const hrefToPerm: Record<string, string> = {
  "/admin": "overview.dashboard",
  "/admin/activity": "overview.activity",
  "/admin/users": "users.view",
  "/admin/verifications": "verifications.view",
  "/admin/admins": "admins.view",
  "/admin/recycle-bin": "recycle_bin.view",
  "/admin/complaints": "complaints.view",
  "/admin/reports": "reports.view",
  "/admin/payments": "payments.view",
  "/admin/membership-plans": "membership_plans.view",
  "/admin/payment-methods": "payment_methods.view",
  "/admin/analytics": "analytics.view",
  "/admin/security": "security.view",
  "/admin/audit-logs": "security.audit_logs",
  "/admin/matchmaking": "matchmaking.view",
  "/admin/ai-automation": "ai.fraud",
  "/admin/settings": "settings.view",
  "/admin/feature-toggles": "settings.feature_toggles",
  "/admin/backup": "backup.view",
  "/admin/books": "books.view",
};

const allNavItems = navSections.flatMap((s) => s.items);

const s = {
  bg: "#0c0a1a",
  surface: "#151028",
  sidebar: "#1a1230",
  sidebarBorder: "#2a1e4a",
  gold: "#D4AF37",
  goldLight: "#E6C878",
  goldDark: "#B8860B",
  textMuted: "#8b80a8",
  text: "#ffffff",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({});
  const [langOpen, setLangOpen] = useState(false);

  const isSuperAdmin = user?.adminRole === "super_admin";
  const userPerms = new Set(user?.permissions || []);
  const hasPerm = (perm?: string) => isSuperAdmin || !perm || userPerms.has(perm);
  const filteredSections = navSections.map((s) => ({
    ...s,
    items: s.items.filter((i) => hasPerm(i.perm)),
  })).filter((s) => s.items.length > 0);
  const filteredNavItems = filteredSections.flatMap((s) => s.items);
  const [expandedSections, setExpandedSections] = useState<string[]>(navSections.map((s) => s.labelKey));

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const fetchBadgeCounts = async () => {
    try {
      const { data } = await api.get("/admin/badge-counts");
      setBadgeCounts(data.counts || {});
    } catch {}
  };

  useEffect(() => {
    if (user?.role !== "admin") return;
    fetchBadgeCounts();
    const onRefresh = () => fetchBadgeCounts();
    window.addEventListener("refresh-badge-counts", onRefresh);
    const interval = setInterval(() => {
      if (document.hidden) return;
      fetchBadgeCounts();
    }, 120000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("refresh-badge-counts", onRefresh);
    };
  }, [user]);

  const badgeForHref = (href: string): number | null => {
    const map: Record<string, string> = {
      "/admin/users": "users",
      "/admin/verifications": "verifications",
      "/admin/complaints": "complaints",
      "/admin/reports": "reports",
      "/admin/payments": "payments",
    };
    const key = map[href];
    return key && badgeCounts[key] > 0 ? badgeCounts[key] : null;
  };

  const toggleDark = () => {
    const next = !document.documentElement.classList.contains("dark");
    localStorage.setItem("admin-dark-mode", String(next));
    if (next) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    setDark(next);
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href + "/") || pathname === href;
  };

  // Security: if a non-admin somehow reaches AdminLayout, block account and logout immediately
  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin") {
      api.post("/auth/security-block", { reason: `Non-admin accessing AdminLayout: ${pathname}` }, { _noRedirect: true, _noToast: true } as any).catch(() => {});
      logout();
      window.location.href = "/login";
      return;
    }
  }, [user, logout]);

  // Redirect non-super-admins away from pages they don't have permission for
  useEffect(() => {
    if (!user || user.role !== "admin") return;
    if (isSuperAdmin) return;
    const requiredPerm = hrefToPerm[pathname];
    if (requiredPerm && !userPerms.has(requiredPerm)) {
      router.replace("/admin");
    }
  }, [pathname, user, isSuperAdmin, router]);

  const toggleSection = (label: string) => {
    setExpandedSections((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const d = dark;

  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{
        background: d
          ? `radial-gradient(ellipse at 50% 0%, #1a1240 0%, ${s.bg} 70%)`
          : "#f0f1f4",
      }}
    >
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: d ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.3)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`fixed lg:fixed inset-y-0 left-0 z-50 flex flex-col w-[260px] shrink-0 transition-all duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          background: d
            ? `linear-gradient(180deg, ${s.sidebar} 0%, ${s.bg} 100%)`
            : "linear-gradient(180deg, #ffffff 0%, #f0f1f4 100%)",
          boxShadow: d
            ? "4px 0 30px rgba(0,0,0,0.5), inset -1px 0 0 rgba(212,175,55,0.15)"
            : "1px 0 3px rgba(0,0,0,0.08)",
        }}
      >
        {/* Logo */}
        <div
          className="h-16 flex items-center px-5 shrink-0"
          style={{
            borderBottom: d
              ? `1px solid ${s.sidebarBorder}`
              : "1px solid #e5e7eb",
            boxShadow: d ? "inset 0 -1px 0 rgba(212,175,55,0.08)" : "none",
          }}
        >
          <Link href="/admin" className="flex items-center gap-2">
            <span
              className="text-lg font-bold tracking-tight"
              style={{
                color: d ? s.gold : "#1a1a2e",
                textShadow: d ? "0 0 20px rgba(212,175,55,0.3)" : "none",
              }}
            >
              Ethio Nikah
            </span>
            <span
              className="px-2 py-0.5 text-[10px] font-semibold rounded-md tracking-wider"
              style={{
                background: d
                  ? `linear-gradient(135deg, ${s.gold}, ${s.goldDark})`
                  : "#1a1a2e",
                color: d ? s.bg : "#e8eaed",
                boxShadow: d
                  ? "0 2px 8px rgba(212,175,55,0.3), inset 0 1px 0 rgba(255,255,255,0.3)"
                  : "none",
              }}
            >
              ADMIN
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-3 overflow-y-auto admin-sidebar-scroll">
          {filteredSections.map((section) => {
            const sectionOpen = expandedSections.includes(section.labelKey);
            const sectionActive = section.items.some((i) => isActive(i.href));
            return (
              <div key={section.labelKey}>
                <button
                  onClick={() => toggleSection(section.labelKey)}
                  className="flex items-center justify-between w-full px-2 py-1 text-[11px] font-semibold uppercase tracking-widest transition-colors"
                  style={{
                    color: d
                      ? sectionActive
                        ? s.gold
                        : s.textMuted
                      : "#777",
                  }}
                >
                  {t(section.labelKey)}
                  <ChevronDown className={`w-3 h-3 transition-transform ${sectionOpen ? "rotate-0" : "-rotate-90"}`} />
                </button>
                {sectionOpen && (
                  <div className="mt-1 space-y-0.5">
                    {section.items.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                          style={
                            active
                              ? d
                                ? {
                                    background: `linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)`,
                                    color: s.gold,
                                    boxShadow: `inset 0 1px 0 rgba(212,175,55,0.2), 0 2px 12px rgba(212,175,55,0.1)`,
                                    border: `1px solid rgba(212,175,55,0.2)`,
                                  }
                                : {
                                    background: "#1a1a2e",
                                    color: "white",
                                  }
                              : d
                              ? {
                                  color: s.text,
                                }
                              : {
                                  color: "#1a1a2e",
                                }
                          }
                          onMouseEnter={(e) => {
                            if (!active) {
                              if (d) {
                                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                              } else {
                                e.currentTarget.style.background = "rgba(0,0,0,0.03)";
                              }
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!active) {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          <item.icon className="w-4.5 h-4.5 shrink-0" />
                          <span className="flex-1">{t(item.labelKey)}</span>
                          {badgeForHref(item.href) !== null && (
                            <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1 leading-none"
                              style={{
                                background: d
                                  ? "linear-gradient(135deg, #ef4444, #dc2626)"
                                  : "#dc2626",
                                color: "#fff",
                                boxShadow: d
                                  ? "0 2px 6px rgba(239,68,68,0.4)"
                                  : "0 1px 3px rgba(0,0,0,0.2)",
                              }}>
                              {badgeForHref(item.href)}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Language Switcher */}
        <div
          className="px-4 py-3 shrink-0"
          style={{
            borderTop: d
              ? `1px solid ${s.sidebarBorder}`
              : "1px solid #e5e7eb",
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-medium"
              style={{ color: d ? s.textMuted : "#555" }}
            >
              {t('admin.language')}
            </span>
            <div className="flex items-center gap-0.5">
              {([
                { code: "en", label: "EN" },
                { code: "am", label: "አማ" },
                { code: "ar", label: "ع" },
              ] as { code: Lang; label: string }[]).map((l, i) => (
                <div key={l.code} className="flex items-center">
                  {i > 0 && <span style={{ color: d ? s.textMuted : "#ccc" }}>|</span>}
                  <button
                    onClick={() => setLang(l.code)}
                    className="px-2 py-0.5 text-xs font-medium rounded-md transition-all"
                    style={{
                      color: lang === l.code ? (d ? s.gold : "#1a1a2e") : (d ? s.textMuted : "#666"),
                      fontWeight: lang === l.code ? 700 : 500,
                    }}
                  >
                    {l.label}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <div
          className="px-4 py-3 shrink-0"
          style={{
            borderTop: d
              ? `1px solid ${s.sidebarBorder}`
              : "1px solid #e5e7eb",
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-medium"
              style={{ color: d ? s.textMuted : "#555" }}
            >
              {t('admin.darkMode')}
            </span>
            <button
              onClick={toggleDark}
              className="relative rounded-full transition-all duration-300"
              style={{
                width: "44px",
                height: "24px",
                background: d
                  ? `linear-gradient(135deg, ${s.gold}, ${s.goldDark})`
                  : "#bbb",
                boxShadow: d
                  ? "inset 0 1px 3px rgba(0,0,0,0.3), 0 0 10px rgba(212,175,55,0.2)"
                  : "inset 0 1px 2px rgba(0,0,0,0.1)",
              }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-300"
                style={{
                  transform: d ? "translateX(20px)" : "translateX(0)",
                  background: d ? s.bg : "#fff",
                  boxShadow: d
                    ? "0 1px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)"
                    : "0 1px 3px rgba(0,0,0,0.15)",
                }}
              >
                {d ? (
                  <Moon className="w-3 h-3" style={{ color: s.gold }} />
                ) : (
                  <Sun className="w-3 h-3 text-amber-500" />
                )}
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col min-w-0 lg:ml-[260px] h-screen"
        style={{
          background: d
            ? `radial-gradient(ellipse at 50% 0%, #1a1240 0%, ${s.bg} 70%)`
            : "#f0f1f4",
        }}
      >
        {/* Top bar */}
        <header
          className="h-16 flex items-center justify-between px-4 lg:px-6 shrink-0 relative"
          style={{
            background: d
              ? `linear-gradient(180deg, ${s.sidebar} 0%, ${s.surface} 100%)`
              : "rgba(255,255,255,0.8)",
            boxShadow: d
              ? `0 1px 0 rgba(212,175,55,0.12), 0 4px 20px rgba(0,0,0,0.3)`
              : "0 1px 3px rgba(0,0,0,0.06)",
            zIndex: 60,
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg transition-colors"
              style={{ color: d ? s.text : "#1a1a2e" }}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden lg:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: d ? s.textMuted : "#999" }} />
                <input
                  type="text"
                  placeholder={t('admin.search')}
                  className="w-72 pl-9 pr-3 py-2 text-sm rounded-xl transition-all duration-200 focus:outline-none"
                  style={{
                    background: d
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(255,255,255,0.6)",
                    border: d
                      ? `1px solid ${s.sidebarBorder}`
                      : "1px solid #e5e7eb",
                    color: d ? s.text : "#1a1a2e",
                    boxShadow: d
                      ? "inset 0 2px 4px rgba(0,0,0,0.2)"
                      : "inset 0 1px 2px rgba(0,0,0,0.04)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = d ? s.gold : "#1a1a2e";
                    e.currentTarget.style.boxShadow = d
                      ? "inset 0 2px 4px rgba(0,0,0,0.2), 0 0 12px rgba(212,175,55,0.15)"
                      : "inset 0 1px 2px rgba(0,0,0,0.04), 0 0 0 3px rgba(26,26,46,0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = d ? s.sidebarBorder : "#e5e7eb";
                    e.currentTarget.style.boxShadow = d
                      ? "inset 0 2px 4px rgba(0,0,0,0.2)"
                      : "inset 0 1px 2px rgba(0,0,0,0.04)";
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              onClick={toggleDark}
              className="lg:hidden relative rounded-full transition-all duration-300"
              style={{
                width: "36px",
                height: "20px",
                background: d
                  ? `linear-gradient(135deg, ${s.gold}, ${s.goldDark})`
                  : "#bbb",
                boxShadow: d
                  ? "inset 0 1px 3px rgba(0,0,0,0.3)"
                  : "inset 0 1px 2px rgba(0,0,0,0.1)",
              }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center transition-transform duration-300"
                style={{
                  transform: d ? "translateX(14px)" : "translateX(0)",
                  background: d ? s.bg : "#fff",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                }}
              >
                {d ? (
                  <Moon className="w-2 h-2" style={{ color: s.gold }} />
                ) : (
                  <Sun className="w-2 h-2 text-amber-500" />
                )}
              </span>
            </button>
            <div className="flex items-center gap-2 text-sm">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs"
                style={{
                  background: d
                    ? `linear-gradient(135deg, ${s.gold}, ${s.goldDark})`
                    : "#1a1a2e",
                  color: d ? s.bg : "#fff",
                  boxShadow: d
                    ? "0 2px 8px rgba(212,175,55,0.3), inset 0 1px 0 rgba(255,255,255,0.3)"
                    : "none",
                }}
              >
                {user?.firstName?.charAt(0) || "A"}
              </div>
              <span
                className="hidden sm:flex items-center gap-2 font-medium"
                style={{ color: d ? s.text : "#1a1a2e" }}
              >
                {user?.firstName} {user?.lastName}
                <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                  user?.adminRole === "super_admin"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                }`}>
                  {user?.adminRole === "super_admin" ? "Super Admin (owner)" : "Admin"}
                </span>
              </span>
            </div>
            <button
              onClick={() => { logout(); router.push("/login"); }}
              className="p-2 rounded-xl transition-all duration-200 hover:scale-105"
              style={{ color: d ? s.textMuted : "#666" }}
              title={t('admin.logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto pb-24 lg:pb-8 admin-main-scroll">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav — priority-based 5 items */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t safe-area-bottom"
        style={{
          background: d
            ? "rgba(26,18,48,0.95)"
            : "rgba(232,234,237,0.95)",
          borderColor: d ? s.sidebarBorder : "#d0d3d6",
        }}
      >
        <div className="flex items-center justify-around px-1 py-1">
          {(() => {
            const mobilePriority = [
              { href: "/admin", icon: LayoutDashboard, labelKey: "admin.nav.dashboard", perm: "overview.dashboard" },
              { href: "/admin/users", icon: Users, labelKey: "admin.nav.users", perm: "users.view" },
              { href: "/admin/verifications", icon: ShieldCheck, labelKey: "admin.nav.verifications", perm: "verifications.view" },
              { href: "/admin/complaints", icon: FileText, labelKey: "admin.nav.complaints", perm: "complaints.view" },
              { href: "/admin/books", icon: BookOpen, labelKey: "admin.nav.books", perm: "books.view" },
            ];
            const mobileItems = mobilePriority.filter((i) => hasPerm(i.perm));
            return mobileItems.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex flex-col items-center gap-0.5 py-2 px-2 relative rounded-xl"
                  style={{
                    color: active
                      ? d
                        ? s.gold
                        : "#1a1a2e"
                      : d
                      ? s.textMuted
                      : "#555",
                  }}
                >
                  {active && (
                    <div
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full"
                      style={{
                        background: d
                          ? `linear-gradient(90deg, ${s.gold}, ${s.goldLight})`
                          : "#1a1a2e",
                      }}
                    />
                  )}
                  <div className="relative">
                    <link.icon className="w-5 h-5" />
                    {badgeForHref(link.href) !== null && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-[8px] font-bold px-0.5 leading-none"
                        style={{
                          background: d
                            ? "linear-gradient(135deg, #ef4444, #dc2626)"
                            : "#dc2626",
                          color: "#fff",
                          boxShadow: d
                            ? "0 2px 4px rgba(239,68,68,0.4)"
                            : "0 1px 2px rgba(0,0,0,0.2)",
                        }}>
                        {badgeForHref(link.href)}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{t(link.labelKey)}</span>
                </Link>
              );
            });
          })()}
        </div>
      </nav>
    </div>
  );
}