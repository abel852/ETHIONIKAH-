"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, MapPin, Briefcase, GraduationCap, Calendar, Heart, Shield, Star, CheckCircle, XCircle, X, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { DashboardSidebar } from "@/components/layout";
import { Button, Avatar, Badge, IslamicPatternBackground } from "@/components/common";
import { mediaUrl } from "@/lib/utils";
import { profileService } from "@/services/profile";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imgError, setImgError] = useState(false);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [chatPartners, setChatPartners] = useState<any[]>([]);

  const photos = profile?.photos || [];

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    profileService.getProfileByUserId(params.id as string)
      .then(({ data }) => {
        setProfile(data.profile);
        // Fetch active chat partners
        api.get(`/messages/active-partners/${params.id}`, { _noToast: true } as any)
          .then(({ data }) => setChatPartners(data.partners || []))
          .catch(() => setChatPartners([]));
      })
      .catch(() => setError("User not found"))
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") setCurrentPhotoIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setCurrentPhotoIdx((i) => Math.min(photos.length - 1, i + 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, photos.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-blur-image">
        <DashboardSidebar />
        <div className="lg:pl-64 pt-14 lg:pt-0 pb-16 lg:pb-0">
          <div className="max-w-2xl mx-auto p-4">
            <div className="animate-pulse space-y-4">
              <div className="h-64 bg-charcoal-700 rounded-2xl" />
              <div className="h-6 w-48 bg-charcoal-700 rounded" />
              <div className="h-4 w-32 bg-charcoal-700 rounded" />
              <div className="h-20 bg-charcoal-700 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-blur-image">
        <DashboardSidebar />
        <div className="lg:pl-64 pt-14 lg:pt-0 pb-16 lg:pb-0">
          <div className="max-w-2xl mx-auto p-4 text-center pt-20">
            <XCircle className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold text-charcoal-900 dark:text-white">User not found</h2>
            <p className="text-sm text-charcoal-500 mt-2">This user does not exist or their profile is unavailable.</p>
            <Button variant="primary" className="mt-6" onClick={() => router.push("/messages")}>
              Back to Messages
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const p = profile;
  const userData = p.user || {};
  const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(" ") || "User";
  const initials = [userData.firstName, userData.lastName].filter(Boolean).map((n: string) => n[0]).join("") || "U";
  const age = userData.dateOfBirth
    ? Math.floor((new Date().getTime() - new Date(userData.dateOfBirth).getTime()) / 31557600000)
    : null;

  const maritalStatusLabels: Record<string, string> = {
    single: "Single",
    divorced: "Divorced",
    widowed: "Widowed",
  };

  const religiousLabels: Record<string, string> = {
    practicing: "Practicing",
    "moderately-practicing": "Moderately Practicing",
    traditional: "Traditional",
    seeking: "Seeking",
  };

  return (
    <IslamicPatternBackground>
      <DashboardSidebar />
      <div className="lg:pl-64 pt-14 lg:pt-0 pb-16 lg:pb-0">
        <div className="max-w-2xl mx-auto">

          {/* Header bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-charcoal-100/50 dark:border-charcoal-700 bg-white/60 dark:bg-charcoal-900/60 backdrop-blur sticky top-0 z-10">
            <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-charcoal-600 dark:text-charcoal-300" />
            </button>
            <span className="font-medium text-sm text-charcoal-900 dark:text-white">Profile</span>
          </div>

          {/* Photo Gallery */}
          <button onClick={() => { if (photos.length > 0 && !imgError) setLightboxOpen(true); }} className="relative h-72 sm:h-80 w-full bg-gradient-to-br from-accent/30 via-accent/15 to-accent/5 dark:from-accent/25 dark:via-accent/10 dark:to-charcoal-700 flex items-center justify-center overflow-hidden cursor-pointer">
            {photos.length > 0 && !imgError ? (
              <>
                <img
                  src={mediaUrl(photos[currentPhotoIdx])}
                  alt={fullName}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
              </>
            ) : (
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shadow-2xl ring-4 ring-white/30 dark:ring-charcoal-700/50">
                <span className="text-4xl font-display font-bold text-white drop-shadow-lg">{initials}</span>
              </div>
            )}

            {/* Photo pagination dots */}
            {photos.length > 1 && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setCurrentPhotoIdx(idx); }}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentPhotoIdx ? "bg-white w-3" : "bg-white/50 hover:bg-white/70"}`}
                  />
                ))}
              </div>
            )}

            {/* Top-right badges */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              {p.isVerified && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md">
                  <CheckCircle className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[10px] text-white font-medium">Verified</span>
                </div>
              )}
              {userData.isPremium && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md">
                  <Star className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[10px] text-white font-medium">Premium</span>
                </div>
              )}
            </div>

            {/* Membership avatar overlay */}
            <div className="absolute bottom-3 left-3 z-10">
              <Avatar
                size="xl"
                src={photos.length > 0 && !imgError ? mediaUrl(photos[currentPhotoIdx]) : undefined}
                firstName={userData.firstName || fullName.split(" ")[0] || "U"}
                lastName={userData.lastName || fullName.split(" ").slice(1).join(" ")}
                membershipPlan={userData.membershipPlan || null}
                isVerified={p.isVerified}
                showMembershipBadge
              />
            </div>

            {/* Name overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-3 pl-28 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
              <h2 className="text-xl font-bold text-white drop-shadow-lg flex items-center gap-2">
                {fullName}
                {age && <span className="text-lg font-normal text-white/80">{age}</span>}
              </h2>
              {userData.username && (
                <p className="text-accent text-xs font-medium mt-0.5 drop-shadow-lg">@{userData.username}</p>
              )}
            </div>
          </button>

          {/* Bio */}
          {p.bio && (
            <div className="px-4 py-4 border-b border-charcoal-100/50 dark:border-charcoal-700">
              <p className="text-sm text-charcoal-700 dark:text-charcoal-300 leading-relaxed">{p.bio}</p>
            </div>
          )}

          {/* Info Sections */}
          <div className="px-4 py-4 space-y-5">

            {/* Basic Info */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal-400 mb-3">Basic Information</h3>
              <div className="grid grid-cols-2 gap-3">
                {p.city || p.country ? (
                  <InfoItem icon={<MapPin className="w-4 h-4" />} label="Location" value={[p.city, p.country].filter(Boolean).join(", ")} />
                ) : null}
                {p.nationality ? <InfoItem icon={<MapPin className="w-4 h-4" />} label="Nationality" value={p.nationality} /> : null}
                {p.maritalStatus ? <InfoItem icon={<Heart className="w-4 h-4" />} label="Marital Status" value={maritalStatusLabels[p.maritalStatus] || p.maritalStatus} /> : null}
                {age ? <InfoItem icon={<Calendar className="w-4 h-4" />} label="Age" value={`${age} years`} /> : null}
                {p.height ? <InfoItem icon={<Heart className="w-4 h-4" />} label="Height" value={`${p.height} cm`} /> : null}
              </div>
            </div>

            {/* Religious & Education */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal-400 mb-3">Religious & Professional</h3>
              <div className="grid grid-cols-2 gap-3">
                {p.religiousCommitment ? <InfoItem icon={<Shield className="w-4 h-4" />} label="Religious" value={religiousLabels[p.religiousCommitment] || p.religiousCommitment} /> : null}
                {p.education ? <InfoItem icon={<GraduationCap className="w-4 h-4" />} label="Education" value={p.education} /> : null}
                {p.occupation ? <InfoItem icon={<Briefcase className="w-4 h-4" />} label="Occupation" value={p.occupation} /> : null}
                {p.motherTongue ? <InfoItem icon={<Heart className="w-4 h-4" />} label="Language" value={p.motherTongue} /> : null}
                {p.ethnicity ? <InfoItem icon={<Heart className="w-4 h-4" />} label="Ethnicity" value={p.ethnicity} /> : null}
              </div>
            </div>

            {/* Qualities & Interests */}
            {p.qualities && p.qualities.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal-400 mb-3">Qualities</h3>
                <div className="flex flex-wrap gap-2">
                  {p.qualities.map((q: string, i: number) => (
                    <span key={i} className="px-3 py-1 text-xs font-medium bg-accent/10 text-accent rounded-full">{q}</span>
                  ))}
                </div>
              </div>
            )}
            {p.interests && p.interests.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal-400 mb-3">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {p.interests.map((t: string, i: number) => (
                    <span key={i} className="px-3 py-1 text-xs font-medium bg-charcoal-100 dark:bg-charcoal-700 text-charcoal-600 dark:text-charcoal-300 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Chat Partners */}
          <div className="px-4 py-4 border-t border-charcoal-100/50 dark:border-charcoal-700">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal-400 mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Active Conversations
            </h3>
            {chatPartners.length > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                {chatPartners.map((partner) => {
                  const isMe = partner.id === user?.id;
                  return (
                  <div
                    key={partner.id}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-charcoal-50 dark:bg-charcoal-800 border border-charcoal-100 dark:border-charcoal-700"
                  >
                    <div className="relative">
                      {isMe ? (
                        <div className="w-6 h-6 rounded-full bg-accent/30 flex items-center justify-center text-[10px] font-bold text-accent">
                          You
                        </div>
                      ) : partner.photo ? (
                        <img src={mediaUrl(partner.photo)} alt="" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                          {partner.firstName?.[0] || "U"}
                        </div>
                      )}
                      {partner.isVerified && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-white dark:bg-charcoal-800 flex items-center justify-center">
                          <CheckCircle className="w-2.5 h-2.5 text-accent" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-charcoal-700 dark:text-charcoal-300">
                      {isMe ? "You" : `${partner.firstName} ${partner.lastName?.[0]}.`}
                    </span>
                  </div>
                  );
                })}
                <span className="text-[11px] text-charcoal-400 dark:text-charcoal-500 ml-1">
                  {chatPartners.length} active {chatPartners.length === 1 ? "chat" : "chats"}
                </span>
              </div>
            ) : (
              <p className="text-xs text-charcoal-400 dark:text-charcoal-500">No active conversations</p>
            )}
          </div>

          {/* Member Since */}
          <div className="px-4 pb-4 text-center">
            <p className="text-[11px] text-charcoal-400">
              Member since {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "N/A"}
            </p>
          </div>

          {/* Send Message Button */}
          <div className="px-4 pb-6">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => router.push(`/messages?user=${userData.id}`)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </div>

        </div>

        {/* Lightbox */}
        {lightboxOpen && photos.length > 0 && (
          <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 p-2 text-white/80 hover:text-white z-10">
              <X className="w-6 h-6" />
            </button>

            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium z-10">
              {currentPhotoIdx + 1} / {photos.length}
            </div>

            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentPhotoIdx((i) => Math.max(0, i - 1)); }}
                  className="absolute left-4 p-2 text-white/80 hover:text-white disabled:opacity-30 z-10"
                  disabled={currentPhotoIdx === 0}
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentPhotoIdx((i) => Math.min(photos.length - 1, i + 1)); }}
                  className="absolute right-4 p-2 text-white/80 hover:text-white disabled:opacity-30 z-10"
                  disabled={currentPhotoIdx === photos.length - 1}
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            <img
              src={mediaUrl(photos[currentPhotoIdx])}
              alt={fullName}
              className="max-h-full max-w-full object-contain p-4"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </IslamicPatternBackground>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 p-2.5 bg-charcoal-50/50 dark:bg-charcoal-800/30 rounded-xl">
      <div className="text-accent/70 shrink-0 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-charcoal-400 font-medium">{label}</p>
        <p className="text-sm text-charcoal-800 dark:text-charcoal-200 font-medium truncate">{value}</p>
      </div>
    </div>
  );
}
