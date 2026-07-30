"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Sparkles, MapPin, Briefcase, Mail, Lock, CheckCircle, XCircle, ServerCrash, X } from "lucide-react";
import { DashboardSidebar } from "@/components/layout";
import { Button, Avatar, Badge, VerifiedBadge, NotVerifiedBadge, IslamicPatternBackground } from "@/components/common";
import { mediaUrl } from "@/lib/utils";
import { matchService } from "@/services/matches";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

export default function LikedInterestPage() {
  const router = useRouter();
  const { user, connectionError } = useAuth();
  const { t } = useI18n();
  const isVerified = user?.verificationStatus === "verified";

  const [likes, setLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dislikeTarget, setDislikeTarget] = useState<any>(null);

  useEffect(() => {
    if (connectionError) { setLoading(false); return; }
    if (!isVerified) { setLoading(false); return; }
    matchService.getLikesSent()
      .then(({ data }) => {
        setLikes(data.likes || []);
      })
      .catch((err) => console.error("Failed to load likes:", err))
      .finally(() => setLoading(false));
  }, [isVerified, connectionError]);

  if (connectionError === "server_down") {
    return (
      <div className="min-h-screen bg-blur-image">
        <DashboardSidebar />
        <div className="lg:pl-64 pt-14 lg:pt-0 pb-16 lg:pb-0">
          <div className="max-w-md mx-auto p-4 text-center pt-20">
            <ServerCrash className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold text-charcoal-900 dark:text-white">{t("liked.serverUnavailable")}</h2>
            <p className="text-sm text-charcoal-500 mt-2 mb-6">{t("liked.serverDown")}</p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              {t("liked.retry")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-blur-image">
        <DashboardSidebar />
        <div className="lg:pl-64 pt-14 lg:pt-0 pb-16 lg:pb-0">
          <div className="max-w-md mx-auto p-4 text-center pt-20">
            <Lock className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold text-charcoal-900 dark:text-white">{t("liked.verificationRequired")}</h2>
            <p className="text-sm text-charcoal-500 mt-2 mb-6">{t("liked.verifyToSee")}</p>
            <Button variant="primary" onClick={() => router.push("/verification")}>
              {t("liked.goToVerification")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardSidebar />
      <IslamicPatternBackground>
      <div className="lg:pl-64 pt-14 lg:pt-0 pb-16 lg:pb-0">
        <div className="p-4 sm:p-6 lg:p-8 pt-4 lg:pt-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white">
                {t("liked.title")}
              </h1>
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
              {t("liked.subtitle")}
            </p>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-charcoal-800 rounded-2xl shadow-sm border border-charcoal-700 overflow-hidden animate-pulse">
                  <div className="h-40 bg-charcoal-700" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-charcoal-700 rounded w-2/3" />
                    <div className="h-3 bg-charcoal-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : likes.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/30 to-accent/5" />
                <div className="absolute inset-2 rounded-full bg-white dark:bg-charcoal-800 flex items-center justify-center shadow-lg">
                  <Heart className="w-8 h-8 text-charcoal-300 dark:text-charcoal-500" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">{t("liked.noLikesYet")}</h3>
              <p className="text-sm text-charcoal-500 dark:text-charcoal-400 max-w-sm mx-auto leading-relaxed">
                {t("liked.noLikesDesc")}
              </p>
              <Button variant="primary" className="mt-6" onClick={() => router.push("/matches")}>
                {t("liked.browseProfiles")}
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {likes.map((like: any) => {
                const p = like.matchedUser || like.user;
                if (!p) return null;
                const profile = p?.profile || {};
                const fullName = [p?.firstName, p?.lastName].filter(Boolean).join(" ") || p?.username || "User";
                return (
                  <div
                    key={like.id}
                    className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 overflow-hidden group hover:shadow-elevated transition-all"
                  >
                    <div className="relative h-40 bg-gradient-to-br from-accent/30 to-accent/10 dark:from-accent/20 dark:to-charcoal-700 flex items-center justify-center overflow-hidden">
                      {profile.photos?.[0] ? (
                        <img src={mediaUrl(profile.photos[0])} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-white/90 dark:bg-charcoal-700/90 backdrop-blur flex items-center justify-center">
                          <span className="text-xl font-display font-bold text-accent">
                            {[p?.firstName, p?.lastName].filter(Boolean).map((n: string) => n[0]).join("") || "U"}
                          </span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        {p?.isVerified ? <VerifiedBadge /> : <NotVerifiedBadge />}
                      </div>
                      <div className="absolute top-2 right-2">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 backdrop-blur-md">
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          <span className="text-[10px] text-green-300 font-medium">{t("liked.liked")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-charcoal-900 dark:text-white truncate">
                        {fullName}
                      </h3>
                      {p?.username && (
                        <p className="text-[11px] text-accent font-medium truncate">@{p.username}</p>
                      )}
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-charcoal-500 dark:text-charcoal-400">
                          <MapPin className="w-3 h-3" /> {profile.city || t("liked.notAvailable")}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-charcoal-500 dark:text-charcoal-400">
                          <Briefcase className="w-3 h-3" /> {profile.occupation || t("liked.notAvailable")}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-charcoal-100/50 dark:border-charcoal-700">
                        <span className="text-[10px] text-charcoal-400">
                          {t("liked.likedOn", { date: new Date(like.createdAt).toLocaleDateString() })}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setDislikeTarget(like)}
                            className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-charcoal-400 hover:text-red-500 transition-colors"
                            title={t("liked.removeLike")}
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              const name = encodeURIComponent([p?.firstName, p?.lastName].filter(Boolean).join(" ") || "User");
                              const params = new URLSearchParams({ user: p?.id || "", name });
                              if (p?.username) params.set("username", p.username);
                              router.push(`/messages?${params}`);
                            }}
                          >
                            <Mail className="w-3 h-3 mr-1" /> {t("liked.message")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {dislikeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDislikeTarget(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-white dark:bg-charcoal-800 rounded-2xl shadow-elevated border border-charcoal-100/50 dark:border-charcoal-700 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-3">
                <X className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">{t("liked.removeLikeTitle")}</h3>
              <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mb-6">
                {t("liked.removeLikeConfirm", { name: [dislikeTarget.matchedUser?.firstName, dislikeTarget.matchedUser?.lastName].filter(Boolean).join(" ") || "this person" })}
              </p>
              <div className="flex items-center gap-3 justify-center">
                <Button variant="secondary" onClick={() => setDislikeTarget(null)}>
                  {t("liked.cancel")}
                </Button>
                <Button
                  variant="primary"
                  className="bg-red-500 hover:bg-red-600"
                  onClick={async () => {
                    const p = dislikeTarget.matchedUser;
                    try {
                      await matchService.removeInterest(p?.id || dislikeTarget.matchedUserId);
                      setLikes((prev) => prev.filter((l) => l.id !== dislikeTarget.id));
                    } catch {}
                    setDislikeTarget(null);
                  }}
                >
                  {t("liked.yesRemove")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </IslamicPatternBackground>
    </>
  );
}
