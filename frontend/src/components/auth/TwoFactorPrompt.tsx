"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, X, ArrowRight, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import api from "@/lib/api";

const SNOOZE_KEY = "twofa-prompt-snooze";
const SNOOZE_DAYS = 7;

export function TwoFactorPrompt() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setShow(false);
      return;
    }

    // Super admins are exempt from 2FA requirement
    if (user.adminRole === "super_admin") {
      setShow(false);
      return;
    }

    // Respect snooze
    const snoozedUntil = localStorage.getItem(SNOOZE_KEY);
    if (snoozedUntil && Date.now() < Number(snoozedUntil)) return;

    // Check 2FA status from backend
    let cancelled = false;
    api.get("/auth/2fa/status")
      .then(({ data }) => {
        if (!cancelled && !data.enabled) {
          // Delay so it appears calmly after page load
          setTimeout(() => { if (!cancelled) setShow(true); }, 1500);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthenticated, user]);

  const handleSnooze = () => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000));
    setShow(false);
  };

  const handleEnable = () => {
    setShow(false);
    // Redirect admins to admin settings security tab, regular users to user settings
    const targetPath = user?.role === "admin" 
      ? "/admin/settings?tab=security" 
      : "/settings?section=two-factor";
    router.push(targetPath);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-[90]"
        >
          <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-2xl border border-charcoal-100/50 dark:border-charcoal-700 overflow-hidden">
            <div className="flex items-start gap-3 p-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 dark:bg-accent/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-charcoal-900 dark:text-white">
                  {t('auth.2faOff')}
                </h3>
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5">
                  {t('auth.2faOffDesc')}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={handleEnable}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Lock className="w-3.5 h-3.5" /> {t('auth.enableNow')}
                  </button>
                  <button
                    onClick={handleSnooze}
                    className="text-xs text-charcoal-500 dark:text-charcoal-400 hover:text-charcoal-700 dark:hover:text-charcoal-200 font-medium"
                  >
                    {t('auth.remindLater')}
                  </button>
                </div>
              </div>
              <button onClick={handleSnooze} className="p-1 rounded-lg hover:bg-charcoal-100 dark:hover:bg-charcoal-700 transition-colors shrink-0">
                <X className="w-4 h-4 text-charcoal-400" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
