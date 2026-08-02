"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, LogOut, Download, Home, Users, Sparkles, Compass, Heart,
  ShieldCheck, MessageSquare, BadgeCheck, ChevronRight, Gem,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/common/Button";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useI18n, type Lang } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

const LANGUAGES: { code: Lang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "am", label: "አማ" },
  { code: "ar", label: "ع" },
];

function LanguageSwitcher({ scrolled }: { scrolled: boolean }) {
  const { lang, setLang } = useI18n();

  return (
    <div className="flex items-center gap-0.5">
      {LANGUAGES.map((l, i) => (
        <div key={l.code} className="flex items-center">
          {i > 0 && (
            <span className={scrolled ? "text-charcoal-200" : "text-white/20"}>|</span>
          )}
          <button
            onClick={() => setLang(l.code)}
            className={cn(
              "px-2 py-1 text-sm font-medium rounded-md transition-all duration-150",
              lang === l.code
                ? "text-accent font-bold"
                : scrolled
                  ? "text-charcoal-500 hover:text-charcoal-900 hover:bg-charcoal-100"
                  : "text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            {l.label}
          </button>
        </div>
      ))}
    </div>
  );
}

export default function Navbar() {
  const { t } = useI18n();
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const navLinks = [
    { href: "/", label: t("nav.home"), icon: Home },
    { href: "/matches", label: t("nav.matches"), icon: Users },
    { href: "/#features", label: t("nav.features"), icon: Sparkles },
    { href: "/#journey", label: t("nav.journey"), icon: Compass },
    { href: "/#why-join", label: t("nav.whyJoin"), icon: Heart },
  ];
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [appInstalled, setAppInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const installedHandler = () => {
      setAppInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setAppInstalled(true);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setAppInstalled(true);
    }
    setInstallPrompt(null);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-transparent backdrop-blur-2xl border-b border-accent/10"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-[110]">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <Image src="/application.png" alt="Ethio Nikah" width={48} height={48} className="rounded-xl border-2 border-accent ring-2 ring-charcoal-900 transition-transform duration-300 group-hover:scale-105" />
            <span className="font-cursive font-bold text-2xl text-white [-webkit-text-stroke:0.5px_#D4AF37]">
              Ethio <span className="text-accent [-webkit-text-stroke:0.5px_#fff]">Nikah</span>
            </span>
          </Link>

          <div className="hidden xl:flex items-center gap-5">
            {navLinks.map((link, i) => (
              <div key={link.href} className="flex items-center gap-5">
                {i > 0 && <span className="text-accent/20 text-xs">|</span>}
                <Link
                  href={link.href}
                  className={cn(
                    "relative font-medium text-sm font-cursive transition-colors after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full text-white [-webkit-text-stroke:0.4px_#D4AF37] hover:text-accent"
                  )}
                >
                  {link.label}
                </Link>
              </div>
            ))}
          </div>

          <div className="hidden xl:flex items-center gap-3">
            <LanguageSwitcher scrolled={scrolled} />
            {isAuthenticated && <NotificationBell />}
            {isAuthenticated ? (
              <>
                <Link href="/matches">
                  <Button variant="ghost" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    {t('nav.profile')}
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => { logout(); window.location.href = "/"; }}>
                  <LogOut className="w-4 h-4 mr-2" />
                    {t('nav.logout')}
                  </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="md"
                    className={cn("font-cursive font-semibold text-sm px-5 py-2 transition-all duration-300 text-white [-webkit-text-stroke:0.3px_#D4AF37] hover:text-accent")}
                  >
                    {t('nav.signIn')}
                  </Button>
                </Link>
                {installPrompt && !appInstalled && (
                  <button
                    onClick={handleInstallApp}
                    className="xl:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#D4AF37] to-[#B8860B] shadow-md shadow-[#D4AF37]/20 hover:shadow-lg hover:shadow-[#D4AF37]/30 hover:scale-105 active:scale-95 transition-all duration-200"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden lg:inline">{t("nav.downloadApp")}</span>
                  </button>
                )}
                <Link href="/register">
                  <Button variant="primary" size="md" className={cn("font-cursive font-semibold text-sm px-5 py-2 shadow-glow hover:shadow-glow-lg transition-shadow duration-300", scrolled && "[-webkit-text-stroke:0.3px_#fff]")}>{t('nav.getStarted')}</Button>
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 xl:hidden">
            <LanguageSwitcher scrolled={scrolled} />
            <button
              aria-label={isOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              className="relative z-[120] p-2.5 rounded-xl bg-[#0F0F12]/80 backdrop-blur-md border border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#0F0F12] hover:border-[#D4AF37]/40 transition-all duration-300 shadow-lg"
              onClick={() => setIsOpen(!isOpen)}
            >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          </div>
        </div>
      </div>

      {typeof document !== "undefined" && createPortal(
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="xl:hidden fixed inset-0 top-0 z-[100] bg-black/80 backdrop-blur-lg flex items-start justify-center pt-20 overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-[92%] max-w-[400px] bg-[#0F0F12] rounded-[24px] border border-[#D4AF37]/15 shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden my-2"
            >
              {/* Subtle Islamic pattern overlay */}
              <div className="absolute inset-0 islamic-pattern opacity-[0.025] pointer-events-none" />
              {/* Ambient gold glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[80px] bg-[#D4AF37]/8 blur-[60px] rounded-full pointer-events-none" />

              {/* ── Header ── */}
              <div className="relative px-6 pt-7 pb-5 text-center">
                <div className="relative inline-block mb-3">
                  <div className="absolute inset-0 bg-[#D4AF37]/15 blur-xl rounded-full" />
                  <Image src="/application.png" alt="EthioNikah" width={56} height={56} className="relative rounded-2xl border-2 border-[#D4AF37]/40 ring-1 ring-white/5 shadow-lg mx-auto" />
                </div>
                <h2 className="font-cursive text-2xl font-bold text-white tracking-wide">
                  Ethio<span className="text-[#D4AF37]">Nikah</span>
                </h2>
                <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed px-4">
                  {t("app.tagline")}
                </p>
              </div>

              {/* ── Gold divider with ornament ── */}
              <div className="flex items-center gap-3 px-6 pb-1">
                <span className="flex-1 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/25 to-[#D4AF37]/40" />
                <Gem className="w-3 h-3 text-[#D4AF37]/50" />
                <span className="flex-1 h-px bg-gradient-to-l from-transparent via-[#D4AF37]/25 to-[#D4AF37]/40" />
              </div>

              {/* ── Navigation ── */}
              <div className="relative px-4 py-3 space-y-1">
                {navLinks.map((link, i) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 + i * 0.04, duration: 0.3 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "relative flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 group",
                          isActive
                            ? "bg-gradient-to-r from-[#D4AF37]/12 to-transparent"
                            : "hover:bg-white/[0.03] hover:shadow-sm"
                        )}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="activeIndicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-full bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                          />
                        )}
                        <Icon
                          className={cn(
                            "w-[18px] h-[18px] transition-colors duration-200",
                            isActive ? "text-[#D4AF37]" : "text-white/35 group-hover:text-[#D4AF37]/70"
                          )}
                        />
                        <span
                          className={cn(
                            "flex-1 text-[15px] font-semibold transition-colors duration-200",
                            isActive ? "text-[#D4AF37]" : "text-white/60 group-hover:text-white"
                          )}
                        >
                          {link.label}
                        </span>
                        <ChevronRight
                          className={cn(
                            "w-4 h-4 transition-all duration-200",
                            isActive ? "text-[#D4AF37]/60" : "text-white/15 group-hover:text-[#D4AF37]/40 group-hover:translate-x-0.5"
                          )}
                        />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* ── Trust card ── */}
              <div className="relative px-4 pb-4">
                <div className="bg-white/[0.02] border border-[#D4AF37]/10 rounded-2xl p-3.5 backdrop-blur-sm">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: BadgeCheck, title: t("nav.trustVerified"), desc: t("nav.trustMembers") },
                      { icon: ShieldCheck, title: t("nav.trustSecure"), desc: t("nav.trustMessaging") },
                      { icon: Gem, title: t("nav.trustSharia"), desc: t("nav.trustCompliant") },
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div key={i} className="flex flex-col items-center text-center px-1">
                          <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/8 border border-[#D4AF37]/15 flex items-center justify-center mb-1.5">
                            <Icon className="w-4 h-4 text-[#D4AF37]" />
                          </div>
                          <p className="text-[11px] font-bold text-white/80 leading-tight">{item.title}</p>
                          <p className="text-[9px] text-white/35 leading-tight mt-0.5">{item.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── CTA section ── */}
              <div className="relative px-5 pb-6 pt-1">
                <Link href="/register" className="block" onClick={() => setIsOpen(false)}>
                  <button className="w-full py-3.5 rounded-2xl text-base font-bold text-[#0F0F12] bg-gradient-to-r from-[#D4AF37] via-[#E5C24A] to-[#B8860B] shadow-[0_8px_24px_rgba(212,175,55,0.25)] hover:shadow-[0_12px_32px_rgba(212,175,55,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
                    {t('nav.getStarted')}
                  </button>
                </Link>
                <Link href="/login" className="block mt-2.5" onClick={() => setIsOpen(false)}>
                  <button className="w-full py-3.5 rounded-2xl text-base font-semibold text-[#D4AF37] border border-[#D4AF37]/25 hover:bg-[#D4AF37]/8 hover:border-[#D4AF37]/40 transition-all duration-300">
                    {t('nav.signIn')}
                  </button>
                </Link>

                {/* OR divider */}
                <div className="flex items-center gap-3 my-4">
                  <span className="flex-1 h-px bg-white/8" />
                  <span className="text-[10px] font-medium text-white/25 tracking-widest uppercase">{t("nav.or")}</span>
                  <span className="flex-1 h-px bg-white/8" />
                </div>

                {/* Download app */}
                {installPrompt && !appInstalled ? (
                  <button
                    onClick={() => { handleInstallApp(); setIsOpen(false); }}
                    className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.03] transition-all duration-200"
                  >
                    <Download className="w-4 h-4 text-[#D4AF37]" />
                    <span>{t("nav.downloadApp")}</span>
                    <span className="text-white/20">·</span>
                    <span className="text-xs text-white/30">{t("nav.downloadAppMobile")}</span>
                  </button>
                ) : !appInstalled ? (
                  <div className="flex flex-col items-center gap-1 py-2">
                    <div className="flex items-center gap-2 text-white/40">
                      <Download className="w-3.5 h-3.5 text-[#D4AF37]/60" />
                      <span className="text-xs font-medium">{t("nav.downloadApp")}</span>
                    </div>
                    <p className="text-[10px] text-white/25">{t("nav.downloadAppMobileShare")}</p>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      , document.body)}
    </nav>
  );
}
