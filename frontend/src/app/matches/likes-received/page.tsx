"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ArrowLeft, MapPin, Briefcase, MessageCircle } from "lucide-react";
import { DashboardSidebar } from "@/components/layout";
import { Button, Avatar, VerifiedBadge } from "@/components/common";
import { matchService } from "@/services/matches";
import { mediaUrl } from "@/lib/utils";
import { useI18n } from "@/context/I18nContext";

export default function LikesReceivedPage() {
  const { t } = useI18n();
  const [likes, setLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    matchService.getLikesReceived().then((r) => {
      setLikes(r.data.likes || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-50 via-white to-accent/5 dark:from-charcoal-950 dark:via-charcoal-900 dark:to-accent/5">
      <DashboardSidebar />
      <div className="lg:pl-64 pt-14 lg:pt-0 pb-16 lg:pb-0">
        <main className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
          <div className="mb-6">
            <Link href="/profile" className="inline-flex items-center gap-1.5 text-sm text-charcoal-500 dark:text-charcoal-400 hover:text-accent transition-colors mb-3">
              <ArrowLeft className="w-4 h-4" /> {t("matches.backToProfile")}
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-xl lg:text-2xl font-display font-bold text-charcoal-900 dark:text-white">{t("matches.whoLikedYou")}</h1>
              <Heart className="w-5 h-5 text-rose-500" />
            </div>
            <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">
              {t("matches.likedCount", { count: likes.length })}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                <Heart className="w-4 h-4 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
            </div>
          ) : likes.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-rose-300 dark:text-rose-500/50" />
              </div>
              <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">{t("matches.noLikesYet")}</h3>
              <p className="text-sm text-charcoal-500 dark:text-charcoal-400">{t("matches.noLikesDesc")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {likes.map((like: any, i: number) => {
                const person = like.user || like.matchedUser;
                if (!person) return null;
                const name = [person.firstName, person.lastName].filter(Boolean).join(" ") || person.username || "User";
                return (
                  <motion.div
                    key={person.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-charcoal-800 rounded-2xl border border-charcoal-100/50 dark:border-charcoal-700 p-4 flex items-center gap-4"
                  >
                    <Avatar
                      size="md"
                      firstName={person.firstName}
                      lastName={person.lastName}
                      src={mediaUrl(person.profile?.photos?.[0])}
                      membershipPlan={person.membershipPlan || null}
                      isVerified={person.isVerified}
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-charcoal-900 dark:text-white truncate">{name}</span>
                        {person.isVerified && <VerifiedBadge />}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-charcoal-500 dark:text-charcoal-400">
                        {person.profile?.occupation && (
                          <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{person.profile.occupation}</span>
                        )}
                        {person.profile?.city && (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{person.profile.city}</span>
                        )}
                      </div>
                    </div>
                    <Link href={`/messages?user=${person.id}&name=${encodeURIComponent(name)}${person.username ? `&username=${encodeURIComponent(person.username)}` : ""}`}>
                      <Button variant="primary" size="sm">
                        <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> {t("matches.message")}
                      </Button>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
