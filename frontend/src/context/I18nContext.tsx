"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import api from "@/lib/api";
import { useAuth } from "./AuthContext";

export type Lang = "en" | "am" | "ar" | "om";

const STORAGE_KEY = "ethio-nikah-lang";

const SUPPORTED_LANGS: Lang[] = ["en", "am", "ar", "om"];

const translations: Record<Lang, Record<string, string>> = {
  en: null as any,
  am: null as any,
  ar: null as any,
  om: null as any,
};

const loadTranslations = async (lang: Lang): Promise<Record<string, string>> => {
  if (translations[lang]) return translations[lang];
  if (lang !== "en") {
    if (!translations["en"]) {
      const enMod = await import("@/i18n/translations/en.json");
      translations["en"] = enMod.default || enMod;
    }
    const mod = await import(`@/i18n/translations/${lang}.json`);
    translations[lang] = { ...translations["en"], ...(mod.default || mod) };
  } else {
    const mod = await import(`@/i18n/translations/${lang}.json`);
    translations[lang] = mod.default || mod;
  }
  return translations[lang];
};

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
  ready: boolean;
}

const defaultI18nContext: I18nContextType = {
  lang: "en",
  setLang: () => {},
  t: (key: string, vars?: Record<string, string | number>) => {
    let val = translations["en"]?.[key] || key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        val = val.replace(`{${k}}`, String(v));
      }
    }
    return val;
  },
  dir: "ltr",
  ready: false,
};

const I18nContext = createContext<I18nContextType>(defaultI18nContext);

function isClient(): boolean {
  return typeof window !== "undefined";
}

function getCachedUser(): { id?: string | null; language?: string | null } | null {
  return null;
}

function storageKey(userId?: string | null) {
  return userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY;
}

function getStoredLang(userId?: string | null): Lang | null {
  if (!isClient()) return null;
  const keys = userId ? [storageKey(userId), STORAGE_KEY] : [STORAGE_KEY];
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value && SUPPORTED_LANGS.includes(value as Lang)) return value as Lang;
  }
  return null;
}

function setStoredLang(l: Lang, userId?: string | null) {
  if (!isClient()) return;
  localStorage.setItem(STORAGE_KEY, l);
  if (userId) localStorage.setItem(storageKey(userId), l);
}

function resolveInitialLang(userId?: string | null, userLang?: string | null): Lang {
  const stored = getStoredLang(userId);
  if (stored) return stored;
  if (userLang && SUPPORTED_LANGS.includes(userLang as Lang)) return userLang as Lang;
  if (isClient()) {
    const browser = navigator.language?.slice(0, 2);
    if (browser && SUPPORTED_LANGS.includes(browser as Lang)) return browser as Lang;
  }
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const { user, updateUser } = useAuth();
  const [lang, setLangState] = useState<Lang>("en");
  const [dict, setDict] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const userInitiated = useRef(false);

  // Hydrate initial language from storage / browser on the client.
  useEffect(() => {
    const cachedUser = getCachedUser();
    const next = resolveInitialLang(user?.id ?? cachedUser?.id, user?.language ?? cachedUser?.language);
    if (next !== lang) {
      userInitiated.current = false;
      setLangState(next);
    }
  }, []);

  // Apply user language preference whenever the user changes (login, logout, switch).
  useEffect(() => {
    const userId = user?.id;
    const userLanguage = user?.language;
    const next = resolveInitialLang(userId, userLanguage);
    if (next !== lang) {
      userInitiated.current = false;
      setLangState(next);
    }
  }, [user]);

  const savePreference = useCallback(async (l: Lang) => {
    try {
      if (!user) return;
      await api.patch("/users/preferences", { language: l });
      updateUser({ language: l });
    } catch { /* backend may not support this endpoint yet */ }
  }, [user, updateUser]);

  const savePreferenceRef = useRef(savePreference);
  savePreferenceRef.current = savePreference;

  useEffect(() => {
    setStoredLang(lang, user?.id);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    if (userInitiated.current) savePreferenceRef.current(lang);
    setReady(false);
    loadTranslations(lang).then((d) => {
      setDict(d);
      setReady(true);
    });
  }, [lang, user?.id]);

  const setLang = useCallback((l: Lang) => {
    userInitiated.current = true;
    setLangState(l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      let val = dict[key];
      if (!val) {
        /* fallback – try english if not already loading */
        if (lang !== "en" && translations["en"]) {
          val = translations["en"][key];
        }
        return val ?? key;
      }
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          val = val.replace(`{${k}}`, String(v));
        }
      }
      return val;
    },
    [dict, lang]
  );

  const dir: "ltr" | "rtl" = lang === "ar" ? "rtl" : "ltr";

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dir, ready }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  return ctx || defaultI18nContext;
}
