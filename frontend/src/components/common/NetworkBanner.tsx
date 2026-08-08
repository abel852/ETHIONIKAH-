"use client";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useI18n } from "@/context/I18nContext";
import { WifiOff } from "lucide-react";

export function NetworkBanner() {
  const isOnline = useNetworkStatus();
  const { t } = useI18n();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white text-center text-sm font-medium py-2 px-4 flex items-center justify-center gap-2 shadow-lg">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>{t('common.noInternet')}</span>
    </div>
  );
}
