"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User, Heart, MessageCircle,
  Settings, LogOut, Lock, HelpCircle, Sparkles, Crown, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, VerifiedBadge } from "@/components/common";
import { useAuth } from "@/context/AuthContext";
import { mediaUrl } from "@/lib/utils";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useMessageStore } from "@/store/messages";
import { useI18n, type Lang } from "@/context/I18nContext";
import api from "@/lib/api";

export default function DashboardSidebar() {
  const { t, lang, setLang } = useI18n();
  const pathname = usePathname();

  const LANGS: { code: Lang; label: string }[] = [
    { code: "en", label: "EN" },
    { code: "am", label: "አማ" },
    { code: "ar", label: "ع" },
  ];
  const mainNav = [
    { href: "/matches", label: t('nav.matches'), icon: Heart, requiresVerification: false },
    { href: "/liked-interest", label: t('nav.liked'), icon: Sparkles, requiresVerification: true },
    { href: "/profile", label: t('nav.profile'), icon: User, requiresVerification: false },
    { href: "/messages", label: t('nav.messages'), icon: MessageCircle, requiresVerification: true },
    { href: "/settings", label: t('nav.settings'), icon: Settings, requiresVerification: false },
  ];
  const router = useRouter();
  const { user, logout } = useAuth();
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({});
  const [banInfo, setBanInfo] = useState<{ banned: boolean; expiresAt?: string; remainingLabel?: string } | null>(null);
  const conversations = useMessageStore((s) => s.conversations);
  const storeUnreadTotal = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const isVerified = user?.verificationStatus === "verified";

  const fetchBanInfo = async () => {
    try {
      const { data } = await api.get("/profile/ban-info");
      setBanInfo(data);
    } catch {}
  };

  const fetchBadgeCounts = async () => {
    try {
      const { data } = await api.get("/profile/badge-counts");
      setBadgeCounts(data.counts || {});
    } catch {}
  };

  useEffect(() => {
    fetchBadgeCounts();
    fetchBanInfo();
    const interval = setInterval(() => {
      if (document.hidden) return;
      fetchBadgeCounts();
      fetchBanInfo();
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  const allowedBannedRoutes = ["/complaints"];
  useEffect(() => {
    if (user?.isActive === false && !allowedBannedRoutes.includes(pathname)) {
      router.replace("/complaints");
    }
  }, [user?.isActive, pathname]);

  const badgeForHref = (href: string): number | null => {
    if (href === "/messages") {
      const total = storeUnreadTotal > 0 ? storeUnreadTotal : (badgeCounts["messages"] || 0);
      return total > 0 ? total : null;
    }
    if (href === "/matches") {
      return badgeCounts["matches"] > 0 ? badgeCounts["matches"] : null;
    }
    return null;
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const isBanned = user?.isActive === false;

  return (
    <>
      {/* Banned Banner */}
      {isBanned && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-red-600 text-white text-center text-sm font-medium py-2.5 px-4 shadow-lg">
          {t('nav.banned')}{banInfo?.remainingLabel ? ` for ${banInfo.remainingLabel}` : ` ${t('nav.bannedPermanently')}`}.
          <Link href="/complaints" className="underline font-semibold mx-1 hover:text-red-100">{t('nav.submitComplaint')}</Link> {t('nav.toContactAdmins')}.
        </div>
      )}

      {/* Mobile Top Bar — hidden on messages page for full-screen chat */}
      {pathname !== "/messages" && (
      <div className={`lg:hidden fixed ${isBanned ? "top-[40px]" : "top-0"} left-0 right-0 z-50 flex items-center justify-between px-4 h-14 bg-white/95 dark:bg-charcoal-900/95 backdrop-blur-xl border-b border-charcoal-100/50 dark:border-charcoal-800`}>
        <div className="flex items-center gap-2">
          <Image src="/images/logo.png" alt="Ethio Nikah" width={32} height={32} className="rounded-lg shrink-0 border border-accent" />
          <span className="font-display font-bold text-base text-charcoal-900 dark:text-white">Ethio Nikah</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5">
            {LANGS.map((l, i) => (
              <div key={l.code} className="flex items-center">
                {i > 0 && <span className="text-charcoal-200 dark:text-charcoal-600">|</span>}
                <button
                  onClick={() => setLang(l.code)}
                  className={cn(
                    "px-2 py-0.5 text-sm font-medium rounded-md transition-all",
                    lang === l.code ? "text-accent font-bold" : "text-charcoal-500 dark:text-charcoal-400"
                  )}
                >
                  {l.label}
                </button>
              </div>
            ))}
          </div>
          {!isBanned && <NotificationBell />}
        </div>
      </div>
      )}

      {/* Mobile Bottom Nav — 5 clean items: Matches, Liked, Messages, Books, Profile */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] pt-2 ${pathname === "/messages" || pathname.startsWith("/messages/") ? "hidden" : ""}`}>
        <div className="mx-auto max-w-sm flex items-center justify-around rounded-[22px] bg-[#111827]/80 backdrop-blur-xl border border-[#2D2D2D]/60 shadow-lg shadow-black/30 px-2 py-2">
          {/* Matches */}
          {!isBanned && (
            <Link href="/matches" className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 relative rounded-xl transition-colors hover:bg-[#2D2D2D]/40",
              pathname === "/matches" ? "text-[#D4AF37]" : "text-[#8B8B8B]"
            )}>
              <div className="relative">
                <Heart className={cn("w-5 h-5", pathname === "/matches" && "text-[#D4AF37]")} fill={pathname === "/matches" ? "#D4AF37" : "none"} />
                {pathname === "/matches" && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#D4AF37]" />}
                {badgeForHref("/matches") !== null && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-[8px] font-bold px-0.5 leading-none bg-red-500 text-white shadow-md">
                    {badgeForHref("/matches")}
                  </span>
                )}
              </div>
              <span className={cn("text-[10px]", pathname === "/matches" ? "font-bold text-[#D4AF37]" : "font-medium")}>{t('nav.matches')}</span>
              {pathname === "/matches" && <span className="absolute -bottom-0.5 h-0.5 w-6 rounded-full bg-[#D4AF37]" />}
            </Link>
          )}

          {/* Liked / Interests */}
          {!isBanned && (() => {
            const likedActive = pathname === "/liked-interest";
            const likedDisabled = !isVerified;
            return likedDisabled ? (
              <div className="flex flex-col items-center gap-0.5 px-3 py-1 opacity-40 cursor-not-allowed">
                <div className="relative">
                  <Sparkles className="w-5 h-5 text-[#8B8B8B]" />
                  <Lock className="absolute -top-1 -right-1.5 w-2.5 h-2.5 text-[#8B8B8B]" />
                </div>
                <span className="text-[10px] text-[#8B8B8B] font-medium">{t('nav.liked')}</span>
              </div>
            ) : (
              <Link href="/liked-interest" className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 relative rounded-xl transition-colors hover:bg-[#2D2D2D]/40",
                likedActive ? "text-[#D4AF37]" : "text-[#8B8B8B]"
              )}>
                <div className="relative">
                  <Sparkles className={cn("w-5 h-5", likedActive && "text-[#D4AF37]")} />
                  {likedActive && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#D4AF37]" />}
                </div>
                <span className={cn("text-[10px]", likedActive ? "font-bold text-[#D4AF37]" : "font-medium")}>{t('nav.liked')}</span>
                {likedActive && <span className="absolute -bottom-0.5 h-0.5 w-6 rounded-full bg-[#D4AF37]" />}
              </Link>
            );
          })()}

          {/* Messages */}
          {!isBanned && (() => {
            const msgActive = pathname === "/messages" || pathname.startsWith("/messages/");
            const msgDisabled = !isVerified;
            return msgDisabled ? (
              <div className="flex flex-col items-center gap-0.5 px-3 py-1 opacity-40 cursor-not-allowed">
                <div className="relative">
                  <MessageCircle className="w-5 h-5 text-[#8B8B8B]" />
                  <Lock className="absolute -top-1 -right-1.5 w-2.5 h-2.5 text-[#8B8B8B]" />
                </div>
                <span className="text-[10px] text-[#8B8B8B] font-medium">{t('nav.messages')}</span>
              </div>
            ) : (
              <Link href="/messages" className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 relative rounded-xl transition-colors hover:bg-[#2D2D2D]/40",
                msgActive ? "text-[#D4AF37]" : "text-[#8B8B8B]"
              )}>
                <div className="relative">
                  <MessageCircle className={cn("w-5 h-5", msgActive && "text-[#D4AF37]")} />
                  {msgActive && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#D4AF37]" />}
                  {badgeForHref("/messages") !== null && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-[8px] font-bold px-0.5 leading-none bg-red-500 text-white shadow-md">
                      {badgeForHref("/messages")}
                    </span>
                  )}
                </div>
                <span className={cn("text-[10px]", msgActive ? "font-bold text-[#D4AF37]" : "font-medium")}>{t('nav.messages')}</span>
                {msgActive && <span className="absolute -bottom-0.5 h-0.5 w-6 rounded-full bg-[#D4AF37]" />}
              </Link>
            );
          })()}

          {/* Books */}
          {!isBanned && (
            <Link href="/books" className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 relative rounded-xl transition-colors hover:bg-[#2D2D2D]/40",
              pathname === "/books" || pathname.startsWith("/books/") ? "text-[#D4AF37]" : "text-[#8B8B8B]"
            )}>
              <div className="relative">
                <BookOpen className={cn("w-5 h-5", (pathname === "/books" || pathname.startsWith("/books/")) && "text-[#D4AF37]")} />
                {(pathname === "/books" || pathname.startsWith("/books/")) && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#D4AF37]" />}
              </div>
              <span className={cn("text-[10px]", (pathname === "/books" || pathname.startsWith("/books/")) ? "font-bold text-[#D4AF37]" : "font-medium")}>{t('nav.books')}</span>
              {(pathname === "/books" || pathname.startsWith("/books/")) && <span className="absolute -bottom-0.5 h-0.5 w-6 rounded-full bg-[#D4AF37]" />}
            </Link>
          )}

          {/* Profile */}
          {!isBanned ? (
            <Link href="/profile" className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 relative rounded-xl transition-colors hover:bg-[#2D2D2D]/40",
              pathname === "/profile" || pathname.startsWith("/profile/") ? "text-[#D4AF37]" : "text-[#8B8B8B]"
            )}>
              <div className="relative">
                <User className={cn("w-5 h-5", (pathname === "/profile" || pathname.startsWith("/profile/")) && "text-[#D4AF37]")} />
                {(pathname === "/profile" || pathname.startsWith("/profile/")) && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#D4AF37]" />}
              </div>
              <span className={cn("text-[10px]", (pathname === "/profile" || pathname.startsWith("/profile/")) ? "font-bold text-[#D4AF37]" : "font-medium")}>{t('nav.profile')}</span>
              {(pathname === "/profile" || pathname.startsWith("/profile/")) && <span className="absolute -bottom-0.5 h-0.5 w-6 rounded-full bg-[#D4AF37]" />}
            </Link>
          ) : (
            <Link href="/complaints" className="flex flex-col items-center gap-0.5 px-3 py-1 relative rounded-xl text-[#D4AF37]">
              <HelpCircle className="w-5 h-5" />
              <span className="text-[10px] font-medium">{t('settings.help')}</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-white/95 via-pink-50/30 to-amber-50/30 dark:from-charcoal-900/95 dark:via-charcoal-900/90 dark:to-charcoal-900/95 backdrop-blur-xl border-r border-amber-100/50 dark:border-charcoal-800 z-40 flex-col">
        <div className="flex items-center justify-between p-4 border-b border-charcoal-100/50 dark:border-charcoal-800">
          <div className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="Ethio Nikah" width={40} height={40} className={`rounded-xl shrink-0 border-2 border-accent ring-2 ring-charcoal-900 ${isBanned ? "grayscale opacity-50" : ""}`} />
            <span className="font-display font-bold text-lg text-charcoal-900 dark:text-white [-webkit-text-stroke:0.5px_#D4AF37]">
              Ethio <span className="text-accent [-webkit-text-stroke:0.5px_#111]">Nikah</span>
            </span>
          </div>
          {!isBanned && <NotificationBell />}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {mainNav.map((link) => {
            const isActive = pathname === link.href;
            const disabled = (link.requiresVerification && !isVerified) || isBanned;
            return (
              <Link
                key={link.href}
                href={disabled ? "#" : link.href}
                onClick={(e) => { if (disabled) e.preventDefault(); }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  disabled
                    ? "text-charcoal-300 dark:text-charcoal-600 cursor-not-allowed"
                    : isActive
                      ? "bg-accent/10 text-accent-dark"
                      : "text-charcoal-600 dark:text-charcoal-400 hover:bg-charcoal-50 dark:hover:bg-charcoal-800 hover:text-charcoal-900 dark:hover:text-white"
                )}
              >
                <div className="relative shrink-0">
                  <link.icon className={cn("w-5 h-5", isActive && !disabled ? "text-accent" : "")} />
                  {disabled && <Lock className="absolute -top-1 -right-1.5 w-2.5 h-2.5 text-charcoal-400" />}
                </div>
                <span className="flex-1">{link.label}</span>
                {badgeForHref(link.href) !== null && !disabled && (
                  <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1 leading-none bg-red-500 text-white shadow-md">
                    {badgeForHref(link.href)}
                  </span>
                )}
                {disabled && (
                  <span className="ml-1 text-[10px] text-charcoal-400 dark:text-charcoal-500 bg-charcoal-100 dark:bg-charcoal-700 px-1.5 py-0.5 rounded">{t('nav.locked')}</span>
                )}
              </Link>
            );
          })}
          {isBanned && (
            <Link
              href="/complaints"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-accent hover:bg-accent/10"
            >
              <HelpCircle className="w-5 h-5 shrink-0" />
              <span className="flex-1">{t('settings.help')}</span>
            </Link>
          )}
          {!isBanned && (
            <Link
              href="/membership"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                pathname === "/membership"
                  ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-md"
                  : "bg-gradient-to-r from-amber-400/10 to-yellow-500/10 text-accent-dark dark:text-accent-light hover:from-amber-400/20 hover:to-yellow-500/20"
              )}
            >
              <Crown className="w-5 h-5 shrink-0" />
              <span className="flex-1">{user?.isPremium ? t('nav.membership') : t('nav.upgrade')}</span>
              {!user?.isPremium && (
                <span className="text-[10px] font-bold bg-accent text-white px-1.5 py-0.5 rounded">{t('nav.pro')}</span>
              )}
            </Link>
          )}
          {!isBanned && (
            <Link
              href="/books"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                pathname === "/books" || pathname.startsWith("/books/")
                  ? "bg-accent/10 text-accent-dark"
                  : "text-charcoal-600 dark:text-charcoal-400 hover:bg-charcoal-50 dark:hover:bg-charcoal-800 hover:text-charcoal-900 dark:hover:text-white"
              )}
            >
              <BookOpen className="w-5 h-5 shrink-0" />
              <span className="flex-1">{t('nav.books')}</span>
            </Link>
          )}
        </nav>

        <div className="p-3 border-t border-charcoal-100/50 dark:border-charcoal-800 space-y-2">
          <div className="flex items-center justify-center gap-0.5 py-1">
            {LANGS.map((l, i) => (
              <div key={l.code} className="flex items-center">
                {i > 0 && <span className="text-charcoal-200 dark:text-charcoal-600">|</span>}
                <button
                  onClick={() => setLang(l.code)}
                  className={cn(
                    "px-2.5 py-1 text-sm font-medium rounded-md transition-all",
                    lang === l.code ? "text-accent font-bold" : "text-charcoal-500 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:text-white"
                  )}
                >
                  {l.label}
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-charcoal-50 dark:hover:bg-charcoal-800 transition-colors">
            <Avatar key={user?.photos?.[0] || "no-photo"} firstName={user?.firstName || "U"} lastName={user?.lastName || ""} size="sm" src={mediaUrl(user?.photos?.[0])} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-charcoal-900 dark:text-white truncate">{[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User"}</p>
                {user?.verificationStatus === "verified" && <VerifiedBadge />}
              </div>
              <p className="text-xs text-charcoal-500">{user?.isPremium ? t('nav.premiumMember') : user?.verificationStatus === "verified" ? t('nav.verified') : t('nav.unverified')}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 rounded-xl text-sm font-medium text-charcoal-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-all">
            <LogOut className="w-5 h-5" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>
    </>
  );
}
