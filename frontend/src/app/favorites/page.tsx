"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { Heart, MapPin, Briefcase, X } from "lucide-react";
import { DashboardSidebar } from "@/components/layout";
import { Button, Badge, VerifiedBadge } from "@/components/common";
import { useMatchStore } from "@/store/matches";

export default function FavoritesPage() {
  const { favoriteProfiles, isLoading, fetchFavorites, toggleFavorite, sendInterest } = useMatchStore();

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return (
    <div className="min-h-screen bg-blur-image">
      <DashboardSidebar />
      <div className="lg:pl-64 pt-14 lg:pt-0 pb-16 lg:pb-0">
        <main className="p-4 sm:p-6 lg:p-8 pt-4 lg:pt-8">
          <div className="mb-6">
            <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white">Favorites</h1>
            <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">Profiles you&apos;ve saved</p>
          </div>

          {isLoading && favoriteProfiles.length === 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-charcoal-100/50 dark:border-charcoal-700 overflow-hidden animate-pulse">
                  <div className="h-32 bg-charcoal-100 dark:bg-charcoal-700" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-charcoal-100 dark:bg-charcoal-700 rounded w-2/3" />
                    <div className="h-3 bg-charcoal-100 dark:bg-charcoal-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : favoriteProfiles.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-3" />
              <h3 className="font-semibold text-charcoal-900 dark:text-white">No favorites yet</h3>
              <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">Browse matches and save profiles you like</p>
            </div>
          ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {favoriteProfiles.map((profile, i) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 overflow-hidden group hover:shadow-elevated transition-all"
              >
                <div className="relative h-32 bg-gradient-to-br from-accent/30 to-accent/10 dark:from-accent/20 dark:to-charcoal-700 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/90 dark:bg-charcoal-700/90 backdrop-blur flex items-center justify-center">
                    <span className="text-xl font-display font-bold text-accent">
                      {[profile.user?.firstName, profile.user?.lastName].filter(Boolean).map(n => n[0]).join("") || "U"}
                    </span>
                  </div>
                  <button onClick={() => toggleFavorite(profile.user?.id || profile.id)} className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 dark:bg-charcoal-800/80 backdrop-blur hover:bg-white dark:hover:bg-charcoal-700 transition-colors">
                    <X className="w-4 h-4 text-charcoal-500" />
                  </button>
                  <div className="absolute top-2 left-2">
                    {profile.user?.isVerified && <VerifiedBadge />}
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <Badge variant="gold" size="sm">{profile.compatibilityScore || 0}%</Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-charcoal-900 dark:text-white">
                    {[profile.user?.firstName, profile.user?.lastName].filter(Boolean).join(" ") || "User"}, {profile.user?.dateOfBirth ? new Date().getFullYear() - new Date(profile.user.dateOfBirth).getFullYear() : ""}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-charcoal-500 dark:text-charcoal-400">
                      <MapPin className="w-3 h-3" /> {profile.profile?.city || "N/A"}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-charcoal-500 dark:text-charcoal-400">
                      <Briefcase className="w-3 h-3" /> {profile.profile?.occupation || "N/A"}
                    </div>
                  </div>
                  <Button variant="primary" size="sm" className="w-full mt-3" onClick={() => sendInterest(profile.user?.id || profile.id)}>
                    <Heart className="w-3.5 h-3.5 mr-1.5" /> Send Interest
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
          )}
        </main>
      </div>
    </div>
  );
}
