"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import Button from "@/components/common/Button";
import NotificationBell from "@/components/notifications/NotificationBell";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/matches", label: "Matches" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem("accessToken"));
  }, []);

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
          ? "bg-white/80 backdrop-blur-xl border-b border-charcoal-100/50 shadow-soft"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <Image src="/images/logo.png" alt="Ethio Nikah" width={48} height={48} className="rounded-xl border-2 border-accent ring-2 ring-charcoal-900 transition-transform duration-300 group-hover:scale-105" />
            <span className="font-display font-bold text-xl text-charcoal-900 [-webkit-text-stroke:0.5px_#D4AF37]">
              Ethio <span className="text-accent [-webkit-text-stroke:0.5px_#111]">Nikah</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative font-medium text-sm transition-colors after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full",
                  scrolled ? "text-charcoal-600 hover:text-charcoal-900" : "text-white/80 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <NotificationBell />
            {isAuthenticated ? (
              <>
                <Link href="/matches">
                  <Button variant="ghost" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => { localStorage.removeItem("accessToken"); localStorage.removeItem("refreshToken"); localStorage.removeItem("user"); window.location.href = "/"; }}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("transition-all duration-300", scrolled ? "" : "text-white/80 hover:text-white hover:bg-white/10")}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm" className="shadow-glow hover:shadow-glow-lg transition-shadow duration-300">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          <button
            aria-label={isOpen ? "Close menu" : "Open menu"}
            className={cn(
              "md:hidden relative z-50 p-2.5 rounded-xl transition-all duration-300",
              scrolled
                ? "hover:bg-charcoal-100 text-charcoal-700"
                : "hover:bg-white/10 text-white"
            )}
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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 top-0 z-40 bg-charcoal-900/60 backdrop-blur-md flex items-start justify-center pt-24"
            onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-[90%] max-w-sm bg-white/95 backdrop-blur-xl rounded-2xl shadow-elevated border border-charcoal-100/60 overflow-hidden"
            >
              <div className="px-5 pt-6 pb-2">
                <div className="flex items-center gap-3 mb-6">
                  <Image src="/images/logo.png" alt="Ethio Nikah" width={40} height={40} className="rounded-lg border border-accent/30" />
                  <div>
                    <p className="font-display font-bold text-charcoal-900">Ethio Nikah</p>
                    <p className="text-xs text-charcoal-400">Premium Islamic Matchmaking</p>
                  </div>
                </div>
                <div className="space-y-1">
                  {navLinks.map((link, i) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                    >
                      <Link
                        href={link.href}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-charcoal-700 hover:bg-accent/10 hover:text-accent font-medium transition-all duration-200 group"
                        onClick={() => setIsOpen(false)}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-accent/30 group-hover:bg-accent transition-colors" />
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="px-5 py-4 bg-charcoal-50/80 border-t border-charcoal-100/50 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-charcoal-500 font-medium">Theme</span>
                  <ThemeToggle />
                </div>
                <Link href="/login" className="block" onClick={() => setIsOpen(false)}>
                  <Button variant="secondary" className="w-full">Sign In</Button>
                </Link>
                <Link href="/register" className="block" onClick={() => setIsOpen(false)}>
                  <Button variant="primary" className="w-full shadow-glow">Get Started</Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
