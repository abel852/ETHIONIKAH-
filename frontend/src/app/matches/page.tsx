"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import Link from "next/link";
import { MapPin, Briefcase, GraduationCap, Check, X, Heart, Moon, BookOpen, Users, Globe, AlertTriangle } from "lucide-react";
import { DashboardSidebar } from "@/components/layout";
import { Button, Badge, VerifiedBadge, ProfileCardSkeleton } from "@/components/common";
import { useMatchStore } from "@/store/matches";

const breakdownLabels: Record<string, { label: string; icon: any }> = {
  age: { label: "Age", icon: Heart },
  country: { label: "Country", icon: Globe },
  sameCountry: { label: "Same Country", icon: Globe },
  maritalStatus: { label: "Marital Status", icon: Users },
  religiousCommitment: { label: "Religious Level", icon: BookOpen },
  education: { label: "Education", icon: GraduationCap },
  prayerHabits: { label: "Prayer", icon: Moon },
  quranReading: { label: "Quran Reading", icon: BookOpen },
  smoking: { label: "Lifestyle", icon: Heart },
  childrenPref: { label: "Children", icon: Users },
  familyInvolvement: { label: "Family", icon: Users },
  ethnicity: { label: "Ethnicity", icon: Globe },
  language: { label: "Language", icon: Globe },
  verified: { label: "Verified", icon: Check },
  mutual: { label: "Mutual Interest", icon: Heart },
};

export default function MatchesPage() {
  const { recommendations, isLoading, error, fetchRecommendations, sendInterest } = useMatchStore();

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const noProfileError = error && recommendations.length === 0;

  return (
    <div className="min-h-screen bg-blur-image">
      <DashboardSidebar />
      <div className="lg:pl-64 pt-14 lg:pt-0 pb-16 lg:pb-0">
        <main className="p-4 sm:p-6 lg:p-8 pt-4 lg:pt-8">
          <div className="mb-4 lg:mb-6">
            <h1 className="text-xl lg:text-2xl font-display font-bold text-charcoal-900 dark:text-white">Suggested For You</h1>
            <p className="text-xs lg:text-sm text-charcoal-500 dark:text-charcoal-400 mt-0.5">Profiles matched to your preferences</p>
          </div>

          {noProfileError ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">Complete Your Profile First</h3>
              <p className="text-sm text-charcoal-500 dark:text-charcoal-400 max-w-md mx-auto mb-5">
                Create your profile so our AI can find the perfect matches for you.
              </p>
              <Link href="/profile/edit">
                <Button variant="primary" size="md">Create Profile</Button>
              </Link>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => <ProfileCardSkeleton key={i} />)}
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5">
            {recommendations.map((profile, i) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white dark:bg-charcoal-800 rounded-xl lg:rounded-2xl shadow-sm lg:shadow-card border border-charcoal-100/50 dark:border-charcoal-700 overflow-hidden active:scale-[0.98] transition-transform"
              >
                <div className="relative h-32 lg:h-40 bg-gradient-to-br from-accent/30 to-accent/10 dark:from-accent/20 dark:to-charcoal-700 flex items-center justify-center">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-white/90 dark:bg-charcoal-700/90 backdrop-blur flex items-center justify-center shadow-md">
                    <span className="text-xl lg:text-2xl font-display font-bold text-accent">
                      {[profile.firstName, profile.lastName].filter(Boolean).map((n) => n[0]).join("") || "U"}
                    </span>
                  </div>
                  <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full border-2 border-white dark:border-charcoal-800 bg-green-500" />
                  <div className="absolute top-2.5 left-2.5">
                    {profile.isVerified && <VerifiedBadge />}
                  </div>
                  <div className="absolute bottom-2.5 right-2.5">
                    <Badge variant="gold" size="sm">{profile.compatibilityScore || 0}%</Badge>
                  </div>
                </div>
                <div className="p-3.5 lg:p-5">
                  <h3 className="font-semibold text-charcoal-900 dark:text-white text-base lg:text-lg">
                    {[profile.firstName, profile.lastName].filter(Boolean).join(" ") || "User"}, {profile.dateOfBirth ? new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear() : ""}
                  </h3>
                  <div className="mt-2 lg:mt-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs lg:text-sm text-charcoal-500 dark:text-charcoal-400">
                      <MapPin className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" /> {profile.profile?.city || "N/A"}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs lg:text-sm text-charcoal-500 dark:text-charcoal-400">
                      <Briefcase className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" /> {profile.profile?.occupation || "N/A"}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs lg:text-sm text-charcoal-500 dark:text-charcoal-400">
                      <GraduationCap className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" /> {profile.profile?.occupation || "N/A"}
                    </div>
                  </div>

                  {/* AI Compatibility Breakdown */}
                  {profile.compatibilityBreakdown && (
                    <div className="mt-3 pt-3 border-t border-charcoal-100/50 dark:border-charcoal-700">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400 mb-2">AI Match Analysis</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {Object.entries(profile.compatibilityBreakdown).map(([key, val]: [string, any]) => {
                          const info = breakdownLabels[key];
                          if (!info || val === 0) return null;
                          const Icon = info.icon;
                          return (
                            <div key={key} className="flex items-center gap-1.5 text-[11px] text-charcoal-500 dark:text-charcoal-400">
                              <Icon className="w-3 h-3 shrink-0 text-accent/70" />
                              <span className="truncate">{info.label}</span>
                              <span className="ml-auto font-medium text-charcoal-700 dark:text-charcoal-200">{val}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-charcoal-100/50 dark:border-charcoal-700">
                    <Button variant="primary" size="sm" className="flex-1 text-xs lg:text-sm py-2.5 lg:py-2" onClick={() => sendInterest(profile.id)}>
                      <Check className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1" /> Interest
                    </Button>
                    <Button variant="secondary" size="sm" className="flex-1 text-xs lg:text-sm py-2.5 lg:py-2">
                      <X className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1" /> Pass
                    </Button>
                  </div>
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
