"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import {
  User, Heart, MessageCircle,
  Settings, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, VerifiedBadge } from "@/components/common";
import { useAuth } from "@/context/AuthContext";
import { mediaUrl } from "@/lib/utils";
import NotificationBell from "@/components/notifications/NotificationBell";

const mainNav = [
  { href: "/matches", label: "Matches", icon: Heart, requiresVerification: false },
  { href: "/profile", label: "Profile", icon: User, requiresVerification: false },
  { href: "/messages", label: "Messages", icon: MessageCircle, requiresVerification: true },
  { href: "/settings", label: "Settings", icon: Settings, requiresVerification: false },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const isVerified = user?.verificationStatus === "verified";

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 bg-white/95 dark:bg-charcoal-900/95 backdrop-blur-xl border-b border-charcoal-100/50 dark:border-charcoal-800">
        <Link href="/matches" className="flex items-center gap-2">
          <Image src="/images/logo.png" alt="Ethio Nikah" width={32} height={32} className="rounded-lg shrink-0 border border-accent" />
          <span className="font-display font-bold text-base text-charcoal-900 dark:text-white">Ethio Nikah</span>
        </Link>
        <NotificationBell />
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-charcoal-900/95 backdrop-blur-xl border-t border-charcoal-100/50 dark:border-charcoal-800 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1">
          {mainNav.map((link) => {
            const isActive = pathname === link.href;
            const disabled = link.requiresVerification && !isVerified;
            return disabled ? (
              <div key={link.href} className="flex flex-col items-center gap-0.5 py-2 px-3 opacity-40">
                <link.icon className="w-5 h-5 text-charcoal-400" />
                <span className="text-[10px] text-charcoal-400 font-medium">{link.label}</span>
              </div>
            ) : (
              <Link key={link.href} href={link.href} className={cn(
                "flex flex-col items-center gap-0.5 py-2 px-3 relative rounded-xl",
                isActive ? "text-accent bg-accent/10" : "text-charcoal-400"
              )}>
                {isActive && (
                  <motion.div layoutId="nav-pill" className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-accent" />
                )}
                <link.icon className={cn("w-5 h-5", isActive && "text-accent")} fill={isActive ? "#D4AF37" : "none"} />
                <span className={cn("text-[10px]", isActive ? "font-bold" : "font-medium")}>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-full w-64 bg-white/90 dark:bg-charcoal-900/90 backdrop-blur-xl border-r border-charcoal-100/50 dark:border-charcoal-800 z-40 flex-col">
        <div className="flex items-center justify-between p-4 border-b border-charcoal-100/50 dark:border-charcoal-800">
          <Link href="/matches" className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="Ethio Nikah" width={40} height={40} className="rounded-xl shrink-0 border-2 border-accent ring-2 ring-charcoal-900" />
            <span className="font-display font-bold text-lg text-charcoal-900 dark:text-white [-webkit-text-stroke:0.5px_#D4AF37]">
              Ethio <span className="text-accent [-webkit-text-stroke:0.5px_#111]">Nikah</span>
            </span>
          </Link>
          <NotificationBell />
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {mainNav.map((link) => {
            const isActive = pathname === link.href;
            const disabled = link.requiresVerification && !isVerified;
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
                <link.icon className={cn("w-5 h-5 shrink-0", isActive && !disabled ? "text-accent" : "")} />
                <span>{link.label}</span>
                {disabled && (
                  <span className="ml-auto text-[10px] text-charcoal-400 dark:text-charcoal-500 bg-charcoal-100 dark:bg-charcoal-700 px-1.5 py-0.5 rounded">Locked</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-charcoal-100/50 dark:border-charcoal-800 space-y-2">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs text-charcoal-400 font-medium">Theme</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-charcoal-50 dark:hover:bg-charcoal-800 transition-colors">
            <Avatar key={user?.photos?.[0] || "no-photo"} firstName={user?.firstName || "U"} lastName={user?.lastName || ""} size="sm" src={mediaUrl(user?.photos?.[0])} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-charcoal-900 dark:text-white truncate">{[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User"}</p>
                {user?.verificationStatus === "verified" && <VerifiedBadge />}
              </div>
              <p className="text-xs text-charcoal-500">{user?.isPremium ? "Premium Member" : user?.verificationStatus === "verified" ? "Verified" : "Unverified"}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 rounded-xl text-sm font-medium text-charcoal-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-all">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
