"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Heart, MessageCircle, MapPin, Briefcase, BookOpen, Users, Sparkles, RefreshCw, Crown, Gem, AlertCircle, CheckCircle2, AlertTriangle, MessageSquare } from "lucide-react";
import { DashboardSidebar } from "@/components/layout";
import { Button, VerifiedBadge, IslamicPatternBackground } from "@/components/common";
import { mediaUrl } from "@/lib/utils";
import { useMatchStore } from "@/store/matches";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { matchService } from "@/services/matches";
import api from "@/lib/api";

function SwipeCard({ profile, onSwipe, isTop, zIndex, chatCount }: {
  profile: any;
  onSwipe: (direction: "left" | "right", id: string) => void;
  isTop: boolean;
  zIndex: number;
  chatCount?: number;
}) {
  const { t } = useI18n();
  const [imgError, setImgError] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const initials = [profile.firstName, profile.lastName].filter(Boolean).map((n: string) => n[0]).join("") || "U";
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || t("matches.memberFallback");

  const isGold = profile.membershipPlan === "gold";
  const isPlatinum = profile.membershipPlan === "platinum";
  const isPremium = isGold || isPlatinum;

  const score = profile.compatibilityScore;
  const matchBadge = score >= 85 ? { label: t("matches.strongMatch"), gradient: "from-green-500 to-emerald-500" } :
    score >= 75 ? { label: t("matches.goodMatch"), gradient: "from-emerald-500 to-teal-500" } :
    score >= 60 ? { label: t("matches.potentialMatch"), gradient: "from-amber-400 to-yellow-500" } :
    { label: t("matches.exploring"), gradient: "from-rose-400 to-pink-500" };

  const borderClass = isPlatinum
    ? "border-2 border-purple-400/80 dark:border-purple-400/70 shadow-[0_0_28px_rgba(168,85,247,0.35)]"
    : isGold
    ? "border-2 border-amber-400/80 dark:border-amber-400/70 shadow-[0_0_28px_rgba(251,191,36,0.4)]"
    : "border-2 border-amber-300/50 dark:border-amber-400/30 shadow-[0_0_20px_rgba(212,175,55,0.15)]";

  const rotation = dragX * 0.05;
  const likeOpacity = Math.max(0, dragX / 100);
  const nopeOpacity = Math.max(0, -dragX / 100);

  function handleStart(clientX: number, clientY: number) {
    if (!isTop || exitDir) return;
    setIsDragging(true);
    startPos.current = { x: clientX, y: clientY };
  }
  function handleMove(clientX: number, clientY: number) {
    if (!isDragging || exitDir) return;
    setDragX(clientX - startPos.current.x);
    setDragY(clientY - startPos.current.y);
  }
  function handleEnd() {
    if (!isDragging || exitDir) return;
    setIsDragging(false);
    const threshold = 100;
    if (dragX > threshold) {
      setExitDir("right");
      setTimeout(() => onSwipe("right", profile.id), 300);
    } else if (dragX < -threshold) {
      setExitDir("left");
      setTimeout(() => onSwipe("left", profile.id), 300);
    } else {
      setDragX(0);
      setDragY(0);
    }
  }

  const exitTransform = exitDir === "right"
    ? "translateX(150%) translateY(-30%) rotate(25deg) scale(0.7)"
    : exitDir === "left"
    ? "translateX(-40%) translateY(10%) rotate(-10deg) scale(0.2)"
    : undefined;
  const cardTransform = exitTransform || (isDragging ? `translateX(${dragX}px) translateY(${dragY}px) rotate(${rotation}deg)` : undefined);
  const cardTransition = exitDir
    ? exitDir === "right"
      ? "transform 0.45s cubic-bezier(0.32, 0, 0.67, 0.36)"
      : "transform 0.35s cubic-bezier(0.55, 0, 0.45, 1), opacity 0.35s ease-out"
    : isDragging ? "none" : "transform 0.3s ease-out";
  const exitOpacity = exitDir === "left" ? 0 : 1;
  const likeIntensity = Math.max(0, dragX / 120);
  const nopeIntensity = Math.max(0, -dragX / 120);

  return (
    <div
      className={`absolute inset-0 bg-white dark:bg-charcoal-800 rounded-3xl shadow-2xl ${borderClass} overflow-hidden select-none touch-none`}
      style={{ zIndex, transform: cardTransform, transition: cardTransition, opacity: exitOpacity, cursor: isTop ? "grab" : "default" }}
      onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleEnd}
      onMouseDown={(e) => { e.preventDefault(); handleStart(e.clientX, e.clientY); }}
      onMouseMove={(e) => { if (isDragging) handleMove(e.clientX, e.clientY); }}
      onMouseUp={handleEnd}
      onMouseLeave={() => { if (isDragging) handleEnd(); }}
    >
      <div className="relative h-full flex flex-col">
        {/* Photo area */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden transition-colors duration-200"
          style={{
            background: exitDir === "right"
              ? "linear-gradient(135deg, rgba(34,197,94,0.9), rgba(16,185,129,0.9))"
              : exitDir === "left"
              ? "linear-gradient(135deg, rgba(239,68,68,0.9), rgba(220,38,38,0.9))"
              : isDragging
              ? `linear-gradient(135deg, rgba(${nopeIntensity * 239},${nopeIntensity * 68},${nopeIntensity * 68},${nopeIntensity * 0.6}), rgba(${likeIntensity * 34},${likeIntensity * 197},${likeIntensity * 94},${likeIntensity * 0.6}))`
              : undefined,
          }}
        >
          <div className="absolute inset-0 opacity-[0.08] dark:opacity-[0.12]" style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, rgba(251,207,232,0.5) 1.5px, transparent 1.5px), radial-gradient(circle at 80% 70%, rgba(212,175,55,0.4) 1px, transparent 1px), radial-gradient(circle at 50% 50%, rgba(254,215,170,0.4) 1px, transparent 1px), radial-gradient(circle at 65% 25%, rgba(251,207,232,0.3) 1px, transparent 1px)`,
            backgroundSize: "45px 45px"
          }} />

          {profile.photos && profile.photos.length > 0 && !imgError ? (
            <>
              <img src={mediaUrl(profile.photos[0])} alt={fullName} onError={() => setImgError(true)} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
            </>
          ) : (
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shadow-2xl ring-4 ring-white/30 dark:ring-charcoal-700/50">
                <span className="text-3xl font-display font-bold text-white drop-shadow-lg">{initials}</span>
              </div>
              <div className="absolute -inset-3 rounded-full bg-accent/20 blur-xl animate-pulse" />
            </div>
          )}

          {/* LIKE / NOPE stamps */}
          {isTop && (
            <>
              {/* LIKE stamp - animated heart */}
              <div
                className="absolute top-8 left-6 flex items-center gap-2 border-4 border-green-400 text-green-400 font-bold text-2xl px-4 py-1 rounded-xl rotate-[-20deg] pointer-events-none transition-all duration-150"
                style={{ opacity: likeOpacity, transform: `scale(${0.8 + likeIntensity * 0.5})` }}
              >
                <Heart className="w-7 h-7 fill-green-400 animate-pulse" />
                {t("matches.likeStamp")}
              </div>

              {/* NOPE stamp - animated X */}
              <div
                className="absolute top-8 right-6 flex items-center gap-2 border-4 border-red-400 text-red-400 font-bold text-2xl px-4 py-1 rounded-xl rotate-[20deg] pointer-events-none transition-all duration-150"
                style={{ opacity: nopeOpacity, transform: `scale(${0.8 + nopeIntensity * 0.5})` }}
              >
                <X className="w-7 h-7 stroke-[3]" />
                {t("matches.nopeStamp")}
              </div>

              {/* Center X overlay on nope exit */}
              {exitDir === "left" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-24 h-24" style={{ animation: "nope-x-pop 0.35s ease-out forwards" }}>
                    <div className="absolute top-1/2 left-0 right-0 h-2 bg-white rounded-full -translate-y-1/2 rotate-45" />
                    <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-white rounded-full -translate-x-1/2 rotate-45" />
                  </div>
                </div>
              )}

              {/* Center heart overlay on like exit */}
              {exitDir === "right" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Heart className="w-28 h-28 fill-white/90 text-white" style={{ animation: "like-heart-pop 0.45s ease-out forwards" }} />
                </div>
              )}
            </>
          )}

          {/* Match score badge */}
          {score != null && (
            <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r ${matchBadge.gradient} text-white text-xs font-bold shadow-md backdrop-blur-md`}>
                <Heart className="w-3 h-3 fill-white" />
                <span>{score}%</span>
              </div>
              <div className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/40 backdrop-blur-md text-white">
                {matchBadge.label}
              </div>
            </div>
          )}

          {/* Verified + premium badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            {profile.isVerified && <VerifiedBadge />}
            {isPremium && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full text-white shadow-md ${isPlatinum ? "bg-gradient-to-r from-purple-500 to-fuchsia-500" : "bg-gradient-to-r from-amber-400 to-yellow-500"}`}>
                {isPlatinum ? <Gem className="w-2.5 h-2.5" /> : <Crown className="w-2.5 h-2.5" />}
                {isPlatinum ? t("matches.platinum") : t("matches.gold")}
              </span>
            )}
          </div>

          {/* Active chats badge */}
          {chatCount != null && chatCount > 0 && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] font-medium shadow-md">
              <MessageSquare className="w-2.5 h-2.5" />
              <span>{chatCount} active {chatCount === 1 ? "chat" : "chats"}</span>
            </div>
          )}

          {/* Name & Age at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
            <h2 className="text-xl font-bold text-white drop-shadow-lg flex items-center gap-1.5">
              {fullName}
              <span className="font-normal text-white/80">{profile.age}</span>
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <MapPin className="w-3 h-3 text-white/70 shrink-0" />
              <span className="text-[11px] text-white/80 truncate">{[profile.city, profile.country].filter(Boolean).join(", ") || t("matches.locationNotSet")}</span>
              {profile.occupation && (
                <span className="text-[11px] text-white/60 flex items-center gap-0.5 shrink-0">
                  <Briefcase className="w-2.5 h-2.5" /> {profile.occupation}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info section */}
        <div className="p-4 shrink-0 max-h-[45%] overflow-y-auto">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {profile.occupation && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 text-[10px] font-semibold text-rose-600 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/30">
                <Briefcase className="w-2.5 h-2.5" /> {profile.occupation}
              </span>
            )}
            {profile.maritalStatus && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 text-[10px] font-semibold text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/30">
                <Users className="w-2.5 h-2.5" /> {profile.maritalStatus.replace(/_/g, " ")}
              </span>
            )}
            {profile.religiousCommitment && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30">
                <BookOpen className="w-2.5 h-2.5" /> {profile.religiousCommitment}
              </span>
            )}
            {profile.smokingHabits && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-charcoal-50 to-slate-50 dark:from-charcoal-700/40 dark:to-slate-700/40 text-[10px] font-semibold text-charcoal-600 dark:text-charcoal-300 border border-charcoal-200/50 dark:border-charcoal-600/30">
                <X className="w-2.5 h-2.5" /> {profile.smokingHabits.replace(/_/g, " ")}
              </span>
            )}
          </div>

          {/* Bio */}
          {profile.selfDescription && (
            <p className="text-xs sm:text-sm text-charcoal-600 dark:text-charcoal-400 leading-relaxed mb-3 line-clamp-3">
              {profile.selfDescription}
            </p>
          )}

          {/* Compatibility bar */}
          {score != null && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-charcoal-700 dark:text-charcoal-300 flex items-center gap-1">
                  <Heart className="w-2.5 h-2.5 text-pink-400 fill-pink-300/50" /> {t("matches.matchScore")}
                </span>
                <span className={`text-[10px] font-bold ${
                  score >= 85 ? "text-green-600 dark:text-green-400" :
                  score >= 75 ? "text-emerald-600 dark:text-emerald-400" :
                  score >= 60 ? "text-accent" : "text-red-500"
                }`}>{score}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-charcoal-100 dark:bg-charcoal-700 overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${matchBadge.gradient}`} style={{ width: `${score}%` }} />
              </div>
            </div>
          )}

          {/* Why you match */}
          {profile.strengths && profile.strengths.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-bold text-green-600 dark:text-green-400 mb-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {t("matches.whyYouMatch")}
              </p>
              <div className="flex flex-wrap gap-1">
                {profile.strengths.slice(0, 5).map((s: string, i: number) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-[9px] font-medium text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-800/30">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Why you don't match */}
          {profile.potentialDifferences && profile.potentialDifferences.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {t("matches.whyYouMightNotMatch")}
              </p>
              <div className="flex flex-wrap gap-1">
                {profile.potentialDifferences.slice(0, 4).map((d: string, i: number) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-[9px] font-medium text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/30">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MatchesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const { sendInterest } = useMatchStore();
  const [pageLoaded, setPageLoaded] = useState(false);
  const [likedProfileIds, setLikedProfileIds] = useState<Set<string>>(new Set());
  const [likeLoadingId, setLikeLoadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [chatCounts, setChatCounts] = useState<Record<string, number>>({});

  const loadMatches = useCallback(async (page = 1) => {
    if (page === 1) setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/matches/suggested", { params: { page, limit: 12 } });
      const matches = data.matches || [];
      setProfiles(page === 1 ? matches : (prev) => [...prev, ...matches]);
      setNeedsProfile(data.needsProfile || false);
      setCurrentIndex(0);
      // Fetch chat counts for each profile
      matches.forEach((m: any) => {
        api.get(`/messages/active-partners/${m.id}`, { _noToast: true } as any)
          .then(({ data }) => setChatCounts((prev) => ({ ...prev, [m.id]: data.count || 0 })))
          .catch(() => {});
      });
    } catch (err: any) {
      setError(err?.response?.data?.error || t("matches.failedToLoad"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadMatches(1).then(() => setPageLoaded(true));
    matchService.getLikesSent().then(({ data }) => {
      const ids = new Set<string>((data.likes || []).map((l: any) => l.matchedUser?.id));
      setLikedProfileIds(ids);
    }).catch(() => {});
  }, [loadMatches]);

  const handleLike = async (id: string) => {
    if (!id || likeLoadingId) return;
    setLikeLoadingId(id);
    try {
      const isLiked = likedProfileIds.has(id);
      if (isLiked) {
        await matchService.removeInterest(id);
        setLikedProfileIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      } else {
        await sendInterest(id);
        if (user?.verificationStatus !== "verified") {
          setTimeout(() => router.push("/verification"), 350);
          return;
        }
        setLikedProfileIds((prev) => { const n = new Set(prev); n.add(id); return n; });
      }
    } catch {
      // ignore
    } finally {
      setLikeLoadingId(null);
    }
  };

  const handleMessage = (profile: any) => {
    if (user?.verificationStatus !== "verified") {
      router.push("/verification");
      return;
    }
    const name = encodeURIComponent(`${profile.firstName} ${profile.lastName}`);
    const params = new URLSearchParams({ user: profile.id, name });
    if (profile.username) params.set("username", profile.username);
    router.push(`/messages?${params}`);
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadMatches(1).finally(() => setTimeout(() => setRefreshing(false), 800));
  }, [loadMatches]);

  const handleSwipe = useCallback((direction: "left" | "right", id: string) => {
    if (direction === "right") {
      handleLike(id);
    } else {
      matchService.passProfile(id).catch(() => {});
    }
    setCurrentIndex((prev) => prev + 1);
  }, []);

  // Sort profiles by compatibility score, highest first
  const sortedProfiles = [...profiles].sort((a, b) => {
    const sa = a.compatibilityScore ?? 0;
    const sb = b.compatibilityScore ?? 0;
    return sb - sa;
  });

  const remainingProfiles = sortedProfiles.slice(currentIndex);
  const currentProfile = remainingProfiles[0];
  const nextProfile = remainingProfiles[1];
  const thirdProfile = remainingProfiles[2];

  return (
    <IslamicPatternBackground showBismillah>
      <DashboardSidebar />
      <div className="lg:pl-64 pt-14 lg:pt-0 pb-16 lg:pb-0">
        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-display font-bold bg-gradient-to-r from-accent to-accent/60 bg-clip-text text-transparent flex items-center gap-2">
                  {t('matches.discover')}
                  <Sparkles className="w-6 h-6 text-accent" />
                </h1>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 dark:bg-charcoal-800/80 backdrop-blur-md border border-amber-200/50 dark:border-amber-400/20 text-xs font-medium text-charcoal-600 dark:text-charcoal-300 hover:border-amber-300 dark:hover:border-amber-400/40 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                {t("matches.refreshBtn")}
              </button>
            </div>
          </div>

          {/* Loading state */}
          {isLoading && !pageLoaded ? (
            <div className="flex items-center justify-center" style={{ height: "calc(100vh - 250px)" }}>
              <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : needsProfile ? (
            <div className="py-16 text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/30 to-accent/5 animate-pulse" />
                <div className="absolute inset-2 rounded-full bg-white dark:bg-charcoal-800 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-10 h-10 text-accent" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">{t("matches.completeProfile")}</h3>
              <p className="text-sm text-charcoal-500 dark:text-charcoal-400 max-w-xs mx-auto mb-6 leading-relaxed">
                {t("matches.completeProfileDesc")}
              </p>
              <Button variant="primary" onClick={() => router.push("/profile/edit")} className="shadow-lg shadow-accent/20">
                {t("matches.completeProfileBtn")}
              </Button>
            </div>
          ) : remainingProfiles.length === 0 ? (
            <div className="py-16 text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/30 to-accent/5 animate-pulse" />
                <div className="absolute inset-2 rounded-full bg-white dark:bg-charcoal-800 flex items-center justify-center shadow-lg">
                  <Heart className="w-10 h-10 text-charcoal-300 dark:text-charcoal-500" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">{t('matches.allCaughtUp')}</h3>
              <p className="text-sm text-charcoal-500 dark:text-charcoal-400 max-w-xs mx-auto mb-6 leading-relaxed">
                {t('matches.allCaughtUpDesc')}
              </p>
              <Button variant="primary" onClick={handleRefresh} className="shadow-lg shadow-accent/20">
                <RefreshCw className="w-4 h-4 mr-2" /> {t('matches.refresh')}
              </Button>
            </div>
          ) : (
            <>
              {/* Swipe card stack */}
              <div className="relative w-full max-w-md mx-auto" style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}>
                {/* Third card (back) */}
                {thirdProfile && (
                  <SwipeCard
                    key={thirdProfile.id}
                    profile={thirdProfile}
                    onSwipe={handleSwipe}
                    isTop={false}
                    zIndex={1}
                    chatCount={chatCounts[thirdProfile.id]}
                  />
                )}
                {/* Second card (middle) */}
                {nextProfile && (
                  <SwipeCard
                    key={nextProfile.id}
                    profile={nextProfile}
                    onSwipe={handleSwipe}
                    isTop={false}
                    zIndex={2}
                    chatCount={chatCounts[nextProfile.id]}
                  />
                )}
                {/* Top card (swipeable) */}
                {currentProfile && (
                  <SwipeCard
                    key={currentProfile.id}
                    profile={currentProfile}
                    onSwipe={handleSwipe}
                    isTop={true}
                    zIndex={3}
                    chatCount={chatCounts[currentProfile.id]}
                  />
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-6 mt-6">
                <button
                  onClick={() => handleSwipe("left", currentProfile?.id)}
                  disabled={!currentProfile}
                  className="w-14 h-14 rounded-full bg-white dark:bg-charcoal-800 shadow-lg border-2 border-red-200 dark:border-red-800/50 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:scale-110 transition-all disabled:opacity-40"
                >
                  <X className="w-7 h-7" />
                </button>
                <button
                  onClick={() => handleMessage(currentProfile)}
                  disabled={!currentProfile}
                  className="w-12 h-12 rounded-full bg-white dark:bg-charcoal-800 shadow-lg border-2 border-amber-200 dark:border-amber-800/50 flex items-center justify-center text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:scale-110 transition-all disabled:opacity-40"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleSwipe("right", currentProfile?.id)}
                  disabled={!currentProfile}
                  className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all disabled:opacity-40 ${
                    currentProfile && likedProfileIds.has(currentProfile.id)
                      ? "bg-green-500 text-white border-2 border-green-600"
                      : "bg-white dark:bg-charcoal-800 border-2 border-green-200 dark:border-green-800/50 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                  }`}
                >
                  <Heart className={`w-7 h-7 ${currentProfile && likedProfileIds.has(currentProfile.id) ? "fill-white" : ""}`} />
                </button>
              </div>

              {/* Swipe hint */}
              <p className="text-center text-xs text-charcoal-400 dark:text-charcoal-500 mt-4">
                {t("matches.swipeHintFull")}
              </p>
            </>
          )}

          {error && (
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[999999] px-6 py-4 rounded-xl bg-white dark:bg-charcoal-800 backdrop-blur-md border border-red-200 dark:border-red-800/50 shadow-elevated flex items-center gap-3 max-w-md">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
              <button onClick={handleRefresh} className="text-sm font-medium text-accent hover:underline shrink-0 whitespace-nowrap">{t('matches.retry')}</button>
            </div>
          )}
        </main>
      </div>
    </IslamicPatternBackground>
  );
}
