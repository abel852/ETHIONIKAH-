"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Users, Shield, Settings, Activity,
  LogOut, Sun, Moon, ChevronDown,
  FileText, CreditCard, BarChart3,
  ShieldAlert, Sliders, Puzzle, Bot,
  Globe, HeartHandshake, UserCheck,
  Flag, Scale, Bell, Menu,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "@/components/notifications/NotificationBell";

const navSections = [
  {
    label: "Main",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/admin/activity", icon: Activity, label: "Activity" },
      { href: "/admin/users", icon: Users, label: "Users" },
      { href: "/admin/admins", icon: Shield, label: "Admins" },
      { href: "/admin/verifications", icon: Shield, label: "Verifications" },
    ],
  },
  {
    label: "Community",
    items: [
      { href: "/admin/complaints", icon: FileText, label: "Complaints" },
      { href: "/admin/reports", icon: Flag, label: "Reports" },
      { href: "/admin/community", icon: UserCheck, label: "Community Oversight" },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/admin/payments", icon: CreditCard, label: "Payments" },
      { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
      { href: "/admin/affiliates", icon: HeartHandshake, label: "Affiliates" },
      { href: "/admin/promotions", icon: FileText, label: "Promotions" },
    ],
  },
  {
    label: "Security",
    items: [
      { href: "/admin/security", icon: ShieldAlert, label: "Security" },
      { href: "/admin/audit-logs", icon: Activity, label: "Audit Logs" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings", icon: Sliders, label: "System Settings" },
      { href: "/admin/feature-toggles", icon: Puzzle, label: "Feature Toggles" },
      { href: "/admin/integrations", icon: Globe, label: "Integrations" },
      { href: "/admin/ai-automation", icon: Bot, label: "AI & Automation" },
    ],
  },
];

const allNavItems = navSections.flatMap((s) => s.items);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(navSections.map((s) => s.label));

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

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

  const toggleSection = (label: string) => {
    setExpandedSections((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#1a1a2e]">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden bg-black/30 dark:bg-black/50" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col w-[260px] transition-all duration-300 shadow-sm bg-[#e8eaed] dark:bg-[#2e2e42] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-[#d0d3d6] dark:border-[#3d3d55]">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-lg font-bold text-[#1a1a2e] dark:text-white">Ethio Nikah</span>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md text-[#e8eaed] dark:text-[#2e2e42] bg-[#1a1a2e] dark:bg-white">ADMIN</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
          {navSections.map((section) => {
            const sectionOpen = expandedSections.includes(section.label);
            const sectionActive = section.items.some((i) => isActive(i.href));
            return (
              <div key={section.label}>
                <button
                  onClick={() => toggleSection(section.label)}
                  className="flex items-center justify-between w-full px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#777] dark:text-[#999] hover:text-[#1a1a2e] dark:hover:text-white transition-colors"
                >
                  {section.label}
                  <ChevronDown className={`w-3 h-3 transition-transform ${sectionOpen ? "rotate-0" : "-rotate-90"}`} />
                </button>
                {sectionOpen && (
                  <div className="mt-1 space-y-0.5">
                    {section.items.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            active
                              ? "bg-[#1a1a2e] dark:bg-white text-white dark:text-[#2e2e42]"
                              : "text-[#1a1a2e] dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
                          }`}
                        >
                          <item.icon className="w-4.5 h-4.5 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Toggle */}
        <div className="px-4 py-3 border-t border-[#d0d3d6] dark:border-[#3d3d55]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#555] dark:text-[#b0b0c0]">Dark Mode</span>
            <button
              onClick={toggleDark}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${dark ? "bg-white" : "bg-[#bbb]"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-sm bg-white flex items-center justify-center transition-transform duration-200 ${dark ? "translate-x-[20px]" : "translate-x-0"}`}>
                {dark ? <Moon className="w-3 h-3 text-[#2e2e42]" /> : <Sun className="w-3 h-3 text-amber-500" />}
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1a1a2e]">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 shadow-sm bg-[#e8eaed] dark:bg-[#2e2e42]">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-[#1a1a2e] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden lg:block">
              <div className="relative">
                <input type="text" placeholder="Search anything..." className="w-64 pl-9 pr-3 py-1.5 text-sm rounded-lg bg-white/80 dark:bg-[#1a1a2e]/80 border border-[#d0d3d6] dark:border-[#3d3d55] text-[#1a1a2e] dark:text-white placeholder-[#999] dark:placeholder-[#777] focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]/20 dark:focus:ring-white/20" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <button onClick={toggleDark} className="lg:hidden relative w-9 h-5 rounded-full transition-colors duration-200 ${dark ? 'bg-white' : 'bg-[#bbb]'}">
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow-sm bg-white flex items-center justify-center transition-transform duration-200 ${dark ? 'translate-x-[14px]' : 'translate-x-0'}`}>
                {dark ? <Moon className="w-2.5 h-2.5 text-[#2e2e42]" /> : <Sun className="w-2.5 h-2.5 text-amber-500" />}
              </span>
            </button>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-[#1a1a2e] flex items-center justify-center text-white font-semibold text-xs">
                {user?.firstName?.charAt(0) || "A"}
              </div>
              <span className="hidden sm:block font-medium text-[#1a1a2e] dark:text-white">
                {user?.firstName} {user?.lastName}
              </span>
            </div>
            <button onClick={() => { logout(); router.push("/login"); }}
              className="p-2 rounded-lg text-[#1a1a2e] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors" title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto pb-24 lg:pb-6">{children}</main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#e8eaed]/95 dark:bg-[#2e2e42]/95 backdrop-blur-xl border-t border-[#d0d3d6] dark:border-[#3d3d55] safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1 overflow-x-auto">
          {allNavItems.slice(0, 5).map((link) => {
            const active = isActive(link.href);
            return (
              <Link key={link.href} href={link.href}
                className={`flex flex-col items-center gap-0.5 py-2 px-2 relative rounded-xl ${
                  active ? "text-[#1a1a2e] dark:text-white" : "text-[#555] dark:text-[#b0b0c0]"
                }`}
              >
                {active && (
                  <motion.div layoutId="admin-nav-pill" className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-[#1a1a2e] dark:bg-white" />
                )}
                <link.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
