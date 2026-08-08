"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MapPin, Briefcase, GraduationCap, Heart, Globe, Languages,
  Book, Edit3, Shield, Calendar, Mail, Phone, Crown, Gem,
  Lock, KeyRound, RefreshCw, CheckCircle, XCircle,
  User, Users, Star, MessageCircle, Bell, Flag,
  CreditCard, Activity, Settings, LogOut,
  ChevronRight, Camera, ExternalLink, Loader2, AlertTriangle,
  Home, Sparkles, Smile, Ruler, Baby, Moon, BookOpen,
  DollarSign, TrendingUp, Zap, Coffee, Dumbbell,
  FileText, Check, X, AtSign, Scale, UserCheck, Phone as PhoneIcon,
} from "lucide-react";
import { Button, Badge, Card, VerifiedBadge, IslamicPatternBackground } from "@/components/common";
import { ProfileImageEditor } from "@/components/profile/ProfileImageEditor";
import { useAuth } from "@/context/AuthContext";
import { profileService } from "@/services/profile";
import { notificationService } from "@/services/notifications";
import { matchService } from "@/services/matches";
import { paymentService } from "@/services/payment";
import api from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import { mediaUrl, formatDate, formatRemaining, cn, getInitials } from "@/lib/utils";

const labelize = (s?: string) => s ? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser, logout, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifCount, setNotifCount] = useState(0);
  const [favCount, setFavCount] = useState(0);
  const [twoFA, setTwoFA] = useState<any>(null);
  const [contactCredits, setContactCredits] = useState<any>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const { t } = useI18n();

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const maritalLabel = (s?: string) => {
    if (!s) return "—";
    const labels: Record<string, string> = {
      single_never: t("profile.maritalSingleNever"),
      single_previous: t("profile.maritalSinglePrevious"),
      married: t("profile.maritalMarried"),
      divorced: t("profile.maritalDivorced"),
      widowed: t("profile.maritalWidowed"),
    };
    return labels[s] || labelize(s);
  };

  const fetchAll = useCallback(async () => {
    try {
      await Promise.all([
        profileService.getMyProfile().then((r) => setProfile(r.data.profile)).catch(() => {}),
        notificationService.getUnreadCount().then((r) => setNotifCount(r.data.count || 0)).catch(() => {}),
        matchService.getFavorites().then((r) => {
          const list = r.data.favorites || r.data;
          setFavCount(Array.isArray(list) ? list.length : 0);
        }).catch(() => {}),
        api.get("/auth/2fa/status").then((r) => setTwoFA(r.data)).catch(() => {}),
        paymentService.getWallet().then((r) => setContactCredits(r.data.data?.contactCredits || null)).catch(() => {}),
      ]);
    } catch { /* all caught individually */ }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }
    fetchAll();
  }, [user, authLoading, fetchAll, router]);

  const handleEditorSave = async (blob: Blob) => {
    setEditorOpen(false);
    setPhotoUploading(true);
    try {
      const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
      await profileService.uploadPhoto(file);
      const [profileRes, userRes] = await Promise.all([
        profileService.getMyProfile(),
        api.get("/auth/me"),
      ]);
      setProfile(profileRes.data.profile);
      updateUser(userRes.data.user);
      toast.success("Photo updated");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to upload photo");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleEditorCancel = () => {
    setEditorOpen(false);
  };

  const handleSaveBio = async () => {
    try {
      await profileService.createOrUpdate({ bio: bioValue });
      setProfile((prev: any) => ({ ...prev, bio: bioValue }));
      setEditingBio(false);
      toast.success("Bio updated");
    } catch { toast.error("Failed to update bio"); }
  };

  const p = profile || {};
  const sp = (p as any).spousePreference;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";
  const initials = getInitials(user?.firstName, user?.lastName);
  const isAdmin = (user as any)?.role === "admin" || (user as any)?.adminRole;

  const pLikes = profile?.likesCount || 0;

  const isPremium = p.membership?.isPremium;
  const statCards = [
    { icon: Heart, label: t('profile.likesReceived'), value: pLikes, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10" },
    { icon: Star, label: t('profile.favorites'), value: favCount, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { icon: Bell, label: t('profile.unreadNotifications'), value: notifCount, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
    { icon: Shield, label: t('profile.verification'), value: user?.verificationStatus === "verified" ? t('profile.verified') : user?.verificationStatus === "pending" ? t('profile.pending') : t('profile.unverified'), color: user?.verificationStatus === "verified" ? "text-green-500" : "text-charcoal-500", bg: user?.verificationStatus === "verified" ? "bg-green-50 dark:bg-green-500/10" : "bg-charcoal-100 dark:bg-charcoal-700" },
  ];

  const personalFields = [
    { icon: Calendar, label: t('profile.dob'), value: user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "—" },
    { icon: Briefcase, label: t('profile.occupation'), value: p.occupation || "—" },
    { icon: GraduationCap, label: t('profile.education'), value: p.educationLevel || p.education || "—" },
    { icon: Globe, label: t('profile.nationality'), value: p.nationality || "—" },
    { icon: Languages, label: t('profile.motherTongue'), value: p.motherTongue || "—" },
    { icon: Book, label: t('profile.religiousPractice'), value: p.religiousCommitment ? labelize(p.religiousCommitment) : "—" },
    { icon: Heart, label: t('profile.maritalStatus'), value: p.maritalStatus ? maritalLabel(p.maritalStatus) : "—" },
    { icon: Users, label: t('profile.ethnicity'), value: p.ethnicity || p.ethnicBackground || "—" },
    { icon: MapPin, label: t('profile.location'), value: [p.city, p.country].filter(Boolean).join(", ") || "—" },
    { icon: Ruler, label: t('profile.height'), value: p.height ? `${p.height} cm` : "—" },
    { icon: Scale, label: t('profile.weight'), value: p.weight || "—" },
    { icon: User, label: t('profile.appearance'), value: p.appearance ? labelize(p.appearance) : "—" },
    { icon: Baby, label: t('profile.childrenStatus'), value: p.childrenStatus ? labelize(p.childrenStatus) : "—" },
    { icon: Baby, label: t('profile.childrenCount'), value: p.childrenCount || "—" },
    { icon: Baby, label: t('profile.childrenCustody'), value: p.childrenCustody ? labelize(p.childrenCustody) : "—" },
    { icon: DollarSign, label: t('profile.income'), value: p.monthlyIncomeRange ? labelize(p.monthlyIncomeRange) : "—" },
    { icon: TrendingUp, label: t('profile.employment'), value: p.employmentStatus ? labelize(p.employmentStatus) : "—" },
  ];

  const spousePrefFields = sp ? [
    { label: t('preferences.ageRange'), value: sp.preferredAgeMin != null && sp.preferredAgeMax != null ? `${sp.preferredAgeMin} - ${sp.preferredAgeMax}` : "—" },
    { label: t('preferences.maritalStatus'), value: maritalLabel(sp.preferredMaritalStatus) },
    { label: t('preferences.educationLevel'), value: labelize(sp.preferredEducationLevel) },
    { label: t('preferences.location'), value: sp.preferredLocation || "—" },
    { label: t('preferences.religiousCommitment'), value: labelize(sp.preferredReligiousCommitment) },
    { label: t('preferences.waliInvolvement'), value: labelize(sp.waliInvolvement) },
    ...(user?.gender !== "male" ? [{ label: t('preferences.polygamy'), value: labelize(sp.polygamyPreference) }] : []),
    { label: t('preferences.mahr'), value: sp.mahrExpectation || "—" },
    { label: t('preferences.genderInteraction'), value: labelize(sp.genderInteraction) },
  ] : [];

  if (authLoading) return (
    <div className="min-h-screen bg-blur-image">
      <div className="lg:pl-64 pt-14 lg:pt-0 pb-20 lg:pb-0">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-blur-image">
      <div className="lg:pl-64 pt-14 lg:pt-0 pb-20 lg:pb-0">
        <main className="p-4 sm:p-6 lg:p-8 pt-4 lg:pt-8 max-w-5xl mx-auto">
          <div className="space-y-4">
            <div className="h-52 bg-charcoal-800 rounded-3xl animate-pulse" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map((i) => <div key={i} className="h-24 bg-charcoal-800 rounded-2xl animate-pulse" />)}
            </div>
            <div className="h-96 bg-charcoal-800 rounded-3xl animate-pulse" />
          </div>
        </main>
      </div>
    </div>
  );

  return (
    <IslamicPatternBackground>
      <div className="lg:pl-64 pt-14 lg:pt-0 pb-20 lg:pb-0">
        <main className="p-4 sm:p-6 lg:p-8 pt-4 lg:pt-8 max-w-5xl mx-auto">
          <div className="space-y-6">

            {/* ─── PROFILE HEADER ─── */}
            <div className="bg-white dark:bg-charcoal-800 rounded-3xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 overflow-hidden">
              <div className="h-28 sm:h-36 relative overflow-hidden bg-charcoal-200 dark:bg-charcoal-800">
                {p.photos?.[0] ? (
                  <img src={mediaUrl(p.photos[0])} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>
              <div className="px-5 sm:px-7 pb-6 -mt-14 sm:-mt-18">
                <div className="flex flex-col sm:flex-row items-start gap-5">
                  <div className="relative group">
                    {p.membership?.isPremium && (
                      <div className={cn(
                        "absolute -inset-1.5 rounded-full",
                        p.membership.activePlan === "platinum"
                          ? "bg-gradient-to-br from-purple-400 via-fuchsia-300 to-purple-500 shadow-[0_0_24px_rgba(168,85,247,0.55)]"
                          : "bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 shadow-[0_0_24px_rgba(251,191,36,0.55)]"
                      )} />
                    )}
                    {p.membership?.isPremium && (
                      <div className={cn(
                        "absolute -top-5 left-1/2 -translate-x-1/2 z-20 drop-shadow-lg",
                        p.membership.activePlan === "platinum" ? "text-purple-300" : "text-amber-300"
                      )}>
                        {p.membership.activePlan === "platinum" ? <Gem className="w-7 h-7" /> : <Crown className="w-7 h-7" />}
                      </div>
                    )}
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-charcoal-800 shadow-elevated overflow-hidden bg-gradient-to-br from-accent to-teal-500 z-10">
                      {p.photos?.[0] ? (
                        <img src={mediaUrl(p.photos[0])} alt={fullName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center rounded-full">
                          <span className="text-4xl font-display font-bold text-white">{initials || "U"}</span>
                        </div>
                      )}
                    </div>
                    <button onClick={() => setEditorOpen(true)} disabled={photoUploading}
                      className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-accent shadow-lg flex items-center justify-center hover:bg-accent-dark text-white transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 z-20"
                      title={t('profile.changePhoto')}
                    >
                      {photoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    </button>
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">{t('profile.changePhoto')}</span>
                    {user?.verificationStatus === "verified" && (
                      <div className="absolute -top-2 -right-2 z-20"><VerifiedBadge /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-2 sm:pt-16">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h1 className="text-2xl sm:text-3xl font-display font-bold text-charcoal-900 dark:text-white truncate">{fullName}</h1>
                          {user?.gender && <Badge size="sm" variant="default">{user.gender}</Badge>}
                          {p.membership?.isPremium && (
                            <span className={`inline-flex items-center gap-1.5 pl-2.5 pr-3 py-1 rounded-full text-xs font-bold text-white shadow-md border border-white/20 ${p.membership.activePlan === "platinum" ? "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500" : "bg-gradient-to-r from-amber-400 to-yellow-500"} hover:scale-105 transition-transform`}>
                              {p.membership.activePlan === "platinum" ? <Gem className="w-3.5 h-3.5" /> : <Crown className="w-3.5 h-3.5" />}
                              {p.membership.activePlan?.charAt(0).toUpperCase() + p.membership.activePlan?.slice(1)} Member
                              <Sparkles className="w-3 h-3 opacity-80" />
                            </span>
                          )}
                        </div>
                        {user?.username && (
                          <p className="text-accent dark:text-accent flex items-center gap-1.5 text-sm font-medium">
                            <AtSign className="w-3.5 h-3.5 shrink-0" /> @{user.username}
                          </p>
                        )}
                        <p className="text-charcoal-500 dark:text-charcoal-400 flex items-center gap-1.5 mt-1 text-sm">
                          <MapPin className="w-4 h-4 shrink-0" /> {p.city || "Not set"}{p.country ? `, ${p.country}` : ""}
                        </p>
                        {editingBio ? (
                          <div className="mt-2 space-y-2">
                            <textarea value={bioValue} onChange={(e) => setBioValue(e.target.value)}
                              className="w-full text-sm rounded-xl bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-charcoal-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                              rows={2} placeholder={t('profile.writeSomething')}
                            />
                            <div className="flex gap-2">
                              <Button variant="primary" size="sm" onClick={handleSaveBio}><Check className="w-3.5 h-3.5 mr-1" /> {t('common.save')}</Button>
                              <Button variant="secondary" size="sm" onClick={() => setEditingBio(false)}><X className="w-3.5 h-3.5 mr-1" /> {t('common.cancel')}</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2 mt-0.5">
                            <p className="text-charcoal-400 dark:text-charcoal-500 text-sm italic flex-1">
                              {p.bio ? `"${p.bio.slice(0, 120)}${p.bio.length > 120 ? "..." : ""}"` : t('profile.noBio')}
                            </p>
                            <button onClick={() => { setBioValue(p.bio || ""); setEditingBio(true); }}
                              className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium text-accent hover:bg-accent/10 transition-colors"
                            >
                              <Edit3 className="w-3 h-3" /> {t('common.edit')}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link href="/profile/edit">
                          <Button variant="secondary" size="sm" className="gap-1.5">
                            <Edit3 className="w-3.5 h-3.5" /> {t('profile.editProfile')}
                          </Button>
                        </Link>
                        <button
                          onClick={() => { logout(); router.push("/login"); }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-charcoal-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                          title={t('nav.logout')}
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="hidden sm:inline">{t('nav.logout')}</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {user?.dateOfBirth && <Badge variant="gold" size="md">{t('profile.ageYrs', { age: new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear() })}</Badge>}
                      {p.maritalStatus && <Badge size="md">{maritalLabel(p.maritalStatus)}</Badge>}
                      {p.occupation && <Badge size="md">{p.occupation}</Badge>}
                      {p.religiousCommitment && <Badge size="md">{labelize(p.religiousCommitment)}</Badge>}
                      {(p as any).educationLevel && <Badge size="md">{(p as any).educationLevel}</Badge>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── MEMBERSHIP CELEBRATION BANNER ─── */}
            {p.membership?.isPremium && (
              <div className={`relative overflow-hidden rounded-3xl p-5 text-white shadow-lg ${p.membership.activePlan === "platinum" ? "bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500" : "bg-gradient-to-r from-amber-400 to-yellow-500"}`}>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                    {p.membership.activePlan === "platinum" ? <Gem className="w-6 h-6" /> : <Crown className="w-6 h-6" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-display font-bold">Congratulations!</p>
                    <p className="text-sm text-white/90">Your {p.membership.activePlan?.charAt(0).toUpperCase() + p.membership.activePlan?.slice(1)} membership is active. {p.membership.expiresAt ? `Expires in ${formatRemaining(p.membership.expiresAt, now)}.` : ""} Enjoy premium benefits.</p>
                  </div>
                  <Sparkles className="w-6 h-6 opacity-80" />
                </div>
              </div>
            )}

            {/* ─── CREDIT BALANCE BANNER ─── */}
            {contactCredits && !isPremium && (
              <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-500/10 dark:to-cyan-500/10 border border-teal-200 dark:border-teal-800/50 shadow-card">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-teal-700 dark:text-teal-300">
                      {contactCredits.credits} contact {contactCredits.credits === 1 ? "credit" : "credits"} remaining
                    </p>
                    <p className="text-xs text-teal-600/70 dark:text-teal-400/70">
                      {contactCredits.credits > 0
                        ? `${contactCredits.credits} available · ${contactCredits.usedCredits || 0} used`
                        : `All ${contactCredits.usedCredits || 0} credits used — buy more to start new conversations`}
                    </p>
                  </div>
                  <Link href="/membership">
                    <Button variant="secondary" size="sm" className="shrink-0 bg-teal-500 hover:bg-teal-600 text-white border-0">
                      <CreditCard className="w-3.5 h-3.5 mr-1" /> Buy Credits
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* ─── STATS ROW ─── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {statCards.map((stat) => (
                <div key={stat.label} className="bg-white dark:bg-charcoal-800 rounded-2xl border border-charcoal-100/50 dark:border-charcoal-700 p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-charcoal-900 dark:text-white">{stat.value}</p>
                    <p className="text-[11px] text-charcoal-500 dark:text-charcoal-400">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ─── EMPTY STATE ─── */}
            {(!profile || !profile.id) && (
              <Card>
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Edit3 className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">{t('profile.completeProfile')}</h3>
                  <p className="text-sm text-charcoal-500 dark:text-charcoal-400 max-w-md mx-auto mb-5">
                    {t('profile.completeProfileDesc')}
                  </p>
                  <Link href="/profile/edit">
                    <Button variant="primary" size="md">{t('profile.createProfile')}</Button>
                  </Link>
                </div>
              </Card>
            )}

            {/* ─── MAIN CONTENT GRID ─── */}
            {profile && profile.id && (
            <div className="grid lg:grid-cols-2 gap-6">

              {/* Profile Completion Banner */}
              {profile.isProfileComplete === false && (
                <div className="lg:col-span-2">
                  <Card>
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-charcoal-900 dark:text-white">{t('profile.notActive')}</p>
                          <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{t('profile.markComplete')}</p>
                        </div>
                      </div>
                      <Link href="/profile/edit">
                        <Button variant="primary" size="sm">{t('profile.completeNow')}</Button>
                      </Link>
                    </div>
                  </Card>
                </div>
              )}

              {/* Account Information */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-charcoal-900 dark:text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-accent" /> {t('profile.account')}
                  </h3>
                  <Crown className={`w-5 h-5 ${user?.isPremium ? "text-amber-500" : "text-charcoal-300"}`} />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-charcoal-50/50 dark:bg-charcoal-700/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <Mail className="w-4 h-4 text-accent shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{t('profile.email')}</p>
                        <p className="text-sm font-medium text-charcoal-900 dark:text-white truncate">{user?.email || "—"}</p>
                      </div>
                    </div>
                    <Badge variant={user?.email ? "success" : "default"} size="sm">{user?.email ? t('profile.verified') : t('profile.unverified')}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-charcoal-50/50 dark:bg-charcoal-700/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <Phone className="w-4 h-4 text-accent shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{t('profile.phone')}</p>
                        <p className="text-sm font-medium text-charcoal-900 dark:text-white">{user?.phone || "—"}</p>
                      </div>
                    </div>
                    <Badge variant={(user as any)?.isPhoneVerified ? "success" : "default"} size="sm">{(user as any)?.isPhoneVerified ? t('profile.verified') : t('profile.unverified')}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-charcoal-50/50 dark:bg-charcoal-700/50">
                    <div className="flex items-center gap-3">
                      <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{t('profile.membership')}</p>
                        <p className="text-sm font-medium text-charcoal-900 dark:text-white">
                          {p.membership?.isPremium
                            ? `${p.membership.activePlan?.charAt(0).toUpperCase() + p.membership.activePlan?.slice(1)} Plan · ${p.membership.expiresAt ? formatRemaining(p.membership.expiresAt, now) : ""}`
                            : t('profile.free')}
                        </p>
                      </div>
                    </div>
                    <Link href="/membership">
                      <Button variant="primary" size="sm">
                        {p.membership?.isPremium ? "Upgrade / Renew" : t('profile.upgrade')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>

              {/* Security & Settings */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-charcoal-900 dark:text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-accent" /> {t('profile.security')}
                  </h3>
                </div>
                <div className="space-y-2">
                  <Link href="/settings" className="flex items-center justify-between p-3 rounded-xl hover:bg-charcoal-50 dark:hover:bg-charcoal-700/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <KeyRound className="w-4 h-4 text-accent shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-charcoal-900 dark:text-white">{t('profile.twoFactor')}</p>
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{twoFA?.enabled ? t('profile.enabled') : t('profile.disabled')}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-charcoal-300 group-hover:text-accent transition-colors" />
                  </Link>
                  <Link href="/settings" className="flex items-center justify-between p-3 rounded-xl hover:bg-charcoal-50 dark:hover:bg-charcoal-700/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-4 h-4 text-accent shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-charcoal-900 dark:text-white">{t('profile.googleAuth')}</p>
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{twoFA?.hasSecret ? t('profile.configured') : t('profile.notSetUp')}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-charcoal-300 group-hover:text-accent transition-colors" />
                  </Link>
                  <Link href="/settings" className="flex items-center justify-between p-3 rounded-xl hover:bg-charcoal-50 dark:hover:bg-charcoal-700/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <Settings className="w-4 h-4 text-accent shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-charcoal-900 dark:text-white">{t('profile.passwordSession')}</p>
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">Change password, logout all devices</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-charcoal-300 group-hover:text-accent transition-colors" />
                  </Link>
                </div>
              </Card>

              {/* Spouse Preferences */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-charcoal-900 dark:text-white flex items-center gap-2">
                    <Heart className="w-4 h-4 text-accent" /> {t('profile.spousePreferences')}
                  </h3>
                  <Link href="/preferences"><Badge variant="gold" size="sm" className="cursor-pointer">{t('common.edit')}</Badge></Link>
                </div>
                {spousePrefFields.length > 0 ? (
                  <div className="space-y-1.5">
                    {spousePrefFields.map((f) => (
                      <div key={f.label} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-charcoal-50/50 dark:hover:bg-charcoal-700/30">
                        <span className="text-xs text-charcoal-500 dark:text-charcoal-400">{f.label}</span>
                        <span className="text-sm font-medium text-charcoal-900 dark:text-white">{f.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-charcoal-400 mb-3">{t('profile.notSet')}</p>
                    <Link href="/preferences"><Button variant="primary" size="sm">{t('profile.setPreferences')}</Button></Link>
                  </div>
                )}
              </Card>

              {/* Matchmaking */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-charcoal-900 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent" /> {t('profile.matchmaking')}
                  </h3>
                </div>
                <div className="space-y-2">
                  <Link href="/matches/likes-received" className="flex items-center justify-between p-3 rounded-xl hover:bg-charcoal-50 dark:hover:bg-charcoal-700/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-charcoal-900 dark:text-white">{t('profile.whoLikedYou')}</p>
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{t('profile.likedCount', { n: pLikes })}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-charcoal-300 group-hover:text-accent transition-colors" />
                  </Link>
                  <Link href="/favorites" className="flex items-center justify-between p-3 rounded-xl hover:bg-charcoal-50 dark:hover:bg-charcoal-700/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <Star className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-charcoal-900 dark:text-white">{t('profile.savedFavorites')}</p>
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{t('profile.savedCount', { n: favCount })}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-charcoal-300 group-hover:text-accent transition-colors" />
                  </Link>
                  <Link href="/matches" className="flex items-center justify-between p-3 rounded-xl hover:bg-charcoal-50 dark:hover:bg-charcoal-700/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-accent shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-charcoal-900 dark:text-white">{t('profile.matchSuggestions')}</p>
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">AI-powered recommendations</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-charcoal-300 group-hover:text-accent transition-colors" />
                  </Link>
                </div>
              </Card>

              {/* Activity & History */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-charcoal-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent" /> {t('profile.activity')}
                  </h3>
                </div>
                <div className="space-y-2">
                  <Link href="/messages" className="flex items-center justify-between p-3 rounded-xl hover:bg-charcoal-50 dark:hover:bg-charcoal-700/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-charcoal-900 dark:text-white">{t('profile.messages')}</p>
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">Recent conversations</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-charcoal-300 group-hover:text-accent transition-colors" />
                  </Link>
                  <Link href="/notifications" className="flex items-center justify-between p-3 rounded-xl hover:bg-charcoal-50 dark:hover:bg-charcoal-700/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-charcoal-900 dark:text-white">{t('profile.notifications')}</p>
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{t('profile.notifCount', { n: notifCount })}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-charcoal-300 group-hover:text-accent transition-colors" />
                  </Link>
                  <Link href="/settings" className="flex items-center justify-between p-3 rounded-xl hover:bg-charcoal-50 dark:hover:bg-charcoal-700/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-green-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-charcoal-900 dark:text-white">{t('profile.subscription')}</p>
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">Plan & billing history</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-charcoal-300 group-hover:text-accent transition-colors" />
                  </Link>
                </div>
              </Card>

              {/* Admin Section */}
              {isAdmin && (
                <div className="lg:col-span-2">
                  <Card>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-charcoal-900 dark:text-white flex items-center gap-2">
                        <Shield className="w-4 h-4 text-accent" /> Admin Panel
                      </h3>
                      <Badge variant="gold" size="sm">Admin</Badge>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { href: "/admin/users", icon: Users, label: "User Management", desc: "View & manage users", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
                        { href: "/admin/verifications", icon: Shield, label: "Verifications", desc: "Review ID & selfie docs", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
                        { href: "/admin/complaints", icon: Flag, label: "Complaints", desc: "Resolve disputes", color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10" },
                        { href: "/admin", icon: Activity, label: "Analytics", desc: "Dashboard & stats", color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
                      ].map((item) => (
                        <Link key={item.href} href={item.href}
                          className="flex items-start gap-3 p-4 rounded-xl hover:bg-charcoal-50 dark:hover:bg-charcoal-700/50 transition-colors border border-charcoal-100/50 dark:border-charcoal-700"
                        >
                          <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                            <item.icon className={`w-5 h-5 ${item.color}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-charcoal-900 dark:text-white">{item.label}</p>
                            <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{item.desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </Card>
                </div>
              )}
            </div>
            )}

            {/* ─── PERSONAL INFO ─── */}
            {profile && profile.id && <Card>
              <h3 className="text-base font-semibold text-charcoal-900 dark:text-white flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-accent" /> {t('profile.personalInfo')}
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {personalFields.map((item, idx) => (
                  <div key={`pf-${idx}`} className="flex items-center gap-3 p-3 rounded-xl bg-charcoal-50/50 dark:bg-charcoal-700/50">
                    <item.icon className="w-4 h-4 text-accent shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{item.label}</p>
                      <p className="text-sm font-medium text-charcoal-900 dark:text-white truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>}

            {/* ─── RELIGIOUS & LIFESTYLE ─── */}
            {profile && profile.id && <Card>
              <h3 className="text-base font-semibold text-charcoal-900 dark:text-white flex items-center gap-2 mb-4">
                <Moon className="w-4 h-4 text-accent" /> {t('profile.religiousLifestyle')}
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { icon: Moon, label: t('profile.prayerHabits'), value: p.prayerHabits ? labelize(p.prayerHabits) : "—" },
                  { icon: BookOpen, label: t('profile.quranReading'), value: p.quranReadingFrequency ? labelize(p.quranReadingFrequency) : "—" },
                  { icon: Book, label: t('profile.islamicClasses'), value: p.islamicClassesAttendance ? labelize(p.islamicClassesAttendance) : "—" },
                  { icon: Users, label: t('profile.familyInvolvement'), value: p.familyInvolvement ? labelize(p.familyInvolvement) : "—" },
                  { icon: Book, label: t('profile.islamicTradition'), value: p.islamicTradition ? (p.islamicTraditionOther ? `${labelize(p.islamicTradition)} (${p.islamicTraditionOther})` : labelize(p.islamicTradition)) : "—" },
                  { icon: Zap, label: t('profile.smoking'), value: p.smokingHabits ? labelize(p.smokingHabits) : "—" },
                  { icon: Coffee, label: t('profile.khatUsage'), value: p.khatUsage ? labelize(p.khatUsage) : "—" },
                  { icon: Dumbbell, label: t('profile.exercise'), value: p.exerciseHabits ? labelize(p.exerciseHabits) : "—" },
                  { icon: Home, label: t('profile.livingPreference'), value: p.livingPreference ? labelize(p.livingPreference) : "—" },
                  { icon: Heart, label: t('profile.marriageTimeline'), value: p.desiredMarriageTimeline ? labelize(p.desiredMarriageTimeline) : "—" },
                  { icon: Baby, label: t('profile.childrenPreference'), value: p.childrenPreference ? labelize(p.childrenPreference) : "—" },
                  { icon: Heart, label: t('profile.reasonForJoining'), value: p.reasonForJoining || "—" },
                  { icon: User, label: t('profile.personalPreference'), value: p.personalPreference ? labelize(p.personalPreference) : "—" },
                ].map((item, idx) => (
                  <div key={`rl-${idx}`} className="flex items-center gap-3 p-3 rounded-xl bg-charcoal-50/50 dark:bg-charcoal-700/50">
                    <item.icon className="w-4 h-4 text-accent shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{item.label}</p>
                      <p className="text-sm font-medium text-charcoal-900 dark:text-white truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>}

            {/* ─── WALI INFORMATION ─── */}
            {profile && profile.id && (p.hasWali || p.waliName || p.waliPhone || p.waliRelation) && <Card>
              <h3 className="text-base font-semibold text-charcoal-900 dark:text-white flex items-center gap-2 mb-4">
                <UserCheck className="w-4 h-4 text-accent" /> {t('profile.waliInfo')}
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { icon: UserCheck, label: t('profile.hasWali'), value: p.hasWali ? (p.hasWali === "yes" ? t('profile.yes') : t('profile.no')) : "—" },
                  { icon: User, label: t('profile.waliName'), value: p.waliName || "—" },
                  { icon: PhoneIcon, label: t('profile.waliPhone'), value: p.waliPhone || "—" },
                  { icon: Users, label: t('profile.waliRelation'), value: p.waliRelation ? labelize(p.waliRelation) : "—" },
                ].map((item, idx) => (
                  <div key={`wali-${idx}`} className="flex items-center gap-3 p-3 rounded-xl bg-charcoal-50/50 dark:bg-charcoal-700/50">
                    <item.icon className="w-4 h-4 text-accent shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{item.label}</p>
                      <p className="text-sm font-medium text-charcoal-900 dark:text-white truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>}

            {/* ─── ABOUT ME ─── */}
            {profile && profile.id && (p.selfDescription || (p as any).qualities?.length > 0 || (p as any).interests?.length > 0) && <Card>
              <h3 className="text-base font-semibold text-charcoal-900 dark:text-white flex items-center gap-2 mb-4">
                <Smile className="w-4 h-4 text-accent" /> {t('profile.aboutMe')}
              </h3>
              {p.selfDescription && (
                <p className="text-sm text-charcoal-600 dark:text-charcoal-300 mb-4 italic leading-relaxed">&ldquo;{p.selfDescription}&rdquo;</p>
              )}
              <div className="flex flex-wrap gap-3">
                {(p as any).qualities?.length > 0 && (
                  <div>
                    <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-1.5 font-medium">{t('profile.qualities')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(p as any).qualities.map((q: string, idx: number) => <Badge key={`q-${idx}`} size="sm">{q}</Badge>)}
                    </div>
                  </div>
                )}
                {(p as any).interests?.length > 0 && (
                  <div>
                    <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-1.5 font-medium">{t('profile.interests')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(p as any).interests.map((i: string, idx: number) => <Badge key={`int-${idx}`} size="sm" variant="gold">{i}</Badge>)}
                    </div>
                  </div>
                )}
                {(p as any).languages?.length > 0 && (
                  <div>
                    <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-1.5 font-medium">{t('profile.languages')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(p as any).languages.map((l: string, idx: number) => <Badge key={`lang-${idx}`} size="sm">{l}</Badge>)}
                    </div>
                  </div>
                )}
              </div>
            </Card>}

          </div>
        </main>
      </div>

      <ProfileImageEditor
        isOpen={editorOpen}
        currentImage={p.photos?.[0] ? mediaUrl(p.photos[0]) : undefined}
        onSave={handleEditorSave}
        onCancel={handleEditorCancel}
      />
    </IslamicPatternBackground>
  );
}
